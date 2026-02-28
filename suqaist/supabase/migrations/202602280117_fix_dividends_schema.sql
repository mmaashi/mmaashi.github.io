-- Fix #3: Dividends schema
ALTER TABLE dividends RENAME COLUMN payment_date TO pay_date;

-- Add missing columns
ALTER TABLE dividends ADD COLUMN IF NOT EXISTS record_date DATE;
ALTER TABLE dividends ADD COLUMN IF NOT EXISTS year INTEGER;

-- Backfill year
UPDATE dividends SET year = EXTRACT(YEAR FROM pay_date::date) WHERE year IS NULL;
