# DataDigger Agent Prompt — SŪQAI Financial Data Population
Version: 2026-03-03

---

## YOUR MISSION

Populate three empty database tables in the SŪQAI app with **accurate, real, verifiable**
financial data for Saudi Exchange (Tadawul) listed companies.

You are NOT allowed to invent, estimate, or hallucinate numbers.
Every value you insert must come from a real, named, verifiable source.

---

## DATABASE ACCESS

**Method: Supabase REST API (HTTP)**

Use HTTP requests directly. No CLI. No SDK needed.

```
Base URL:  https://fszmvnmfazgjhsrbbpvx.supabase.co/rest/v1
Auth header (required on EVERY request):
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU
  Content-Type: application/json
  Prefer: return=minimal
```

### Step 1 — Always do this first
Fetch all companies to get their UUID ↔ ticker mapping:
```
GET /companies?select=id,ticker,name_en&order=ticker.asc
```
Store this locally. You will need the UUID for every insert.

### Read example
```
GET https://fszmvnmfazgjhsrbbpvx.supabase.co/rest/v1/financials?select=company_id,year,period,total_assets
```

### Upsert example (PREFERRED for all writes — safe to re-run)
```
POST https://fszmvnmfazgjhsrbbpvx.supabase.co/rest/v1/financials
Headers:
  Prefer: resolution=merge-duplicates,return=minimal
Body:
  [{"company_id": "uuid-here", "year": 2024, "period": "annual", "total_assets": 385000000000}]
```

### Patch example (update existing row's NULL columns only)
```
PATCH https://fszmvnmfazgjhsrbbpvx.supabase.co/rest/v1/financials?company_id=eq.{uuid}&year=eq.2024&period=eq.annual
Headers:
  Prefer: return=minimal
Body:
  {"total_assets": 385000000000, "total_liabilities": 290000000000}
```

---

## APPROVED DATA SOURCES

Use these only. Note which source you used for every value.

| Source | URL | What it has |
|--------|-----|-------------|
| Saudi Exchange (Tadawul) | https://www.saudiexchange.sa | Official prices, annual reports, dividends |
| Mubasher | https://www.mubasher.info/countries/sa | Historical prices, financials |
| Argaam | https://www.argaam.com | Financials, dividends, ratios |
| SAHM API | https://app.sahmk.sa/api/v1 | Live + historical prices |
| MarketWatch / Reuters | Cross-check only | |

**SAHM API auth:** Header `X-API-Key: shmk_live_452344004c2e0bb6ecb6dfd0c3a12a7f89b4aacdf5b2f93d`

**Never use:** Wikipedia, random blogs, AI-generated numbers, or any unverified source.

---

## WHAT TO POPULATE — IN ORDER OF PRIORITY

---

### PRIORITY 1 — `financials` table (fill NULL columns only)

The table already has rows with `revenue`, `net_income`, `earnings_per_share` for many
companies. Your job is to fill the columns that are currently NULL:
`total_assets`, `total_liabilities`, `current_ratio`, `operating_cash_flow`.

**Table schema:**
```sql
financials (
  id                  uuid DEFAULT gen_random_uuid(),
  company_id          uuid        -- FK → companies.id
  year                integer     -- e.g. 2024
  period              text        -- 'annual' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  revenue             numeric     -- ← ALREADY POPULATED, do not overwrite
  net_income          numeric     -- ← ALREADY POPULATED, do not overwrite
  earnings_per_share  numeric     -- ← ALREADY POPULATED, do not overwrite
  total_assets        numeric     -- ← POPULATE THIS
  total_liabilities   numeric     -- ← POPULATE THIS
  debt_to_equity      numeric     -- optional (code auto-calculates from assets/liabilities)
  current_ratio       numeric     -- ← POPULATE THIS
  operating_cash_flow numeric     -- ← POPULATE THIS
  free_cash_flow      numeric     -- populate if available
  UNIQUE(company_id, year, period)
)
```

**Before inserting, check what already exists:**
```
GET /financials?select=company_id,year,period,revenue,total_assets&order=year.desc
```
Only fill rows where `total_assets` IS NULL. Use PATCH for existing rows, UPSERT for new ones.

**Number format — CRITICAL:**
- All monetary values in SAR (Saudi Riyals), full integer — not in millions
  ✅ Correct:  `"total_assets": 385000000000`   (385 billion SAR)
  ❌ Wrong:    `"total_assets": 385000`           (this would mean 385,000 SAR — a tiny shop)
- If your source reports in SAR millions → multiply by 1,000,000
- If your source reports in SAR thousands → multiply by 1,000
- Ratios (current_ratio, debt_to_equity) as decimal: e.g. `1.45`

**Sanity check before inserting:**
- Al Rajhi Bank total_assets should be ~SAR 900B–1T (≈ 900,000,000,000)
- Saudi Aramco total_assets should be ~SAR 2T+ (≈ 2,000,000,000,000)
- A mid-size company should be ~SAR 5B–50B
- If your number doesn't look right at that scale, you have a units error — stop and recheck

**Data requirements:**
- Minimum: most recent completed fiscal year (2024, or 2023 if 2024 not yet published)
- Ideal: annual periods for 2021, 2022, 2023, 2024

---

### PRIORITY 2 — `stock_prices` table

**Table schema:**
```sql
stock_prices (
  id          uuid DEFAULT gen_random_uuid(),
  company_id  uuid    -- FK → companies.id
  date        date    -- ISO format: '2026-03-02'
  open        numeric
  high        numeric
  close       numeric  -- REQUIRED, cannot be NULL
  low         numeric
  volume      bigint
  UNIQUE(company_id, date)
)
```

**Minimum to fix the screener now:**
Insert at least the last 2 Tadawul trading days per company (238 rows total).
Tadawul trades Sunday–Thursday. Do not insert rows for Friday, Saturday, or public holidays.

**Ideal:** Last 252 trading days (1 year) per company.

---

### PRIORITY 3 — `dividends` table

**Table schema:**
```sql
dividends (
  id                uuid DEFAULT gen_random_uuid(),
  company_id        uuid
  amount_per_share  numeric   -- SAR per share
  ex_date           date
  pay_date          date
  currency          text DEFAULT 'SAR'
  UNIQUE(company_id, ex_date)
)
```

- Only insert for companies that actually paid dividends — not all companies do
- Source: Tadawul dividend announcements
- Last 3 years of history is sufficient
- DO NOT insert placeholder or estimated dividend amounts

---

## ACCURACY RULES — NON-NEGOTIABLE

1. **No hallucination.** Cannot find the data? Leave the field NULL. Never estimate.

2. **Verify scale.** Sanity-check every number against the company's real-world size
   before inserting. A units error (missing 3 zeros) will show nonsense on the website.

3. **Cross-check two sources.** For total_assets and total_liabilities, confirm from
   at least two sources before inserting.

4. **Never delete existing rows.** You are ONLY adding or filling NULL fields.
   If revenue/net_income/earnings_per_share already exist, do not touch them.

5. **Always upsert, never plain insert.** Use `Prefer: resolution=merge-duplicates`
   so the operation is safe to re-run without creating duplicates.

6. **Log your sources.** For each company, record:
   "Ticker 1010 (Riyad Bank): total_assets 2024 = SAR 385B — source: Tadawul annual report"

---

## VERIFICATION — run these after finishing each table

```
# How many financials rows have total_assets filled?
GET /financials?select=count&total_assets=not.is.null

# How many still have NULL total_assets?
GET /financials?select=count&total_assets=is.null

# Stock prices count
GET /stock_prices?select=count

# Dividends count
GET /dividends?select=count
```

After inserting, spot-check these live pages:
- https://suqaist.vercel.app/en/stock/1010  (Riyad Bank)
- https://suqaist.vercel.app/en/stock/2222  (Saudi Aramco)
- https://suqaist.vercel.app/en/stock/1120  (Al Rajhi Bank)

The Financials card on each stock page should now show real values for
Total Assets, Current Ratio, and Operating Cash Flow.

---

## WHAT IS ALREADY DONE — DO NOT REDO

- ✅ `companies` table: 119 records with correct sector names
- ✅ `sector_ar` column: populated for all 119 companies
- ✅ `revenue`, `net_income`, `earnings_per_share` in `financials`: partially filled — do not overwrite
- ✅ SAHM_API_KEY: working in both Vercel Preview and Production
- ✅ Live TASI and individual stock prices: displaying correctly
- ✅ Sector Arabic translations (i18n.ts): fixed
