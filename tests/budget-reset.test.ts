import { gate, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { listBudgets } from "@aihot/backend/admin/settings";
import { BudgetExceededError, paidRequest } from "@aihot/backend/providers/receipts";

after(closeDb);

test("starting a fresh daily allowance preserves billed attempts and caps new requests", async () => {
  const service = `reset-day-${tag()}`;
  await sql`INSERT INTO budgets (service, per_minute, per_hour, per_day) VALUES (${service}, 100, 100, 1)`;
  let sent = 0;
  const send = async () => {
    sent += 1;
    return { response: { ok: true }, usage: { total_tokens: 100 }, cost: { amount: 1, currency: "CNY", basis: "estimated" as const } };
  };
  const first = await paidRequest({ service, purpose: "test", identity: "historical" }, send);
  await sql`UPDATE receipt_attempts SET started_at = now() - interval '2 hours' WHERE receipt_id = ${first.receiptId}`;
  await assert.rejects(paidRequest({ service, purpose: "test", identity: "new" }, send), BudgetExceededError);
  await sql`UPDATE budgets SET daily_reset_at = clock_timestamp() WHERE service = ${service}`;
  assert.equal((await listBudgets()).find((b) => b.service === service)!.used_day, 0);
  await paidRequest({ service, purpose: "test", identity: "new" }, send);
  await assert.rejects(paidRequest({ service, purpose: "test", identity: "over-limit" }, send), BudgetExceededError);
  assert.equal(sent, 2);
  assert.equal((await listBudgets()).find((b) => b.service === service)!.used_day, 1);
  const [ledger] = await sql`SELECT count(*)::int AS attempts, sum(cost)::float AS cost,
    sum((usage->>'total_tokens')::int)::int AS tokens, bool_and(origin = 'live') AS live
    FROM receipt_attempts WHERE service = ${service}`;
  assert.deepEqual(ledger, { attempts: 2, cost: 2, tokens: 200, live: true });
});

for (const window of ["minute", "hour"] as const) {
  test(`a fresh daily allowance does not bypass the ${window} limit`, async () => {
    const service = `reset-${window}-${tag()}`;
    await sql`INSERT INTO budgets (service, per_minute, per_hour, per_day)
      VALUES (${service}, ${window === "minute" ? 1 : 100}, ${window === "hour" ? 1 : 100}, 100)`;
    const first = await paidRequest({ service, purpose: "test", identity: "first" }, async () => ({ response: {} }));
    if (window === "hour") await sql`UPDATE receipt_attempts SET started_at = now() - interval '2 minutes' WHERE receipt_id = ${first.receiptId}`;
    await sql`UPDATE budgets SET daily_reset_at = clock_timestamp() WHERE service = ${service}`;
    let sent = false;
    await assert.rejects(paidRequest({ service, purpose: "test", identity: "next" }, async () => {
      sent = true;
      return { response: {} };
    }), (error: unknown) => error instanceof BudgetExceededError && error.message.endsWith(`(${window})`));
    assert.equal(sent, false);
    assert.equal((await listBudgets()).find((b) => b.service === service)!.used_day, 0);
  });
}


test("a request waiting for a daily reset counts when it reserves its paid attempt", async () => {
  const service = `reset-waiting-${tag()}`;
  await sql`INSERT INTO budgets (service, per_minute, per_hour, per_day) VALUES (${service}, 100, 100, 1)`;
  const locked = gate();
  const release = gate();
  const reset = sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext(${"budget:" + service}))`;
    locked.open();
    await release.promise;
    await tx`UPDATE budgets SET daily_reset_at = clock_timestamp() WHERE service = ${service}`;
  });
  await locked.promise;
  const request = paidRequest({ service, purpose: "test", identity: "waiting" }, async () => ({ response: {} }));
  // Attach rejection handling before waiting on the database, so a failure cannot go unhandled.
  const outcome = Promise.allSettled([request]);
  try {
    let waiting = false;
    for (let i = 0; i < 500; i++) {
      const rows = await sql`SELECT 1 FROM pg_stat_activity WHERE datname = current_database()
        AND wait_event_type = 'Lock' AND query LIKE '%pg_advisory_xact_lock%'`;
      if (rows.length) { waiting = true; break; }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.ok(waiting, "the request transaction must start before the reset boundary");
  } finally { release.open(); await reset; }
  assert.equal((await outcome)[0]!.status, "fulfilled");
  assert.equal((await listBudgets()).find((b) => b.service === service)!.used_day, 1);
  await assert.rejects(paidRequest({ service, purpose: "test", identity: "extra" }, async () => ({ response: {} })), BudgetExceededError);
});
