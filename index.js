const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 9000;

// خريطة القنوات المباشرة
const channelMap = {
  "bein-news": "https://hattricktv2.b-cdn.net/live/11/11/457526.ts",
  "bein-1": "https://hattricktv2.b-cdn.net/live/11/11/275074.ts",
  "bein-2": "https://hattricktv2.b-cdn.net/live/11/11/275073.ts",
  "bein-3": "https://hattricktv2.b-cdn.net/live/11/11/275072.ts",
  "bein-4": "https://hattricktv2.b-cdn.net/live/11/11/275071.ts",
  "bein-5": "https://hattricktv2.b-cdn.net/live/11/11/275070.ts",
  "bein-6": "https://hattricktv2.b-cdn.net/live/11/11/275069.ts",
  "bein-7": "https://hattricktv2.b-cdn.net/live/11/11/275068.ts",
  "bein-8": "https://hattricktv2.b-cdn.net/live/11/11/275067.ts",
  "bein-m1": "http://pro.netmos.ovh:7355/live/UDJPRCRA1L055B/Ep27yiiwbb56mjkl/10148.ts",
  "bein-m2": "http://pro.netmos.ovh:7355/live/UDJPRCRA1L055B/Ep27yiiwbb56mjkl/10150.ts",
  "8m-1": "https://hattricktv2.b-cdn.net/live/11/11/344228.ts",
  "8m-2": "https://hattricktv2.b-cdn.net/live/11/11/348540.ts",
  "8m-3": "https://hattricktv2.b-cdn.net/live/11/11/348538.ts",
  "mbc2": "https://hattricktv2.b-cdn.net/live/11/11/263612.ts",
  "mbc3": "https://hattricktv2.b-cdn.net/live/11/11/263579.ts",
  "mbc4": "https://hattricktv2.b-cdn.net/live/11/11/263576.ts",
  "mbc5": "https://hattricktv2.b-cdn.net/live/11/11/263574.ts",
  "al-aoula": "https://hattricktv2.b-cdn.net/live/11/11/301358.ts",
  "2m": "https://hattricktv2.b-cdn.net/live/11/11/484165.ts",
  "arryadia": "https://hattricktv2.b-cdn.net/live/11/11/301347.ts",
  "quran": "http://185.191.126.127:8080//live/b0:99:d7:15:88:50/3090914536649669/413749.ts",
  "nat-geo": "http://185.191.126.127:8080//live/b0:99:d7:15:88:50/3090914536649669/15026.ts"
};

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("Dragon Live Proxy Server - Active (*6 Ready)");
});

// 1. توليد قائمة M3U بروابط مموهة لصيغة mp4
app.get("/playlist.m3u", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const hostUrl = `${protocol}://${req.get("host")}`;
  
  let playlistContent = `#EXTM3U\n`;
  for (const key in channelMap) {
    playlistContent += `#EXTINF:-1 tvg-id="${key}" group-title="Dragon Live", ${key.toUpperCase()}\n`;
    playlistContent += `${hostUrl}/video/${key}.mp4\n`;
  }
  
  res.setHeader("Content-Type", "audio/x-mpegurl; charset=utf-8");
  res.send(playlistContent);
});

// 2. تمرير الميديا مع محاكاة كاملة لفيسبوك
app.get("/video/:channel.mp4", async (req, res) => {
  const channelKey = req.params.channel;
  const targetStreamUrl = channelMap[channelKey] || req.query.url;

  if (!targetStreamUrl) {
    return res.status(404).send("Channel Not Found");
  }

  try {
    const targetUrl = new URL(targetStreamUrl);
    
    const response = await axios({
      method: "get",
      url: targetStreamUrl,
      responseType: "stream",
      headers: {
        "User-Agent": "FBAN/FB4A;FBAV/420.0.0.32.62;FBBV/503848123;FBDM/{density=3.0,width=1080,height=2280};FBLC/ar_AR;FBCR/Inwi;FBMF/Xiaomi;FBBD/Redmi;",
        "Referer": "https://www.facebook.com/watch/",
        "Origin": "https://www.facebook.com",
        "Host": targetUrl.host,
        "X-FB-HTTP-Engine": "Liger",
        "X-FB-Client-IP": "True",
        "X-FB-Server-Cluster": "True",
        "X-FB-Connection-Type": "CELLULAR.LTE",
        "X-FB-Net-HNI": "60402",
        "X-FB-SIM-HNI": "60402",
        "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.7,en;q=0.3",
        "Connection": "keep-alive"
      },
      timeout: 20000
    });

    // إيهام شركات الاتصال بأن المحتوى مجرد أجزاء ميديا صغيرة (Chunks) قادمة من FB
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    req.on("close", () => {
      if (response.data) response.data.destroy();
    });

    response.data.on("error", () => {
      if (!res.headersSent) res.status(500).send("Stream Read Error");
    });

    response.data.pipe(res);

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).send("Stream Proxy Error: " + err.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Dragon Relay Proxy active on port ${PORT}`);
});
