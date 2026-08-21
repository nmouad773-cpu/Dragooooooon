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

    if (pathname === "/" || pathname === "/index.html") {
      return new Response("Dragon Live DASH MPD Engine Active", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders }
      });
    }

    // 1. القائمة الرئيسية بتنسيق M3U تحتوي على روابط .mpd لكل قناة
    if (pathname === "/playlist.m3u" || pathname === "/playlist.mpd") {
      let playlistContent = `#EXTM3U\n`;
      for (const key in channelMap) {
        playlistContent += `#EXTINF:-1 tvg-id="${key}" group-title="Dragon Live", ${key.toUpperCase()}\n`;
        playlistContent += `${url.origin}/dash/${key}/manifest.mpd\n`;
      }
      return new Response(playlistContent, {
        headers: {
          "Content-Type": "audio/x-mpegurl; charset=utf-8",
          ...corsHeaders
        }
      });
    }

    // 2. توليد Dynamic DASH Manifest (.mpd) بتنسيق خوادم Facebook Video
    if (pathname.endsWith("/manifest.mpd")) {
      const parts = pathname.split("/");
      const channelKey = parts[2];

      const mpdXml = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"
     xmlns:fb="urn:facebook:dash"
     profiles="urn:mpeg:dash:profile:isoff-live:2011"
     type="dynamic"
     minimumUpdatePeriod="PT2S"
     minBufferTime="PT1S"
     timeShiftBufferDepth="PT30S">
  <Period id="0" start="PT0S">
    <AdaptationSet id="0" contentType="video" mimeType="video/mp4" segmentAlignment="true" startWithSAP="1">
      <Representation id="fb_hd" bandwidth="2000000" codecs="avc1.4d401f" width="1280" height="720">
        <SegmentTemplate timescale="1000" 
                         initialization="${url.origin}/dash/${channelKey}/init.mp4" 
                         media="${url.origin}/dash/${channelKey}/segment_$Number$.m4s">
          <SegmentTimeline>
            <S t="0" d="2000" r="-1" />
          </SegmentTimeline>
        </SegmentTemplate>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

      return new Response(mpdXml, {
        headers: {
          "Content-Type": "application/dash+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-FB-Debug": "True",
          "X-FB-Video-Codec": "avc1.4d401f",
          ...corsHeaders
        }
      });
    }

    // 3. معالجة وتمرير قطع الميديا (Segments) عبر بروكسي حزم Facebook
    if (pathname.includes("/dash/")) {
      const parts = pathname.split("/");
      const channelKey = parts[2];
      const targetStreamUrl = channelMap[channelKey] || url.searchParams.get("url");

      if (!targetStreamUrl) {
        return new Response("Channel Not Found", { status: 404, headers: corsHeaders });
      }

      try {
        const targetUrl = new URL(targetStreamUrl);

        const upstreamResponse = await fetch(targetStreamUrl, {
          method: "GET",
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
            "Accept": "*/*",
            "Connection": "keep-alive"
          },
          cf: {
            cacheTtlByStatus: { "200-299": 0 },
            cacheEverything: false
          }
        });

        const newHeaders = new Headers();
        // تمويه نوع الميديا بحسب المقطع المطلق من المشغل
        if (pathname.endsWith("init.mp4")) {
          newHeaders.set("Content-Type", "video/mp4");
        } else {
          newHeaders.set("Content-Type", "video/iso.segment");
        }

        newHeaders.set("Accept-Ranges", "bytes");
        newHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        newHeaders.set("Pragma", "no-cache");
        newHeaders.set("Access-Control-Allow-Origin", "*");
        newHeaders.set("X-FB-Video-Codec", "avc1.4d401f");

        return new Response(upstreamResponse.body, {
          status: 200,
          headers: newHeaders
        });

      } catch (err) {
        return new Response("Stream Error: " + err.message, {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
