import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/arkiv/page.js", import.meta.url), "utf8");
const client = readFileSync(new URL("../app/arkiv/ArkivClient.js", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/revalidate-arkiv/route.js", import.meta.url), "utf8");
const publish = readFileSync(new URL("../app/lib/inlamningDb.js", import.meta.url), "utf8");
const agentPublish = readFileSync(new URL("../app/api/agent/submit/route.js", import.meta.url), "utf8");

test("archive uses a long ISR fallback but still revalidates on publication", () => {
  assert.match(page, /export const revalidate = 86400/);
  assert.match(page, /next: \{ revalidate: 86400 \}/);
  assert.match(publish, /revalidatePath\("\/arkiv"\)/);
  assert.match(agentPublish, /revalidatePath\("\/arkiv"\)/);
});

test("frequently changing counts do not force archive ISR regeneration", () => {
  assert.doesNotMatch(page, /fetchRoster|fetchKommentarer|voteCounts=|commentCounts=/);
  assert.match(client, /rest\/v1\/roster\?select=artikel_id,rod/);
  assert.match(client, /rest\/v1\/kommentarer\?select=artikel_id/);
  assert.match(client, /setVoteCounts\(nextVotes\)/);
  assert.match(client, /setCommentCounts\(nextComments\)/);
});

test("anonymous requests cannot invalidate archive cache", () => {
  assert.match(route, /REVALIDATE_ARCHIVE_SECRET/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /status: 401/);
});
