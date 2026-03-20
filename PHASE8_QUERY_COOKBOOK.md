# SŪQAI Phase 8: Query Cookbook

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Overview

Production-ready SQL queries for front-end builders working with the SŪQAI database. All queries use correct column names, handle NULLs, and return results in formats suitable for UI rendering.

**Convention:** All queries assume the caller has access to the Supabase `public` schema via the PostgREST API or direct SQL. Supabase client library equivalents are noted where patterns differ.

---

## 1. Stock Screening by Score & Tier

### Get all "Buy" and "Strong Buy" stocks

```sql
SELECT
  c.ticker,
  c.name_en,
  c.name_ar,
  c.sector,
  m.suqai_score,
  m.score_tier,
  m.close_price,
  m.market_cap,
  m.pe_ratio,
  m.dividend_yield,
  m.roe
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_tier IN ('Buy', 'Strong Buy')
ORDER BY m.suqai_score DESC;
```

### Get stocks by tier with pagination

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.suqai_score,
  m.score_tier,
  m.close_price,
  m.market_cap
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_tier = 'Hold'
ORDER BY m.suqai_score DESC
LIMIT 20 OFFSET 0;
```

### Top N stocks by score (leaderboard)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.name_ar,
  c.sector,
  m.suqai_score,
  m.score_tier,
  m.score_value,
  m.score_quality,
  m.score_growth,
  m.score_momentum,
  m.score_dividend,
  m.score_safety
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
ORDER BY m.suqai_score DESC
LIMIT 10;
```

### Bottom N stocks (worst performers)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.suqai_score,
  m.score_tier,
  m.roe,
  m.debt_to_equity,
  m.return_1y
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
ORDER BY m.suqai_score ASC
LIMIT 10;
```

---

## 2. Individual Stock Detail

### Full stock profile (single company page)

```sql
SELECT
  c.ticker,
  c.symbol,
  c.name_en,
  c.name_ar,
  c.sector,
  c.sub_sector,
  c.market,
  c.is_shariah_compliant,
  c.description,
  c.website_url,
  c.logo_url,
  c.ceo_name_en,
  c.ceo_name_ar,
  c.employee_count,
  c.founded_year,
  c.shares_outstanding,
  c.isin,
  m.as_of_date,
  m.close_price,
  m.market_cap,
  m.suqai_score,
  m.score_tier,
  m.score_value,
  m.score_quality,
  m.score_growth,
  m.score_momentum,
  m.score_dividend,
  m.score_safety,
  m.pe_ratio,
  m.pb_ratio,
  m.ps_ratio,
  m.ev_ebitda,
  m.dividend_yield,
  m.payout_ratio,
  m.years_of_dividends,
  m.dividend_cagr_3y,
  m.roe,
  m.roa,
  m.roce,
  m.net_margin,
  m.operating_margin,
  m.revenue_growth_yoy,
  m.earnings_growth_yoy,
  m.eps_growth_yoy,
  m.debt_to_equity,
  m.current_ratio,
  m.interest_coverage,
  m.net_debt_ebitda,
  m.ocf_to_debt,
  m.return_1d,
  m.return_1w,
  m.return_1m,
  m.return_3m,
  m.return_1y,
  m.week52_high,
  m.week52_low,
  m.week52_high_distance,
  m.volatility_30d,
  m.relative_perf_vs_tasi,
  m.sector_pctile_pe,
  m.sector_pctile_pb,
  m.sector_pctile_roe,
  m.sector_pctile_net_margin,
  m.sector_pctile_dividend_yield,
  m.sector_pctile_revenue_growth,
  m.sector_pctile_debt_to_equity,
  m.sector_pctile_return_1y,
  m.sector_rank_market_cap,
  m.sector_peer_count
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE c.ticker = '7010';
```

**Supabase JS equivalent:**
```javascript
const { data } = await supabase
  .from('company_metrics_daily')
  .select('*, companies(*)')
  .eq('companies.ticker', '7010')
  .single();
```

### Stock with sector context (for comparison bars)

```sql
SELECT
  c.ticker,
  c.name_en,
  m.pe_ratio,
  m.roe,
  m.net_margin,
  m.dividend_yield,
  m.debt_to_equity,
  sa.median_pe AS sector_median_pe,
  sa.median_roe AS sector_median_roe,
  sa.median_net_margin AS sector_median_net_margin,
  sa.median_dividend_yield AS sector_median_dividend_yield,
  sa.avg_debt_to_equity AS sector_avg_debt_to_equity,
  m.sector_pctile_pe,
  m.sector_pctile_roe,
  m.sector_pctile_net_margin,
  m.sector_pctile_dividend_yield,
  m.sector_pctile_debt_to_equity
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
JOIN sector_averages sa ON sa.sector = c.sector
WHERE c.ticker = '2222';
```

---

## 3. Sector Queries

### Sector overview (dashboard heat map)

```sql
SELECT
  sector,
  company_count,
  total_market_cap,
  median_pe,
  median_roe,
  median_net_margin,
  median_dividend_yield,
  avg_return_1m,
  avg_return_1y,
  avg_volatility_30d
FROM sector_averages
WHERE sector != 'Market'
ORDER BY total_market_cap DESC;
```

### Market-wide benchmark

```sql
SELECT *
FROM sector_averages
WHERE sector = 'Market';
```

### All companies in a sector (sector drill-down page)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.name_ar,
  m.suqai_score,
  m.score_tier,
  m.close_price,
  m.market_cap,
  m.pe_ratio,
  m.roe,
  m.net_margin,
  m.dividend_yield,
  m.return_1y,
  m.sector_rank_market_cap,
  m.sector_pctile_roe
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE c.sector = 'Banks'
ORDER BY m.suqai_score DESC;
```

### Sector comparison table (all sectors side by side)

```sql
SELECT
  sector,
  company_count,
  ROUND(total_market_cap / 1e9, 1) AS market_cap_billions,
  ROUND(median_pe::numeric, 1) AS median_pe,
  ROUND((median_roe * 100)::numeric, 1) AS median_roe_pct,
  ROUND((median_net_margin * 100)::numeric, 1) AS median_margin_pct,
  ROUND((median_dividend_yield * 100)::numeric, 1) AS median_yield_pct,
  ROUND((avg_return_1y * 100)::numeric, 1) AS avg_return_1y_pct
FROM sector_averages
WHERE sector != 'Market'
ORDER BY total_market_cap DESC;
```

---

## 4. Screening Queries

### Value screen (cheap + profitable)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.pe_ratio,
  m.pb_ratio,
  m.roe,
  m.net_margin,
  m.suqai_score,
  m.score_value
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.pe_ratio IS NOT NULL
  AND m.pe_ratio < 15
  AND m.roe IS NOT NULL
  AND m.roe > 0.10
  AND m.net_margin > 0
ORDER BY m.score_value DESC;
```

### Dividend income screen

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.dividend_yield,
  m.payout_ratio,
  m.years_of_dividends,
  m.dividend_cagr_3y,
  m.debt_to_equity,
  m.suqai_score,
  m.score_dividend
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.dividend_yield IS NOT NULL
  AND m.dividend_yield > 0.03
  AND m.years_of_dividends >= 3
ORDER BY m.dividend_yield DESC;
```

### Growth screen

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.revenue_growth_yoy,
  m.earnings_growth_yoy,
  m.return_1y,
  m.suqai_score,
  m.score_growth
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.revenue_growth_yoy IS NOT NULL
  AND m.revenue_growth_yoy > 0.10
  AND m.earnings_growth_yoy IS NOT NULL
  AND m.earnings_growth_yoy > 0.10
ORDER BY m.score_growth DESC;
```

### Safety / low-risk screen

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.debt_to_equity,
  m.current_ratio,
  m.ocf_to_debt,
  m.interest_coverage,
  m.volatility_30d,
  m.suqai_score,
  m.score_safety
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.debt_to_equity IS NOT NULL
  AND m.debt_to_equity < 1.0
  AND m.current_ratio IS NOT NULL
  AND m.current_ratio > 1.5
ORDER BY m.score_safety DESC;
```

### Momentum screen (best recent performers)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.return_1m,
  m.return_3m,
  m.return_1y,
  m.week52_high_distance,
  m.volatility_30d,
  m.suqai_score,
  m.score_momentum
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.return_1y IS NOT NULL
  AND m.return_1y > 0
ORDER BY m.return_1y DESC
LIMIT 20;
```

### Shariah-compliant stocks only

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.suqai_score,
  m.score_tier,
  m.close_price,
  m.market_cap,
  m.dividend_yield
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE c.is_shariah_compliant = true
ORDER BY m.suqai_score DESC;
```

### Multi-factor screen (custom screener)

```sql
-- Example: Cheap + growing + pays dividends + low debt
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.suqai_score,
  m.pe_ratio,
  m.revenue_growth_yoy,
  m.dividend_yield,
  m.debt_to_equity
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.pe_ratio IS NOT NULL AND m.pe_ratio BETWEEN 5 AND 20
  AND m.revenue_growth_yoy IS NOT NULL AND m.revenue_growth_yoy > 0.05
  AND m.dividend_yield IS NOT NULL AND m.dividend_yield > 0.02
  AND m.debt_to_equity IS NOT NULL AND m.debt_to_equity < 1.5
ORDER BY m.suqai_score DESC;
```

---

## 5. Price History

### Price chart data (all history for one stock)

```sql
SELECT
  sp.date,
  sp.open,
  sp.high,
  sp.low,
  sp.close,
  sp.volume,
  sp.value_traded
FROM stock_prices sp
JOIN companies c ON c.id = sp.company_id
WHERE c.ticker = '2222'
ORDER BY sp.date ASC;
```

### Recent prices (last 30 trading days)

```sql
SELECT
  sp.date,
  sp.close,
  sp.volume
FROM stock_prices sp
JOIN companies c ON c.id = sp.company_id
WHERE c.ticker = '2222'
ORDER BY sp.date DESC
LIMIT 30;
```

### Latest price for all companies (market overview)

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.close_price,
  m.return_1d,
  m.return_1w,
  m.market_cap
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
ORDER BY m.market_cap DESC;
```

### Top gainers / losers (daily)

```sql
-- Top gainers
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.close_price,
  m.return_1d
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.return_1d IS NOT NULL
ORDER BY m.return_1d DESC
LIMIT 10;

-- Top losers
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.close_price,
  m.return_1d
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.return_1d IS NOT NULL
ORDER BY m.return_1d ASC
LIMIT 10;
```

---

## 6. Dividend History

### Dividend history for one company

```sql
SELECT
  d.ex_date,
  d.amount_per_share,
  d.dividend_per_share,
  d.dividend_type,
  d.year
FROM dividends d
JOIN companies c ON c.id = d.company_id
WHERE c.ticker = '7010'
ORDER BY d.ex_date DESC;
```

### Annual dividend summary per company

```sql
SELECT
  d.year,
  SUM(d.amount_per_share) AS annual_dps,
  COUNT(*) AS payment_count
FROM dividends d
JOIN companies c ON c.id = d.company_id
WHERE c.ticker = '1120'
GROUP BY d.year
ORDER BY d.year DESC;
```

### Companies with longest dividend history

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.years_of_dividends,
  m.dividend_yield,
  m.dividend_cagr_3y,
  m.payout_ratio
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.years_of_dividends > 0
ORDER BY m.years_of_dividends DESC, m.dividend_yield DESC;
```

### Highest-yielding stocks

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.dividend_yield,
  m.payout_ratio,
  m.years_of_dividends,
  m.suqai_score
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.dividend_yield IS NOT NULL
ORDER BY m.dividend_yield DESC
LIMIT 15;
```

---

## 7. Financial Trends

### Multi-year financials for one company (financial trends chart)

```sql
SELECT
  f.year,
  f.period,
  f.revenue,
  f.net_income,
  f.gross_profit,
  f.operating_income,
  f.earnings_per_share,
  f.gross_margin,
  f.operating_margin,
  f.profit_margin,
  f.debt_to_equity,
  f.roe,
  f.return_on_assets
FROM financials f
JOIN companies c ON c.id = f.company_id
WHERE c.ticker = '2222'
ORDER BY f.year ASC;
```

### Latest fiscal year financials (balance sheet snapshot)

```sql
SELECT
  c.ticker,
  c.name_en,
  f.year,
  f.revenue,
  f.net_income,
  f.total_assets,
  f.total_liabilities,
  f.total_equity,
  f.cash,
  f.total_debt,
  f.operating_cash_flow,
  f.free_cash_flow,
  f.earnings_per_share,
  f.book_value_per_share,
  f.shares_outstanding
FROM financials f
JOIN companies c ON c.id = f.company_id
WHERE c.ticker = '1010'
  AND f.year = 2024;
```

---

## 8. Score Dimension Drill-Down

### Radar chart data (6 dimensions for one stock)

```sql
SELECT
  c.ticker,
  c.name_en,
  m.suqai_score,
  m.score_value,
  m.score_quality,
  m.score_growth,
  m.score_momentum,
  m.score_dividend,
  m.score_safety
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE c.ticker = '4190';
```

### Compare two stocks side by side

```sql
SELECT
  c.ticker,
  c.name_en,
  m.suqai_score,
  m.score_tier,
  m.score_value,
  m.score_quality,
  m.score_growth,
  m.score_momentum,
  m.score_dividend,
  m.score_safety,
  m.pe_ratio,
  m.roe,
  m.dividend_yield,
  m.debt_to_equity,
  m.return_1y
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE c.ticker IN ('1120', '1010')
ORDER BY m.suqai_score DESC;
```

### Best in each dimension

```sql
-- Highest Value score
SELECT c.ticker, c.name_en, m.score_value
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_value IS NOT NULL
ORDER BY m.score_value DESC LIMIT 5;

-- Highest Quality score
SELECT c.ticker, c.name_en, m.score_quality
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_quality IS NOT NULL
ORDER BY m.score_quality DESC LIMIT 5;

-- Highest Growth score
SELECT c.ticker, c.name_en, m.score_growth
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_growth IS NOT NULL
ORDER BY m.score_growth DESC LIMIT 5;

-- Highest Momentum score
SELECT c.ticker, c.name_en, m.score_momentum
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_momentum IS NOT NULL
ORDER BY m.score_momentum DESC LIMIT 5;

-- Highest Dividend score
SELECT c.ticker, c.name_en, m.score_dividend
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_dividend IS NOT NULL
ORDER BY m.score_dividend DESC LIMIT 5;

-- Highest Safety score
SELECT c.ticker, c.name_en, m.score_safety
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
WHERE m.score_safety IS NOT NULL
ORDER BY m.score_safety DESC LIMIT 5;
```

---

## 9. News

### Latest news for a company

```sql
SELECT
  n.title_en,
  n.title_ar,
  n.source,
  n.source_url,
  n.published_at,
  n.sentiment_score
FROM news n
JOIN companies c ON c.id = n.company_id
WHERE c.ticker = '2222'
ORDER BY n.published_at DESC
LIMIT 10;
```

### Market-wide news feed (latest)

```sql
SELECT
  n.title_en,
  n.title_ar,
  c.ticker,
  c.name_en,
  n.source,
  n.source_url,
  n.published_at,
  n.sentiment_score
FROM news n
JOIN companies c ON c.id = n.company_id
ORDER BY n.published_at DESC
LIMIT 20;
```

---

## 10. Aggregate / Dashboard Queries

### Market summary stats

```sql
SELECT
  COUNT(*) AS total_companies,
  ROUND(SUM(m.market_cap) / 1e9, 0) AS total_market_cap_billions,
  ROUND(AVG(m.return_1d)::numeric * 100, 2) AS avg_daily_return_pct,
  COUNT(*) FILTER (WHERE m.return_1d > 0) AS gainers,
  COUNT(*) FILTER (WHERE m.return_1d < 0) AS losers,
  COUNT(*) FILTER (WHERE m.return_1d = 0 OR m.return_1d IS NULL) AS unchanged
FROM company_metrics_daily m;
```

### Tier distribution

```sql
SELECT
  m.score_tier,
  COUNT(*) AS count,
  ROUND(AVG(m.suqai_score)::numeric, 1) AS avg_score,
  ROUND(MIN(m.suqai_score)::numeric, 1) AS min_score,
  ROUND(MAX(m.suqai_score)::numeric, 1) AS max_score
FROM company_metrics_daily m
GROUP BY m.score_tier
ORDER BY MIN(m.suqai_score) DESC;
```

### Score distribution histogram (for chart)

```sql
SELECT
  FLOOR(m.suqai_score / 5) * 5 AS bucket_start,
  FLOOR(m.suqai_score / 5) * 5 + 5 AS bucket_end,
  COUNT(*) AS count
FROM company_metrics_daily m
WHERE m.suqai_score IS NOT NULL
GROUP BY FLOOR(m.suqai_score / 5)
ORDER BY bucket_start;
```

### Largest companies by market cap

```sql
SELECT
  c.ticker,
  c.name_en,
  c.sector,
  m.market_cap,
  m.suqai_score,
  m.score_tier
FROM company_metrics_daily m
JOIN companies c ON c.id = m.company_id
ORDER BY m.market_cap DESC
LIMIT 20;
```

---

## 11. Supabase JS Client Patterns

### Basic query with join

```javascript
const { data, error } = await supabase
  .from('company_metrics_daily')
  .select(`
    suqai_score,
    score_tier,
    close_price,
    market_cap,
    pe_ratio,
    roe,
    dividend_yield,
    companies (
      ticker,
      name_en,
      name_ar,
      sector
    )
  `)
  .order('suqai_score', { ascending: false })
  .limit(10);
```

### Filtering with NULL awareness

```javascript
// Get stocks with valid PE ratio
const { data } = await supabase
  .from('company_metrics_daily')
  .select('*, companies(ticker, name_en, sector)')
  .not('pe_ratio', 'is', null)
  .lt('pe_ratio', 15)
  .gt('roe', 0.10)
  .order('suqai_score', { ascending: false });
```

### Sector filter

```javascript
const { data } = await supabase
  .from('company_metrics_daily')
  .select('*, companies!inner(ticker, name_en, sector)')
  .eq('companies.sector', 'Banks')
  .order('suqai_score', { ascending: false });
```

### Single stock lookup by ticker

```javascript
const { data } = await supabase
  .from('company_metrics_daily')
  .select('*, companies!inner(ticker, name_en, name_ar, sector)')
  .eq('companies.ticker', '7010')
  .single();
```

### Price history for chart

```javascript
const { data } = await supabase
  .from('stock_prices')
  .select('date, close, volume')
  .eq('company_id', companyId)
  .order('date', { ascending: true });
```

---

## 12. Common Pitfalls

### Column name gotchas

| Wrong | Correct | Table |
|-------|---------|-------|
| `date` | `as_of_date` | company_metrics_daily |
| `ticker_symbol` | `ticker` | companies |
| `payment_date` | `pay_date` | dividends (all NULL) |
| `body` | `content` | net._http_response |
| `net_margin` | `profit_margin` | financials |
| `return_on_assets` | `roa` | company_metrics_daily |

### Margin/ROE storage format

Margins and ROE are stored as **decimals** in `company_metrics_daily`:
- `roe = 0.25` means 25%
- `net_margin = 0.15` means 15%
- `dividend_yield = 0.05` means 5%

To display as percentages:
```sql
ROUND((m.roe * 100)::numeric, 1) AS roe_pct
```

### NULL handling in UI

Always check for NULL before displaying. Recommended patterns:

```javascript
// Display value or fallback
const displayPE = metric.pe_ratio !== null
  ? metric.pe_ratio.toFixed(1)
  : 'N/A';

// Tooltip for N/A
const peTooltip = metric.pe_ratio === null
  ? 'PE not available — likely negative earnings'
  : `PE ratio: ${metric.pe_ratio.toFixed(1)}`;
```

### Percentile interpretation

Sector percentiles are 0.0–1.0 where **1.0 is always "best"**:
- `sector_pctile_pe = 1.0` → cheapest PE in sector
- `sector_pctile_roe = 1.0` → highest ROE in sector
- `sector_pctile_debt_to_equity = 1.0` → lowest leverage in sector

For display as percentage: multiply by 100.

### ROUND() requires ::numeric cast

PostgreSQL `ROUND()` does not accept `double precision` directly:
```sql
-- Wrong: ROUND(m.roe, 2)
-- Correct:
ROUND(m.roe::numeric, 2)
```

---

## 13. Performance Tips

1. **company_metrics_daily is a single-snapshot table** (118 rows). All queries on it are fast regardless of complexity. No date filtering needed.

2. **stock_prices is the largest table** (~29,310 rows). Always filter by `company_id` for single-stock queries. For market-wide price queries, consider using `company_metrics_daily.close_price` instead.

3. **financials has ~341 rows.** Filter by `year` and/or `company_id` for efficiency.

4. **dividends has 1,250 rows.** Filter by `company_id` for single-stock views.

5. **JOIN pattern:** Always join `company_metrics_daily` → `companies` via `company_id = companies.id`. Use `!inner` in Supabase JS when filtering on company fields.

6. **Sector averages has 18 rows.** Cache this table client-side; it rarely changes.
