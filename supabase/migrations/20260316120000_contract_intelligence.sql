-- SŪQAI Contract Intelligence System
-- Migration: company_contracts + supporting tables
-- Date: 2026-03-16

------------------------------------------------------------
-- 1. MAIN TABLE: company_contracts
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_contracts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      INTEGER REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  ticker          TEXT NOT NULL,

  -- Announcement metadata
  announcement_id   TEXT,                     -- Tadawul announcement ID if available
  announcement_url  TEXT,                     -- Link to source disclosure
  announcement_title_en TEXT,
  announcement_title_ar TEXT,
  announcement_date DATE NOT NULL,            -- Date published on exchange
  event_date        DATE,                     -- Date contract was awarded/signed (if different)

  -- Classification
  disclosure_type   TEXT NOT NULL DEFAULT 'contract_award',
    -- contract_award | signed_contract | extension | renewal | framework_agreement | mou | supply_agreement | service_agreement | project_execution
  contract_type     TEXT,
    -- construction | engineering | it_services | healthcare | logistics | defense | utilities | facility_management | infrastructure | industrial | consulting | other

  -- Deal details
  counterparty          TEXT,                 -- Name of the other party
  counterparty_type     TEXT,                 -- government | semi_government | private | international | undisclosed
  contract_value        NUMERIC(18,2),        -- In currency specified (NULL if undisclosed)
  currency              TEXT DEFAULT 'SAR',
  value_disclosed       BOOLEAN DEFAULT false,
  duration_text         TEXT,                 -- Raw duration string ("3 years", "36 months")
  duration_months       INTEGER,              -- Normalized
  start_date            DATE,
  end_date              DATE,
  project_description   TEXT,
  geography             TEXT,                 -- Where the work is located

  -- Financial context
  expected_financial_impact TEXT,             -- Raw text from disclosure
  value_as_pct_of_revenue   NUMERIC(8,4),    -- contract_value / last annual revenue
  value_as_pct_of_market_cap NUMERIC(8,4),   -- contract_value / market_cap at announcement

  -- Materiality assessment
  materiality_score     NUMERIC(5,2),         -- 0-100
  materiality_label     TEXT DEFAULT 'unknown',
    -- minor | moderate | meaningful | major | unknown
  is_material           BOOLEAN DEFAULT false,

  -- Source & confidence
  source_platform       TEXT DEFAULT 'tadawul',
  source_text_raw       TEXT,                 -- Full raw announcement text
  source_text_clean     TEXT,                 -- Cleaned/extracted summary
  extraction_confidence NUMERIC(3,2) DEFAULT 0.5, -- 0.0-1.0
  is_verified           BOOLEAN DEFAULT false,

  -- Stock reaction (populated by reaction calculator)
  reaction_day0         NUMERIC(8,4),         -- Return on announcement day
  reaction_day1         NUMERIC(8,4),         -- 1 day after
  reaction_day3         NUMERIC(8,4),         -- 3 days after
  reaction_day5         NUMERIC(8,4),         -- 5 days after
  reaction_day10        NUMERIC(8,4),         -- 10 days after
  reaction_vs_tasi_day3 NUMERIC(8,4),         -- Excess return vs TASI 3-day
  reaction_vs_tasi_day5 NUMERIC(8,4),         -- Excess return vs TASI 5-day
  reaction_label        TEXT,                 -- positive | mixed | muted | negative

  -- Status
  status          TEXT DEFAULT 'active',       -- active | completed | cancelled | superseded
  notes           TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contracts_company ON company_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_ticker ON company_contracts(ticker);
CREATE INDEX IF NOT EXISTS idx_contracts_date ON company_contracts(announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON company_contracts(disclosure_type);
CREATE INDEX IF NOT EXISTS idx_contracts_materiality ON company_contracts(materiality_label);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_dedup ON company_contracts(ticker, announcement_date, COALESCE(announcement_id, ''));

------------------------------------------------------------
-- 2. COMPANY CONTRACT MOMENTUM (materialized per-company)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS company_contract_momentum (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id          INTEGER REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ticker              TEXT NOT NULL,

  -- Counts
  contracts_3m        INTEGER DEFAULT 0,        -- Last 3 months
  contracts_12m       INTEGER DEFAULT 0,        -- Last 12 months
  contracts_total     INTEGER DEFAULT 0,        -- All time
  new_awards_12m      INTEGER DEFAULT 0,        -- New awards only (not renewals)
  extensions_12m      INTEGER DEFAULT 0,        -- Extensions/renewals

  -- Values
  disclosed_value_12m NUMERIC(18,2) DEFAULT 0,  -- Sum of disclosed values in last 12m
  avg_contract_size   NUMERIC(18,2),            -- Average disclosed contract value
  largest_contract    NUMERIC(18,2),            -- Largest single disclosed value

  -- Materiality
  material_contracts_12m INTEGER DEFAULT 0,     -- Count of material contracts
  material_pct_revenue   NUMERIC(8,4),          -- Sum of material values / revenue

  -- Signals
  momentum_signal     TEXT DEFAULT 'neutral',
    -- active | improving | steady | slowing | limited | dormant
  momentum_score      NUMERIC(5,2) DEFAULT 50,  -- 0-100
  signal_line_en      TEXT,
  signal_line_ar      TEXT,

  -- Latest
  last_contract_date  DATE,
  last_contract_type  TEXT,
  last_contract_value NUMERIC(18,2),

  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_momentum_ticker ON company_contract_momentum(ticker);
CREATE INDEX IF NOT EXISTS idx_momentum_signal ON company_contract_momentum(momentum_signal);

------------------------------------------------------------
-- 3. CONTRACT INGESTION LOG (ETL tracking)
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contract_ingestion_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date      TIMESTAMPTZ DEFAULT NOW(),
  source        TEXT NOT NULL DEFAULT 'tadawul',
  records_found INTEGER DEFAULT 0,
  records_new   INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors        INTEGER DEFAULT 0,
  error_details JSONB,
  duration_ms   INTEGER,
  status        TEXT DEFAULT 'success'   -- success | partial | failed
);

------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
------------------------------------------------------------

ALTER TABLE company_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contract_momentum ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read company_contracts" ON company_contracts FOR SELECT USING (true);
CREATE POLICY "Public read company_contract_momentum" ON company_contract_momentum FOR SELECT USING (true);
CREATE POLICY "Public read contract_ingestion_log" ON contract_ingestion_log FOR SELECT USING (true);

------------------------------------------------------------
-- 5. HELPER FUNCTION: refresh contract momentum
------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_contract_momentum(p_company_id INTEGER)
RETURNS void AS $$
DECLARE
  v_ticker TEXT;
  v_now DATE := CURRENT_DATE;
  v_3m DATE := v_now - INTERVAL '3 months';
  v_12m DATE := v_now - INTERVAL '12 months';
BEGIN
  SELECT ticker INTO v_ticker FROM companies WHERE id = p_company_id;
  IF v_ticker IS NULL THEN RETURN; END IF;

  INSERT INTO company_contract_momentum (
    company_id, ticker,
    contracts_3m, contracts_12m, contracts_total,
    new_awards_12m, extensions_12m,
    disclosed_value_12m, avg_contract_size, largest_contract,
    material_contracts_12m,
    last_contract_date, last_contract_type, last_contract_value,
    updated_at
  )
  SELECT
    p_company_id,
    v_ticker,
    COUNT(*) FILTER (WHERE announcement_date >= v_3m),
    COUNT(*) FILTER (WHERE announcement_date >= v_12m),
    COUNT(*),
    COUNT(*) FILTER (WHERE announcement_date >= v_12m AND disclosure_type IN ('contract_award','signed_contract','project_execution','supply_agreement','service_agreement')),
    COUNT(*) FILTER (WHERE announcement_date >= v_12m AND disclosure_type IN ('extension','renewal')),
    COALESCE(SUM(contract_value) FILTER (WHERE announcement_date >= v_12m AND value_disclosed), 0),
    AVG(contract_value) FILTER (WHERE value_disclosed),
    MAX(contract_value) FILTER (WHERE value_disclosed),
    COUNT(*) FILTER (WHERE announcement_date >= v_12m AND is_material),
    MAX(announcement_date),
    (SELECT disclosure_type FROM company_contracts cc2 WHERE cc2.company_id = p_company_id ORDER BY announcement_date DESC LIMIT 1),
    (SELECT contract_value FROM company_contracts cc2 WHERE cc2.company_id = p_company_id ORDER BY announcement_date DESC LIMIT 1),
    NOW()
  FROM company_contracts
  WHERE company_id = p_company_id
  ON CONFLICT (company_id) DO UPDATE SET
    contracts_3m = EXCLUDED.contracts_3m,
    contracts_12m = EXCLUDED.contracts_12m,
    contracts_total = EXCLUDED.contracts_total,
    new_awards_12m = EXCLUDED.new_awards_12m,
    extensions_12m = EXCLUDED.extensions_12m,
    disclosed_value_12m = EXCLUDED.disclosed_value_12m,
    avg_contract_size = EXCLUDED.avg_contract_size,
    largest_contract = EXCLUDED.largest_contract,
    material_contracts_12m = EXCLUDED.material_contracts_12m,
    last_contract_date = EXCLUDED.last_contract_date,
    last_contract_type = EXCLUDED.last_contract_type,
    last_contract_value = EXCLUDED.last_contract_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
