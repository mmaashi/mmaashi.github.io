-- SUQAI Database Schema

-- Companies table (base)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    market_cap BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock prices
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC(12,2),
    high NUMERIC(12,2),
    low NUMERIC(12,2),
    close NUMERIC(12,2),
    volume BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, date)
);

-- Financial statements
CREATE TABLE IF NOT EXISTS financials (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    period DATE NOT NULL,
    revenue NUMERIC(15,2),
    net_income NUMERIC(15,2),
    total_assets NUMERIC(15,2),
    total_liabilities NUMERIC(15,2),
    equity NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, period)
);

-- Dividends
CREATE TABLE IF NOT EXISTS dividends (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ex_date DATE NOT NULL,
    amount NUMERIC(10,4),
    currency TEXT DEFAULT 'SAR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, ex_date)
);

-- Earnings
CREATE TABLE IF NOT EXISTS earnings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    period DATE NOT NULL,
    eps NUMERIC(10,4),
    revenue NUMERIC(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, period)
);

-- Indices
CREATE TABLE IF NOT EXISTS indices (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    symbol TEXT,
    base_value NUMERIC(15,2),
    base_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index members
CREATE TABLE IF NOT EXISTS index_members (
    id SERIAL PRIMARY KEY,
    index_id INTEGER REFERENCES indices(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    weight NUMERIC(8,4),
    added_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(index_id, company_id)
);

-- News
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    source TEXT,
    url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyst ratings
CREATE TABLE IF NOT EXISTS analyst_ratings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    rating TEXT,
    target_price NUMERIC(12,2),
    analyst_firm TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, analyst_firm)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_ratings ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust as needed)
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Public read financials" ON financials FOR SELECT USING (true);
CREATE POLICY "Public read dividends" ON dividends FOR SELECT USING (true);
CREATE POLICY "Public read earnings" ON earnings FOR SELECT USING (true);
CREATE POLICY "Public read indices" ON indices FOR SELECT USING (true);
CREATE POLICY "Public read index_members" ON index_members FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read analyst_ratings" ON analyst_ratings FOR SELECT USING (true);
