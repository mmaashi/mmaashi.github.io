# SŪQAI — Batch Financial Metrics Report
**Date:** 2026-03-13
**Source:** Yahoo Finance (quoteSummary v10 — financialData + defaultKeyStatistics modules)
**Method:** Supabase Edge Function `batch-financials` invoked via `pg_net`

## Execution Summary
- **Total companies:** 119
- **Successfully updated:** 118 (99.2%)
- **Failed:** 1 — ticker 4168 (Nice One Beauty) — Yahoo returns 404
- **Batches fired:** 13 (request IDs 43-55)
- **All batches HTTP 200, zero timeouts**

## Coverage Matrix (119 companies, annual 2024)

| Metric | Count | Coverage | Notes |
|--------|-------|----------|-------|
| Revenue | 119 | 100% | Combined: prior fetch + Yahoo totalRevenue |
| EPS | 119 | 100% | Prior fetch |
| Total Debt | 119 | 100% | NEW from Yahoo financialData |
| Debt/Equity | 118 | 99% | NEW from Yahoo financialData |
| ROE | 119 | 100% | Combined: prior fetch + Yahoo financialData |
| P/B Ratio | 117 | 98% | NEW from Yahoo defaultKeyStatistics |
| Book Value/Share | 118 | 99% | NEW from Yahoo defaultKeyStatistics |
| Shares Outstanding | 114 | 96% | NEW from Yahoo defaultKeyStatistics |
| Operating Cash Flow | 113 | 95% | NEW from Yahoo financialData |
| Gross Margin | 114 | 96% | NEW from Yahoo financialData |
| Operating Margin | 114 | 96% | NEW from Yahoo financialData |
| Profit Margin | 114 | 96% | NEW from Yahoo financialData |
| Revenue Growth | 111 | 93% | NEW from Yahoo financialData |
| Enterprise Value | 110 | 92% | NEW from Yahoo defaultKeyStatistics |
| Cash | 110 | 92% | NEW from Yahoo financialData |
| Net Income | 107 | 90% | Prior fetch |
| Return on Assets | 95 | 80% | NEW from Yahoo financialData |
| Current Ratio | 88 | 74% | NEW — banks often null |
| Free Cash Flow | 87 | 73% | NEW from Yahoo financialData |

## Key Observations
1. **Current Ratio (74%):** Saudi banks (1010-1183) often lack this metric in Yahoo — this is expected as banking regulation uses different liquidity measures (LCR, NSFR) rather than current ratio.
2. **Free Cash Flow (73%):** Some smaller companies and banks don't report FCF through Yahoo's computed metrics.
3. **Ticker 4168 (Nice One):** Not recognized by Yahoo Finance. May need alternative data source or manual entry.
4. **All 17 previously-blocked metrics now have ≥73% coverage** — up from 0% before this batch.

## Data Integrity
- `source_name` = 'yahoo_finance' set on all 118 updated rows
- `fetched_at` timestamps recorded for audit trail
- Only non-null values written — no overwriting of existing data with nulls
- Existing prior-fetch data (revenue, net_income, EPS from fundamentals batch) preserved
