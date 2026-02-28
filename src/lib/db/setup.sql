-- ============================================================
-- SŪQAI — Full Database Schema
-- Based on SPEC.md §4.2 (complete)
--
-- Run against your Supabase project via the SQL Editor or:
--   supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE market_type AS ENUM ('main', 'nomu');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM (
    'price_above', 'price_below', 'sentiment',
    'filing', 'dividend', 'ownership'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'institutional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vote_type AS ENUM ('bullish', 'bearish', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ipo_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- HELPER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker          TEXT UNIQUE NOT NULL,
  symbol          TEXT UNIQUE NOT NULL,        -- e.g. '2222.SR'
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_zh         TEXT,
  sector          TEXT NOT NULL,
  sub_sector      TEXT,
  market          market_type NOT NULL DEFAULT 'main',
  is_shariah_compliant BOOLEAN NOT NULL DEFAULT false,
  vision_2030_score    DECIMAL,
  logo_url        TEXT,
  description_ar  TEXT,
  description_en  TEXT,
  description_zh  TEXT,
  website_url     TEXT,
  employee_count  INTEGER,
  founded_year    INTEGER,
  ceo_name_ar     TEXT,
  ceo_name_en     TEXT,
  government_contracts TEXT[],
  mega_projects   TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigram indexes for multilingual search
CREATE INDEX IF NOT EXISTS idx_companies_name_en_trgm ON companies USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_ar_trgm ON companies USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_ticker      ON companies (ticker);
CREATE INDEX IF NOT EXISTS idx_companies_sector      ON companies (sector);

-- ============================================================
-- STOCK PRICES
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_prices (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  open           DECIMAL NOT NULL DEFAULT 0,
  high           DECIMAL NOT NULL DEFAULT 0,
  low            DECIMAL NOT NULL DEFAULT 0,
  close          DECIMAL NOT NULL DEFAULT 0,
  volume         BIGINT  NOT NULL DEFAULT 0,
  adjusted_close DECIMAL NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, date)
);

CREATE INDEX IF NOT EXISTS idx_stock_prices_company_date ON stock_prices(company_id, date DESC);

-- ============================================================
-- FINANCIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS financials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period                TEXT NOT NULL CHECK (period IN ('Q1','Q2','Q3','Q4','annual')),
  year                  INT  NOT NULL,
  revenue               DECIMAL,
  net_income            DECIMAL,
  total_assets          DECIMAL,
  total_liabilities     DECIMAL,
  earnings_per_share    DECIMAL,
  book_value_per_share  DECIMAL,
  operating_cash_flow   DECIMAL,
  free_cash_flow        DECIMAL,
  debt_to_equity        DECIMAL,
  current_ratio         DECIMAL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, period, year)
);

-- ============================================================
-- DIVIDENDS
-- ============================================================
CREATE TABLE IF NOT EXISTS dividends (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ex_date           DATE NOT NULL,
  payment_date      DATE,
  amount_per_share  DECIMAL NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'SAR',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, ex_date)
);

-- ============================================================
-- OWNERSHIP
-- ============================================================
CREATE TABLE IF NOT EXISTS ownership (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  foreign_percent      DECIMAL,
  institutional_percent DECIMAL,
  government_percent   DECIMAL,
  retail_percent       DECIMAL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, date)
);

-- ============================================================
-- NEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  title_ar        TEXT,
  title_en        TEXT,
  title_zh        TEXT,
  body_ar         TEXT,
  body_en         TEXT,
  body_zh         TEXT,
  source          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  sentiment_score DECIMAL,
  published_at    TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_url)    -- required for upsert deduplication in cron
);

CREATE INDEX IF NOT EXISTS idx_news_published  ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_company    ON news(company_id) WHERE company_id IS NOT NULL;

-- Migration: add unique constraint if table already exists without it
ALTER TABLE news ADD CONSTRAINT IF NOT EXISTS news_source_url_unique UNIQUE (source_url);

-- ============================================================
-- TRANSLATIONS CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS translations_cache (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text_hash  TEXT NOT NULL,              -- SHA-256 of original text
  source_language   TEXT NOT NULL DEFAULT 'ar',
  target_language   TEXT NOT NULL,
  translated_text   TEXT NOT NULL,
  model_used        TEXT NOT NULL DEFAULT 'gemini-flash',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_text_hash, target_language)
);

CREATE INDEX IF NOT EXISTS idx_translations_hash ON translations_cache(source_text_hash);

-- ============================================================
-- CHAT SESSIONS (AI Q&A history)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL,                   -- references auth.users
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  language    TEXT NOT NULL DEFAULT 'en',       -- 'en', 'ar', 'zh'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- ============================================================
-- COMMUNITY VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS community_votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL,                   -- references auth.users
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vote        TEXT NOT NULL CHECK (vote IN ('bullish','bearish','neutral')),
  voted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_community_votes_company ON community_votes(company_id);

-- ============================================================
-- IPOS
-- ============================================================
CREATE TABLE IF NOT EXISTS ipos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name_ar     TEXT NOT NULL,
  company_name_en     TEXT,
  company_name_zh     TEXT,
  sector              TEXT,
  expected_date       DATE,
  subscription_start  DATE,
  subscription_end    DATE,
  price_range_low     DECIMAL,
  price_range_high    DECIMAL,
  status              TEXT NOT NULL DEFAULT 'upcoming'
                      CHECK (status IN ('upcoming','active','completed','cancelled')),
  details_ar          TEXT,
  details_en          TEXT,
  details_zh          TEXT,
  source_url          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS ipos_updated_at ON ipos;
CREATE TRIGGER ipos_updated_at
  BEFORE UPDATE ON ipos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PORTFOLIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,                 -- references auth.users
  name          TEXT NOT NULL,
  is_watchlist  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS portfolios_updated_at ON portfolios;
CREATE TRIGGER portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

-- ============================================================
-- PORTFOLIO HOLDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  shares        DECIMAL NOT NULL DEFAULT 0,
  avg_cost      DECIMAL NOT NULL DEFAULT 0,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL,             -- references auth.users
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN (
    'price_above','price_below','sentiment','filing','dividend','ownership'
  )),
  threshold         DECIMAL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user   ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;

-- ============================================================
-- USERS PROFILE (extends auth.users via 1-to-1)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id                       UUID PRIMARY KEY,   -- same as auth.users.id
  email                    TEXT,
  full_name                TEXT,
  preferred_language       TEXT NOT NULL DEFAULT 'en'
                           CHECK (preferred_language IN ('ar','en','zh')),
  subscription_tier        TEXT NOT NULL DEFAULT 'free'
                           CHECK (subscription_tier IN ('free','pro','institutional')),
  subscription_expires_at  TIMESTAMPTZ,
  timezone                 TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  telegram_chat_id         TEXT,
  whatsapp_number          TEXT,
  morning_brief_enabled    BOOLEAN NOT NULL DEFAULT false,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public-read tables
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership          ENABLE ROW LEVEL SECURITY;
ALTER TABLE news               ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes    ENABLE ROW LEVEL SECURITY;

-- User-scoped tables
ALTER TABLE chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;

-- ── Public read policies ──────────────────────────────────────

CREATE POLICY "companies_select" ON companies FOR SELECT USING (true);
CREATE POLICY "stock_prices_select" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "financials_select" ON financials FOR SELECT USING (true);
CREATE POLICY "dividends_select" ON dividends FOR SELECT USING (true);
CREATE POLICY "ownership_select" ON ownership FOR SELECT USING (true);
CREATE POLICY "news_select" ON news FOR SELECT USING (true);
CREATE POLICY "translations_cache_select" ON translations_cache FOR SELECT USING (true);
CREATE POLICY "ipos_select" ON ipos FOR SELECT USING (true);
CREATE POLICY "community_votes_select" ON community_votes FOR SELECT USING (true);

-- ── User-scoped policies ──────────────────────────────────────

-- Chat sessions
CREATE POLICY "chat_own_select" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_own_insert" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_own_update" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_own_delete" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Community votes (read all, write own)
CREATE POLICY "votes_own_insert" ON community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_own_update" ON community_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_own_delete" ON community_votes FOR DELETE USING (auth.uid() = user_id);

-- Portfolios
CREATE POLICY "portfolios_own_select" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "portfolios_own_insert" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolios_own_update" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolios_own_delete" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Portfolio holdings (via portfolio ownership check)
CREATE POLICY "holdings_own_select" ON portfolio_holdings FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));
CREATE POLICY "holdings_own_insert" ON portfolio_holdings FOR INSERT
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));
CREATE POLICY "holdings_own_update" ON portfolio_holdings FOR UPDATE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));
CREATE POLICY "holdings_own_delete" ON portfolio_holdings FOR DELETE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- Alerts
CREATE POLICY "alerts_own_select" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_own_insert" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_own_update" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_own_delete" ON alerts FOR DELETE USING (auth.uid() = user_id);

-- User profiles
CREATE POLICY "profile_own_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_own_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_own_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
