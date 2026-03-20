# SŪQAI Phase 8: Data Dictionary

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Overview

The SŪQAI database contains 7 public tables in Supabase (PostgreSQL) covering 118 Saudi-listed companies. This document defines every table, column, type, relationship, and usage note a front-end builder needs.

**Supabase Project:** `fszmvnmfazgjhsrbbpvx` (region: ap-northeast-1)
**API URL:** `https://fszmvnmfazgjhsrbbpvx.supabase.co`

---

## Table 1: `companies`

**Purpose:** Master company registry. One row per listed company (118 rows). All other tables reference this via `company_id`.

**Row count:** 118

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| ticker | text | NO | — | Tadawul ticker number (e.g. "1010", "2222") |
| symbol | text | NO | — | Yahoo Finance symbol (e.g. "1010.SR") |
| name_en | text | YES | — | English company name |
| name_ar | text | YES | — | Arabic company name |
| name_zh | text | YES | — | Chinese company name (sparse) |
| sector | text | YES | — | English sector name (17 sectors) |
| sector_ar | text | YES | — | Arabic sector name |
| sub_sector | text | YES | — | Sub-sector classification |
| market | text | YES | 'main' | Market segment (main/nomu) |
| isin | text | YES | — | ISIN identifier |
| currency | text | YES | 'SAR' | Trading currency |
| description | text | YES | — | Company description (English) |
| description_ar | text | YES | — | Company description (Arabic) |
| description_en | text | YES | — | Alternate English description field |
| description_zh | text | YES | — | Chinese description (sparse) |
| logo_url | text | YES | — | URL to company logo |
| website_url | text | YES | — | Corporate website URL |
| employee_count | integer | YES | — | Number of employees |
| founded_year | integer | YES | — | Year founded |
| ceo_name_en | text | YES | — | CEO name in English |
| ceo_name_ar | text | YES | — | CEO name in Arabic |
| shares_outstanding | bigint | YES | — | Total shares outstanding |
| is_shariah_compliant | boolean | YES | — | Shariah compliance flag |
| vision_2030_score | numeric | YES | — | Vision 2030 alignment score |
| government_contracts | text[] | YES | — | Array of government contract descriptions |
| mega_projects | text[] | YES | — | Array of mega-project participations |
| created_at | timestamptz | YES | now() | Row creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Key notes:**
- Use `ticker` for display (NOT `symbol`). Symbol includes ".SR" suffix for Yahoo Finance.
- `sector` contains one of 17 values: Banks, Commercial Services, Consumer Services, Energy, Financial Services, Food & Beverages, Health Care, Information Technology, Insurance, Materials, Media, Real Estate, REITs, Retailing, Telecommunication, Transportation, Utilities.
- `name_ar` and `name_en` have 100% coverage. `name_zh` is sparse.

---

## Table 2: `company_metrics_daily`

**Purpose:** The main analytics table. One row per company containing the latest computed metrics: valuations, profitability, leverage, momentum, dividends, sector percentiles, and SŪQAI Score. Updated after each computation run.

**Row count:** 118 (one per company)

### Identity & Metadata

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| company_id | uuid | NO | FK → companies.id |
| as_of_date | date | YES | Date metrics were computed |
| schema_version | text | YES | Default 'v2.0' |
| source_name | text | YES | Data source identifier |
| updated_at | timestamptz | YES | Last update timestamp |

### Price & Market Cap

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| close_price | numeric | YES | 100% | Latest closing price (SAR) |
| market_cap | numeric | YES | 100% | Market capitalization (SAR) |
| week52_high | numeric | YES | ~100% | 52-week high price |
| week52_low | numeric | YES | ~100% | 52-week low price |

### Valuation Ratios

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| pe_ratio | numeric | YES | 81% (95) | Price/Earnings. NULL if EPS ≤ 0 |
| forward_pe | numeric | YES | 0% | Forward P/E. Requires analyst estimates (unavailable) |
| pb_ratio | numeric | YES | 99% (117) | Price/Book = market_cap / total_equity |
| ps_ratio | numeric | YES | 98% (116) | Price/Sales = market_cap / revenue |
| peg_ratio | numeric | YES | 0% | P/E to Growth. Requires forward estimates (unavailable) |
| ev_ebitda | numeric | YES | 77% (91) | Enterprise Value / EBITDA. Outliers >100 or <0 set to NULL |
| fair_value_estimate | numeric | YES | 0% | Not computed (future phase) |
| fair_value_gap | numeric | YES | 0% | Not computed (future phase) |

### Profitability

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| roe | numeric | YES | 100% | Return on Equity = net_income / total_equity. Stored as decimal (0.25 = 25%) |
| roa | numeric | YES | 100% | Return on Assets = net_income / total_assets. Stored as decimal |
| roce | numeric | YES | 90% (106) | Return on Capital Employed. Stored as decimal |
| net_margin | numeric | YES | 100% | Net profit margin. Stored as decimal (0.15 = 15%). Source: Yahoo `profit_margin` |
| operating_margin | numeric | YES | 100% | Operating margin. Stored as decimal. Source: Yahoo `operating_margin` |

### Growth

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| revenue_growth_yoy | numeric | YES | 94% (111) | Year-over-year revenue growth. Stored as decimal (0.12 = 12%) |
| earnings_growth_yoy | numeric | YES | 62% (73) | YoY earnings growth. Outliers >1000% set to NULL |
| eps_growth_yoy | numeric | YES | 64% (75) | YoY EPS growth. Outliers >1000% set to NULL |
| revenue_cagr_3y | numeric | YES | 12% (14) | 3-year revenue CAGR. Low coverage due to sparse 2021 data |
| revenue_cagr_5y | numeric | YES | 0% | 5-year revenue CAGR. No 2019 data available |

### Leverage & Safety

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| debt_to_equity | numeric | YES | 99% (117) | Total debt / total equity. Yahoo percentage format |
| net_debt_ebitda | numeric | YES | 86% (102) | (Total debt − cash) / EBITDA. Outliers >20 set to NULL |
| interest_coverage | numeric | YES | 88% (104) | Operating income / interest expense (estimated) |
| current_ratio | numeric | YES | 75% (88) | Current assets / current liabilities |
| ocf_to_debt | numeric | YES | 93% (110) | Operating cash flow / total debt |

### Momentum & Returns

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| return_1d | numeric | YES | 99% (117) | 1-day price return. Stored as decimal |
| return_1w | numeric | YES | 99% (117) | 1-week return |
| return_1m | numeric | YES | 99% (117) | 1-month return |
| return_3m | numeric | YES | 99% (117) | 3-month return |
| return_1y | numeric | YES | 98% (116) | 1-year return |
| return_3y | numeric | YES | 0% | 3-year return. Price history starts 2025-01-01 |
| week52_high_distance | numeric | YES | 100% | (close − 52w_high) / 52w_high. Always ≤ 0 |
| volatility_30d | numeric | YES | 100% | Annualized 30-day volatility = std(daily returns) × √252 |
| relative_perf_vs_tasi | numeric | YES | 98% (116) | Company return_1y minus market average return_1y |

### Dividends

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| dividend_yield | numeric | YES | 69% (81) | 2024 annual DPS / close_price. Capped at 25% |
| payout_ratio | numeric | YES | 63% (74) | 2024 annual DPS / EPS. Capped at 300% |
| cash_payout_ratio | numeric | YES | 0% | Not computed |
| dividend_cagr_3y | numeric | YES | 43% (51) | (2024_DPS / 2021_DPS)^(1/3) − 1 |
| years_of_dividends | integer | YES | 100% | Count of distinct years with dividends. 0 for non-payers (not NULL) |

### Sector Percentiles

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| sector_pctile_pe | numeric | YES | 81% (95) | PE cheapness rank within sector. 1.0 = cheapest. PERCENT_RANK() |
| sector_pctile_pb | numeric | YES | 99% (117) | PB cheapness rank. 1.0 = cheapest |
| sector_pctile_dividend_yield | numeric | YES | 69% (81) | Dividend yield rank. 1.0 = highest yield |
| sector_pctile_roe | numeric | YES | 100% | ROE rank. 1.0 = highest ROE |
| sector_pctile_net_margin | numeric | YES | 100% | Net margin rank. 1.0 = highest margin |
| sector_pctile_revenue_growth | numeric | YES | 94% (111) | Revenue growth rank. 1.0 = fastest growth |
| sector_pctile_debt_to_equity | numeric | YES | 99% (117) | D/E rank. 1.0 = lowest leverage |
| sector_pctile_return_1y | numeric | YES | 98% (116) | 1-year return rank. 1.0 = best performer |
| sector_rank_market_cap | integer | YES | 100% | Market cap rank within sector. 1 = largest |
| sector_peer_count | integer | YES | 100% | Number of companies in the sector |

### SŪQAI Score

| Column | Type | Nullable | Coverage | Description |
|--------|------|----------|----------|-------------|
| suqai_score | numeric | YES | 100% | Composite score 0–100. NULL-aware weighted average of 6 dimensions |
| score_value | numeric | YES | 100% | Value dimension 0–100 (PE, PB, EV/EBITDA) |
| score_quality | numeric | YES | 100% | Quality dimension 0–100 (ROE, net margin, operating margin) |
| score_growth | numeric | YES | 100% | Growth dimension 0–100 (revenue growth, earnings growth) |
| score_momentum | numeric | YES | 100% | Momentum dimension 0–100 (1y return, 52w high, inv. volatility) |
| score_dividend | numeric | YES | 100% | Dividend dimension 0–100 (yield, years, payout) |
| score_safety | numeric | YES | 100% | Safety dimension 0–100 (D/E, current ratio, OCF/debt) |
| score_tier | text | YES | 100% | Tier label: 'Strong Buy', 'Buy', 'Hold', 'Underperform', 'Sell' |

**Key notes:**
- Use `as_of_date` (NOT `date`) for date filtering.
- All margins and returns are stored as decimals. Multiply by 100 for display.
- `debt_to_equity` is in Yahoo percentage format (already multiplied).
- NULL means "data not available" — never imputed with 0 or average.
- Tier thresholds: Strong Buy ≥75, Buy ≥60, Hold ≥45, Underperform ≥30, Sell <30.

---

## Table 3: `financials`

**Purpose:** Multi-year financial statements. One row per company per fiscal year. Contains income statement, balance sheet, and cash flow items sourced from Yahoo Finance.

**Row count:** ~341 rows (118 unique companies, years 2020–2025)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| company_id | uuid | NO | FK → companies.id |
| period | text | YES | Fiscal period identifier |
| year | integer | YES | Fiscal year (2020–2025) |
| revenue | numeric | YES | Total revenue (SAR) |
| net_income | numeric | YES | Net income (SAR) |
| gross_profit | numeric | YES | Gross profit (SAR). Added in Phase 4 |
| operating_income | numeric | YES | Operating income (SAR). 2024 only |
| total_assets | numeric | YES | Total assets (SAR). 2024 only |
| total_liabilities | numeric | YES | Total liabilities (SAR). 2024 only |
| total_equity | numeric | YES | Total equity / stockholders' equity (SAR). 2024 only |
| equity | numeric | YES | Alternate equity field |
| cash | numeric | YES | Cash and equivalents (SAR). 2024 only |
| total_debt | numeric | YES | Total debt (SAR). 2024 only |
| operating_cash_flow | numeric | YES | Operating cash flow (SAR). 2024 only |
| capex | numeric | YES | Capital expenditure (SAR). 2024 only |
| free_cash_flow | numeric | YES | FCF = OCF − capex (SAR). 2024 only |
| earnings_per_share | numeric | YES | Diluted EPS (SAR) |
| debt_to_equity | numeric | YES | D/E ratio |
| current_ratio | numeric | YES | Current ratio |
| book_value_per_share | numeric | YES | BVPS (SAR) |
| pe_ratio | numeric | YES | Trailing P/E |
| pb_ratio | numeric | YES | Price/Book |
| roe | numeric | YES | Return on equity |
| return_on_assets | numeric | YES | Return on assets |
| shares_outstanding | numeric | YES | Shares outstanding |
| enterprise_value | numeric | YES | Enterprise value (SAR) |
| gross_margin | numeric | YES | Gross margin (decimal) |
| operating_margin | numeric | YES | Operating margin (decimal) |
| profit_margin | numeric | YES | Net profit margin (decimal). Maps to `net_margin` in metrics |
| revenue_growth | numeric | YES | Revenue growth rate |
| source_name | text | YES | Data source (e.g. 'yahoo_finance') |
| source_ref | text | YES | Source reference ID |
| fetched_at | timestamptz | YES | When data was fetched |
| created_at | timestamptz | YES | Row creation timestamp |
| updated_at | timestamptz | YES | Last update timestamp |

**Key notes:**
- Balance sheet and cash flow fields are **2024 only** (Yahoo Finance limitation for Saudi stocks).
- Income statement fields (revenue, net_income, gross_profit, EPS) available for 2020–2025 with varying coverage.
- `profit_margin` in financials maps to `net_margin` in company_metrics_daily.
- `return_on_assets` in financials maps to `roa` in company_metrics_daily.
- Year 2025 data exists for 15 companies (fiscal year ending 2025).

---

## Table 4: `dividends`

**Purpose:** Historical dividend payment records. Multiple rows per company (one per dividend event).

**Row count:** 1,250 records

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| company_id | uuid | NO | FK → companies.id |
| ex_date | date | YES | Ex-dividend date. Range: 2016-03-31 to 2026-03-24 |
| pay_date | date | YES | Payment date. **ALL VALUES ARE NULL** (Yahoo limitation) |
| record_date | date | YES | Record date |
| amount_per_share | numeric | NO | Dividend amount per share (SAR) |
| dividend_per_share | numeric | YES | Alternate DPS field (synced with amount_per_share) |
| dividend_type | text | YES | Type of dividend (regular, special, etc.) |
| currency | text | YES | Default 'SAR' |
| year | integer | YES | Dividend year (derived from ex_date) |
| source_name | text | YES | Data source identifier |
| fetched_at | timestamptz | YES | When data was fetched |
| created_at | timestamptz | YES | Row creation timestamp |

**Key notes:**
- 98 companies have dividend records; 20 companies have zero dividends.
- `pay_date` is NULL for ALL 1,250 records. Use `ex_date` for date-based queries.
- Use `amount_per_share` as the canonical dividend amount column.
- Year range: 2016–2026. Coverage is sparse before 2021.
- Special dividends exist (e.g., SIIG SAR 10.00 in 2025) — yield calculations use 2024-only DPS to avoid distortion.

---

## Table 5: `stock_prices`

**Purpose:** Daily OHLCV price data for all 118 companies. Source: Sahm API via scheduled cron job.

**Row count:** 29,310 rows

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | bigint | NO | Primary key (auto-increment) |
| company_id | uuid | NO | FK → companies.id |
| date | date | NO | Trading date |
| open | numeric | YES | Opening price (SAR). Default 0 |
| high | numeric | YES | Day high (SAR). Default 0 |
| low | numeric | YES | Day low (SAR). Default 0 |
| close | numeric | YES | Closing price (SAR). Default 0 |
| volume | bigint | YES | Trading volume (shares). Default 0 |
| adjusted_close | numeric | YES | Adjusted close (sparse) |
| value_traded | numeric | YES | Value traded in SAR (sparse) |
| source_name | text | YES | Data source identifier |
| fetched_at | timestamptz | YES | When data was fetched |

**Key notes:**
- Date range: 2025-01-01 to 2026-03-12 (287 trading days).
- 118 companies covered. Average ~248 rows per company.
- Column name is `date` (not `as_of_date` — differs from company_metrics_daily).
- No price history before 2025-01-01 — this prevents computing `return_3y`.

---

## Table 6: `sector_averages`

**Purpose:** Sector-level aggregate statistics for peer comparison. One row per sector plus one "Market" row for all-company benchmarks.

**Row count:** 18 (17 sectors + 1 Market)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| sector | text | NO | Sector name or "Market" for all-company aggregate |
| as_of_date | date | NO | Date of computation |
| company_count | integer | YES | Number of companies in sector |
| total_market_cap | numeric | YES | Sum of market caps in sector (SAR) |
| avg_pe | numeric | YES | Mean P/E ratio |
| median_pe | numeric | YES | Median P/E ratio |
| avg_pb | numeric | YES | Mean P/B ratio |
| median_pb | numeric | YES | Median P/B ratio |
| avg_ps | numeric | YES | Mean P/S ratio |
| median_ps | numeric | YES | Median P/S ratio |
| avg_ev_ebitda | numeric | YES | Mean EV/EBITDA |
| median_ev_ebitda | numeric | YES | Median EV/EBITDA |
| avg_dividend_yield | numeric | YES | Mean dividend yield |
| median_dividend_yield | numeric | YES | Median dividend yield |
| avg_roe | numeric | YES | Mean ROE |
| median_roe | numeric | YES | Median ROE |
| avg_roa | numeric | YES | Mean ROA |
| avg_net_margin | numeric | YES | Mean net margin |
| median_net_margin | numeric | YES | Median net margin |
| avg_operating_margin | numeric | YES | Mean operating margin |
| avg_debt_to_equity | numeric | YES | Mean D/E ratio |
| avg_current_ratio | numeric | YES | Mean current ratio |
| avg_revenue_growth | numeric | YES | Mean revenue growth |
| avg_earnings_growth | numeric | YES | Mean earnings growth |
| avg_payout_ratio | numeric | YES | Mean payout ratio |
| avg_volatility_30d | numeric | YES | Mean 30-day volatility |
| avg_return_1m | numeric | YES | Mean 1-month return |
| avg_return_1y | numeric | YES | Mean 1-year return |
| updated_at | timestamptz | YES | Last update timestamp |

**Key notes:**
- Always prefer `median_*` over `avg_*` for sectors with outliers (Transportation, Utilities).
- The "Market" row provides an all-company benchmark for cross-sector comparison.
- 17 sectors: Banks (10), Commercial Services (2), Consumer Services (5), Energy (7), Financial Services (4), Food & Beverages (8), Health Care (7), Information Technology (5), Insurance (8), Materials (24), Media (3), Real Estate (7), REITs (6), Retailing (8), Telecommunication (4), Transportation (6), Utilities (4).

---

## Table 7: `news`

**Purpose:** Company-related news articles with multilingual titles and bodies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| company_id | uuid | YES | FK → companies.id (nullable for market-wide news) |
| title_ar | text | YES | Arabic headline |
| title_en | text | YES | English headline |
| title_zh | text | YES | Chinese headline (sparse) |
| body_ar | text | YES | Arabic article body |
| body_en | text | YES | English article body |
| body_zh | text | YES | Chinese article body (sparse) |
| source | text | YES | News source name |
| source_url | text | YES | Original article URL |
| published_at | timestamptz | YES | Publication date |
| created_at | timestamptz | YES | Row creation timestamp |
| sentiment_score | numeric | YES | Sentiment analysis score |

**Key notes:**
- Use OR filter for ticker matching in news queries (a single news item may mention multiple companies).
- `company_id` can be NULL for market-wide or sector-wide news.

---

## Relationships

```
companies (id)
  ├── company_metrics_daily (company_id) — 1:1
  ├── financials (company_id) — 1:many (one per fiscal year)
  ├── dividends (company_id) — 1:many (one per dividend event)
  ├── stock_prices (company_id) — 1:many (one per trading day)
  └── news (company_id) — 1:many (one per article)

sector_averages — standalone lookup table (join on companies.sector = sector_averages.sector)
```

---

## 17 Sectors

| Sector | Company Count | Largest Company |
|--------|--------------|-----------------|
| Materials | 24 | SABIC |
| Banks | 10 | Al Rajhi Bank |
| Food & Beverages | 8 | Almarai |
| Insurance | 8 | Tawuniya |
| Retailing | 8 | Jarir |
| Energy | 7 | Saudi Aramco |
| Health Care | 7 | Mouwasat |
| Real Estate | 7 | Dar Al Arkan |
| REITs | 6 | Al Rajhi REIT |
| Transportation | 6 | Bahri |
| Consumer Services | 5 | — |
| Information Technology | 5 | — |
| Financial Services | 4 | — |
| Telecommunication | 4 | stc |
| Utilities | 4 | SEC |
| Media | 3 | SRMG |
| Commercial Services | 2 | — |

---

## Edge Functions (10 deployed)

| Function | JWT Required | Purpose |
|----------|-------------|---------|
| fetch-fundamentals | No | Single-company Yahoo fundamentals |
| fetch-price-history | No | Single-company price history |
| probe-financials | Yes | Test Yahoo API access |
| batch-financials | Yes | Batch fundamentals fetch |
| batch-history | Yes | Batch price history fetch |
| batch-dividends | No | Batch dividend fetch |
| batch-capex-ratio | No | Batch capex/ratio fetch |
| batch-company-profiles | No | Batch company profile fetch |
| batch-historical-financials | No | Multi-year Yahoo income/balance/cashflow |

**Invocation pattern:** Edge Functions are invoked via `pg_net` (`net.http_post()`) from PostgreSQL, not directly from the front-end. This bypasses egress restrictions on the application tier.
