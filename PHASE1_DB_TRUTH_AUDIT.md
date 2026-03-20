# SŪQAI Phase 1 — Full DB Truth Audit
**Generated:** 2026-03-13 | **Master Data Completion Prompt — Phase 1**

---

## 1. Table Inventory (30 public tables)

| Table | Rows | Status | Role |
|-------|------|--------|------|
| **companies** | 119 | ACTIVE | Core identity |
| **financials** | 325 | ACTIVE | Annual fundamentals (5 years) |
| **stock_prices** | 29,310 | ACTIVE | OHLCV daily prices |
| **dividends** | 1,252 | ACTIVE | Dividend history |
| **company_metrics_daily** | 118 | PARTIAL | Derived daily metrics — severely underpopulated |
| **fundamentals_staging** | 119 | STAGING | Yahoo raw data staging |
| **news** | 126 | ACTIVE | Market news (last 30d only) |
| **ipos** | 14 | STATIC | Historical IPO records |
| **etl_job_runs** | 1 | ACTIVE | ETL tracking |
| **company_scores_daily** | 0 | EMPTY | Score engine — never populated |
| **sector_averages** | 0 | EMPTY | Sector benchmarks — never populated |
| **fair_value_targets** | 0 | EMPTY | Valuation targets — never populated |
| **analyst_estimates** | 0 | EMPTY | Consensus estimates — never populated |
| **index_members** | 0 | EMPTY | Index composition — never populated |
| **indices** | 0 | EMPTY | Market indices — never populated |
| **ownership** | 0 | EMPTY | Institutional ownership — never populated |
| **stock_narratives** | 0 | EMPTY | AI narratives — never populated |
| **company_contracts** | 0 | EMPTY | Contract data — never populated |
| **contract_pipeline_summary** | 0 | EMPTY | Pipeline — never populated |
| **etl_row_errors** | 0 | EMPTY | Error log |
| Other user/app tables | varies | N/A | portfolios, watchlists, alerts, screener_presets, etc. |

**Summary:** 5 core data tables active. 10 analytics/feature tables completely empty. 1 staging table.

---

## 2. Companies Table (119 rows, 29 columns)

### Identity Coverage

| Field | Count | Coverage | Notes |
|-------|-------|----------|-------|
| ticker | 119 | 100% | ✅ Complete |
| name_en | 119 | 100% | ✅ Complete |
| name_ar | 119 | 100% | ✅ Complete |
| sector | 119 | 100% | ✅ Complete |
| sector_ar | 119 | 100% | ✅ Complete |
| market | 119 | 100% | ✅ Complete |
| symbol | 119 | 100% | ✅ Complete |
| currency | 119 | 100% | ✅ Complete |
| is_shariah_compliant | 119 | 100% | ✅ Complete |
| shares_outstanding | 118 | 99% | 1 missing (Nice One 4168) |
| description_en | 5 | 4% | ❌ Critical gap |
| description_ar | 5 | 4% | ❌ Critical gap |
| sub_sector | 0 | 0% | ❌ Empty |
| logo_url | 0 | 0% | ❌ Empty |
| website_url | 0 | 0% | ❌ Empty |
| employee_count | 0 | 0% | ❌ Empty |
| founded_year | 0 | 0% | ❌ Empty |
| ceo_name_en | 0 | 0% | ❌ Empty |
| ceo_name_ar | 0 | 0% | ❌ Empty |
| isin | 0 | 0% | ❌ Empty |
| description | 0 | 0% | ❌ Empty |

**Verdict:** Core trading identity complete. Company profile data almost entirely missing (11 of 21 content fields at 0%).

---

## 3. Financials Table (325 rows, 36 columns)

### Multi-year depth

| Year | Records | Companies |
|------|---------|-----------|
| 2020 | 4 | 4 |
| 2021 | 22 | 22 |
| 2022 | 89 | 89 |
| 2023 | 91 | 91 |
| 2024 | 119 | 119 |

**All annual period.** No quarterly data exists. Historical depth extremely sparse pre-2022.

### 2024 Annual Field Coverage (119 records)

| Coverage | Count | Fields |
|----------|-------|--------|
| 100% (119) | 8 | revenue, eps, total_debt, roe, roa, gross_margin, operating_margin, profit_margin |
| 99% (118) | 2 | debt_to_equity, book_value_per_share |
| 98% (117) | 1 | pb_ratio |
| 96% (114) | 1 | shares_outstanding |
| 95% (113) | 1 | operating_cash_flow |
| 93% (111) | 1 | revenue_growth |
| 92% (110) | 2 | cash, enterprise_value |
| 90% (107) | 7 | net_income, gross_profit, operating_income, total_assets, total_liabilities, total_equity, equity |
| 81% (96) | 1 | pe_ratio |
| 74% (88) | 1 | current_ratio |
| 72% (86) | 1 | free_cash_flow |
| 0% (0) | 1 | capex |

**No duplicates found.** UNIQUE constraint on (company_id, period, year) is enforced.

---

## 4. Stock Prices (29,310 rows, 12 columns)

| Metric | Value |
|--------|-------|
| Companies covered | 118/119 |
| Missing | Nice One (4168) — Yahoo returns 404 |
| Date range | 2025-01-01 to 2026-03-12 |
| March 2026 records | 1,122 (118 companies) |
| Freshness | Current (yesterday's close) |

**Status:** Active daily cron running. Only Nice One missing.

---

## 5. Dividends (1,252 rows, 13 columns)

| Field | Count | Coverage |
|-------|-------|----------|
| ex_date | 1,252 | 100% |
| amount_per_share | 1,252 | 100% |
| dividend_type | 1,252 | 100% |
| dividend_per_share | 1,217 | 97% |
| year | 1,217 | 97% |
| pay_date | 0 | 0% ❌ |
| record_date | 0 | 0% ❌ |

**98 companies** have dividend data. Date range: 2016-03-31 to 2026-03-24.

---

## 6. company_metrics_daily (118 rows, 47 columns)

**Last updated:** 2026-03-13 02:40 UTC (today)

### Populated fields (118/118 unless noted)

| Field | Count |
|-------|-------|
| close_price | 118 |
| market_cap | 118 |
| week52_high | 118 |
| week52_low | 118 |
| pb_ratio | 117 |
| pe_ratio | 95 |
| dividend_yield | 84 |

### EMPTY fields (0/118) — 35+ columns

ALL of these are 0:
- forward_pe, ps_ratio, peg_ratio, ev_ebitda
- roe, roa, roce
- gross_margin, operating_margin, net_margin
- revenue_growth, earnings_growth
- debt_to_equity, current_ratio, interest_coverage
- return_1d, return_1w, return_1m, return_3m, return_1y
- volatility_30d, relative_performance
- fair_value, upside_potential
- trailing_div_yield, payout_ratio, div_growth_3y, years_of_dividends
- sector_rank, score_total

**Verdict:** This table has 7 of 47 columns populated. It's 85% empty. Major Phase 3 target.

---

## 7. Empty Analytics Tables

| Table | Columns | Rows | Purpose | Phase |
|-------|---------|------|---------|-------|
| company_scores_daily | 18 | 0 | Composite scores (value, growth, health, dividend) | Phase 7 |
| sector_averages | 15 | 0 | Sector benchmark metrics | Phase 6 |
| fair_value_targets | ? | 0 | DCF/model fair values | Phase 7 |
| analyst_estimates | ? | 0 | Consensus EPS/revenue estimates | Future |
| index_members | ? | 0 | TASI/Nomu composition | Future |
| indices | ? | 0 | Index time series | Future |
| ownership | ? | 0 | Major shareholders | Future |
| stock_narratives | ? | 0 | AI-generated summaries | Phase 7 |

---

## 8. Staging Table (fundamentals_staging)

119 rows with Yahoo raw snapshot data:
- shares_outstanding: 118
- market_cap: 118
- trailing_pe: 95
- eps: 117
- book_value: 118
- dividend_rate/yield: 84
- 52W high/low: 118
- regular_market_price: 118

**This is a useful raw source for refreshing company_metrics_daily.**

---

## 9. Cross-Table Consistency

| Check | Result |
|-------|--------|
| All 119 companies have 2024 financials | ✅ |
| 118/119 companies have prices | ✅ (Nice One 4168 missing) |
| 118/119 companies have metrics row | ✅ (Nice One 4168 missing) |
| 98/119 companies have dividends | ✅ (21 non-payers) |
| No duplicate financials | ✅ |
| Financials period check constraint | ✅ IN ('Q1','Q2','Q3','Q4','annual') |

---

## 10. Phase 1 Verdict — Priority Map

### Immediate action (Phases 2-3):
1. **company_metrics_daily** — 85% empty, drives all UI cards/comparisons. Must populate return windows, margins, growth, ratios from existing financials + prices.
2. **Company identity** — 11 fields at 0%. Need website, ISIN, descriptions, sub_sector at minimum.

### Core data (Phases 4-5):
3. **Financials historical backfill** — Only 2024 is complete. 2020-2023 sparse. Need multi-year for trend charts.
4. **Dividend pay_date/record_date** — 0% populated. Dividend yield computation needs work.

### Analytics engine (Phases 6-7):
5. **sector_averages** — 0 rows. Must compute from financials.
6. **company_scores_daily** — 0 rows. Depends on metrics + sector averages.

### Data quality:
- **7 known anomalies** cleaned in prior phases (Sipchem FCF, 6x ROE)
- **No contamination** detected (no duplicates, no mixed periods)
- **Source transparency** maintained (source_name column in financials, dividends)

---

*Phase 1 complete. Proceeding to Phase 2: Company Identity Completion.*
