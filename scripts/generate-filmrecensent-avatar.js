// Engångsskript: genererar en AI-avatar för Filmrecensenten via Pollinations.ai
// och sparar den till public/avatarer/filmrecensenten.png.
// Körs bara en gång via en temporär workflow_dispatch-only GitHub Action
// (samma mönster som podd-avatarernas migrering, se CLAUDE.md ✅94) eftersom
// Pollinations blockeras från utvecklingssandboxen men GitHub-hostade runners
// har obegränsad internetåtkomst. Skript + workflow tas bort efter körning.

const fs = require("fs");
const path = require("path");
const https = require("https");

const PROMPT =
  "Portrait of a distinguished film critic character, middle-aged, wearing round glasses and a dark blazer, " +
  "sitting in a vintage cinema seat holding a small notebook, warm cinema screen glow in the background, " +
  "film reels and popcorn silhouettes, dramatic amber and red lighting, digital illustration, detailed, " +
  "cinematic atmosphere";

function pollinationsUrl(prompt, w = 768, h = 768) {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 99999) + 1;
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;
}

function download(url, destPath, attempt = 1) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location, destPath, attempt).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
          const isJpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
          if (!isPng && !isJpg) {
            return reject(new Error(`Ogiltig bild (${buf.length} bytes, inget PNG/JPEG-magic-nummer)`));
          }
          if (buf.length < 1000) {
            return reject(new Error(`För liten bild (${buf.length} bytes)`));
          }
          fs.writeFileSync(destPath, buf);
          resolve(buf.length);
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const dest = path.join(__dirname, "..", "public", "avatarer", "filmrecensenten.png");
  const maxForsok = 3;
  for (let forsok = 1; forsok <= maxForsok; forsok++) {
    try {
      const url = pollinationsUrl(PROMPT);
      console.log(`Försök ${forsok}/${maxForsok}: ${url}`);
      const bytes = await download(url, dest);
      console.log(`OK — sparade ${bytes} bytes till ${dest}`);
      return;
    } catch (err) {
      console.error(`Försök ${forsok} misslyckades: ${err.message}`);
      if (forsok === maxForsok) {
        console.error("Alla försök misslyckades.");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
