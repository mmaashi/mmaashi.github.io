# SŪQAI — Agent Data Collection Instructions

## THE PROBLEM

The current database has FAKE data. Evidence:
- All 722 dividends show amount = 2.2 SAR and date = 2026-06-15
- Financials may have uniform/generated values
- Many companies missing Arabic names, sectors, descriptions
- News has no English translations

**This document tells the agent EXACTLY what to do to fix it.**

---

## PHASE 1: DELETE FAKE DATA (Do This First)

```sql
-- Step 1: Check how bad it is
SELECT amount_per_share, COUNT(*) FROM dividends GROUP BY amount_per_share ORDER BY COUNT(*) DESC LIMIT 5;
SELECT ex_date, COUNT(*) FROM dividends GROUP BY ex_date ORDER BY COUNT(*) DESC LIMIT 5;

-- Step 2: If most/all dividends are fake (same value), delete them
TRUNCATE TABLE dividends;

-- Step 3: Check financials too
SELECT earnings_per_share, COUNT(*) FROM financials GROUP BY earnings_per_share ORDER BY COUNT(*) DESC LIMIT 10;
SELECT revenue, COUNT(*) FROM financials WHERE revenue IS NOT NULL GROUP BY revenue ORDER BY COUNT(*) DESC LIMIT 10;

-- Step 4: If financials are also fake, delete them
-- TRUNCATE TABLE financials;
-- (only if confirmed fake)
```

---

## PHASE 2: GET REAL DATA — Priority Order

### Priority 1: REAL Dividend Data (Most Visible Bug)

**Source Options (try in order):**

1. **StockAnalysis.com** — FREE, has real Tadawul dividend data
   - URL pattern: `https://stockanalysis.com/quote/tadawul/{TICKER}/dividend/`
   - Example: https://stockanalysis.com/quote/tadawul/2222/dividend/ (Aramco)
   - Has: ex-date, pay date, amount, frequency, yield
   - Scrape or manually extract for top 50 companies first

2. **Saudi Exchange Official** — FREE dividend calendar
   - https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-financial-calendars/dividends
   - Has real ex-dates, pay dates, amounts
   - Limited to recent/upcoming dividends

3. **Argaam.com** — Arabic financial data
   - https://www.argaam.com/en
   - Has dividend history for Saudi companies

4. **Yahoo Finance** — Historical data
   - Ticker format: `{TICKER}.SR` (e.g., `2222.SR` for Aramco)
   - Has some dividend data but may be incomplete for Saudi stocks

**What to collect per dividend record:**
```
company_id: (lookup from companies table using ticker)
ex_date: YYYY-MM-DD (the actual date, NOT a made-up future date)
pay_date: YYYY-MM-DD (typically 10-30 days after ex_date)
record_date: YYYY-MM-DD (usually 1-2 days after ex_date)
amount_per_share: decimal (REAL amount from source — varies per company!)
currency: "SAR"
year: integer (the fiscal year this dividend belongs to)
```

**VALIDATION RULES — MUST CHECK BEFORE INSERT:**
- [ ] amount_per_share is different across companies
- [ ] ex_date is different across payment events
- [ ] pay_date is AFTER ex_date
- [ ] company_id exists in companies table
- [ ] No duplicate (company_id, ex_date) pairs
- [ ] Amount is realistic: 0.05 to 15.00 SAR range for most companies

**Real examples to verify against:**
| Ticker | Company | Typical Dividend | Frequency |
|--------|---------|-----------------|-----------|
| 2222 | Aramco | ~0.33-0.49 SAR | Quarterly |
| 1180 | Al Rajhi | ~1.00-4.60 SAR | Semi-annual |
| 2010 | SABIC | ~1.50-6.00 SAR | Semi-annual |
| 7010 | STC | ~1.00-4.00 SAR | Semi-annual |
| 1120 | Al Rajhi REIT | ~0.20-0.50 SAR | Quarterly |
| 2020 | SAFCO | ~2.00-10.00 SAR | Semi-annual |

### Priority 2: REAL Financial Data

**Source Options:**

1. **StockAnalysis.com** — Has income statement, balance sheet, cash flow
   - URL: `https://stockanalysis.com/quote/tadawul/{TICKER}/financials/`
   - FREE tier available

2. **Financial Modeling Prep (FMP) API** — Free tier: 250 requests/day
   - https://site.financialmodelingprep.com/developer/docs
   - Has Tadawul stocks
   - Endpoint: `/api/v3/income-statement/TADAWUL:{TICKER}`

3. **Argaam.com** — Arabic + English financials

**What to collect per financial record:**
```
company_id: (lookup from companies table)
period: "Q1", "Q2", "Q3", "Q4", "H1", "H2", or "FY"
year: 2024, 2023, 2022, etc.
revenue: SAR (full amount, NOT in millions unless you're consistent)
net_income: SAR
total_assets: SAR
earnings_per_share: SAR per share
debt_to_equity: ratio (e.g., 0.45)
total_liabilities: SAR
equity: SAR
book_value_per_share: SAR
operating_cash_flow: SAR
free_cash_flow: SAR
current_ratio: ratio (e.g., 1.5)
pe_ratio: ratio (e.g., 15.2)
pb_ratio: ratio (e.g., 2.1)
roe: decimal (e.g., 0.15 for 15%)
```

**VALIDATION RULES:**
- [ ] revenue varies between companies (Aramco ~500B vs small cap ~100M)
- [ ] total_assets >= total_liabilities (for non-bankrupt companies)
- [ ] EPS ≈ net_income / shares_outstanding
- [ ] No duplicate (company_id, year, period)
- [ ] At least 2-3 years of data per company
- [ ] Numbers are in CONSISTENT units (all full SAR, or all in thousands — pick one and document it)

### Priority 3: Fix Company Master Data

Many companies are missing critical fields. Fix the companies table:

```sql
-- Find companies missing Arabic names
SELECT ticker, name_en FROM companies
WHERE name_ar IS NULL OR name_ar = ''
ORDER BY ticker;

-- Find companies missing sectors
SELECT ticker, name_en FROM companies
WHERE sector IS NULL OR sector = ''
ORDER BY ticker;

-- Find companies missing descriptions
SELECT ticker, name_en FROM companies
WHERE description_en IS NULL OR description_en = ''
ORDER BY ticker;
```

**Source:** Saudi Exchange company profiles
- URL: `https://www.saudiexchange.sa/wps/portal/saudiexchange/hidden/company-profile-main/?companySymbol={TICKER}`

**Fields to update:**
- name_ar: Arabic company name (REQUIRED)
- sector: Must use consistent English sector names (see list below)
- description_en: 2-3 sentence company description in English
- description_ar: Arabic translation of description
- shares_outstanding: Total shares (for market cap calculation)
- is_shariah_compliant: true/false (check from Tadawul)

**Standard Sector Names (use these exactly):**
- Energy
- Materials (includes Petrochemicals, Mining)
- Industrials (includes Capital Goods)
- Consumer Discretionary (includes Retailing, Media)
- Consumer Staples (includes Food, Beverages)
- Health Care
- Financials (includes Banks, Insurance)
- Information Technology
- Communication Services (includes Telecom)
- Utilities
- Real Estate (includes REITs)
- Diversified

### Priority 4: News — Add English Translations

For each news article that has Arabic but no English:

```sql
SELECT id, title_ar, body_ar FROM news
WHERE (title_en IS NULL OR title_en = '')
AND title_ar IS NOT NULL
LIMIT 50;
```

**Action:** Translate title_ar → title_en and body_ar → body_en for each record.

### Priority 5: Stock Prices — Verify Quality

Stock prices (86K records) are likely the BEST data since they may come from the Sahm API.

```sql
-- Quick quality check
SELECT
  MIN(date) as earliest,
  MAX(date) as latest,
  COUNT(DISTINCT company_id) as companies_with_prices,
  AVG(close) as avg_price,
  MIN(close) as min_price,
  MAX(close) as max_price
FROM stock_prices;
```

If prices look real (different values, realistic ranges), they're probably fine.
If they're also fake, use Yahoo Finance: `https://finance.yahoo.com/quote/{TICKER}.SR/history/`

---

## PHASE 3: CODE BUGS TO FIX (After Data Is Clean)

These are bugs I (the code agent) will fix AFTER data is corrected:

| Bug | File | Fix |
|-----|------|-----|
| "main Market" capitalization | stock page | Change to "Main Market" |
| Missing space "SAR 42.76SAR 98.36" | stock page | Add space in 52W range display |
| Arabic page shows English descriptions | stock page | Use description_ar when locale=ar |
| Sector shows in English on Arabic page | stock page | Translate sector names |
| Sector names mixed EN/AR on home page | home page | Use Arabic sector names for AR locale |
| Market summary text "38% advancingMarket" | home page | Add space/line break |
| IPO page shows "No upcoming IPOs" despite 14 in DB | ipo page | Check query |
| Duplicate companies in screener (1160) | screener/data | Deduplicate companies table |

**IMPORTANT:** I will NOT fix these until the data is fixed because:
1. Some bugs will disappear automatically with good data
2. I need to test against real data to verify fixes
3. Fixing code against fake data can create NEW bugs

---

## PHASE 4: VALIDATION — Run After Each Phase

After loading each data type, run these checks:

```sql
-- DIVIDENDS: Should see DIFFERENT amounts
SELECT c.ticker, d.amount_per_share, d.ex_date
FROM dividends d JOIN companies c ON d.company_id = c.id
ORDER BY RANDOM() LIMIT 20;

-- FINANCIALS: Should see DIFFERENT revenues
SELECT c.ticker, f.revenue, f.net_income, f.year
FROM financials f JOIN companies c ON f.company_id = c.id
ORDER BY RANDOM() LIMIT 20;

-- COMPANIES: Check completion
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN name_ar != '' AND name_ar IS NOT NULL THEN 1 END) as has_arabic,
  COUNT(CASE WHEN sector != '' AND sector IS NOT NULL THEN 1 END) as has_sector,
  COUNT(CASE WHEN description_en != '' AND description_en IS NOT NULL THEN 1 END) as has_desc
FROM companies;
```

---

## RECOMMENDED APPROACH

**Start small, verify, then scale:**

1. Pick 10 major companies first: 2222, 1180, 2010, 7010, 1010, 2020, 2350, 1211, 4001, 8200
2. Get REAL dividends + financials for just these 10
3. Load into database
4. Verify on the live website that data displays correctly
5. THEN scale to remaining 449 companies

This prevents wasting time loading 459 companies with bad data again.

---

## DATA SOURCES SUMMARY

| Source | Cost | Data Available | Best For |
|--------|------|----------------|----------|
| stockanalysis.com | Free | Dividends, Financials, Prices | Primary source |
| saudiexchange.sa | Free | Dividend calendar, Company profiles | Official data |
| argaam.com | Free | Arabic financials, News | Arabic content |
| Yahoo Finance ({TICKER}.SR) | Free | Historical prices, Some dividends | Price history |
| FMP API | Free (250/day) | Full financials via API | Automated collection |
| Kaggle (Tadawul dataset) | Free | Historical data | Bulk historical |

---

## REMEMBER

**NEVER generate/fabricate data. If you can't find real data for a company, leave it NULL.**
A NULL is honest. A fake number is a lie that misleads our users.
