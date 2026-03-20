# SŪQAI — Agent Data Brief
## From: CTO | To: Data Agent | Priority: HIGH

---

## 🎯 MISSION

You are the **data agent** for SŪQAI — a bilingual Saudi stock market intelligence platform.

Your **only job** is to fetch real market data and populate the Supabase database. You write Node.js / TypeScript seed scripts. You do NOT touch any Next.js app files. The app is already built and deployed — it reads from the database, and it is waiting for your data.

---

## ⛔ DO NOT TOUCH — THESE FILES ARE FORBIDDEN

These are production app files. Do NOT read, edit, rename, or delete them:

```
src/
├── app/              ← ALL next.js pages — DO NOT TOUCH
├── components/       ← ALL react components — DO NOT TOUCH
├── lib/
│   ├── i18n.ts       ← translation strings — DO NOT TOUCH
│   ├── sahm.ts       ← Sahm API client — DO NOT TOUCH
│   ├── supabase/     ← database client setup — DO NOT TOUCH
│   └── types/        ← TypeScript types — DO NOT TOUCH
```

```
package.json        ← DO NOT TOUCH
next.config.ts      ← DO NOT TOUCH
tsconfig.json       ← DO NOT TOUCH
tailwind.config.ts  ← DO NOT TOUCH
.env.local          ← DO NOT TOUCH
```

---

## ✅ WHERE YOUR WORK LIVES

Create all your seed scripts in a dedicated folder:

```
scripts/
├── seed-companies.ts       ← You create this
├── seed-prices.ts          ← You create this
├── seed-financials.ts      ← You create this
├── seed-dividends.ts       ← You create this
├── seed-news.ts            ← You create this
├── seed-ownership.ts       ← You create this (optional, phase 2)
├── data/
│   ├── companies.json      ← Raw company list you compile
│   ├── prices/             ← Optional: cached price files per ticker
│   └── financials/         ← Optional: cached financial files per ticker
└── utils/
    ├── supabase.ts         ← Shared DB client for your scripts
    └── yahoo.ts            ← Yahoo Finance fetcher helper
```

---

## 🔌 DATABASE CONNECTION

```
SUPABASE_URL       = https://fszmvnmfazgjhsrbbpvx.supabase.co
SERVICE_ROLE_KEY   = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU
```

**ALWAYS use the service role key** (not the anon key). It bypasses RLS policies so you can insert without authentication. Never use the anon key for seed scripts.

```typescript
// scripts/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)
```

Run scripts with: `npx tsx scripts/seed-companies.ts`
Install tsx if needed: `npm install -D tsx`

---

## 📋 DATABASE — COMPLETE SCHEMA YOU WILL POPULATE

There are **6 tables** you need to populate. They are all connected by `company_id` (UUID). Here is how they relate:

```
companies (root table)
    ↓ company_id (UUID)
    ├── stock_prices   (one row per company per trading day)
    ├── financials     (one row per company per quarter/year)
    ├── dividends      (one row per company per dividend event)
    ├── ownership      (one row per company per snapshot date)
    └── news           (one row per article, linked to a company)
```

**The critical rule**: `company_id` is always the UUID from the `companies` table. Never hardcode UUIDs. Always look them up by `ticker` first.

---

## 📊 TABLE 1: `companies` (Do This First — Everything Depends On It)

### What the app uses this for:
- The screener page (lists all companies with sector/market filters)
- Every stock page (company name, sector, description, website, etc.)
- Bilingual display (name_ar in Arabic mode, name_en in English mode)

### Schema:
```sql
companies (
  id                   UUID PRIMARY KEY (auto-generated)
  ticker               TEXT UNIQUE NOT NULL    -- e.g. '2222'
  symbol               TEXT UNIQUE NOT NULL    -- e.g. '2222.SR'
  name_ar              TEXT NOT NULL           -- Arabic full name
  name_en              TEXT NOT NULL           -- English full name
  sector               TEXT NOT NULL           -- see sector list below
  sub_sector           TEXT                    -- optional
  market               'main' | 'nomu'         -- Tadawul main or Nomu (growth)
  is_shariah_compliant BOOLEAN DEFAULT false
  logo_url             TEXT                    -- CDN url to company logo
  description_ar       TEXT                    -- Arabic company description
  description_en       TEXT                    -- English company description
  website_url          TEXT
  employee_count       INTEGER
  founded_year         INTEGER
  ceo_name_ar          TEXT
  ceo_name_en          TEXT
)
```

### Data sources to fetch the full list:
1. **Tadawul Official** (primary): https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/list-listed-securities — download the full listed securities file (Excel/CSV)
2. **Argaam** (Arabic names + sectors): https://www.argaam.com/en/sector/market-overview — scrape or use their data for all 260+ tickers
3. **Sahm API** (if available): `https://app.sahmk.sa/api/v1/market/companies/` — check if this endpoint exists; use `X-API-Key: ` header (key is in `.env.local`)

### Target: ~260–270 companies (currently only ~50 are seeded)

### Sector names — use EXACTLY these strings (case-sensitive):
```
Energy
Banks
Materials
Telecommunication Services
Consumer Discretionary
Consumer Staples
Food & Beverages
Health Care Equipment & Services
Real Estate
Insurance
Utilities
Transportation
Media & Entertainment
Software & Services
Capital Goods
Retailing
Pharma
Diversified Financials
```

### Shariah compliance notes:
- Banks are generally NOT shariah-compliant EXCEPT: Al Rajhi (1120), Alinma (1150), AlBilad (1140), AlJazira (1020)
- Most other sectors ARE shariah-compliant
- For accuracy: https://www.saudiexchange.sa → Shariah-Compliant Securities list

### Upsert command (safe to re-run):
```typescript
await supabase.from('companies').upsert(companyObject, { onConflict: 'ticker' })
```

---

## 📈 TABLE 2: `stock_prices` (Highest Priority — Enables Charts)

### What the app uses this for:
- The price chart on every stock page (1W / 1M / 3M / 6M / 1Y / ALL periods)
- The screener's price and % change columns
- The dashboard's top gainers/losers cards

### Schema:
```sql
stock_prices (
  id             BIGINT (auto)
  company_id     UUID NOT NULL → companies.id
  date           DATE NOT NULL                -- trading day, e.g. '2025-01-02'
  open           DECIMAL NOT NULL DEFAULT 0   -- opening price in SAR
  high           DECIMAL NOT NULL DEFAULT 0   -- intraday high
  low            DECIMAL NOT NULL DEFAULT 0   -- intraday low
  close          DECIMAL NOT NULL DEFAULT 0   -- closing price ← MOST IMPORTANT
  volume         BIGINT  NOT NULL DEFAULT 0   -- shares traded
  adjusted_close DECIMAL NOT NULL DEFAULT 0   -- close adjusted for splits
  UNIQUE(company_id, date)
)
```

### How the screener calculates % change:
The screener page fetches the last 200 price rows across all companies and groups them by `company_id`. It takes the **latest date** as today's price and the **second most-recent date** as yesterday's price. The % change = `(today - yesterday) / yesterday * 100`. So you need at least 2 days of data per company for change to show. 1 year of daily data is ideal.

### Data source — Yahoo Finance (FREE, no API key needed):
```
URL: https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1y&interval=1d

Example: https://query1.finance.yahoo.com/v8/finance/chart/2222.SR?range=1y&interval=1d
```

### Yahoo Finance parser (copy this exactly):
```typescript
// scripts/utils/yahoo.ts
export async function fetchYahooPrices(symbol: string, range = '1y') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  if (!res.ok) throw new Error(`Yahoo fetch failed: ${res.status}`)
  const json = await res.json()

  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)

  const timestamps: number[] = result.timestamp
  const q = result.indicators.quote[0]

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open:           q.open[i]   ?? 0,
      high:           q.high[i]   ?? 0,
      low:            q.low[i]    ?? 0,
      close:          q.close[i]  ?? 0,
      volume:         q.volume[i] ?? 0,
      adjusted_close: q.close[i]  ?? 0,
    }))
    .filter(r => r.close > 0)  // filter out null/zero rows
}
```

### How to seed prices:
```typescript
// For each company ticker, e.g. '2222':
const { data: company } = await supabase
  .from('companies').select('id').eq('ticker', ticker).single()

const prices = await fetchYahooPrices(`${ticker}.SR`)  // note: append .SR

// Batch insert in chunks of 500 rows
for (let i = 0; i < prices.length; i += 500) {
  const batch = prices.slice(i, i + 500).map(p => ({ company_id: company.id, ...p }))
  await supabase.from('stock_prices').upsert(batch, { onConflict: 'company_id,date' })
}
```

### Rate limiting:
Yahoo Finance can get rate-limited. Add a 500ms delay between companies:
```typescript
await new Promise(resolve => setTimeout(resolve, 500))
```

### Priority — seed prices in this order (highest market cap first):
```
2222 (Aramco), 7010 (STC), 1120 (Al Rajhi Bank), 2010 (SABIC), 2082 (AlMawarid Bank),
1211 (Ma'aden), 9200 (Elm), 4030 (Saudi Kayan), 1150 (Alinma Bank), 2222 (done above),
... then continue with remaining ~250 companies
```

---

## 💰 TABLE 3: `financials` (Enables Metrics on Stock Pages)

### What the app uses this for:
- P/E ratio calculation: price ÷ EPS
- EPS, revenue, net income display on stock profile
- Book value for P/B calculation
- Debt/equity ratio, current ratio
- Financial history chart (future feature)

### How it works with the stock page:
Every stock page (`/en/stock/2222`) shows a metrics grid with: P/E, EPS, Revenue, Net Income, Dividend Yield, Market Cap. The P/E is calculated by the app as `currentPrice / financials.earnings_per_share`. Revenue and Net Income come directly from the financials table. If you don't populate this table, those metrics show "—".

### Schema:
```sql
financials (
  id                    UUID PRIMARY KEY (auto)
  company_id            UUID NOT NULL → companies.id
  period                'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'
  year                  INT NOT NULL                        -- e.g. 2024
  revenue               DECIMAL                            -- in SAR (full number, e.g. 1882000000000)
  net_income            DECIMAL                            -- in SAR
  total_assets          DECIMAL                            -- in SAR
  total_liabilities     DECIMAL                            -- in SAR
  earnings_per_share    DECIMAL                            -- EPS in SAR, e.g. 5.47
  book_value_per_share  DECIMAL                            -- BVPS in SAR
  operating_cash_flow   DECIMAL                            -- in SAR
  free_cash_flow        DECIMAL                            -- in SAR
  debt_to_equity        DECIMAL                            -- ratio, e.g. 0.25
  current_ratio         DECIMAL                            -- ratio, e.g. 1.8
  UNIQUE(company_id, period, year)
)
```

### Data sources for financials:
1. **Argaam** (best for all Tadawul companies): https://www.argaam.com/en/company/companyid/{COMPANY_ARGAAM_ID}/financial-results — has quarterly financials
2. **Tadawul disclosures**: https://www.saudiexchange.sa → Company page → Financial Reports
3. **Macrotrends** for major companies: https://www.macrotrends.net/stocks/charts/{TICKER}/saudi-aramco/revenue
4. **Yahoo Finance** (same API): check `key-statistics` or `financials` module

### Insert pattern:
```typescript
await supabase.from('financials').upsert({
  company_id: company.id,
  period: 'annual',
  year: 2024,
  revenue: 1882000000000,       // store in full SAR (not billions)
  net_income: 438000000000,
  earnings_per_share: 5.47,     // the most important field for P/E
  book_value_per_share: 24.5,
  total_assets: 2500000000000,
  total_liabilities: 900000000000,
  debt_to_equity: 0.35,
  current_ratio: 1.2,
}, { onConflict: 'company_id,period,year' })
```

### Minimum viable for stock pages:
At a minimum, insert the `annual` row for 2024 with just `earnings_per_share` filled in — that alone enables the P/E ratio on all stock pages.

---

## 📅 TABLE 4: `dividends` (Powers the Dividend Calendar Page)

### What the app uses this for:
- The `/en/calendar` page (shows upcoming ex-dividend dates)
- Dividend yield calculation on stock pages: `(total_annual_dividend / current_price) * 100`
- Dividend history section on individual stock pages

### Schema:
```sql
dividends (
  id                UUID PRIMARY KEY (auto)
  company_id        UUID NOT NULL → companies.id
  ex_date           DATE NOT NULL      -- key date: if you buy BEFORE this date, you get the dividend
  payment_date      DATE               -- when cash hits your account (can be null)
  amount_per_share  DECIMAL NOT NULL   -- dividend amount in SAR per share
  currency          TEXT DEFAULT 'SAR'
  UNIQUE(company_id, ex_date)
)
```

### Data sources:
1. **Tadawul** (official): https://www.saudiexchange.sa/wps/portal/saudiexchange/trading/market-statistics/corporate-actions/dividends
2. **Argaam**: https://www.argaam.com/en/dividends — full dividend history for all companies
3. **Sahm API**: check if `/dividends/` endpoint exists

### Insert pattern:
```typescript
await supabase.from('dividends').upsert({
  company_id: company.id,
  ex_date: '2024-09-15',
  payment_date: '2024-10-01',
  amount_per_share: 0.90,
  currency: 'SAR',
}, { onConflict: 'company_id,ex_date' })
```

### Key companies to prioritize for dividends:
Saudi Aramco (2222) pays quarterly. Al Rajhi Bank (1120), STC (7010), Saudi Tadawul Group (9200) also pay regular dividends.

---

## 📰 TABLE 5: `news` (Already Partially Working — Enhance It)

### What the app uses this for:
- The news feed on the dashboard homepage
- The `/en/news` page with all announcements
- Individual stock pages showing company-specific news

### Schema:
```sql
news (
  id              UUID PRIMARY KEY (auto)
  company_id      UUID → companies.id (NULL if general market news)
  title_ar        TEXT    -- Arabic headline
  title_en        TEXT    -- English headline
  body_ar         TEXT    -- Arabic article body (optional, can be null)
  body_en         TEXT    -- English article body (optional)
  source          TEXT NOT NULL    -- e.g. 'Argaam', 'CMA', 'Tadawul'
  source_url      TEXT NOT NULL    -- direct link to the original article
  sentiment_score DECIMAL          -- optional: -1 (negative) to +1 (positive)
  published_at    TIMESTAMPTZ NOT NULL
)
```

### Data sources:
1. **Tadawul announcements** (official regulatory filings): https://www.saudiexchange.sa/wps/portal/saudiexchange/trading/market-statistics/disclosure-and-announcements
2. **Argaam news**: https://www.argaam.com/en/article/articletype/index/filter/latest
3. **Sahm API**: https://app.sahmk.sa/api/v1/market/news/ — check if this endpoint exists

### Important: `company_id` can be NULL for general market news. For company-specific news (earnings announcements, dividend declarations), link to the company.

---

## 📦 TABLE 6: `ownership` (Optional — Phase 2)

### What it's for: Foreign ownership %, institutional %, government % per company.

```sql
ownership (
  company_id             UUID → companies.id
  date                   DATE
  foreign_percent        DECIMAL    -- e.g. 4.5 (for 4.5%)
  institutional_percent  DECIMAL
  government_percent     DECIMAL
  retail_percent         DECIMAL
  UNIQUE(company_id, date)
)
```

Source: Tadawul publishes foreign ownership data regularly. Not critical for MVP.

---

## 🏗️ NEW TABLE TO CREATE (Not in Schema Yet)

### `company_financials_quarterly` — already exists as `financials` above. No new tables needed.

### BUT: You should add one new table for **financial ratios history** if you want to show charts of P/E over time. This is phase 2:

```sql
-- Run this in Supabase SQL Editor when ready:
CREATE TABLE IF NOT EXISTS financial_ratios (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  pe_ratio          DECIMAL,
  pb_ratio          DECIMAL,
  ps_ratio          DECIMAL,
  ev_ebitda         DECIMAL,
  UNIQUE(company_id, date)
);
CREATE POLICY "financial_ratios_select" ON financial_ratios FOR SELECT USING (true);
ALTER TABLE financial_ratios ENABLE ROW LEVEL SECURITY;
```

Do NOT create this table yet — focus on the 5 primary tables first.

---

## 🏢 HOW COMPANY DATA MAPS TO THE UI

Here is exactly what each database field powers on the live site, using Saudi Aramco (2222) as the example:

### `/en/stock/2222` page shows:
```
Header:        companies.name_en + companies.name_ar + companies.ticker
Live price:    Sahm API (sahmk.sa) — your data is the fallback
Price chart:   stock_prices table (all rows for this company_id, ordered by date)
               → Chart will show "No price history yet" until you seed stock_prices
               → Supports 1W, 1M, 3M, 6M, 1Y, ALL period tabs
% change:      stock_prices (today.close - yesterday.close) / yesterday.close
52W High/Low:  stock_prices (max/min close over last 365 days)
P/E ratio:     current_price ÷ financials.earnings_per_share (latest annual row)
EPS:           financials.earnings_per_share
Revenue:       financials.revenue (formatted as billions)
Net Income:    financials.net_income (formatted as billions)
Market Cap:    current_price × total_shares (total_shares not in DB yet — Phase 2)
Div. Yield:    (dividends last 12 months total / current_price) × 100
Dividends tab: ALL rows in dividends table for this company_id, sorted by ex_date
Description:   companies.description_en (or description_ar in Arabic mode)
Sector badge:  companies.sector
Website:       companies.website_url
Employees:     companies.employee_count
CEO:           companies.ceo_name_en / ceo_name_ar
Shariah badge: companies.is_shariah_compliant
```

### `/en/screener` shows:
```
All companies:  companies table (all rows)
Price column:   stock_prices (latest close per company)
Change column:  stock_prices (two most recent rows per company → % diff)
Volume column:  stock_prices (latest row's volume)
Sector filter:  companies.sector dropdown
Shariah filter: companies.is_shariah_compliant = true
Search:         companies.name_en, name_ar, ticker
```

### `/en/calendar` shows:
```
All events:  dividends table + ipos table, sorted by date
Dividend:    dividends.ex_date, amount_per_share, + company name from companies
IPO:         ipos table (separate — you can seed this too)
```

### `/en` dashboard homepage shows:
```
TASI index:     Sahm API (live) — nothing to seed
Top movers:     Sahm API (live) — nothing to seed
                Fallback: stock_prices (last 2 rows per company → change%)
News feed:      news table, ordered by published_at DESC, limited to 4-8 rows
```

---

## 🗂️ YOUR EXECUTION PLAN

### Phase 1 — The Minimum Viable Data Set (DO THIS FIRST)

**Step 1: Seed all ~260 companies** (2-4 hours of work)
- Source: Download from Tadawul + cross-reference Argaam for Arabic names
- Fields required: ticker, symbol, name_en, name_ar, sector, market, is_shariah_compliant
- Script: `scripts/seed-companies.ts`
- Verify: Check Supabase dashboard → companies table should have 260+ rows

**Step 2: Seed 1 year of daily prices for ALL companies** (the big one — 4-8 hours)
- Source: Yahoo Finance API (free, no key needed)
- Symbol format: always `{TICKER}.SR` → e.g. `2222.SR`, `7010.SR`, `1120.SR`
- Get 1 year (`range=1y`) for every company
- Script: `scripts/seed-prices.ts` — loop over all tickers, fetch, batch upsert
- Add 500ms delay between requests to avoid rate limiting
- Verify: Stock pages should now show a price chart
- Verify: Screener should show prices and % change

**Step 3: Seed dividend data for dividend-paying companies** (2-3 hours)
- Source: Argaam + Tadawul dividends page
- At minimum: Aramco (2222), STC (7010), Al Rajhi (1120), SABIC (2010), Ma'aden (1211), Alinma (1150), Riyad Bank (1010)
- Aim for: all 5+ years of history per company
- Script: `scripts/seed-dividends.ts`
- Verify: Calendar page shows upcoming dividend dates

**Step 4: Seed annual financials for top 50 companies by market cap** (3-5 hours)
- Source: Argaam financial results pages + Yahoo Finance fundamentals
- Fields to focus on: `earnings_per_share` (for P/E) + `revenue` + `net_income`
- At minimum seed `period: 'annual'`, `year: 2024` for the top 50
- Script: `scripts/seed-financials.ts`
- Verify: Stock pages show P/E ratio and financial metrics

### Phase 2 — Enrichment (After Phase 1 is done)

- company `description_en` + `description_ar` for all 260 companies
- `employee_count`, `founded_year`, `website_url`, `ceo_name_en` for all companies
- Quarterly financials (Q1/Q2/Q3/Q4 not just annual) for top 100 companies
- Ownership data (foreign %, institutional %)
- News seeding from Argaam + Tadawul announcements
- IPO data for the calendar page

---

## 📡 DATA SOURCES SUMMARY

| Data | Source | URL | Auth needed? |
|------|---------|-----|-------------|
| Company list | Tadawul | saudiexchange.sa/listing | No (download PDF/Excel) |
| Arabic names + sectors | Argaam | argaam.com/en/sector/market-overview | No (scrape) |
| Shariah list | Tadawul | saudiexchange.sa → Shariah Securities | No |
| Daily price history | Yahoo Finance | query1.finance.yahoo.com/v8/finance/chart/{TICKER}.SR | No |
| Live quote | Sahm API | app.sahmk.sa/api/v1/quote/{ticker}/ | X-API-Key (in .env.local) |
| Quarterly financials | Argaam | argaam.com/en/company/... | No (scrape) |
| Dividend history | Argaam | argaam.com/en/dividends | No (scrape) |
| Dividend history | Tadawul | saudiexchange.sa/.../dividends | No |
| News / announcements | Tadawul | saudiexchange.sa/.../disclosure | No |
| IPO data | Argaam + Tadawul | argaam.com/en/ipo | No |

---

## 🔑 SAHM API (Live Data — Already Used by the App)

The app ALREADY calls the Sahm API for live prices and market movers. You don't need to change this.

```
Base URL:  https://app.sahmk.sa/api/v1
Auth:      X-API-Key header (key is in .env.local — do NOT expose it)
Limit:     5,000 requests per day

Key endpoints:
  GET /market/summary/                → TASI index, total volume, breadth
  GET /market/gainers/                → top gaining stocks today
  GET /market/losers/                 → top losing stocks today
  GET /market/companies/              → check if this endpoint exists for company list
  GET /quote/{ticker}/                → live quote for one company
```

---

## ⚙️ COMPLETE SEED SCRIPT TEMPLATE

Here is the full template. Copy this pattern for each table:

```typescript
// scripts/seed-prices.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

async function fetchYahooPrices(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) { console.error(`Yahoo failed: ${symbol} → ${res.status}`); return [] }
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) { console.error(`No data: ${symbol}`); return [] }
  const timestamps: number[] = result.timestamp
  const q = result.indicators.quote[0]
  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: q.open[i] ?? 0, high: q.high[i] ?? 0, low: q.low[i] ?? 0,
      close: q.close[i] ?? 0, volume: q.volume[i] ?? 0, adjusted_close: q.close[i] ?? 0,
    }))
    .filter(r => r.close > 0)
}

async function seedPricesForTicker(ticker: string) {
  // 1. Get company UUID
  const { data: company, error: err } = await supabase
    .from('companies').select('id').eq('ticker', ticker).single()
  if (err || !company) { console.log(`⚠️  Skip ${ticker}: not in DB`); return }

  // 2. Fetch Yahoo prices
  const prices = await fetchYahooPrices(`${ticker}.SR`)
  if (prices.length === 0) { console.log(`⚠️  No prices: ${ticker}`); return }

  // 3. Batch upsert in chunks of 500
  const rows = prices.map(p => ({ company_id: company.id, ...p }))
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('stock_prices')
      .upsert(batch, { onConflict: 'company_id,date' })
    if (error) console.error(`❌ ${ticker} batch ${i}: ${error.message}`)
    else console.log(`✅ ${ticker}: ${batch.length} rows → total ${i + batch.length}/${rows.length}`)
  }
}

async function main() {
  // Step 1: Get all tickers from DB (only seed companies that exist)
  const { data: companies } = await supabase
    .from('companies').select('ticker').order('ticker')
  if (!companies) { console.error('Cannot read companies table'); return }

  console.log(`📊 Seeding prices for ${companies.length} companies...`)

  for (const { ticker } of companies) {
    await seedPricesForTicker(ticker)
    await new Promise(r => setTimeout(r, 500)) // rate limit delay
  }

  console.log('✅ Done!')
}

main().catch(console.error)
```

---

## ✅ VERIFICATION CHECKLIST

After seeding, verify these work on the live site (https://suqaist.vercel.app):

- [ ] `/en/screener` — Shows 260+ companies, price column has numbers (not "—"), change column has % values
- [ ] `/en/stock/2222` — Price chart renders with data points (not "No price history yet")
- [ ] `/en/stock/7010` — Same chart test
- [ ] `/en/calendar` — Shows dividend events in the calendar
- [ ] `/ar/screener` — Arabic names display correctly in name column
- [ ] `/ar/stock/2222` — Arabic company name and description
- [ ] Stock page metrics grid — P/E ratio shows a number (not "—") if financials seeded

---

## 📌 FINAL NOTES

1. **All upserts are safe to re-run** — they update existing rows instead of duplicating. Run your scripts multiple times without worry.

2. **company_id is ALWAYS a UUID** — never hardcode it. Always look up by `ticker` first:
   ```typescript
   const { data } = await supabase.from('companies').select('id').eq('ticker', '2222').single()
   const companyId = data.id  // this is the UUID to use everywhere
   ```

3. **Stock symbols always end in `.SR`** for Yahoo Finance — `2222.SR`, `7010.SR`, etc.

4. **Numbers are stored in full SAR** — not in millions or billions. Aramco revenue is `1882000000000` not `1882`.

5. **Dates are always ISO format**: `'2025-01-15'` (YYYY-MM-DD)

6. **Batch size**: max 500 rows per Supabase upsert call. Split larger arrays.

7. **If Yahoo Finance returns 404 for a ticker**: the company may be delisted or use a different symbol. Skip it and log a warning.

8. **The app will automatically show the data** — you don't need to redeploy the website. As soon as rows are in the database, the next page load will show the new data.

---

## 🆘 QUESTIONS? WHAT TO ASK THE CTO

If you hit any issue, the CTO (Claude) needs:
- The exact error message from Supabase
- Which ticker caused the issue
- Which table you were inserting into
- The data object you tried to insert

Do NOT modify any app files to work around a data issue. Fix the data, not the code.

---

*Document version: 1.0 | Created for SŪQAI data agent*
