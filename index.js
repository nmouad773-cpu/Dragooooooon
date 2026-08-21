export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetStreamUrl = url.searchParams.get("url");

    // إرجاع ملف القنوات تلقائياً عند طلب /playlist.m3u
    if (url.pathname === "/playlist.m3u") {
      const hostUrl = `${url.protocol}//${url.host}`;
      const playlistContent = `#EXTM3U
#EXTINF:-1 tvg-id="bein-news" group-title="Sports", Bein news
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/457526.ts
#EXTINF:-1 tvg-id="bein-1" group-title="Sports", Bein 1
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275074.ts
#EXTINF:-1 tvg-id="bein-2" group-title="Sports", Bein 2
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275073.ts
#EXTINF:-1 tvg-id="bein-3" group-title="Sports", Bein 3
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275072.ts
#EXTINF:-1 tvg-id="bein-4" group-title="Sports", Bein 4
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275071.ts
#EXTINF:-1 tvg-id="bein-5" group-title="Sports", Bein 5
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275070.ts
#EXTINF:-1 tvg-id="bein-6" group-title="Sports", Bein 6
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275069.ts
#EXTINF:-1 tvg-id="bein-7" group-title="Sports", Bein 7
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275068.ts
#EXTINF:-1 tvg-id="bein-8" group-title="Sports", Bein 8
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/275067.ts
#EXTINF:-1 tvg-id="bein-m1" group-title="Movies", Bein movie 1
${hostUrl}/?url=http://pro.netmos.ovh:7355/live/UDJPRCRA1L055B/Ep27yiiwbb56mjkl/10148.ts
#EXTINF:-1 tvg-id="bein-m2" group-title="Movies", Bein movie 2
${hostUrl}/?url=http://pro.netmos.ovh:7355/live/UDJPRCRA1L055B/Ep27yiiwbb56mjkl/10150.ts
#EXTINF:-1 tvg-id="8m-1" group-title="General", الثمانية 1
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/344228.ts
#EXTINF:-1 tvg-id="8m-2" group-title="General", الثمانية 2
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/348540.ts
#EXTINF:-1 tvg-id="8m-3" group-title="General", الثمانية 3
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/348538.ts
#EXTINF:-1 tvg-id="mbc2" group-title="Entertainment", Mbc 2
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/263612.ts
#EXTINF:-1 tvg-id="mbc3" group-title="Entertainment", Mbc 3
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/263579.ts
#EXTINF:-1 tvg-id="mbc4" group-title="Entertainment", Mbc 4
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/263576.ts
#EXTINF:-1 tvg-id="mbc5" group-title="Entertainment", Mbc 5
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/263574.ts
#EXTINF:-1 tvg-id="al-aoula" group-title="Moroccan", Al aoula
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/301358.ts
#EXTINF:-1 tvg-id="2m" group-title="Moroccan", 2m maroc
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/484165.ts
#EXTINF:-1 tvg-id="arryadia" group-title="Moroccan", Arryadia hd
${hostUrl}/?url=https://hattricktv2.b-cdn.net/live/11/11/301347.ts
#EXTINF:-1 tvg-id="quran" group-title="Islamic", قران الكريم
${hostUrl}/?url=http://185.191.126.127:8080//live/b0:99:d7:15:88:50/3090914536649669/413749.ts
#EXTINF:-1 tvg-id="nat-geo" group-title="Documentary", National geographic
${hostUrl}/?url=http://185.191.126.127:8080//live/b0:99:d7:15:88:50/3090914536649669/15026.ts`;

      return new Response(playlistContent, {
        headers: {
          "Content-Type": "audio/x-mpegurl; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    if (!targetStreamUrl) {
      return new Response("Dragon Live Proxy - Active", { status: 200 });
    }

    try {
      const targetUrl = new URL(targetStreamUrl);
      const newHeaders = new Headers();
      newHeaders.set("Host", "m.facebook.com");
      newHeaders.set("User-Agent", "Mozilla/5.0 (Linux; Android 10; FB_IAB/FB4A)");
      newHeaders.set("Accept", "*/*");

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        redirect: "follow"
      });

      const response = await fetch(proxyRequest);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

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
