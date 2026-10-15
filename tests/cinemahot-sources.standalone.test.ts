// The source adapters must read public article metadata, without guessing a year from a short date
// or executing the scripts that carry it. The local pages reproduce the observed publisher formats.
import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { parseLooseDate } from "@aihot/backend/sources/dates";
import { fetchWebList, fromHtml } from "@aihot/backend/sources/web-list";
import type { SourceRow } from "@aihot/backend/sources/types";

const data = (post: object) => `<script>window._data = '${Buffer.from(JSON.stringify({ post })).toString("base64url")}';</script>`;
const pages: Record<string, string> = {
  "/": `<ul class="news-list"><li><a class="title" href="/stream/156453?from=homeitem">布光实践</a></li><li><a class="title" href="/morning/articles/280541">色彩工作流</a></li><li><a class="title" href="/jobs/123">招聘</a></li></ul>`,
  "/stream/156453": `<h1 class="title">布光实践</h1><div class="date-info">9月29日 19:10</div><script>var stream_id = 281154; throw new Error('never execute');</script>`,
  "/morning/articles/281154": data({ id: 281154, title: "布光实践", created_at: "2026-09-29T19:10:00+08:00", status: "final", access_modifier: "all_public" }),
  "/morning/articles/280541": data({ id: 280541, title: "色彩工作流", created_at: "2026-02-02T17:20:56.000+08:00", status: "final", access_modifier: "all_public" }),
};
const server = http.createServer((req, res) => { const page = pages[new URL(req.url!, "http://fixture").pathname]; res.writeHead(page ? 200 : 404, { "content-type": "text/html" }); res.end(page ?? "missing"); });
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const previous = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
after(async () => { config.allowPrivateNetworkFetch = previous; await new Promise<void>(resolve => server.close(() => resolve())); });
const source: SourceRow = { id: "web-cinehello", name: "CineHello fixture", kind: "web_list", config: { url: base, adapter: "cinehello_home" }, tier: "T2", participation_mode: "editorial", first_party: false, interval_minutes: 120, enabled: true, cursor: null, fail_count: 0 };

test("CineHello uses the public post's exact date for both stream and morning articles", async () => {
  const items = await fetchWebList(source);
  assert.deepEqual(items.map(i => [i.title, i.publishedAt?.toISOString(), new URL(i.url).pathname]), [
    ["布光实践", "2026-09-29T11:10:00.000Z", "/stream/156453"],
    ["色彩工作流", "2026-02-02T09:20:56.000Z", "/morning/articles/280541"],
  ]);
});

test("CineHello refuses an undated post instead of assigning the current year", async () => {
  const original = pages["/morning/articles/281154"];
  pages["/morning/articles/281154"] = data({ id: 281154, title: "布光实践", status: "final", access_modifier: "all_public" });
  try { await assert.rejects(fetchWebList(source), /publication date/i); }
  finally { pages["/morning/articles/281154"] = original!; }
});

test("CineHello excludes a post whose public metadata says it is restricted", async () => {
  const original = pages["/morning/articles/281154"];
  pages["/morning/articles/281154"] = data({ id: 281154, title: "布光实践", created_at: "2026-09-29T19:10:00+08:00", status: "final", access_modifier: "private" });
  try { assert.deepEqual((await fetchWebList(source)).map(i => i.title), ["色彩工作流"]); }
  finally { pages["/morning/articles/281154"] = original!; }
});

test("a dated Blackmagic archive row yields every release, with its shared date", () => {
  const items = fromHtml(`<div class="article-container"><div class="date">13 October 2026</div><div class="article-links"><a href="/media/release/20261013-01">First release</a><a href="/media/release/20261013-02">Second release</a></div></div>`, "https://www.blackmagicdesign.com/media/partial/archive", {
    ...source, config: { url: "https://www.blackmagicdesign.com/media/partial/archive", itemSelector: ".article-container", linkSelector: ".article-links a", multipleLinks: true, publishedAtSelector: ".date", publishedAtUtcOffset: "+00:00" },
  });
  assert.deepEqual(items.map(i => [i.title, i.url, i.publishedAt?.toISOString()]), [
    ["First release", "https://www.blackmagicdesign.com/media/release/20261013-01", "2026-10-13T00:00:00.000Z"],
    ["Second release", "https://www.blackmagicdesign.com/media/release/20261013-02", "2026-10-13T00:00:00.000Z"],
  ]);
});

// ARRI uses punctuated month abbreviations in its real newsroom cards.
test("ARRI month abbreviations keep their complete calendar date and source offset", () => {
  for (const zone of ["UTC", "Asia/Shanghai", "America/New_York"]) {
    const previous = process.env.TZ;
    try {
      process.env.TZ = zone;
      assert.equal(parseLooseDate("Oct. 12, 2026", "+00:00")?.toISOString(), "2026-10-12T00:00:00.000Z");
      assert.equal(parseLooseDate("Sep. 28, 2026", "+08:00")?.toISOString(), "2026-09-27T16:00:00.000Z");
      assert.equal(parseLooseDate("Feb. 30, 2026", "+00:00"), null);
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  }
});

test("CineHello rejects a malformed explicit timezone instead of replacing it with Beijing time", async () => {
  const original = pages["/morning/articles/281154"];
  pages["/morning/articles/281154"] = data({ id: 281154, title: "布光实践", created_at: "2026-09-29T19:10:00+25:00", status: "final", access_modifier: "all_public" });
  try { await assert.rejects(fetchWebList(source), /publication date/i); }
  finally { pages["/morning/articles/281154"] = original!; }
});
