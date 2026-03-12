# SŪQAI Data Contract
Schema Version: **v2.0**
Last Updated: 2026-03-12

---

## Ownership Rules

| Layer | Owner | May Write | May Read |
|-------|-------|-----------|----------|
| `raw.*` | Data Agent | Yes | Yes |
| `staging.*` | Data Agent | Yes | Yes |
| `public.companies` | Data Agent | Yes (upsert) | Both |
| `public.stock_prices` | Data Agent | Yes (upsert) | Both |
| `public.financials` | Data Agent | Yes (upsert) | Both |
| `public.dividends` | Data Agent | Yes (upsert) | Both |
| `public.earnings` | Data Agent | Yes (upsert) | Both |
| `public.analyst_ratings` | Data Agent | Yes (upsert) | Both |
| `public.ownership` | Data Agent | Yes (upsert) | Both |
| `public.company_metrics_daily` | Data Agent (compute job) | Yes | Both |
| `public.company_scores_daily` | Data Agent (compute job) | Yes | Both |
| `public.sector_averages` | Data Agent (compute job) | Yes | Both |
| `public.etl_job_runs` | Data Agent | Yes | Both |
| `public.etl_row_errors` | Data Agent | Yes | Both |
| `public.portfolios` | Builder Agent / User | Yes | Builder |
| `public.portfolio_holdings` | Builder Agent / User | Yes | Builder |
| `public.watchlists` | Builder Agent / User | Yes | Builder |
| `public.watchlist_items` | Builder Agent / User | Yes | Builder |
| `public.alerts` | Builder Agent / User | Yes | Builder |
| All UI code, API routes | Builder Agent | Yes | Builder |

**Neither agent may change table structure without a migration file and a contract version bump.**

---

## Database Access

- **Supabase REST API:** `https://fszmvnmfazgjhsrbbpvx.supabase.co/rest/v1`
- **Auth headers** (required on every request):
  ```
  apikey: [service_role_key from .env.supabase]
  Authorization: Bearer [same key]
  Content-Type: application/json
  ```
- **Upsert header:** `Prefer: resolution=merge-duplicates,return=minimal`

---

## Schema: Public Tables (Durable)

### public.companies
Primary source of truth for all company identity data.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | gen_random_uuid() |
| ticker | text UNIQUE | No | e.g. "2222" |
| name_en | text | No | English name |
| name_ar | text | Yes | Arabic name |
| sector | text | Yes | DB sector name (matches i18n.ts sectorMap) |
| sector_ar | text | Yes | Arabic sector name |
| market_cap | numeric | Yes | Full SAR value |
| shares_outstanding | bigint | Yes | |
| isin | text | Yes | |
| logo_url | text | Yes | |
| market | text | Yes | "main" or "nomu" |
| currency | text | Yes | Default "SAR" |
| created_at | timestamptz | No | |
| updated_at | timestamptz | No | |

**Unique constraint:** `ticker`
**Current count:** 119 records (populated)

---

### public.stock_prices
Daily OHLCV price data.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| date | date | No | |
| open | numeric(12,2) | Yes | |
| high | numeric(12,2) | Yes | |
| low | numeric(12,2) | Yes | |
| close | numeric(12,2) | No | |
| volume | bigint | Yes | |
| value_traded | numeric | Yes | Total SAR traded |
| adjusted_close | numeric(12,2) | Yes | Adjusted for splits |
| source_name | text | Yes | |
| fetched_at | timestamptz | Yes | |
| created_at | timestamptz | No | |

**Unique constraint:** `(company_id, date)`
**Update frequency:** Intraday during market hours (1-5 min), EOD batch
**Current count:** 0 (EMPTY — Priority 1)

---

### public.financials
Quarterly and annual financial statements.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| year | integer | No | Fiscal year |
| period | text | No | 'annual', 'Q1', 'Q2', 'Q3', 'Q4' |
| revenue | numeric | Yes | Full SAR |
| gross_profit | numeric | Yes | |
| operating_income | numeric | Yes | |
| net_income | numeric | Yes | Full SAR |
| earnings_per_share | numeric | Yes | SAR per share |
| total_assets | numeric | Yes | Full SAR |
| total_liabilities | numeric | Yes | Full SAR |
| total_equity | numeric | Yes | Full SAR |
| cash | numeric | Yes | Cash and equivalents |
| total_debt | numeric | Yes | |
| operating_cash_flow | numeric | Yes | |
| capex | numeric | Yes | |
| free_cash_flow | numeric | Yes | OCF - capex |
| current_ratio | numeric | Yes | |
| debt_to_equity | numeric | Yes | |
| source_name | text | Yes | |
| source_ref | text | Yes | URL or document ref |
| fetched_at | timestamptz | Yes | |
| created_at | timestamptz | No | |
| updated_at | timestamptz | No | |

**Unique constraint:** `(company_id, year, period)`
**Update frequency:** Quarterly (on filing release)
**Current count:** Partial — revenue/net_income/EPS exist for some companies; total_assets, total_liabilities, operating_cash_flow, current_ratio are NULL

---

### public.dividends

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| ex_date | date | No | |
| record_date | date | Yes | |
| payment_date | date | Yes | |
| dividend_per_share | numeric | No | SAR per share |
| dividend_type | text | Yes | 'cash', 'stock', 'special' |
| currency | text | No | Default 'SAR' |
| source_name | text | Yes | |
| fetched_at | timestamptz | Yes | |
| created_at | timestamptz | No | |

**Unique constraint:** `(company_id, ex_date)`
**Update frequency:** As announced
**Current count:** 0 (EMPTY — Priority 2)

---

### public.analyst_ratings

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| forecast_year | integer | Yes | |
| revenue_estimate | numeric | Yes | |
| earnings_estimate | numeric | Yes | |
| eps_estimate | numeric | Yes | |
| target_price | numeric | Yes | |
| dividend_estimate | numeric | Yes | |
| analyst_count | integer | Yes | |
| analyst_firm | text | Yes | |
| rating | text | Yes | 'buy', 'hold', 'sell' |
| source_name | text | Yes | |
| fetched_at | timestamptz | Yes | |
| updated_at | timestamptz | No | |

**Unique constraint:** `(company_id, analyst_firm)` or `(company_id, forecast_year)`
**Update frequency:** When estimates change
**Current count:** 0

---

### public.company_metrics_daily
Pre-computed ratios. **Calculated by backend job, not by UI.**

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| as_of_date | date | No | |
| close_price | numeric | Yes | |
| market_cap | numeric | Yes | |
| pe_ratio | numeric | Yes | price / EPS |
| forward_pe | numeric | Yes | price / forward EPS |
| pb_ratio | numeric | Yes | market_cap / total_equity |
| ps_ratio | numeric | Yes | market_cap / revenue |
| peg_ratio | numeric | Yes | PE / earnings_growth |
| ev_ebitda | numeric | Yes | |
| dividend_yield | numeric | Yes | Decimal (0.035 = 3.5%) |
| payout_ratio | numeric | Yes | dividends / net_income |
| cash_payout_ratio | numeric | Yes | dividends / FCF |
| roe | numeric | Yes | net_income / avg_equity |
| roa | numeric | Yes | net_income / avg_assets |
| roce | numeric | Yes | |
| net_margin | numeric | Yes | Decimal |
| operating_margin | numeric | Yes | Decimal |
| debt_to_equity | numeric | Yes | |
| net_debt_ebitda | numeric | Yes | |
| interest_coverage | numeric | Yes | |
| current_ratio | numeric | Yes | |
| ocf_to_debt | numeric | Yes | |
| revenue_growth_yoy | numeric | Yes | Decimal |
| earnings_growth_yoy | numeric | Yes | Decimal |
| revenue_cagr_3y | numeric | Yes | |
| revenue_cagr_5y | numeric | Yes | |
| eps_growth_yoy | numeric | Yes | |
| dividend_cagr_3y | numeric | Yes | |
| years_of_dividends | integer | Yes | |
| return_1d | numeric | Yes | |
| return_1w | numeric | Yes | |
| return_1m | numeric | Yes | |
| return_3m | numeric | Yes | |
| return_1y | numeric | Yes | |
| return_3y | numeric | Yes | |
| week52_high | numeric | Yes | |
| week52_low | numeric | Yes | |
| week52_high_distance | numeric | Yes | Decimal |
| volatility_30d | numeric | Yes | |
| relative_perf_vs_tasi | numeric | Yes | |
| fair_value_estimate | numeric | Yes | |
| fair_value_gap | numeric | Yes | (fair_value - price) / price |
| schema_version | text | Yes | 'v2.0' |
| source_name | text | Yes | |
| updated_at | timestamptz | No | |

**Unique constraint:** `(company_id, as_of_date)`
**Update frequency:** Daily (after market close)
**Who writes:** Data Agent compute job only

---

### public.company_scores_daily
SŪQAI 5-pillar scores. **Calculated by scoring engine.**

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| company_id | uuid FK→companies | No | |
| as_of_date | date | No | |
| value_score | numeric(3,1) | Yes | 0.0 – 5.0 |
| growth_score | numeric(3,1) | Yes | 0.0 – 5.0 |
| performance_score | numeric(3,1) | Yes | 0.0 – 5.0 |
| health_score | numeric(3,1) | Yes | 0.0 – 5.0 |
| dividend_score | numeric(3,1) | Yes | 0.0 – 5.0 |
| overall_score | numeric(4,1) | Yes | 0 – 100 |
| value_checks | jsonb | Yes | Array of pass/fail checks |
| growth_checks | jsonb | Yes | |
| performance_checks | jsonb | Yes | |
| health_checks | jsonb | Yes | |
| dividend_checks | jsonb | Yes | |
| risk_flags | jsonb | Yes | Array of risk strings |
| insight_badges | jsonb | Yes | e.g. ["undervalued", "high_yield"] |
| schema_version | text | Yes | |
| updated_at | timestamptz | No | |

**Unique constraint:** `(company_id, as_of_date)`
**Update frequency:** Daily
**Who writes:** Data Agent scoring job only

---

### public.sector_averages
Market and sector benchmarks for comparison.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| sector | text | No | Matches companies.sector |
| as_of_date | date | No | |
| avg_pe | numeric | Yes | |
| avg_pb | numeric | Yes | |
| avg_dividend_yield | numeric | Yes | |
| avg_roe | numeric | Yes | |
| avg_debt_to_equity | numeric | Yes | |
| avg_revenue_growth | numeric | Yes | |
| avg_earnings_growth | numeric | Yes | |
| company_count | integer | Yes | |
| total_market_cap | numeric | Yes | |
| updated_at | timestamptz | No | |

**Unique constraint:** `(sector, as_of_date)`
**Update frequency:** Daily
**Special row:** sector = 'MARKET' for overall Tadawul averages

---

### public.etl_job_runs

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| job_name | text | No | e.g. 'fetch_prices', 'compute_metrics' |
| started_at | timestamptz | No | |
| finished_at | timestamptz | Yes | |
| status | text | No | 'running', 'success', 'failed' |
| rows_processed | integer | Yes | |
| rows_errored | integer | Yes | |
| details | jsonb | Yes | |

---

### public.etl_row_errors

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid PK | No | |
| job_run_id | uuid FK→etl_job_runs | No | |
| table_name | text | No | |
| row_data | jsonb | No | The row that failed |
| error_reason | text | No | |
| created_at | timestamptz | No | |

---

## Schema: Staging Tables

### staging.company_ingest
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ticker | text | |
| raw_data | jsonb | Full API response |
| source_name | text | |
| status | text | 'pending', 'validated', 'loaded', 'error' |
| error_message | text | |
| fetched_at | timestamptz | |

### staging.price_ingest
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ticker | text | |
| date | date | |
| ohlcv | jsonb | {open, high, low, close, volume} |
| source_name | text | |
| status | text | |
| fetched_at | timestamptz | |

### staging.financial_ingest
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ticker | text | |
| year | integer | |
| period | text | |
| raw_data | jsonb | Full statement JSON |
| source_name | text | |
| status | text | |
| fetched_at | timestamptz | |

### staging.dividend_ingest
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ticker | text | |
| raw_data | jsonb | |
| source_name | text | |
| status | text | |
| fetched_at | timestamptz | |

---

## Schema: Raw Tables

### raw.source_payloads
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| source_name | text | 'sahm_api', 'tadawul', 'mubasher', 'argaam' |
| endpoint | text | API endpoint or URL |
| ticker | text | Nullable (for market-wide fetches) |
| payload | jsonb | Exact API response |
| fetched_at | timestamptz | |

---

## Data Rules

### Number Formats
- All monetary values: **full SAR integers** (e.g. 385000000000, not 385B or 385M)
- Percentages: **decimals** (0.035 means 3.5%), NOT 3.5
- Ratios: raw numeric (P/E of 15.2 stored as 15.2)

### Dates
- All dates: **ISO 8601** (YYYY-MM-DD)
- All timestamps: **ISO 8601 with timezone** (YYYY-MM-DDTHH:MM:SSZ)

### Text
- Arabic names: `name_ar` column, NOT mixed into `name_en`
- Sector names: must match the 17 values in `src/lib/i18n.ts` sectorMap

### Sanity Checks
Before inserting financial data, verify against known benchmarks:
| Company | Expected Market Cap Range (SAR) |
|---------|-------------------------------|
| Aramco (2222) | ~7–8 trillion |
| Al Rajhi (1120) | ~300–400 billion |
| STC (7010) | ~180–220 billion |
| SABIC (2010) | ~200–300 billion |

If a value is off by more than 10x from these ranges, flag it as an error.

---

## Approved Data Sources

| Priority | Source | Use For |
|----------|--------|---------|
| 1 | Tadawul (tadawul.com.sa) | Official filings, dividends, corporate actions |
| 2 | SAHM API (`https://app.sahmk.sa/api/v1`) | Live prices, company profiles |
| 3 | Mubasher (mubasher.info) | Financial statements, ratios |
| 4 | Argaam (argaam.com) | Financial data, news, dividends |
| 5 | MarketWatch / Reuters | Cross-check only, not primary |

SAHM API auth: `X-API-Key: shmk_live_452344004c2e0bb6ecb6dfd0c3a12a7f89b4aacdf5b2f93d`

---

## Change Management

1. Any schema change requires a new migration file in `supabase/migrations/`
2. Migration file naming: `YYYYMMDDHHMMSS_description.sql`
3. After migration, update this contract's schema version
4. Both agents must re-read the contract after any version bump
5. **No direct production schema edits** — migrations only
