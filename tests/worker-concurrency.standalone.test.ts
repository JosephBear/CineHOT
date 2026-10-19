// A small server sets WORKER_MAX_CONCURRENCY so no queue runs more jobs at once than its memory allows.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorkOptions } from "pg-boss";
import { capConcurrency } from "@aihot/backend/jobs/queue";

const cap = (options: WorkOptions, limit: number | null) => capConcurrency(options, limit);

test("the deployment cap lowers a queue's concurrency and never raises it", () => {
  assert.equal(cap({ localConcurrency: 8, pollingIntervalSeconds: 2 }, 1).localConcurrency, 1);
  assert.equal(cap({ localConcurrency: 2 }, 4).localConcurrency, 2);
  assert.equal(cap({ pollingIntervalSeconds: 2 }, 1).localConcurrency, undefined, "pg-boss's default of one already fits");
  assert.equal(cap({ localConcurrency: 6 }, null).localConcurrency, 6, "no cap keeps the queue's own number");
  assert.equal(cap({ localConcurrency: 6, pollingIntervalSeconds: 2 }, 1).pollingIntervalSeconds, 2);
});
