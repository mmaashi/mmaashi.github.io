-- Fix uuid function
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Create financials table with gen_random_uuid
CREATE TABLE IF NOT EXISTS financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT CHECK (period IN ('Q1','Q2','Q3','Q4','annual')),
  year INT,
  revenue DECIMAL, net_income DECIMAL, total_assets DECIMAL,
  earnings_per_share DECIMAL, debt_to_equity DECIMAL,
  UNIQUE(company_id, period, year)
);

CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ex_date DATE, payment_date DATE,
  amount_per_share DECIMAL NOT NULL,
  currency TEXT DEFAULT 'SAR'
);

CREATE TABLE IF NOT EXISTS ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  date DATE, foreign_percent DECIMAL, institutional_percent DECIMAL
);

CREATE TABLE IF NOT EXISTS ipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name_en TEXT,
  company_name_ar TEXT,
  sector TEXT, expected_date DATE,
  status TEXT DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_watchlist BOOLEAN DEFAULT false
);

ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financials_read" ON financials FOR SELECT USING (true);
CREATE POLICY "dividends_read" ON dividends FOR SELECT USING (true);
CREATE POLICY "ownership_read" ON ownership FOR SELECT USING (true);
CREATE POLICY "ipos_read" ON ipos FOR SELECT USING (true);
CREATE POLICY "portfolios_read" ON portfolios FOR SELECT USING (true);
