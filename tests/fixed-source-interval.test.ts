import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { SOURCE_DEFAULTS } from "@aihot/site";
import { closeDb, sql } from "@aihot/backend/db";
import { adaptIntervals, collectSource } from "@aihot/backend/sources/collect";
const id = `fixed-interval-${tag()}`;
const defaults = SOURCE_DEFAULTS as { fixedIntervalMinutes?: number | null };
const previous = defaults.fixedIntervalMinutes;
after(async () => { defaults.fixedIntervalMinutes = previous; await closeDb(); });
test("daily interval adjustment preserves the site's fixed eight-hour cadence", async () => {
  await sql`INSERT INTO sources (id, name, kind, config, tier, interval_minutes) VALUES (${id}, 'Fixed', 'rss', '{}', 'T1', 30)`;
  defaults.fixedIntervalMinutes = 480;
  await adaptIntervals();
  const [fixed] = await sql`SELECT interval_minutes FROM sources WHERE id = ${id}`;
  assert.equal(fixed!.interval_minutes, 480);
  defaults.fixedIntervalMinutes = null;
  await adaptIntervals();
  const [adaptive] = await sql`SELECT interval_minutes FROM sources WHERE id = ${id}`;
  assert.equal(adaptive!.interval_minutes, 60, "null retains adaptive intervals");
});
test("a failed source never retries sooner than its configured eight-hour interval", async () => {
  await sql`UPDATE sources SET interval_minutes = 480, config = '{"unimplemented":true}', fail_count = 0 WHERE id = ${id}`;
  assert.equal((await collectSource(id)).status, "failed");
  const [row] = await sql`SELECT extract(epoch FROM (next_fetch_at - last_fetch_at)) / 60 AS minutes FROM sources WHERE id = ${id}`;
  assert.equal(Number(row!.minutes), 480);
});
