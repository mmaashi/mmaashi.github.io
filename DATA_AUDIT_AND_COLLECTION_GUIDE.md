# SŪQAI Data Audit & Collection Guide

## PART 1: DATA QUALITY AUDIT — Run These SQL Queries NOW

Run all queries below in Supabase SQL Editor to find data problems.

---

### 1.1 DIVIDENDS — Check for fake/uniform data

```sql
-- Are all amounts the same? (BAD if count is high for one value)
SELECT amount_per_share, COUNT(*) as cnt
FROM dividends
GROUP BY amount_per_share
ORDER BY cnt DESC
LIMIT 20;
```

```sql
-- Are all ex_dates the same? (BAD if one date dominates)
SELECT ex_date, COUNT(*) as cnt
FROM dividends
GROUP BY ex_date
ORDER BY cnt DESC
LIMIT 20;
```

```sql
-- Are all pay_dates the same?
SELECT pay_date, COUNT(*) as cnt
FROM dividends
GROUP BY pay_date
ORDER BY cnt DESC
LIMIT 20;
```

```sql
-- Check for NULL or zero amounts
SELECT COUNT(*) as total,
       COUNT(CASE WHEN amount_per_share IS NULL THEN 1 END) as null_amount,
       COUNT(CASE WHEN amount_per_share = 0 THEN 1 END) as zero_amount,
       COUNT(CASE WHEN ex_date IS NULL THEN 1 END) as null_ex_date,
       COUNT(CASE WHEN pay_date IS NULL THEN 1 END) as null_pay_date,
       COUNT(CASE WHEN company_id IS NULL THEN 1 END) as null_company_id,
       MIN(amount_per_share) as min_amount,
       MAX(amount_per_share) as max_amount,
       AVG(amount_per_share) as avg_amount
FROM dividends;
```

```sql
-- Sample 20 dividends with company names — do they look real?
SELECT c.ticker, c.name_en, d.amount_per_share, d.ex_date, d.pay_date, d.currency, d.year
FROM dividends d
JOIN companies c ON d.company_id = c.id
ORDER BY c.ticker, d.ex_date DESC
LIMIT 20;
```

```sql
-- Check: do companies have DIFFERENT dividend amounts? (should be YES)
SELECT c.ticker,
       COUNT(*) as div_count,
       COUNT(DISTINCT d.amount_per_share) as unique_amounts,
       MIN(d.amount_per_share) as min_div,
       MAX(d.amount_per_share) as max_div
FROM dividends d
JOIN companies c ON d.company_id = c.id
GROUP BY c.ticker
ORDER BY div_count DESC
LIMIT 30;
```

---

### 1.2 FINANCIALS — Check for fake/uniform data

```sql
-- Are revenues realistic? Check distribution
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN revenue IS NULL THEN 1 END) as null_revenue,
  COUNT(CASE WHEN revenue = 0 THEN 1 END) as zero_revenue,
  COUNT(CASE WHEN net_income IS NULL THEN 1 END) as null_net_income,
  MIN(revenue) as min_revenue,
  MAX(revenue) as max_revenue,
  AVG(revenue) as avg_revenue
FROM financials;
```

```sql
-- Check for duplicate year+period per company (should be 0)
SELECT company_id, year, period, COUNT(*) as cnt
FROM financials
GROUP BY company_id, year, period
HAVING COUNT(*) > 1
LIMIT 20;
```

```sql
-- Sample financials with company names
SELECT c.ticker, c.name_en, f.year, f.period,
       f.revenue, f.net_income, f.earnings_per_share,
       f.total_assets, f.total_liabilities, f.debt_to_equity,
       f.current_ratio, f.operating_cash_flow, f.free_cash_flow
FROM financials f
JOIN companies c ON f.company_id = c.id
ORDER BY c.ticker, f.year DESC, f.period DESC
LIMIT 30;
```

```sql
-- Are all EPS the same value? (BAD if so)
SELECT earnings_per_share, COUNT(*) as cnt
FROM financials
WHERE earnings_per_share IS NOT NULL
GROUP BY earnings_per_share
ORDER BY cnt DESC
LIMIT 20;
```

```sql
-- Basic sanity: net_income should be less than revenue for most companies
SELECT c.ticker, f.year, f.period, f.revenue, f.net_income
FROM financials f
JOIN companies c ON f.company_id = c.id
WHERE f.net_income > f.revenue AND f.revenue > 0
LIMIT 20;
```

---

### 1.3 COMPANIES — Check for missing critical fields

```sql
-- How many companies are missing key fields?
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN name_en IS NULL OR name_en = '' THEN 1 END) as missing_name_en,
  COUNT(CASE WHEN name_ar IS NULL OR name_ar = '' THEN 1 END) as missing_name_ar,
  COUNT(CASE WHEN sector IS NULL OR sector = '' THEN 1 END) as missing_sector,
  COUNT(CASE WHEN market IS NULL OR market = '' THEN 1 END) as missing_market,
  COUNT(CASE WHEN description_en IS NULL OR description_en = '' THEN 1 END) as missing_desc_en,
  COUNT(CASE WHEN description_ar IS NULL OR description_ar = '' THEN 1 END) as missing_desc_ar,
  COUNT(CASE WHEN website_url IS NULL OR website_url = '' THEN 1 END) as missing_website,
  COUNT(CASE WHEN logo_url IS NULL OR logo_url = '' THEN 1 END) as missing_logo,
  COUNT(CASE WHEN shares_outstanding IS NULL OR shares_outstanding = 0 THEN 1 END) as missing_shares
FROM companies;
```

```sql
-- Companies with NO financials at all
SELECT c.ticker, c.name_en
FROM companies c
LEFT JOIN financials f ON f.company_id = c.id
WHERE f.id IS NULL
ORDER BY c.ticker
LIMIT 50;
```

```sql
-- Companies with NO dividends (some is normal, but check count)
SELECT COUNT(*) as companies_without_dividends
FROM companies c
LEFT JOIN dividends d ON d.company_id = c.id
WHERE d.id IS NULL;
```

```sql
-- Companies with NO stock prices
SELECT c.ticker, c.name_en
FROM companies c
LEFT JOIN stock_prices sp ON sp.company_id = c.id
WHERE sp.id IS NULL
ORDER BY c.ticker
LIMIT 50;
```

---

### 1.4 STOCK PRICES — Check data quality

```sql
-- Date range and gaps
SELECT
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(DISTINCT date) as unique_dates,
  COUNT(*) as total_rows
FROM stock_prices;
```

```sql
-- Are prices realistic for Saudi market? (most stocks are 5-500 SAR)
SELECT
  COUNT(CASE WHEN close <= 0 THEN 1 END) as negative_or_zero,
  COUNT(CASE WHEN close > 1000 THEN 1 END) as above_1000,
  MIN(close) as min_price,
  MAX(close) as max_price,
  AVG(close) as avg_price
FROM stock_prices;
```

```sql
-- Check for duplicate dates per company (should be 0)
SELECT company_id, date, COUNT(*) as cnt
FROM stock_prices
GROUP BY company_id, date
HAVING COUNT(*) > 1
LIMIT 20;
```

---

### 1.5 NEWS — Check quality

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN title_en IS NULL OR title_en = '' THEN 1 END) as missing_title_en,
  COUNT(CASE WHEN title_ar IS NULL OR title_ar = '' THEN 1 END) as missing_title_ar,
  COUNT(CASE WHEN body_en IS NULL OR body_en = '' THEN 1 END) as missing_body_en,
  COUNT(CASE WHEN source_url IS NULL OR source_url = '' THEN 1 END) as missing_source,
  COUNT(CASE WHEN published_at IS NULL THEN 1 END) as missing_date,
  MIN(published_at) as oldest_news,
  MAX(published_at) as newest_news
FROM news;
```

---

### 1.6 CROSS-TABLE INTEGRITY

```sql
-- Orphaned records: dividends pointing to non-existent companies
SELECT d.id, d.company_id
FROM dividends d
LEFT JOIN companies c ON d.company_id = c.id
WHERE c.id IS NULL;
```

```sql
-- Orphaned financials
SELECT f.id, f.company_id
FROM financials f
LEFT JOIN companies c ON f.company_id = c.id
WHERE c.id IS NULL;
```

```sql
-- Orphaned stock_prices
SELECT COUNT(*) as orphaned_prices
FROM stock_prices sp
LEFT JOIN companies c ON sp.company_id = c.id
WHERE c.id IS NULL;
```

---

## PART 2: WHAT CORRECT DATA LOOKS LIKE

### 2.1 DIVIDENDS — Real Tadawul Examples

Saudi companies have DIFFERENT dividend amounts. Here are real examples:

| Ticker | Company | Amount/Share (SAR) | Frequency | Notes |
|--------|---------|-------------------|-----------|-------|
| 2222 | Saudi Aramco | 0.3263 | Quarterly | Largest company |
| 1180 | Al Rajhi Bank | 1.00 - 4.60 | Semi-annual | Varies by year |
| 2010 | SABIC | 1.50 - 6.00 | Semi-annual | Varies significantly |
| 1010 | Riyad Bank | 0.50 - 1.80 | Annual/Semi | |
| 2350 | Saudi Kayan | 0.00 - 2.50 | Annual | Sometimes no dividend |
| 7010 | STC | 1.00 - 4.00 | Semi-annual | |
| 2020 | SAFCO | 2.00 - 10.00 | Semi-annual | High variation |

**KEY RULES:**
- amount_per_share varies per company AND per period (not all the same!)
- ex_date is different for each payment event (not all same date!)
- pay_date is typically 10-30 days after ex_date
- Most Saudi companies pay Semi-annually (H1 and H2) or Quarterly
- Some companies pay nothing in bad years
- Currency should always be "SAR"

### 2.2 FINANCIALS — What Real Data Looks Like

Financial data varies MASSIVELY between companies:

| Ticker | Revenue (SAR) | Net Income | EPS | Debt/Equity |
|--------|--------------|------------|-----|-------------|
| 2222 (Aramco) | ~500B+ | ~100B+ | ~2-6 | 0.1-0.3 |
| 1180 (Al Rajhi) | ~25B | ~10-17B | ~4-7 | N/A (bank) |
| 2010 (SABIC) | ~100-180B | ~5-25B | ~1-8 | 0.3-0.8 |
| 7010 (STC) | ~60-70B | ~10-13B | ~2-2.5 | 0.3-0.6 |
| Small caps | ~100M-5B | ~10M-500M | ~0.1-3 | varies |

**KEY RULES:**
- Revenue, net_income in SAR (full amount, not millions)
- Each company should have data for multiple years (ideally 3-5 years)
- period should be "Q1", "Q2", "Q3", "Q4", "H1", "H2", or "FY"
- year should be a 4-digit year like 2023, 2024
- EPS is typically 0.01 to 10 SAR for most Saudi companies
- total_assets and total_liabilities should make logical sense (assets >= liabilities for healthy companies)
- debt_to_equity: 0 = no debt, 0.5 = moderate, >2 = highly leveraged

### 2.3 STOCK PRICES — Expected Ranges

- Most Tadawul stocks trade between 5 SAR and 500 SAR
- Aramco (2222) trades around 25-40 SAR
- Open, High, Low, Close should all be in the same range for a given day
- High >= Open, Close, Low; Low <= Open, Close, High
- Volume: typically 100K to 50M shares per day for active stocks
- Dates should cover trading days only (no weekends — Saudi market is Sun-Thu)
- adjusted_close can be NULL or equal to close if no adjustments

### 2.4 COMPANIES — Required Fields for App Features

These fields are CRITICAL for the app to work properly:

| Field | Required? | Used For | Example |
|-------|-----------|----------|---------|
| ticker | YES | URL, display | "2222", "1180" |
| name_en | YES | English display | "Saudi Aramco" |
| name_ar | YES | Arabic display | "أرامكو السعودية" |
| sector | YES | Screener, Heat Map | "Energy", "Banking" |
| market | YES | Filtering | "Tadawul", "Nomu" |
| is_shariah_compliant | YES | Shariah filter | true/false |
| description_en | Important | Stock page info tab | 2-3 sentences about the company |
| description_ar | Important | Arabic info tab | Arabic version |
| shares_outstanding | Important | Market cap calculation | e.g., 200000000000 (Aramco) |
| website_url | Nice to have | Info tab link | "https://www.aramco.com" |
| employee_count | Nice to have | Info tab | Integer |
| founded_year | Nice to have | Info tab | 1933 |
| ceo_name_en | Nice to have | Info tab | "Amin H. Nasser" |
| ceo_name_ar | Nice to have | Info tab | Arabic name |
| logo_url | Nice to have | Display | URL to logo image |

---

## PART 3: DATA COLLECTION INSTRUCTIONS FOR AGENT

### Step 1: CLEAN BAD DATA FIRST

Before collecting new data, delete the fake records:

```sql
-- Check how many records have the fake 2.2 amount
SELECT COUNT(*) FROM dividends WHERE amount_per_share = 2.2;

-- If ALL or MOST records are 2.2, truncate and reload
-- TRUNCATE TABLE dividends;
-- (only run truncate after confirming the data is fake)
```

### Step 2: COLLECT REAL DIVIDEND DATA

**Source:** Tadawul official website (https://www.saudiexchange.sa), company annual reports, or financial data APIs like Argaam, Mubasher, etc.

For each dividend record, you need:
```json
{
  "company_id": "<UUID of the company in companies table>",
  "ex_date": "YYYY-MM-DD",
  "pay_date": "YYYY-MM-DD",
  "record_date": "YYYY-MM-DD",
  "amount_per_share": <decimal number>,
  "currency": "SAR",
  "year": <4-digit year>
}
```

**VALIDATION BEFORE INSERT:**
- amount_per_share MUST vary between companies
- ex_date MUST be different for different payment periods
- pay_date should be AFTER ex_date (typically 10-30 days)
- Each company-year should have 1-4 dividend records max (annual, semi-annual, or quarterly)
- Check the company exists: `SELECT id FROM companies WHERE ticker = '2222'`

### Step 3: COLLECT REAL FINANCIAL DATA

**Source:** Tadawul disclosures, company quarterly/annual reports, Argaam, etc.

For each financial record:
```json
{
  "company_id": "<UUID>",
  "period": "Q1|Q2|Q3|Q4|H1|H2|FY",
  "year": 2024,
  "revenue": <SAR amount>,
  "net_income": <SAR amount>,
  "total_assets": <SAR amount>,
  "earnings_per_share": <SAR per share>,
  "debt_to_equity": <ratio>,
  "total_liabilities": <SAR amount>,
  "equity": <SAR amount>,
  "book_value_per_share": <SAR>,
  "operating_cash_flow": <SAR>,
  "free_cash_flow": <SAR>,
  "current_ratio": <ratio>,
  "pe_ratio": <ratio>,
  "pb_ratio": <ratio>,
  "roe": <percentage as decimal, e.g. 0.15 for 15%>
}
```

**VALIDATION BEFORE INSERT:**
- revenue and net_income must be realistic (not all same value)
- total_assets >= total_liabilities (for solvent companies)
- EPS should roughly equal net_income / shares_outstanding
- No duplicate (company_id, year, period) combinations
- Check: revenue is NOT in millions/billions — use full SAR amounts
- OR if using millions, be CONSISTENT across all companies

### Step 4: COLLECT REAL STOCK PRICES

**Source:** Tadawul API, Yahoo Finance (with .SR suffix), Alpha Vantage, etc.

For each price record:
```json
{
  "company_id": "<UUID>",
  "date": "YYYY-MM-DD",
  "open": <SAR>,
  "high": <SAR>,
  "low": <SAR>,
  "close": <SAR>,
  "volume": <integer>,
  "adjusted_close": <SAR or NULL>
}
```

**VALIDATION:**
- high >= max(open, close, low)
- low <= min(open, close, high)
- No weekend dates (Saudi market: Sun-Thu)
- No duplicate (company_id, date) pairs
- Volume should be > 0 for trading days

### Step 5: VERIFY AFTER LOADING

After loading data, run ALL queries from Part 1 again to verify:
- Different amounts across companies
- Realistic value ranges
- No orphaned records
- No duplicates
- Proper date ranges

---

## PART 4: APP FEATURES THAT DEPEND ON GOOD DATA

| Feature | Tables Used | What Breaks with Bad Data |
|---------|------------|--------------------------|
| Dividend Calendar | dividends + companies | All same amount (current bug) |
| SŪQAI Score | financials + stock_prices + dividends | Wrong scores = misleading users |
| Financial Charts | financials | Flat lines if all values equal |
| Sector Heat Map | companies + stock_prices | Missing sectors = empty map |
| Stock Page - Overview | ALL tables | Incorrect P/E, yield, margins |
| Stock Page - Dividends tab | dividends | Wrong dividend history |
| Stock Page - Financials tab | financials | Wrong revenue/income charts |
| Stock Page - News tab | news | Missing or outdated articles |
| Screener | companies + financials + stock_prices | Wrong filtering results |

---

## SUMMARY

**The problem is NOT the code. The code is correct.**
**The problem is the DATA — your agent inserted placeholder/fake data.**

Evidence:
- ALL dividends show amount_per_share = 2.2 (should vary from 0.10 to 10+ SAR)
- ALL dividends show ex_date = 2026-06-15 (should span multiple years)
- This makes the calendar useless and the SŪQAI scores unreliable

**Action required:** Run the audit queries, share results, then reload with REAL data from official Tadawul sources.
