// Removes sources taken out of industry/sources.json, with all their articles. Published articles are
// first withdrawn through the admin path (site, RSS, API, MCP, events and the hot ranking follow), then
// the articles, the facts only they supported and the source rows are deleted; the audit log and the
// selected-feed ledger (a history its subscribers replay) are kept. Without --apply it only counts.
//   node --env-file=.env scripts/purge-sources.ts --ids web-a,rss-b [--apply]
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@aihot/backend/config";
import { closeDb, sql } from "@aihot/backend/db";
import { setVisibility } from "@aihot/backend/admin/content";
import { audit } from "@aihot/backend/audit";
import { stopBoss } from "@aihot/backend/jobs/queue";

const ACTOR = "purge-sources";
const at = process.argv.indexOf("--ids");
const ids = at < 0 ? [] : (process.argv[at + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const apply = process.argv.includes("--apply");
if (ids.length === 0) throw new Error("usage: purge-sources.ts --ids <id,id> [--apply]");
// Only sources already gone from the config: seed would not re-add them, and a typo cannot hit a live one.
const configured = new Set((JSON.parse(readFileSync(path.join(REPO_ROOT, "industry/sources.json"), "utf8")) as { sources: { id: string }[] }).sources.map((s) => s.id));
const still = ids.filter((id) => configured.has(id));
if (still.length) throw new Error(`still in industry/sources.json, remove them there first: ${still.join(", ")}`);

const known = await sql<{ id: string; name: string }[]>`SELECT id, name FROM sources WHERE id = ANY(${ids})`;
const missing = ids.filter((id) => !known.some((s) => s.id === id));
if (missing.length) console.log(`not in the database (nothing to do): ${missing.join(", ")}`);
const found = known.map((s) => s.id);

const counts = await sql<{ id: string; name: string; articles: number; public: number }[]>`
  SELECT s.id, s.name, count(a.id)::int AS articles,
         count(p.article_id) FILTER (WHERE p.visibility <> 'withdrawn')::int AS public
  FROM sources s LEFT JOIN articles a ON a.source_id = s.id LEFT JOIN publications p ON p.article_id = a.id
  WHERE s.id = ANY(${found}) GROUP BY s.id, s.name ORDER BY s.id`;
for (const c of counts) console.log(`${c.id}（${c.name}）：文章 ${c.articles} 篇，其中对外可见 ${c.public} 篇`);

if (!apply) {
  console.log("预览完毕，没有改动。确认后加 --apply 执行。");
} else if (found.length) {
  // Stop collecting first, so no new article arrives between the withdrawal and the delete.
  await sql`UPDATE sources SET enabled = false WHERE id = ANY(${found})`;
  const visible = await sql<{ id: string }[]>`
    SELECT a.id FROM articles a JOIN publications p ON p.article_id = a.id
    WHERE a.source_id = ANY(${found}) AND p.visibility <> 'withdrawn' ORDER BY a.id`;
  for (const { id } of visible) {
    const [o] = await sql<{ version: number }[]>`SELECT version FROM editorial_overrides WHERE article_id = ${id}`;
    await setVisibility(id, { visibility: "withdrawn", reason: "信源移出，删除其全部文章", version: o?.version ?? 0 }, ACTOR);
  }
  console.log(`撤下 ${visible.length} 篇`);
  const deleted = await sql.begin(async (tx) => {
    const facts = await tx<{ fact_id: number }[]>`
      SELECT DISTINCT fa.fact_id FROM fact_articles fa JOIN articles a ON a.id = fa.article_id WHERE a.source_id = ANY(${found})`;
    await tx`DELETE FROM embeddings WHERE kind = 'article' AND ref_id IN (SELECT id FROM articles WHERE source_id = ANY(${found}))`;
    await tx`DELETE FROM selected_state WHERE article_id IN (SELECT id FROM articles WHERE source_id = ANY(${found}))`;
    // Other sources' articles this source also found keep their own rows; only its sightings go.
    await tx`DELETE FROM article_discoveries WHERE source_id = ANY(${found})`;
    await tx`DELETE FROM story_signals WHERE source_id = ANY(${found})`;
    const articles = await tx`DELETE FROM articles WHERE source_id = ANY(${found})`;
    // A fact left without any supporting report would read as an unsourced claim.
    const orphans = await tx`DELETE FROM facts f WHERE f.id = ANY(${facts.map((f) => f.fact_id)}) 
      AND NOT EXISTS (SELECT 1 FROM fact_articles fa WHERE fa.fact_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM publications p WHERE p.fact_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM grouping_decisions g WHERE g.fact_id = f.id)`;
    const sources = await tx`DELETE FROM sources WHERE id = ANY(${found})`;
    await audit(ACTOR, "source.purge", `sources:${found.join(",")}`, "信源移出", null, { articles: articles.count, facts: orphans.count }, { db: tx });
    return { articles: articles.count, facts: orphans.count, sources: sources.count };
  });
  console.log(`删除文章 ${deleted.articles} 篇、孤立事实 ${deleted.facts} 条、信源 ${deleted.sources} 个`);
}
await stopBoss();
await closeDb();
