-- SŪQAI v2.0 Migration: Staging tables, metrics, scores, ETL tracking
-- Run in Supabase SQL Editor
-- Date: 2026-03-12

------------------------------------------------------------
-- 1. EXTEND EXISTING TABLES (add missing columns)
------------------------------------------------------------

-- Add columns to stock_prices if missing
DO $$ BEGIN
  ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS value_traded numeric;
  ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS adjusted_close numeric(12,2);
  ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS source_name text;
  ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add columns to financials if missing
DO $$ BEGIN
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS gross_profit numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS operating_income numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS total_equity numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS cash numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS total_debt numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS total_liabilities numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS operating_cash_flow numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS capex numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS free_cash_flow numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS current_ratio numeric;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS source_name text;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS source_ref text;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
  ALTER TABLE financials ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add columns to dividends if missing
DO $$ BEGIN
  ALTER TABLE dividends ADD COLUMN IF NOT EXISTS record_date date;
  ALTER TABLE dividends ADD COLUMN IF NOT EXISTS dividend_per_share numeric;
  ALTER TABLE dividends ADD COLUMN IF NOT EXISTS dividend_type text;
  ALTER TABLE dividends ADD COLUMN IF NOT EXISTS source_name text;
  ALTER TABLE dividends ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add columns to companies if missing
DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS shares_outstanding bigint;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS isin text;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url text;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS market text;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SAR';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add forecast columns to analyst_ratings
DO $$ BEGIN
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS forecast_year integer;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS revenue_estimate numeric;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS earnings_estimate numeric;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS eps_estimate numeric;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS dividend_estimate numeric;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS analyst_count integer;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS source_name text;
  ALTER TABLE analyst_ratings ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;

------------------------------------------------------------
-- 2. COMPANY METRICS (pre-computed daily ratios)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  as_of_date date NOT NULL,

  -- Price
  close_price numeric,
  market_cap numeric,

  -- Valuation
  pe_ratio numeric,
  forward_pe numeric,
  pb_ratio numeric,
  ps_ratio numeric,
  peg_ratio numeric,
  ev_ebitda numeric,
  fair_value_estimate numeric,
  fair_value_gap numeric,

  -- Dividends
  dividend_yield numeric,
  payout_ratio numeric,
  cash_payout_ratio numeric,
  dividend_cagr_3y numeric,
  years_of_dividends integer,

  -- Profitability
  roe numeric,
  roa numeric,
  roce numeric,
  net_margin numeric,
  operating_margin numeric,

  -- Growth
  revenue_growth_yoy numeric,
  earnings_growth_yoy numeric,
  eps_growth_yoy numeric,
  revenue_cagr_3y numeric,
  revenue_cagr_5y numeric,

  -- Health
  debt_to_equity numeric,
  net_debt_ebitda numeric,
  interest_coverage numeric,
  current_ratio numeric,
  ocf_to_debt numeric,

  -- Returns
  return_1d numeric,
  return_1w numeric,
  return_1m numeric,
  return_3m numeric,
  return_1y numeric,
  return_3y numeric,

  -- Technical
  week52_high numeric,
  week52_low numeric,
  week52_high_distance numeric,
  volatility_30d numeric,
  relative_perf_vs_tasi numeric,

  -- Meta
  schema_version text DEFAULT 'v2.0',
  source_name text,
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, as_of_date)
);

------------------------------------------------------------
-- 3. COMPANY SCORES (5-pillar SŪQAI Score)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_scores_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  as_of_date date NOT NULL,

  value_score numeric(3,1),          -- 0.0 to 5.0
  growth_score numeric(3,1),
  performance_score numeric(3,1),
  health_score numeric(3,1),
  dividend_score numeric(3,1),
  overall_score numeric(4,1),        -- 0 to 100

  value_checks jsonb,                -- [{check: "PE below sector avg", passed: true}]
  growth_checks jsonb,
  performance_checks jsonb,
  health_checks jsonb,
  dividend_checks jsonb,

  risk_flags jsonb,                  -- ["high_debt", "declining_revenue"]
  insight_badges jsonb,              -- ["undervalued", "dividend_champion"]

  schema_version text DEFAULT 'v2.0',
  updated_at timestamptz DEFAULT now(),

  UNIQUE(company_id, as_of_date)
);

------------------------------------------------------------
-- 4. SECTOR AVERAGES (benchmarks)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sector_averages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector text NOT NULL,
  as_of_date date NOT NULL,

  avg_pe numeric,
  avg_pb numeric,
  avg_dividend_yield numeric,
  avg_roe numeric,
  avg_roa numeric,
  avg_debt_to_equity numeric,
  avg_revenue_growth numeric,
  avg_earnings_growth numeric,
  avg_net_margin numeric,
  company_count integer,
  total_market_cap numeric,

  updated_at timestamptz DEFAULT now(),

  UNIQUE(sector, as_of_date)
);

------------------------------------------------------------
-- 5. ETL JOB TRACKING
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS etl_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  rows_processed integer DEFAULT 0,
  rows_errored integer DEFAULT 0,
  details jsonb,

  CHECK (status IN ('running', 'success', 'failed'))
);

CREATE TABLE IF NOT EXISTS etl_row_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_run_id uuid REFERENCES etl_job_runs(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  row_data jsonb NOT NULL,
  error_reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

------------------------------------------------------------
-- 6. STAGING SCHEMA
------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.company_ingest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text,
  raw_data jsonb,
  source_name text,
  status text DEFAULT 'pending',
  error_message text,
  fetched_at timestamptz DEFAULT now(),

  CHECK (status IN ('pending', 'validated', 'loaded', 'error'))
);

CREATE TABLE IF NOT EXISTS staging.price_ingest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text,
  date date,
  ohlcv jsonb,
  source_name text,
  status text DEFAULT 'pending',
  fetched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.financial_ingest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text,
  year integer,
  period text,
  raw_data jsonb,
  source_name text,
  status text DEFAULT 'pending',
  error_message text,
  fetched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staging.dividend_ingest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text,
  raw_data jsonb,
  source_name text,
  status text DEFAULT 'pending',
  fetched_at timestamptz DEFAULT now()
);

------------------------------------------------------------
-- 7. RAW SCHEMA
------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS raw;

CREATE TABLE IF NOT EXISTS raw.source_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  endpoint text,
  ticker text,
  payload jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

------------------------------------------------------------
-- 8. USER TABLES (Portfolio, Watchlist, Alerts)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,  -- will reference auth.users when auth is enabled
  name text NOT NULL DEFAULT 'My Watchlist',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid REFERENCES watchlists(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  notes text,

  UNIQUE(watchlist_id, company_id)
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  portfolio_id uuid,  -- FK to portfolios if you use it
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  shares numeric NOT NULL,
  avg_cost numeric,
  purchase_date date,
  broker_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  threshold_value numeric,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),

  CHECK (alert_type IN (
    'price_above', 'price_below',
    'score_change', 'dividend_announced',
    'earnings_released', 'screener_match',
    'insider_transaction'
  ))
);

------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
------------------------------------------------------------

ALTER TABLE company_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_averages ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_row_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Public read for market data tables
CREATE POLICY "Public read company_metrics_daily" ON company_metrics_daily FOR SELECT USING (true);
CREATE POLICY "Public read company_scores_daily" ON company_scores_daily FOR SELECT USING (true);
CREATE POLICY "Public read sector_averages" ON sector_averages FOR SELECT USING (true);
CREATE POLICY "Public read etl_job_runs" ON etl_job_runs FOR SELECT USING (true);
CREATE POLICY "Public read etl_row_errors" ON etl_row_errors FOR SELECT USING (true);

-- Service role full access for Data Agent writes
CREATE POLICY "Service write company_metrics_daily" ON company_metrics_daily FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write company_scores_daily" ON company_scores_daily FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write sector_averages" ON sector_averages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write etl_job_runs" ON etl_job_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write etl_row_errors" ON etl_row_errors FOR ALL USING (true) WITH CHECK (true);

-- User tables: public for now (restrict when auth is added)
CREATE POLICY "Public read watchlists" ON watchlists FOR SELECT USING (true);
CREATE POLICY "Public write watchlists" ON watchlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read watchlist_items" ON watchlist_items FOR SELECT USING (true);
CREATE POLICY "Public write watchlist_items" ON watchlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read portfolio_holdings" ON portfolio_holdings FOR SELECT USING (true);
CREATE POLICY "Public write portfolio_holdings" ON portfolio_holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Public write alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);

------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_metrics_company_date ON company_metrics_daily(company_id, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_company_date ON company_scores_daily(company_id, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_sector_avg_date ON sector_averages(sector, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_prices_company_date ON stock_prices(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_financials_company_year ON financials(company_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_dividends_company_exdate ON dividends(company_id, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_etl_runs_job ON etl_job_runs(job_name, started_at DESC);
