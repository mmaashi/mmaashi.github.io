-- ════════════════════════════════════════════════════════════════
-- SŪQAI Portfolio System — Real user portfolios
-- ════════════════════════════════════════════════════════════════

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  name          TEXT NOT NULL DEFAULT 'My Portfolio',
  name_ar       TEXT DEFAULT 'محفظتي',
  base_currency TEXT NOT NULL DEFAULT 'SAR',
  is_default    BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id),
  ticker          TEXT NOT NULL,
  quantity        NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
  average_cost    NUMERIC(18, 4),       -- NULL = user doesn't know
  purchase_date   DATE,                  -- optional
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, ticker)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON portfolio_holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_company ON portfolio_holdings(company_id);

-- RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_portfolios" ON portfolios FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_portfolios" ON portfolios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_portfolios" ON portfolios FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_portfolios" ON portfolios FOR DELETE TO anon USING (true);

CREATE POLICY "anon_read_holdings" ON portfolio_holdings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_holdings" ON portfolio_holdings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_holdings" ON portfolio_holdings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_holdings" ON portfolio_holdings FOR DELETE TO anon USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolios_updated
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_holdings_updated
  BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
