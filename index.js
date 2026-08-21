export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostUrl = `${url.protocol}//${url.host}`;

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

    // معالجة طلبات OPTIONS لفك حظر CORS كلياً
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // 1. توليد قائمة M3U بروابط مموهة لصيغة mp4 لتجاوز الفلترة
    if (url.pathname === "/playlist.m3u") {
      let playlistContent = `#EXTM3U\n`;
      for (const key in channelMap) {
        playlistContent += `#EXTINF:-1 tvg-id="${key}" group-title="Dragon Live", ${key.toUpperCase()}\n`;
        playlistContent += `${hostUrl}/video/${key}.mp4\n`;
      }

      return new Response(playlistContent, {
        headers: {
          "Content-Type": "audio/x-mpegurl; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 2. التقاط معرف القناة وتحديد رابط المصدر الأصلي
    let targetStreamUrl = null;

    if (url.pathname.startsWith("/video/")) {
      const channelKey = url.pathname.replace("/video/", "").replace(".mp4", "").replace(".ts", "");
      targetStreamUrl = channelMap[channelKey];
    } else {
      targetStreamUrl = url.searchParams.get("url");
    }

    if (!targetStreamUrl) {
      return new Response("Dragon Live Proxy - *6 Active", { status: 200 });
    }

    try {
      const targetUrl = new URL(targetStreamUrl);
      const fbHeaders = new Headers();

      // **أقوى خلطة هيدرات لانتحال سيرفرات فيسبوك بالكامل**
      fbHeaders.set("User-Agent", "FBAN/FB4A;FBAV/420.0.0.32.62;FBBV/503848123;FBDM/{density=3.0,width=1080,height=2280};FBLC/ar_AR;FBCR/Inwi;FBMF/Xiaomi;FBBD/Redmi;");
      fbHeaders.set("Referer", "https://www.facebook.com/watch/");
      fbHeaders.set("Origin", "https://www.facebook.com");
      fbHeaders.set("Host", targetUrl.host);
      fbHeaders.set("X-FB-HTTP-Engine", "Liger");
      fbHeaders.set("X-FB-Net-HNI", "60402"); // Inwi / Telecom MNC
      fbHeaders.set("X-FB-SIM-HNI", "60402");
      fbHeaders.set("Accept", "video/webm,video/ogg,video/*;q=0.9,application/ogg,*/*;q=0.8");
      fbHeaders.set("Accept-Language", "ar,en-US;q=0.7,en;q=0.3");

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: fbHeaders,
        redirect: "follow"
      });

      const response = await fetch(proxyRequest);
      const responseHeaders = new Headers(response.headers);

      // التظاهر بأن الاستجابة قادمة كبث ميديا من فيسبوك
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
      responseHeaders.set("Content-Type", "video/mp2t");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
};
