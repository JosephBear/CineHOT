// Read-only source validation: no seeding, database writes, models or paid services.
// node scripts/check-cinemahot-sources.ts [--ids web-arri-news,web-blackmagic-news,web-cinehello]
import { readFileSync } from "node:fs";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { fetchRss } from "@aihot/backend/sources/rss";
import { fetchDetail, fetchWebList, needsTitle } from "@aihot/backend/sources/web-list";
import { fetchJsonList } from "@aihot/backend/sources/json-list";
import { admitListing } from "@aihot/backend/sources/filters";
import type { SourceRow } from "@aihot/backend/sources/types";

const { sources } = JSON.parse(readFileSync(new URL("../industry/sources.json", import.meta.url), "utf8")) as { sources: Array<SourceRow & { site_fulltext: boolean; syndicate_fulltext: boolean }> };
const index = process.argv.indexOf("--ids");
const ids = index < 0 ? null : new Set((process.argv[index + 1] ?? "").split(",").filter(Boolean));
if (ids && (!ids.size || [...ids].some(id => !sources.some(s => s.id === id)))) throw new Error("--ids must name configured source ids");
for (const seed of sources.filter(s => !ids || ids.has(s.id))) {
  // External sources are pushed in, not fetched.
  if (seed.kind === "external") { console.log(JSON.stringify({ id: seed.id, status: "skipped", kind: seed.kind })); continue; }
  try {
    assertSupportedConfig(seed.kind, seed.config);
    const source = { ...seed, first_party: seed.tier === "T1", enabled: true, cursor: null, fail_count: 0 };
    const raw = seed.kind === "rss" ? (await fetchRss(source)).candidates : seed.kind === "json_list" ? await fetchJsonList(source) : await fetchWebList(source);
    const items = admitListing(raw, source);
    // Detail rules fill the sample as collection would: a missing date, and a title the listing cannot give.
    const d = source.config.detail;
    if (d) for (const i of items.slice(0, 2)) {
      const got = await fetchDetail(i.url, source, { date: !i.publishedAt, title: !!(d.titleSelector || d.titleRegex) && (d.titleAuthoritative === true || needsTitle(i.title)), summary: false, body: false });
      i.publishedAt ??= got.publishedAt;
      if (got.title) i.title = got.title;
    }
    if (!items.length || !items.some(i => i.publishedAt) || d && !items.slice(0, 2).every(i => i.publishedAt)) throw new Error("no dated public articles");
    console.log(JSON.stringify({ id: seed.id, status: "ok", found: raw.length, admitted: items.length, dated: items.filter(i => i.publishedAt).length, sample: items.slice(0, 2).map(i => ({ title: i.title, url: i.url, publishedAt: i.publishedAt?.toISOString() ?? null })) }));
  } catch (error) {
    console.error(JSON.stringify({ id: seed.id, status: "failed", error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  }
}
