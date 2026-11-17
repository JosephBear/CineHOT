// Offline calibration: the database's stored scores are held against hand labels at each threshold, with no
// model call. Failure modes: a prefilter refusal (no score) counted as a pick; "either" labels counted at all.
import assert from "node:assert/strict";
import { test } from "node:test";
import { offlineTable } from "../scripts/label-selection.ts";

const item = (caseId: string, score: number | null, split: "development" | "holdout" = "development") =>
  ({ caseId, sourceId: "s", sourceName: "S", sourceKind: "rss", tier: "T2", tags: [], title: caseId, url: "https://example.com", publishedAt: "2026-11-01T00:00:00.000Z",
    language: "en" as const, body: "", bodySource: "page" as const, split, stored: { score, selected: false } });
const label = (decision: "select" | "reject" | "either") => ({ decision, reason: "", at: "2026-11-18" });

test("stored scores are held against labels at each threshold; refusals never count as picks and 'either' is left out", () => {
  const items = [item("a", 50), item("b", 40), item("c", 30), item("d", null), item("e", 45), item("h", 60, "holdout")];
  const labels = { a: label("select"), b: label("reject"), c: label("select"), d: label("select"), e: label("either"), h: label("select") };
  const [dev, hold] = offlineTable(items, labels, [35, 45]);
  assert.equal(dev!.n, 4, "the 'either' case is left out");
  assert.deepEqual(dev!.rows.map((r) => [r.threshold, r.picked, +r.precision.toFixed(2), +r.recall.toFixed(2)]), [[35, 2, 0.5, 0.33], [45, 1, 1, 0.33]]);
  assert.deepEqual([hold!.n, hold!.rows[0]!.recall], [1, 1]);
});
