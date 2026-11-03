import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/qa-tidslinje/page.js", import.meta.url), "utf8");
const imageRoute = readFileSync(new URL("../app/api/qa-snapshot-image/route.js", import.meta.url), "utf8");

test("QA timeline ISR fetch never selects the legacy Base64 column", () => {
  assert.match(page, /select=vecka,sida_path,sida_namn,status,screenshot_url/);
  assert.doesNotMatch(page, /select=[^\x60\n]*screenshot_b64/);
  assert.doesNotMatch(page, /row\.screenshot_b64|data:image\/png;base64/);
});

test("legacy screenshots use a separate dynamic image route", () => {
  assert.match(page, /\/api\/qa-snapshot-image\?path=/);
  assert.match(imageRoute, /dynamic = "force-dynamic"/);
  assert.match(imageRoute, /cache: "no-store"/);
  assert.match(imageRoute, /ALLOWED_PATHS\.has\(path\)/);
  assert.match(imageRoute, /Content-Type": "image\/png"/);
});
