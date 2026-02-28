-- Company Contracts Table
CREATE TABLE IF NOT EXISTS company_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  contract_title_en TEXT NOT NULL,
  contract_title_ar TEXT,
  contract_reference VARCHAR(100),
  awarding_entity_en TEXT,
  awarding_entity_ar TEXT,
  awarding_entity_type VARCHAR(50),
  contract_value_sar DECIMAL(18,2),
  contract_value_usd DECIMAL(18,2),
  contract_value_confidence VARCHAR(20),
  announcement_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  duration_months INTEGER,
  contract_type VARCHAR(50),
  giga_project VARCHAR(100),
  vision2030_pillar VARCHAR(50),
  contract_status VARCHAR(30) DEFAULT 'Active',
  is_renewal BOOLEAN DEFAULT FALSE,
  is_framework_agreement BOOLEAN DEFAULT FALSE,
  announcement_day_return DECIMAL(8,4),
  significance VARCHAR(20),
  source_type VARCHAR(50),
  source_url TEXT,
  disclosure_url TEXT,
  summary_en TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticker, contract_reference)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_ticker ON company_contracts(ticker);
CREATE INDEX IF NOT EXISTS idx_contracts_date ON company_contracts(announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_value ON company_contracts(contract_value_sar DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON company_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_contracts_giga ON company_contracts(giga_project);
