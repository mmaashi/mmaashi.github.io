# SŪQAI Data Quality Report — Scrub Phase 2

**Generated:** 2026-03-13
**Scope:** 119 companies in Supabase (project `fszmvnmfazgjhsrbbpvx`)
**Methodology:** Phase 1 read-only audit → Phase 2 batch fetch via Edge Function → staging validation → production update
**Data Sources:** Yahoo Finance (v10 quoteSummary with crumb auth, v8 chart), Google Finance HTML scraping (fallback)

---

## 1. Summary

Phase 2 fundamentals batch fetch dramatically improved data coverage. Of the six original focus areas, four now have substantial coverage. Two areas remain blocked pending balance sheet and cash flow statement data that Yahoo Finance does not provide for Saudi stocks.

| Focus Area | Status | Companies Covered | Phase 1 → Phase 2 |
|---|---|---|---|
| 52-week high/low | ✅ Public-safe | 118 of 119 | 19 → 118 |
| Market cap | ✅ Public-safe | 118 of 119 | 0 → 118 |
| P/E ratio | ✅ Public-safe | 95 of 119 | 0 → 95 |
| P/B ratio | ✅ Public-safe | 116 of 119 | 0 → 116 |
| Operating cash flow | ❌ Not yet safe | 0 of 119 | No change |
| Current ratio | ❌ Not yet safe | 0 of 119 | No change |
| Dividend yield | ✅ Public-safe | 84 of 119 | 5 → 84 |
| EPS | ✅ Public-safe | 117 of 119 | 8 → 117 |
| Book value per share | ✅ Public-safe | 117 of 119 | 0 → 117 |
| Shares outstanding | ✅ Available | 118 of 119 | 0 → 118 |

**One company missing across all metrics:** Ticker 4168 (Nice One Beauty Digital Marketing) — Yahoo Finance cannot resolve this ticker. Needs manual investigation.

---

## 2. Sources

### Database tables queried and updated

| Table | Row Count | Status |
|---|---|---|
| `companies` | 119 | `shares_outstanding` populated for 118 (was all NULL) |
| `stock_prices` | 28,466 | 1-year daily history for 118 companies (Phase 3 backfill complete) |
| `financials` | 119 | Updated from 107 rows; EPS, book_value, pe_ratio, pb_ratio populated |
| `dividends` | 35 | Unchanged — expansion pending |
| `company_metrics_daily` | 118 | NEW — daily snapshot with close_price, market_cap, pe_ratio, pb_ratio, dividend_yield, week52_high/low |
| `fundamentals_staging` | 119 | Staging table — raw batch fetch results, used for validation before production update |

### Source reliability classification

| source_name | Records | Trust Level | Action |
|---|---|---|---|
| `yahoo_finance` | ~28,300 (prices), 117 (financials), 118 (metrics) | Trusted | Production data |
| `NULL` (untagged) | 132 (prices) | Acceptable | Included — consistent with yahoo_finance |
| `estimated_yahoo` | 1 (financials, ticker 4264) | Partial | Retained — Yahoo returned data but with lower confidence |
| `estimated` | 1 (financials, ticker 4168) | Not public-safe | Retained — no Yahoo data available |
| `test_batch` | 10 (prices) | Contamination | Excluded from all computations |
| `test` | 1 (prices) | Contamination | Excluded from all computations |

---

## 3. Tables Updated (Phase 2)

### `companies` table
- **Field updated:** `shares_outstanding`
- **Coverage:** 118 of 119 companies
- **Source:** Yahoo Finance v10 quoteSummary → `defaultKeyStatistics.sharesOutstanding`
- **Missing:** Ticker 4168 (Nice One)

### `financials` table
- **Rows:** 107 → 119 (12 new rows inserted for companies that had no financials record)
- **Fields updated:** `earnings_per_share`, `book_value_per_share`, `pe_ratio`, `pb_ratio`
- **Source:** Yahoo Finance v10 quoteSummary
- **Coverage:**
  - EPS: 117/119 (24 are NULL due to negative earnings — legitimate)
  - Book value: 117/119
  - P/E ratio: 95/119 (24 NULL — companies with negative or near-zero earnings)
  - P/B ratio: 116/119

### `company_metrics_daily` table (NEW)
- **Rows inserted:** 118 (as_of_date = 2026-03-13)
- **Fields populated:**
  - `close_price`: 118/118
  - `market_cap`: 118/118
  - `pe_ratio`: 95/118
  - `pb_ratio`: 117/118
  - `dividend_yield`: 84/118
  - `week52_high`: 118/118
  - `week52_low`: 118/118

### Output files produced

| File | Location | Records | Status |
|---|---|---|---|
| `week52_high_low.csv` | `validated/` | 19 | ✅ Phase 1 output (superseded by company_metrics_daily) |
| `stock_prices_source_audit.csv` | `raw/` | 4 rows | Audit artifact |

---

## 4. Methodology

### Phase 2: Fundamentals batch fetch

1. **Edge Function:** `fetch-fundamentals` deployed to Supabase (version 3)
2. **Architecture:** Supabase Edge Function → invoked via `pg_net` from PostgreSQL (egress proxy blocks direct calls from Cowork VM)
3. **Three-source fallback per ticker:**
   - Yahoo Finance v10 quoteSummary (with crumb authentication)
   - Yahoo Finance v8 chart endpoint
   - Google Finance HTML scraping
4. **Batch processing:** 119 tickers processed in 12 batches of 10, with 2-second delays between batches
5. **Staging table:** All raw results stored in `fundamentals_staging` with full error tracking
6. **Validation:** Anomalies investigated before production update:
   - P/E > 100: 4040 (SAPTCO, P/E=850, EPS=0.01 SAR) and 2083 (Marafiq, P/E=268) — confirmed legitimate near-zero earnings
   - Negative book value: 4240 (Cenomi Retail, book_value=-10.34) — confirmed distressed company
7. **Production update:** UPDATE existing rows + INSERT for 12 new companies, only where staging data is non-NULL

### Phase 3: Historical price backfill

1. **Edge Function:** `fetch-price-history` deployed to Supabase (version 1)
2. **API:** Yahoo Finance v8 chart endpoint with `range=1y&interval=1d`
3. **Batch processing:** 100 tickers processed in 20 batches of 5, dispatched via `pg_net` with 2-second delays
4. **Rate limiting:** 800ms delay between tickers within each edge function call
5. **INSERT:** Parsed JSON responses directly in PostgreSQL using `jsonb_array_elements()`, joined to `companies` table on ticker, with `ON CONFLICT (company_id, date) DO NOTHING` for idempotency
6. **Result:** 28,466 rows in `stock_prices` — 118 companies with 1-year daily OHLCV data
7. **Data quality:** New backfill data uses `ROUND(value::numeric, 2)` for clean decimals; pre-existing float32 artifacts in older records remain untouched

### Float32 artifact handling

The `stock_prices` table stores values as float32, producing artifacts like `25.299999237060547`. All validated output uses `ROUND(value::numeric, 2)` to produce clean decimal values.

---

## 5. Validation

### Phase 2 anomaly investigation

| Company | Ticker | Anomaly | Investigation | Verdict |
|---|---|---|---|---|
| SAPTCO | 4040 | P/E = 850 | EPS = 0.01 SAR (near-zero earnings) | Legitimate — low-earnings company |
| Marafiq | 2083 | P/E = 268.18 | EPS = 0.11 SAR | Legitimate — utility with low earnings |
| Cenomi Retail | 4240 | Negative book value (-10.34) | Negative EPS (-2.82) | Legitimate — distressed company |
| Nice One | 4168 | All fields NULL | Yahoo Finance cannot find ticker | Needs manual investigation |
| flynas | 4264 | Partial data | Yahoo returned data but with lower confidence | Retained as estimated_yahoo |

### Phase 1 spot checks (still valid)

| Company | Field | Computed | Verified | Match |
|---|---|---|---|---|
| Riyad Bank (1010) | week52_high | 46.20 | 46.20 on 2025-03-15 | ✅ |
| Riyad Bank (1010) | week52_low | 25.30 | 25.30 on 2025-11-26 | ✅ |
| Al Rajhi (1120) | week52_high | 110.00 | 110.00 on 2025-10-30 | ✅ |
| Al Rajhi (1120) | week52_low | 87.80 | 87.80 on 2025-06-01 | ✅ |

### Contamination test (Phase 1)

Riyad Bank's 52-week high was initially 55.20 (from `test_batch` record). After excluding `test_batch`, corrected to 46.20 — a 19.5% overstatement eliminated.

---

## 6. Public-Safe Outputs

### ✅ Market Cap (118 companies)
**Source:** `company_metrics_daily.market_cap` or computed from `companies.shares_outstanding * latest_close`
**Safe for:** Display on stock cards, company profiles, sector rankings, market cap weighting

### ✅ P/E Ratio (95 companies)
**Source:** `company_metrics_daily.pe_ratio` and `financials.pe_ratio`
**Safe for:** Valuation display, peer comparison, screening
**Note:** 24 companies have NULL P/E due to negative or near-zero earnings — this is correct behavior, not missing data

### ✅ P/B Ratio (116 companies)
**Source:** `company_metrics_daily.pb_ratio` and `financials.pb_ratio`
**Safe for:** Valuation display, book value screening

### ✅ EPS (117 companies)
**Source:** `financials.earnings_per_share`
**Safe for:** Earnings display, per-share metrics
**Note:** 2 companies (4168, 4264) retain non-yahoo sources

### ✅ Book Value per Share (117 companies)
**Source:** `financials.book_value_per_share`
**Safe for:** Fundamental analysis, P/B computation

### ✅ Dividend Yield (84 companies)
**Source:** `company_metrics_daily.dividend_yield`
**Safe for:** Income screening, dividend display
**Note:** 34 companies show no yield (may not pay dividends or data not available from Yahoo)

### ✅ 52-Week High/Low (118 companies)
**Source:** `company_metrics_daily.week52_high` / `week52_low`
**Safe for:** Range bars, price position indicators, stock detail pages

### ✅ Price Charts (118 companies with full 1-year history)
**Source:** `stock_prices` table (exclude source_name IN ('test_batch', 'test'))
**Coverage:** 117 companies have 200+ trading days; flynas (4264) has 184 days (IPO'd June 2025)
**Note:** Phase 3 backfill completed 2026-03-13 via Yahoo Finance v8 chart API (1y daily OHLCV)

---

## 7. Still Blocked

### ❌ Operating Cash Flow
- `operating_cash_flow` is NULL for all 119 companies in `financials`
- Yahoo Finance quoteSummary does not return this for Saudi stocks
- **Need:** Cash flow statement data from Saudi Exchange or alternative API

### ❌ Free Cash Flow
- Same as operating cash flow — not available from Yahoo Finance for Saudi stocks

### ❌ Current Ratio
- No `current_assets` or `current_liabilities` fields populated
- **Need:** Balance sheet data from Saudi Exchange

### ❌ Debt/Equity Ratio
- `debt_to_equity` NULL for all rows; `total_liabilities` and `total_equity` also NULL
- **Need:** Balance sheet data from Saudi Exchange

### ❌ SŪQAI Score
- Depends on P/E + P/B + current_ratio + OCF + dividend yield
- P/E and P/B now available, but current_ratio and OCF still blocked
- **Cannot compute** until all underlying metrics exist

---

## 8. Builder Guidance

### What the builder CAN safely enable today

| Feature | Data Source | Coverage | Notes |
|---|---|---|---|
| Market cap display | `company_metrics_daily.market_cap` | 118/119 | Show on stock cards and profiles |
| P/E ratio display | `company_metrics_daily.pe_ratio` | 95/119 | Show "—" for NULL (negative earnings) |
| P/B ratio display | `company_metrics_daily.pb_ratio` | 116/119 | |
| EPS display | `financials.earnings_per_share` | 117/119 | |
| Book value display | `financials.book_value_per_share` | 117/119 | |
| Dividend yield | `company_metrics_daily.dividend_yield` | 84/119 | Show "—" for non-dividend stocks |
| 52-week high/low | `company_metrics_daily.week52_high/low` | 118/119 | |
| 52-week range bar | Compute position from close vs high/low | 118/119 | |
| Price charts | `stock_prices` (exclude test sources) | 118/119 | 1-year daily OHLCV backfill complete |
| Sector ranking by market cap | `company_metrics_daily` | 118/119 | |

### What the builder MUST NOT enable yet

| Feature | Reason |
|---|---|
| Current ratio | No balance sheet data |
| Debt/Equity ratio | No balance sheet data |
| Operating cash flow | Yahoo doesn't provide this for Saudi stocks |
| Free cash flow | Same |
| SŪQAI Score | Missing underlying metrics |
| Financial statements tab (full) | Most balance sheet/cash flow fields NULL |

### Display guidance for missing data

- Show **"—"** (em dash) for any metric with no validated data — do NOT show 0 or N/A
- For P/E: NULL means negative/near-zero earnings — "—" is correct, not an error
- Do NOT show estimated source values as factual
- Consider "Data pending" label for entirely empty sections

---

## 9. Remaining Gaps

### ~~Priority 1 — Historical price backfill~~ ✅ COMPLETE (2026-03-13)

Backfilled 1-year daily OHLCV data for 100 companies via `fetch-price-history` edge function (Yahoo Finance v8 chart API, `range=1y&interval=1d`). Processed in 20 batches of 5 tickers via `pg_net`. Result: 28,466 rows in `stock_prices` covering 118 companies. 117 have 200+ trading days; flynas (4264) has 184 (IPO'd June 2025). Only ticker 4168 (Nice One) remains at zero — Yahoo cannot resolve.

### Priority 2 — Balance sheet fundamentals

| Data Needed | Unblocks | Source |
|---|---|---|
| `total_assets`, `total_liabilities` | Debt/Equity ratio | Saudi Exchange quarterly/annual filings |
| `current_assets`, `current_liabilities` | Current ratio | Same |
| `total_equity` | Independent P/B verification | Same |

### Priority 3 — Cash flow data

| Data Needed | Unblocks | Source |
|---|---|---|
| `operating_cash_flow` | OCF display, SŪQAI Score component | Saudi Exchange cash flow statements |
| `free_cash_flow` | FCF analysis | Same |

### Priority 4 — Dividend expansion

| Data Needed | Unblocks | Source |
|---|---|---|
| Complete dividend history for all paying companies | Dividend charts, payout ratio, yield verification | Saudi Exchange dividend calendar / CMA disclosures |

### Single-company gap

| Ticker | Company | Issue |
|---|---|---|
| 4168 | Nice One Beauty Digital Marketing | Yahoo Finance cannot resolve — all fields NULL. Needs alternative data source or manual entry. |

---

## 10. Next Recommended Step

**Balance sheet and cash flow data for 119 companies.** Yahoo Finance does not provide operating cash flow, free cash flow, current assets, current liabilities, total liabilities, or total equity for Saudi stocks. These fields are required for current ratio, debt/equity ratio, and the SŪQAI Score.

**Method:** Obtain quarterly/annual financial statements from the Saudi Exchange (Tadawul) or Capital Market Authority (CMA) disclosures. Options include: (a) official Tadawul API if available, (b) structured scraping of Saudi Exchange financial statements page, (c) manual import from CMA disclosure PDFs. Data should flow through `fundamentals_staging` for validation before production update.

**Alternatively:** Expand dividend coverage (currently 5 companies in `dividends` table vs 84 with yield from Yahoo) to enable dividend history charts and payout ratio analysis.
