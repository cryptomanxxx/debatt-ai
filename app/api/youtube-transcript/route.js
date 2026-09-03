// Node.js runtime — behöver mer minne för att parsa YouTube-sidor
const SECRET = process.env.YOUTUBE_PROXY_SECRET;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("video_id");
  const secret = searchParams.get("secret") || req.headers.get("x-proxy-secret");

  if (!SECRET || secret !== SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return Response.json({ error: "Ogiltigt video_id" }, { status: 400 });
  }

  try {
    const transcript = await fetchTranscript(videoId);
    return Response.json({ transcript, video_id: videoId });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}

async function fetchTranscript(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
      // Utan en tidigare cookie-historik serverar YouTube ofta en förenklad
      // "godkänn cookies"-sida till serverside-anrop (t.ex. från Vercels
      // datacenter-IP) istället för den riktiga spelarsidan — giltig JSON,
      // men utan captions-fältet, vilket gav "Inga undertexter tillgängliga"
      // för videor som faktiskt HAR undertexter (verifierat manuellt:
      // videon visar CC-knappen på youtube.com). CONSENT-cookien är ett
      // väldokumenterat sätt (används av bl.a. yt-dlp) att förbikoppla
      // samtyckessidan och få den fullständiga spelarsidan direkt.
      "Cookie": "CONSENT=YES+1",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`YouTube sida ${res.status}`);
  const html = await res.text();

  // Extrahera ytInitialPlayerResponse med brace-counting (robust mot stora JSON)
  const marker = "ytInitialPlayerResponse = ";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) throw new Error("Hittade inte player response");
  const jsonStart = startIdx + marker.length;

  let depth = 0, end = jsonStart;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === jsonStart) throw new Error("Kunde inte avgränsa JSON");

  let playerResponse;
  try {
    playerResponse = JSON.parse(html.slice(jsonStart, end));
  } catch {
    throw new Error("Ogiltig JSON i player response");
  }

  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) {
    // Konsekvent "Inga undertexter tillgängliga" på videor som VERIFIERAT har
    // undertexter (CC-knappen syns på youtube.com) — CONSENT-cookien löste
    // det inte ensam. playabilityStatus är YouTubes egna fält för VARFÖR en
    // spelare inte fungerar normalt (t.ex. "LOGIN_REQUIRED", "AGE_CHECK
    // _REQUIRED", "ERROR") — hade aldrig loggats innan, så felet gick inte
    // att skilja från ett genuint saknat-undertexter-fall utan att gissa.
    const status = playerResponse?.playabilityStatus?.status || "okänd";
    const reason = playerResponse?.playabilityStatus?.reason || "";
    const harCaptionsNyckel = playerResponse?.captions ? "ja" : "nej";
    throw new Error(
      `Inga undertexter tillgängliga (playability: ${status}${reason ? " — " + reason : ""}, captions-nyckel finns: ${harCaptionsNyckel})`
    );
  }

  // Prioritera svenska, sedan engelska
  let track = null;
  for (const lang of ["sv", "en", "en-US", "en-GB"]) {
    track = tracks.find(t => t.languageCode === lang || t.languageCode?.startsWith(lang.split("-")[0]));
    if (track) break;
  }
  if (!track) track = tracks[0];

  const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!transcriptRes.ok) throw new Error(`Transkript-hämtning ${transcriptRes.status}`);

  const data = await transcriptRes.json();
  const text = (data?.events ?? [])
    .filter(e => e.segs)
    .flatMap(e => e.segs.map(s => s.utf8 ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) throw new Error("Tomt transkript");
  return text;
}
