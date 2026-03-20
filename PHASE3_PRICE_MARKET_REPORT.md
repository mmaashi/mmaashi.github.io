# SŪQAI Phase 3: Full Price & Market Layer — Completion Report

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Summary

Phase 3 computed and populated the `company_metrics_daily` table with 33+ financial metrics for 118 Saudi-listed companies. This layer transforms raw financials, prices, and dividends into investor-ready analytics: valuations, profitability, leverage, momentum, and dividend metrics.

---

## Coverage Matrix (118 companies)

### Tier 1 — Full Coverage (100%)
| Metric | Count | Coverage |
|--------|-------|----------|
| close_price | 118 | 100% |
| market_cap | 118 | 100% |
| roe | 118 | 100% |
| roa | 118 | 100% |
| net_margin | 118 | 100% |
| operating_margin | 118 | 100% |
| volatility_30d | 118 | 100% |
| week52_high_distance | 118 | 100% |

### Tier 2 — Near-Complete (95%+)
| Metric | Count | Coverage |
|--------|-------|----------|
| pb_ratio | 117 | 99% |
| debt_to_equity | 117 | 99% |
| return_1d | 117 | 99% |
| return_1w | 117 | 99% |
| return_1m | 117 | 99% |
| return_3m | 117 | 99% |
| ps_ratio | 116 | 98% |
| return_1y | 116 | 98% |
| relative_perf_vs_tasi | 116 | 98% |
| revenue_growth_yoy | 111 | 94% |

### Tier 3 — Good (80-94%)
| Metric | Count | Coverage |
|--------|-------|----------|
| ocf_to_debt | 110 | 93% |
| roce | 106 | 90% |
| interest_coverage | 104 | 88% |
| net_debt_ebitda | 102 | 86% |
| years_of_dividends | 98 | 83% |
| pe_ratio | 95 | 81% |

### Tier 4 — Moderate (60-79%)
| Metric | Count | Coverage |
|--------|-------|----------|
| ev_ebitda | 91 | 77% |
| current_ratio | 88 | 75% |
| dividend_yield | 84 | 71% |
| payout_ratio | 70 | 59% |
| earnings_growth_yoy | 73 | 62% |
| eps_growth_yoy | 73 | 62% |

### Tier 5 — Low (needs Phase 4)
| Metric | Count | Coverage | Reason |
|--------|-------|----------|--------|
| dividend_cagr_3y | 51 | 43% | Only 51 companies have dividends in both 2021 and 2024 |
| revenue_cagr_3y | 14 | 12% | Only 22 companies have 2021 revenue data |
| revenue_cagr_5y | 0 | 0% | No 2019 financials exist |
| return_3y | 0 | 0% | Price history only goes back to 2025-01-01 |
| forward_pe | 0 | 0% | Requires analyst estimates (not available) |
| peg_ratio | 0 | 0% | Requires forward earnings growth |
| fair_value_estimate | 0 | 0% | Phase 7 deliverable |
| fair_value_gap | 0 | 0% | Phase 7 deliverable |

---

## Stock Prices Coverage

| Metric | Value |
|--------|-------|
| Total rows | 29,310 |
| Companies covered | 118 |
| Trading days | 287 |
| Date range | 2025-01-01 to 2026-03-12 |
| Columns | open, high, low, close, volume, change_pct |

---

## Data Sources Used

| Source | What it provided |
|--------|-----------------|
| Yahoo Finance (via Edge Functions) | Fundamentals, balance sheet, cash flow, income statement |
| Sahm API (via prices cron) | Daily OHLCV price data |
| Supabase `dividends` table | Dividend history (1,252 records, 2016-2026) |
| Supabase `financials` table | Revenue, net_income, EPS, assets, liabilities, equity, OCF |

---

## Outlier Cleanup Performed

| Cleanup | Companies affected | Action |
|---------|-------------------|--------|
| Payout ratio > 300% | 6 | Set to NULL |
| EV/EBITDA > 100 or < 0 | 7 | Set to NULL |
| Net debt/EBITDA > 20 | 4 | Set to NULL |
| EPS growth > 1000% | 8 | Set to NULL |
| Earnings growth > 1000% | 8 | Set to NULL |
| ROE > 200% | 6 (prior session) | Set to NULL |
| Sipchem FCF = 4.3T SAR | 1 (prior session) | Set to NULL |

---

## Computation Methods

### Valuation Ratios
- **P/E**: close_price / EPS (excluded negative EPS)
- **P/B**: market_cap / total_equity
- **P/S**: market_cap / revenue
- **EV/EBITDA**: enterprise_value / (operating_income + depreciation proxy)

### Profitability
- **ROE**: net_income / total_equity
- **ROA**: net_income / total_assets
- **ROCE**: operating_income / (total_assets - current_liabilities proxy)
- **Net margin**: profit_margin from Yahoo (stored as decimal)
- **Operating margin**: operating_margin from Yahoo (stored as decimal)

### Leverage
- **Debt/Equity**: total_debt / total_equity
- **Net debt/EBITDA**: (total_debt - cash) / EBITDA
- **Interest coverage**: operating_income / interest_expense (estimated)
- **Current ratio**: from Yahoo financials
- **OCF/Debt**: operating_cash_flow / total_debt

### Momentum
- **Returns (1d, 1w, 1m, 3m, 1y)**: Computed from stock_prices using date offsets
- **Volatility 30d**: Standard deviation of daily returns × √252
- **52-week high distance**: (close - 52w_high) / 52w_high
- **Relative perf vs TASI**: Company return_1y minus average market return_1y

### Dividends
- **Dividend yield**: Annual DPS / close_price
- **Payout ratio**: Annual DPS / EPS
- **Years of dividends**: Count of distinct years with dividend payments
- **Dividend CAGR 3Y**: (2024_total / 2021_total)^(1/3) - 1

### Growth
- **Revenue growth YoY**: (2024_revenue - 2023_revenue) / abs(2023_revenue)
- **EPS growth YoY**: Proxied via net_income growth (2023 lacks EPS data)
- **Revenue CAGR 3Y**: (2024_rev / 2021_rev)^(1/3) - 1

---

## Key Gaps for Phase 4

1. **Multi-year financials (2019-2023)**: Currently only revenue + net_income for 2020-2023. Need full income statement, balance sheet, cash flow to unlock:
   - revenue_cagr_5y (requires 2019 data)
   - revenue_cagr_3y improvement (22 → ~90+ companies with 2021 full data)
   - eps_growth_yoy accuracy (currently proxied from net_income)
   - Historical trend analysis

2. **Price history before 2025**: return_3y requires prices from 2023. Current data starts 2025-01-01.

3. **Forward estimates**: forward_pe and peg_ratio require analyst consensus estimates — not available from Yahoo free tier.

4. **Dividend pay_date**: All 1,252 records have NULL pay_date. Only ex_date and year are usable.

---

## Edge Functions Deployed

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| fetch-fundamentals | v3 | No | Single-company Yahoo fundamentals |
| fetch-price-history | v1 | No | Single-company price history |
| probe-financials | v2 | Yes | Test Yahoo API access |
| batch-financials | v2 | Yes | Batch fundamentals fetch |
| batch-history | v1 | Yes | Batch price history fetch |
| batch-dividends | v1 | No | Batch dividend fetch |
| batch-capex-ratio | v1 | No | Batch capex/ratio fetch |
| batch-company-profiles | v1 | No | Batch company profile fetch |

---

## Architecture Notes

- **Egress constraint**: Cowork VM proxy blocks financial sites. All external fetches go through Supabase Edge Functions invoked via `pg_net` (async HTTP from PostgreSQL).
- **pg_net pattern**: `net.http_post()` returns request_id → poll `net._http_response` for results.
- **Yahoo Finance auth**: Edge functions handle crumb/cookie auth flow automatically.
- **Storage format**: Margins stored as decimals (0.25 = 25%), debt_to_equity as Yahoo percentage format.

---

## Next Phase

**Phase 4: Full Fundamentals Completion** — Deploy a new edge function to fetch multi-year Yahoo Finance income statement, balance sheet, and cash flow data. Backfill 2020-2023 financials with EPS, total_assets, operating_income, OCF, debt_to_equity, equity, and derived fields. This will dramatically improve coverage for growth metrics, CAGRs, and enable historical trend analysis.
