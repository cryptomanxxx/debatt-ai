import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { startVisiblePolling } from "../app/lib/visiblePolling.mjs";

const flush = () => new Promise(resolve => setImmediate(resolve));

test("hidden tabs make no calls; return fetches once; slow calls never overlap; cleanup stops polling", async () => {
  let listener, tick, cleared = false, calls = 0, release;
  const document = {
    visibilityState: "hidden",
    addEventListener(type, fn) { listener = fn; },
    removeEventListener(type, fn) { assert.equal(fn, listener); listener = null; },
  };
  const stop = startVisiblePolling({
    document,
    run: () => { calls++; return new Promise(resolve => { release = resolve; }); },
    setIntervalFn(fn, ms) { assert.equal(ms, 30000); tick = fn; return 7; },
    clearIntervalFn(id) { assert.equal(id, 7); cleared = true; },
  });
  tick(); await flush(); assert.equal(calls, 0);
  document.visibilityState = "visible"; listener(); await flush();
  tick(); tick(); await flush(); assert.equal(calls, 1);
  release(); await flush(); tick(); await flush(); assert.equal(calls, 2);
  release(); await flush();
  document.visibilityState = "hidden"; tick(); await flush(); assert.equal(calls, 2);
  stop(); assert.equal(listener, null); assert.ok(cleared);
  tick(); await flush(); assert.equal(calls, 2);
});

test("poller recovers after a failed request", async () => {
  let tick, calls = 0;
  const stop = startVisiblePolling({
    document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
    run: async () => { calls++; throw new Error("offline"); },
    setIntervalFn(fn) { tick = fn; }, clearIntervalFn() {},
  });
  await flush(); tick(); await flush(); assert.equal(calls, 2); stop();
});

// Exercise the actual route with Next adapters supplied by the test.
// This verifies local concurrency/failure behaviour, not Vercel distribution.
async function loadRoute(builder) {
  const source = await readFile(new URL("../app/api/aktivitet/route.js", import.meta.url), "utf8");
  let now = 0, cacheConfig;
  const context = vm.createContext({
    NextResponse: { json: (body, options) => ({ body, headers: options.headers }) },
    unstable_cache(fn, keys, options) { cacheConfig = { keys, options }; return fn; },
    hamtaAktivitetHandelser: builder,
    Date: class extends Date { static now() { return now; } },
  });
  vm.runInContext(source.replace(/^import .*;$/gm, "").replace(/^export /gm, "") + "\n globalThis.get = GET;", context);
  return { get: context.get, advance: ms => { now += ms; }, config: () => cacheConfig };
}

async function loadFeed(fetch) {
  const source = await readFile(new URL("../app/lib/aktivitetFeed.js", import.meta.url), "utf8");
  const context = vm.createContext({ fetch, process: { env: {} } });
  vm.runInContext(source.replace(/^export /gm, "") + "\n globalThis.build = hamtaAktivitetHandelser;", context);
  return context.build;
}

test("a failed source cannot replace the cached feed, including sources with optional fallbacks", async () => {
  for (const table of ["artiklar", "bribe_offers", "oraklet_lasningar"]) {
    for (const failure of ["network", "http", "shape", "json"]) {
      let failing = false, sourceCalls = 0;
      const build = await loadFeed(async url => {
        sourceCalls++;
        const selected = failing && url.includes("/" + table + "?");
        if (selected && failure === "network") throw new Error("offline");
        return {
          ok: !(selected && failure === "http"), status: selected ? 503 : 200,
          json: async () => {
            if (selected && failure === "json") throw new Error("invalid JSON");
            if (selected && failure === "shape") return { message: "not rows" };
            return url.includes("/artiklar?")
              ? [{ id: 1, rubrik: "Test", forfattare: "AI", kalla: "ai", skapad: "2026-10-06T09:00:00Z" }]
              : [];
          },
        };
      });
      const route = await loadRoute(options => {
        assert.equal(options.requireComplete, true);
        return build(options);
      });
      const first = await route.get();
      assert.equal(first.body.length, 1);
      route.advance(60000); failing = true;
      const failed = await route.get();
      assert.deepEqual(failed.body, first.body, table + "/" + failure);
      assert.equal(failed.headers["Cache-Control"], "no-store");
      failing = false;
      await route.get();
      assert.equal(sourceCalls, 90, "failed builds must retry without a fresh local cache");
    }
  }
});

test("empty successful sources are valid; archive callers retain partial-source tolerance", async () => {
  const empty = await loadFeed(async () => ({ ok: true, json: async () => [] }));
  assert.equal((await empty({ requireComplete: true })).length, 0);
  const partial = await loadFeed(async url => {
    if (url.includes("/bribe_offers?")) throw new Error("offline");
    return { ok: true, json: async () => [] };
  });
  assert.equal((await partial()).length, 0);
  await assert.rejects(partial({ requireComplete: true }), /inte hämtas komplett/);
});

test("100 concurrent activity requests share one build, preserve article slots, then refresh at 60s", async () => {
  let builds = 0, release;
  const rows = Array.from({ length: 12 }, (_, i) => ({
    typ: i >= 9 ? "artikel-ai" : "bors", skapad: new Date(12000 - i * 1000).toISOString(), text: String(i),
  }));
  const route = await loadRoute(async () => { builds++; await new Promise(resolve => { release = resolve; }); return rows; });
  const calls = Array.from({ length: 100 }, () => route.get());
  assert.equal(builds, 1); release();
  const responses = await Promise.all(calls);
  assert.equal(responses[0].body.length, 10);
  assert.equal(responses[0].body.filter(r => r.typ === "artikel-ai").length, 3);
  assert.ok(responses.every(r => JSON.stringify(r.body) === JSON.stringify(responses[0].body)));
  route.advance(59999); await route.get(); assert.equal(builds, 1);
  route.advance(1); const next = route.get(); assert.equal(builds, 2); release(); await next;
  assert.equal(route.config().options.revalidate, 60);
});

test("activity failure retains last good feed, is not CDN cached, and next call retries", async () => {
  let calls = 0;
  const route = await loadRoute(async () => {
    if (++calls === 2) throw new Error("database offline");
    return [{ typ: "artikel-ai", skapad: "2026-10-06T09:00:00Z" }];
  });
  const first = await route.get(); route.advance(60000);
  const failed = await route.get();
  assert.deepEqual(failed.body, first.body);
  assert.equal(failed.headers["Cache-Control"], "no-store");
  await route.get(); assert.equal(calls, 3);
});

test("article count uses HEAD and exact count beyond PostgREST row limit; never reads a response body", async () => {
  const source = await readFile(new URL("../app/lib/startsidaData.js", import.meta.url), "utf8");
  const fn = source.slice(source.indexOf("async function sbCount()"), source.indexOf("async function fetchSenasteChattDebatt"));
  let total = "0-0/2033", calls = 0;
  const context = vm.createContext({
    SB_URL: "https://example.invalid", SB_KEY: "test",
    fetch: async (url, options) => {
      calls++; assert.equal(options.method, "HEAD"); assert.equal(options.headers.Prefer, "count=exact");
      assert.ok(url.endsWith("?select=id&limit=1"));
      return { ok: true, headers: { get: () => total }, json: () => { throw new Error("body downloaded"); } };
    },
  });
  vm.runInContext(fn + "\nglobalThis.count = sbCount;", context);
  assert.equal(await context.count(), 2033);
  total = "*/0"; assert.equal(await context.count(), 0);
  total = "0-0/*"; await assert.rejects(context.count(), /Artikelantal saknas/);
  assert.equal(calls, 3);
});

test("startsida data bundles every widget and flags failed sources instead of caching them as empty", async () => {
  const source = (await readFile(new URL("../app/lib/startsidaData.js", import.meta.url), "utf8"))
    .replace("export async function hamtaStartsidaData", "async function hamtaStartsidaData")
    .replace(/^const SB_(URL|KEY) = .*$/gm, "");
  let failTable = null, calls = 0;
  const context = vm.createContext({
    SB_URL: "https://example.invalid", SB_KEY: "test", URLSearchParams, Date, Object, Promise,
    fetch: async (url) => {
      calls++;
      const ok = !(failTable && url.includes(`/rest/v1/${failTable}?`));
      return {
        ok, status: ok ? 200 : 500,
        headers: { get: () => "0-0/42" },
        json: async () => (url.includes("roster?") ? [{ artikel_id: 1, rod: "ja" }, { artikel_id: 1, rod: "nej" }] : []),
      };
    },
  });
  vm.runInContext(source + "\nglobalThis.hamta = hamtaStartsidaData;", context);
  const { data, ofullstandig } = await context.hamta();
  assert.equal(ofullstandig, 0);
  assert.equal(data.articleCount, 42);
  assert.deepEqual(JSON.parse(JSON.stringify(data.roster)), { voteCounts: { 1: { ja: 1, nej: 1 } }, totalRoster: 2 });
  assert.equal(Object.keys(data).length, 20);
  const okCalls = calls;
  failTable = "chatt_debatter";
  const partial = await context.hamta();
  assert.equal(partial.ofullstandig, 1);
  assert.equal(partial.data.senasteChattDebatt, null);
  assert.ok(okCalls > 0);
});
