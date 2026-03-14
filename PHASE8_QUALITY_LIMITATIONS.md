# SŪQAI Phase 8: Data Quality & Limitations Report

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Purpose

This document catalogues every known data quality decision, limitation, structural gap, and trade-off in the SŪQAI database. It is the canonical reference for front-end builders, analysts, and future maintainers who need to understand why certain data looks the way it does and what cannot be improved without new data sources or infrastructure.

---

## 1. Data Source Limitations

### 1.1 Yahoo Finance (Primary Fundamentals Source)

Yahoo Finance is the sole source for balance sheet, income statement, and cash flow data for all 118 Saudi-listed companies.

**Known limitations:**

- **Limited historical depth for Saudi stocks.** Income statement items are available for roughly 2021–2024, but coverage is uneven. Many companies have only 2–3 years of data, not the 5+ years available for US-listed stocks.
- **No payment dates for Saudi dividends.** The `pay_date` column is NULL for all 1,250 dividend records. Yahoo provides `ex_date` only. This means dividend payment timing analysis is impossible.
- **No analyst consensus estimates.** Forward PE, PEG ratio, and earnings revision data are unavailable. The entire forward-looking dimension of valuation is absent.
- **Incomplete cash flow statements.** Operating cash flow and free cash flow are missing for roughly 10–25% of companies, particularly smaller ones outside the main index.
- **No quarterly granularity guarantee.** Some companies report annual-only via Yahoo, even though quarterly filings exist on Tadawul. The `period` field in `financials` may show "annual" where quarterly data would be more useful.
- **Stale fundamental data.** Yahoo does not guarantee real-time updates. Some fundamentals may lag actual filings by days or weeks.

### 1.2 Sahm API (Price & Market Data Source)

The Sahm API provides daily stock quotes and market summary data for the Saudi Exchange.

**Known limitations:**

- **No fundamental data.** The API provides quotes, market summary, gainers/losers only. All financial statement data must come from other sources.
- **No intraday data.** Only daily OHLCV bars are available. Intraday charts or real-time streaming are not supported.
- **Price history starts 2025-01-01.** The `stock_prices` table contains approximately 287 trading days (Jan 2025 – Mar 2026). Any analysis requiring longer price history (3-year return, 5-year charts) is not possible.

### 1.3 Tadawul (Saudi Exchange — Not Yet Integrated)

Tadawul publishes official quarterly and annual filings for all listed companies, but this data has not been programmatically integrated.

**What Tadawul could fix:**
- 2019 revenue data → enables `revenue_cagr_5y`
- Quarterly financial breakdowns for all companies
- Official dividend payment dates
- Arabic-language financial disclosures

---

## 2. NULL Handling Philosophy

### Core Principle: Missing > Misleading

Throughout all 8 phases, the database follows one rule: **a NULL value is always preferable to an incorrect or imputed value.** No zeros, no averages, no "best guesses" are substituted for missing data.

### How NULLs Propagate

```
Missing input → NULL derived metric → NULL percentile → weight redistribution in score
```

**Example chain:**
1. Yahoo returns no EBITDA for Company X
2. `ev_ebitda` is NULL in `company_metrics_daily`
3. `pctile_ev_ebitda` is NULL (not 0.0 or 1.0)
4. Value dimension uses PE (57.1%) and PB (42.9%) instead of PE/PB/EV_EBITDA (40/30/30)
5. SŪQAI Score still computed, but with less signal

### NULL vs Zero Distinctions

| Field | NULL means | Zero means |
|-------|-----------|------------|
| `dividend_yield` | Company did not pay dividends in 2024 | — (never stored as zero) |
| `years_of_dividends` | — (never NULL) | Company has never paid dividends |
| `pe_ratio` | Negative earnings (PE undefined) | — (never stored as zero) |
| `current_ratio` | Data not available or not applicable (banks) | — (never stored as zero) |
| `revenue_growth_yoy` | Prior-year revenue unavailable | Revenue unchanged year-over-year |
| `return_1y` | Less than 1 year of price history | Stock price unchanged (theoretically possible) |

### Front-End Implications

Every metric display must check for NULL. Recommended patterns:
- Show "N/A" with a tooltip explaining the reason
- Use "—" for table cells
- Omit the metric from charts rather than plotting zero
- Never display "0%" for a NULL dividend yield (it implies the company chose not to pay, when the truth is the data is missing)

---

## 3. Outlier Treatment Rules

Outlier caps prevent extreme values from distorting averages, percentiles, and scores. Each cap was chosen based on domain knowledge of the Saudi market.

| Metric | Cap | Action | Rationale |
|--------|-----|--------|-----------|
| `dividend_yield` | 25% max | Set to NULL | No Saudi stock legitimately yields >25%; values above this indicate special dividends or data errors |
| `payout_ratio` | 300% max | Set to NULL | Payout >300% suggests one-time items or data mismatch between DPS and EPS fiscal years |
| `ev_ebitda` | 100 max | Set to NULL | Extreme EV/EBITDA (>100×) indicates near-zero EBITDA, making the ratio meaningless |
| `eps_growth_yoy` | ±1000% | Set to NULL | Growth from near-zero base (e.g., EPS 0.01 → 0.15 = 1400%) is noise, not signal |
| `revenue_cagr_3y` | ±500% | Set to NULL | Same base-effect problem over 3-year period |
| `debt_to_equity` | Stored as-is | No cap | Yahoo reports in percentage format; extreme values (>500%) are valid for highly leveraged companies |

### SIIG (2250) Case Study

SIIG declared a special dividend of SAR 10.00 per share in 2025. Using 2025 data produced an 80.5% dividend yield — clearly not representative of ongoing yield. The fix: use 2024-only annual DPS (SAR 0.83) for yield computation, producing a reasonable 6.5%.

This case drove the decision to use 2024 (most recent complete calendar year) as the reference period for all dividend calculations, rather than trailing 12 months which can include special dividends.

---

## 4. Structural Gaps (Correct Behavior, Not Fixable)

These are cases where NULL or missing data is the mathematically or financially correct outcome. No fix is needed or appropriate.

### 4.1 PE Ratio for Negative-Earnings Companies (23 companies)

When net income is negative, PE is undefined. Displaying a negative PE (e.g., -15×) is misleading because it implies the stock is "cheap" when the company is actually losing money. NULL is correct.

**Affected companies include:** SABIC, Petro Rabigh, Saudi Kayan, Chemanol, and other cyclical/distressed names.

### 4.2 Current Ratio for Banks and Financial Institutions (~30 companies)

Banks do not report current assets and current liabilities in the traditional sense. Their balance sheets are structured around deposits, loans, and regulatory capital. Applying current ratio to a bank is meaningless. NULL is correct.

### 4.3 Dividend Metrics for Non-Payers (20 companies)

Companies that have never paid dividends cannot have a dividend yield, payout ratio, or CAGR. `years_of_dividends` is explicitly set to 0 (not NULL) so these companies can be identified, but yield/payout/CAGR remain NULL.

### 4.4 EV/EBITDA When EBITDA ≈ 0 (27 companies)

When EBITDA is near zero or negative, the EV/EBITDA ratio explodes to infinity or becomes negative. Neither is meaningful. NULL is correct.

### 4.5 Interest Coverage When Interest Expense = 0 (14 companies)

Companies with no debt (zero interest expense) technically have infinite interest coverage. Rather than storing infinity, the field is NULL. These are actually the safest companies — the front-end could display "No debt" instead of "N/A."

---

## 5. Data Freshness & Static Computations

### What Updates Automatically

| Data | Update Mechanism | Frequency |
|------|-----------------|-----------|
| Stock prices | Sahm API cron | Daily (market days) |
| News articles | News cron | Periodic |

### What Does NOT Update Automatically

| Data | Current State | What Would Be Needed |
|------|--------------|---------------------|
| Fundamentals (financials table) | One-time batch load | Daily/weekly cron calling Yahoo Finance edge function |
| SŪQAI Score | Computed once (Phase 7) | Daily cron recomputing after price updates |
| Sector averages | Computed once (Phase 6) | Recompute whenever fundamentals refresh |
| Sector percentiles | Computed once (Phase 6) | Recompute with sector averages |
| Dividend metrics | Computed once (Phase 5) | Annual refresh after dividend season |
| Return metrics (1d/1w/1m/3m/1y) | Computed once | Daily recompute from stock_prices |
| Volatility (30d) | Computed once | Daily recompute from stock_prices |

**Impact:** The SŪQAI Score and all derived metrics are snapshots as of March 2026. Scores will drift from reality as prices change but fundamentals and percentiles remain frozen. A production deployment must implement daily refresh crons.

### Recommended Refresh Priority

1. **Daily:** Returns (1d/1w/1m/3m/1y), volatility_30d, week52_high/low/distance, close_price, market_cap
2. **Weekly:** SŪQAI Score recomputation, sector percentiles
3. **Quarterly:** Fundamentals refresh (after earnings season), sector averages, dividend metrics
4. **Annually:** Full data audit (new Phase 1-style truth check)

---

## 6. Small Sector Bias

### The Problem

Percentile-based scoring uses PERCENT_RANK() partitioned by sector. In sectors with few companies, percentiles are coarse.

| Sector | Companies | Possible Percentile Values |
|--------|-----------|---------------------------|
| Commercial Services | 2 | 0.0 or 1.0 only |
| Media | 3 | 0.0, 0.5, or 1.0 only |
| Telecommunication | 4 | 0.0, 0.33, 0.67, 1.0 |
| Consumer Services | 5 | 0.0, 0.25, 0.50, 0.75, 1.0 |

In a 2-company sector, one company is always "best" (1.0) and the other is always "worst" (0.0) on every metric. This makes scores more extreme than warranted.

### Mitigation

The SŪQAI Score's 6-dimension structure averages across multiple percentiles, which dampens the extremity. But individual dimension scores (e.g., score_value = 0.0 or 100.0) may appear for small-sector companies.

### Potential Future Fix

Group small sectors with related sectors for scoring purposes (e.g., merge Commercial Services into Consumer Services). Not implemented because it introduces subjective mapping decisions.

---

## 7. Scoring System Limitations

### 7.1 No Strong Buy Possible

The maximum score achieved is 67.63 (Bahri). The Strong Buy threshold (≥75) requires a company to be top-quartile in nearly all 6 dimensions simultaneously. This is mathematically near-impossible in a percentile-based system because:
- Cheap stocks (high Value) tend to have weak Quality (cheap for a reason)
- High-growth stocks tend to have expensive valuations (low Value)
- High-yield dividend stocks tend to have low Growth
- Low-volatility stocks tend to have moderate returns (low Momentum)

This is a feature, not a bug — the score honestly reflects that no stock is the best at everything. But front-end builders should consider whether the Strong Buy tier should be lowered to ≥65 for practical use.

### 7.2 Trailing-Only Inputs

All 18 scoring inputs use historical data. The score answers "how has this company performed?" not "how will it perform?" Adding forward PE, analyst estimates, and earnings revisions would significantly improve predictive value.

### 7.3 Equal Dimension Weights Across Sectors

All sectors use the same 25/20/15/15/15/10 weight profile (Value/Quality/Growth/Momentum/Dividend/Safety). In practice:
- Banks should weight Safety and Dividend higher
- Technology should weight Growth higher
- REITs should weight Dividend much higher
- Cyclicals (Materials, Energy) should weight Momentum higher

Sector-specific weight profiles are a natural Phase 9 enhancement.

### 7.4 Dividend Dimension Penalizes Growth Companies

Companies reinvesting earnings (zero dividends) score 0 on the Dividend dimension before re-weighting. While NULL re-weighting redistributes the 15% weight, companies with token dividends still get low Dividend scores. This structurally disadvantages growth-oriented companies.

---

## 8. Specific Data Anomalies

### 8.1 Transportation Sector PE Outlier

One Transportation company has PE ~900, pulling the sector average to 180.33 while the median is 11.96. The `sector_averages` table includes both mean and median precisely for this reason. Front-end displays should use **median** as the default benchmark.

### 8.2 Margins Stored as Decimals

`net_margin` and `operating_margin` in `company_metrics_daily` are stored as decimals (0.25 = 25%). This matches Yahoo Finance's format. Front-end must multiply by 100 for display. The `financials` table stores the same metrics in the same decimal format.

### 8.3 Debt-to-Equity Format

Yahoo Finance reports `debt_to_equity` in percentage format (e.g., 150.0 means 1.5× leverage). This is stored as-is. Front-end should display as "150%" or "1.5×" depending on convention.

### 8.4 Stock Prices Volume = 0

Some trading days show volume = 0 for thinly traded stocks. This is real data (no trades occurred), not a data gap. Price on zero-volume days carries forward from the previous close.

---

## 9. Missing Data That Could Be Added

### 9.1 With Current Infrastructure (No New Sources)

| Metric | How | Effort |
|--------|-----|--------|
| `cash_payout_ratio` | FCF / dividends_paid from existing data | Low — ~60% coverage possible |
| `return_3y` | Automatically available by Jan 2028 as price history accumulates | Zero — just wait |
| Daily score refresh | Cron job rerunning Phase 7 SQL | Medium — schedule and test |

### 9.2 With New Data Sources

| Metric | Source Needed | Cost |
|--------|-------------|------|
| `forward_pe`, `peg_ratio` | Analyst consensus (Refinitiv, Bloomberg, S&P Capital IQ) | $$$$ |
| `revenue_cagr_5y` | 2019 revenue from Tadawul filings | Medium effort, free |
| `fair_value_estimate` | DCF model implementation + growth assumptions | High effort, free |
| Quarterly financials (complete) | Tadawul XBRL filings | Medium effort, free |
| Dividend payment dates | Tadawul announcements | Low effort, free |
| Intraday price data | Sahm API upgrade or alternative provider | $ |

### 9.3 Structural Improvements

| Improvement | Description |
|-------------|-------------|
| Sector-specific scoring weights | Different Value/Quality/Growth weights per sector |
| Market-cap-weighted sector averages | Large companies influence sector benchmarks more |
| Absolute-value score bonuses | +5 points for ROE >25%, +3 for yield >5%, etc. |
| Score confidence indicator | Based on how many of 18 inputs are non-NULL |
| Historical score tracking | Store daily scores for trend analysis |

---

## 10. Data Integrity Guarantees

### What We Guarantee

1. **118/118 companies have a SŪQAI Score.** No company is left unscored.
2. **No fabricated data.** Every non-NULL value traces to a real source (Sahm API, Yahoo Finance, or mathematical derivation).
3. **Consistent NULL handling.** If an input is NULL, all derived metrics from that input are NULL. No partial computations.
4. **Outlier protection.** Five explicit caps prevent extreme values from distorting aggregates and scores.
5. **Sector context for every company.** All 118 companies have sector percentiles, sector rank, and peer count.

### What We Do Not Guarantee

1. **Real-time accuracy.** Scores and metrics are snapshots, not live feeds.
2. **Complete fundamental coverage.** 7 metrics have 0% coverage; 4 have <65% coverage.
3. **Forward-looking validity.** The score reflects trailing performance only.
4. **Equal score precision.** Companies with more non-NULL inputs have more precise scores than those scored on fewer inputs.
5. **Cross-sector comparability.** A score of 60 in Banks does not mean the same thing as 60 in Technology because percentiles are sector-relative.

---

## 11. Recommendations for Production Deployment

1. **Implement daily refresh crons** for prices, returns, volatility, and scores before going live.
2. **Add a "Data as of" timestamp** visible on every page so users know the freshness.
3. **Show score confidence** — display how many of 18 inputs contributed to each company's score.
4. **Use median (not mean)** for all sector benchmark displays.
5. **Test with SABIC, Petro Rabigh, and Chemanol** — these negative-earnings companies stress-test NULL handling in the UI.
6. **Test with Commercial Services sector** (2 companies) — this stress-tests small-sector percentile display.
7. **Do not display pay_date** — it is NULL for all records and will confuse users.
8. **Multiply margins by 100** before display — stored as decimals, displayed as percentages.

---

*This document was compiled from data quality decisions made across Phases 1–7 of the SŪQAI data completion mission. Every limitation listed here was a deliberate choice prioritizing data integrity over completeness.*
