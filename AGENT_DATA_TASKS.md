# SŪQAI — Agent Data Population Tasks
Generated: 2026-03-03

## Root Cause Summary
The `companies` table is correctly populated (119 records, sector_ar filled).
However, three critical tables are **completely empty** and must be populated:

| Table | Records | Impact |
|-------|---------|--------|
| `stock_prices` | **0** | Screener shows dashes, price chart broken, 52W range N/A |
| `financials` | **0** | P/E, EPS, Revenue, Net Margin, Debt/Equity all N/A |
| `dividends` | **0** | Dividend Yield N/A, Dividend Calendar empty |

---

## Task 1 — Populate `stock_prices` (HIGHEST PRIORITY)

This unblocks: screener price column, price chart, 52W High/Low, volume column.

### Table Schema
```sql
stock_prices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id),
  date        date NOT NULL,
  open        numeric,
  high        numeric,
  close       numeric NOT NULL,
  low         numeric,
  volume      bigint,
  UNIQUE(company_id, date)
)
```

### What to populate
- For each of the 119 companies, insert daily OHLCV data
- Minimum: last 252 trading days (1 year) per company
- Ideal: last 3 years
- Source: Tadawul historical data or Sahm API if it supports history
- The `company_id` must match the UUID in the `companies` table
  (look up: `SELECT id, ticker FROM companies`)

### Minimum viable (gets screener working fast)
Insert at least the **last 2 trading days** per company so the screener
can calculate price and change_pct. Even 2 rows per company = 238 rows total.

---

## Task 2 — Populate `financials`

This unblocks: P/E ratio, EPS, Revenue, Net Margin, Debt/Equity card on stock page.

### Table Schema
```sql
financials (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid REFERENCES companies(id),
  year                  integer NOT NULL,
  period                text NOT NULL,  -- 'annual', 'Q1', 'Q2', 'Q3', 'Q4'
  revenue               numeric,
  net_income            numeric,
  earnings_per_share    numeric,
  total_assets          numeric,
  total_liabilities     numeric,
  debt_to_equity        numeric,        -- can be NULL, code auto-calculates if assets+liabilities present
  current_ratio         numeric,
  operating_cash_flow   numeric,
  free_cash_flow        numeric,
  UNIQUE(company_id, year, period)
)
```

### What to populate
- Priority fields: `revenue`, `net_income`, `earnings_per_share` (minimum for display)
- If you also add `total_assets` + `total_liabilities`, the code will
  auto-calculate `debt_to_equity` — no extra work needed
- At minimum: last 4 annual periods (2021, 2022, 2023, 2024) per company
- Source: Tadawul/Mubasher financial statements

---

## Task 3 — Populate `dividends`

This unblocks: Dividend Yield on stock page, Dividend Calendar page.

### Table Schema
```sql
dividends (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid REFERENCES companies(id),
  amount_per_share  numeric NOT NULL,
  ex_date           date NOT NULL,
  pay_date          date,
  currency          text DEFAULT 'SAR',
  UNIQUE(company_id, ex_date)
)
```

### What to populate
- Last 3 years of dividend history per paying company
- NOTE: Many companies do not pay dividends — only insert for those that do
- Do NOT insert fake/placeholder dividends (amount=2.2, date=2026-06-15)
- Source: Tadawul dividend announcements

---

## Quick verification after population

Run these checks to confirm data is correct:

```sql
-- stock_prices: should be > 0
SELECT COUNT(*), MIN(date), MAX(date) FROM stock_prices;

-- financials: should be > 0
SELECT COUNT(*), MIN(year), MAX(year) FROM financials;

-- dividends: should be > 0 (real data only)
SELECT COUNT(*), MIN(ex_date), MAX(ex_date) FROM dividends;

-- spot check Riyad Bank (1010)
SELECT sp.date, sp.close, sp.volume
FROM stock_prices sp
JOIN companies c ON c.id = sp.company_id
WHERE c.ticker = '1010'
ORDER BY sp.date DESC LIMIT 5;
```

---

## Already Fixed (no agent action needed)

- ✅ `companies` table: 119 correct records
- ✅ `sector_ar` column: filled for all 119 companies
- ✅ `i18n.ts` sectorMap: updated to match new sector names (REITs, Real Estate,
     Health Care, Information Technology, Commercial Services, Consumer Services,
     Financial Services, Retailing, Materials, Media, Utilities)
- ✅ SAHM_API_KEY: now in both Preview and Production
- ✅ TASI ticker: showing live (10,556.78)
- ✅ Individual stock live price: working (Riyad Bank 26.72 SAR)
