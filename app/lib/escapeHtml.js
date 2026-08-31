export function escapeHtml(str) {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decodar grundläggande HTML-entiteter (&amp; &#39; &#x27; m.fl.) i text hämtad från extern HTML. */
export function decodeHtmlEntities(str) {
  return (str ?? "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (Number.isNaN(code)) return match;
      try { return String.fromCodePoint(code); } catch { return match; }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}
