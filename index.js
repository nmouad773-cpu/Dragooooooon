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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. رابط القائمة المباشرة للمشغل
    if (pathname === "/playlist.m3u" || pathname === "/playlist.m3u8") {
      let playlist = `#EXTM3U\n`;
      for (const key in channelMap) {
        playlist += `#EXTINF:-1 tvg-id="${key}" group-title="Dragon Live", ${key.toUpperCase()}\n`;
        playlist += `${url.origin}/fb-cdn/live/${key}/video.mp4\n`;
      }
      return new Response(playlist, {
        headers: {
          "Content-Type": "audio/x-mpegurl; charset=utf-8",
          ...corsHeaders
        }
      });
    }

    // 2. محرك التمويه المتقدم لـ *6 (Facebook CDN Engine)
    if (pathname.includes("/fb-cdn/live/")) {
      const parts = pathname.split("/");
      const channelKey = parts[3];
      const targetUrl = channelMap[channelKey];

      if (!targetUrl) {
        return new Response("Channel Not Found", { status: 404, headers: corsHeaders });
      }

      try {
        const upstream = await fetch(targetUrl, {
          method: "GET",
          headers: {
            "User-Agent": "FBAN/FB4A;FBAV/410.0.0.25.116;FBBV/480000000;FBDM/{density=3.0,width=1080,height=2340};FBLC/ar_AR;FBCR/Inwi;FBMF/Samsung;FBBD/samsung;",
            "Referer": "https://www.facebook.com/",
            "Origin": "https://www.facebook.com",
            "X-FB-HTTP-Engine": "Liger",
            "X-FB-Client-IP": "True",
            "X-FB-Server-Cluster": "True",
            "X-FB-Connection-Type": "CELLULAR.LTE",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
          }
        });

        // إنشاء هيدرات استجابة تحاكي خوادم Facebook CDN الرسمية
        const responseHeaders = new Headers();
        responseHeaders.set("Content-Type", "video/mp4");
        responseHeaders.set("Content-Disposition", "inline; filename=\"video.mp4\"");
        responseHeaders.set("Accept-Ranges", "bytes");
        responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        responseHeaders.set("Pragma", "no-cache");
        responseHeaders.set("X-FB-Debug", "True");
        responseHeaders.set("Access-Control-Allow-Origin", "*");

        return new Response(upstream.body, {
          status: 200,
          headers: responseHeaders
        });

      } catch (err) {
        return new Response("Bypass Error: " + err.message, { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Dragon Live Proxy Active", { status: 200, headers: corsHeaders });
  }
};
