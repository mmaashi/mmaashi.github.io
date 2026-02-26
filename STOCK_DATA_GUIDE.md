# SŪQAI — Stock Data Upload Guide

## Overview

This guide tells your agent exactly how to populate the SŪQAI Supabase database with all Tadawul stock data. There are **4 tables** to fill:

1. **`companies`** — All ~260 Tadawul-listed companies (currently only ~50 seeded)
2. **`stock_prices`** — Historical daily OHLCV data (currently empty — this is why charts show "No price history yet")
3. **`financials`** — Quarterly/annual financials per company
4. **`dividends`** — Dividend history per company

---

## Connection Details

```
SUPABASE_URL = https://fszmvnmfazgjhsrbbpvx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU
```

Use the **service role key** (not the anon key) so you can bypass RLS policies for inserts.

---

## Step 1: Seed ALL Companies

The `companies` table currently has ~50 rows. Tadawul has ~260+ listed companies. You need to upsert the remaining ones.

### Table Schema

```sql
companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker          TEXT UNIQUE NOT NULL,       -- e.g. '2222'
  symbol          TEXT UNIQUE NOT NULL,       -- e.g. '2222.SR'
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_zh         TEXT,                       -- optional
  sector          TEXT NOT NULL,
  sub_sector      TEXT,
  market          'main' | 'nomu',
  is_shariah_compliant BOOLEAN DEFAULT false,
  website_url     TEXT,
  employee_count  INTEGER,
  founded_year    INTEGER,
  description_ar  TEXT,
  description_en  TEXT
)
```

### How to Insert

Use upsert with `onConflict: 'ticker'` so existing rows get updated instead of duplicated:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
)

// Upsert one company at a time
const { error } = await supabase
  .from('companies')
  .upsert({
    ticker: '2222',
    symbol: '2222.SR',
    name_en: 'Saudi Aramco',
    name_ar: 'أرامكو السعودية',
    sector: 'Energy',
    market: 'main',
    is_shariah_compliant: true,
    website_url: 'https://www.aramco.com',
    description_en: 'Saudi Aramco is the world\'s largest oil company...',
    description_ar: 'أرامكو السعودية أكبر شركة نفط في العالم...',
  }, { onConflict: 'ticker' })
```

### Where to Get the Full Company List

- **Tadawul website**: https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/list-listed-securities
- **CMA (Capital Market Authority)**: https://cma.org.sa
- **Sahm API** (if it has a companies endpoint — check their docs)
- **Argaam**: https://www.argaam.com/en/sector/market-overview (has all tickers with Arabic names)

### Sector Names Used in the App

These are the sector names currently in the DB. Use the same strings for consistency:

```
Energy, Banks, Materials, Telecommunication Services, Consumer Discretionary,
Consumer Staples, Food & Beverages, Health Care Equipment & Services,
Real Estate, Insurance, Utilities, Transportation, Media & Entertainment,
Software & Services
```

### Shariah Compliance

Mark banks as `is_shariah_compliant: false` UNLESS they are Islamic banks (Al Rajhi, Alinma, AlBilad, AlJazira are shariah-compliant). Most non-bank companies on Tadawul are shariah-compliant. For accuracy, check the Tadawul "Shariah-Compliant Securities" list published periodically.

---

## Step 2: Seed Stock Prices (CRITICAL — This Enables Charts)

The `stock_prices` table is what powers the price chart on each stock page. It is currently **empty** for most companies, which is why the chart shows "No price history yet."

### Table Schema

```sql
stock_prices (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     UUID NOT NULL REFERENCES companies(id),
  date           DATE NOT NULL,
  open           DECIMAL NOT NULL DEFAULT 0,
  high           DECIMAL NOT NULL DEFAULT 0,
  low            DECIMAL NOT NULL DEFAULT 0,
  close          DECIMAL NOT NULL DEFAULT 0,
  volume         BIGINT  NOT NULL DEFAULT 0,
  adjusted_close DECIMAL NOT NULL DEFAULT 0,
  UNIQUE(company_id, date)
)
```

### How to Insert

You need the `company_id` (UUID) from the `companies` table. First look up the company, then insert prices:

```typescript
// Step A: Get the company UUID by ticker
const { data: company } = await supabase
  .from('companies')
  .select('id')
  .eq('ticker', '2222')
  .single()

if (!company) throw new Error('Company not found')

// Step B: Insert price rows (batch of up to 1000 at a time)
const priceRows = [
  { company_id: company.id, date: '2025-01-02', open: 28.50, high: 28.90, low: 28.30, close: 28.75, volume: 12500000, adjusted_close: 28.75 },
  { company_id: company.id, date: '2025-01-05', open: 28.80, high: 29.10, low: 28.60, close: 29.00, volume: 11200000, adjusted_close: 29.00 },
  // ... more rows ...
]

const { error } = await supabase
  .from('stock_prices')
  .upsert(priceRows, { onConflict: 'company_id,date' })
```

### Where to Get Historical Price Data

- **Yahoo Finance**: `https://query1.finance.yahoo.com/v8/finance/chart/2222.SR?range=1y&interval=1d` — free, gives 1 year of daily data
- **Investing.com**: Has Tadawul historical data
- **Sahm API**: Check if there's a `/quote/{ticker}/history` endpoint
- **Tadawul**: The exchange publishes end-of-day data

### Recommended Approach

For each company:
1. Fetch at least **1 year of daily prices** (~250 trading days)
2. Batch insert in chunks of 500-1000 rows
3. The chart component already handles 1W, 1M, 3M, 6M, 1Y, ALL periods

### Minimum Required Fields

At a minimum you need: `company_id`, `date`, `close`, `volume`. The open/high/low can default to 0 if unavailable, but `close` and `volume` are essential for the chart.

---

## Step 3: Seed Financials (Optional but Nice)

This populates the financial metrics shown on stock pages.

### Table Schema

```sql
financials (
  id                    UUID PRIMARY KEY,
  company_id            UUID NOT NULL REFERENCES companies(id),
  period                'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual',
  year                  INT NOT NULL,
  revenue               DECIMAL,
  net_income            DECIMAL,
  earnings_per_share    DECIMAL,
  book_value_per_share  DECIMAL,
  total_assets          DECIMAL,
  total_liabilities     DECIMAL,
  operating_cash_flow   DECIMAL,
  free_cash_flow        DECIMAL,
  debt_to_equity        DECIMAL,
  current_ratio         DECIMAL,
  UNIQUE(company_id, period, year)
)
```

### How to Insert

```typescript
const { error } = await supabase
  .from('financials')
  .upsert({
    company_id: company.id,
    period: 'annual',
    year: 2024,
    revenue: 1882000000000,    // in SAR (Saudi Aramco ~1.88T)
    net_income: 438000000000,
    earnings_per_share: 5.47,
    book_value_per_share: 24.5,
    debt_to_equity: 0.25,
  }, { onConflict: 'company_id,period,year' })
```

### Data Sources

- **Argaam**: https://www.argaam.com (has quarterly financials for all Tadawul companies)
- **Tadawul disclosures**: Companies publish quarterly reports
- **Saudi CMA filings**

---

## Step 4: Seed Dividends (Optional)

### Table Schema

```sql
dividends (
  id                UUID PRIMARY KEY,
  company_id        UUID NOT NULL REFERENCES companies(id),
  ex_date           DATE NOT NULL,
  payment_date      DATE,
  amount_per_share  DECIMAL NOT NULL,
  currency          TEXT DEFAULT 'SAR',
  UNIQUE(company_id, ex_date)
)
```

### How to Insert

```typescript
const { error } = await supabase
  .from('dividends')
  .upsert({
    company_id: company.id,
    ex_date: '2024-09-15',
    payment_date: '2024-10-01',
    amount_per_share: 0.90,
    currency: 'SAR',
  }, { onConflict: 'company_id,ex_date' })
```

---

## Quick-Start Script Template

Here's a complete Node.js script your agent can adapt. Save it as `seed-all.ts` and run with `npx tsx seed-all.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// ─── 1. Upsert Companies ─────────────────────────────────
async function seedCompanies(companies: any[]) {
  for (const co of companies) {
    const { error } = await supabase
      .from('companies')
      .upsert(co, { onConflict: 'ticker' })
    if (error) console.error(`❌ ${co.ticker}: ${error.message}`)
    else console.log(`✅ ${co.ticker} ${co.name_en}`)
  }
}

// ─── 2. Seed Prices for One Company ──────────────────────
async function seedPrices(ticker: string, prices: any[]) {
  // Look up company_id
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('ticker', ticker)
    .single()

  if (!company) {
    console.error(`❌ Company ${ticker} not found in DB`)
    return
  }

  // Add company_id to each row
  const rows = prices.map(p => ({
    company_id: company.id,
    date: p.date,
    open: p.open ?? 0,
    high: p.high ?? 0,
    low: p.low ?? 0,
    close: p.close,
    volume: p.volume ?? 0,
    adjusted_close: p.adjusted_close ?? p.close,
  }))

  // Insert in batches of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('stock_prices')
      .upsert(batch, { onConflict: 'company_id,date' })
    if (error) console.error(`❌ Prices for ${ticker} batch ${i}: ${error.message}`)
    else console.log(`✅ ${ticker}: inserted ${batch.length} price rows`)
  }
}

// ─── 3. Seed Financials ──────────────────────────────────
async function seedFinancials(ticker: string, financials: any[]) {
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('ticker', ticker)
    .single()

  if (!company) return

  for (const fin of financials) {
    const { error } = await supabase
      .from('financials')
      .upsert({ company_id: company.id, ...fin }, { onConflict: 'company_id,period,year' })
    if (error) console.error(`❌ Financials ${ticker} ${fin.year}: ${error.message}`)
  }
}

// ─── 4. Seed Dividends ───────────────────────────────────
async function seedDividends(ticker: string, dividends: any[]) {
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('ticker', ticker)
    .single()

  if (!company) return

  for (const div of dividends) {
    const { error } = await supabase
      .from('dividends')
      .upsert({ company_id: company.id, ...div }, { onConflict: 'company_id,ex_date' })
    if (error) console.error(`❌ Dividend ${ticker} ${div.ex_date}: ${error.message}`)
  }
}

// ─── Main ────────────────────────────────────────────────
async function main() {
  // YOUR AGENT: Replace these arrays with real data
  // fetched from Yahoo Finance, Argaam, Tadawul, etc.

  const companies = [
    // Example format:
    { ticker: '2222', symbol: '2222.SR', name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
    // ... add ALL ~260 companies ...
  ]

  await seedCompanies(companies)

  // Then for each company, fetch and seed prices:
  // const prices2222 = await fetchYahooFinancePrices('2222.SR', '1y')
  // await seedPrices('2222', prices2222)

  console.log('Done!')
}

main()
```

---

## Priority Order

1. **Companies** — Seed all ~260 first (everything else depends on company_id)
2. **Stock prices** — This is the #1 most impactful data to add. It enables charts on every stock page. Start with the top 50 by market cap, then expand.
3. **Dividends** — Powers the dividend calendar page
4. **Financials** — Powers the metrics on stock pages (P/E, EPS, etc.)

---

## Yahoo Finance Quick Fetch (Easiest Free Source)

For price data, Yahoo Finance is the easiest free API:

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1y&interval=1d

Example: https://query1.finance.yahoo.com/v8/finance/chart/2222.SR?range=1y&interval=1d
```

Response contains arrays: `timestamp[]`, `open[]`, `high[]`, `low[]`, `close[]`, `volume[]`

Parse like this:

```typescript
async function fetchYahooPrices(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`
  const res = await fetch(url)
  const json = await res.json()
  const result = json.chart.result[0]
  const timestamps = result.timestamp
  const quotes = result.indicators.quote[0]

  return timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open: quotes.open[i],
    high: quotes.high[i],
    low: quotes.low[i],
    close: quotes.close[i],
    volume: quotes.volume[i],
  }))
}
```

---

## Notes

- All upserts are **safe to re-run** — they update existing rows instead of duplicating
- The `company_id` is a UUID auto-generated by Supabase — always look it up by `ticker` first
- Batch inserts of 500-1000 rows are efficient for Supabase
- The Supabase free tier has no row limits, but keep inserts under 5MB per request
- For the symbols, always use the format `{TICKER}.SR` (e.g., `2222.SR`)
