// Extraherar och validerar ett YouTube-video-id ur en godtycklig, opålitlig
// URL-sträng. Returnerar ALDRIG den råa URL:en — bara ett verifierat
// 11-tecken-id (eller null) — eftersom det är den enda formen som är säker
// att stoppa in i en <iframe src>. Att bygga en iframe-src direkt ur en
// oparsad, opålitlig sträng vore en öppen XSS-/redirect-yta (t.ex.
// "javascript:..." eller en helt annan domän maskerad som en YouTube-länk).
//
// Körs isomorft: både server-side (app/api/agent/submit, artikelsidans SSR-
// rendering) och client-side (app/skicka-in/SkickaInClient.js) — ren ESM,
// bara webbstandard-API:er (URL, URLSearchParams), inga Node-specifika
// beroenden.
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extraheraYoutubeId(input) {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  // Ett bart 11-teckens-id skickat direkt (t.ex. från en tidigare validerad
  // källa) — inget att parsa.
  if (YOUTUBE_ID_RE.test(raw)) return raw;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") || "";
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }
    const m = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/);
    if (m) {
      return YOUTUBE_ID_RE.test(m[2]) ? m[2] : null;
    }
  }

  return null;
}

// Bygger den faktiska embed-URL:en. Tar bara ett REDAN validerat id (kallaren
// ansvarar för att ha kört extraheraYoutubeId() eller motsvarande regex-koll
// direkt innan) — youtube-nocookie.com-domänen sätter inte spårningscookies
// förrän besökaren faktiskt spelar upp videon.
export function youtubeEmbedUrl(videoId) {
  if (!YOUTUBE_ID_RE.test(videoId || "")) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function arGiltigtYoutubeId(id) {
  return typeof id === "string" && YOUTUBE_ID_RE.test(id);
}
