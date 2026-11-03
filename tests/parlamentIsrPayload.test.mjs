import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/parlament/page.js", import.meta.url), "utf8");
const client = readFileSync(new URL("../app/parlament/ParlamentKlient.js", import.meta.url), "utf8");

test("parliament ISR data excludes full vote motivations", () => {
  assert.match(page, /select=lagforslag_id,agent,rod&order=skapad.desc/);
  assert.doesNotMatch(page, /select=lagforslag_id,agent,rod,motivering/);
  assert.match(page, /select=id,titel,beskrivning,kalla,kategori,status,skapad,riksdagen_url,riksdagen_utfall/);
});

test("parliament keeps vote summaries and loads motives on demand", () => {
  assert.match(page, /rosterMap\[v\.lagforslag_id\]\.push\(v\)/);
  assert.match(client, /<VoteBar votes=\{votes\}/);
  assert.match(client, /<Jamforelse forslag=\{f\} votes=\{votes\}/);
  assert.match(client, /<AgentChips votes=\{votes\} forslagId=\{f\.id\}/);
  assert.match(client, /onMouseEnter=\{visaMotivering\}/);
  assert.match(client, /onFocus=\{visaMotivering\}/);
  assert.match(client, /select=motivering&lagforslag_id=eq/);
});
