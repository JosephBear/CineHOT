-- A one-off backfill can start a fresh daily allowance without erasing paid usage.
ALTER TABLE budgets ADD COLUMN daily_reset_at timestamptz;
