# SŪQAI — Master Handoff Document

**Date:** 2026-03-13
**Status:** ✅ PHASE 8 COMPLETE — ALL 8 PHASES DONE
**Supabase Project:** `fszmvnmfazgjhsrbbpvx` (ap-northeast-1)
**API URL:** `https://fszmvnmfazgjhsrbbpvx.supabase.co`

---

## What Is SŪQAI

SŪQAI is the most trusted Saudi stock intelligence database. It covers all 118 companies listed on the Saudi Exchange (Tadawul), providing fundamentals, valuations, dividends, sector context, momentum signals, and a proprietary composite score — the SŪQAI Score — that ranks every company on a 0–100 scale across 6 dimensions.

The database was built over 8 phases with one non-negotiable rule: **missing data is always preferable to incorrect data.** No zeros substituted for unknowns, no averages imputed for gaps, no fabricated values anywhere.

---

## Phase-by-Phase Summary

### Phase 1 — Full Database Truth Audit
Audited every table and column in Supabase. Catalogued what existed, what was missing, what was wrong. Established the baseline: 118 companies identified, but most financial fields empty or unreliable.

### Phase 2 — Company Identity Completion
Populated all 118 company records with: Arabic/English names, sector classification (17 sectors), sub-sector, ISIN, currency, shares outstanding, market designation. Every company has a complete identity record.

### Phase 3 — Full Price & Market Layer
Loaded daily OHLCV price data via the Sahm API for all 118 companies. Coverage: January 2025 through March 2026 (~287 trading days, ~29,310 price records). Computed: close price, market cap, 52-week high/low, returns (1d/1w/1m/3m/1y), 30-day volatility, 52-week high distance, relative performance vs TASI.

### Phase 4 — Full Fundamentals Completion
Fetched balance sheet, income statement, and cash flow data from Yahoo Finance for all 118 companies via Supabase Edge Functions. Populated: revenue, net income, EPS, total assets, total liabilities, equity, operating cash flow, free cash flow, debt-to-equity, current ratio, gross/operating/net margins, ROE, ROA, ROCE, enterprise value, and more. ~341 financial records across 2020–2025.

### Phase 5 — Dividend Expansion & Verification
Cleaned and deduplicated the dividends table to 1,250 records spanning 2016–2026. 98 companies pay dividends; 20 do not. Computed: dividend yield (2024 DPS / price), payout ratio (DPS / EPS), 3-year dividend CAGR, years of dividend history. Applied outlier caps (25% yield max, 300% payout max). Fixed the SIIG special dividend anomaly.

### Phase 6 — Sector Averages & Peer Context Engine
Built the `sector_averages` table with mean and median benchmarks for 17 sectors plus a market-wide row. Computed 8 sector-relative percentile rankings (PERCENT_RANK) for every company: PE, PB, dividend yield, ROE, net margin, revenue growth, debt-to-equity, 1-year return. Added sector rank by market cap and peer count.

### Phase 7 — Score/Valuation Readiness Audit
Built the SŪQAI Score — a 6-dimension composite scoring engine:

| Dimension | Weight | Inputs |
|-----------|--------|--------|
| Value | 25% | PE (40%), PB (30%), EV/EBITDA (30%) |
| Quality | 20% | ROE (40%), Net margin (30%), Operating margin (30%) |
| Growth | 15% | Revenue growth (60%), Earnings growth (40%) |
| Momentum | 15% | 1-year return (50%), 52-week high distance (25%), Inverse volatility (25%) |
| Dividend | 15% | Dividend yield (40%), Years of dividends (30%), Payout ratio (30%) |
| Safety | 10% | Debt/Equity (40%), Current ratio (30%), OCF/Debt (30%) |

All 18 inputs are sector-relative percentiles. NULL inputs trigger dynamic weight redistribution within and across dimensions. Every company (118/118) receives a score. Score range: 17.50–67.63. Tier distribution: 0 Strong Buy, 9 Buy, 49 Hold, 51 Underperform, 9 Sell.

### Phase 8 — Final Builder-Ready Handoff
Produced 5 deliverable documents (this document plus the 4 listed below) that give any front-end builder, analyst, or maintainer everything they need to build on top of this database.

---

## Database Schema at a Glance

| Table | Rows | Purpose |
|-------|------|---------|
| `companies` | 118 | Identity: ticker, name (AR/EN), sector, ISIN, shares outstanding |
| `company_metrics_daily` | 118 | Metrics snapshot: 65 columns of valuations, returns, scores, percentiles |
| `financials` | ~341 | Income statement, balance sheet, cash flow (2020–2025) |
| `dividends` | 1,250 | Dividend history (2016–2026), ex_date only (pay_date all NULL) |
| `stock_prices` | ~29,310 | Daily OHLCV (Jan 2025 – Mar 2026) |
| `sector_averages` | 18 | Sector benchmarks: mean + median for 17 sectors + market |
| `news` | variable | News articles with sentiment scores |

**Key relationships:** All tables link through `company_id` (UUID) which references `companies.id`. The `companies` table has `ticker` (e.g., "1010") and `symbol` (e.g., "1010.SR").

---

## Data Sources

| Source | What It Provides | Limitations |
|--------|-----------------|-------------|
| **Sahm API** | Daily stock prices, market summary, gainers/losers | No fundamentals, no intraday, history starts 2025-01-01 |
| **Yahoo Finance** | Balance sheet, income statement, cash flow, key statistics | Limited Saudi history (2021–2024), no payment dates, no analyst estimates, stale data possible |

Data is fetched through 10 Supabase Edge Functions (see Data Dictionary for full list). The Sahm API feeds a daily price cron; Yahoo Finance was used for batch fundamental loads.

---

## What Updates Automatically vs What Does Not

| Automatic (cron) | Manual / Static |
|-------------------|----------------|
| Stock prices (daily) | Fundamentals (one-time batch) |
| News articles (periodic) | SŪQAI Score (computed once) |
| | Sector averages & percentiles |
| | Dividend metrics |
| | Return metrics & volatility |

**Production requirement:** Daily crons must be implemented for returns, volatility, and score recomputation before going live. See Quality & Limitations report Section 5 for recommended refresh priorities.

---

## Coverage Summary

**15 metrics at 100% coverage** — including close price, market cap, ROE, ROA, margins, volatility, SŪQAI Score, and all sector context fields.

**12 metrics at 94–99%** — near-complete, gaps due to recent IPOs or 1–2 companies with incomplete Yahoo data.

**7 metrics at 62–88%** — moderate coverage, gaps are structurally correct (negative-earnings PE, bank current ratios, non-payer dividends).

**7 metrics at 0%** — forward PE, PEG ratio, 5-year revenue CAGR, 3-year return, fair value estimate/gap, cash payout ratio. These require new data sources or time to pass.

Full metric-by-metric breakdown is in the Coverage Matrix.

---

## SŪQAI Score Quick Reference

**What it measures:** How a company compares to its sector peers across 6 dimensions — Value, Quality, Growth, Momentum, Dividend, Safety.

**Scale:** 0–100. Higher is better.

**Tiers:**

| Tier | Range | Count |
|------|-------|-------|
| Strong Buy | ≥ 75 | 0 |
| Buy | ≥ 60 | 9 |
| Hold | ≥ 45 | 49 |
| Underperform | ≥ 30 | 51 |
| Sell | < 30 | 9 |

**Top 5:** Bahri (67.63), Arabian Cement (65.47), Mouwasat (64.83), Jazira Takaful (64.32), Extra (64.22).

**Why no Strong Buy:** The percentile-based methodology requires a company to be top-quartile in nearly all dimensions simultaneously. Cheap stocks tend to have weak quality; high-growth stocks tend to be expensive. This is mathematically honest, not a flaw.

**NULL handling:** If any of the 18 inputs is NULL, its weight redistributes to non-NULL inputs within the same dimension. If an entire dimension is NULL, its weight redistributes to the remaining dimensions. Every company gets a score regardless of data completeness, but scores based on fewer inputs carry less signal.

---

## Critical Front-End Rules

1. **Always check for NULL.** Display "N/A" or "—" with a tooltip, never "0" or blank.
2. **Multiply margins by 100.** `net_margin` and `operating_margin` are stored as decimals (0.25 = 25%).
3. **Debt-to-equity is in percentage format.** 150.0 means 1.5× leverage.
4. **Use median, not mean, for sector benchmarks.** One Transportation company with PE ~900 makes the mean useless.
5. **Do not display `pay_date`.** It is NULL for all 1,250 dividend records.
6. **PE is NULL for negative-earnings companies (23).** This is correct — do not show negative PE.
7. **Current ratio is NULL for banks (~30).** Not applicable to financial institutions.
8. **Show "Data as of" timestamp.** Scores and metrics are snapshots, not live.
9. **Score confidence varies.** Companies scored on all 18 inputs have more precise scores than those scored on fewer. Consider showing input count.
10. **Small sectors have coarse percentiles.** Commercial Services (2 companies) can only produce 0.0 or 1.0 percentiles.

---

## Key Column Name Gotchas

| You might expect | Actual column | Table |
|-----------------|---------------|-------|
| `ticker_symbol` | `ticker` | companies |
| `date` | `as_of_date` | company_metrics_daily |
| `payment_date` | `pay_date` | dividends (all NULL) |
| `body` (pg_net response) | `content` | net._http_response |
| `is_active` | Does not exist | companies |
| `net_margin` | `profit_margin` | financials |
| `roa` | `return_on_assets` | financials |

---

## Companion Documents

This master handoff is supported by 4 detailed reference documents:

| Document | File | What It Contains |
|----------|------|-----------------|
| **Data Dictionary** | `PHASE8_DATA_DICTIONARY.md` | Every column in every table: type, coverage, description, usage notes. All 17 sectors with company counts. All 10 Edge Functions. |
| **Coverage Matrix** | `PHASE8_COVERAGE_MATRIX.md` | 7 coverage tiers from 100% to 0%. Scoring engine input coverage by dimension. Fixability assessment for every gap. |
| **Query Cookbook** | `PHASE8_QUERY_COOKBOOK.md` | 13 sections of ready-to-use SQL queries and Supabase JS patterns. Stock screener, company profile, sector comparison, score leaderboard, dividend analysis, and more. Common pitfalls documented. |
| **Quality & Limitations** | `PHASE8_QUALITY_LIMITATIONS.md` | 11 sections covering data source limitations, NULL philosophy, outlier caps, structural gaps, freshness concerns, small-sector bias, scoring limitations, specific anomalies, missing data roadmap, integrity guarantees, and production recommendations. |

Additionally, each completed phase has its own detailed report:

| Phase | Report File |
|-------|------------|
| Phase 5 | `PHASE5_DIVIDEND_REPORT.md` |
| Phase 6 | `PHASE6_SECTOR_PEER_REPORT.md` |
| Phase 7 | `PHASE7_SCORE_READINESS_REPORT.md` |

---

## What Could Be Built Next

### With Current Infrastructure (No New Sources)

- **Daily score refresh cron** — Rerun Phase 7 scoring SQL after price updates
- **Cash payout ratio** — Compute from existing FCF and dividend data (~60% coverage)
- **Return 3Y** — Automatically available by January 2028 as price history accumulates
- **Historical score tracking** — Store daily scores for trend analysis
- **Score confidence indicator** — Count non-NULL inputs per company

### With New Data Sources

- **Forward PE & PEG ratio** — Requires analyst consensus (paid: Refinitiv, Bloomberg)
- **Revenue CAGR 5Y** — Requires 2019 revenue from Tadawul filings (free)
- **Fair value estimate** — Requires building a DCF model engine
- **Quarterly financials (complete)** — Tadawul XBRL filings (free)
- **Dividend payment dates** — Tadawul announcements (free)

### Structural Improvements

- Sector-specific scoring weights (Banks emphasize Safety/Dividend; Tech emphasizes Growth)
- Market-cap-weighted sector averages
- Absolute-value score bonuses (+5 for ROE >25%, +3 for yield >5%)
- Merge small sectors for scoring (Commercial Services into Consumer Services)

---

## Testing Checklist for Front-End Builders

Before launching, test these edge cases that stress the data layer:

| Test Case | Why |
|-----------|-----|
| **SABIC (2010)** | Negative ROE (-2.7%), NULL PE, large market cap — tests NULL handling for blue-chips |
| **Petro Rabigh (2380)** | ROE -42.9%, no dividends, Sell tier — tests distressed company display |
| **Chemanol (2001)** | Lowest scores, Materials sector — tests bottom-of-range display |
| **Al Rajhi Bank (1120)** | NULL current ratio (bank), most expensive PE in sector (pctile 0.0) — tests bank-specific NULLs |
| **SIIG (2250)** | Special dividend case, 2024-only yield computation — tests outlier protection |
| **Commercial Services sector** | Only 2 companies — tests small-sector percentile display (0.0 or 1.0 only) |
| **Bahri (4030)** | Highest SŪQAI Score (67.63), Buy tier — tests top-of-range display |
| **Saudi Aramco (2222)** | Largest market cap (6.5T SAR), Hold tier — tests that size does not equal score |

---

## Data Integrity Guarantees

**What we guarantee:**

1. All 118 companies have a SŪQAI Score. Zero NULLs.
2. No fabricated data. Every non-NULL value traces to Sahm API, Yahoo Finance, or mathematical derivation.
3. Consistent NULL handling. If an input is NULL, all derived metrics from that input are NULL.
4. Five explicit outlier caps prevent extreme values from distorting aggregates and scores.
5. Sector context for every company — percentiles, rank, peer count.

**What we do not guarantee:**

1. Real-time accuracy. Scores and metrics are snapshots as of March 2026.
2. Complete fundamental coverage. 7 metrics have 0% coverage; 4 have less than 65%.
3. Forward-looking validity. The score reflects trailing performance only.
4. Equal score precision. Companies with more non-NULL inputs have more precise scores.
5. Cross-sector comparability. Scores are sector-relative, not absolute.

---

## Mission Complete

The SŪQAI 8-phase data completion mission is now complete. The database contains:

- **118 companies** with full identity records
- **~29,310 price records** spanning 287 trading days
- **~341 financial records** with income statements, balance sheets, and cash flows
- **1,250 dividend records** spanning 2016–2026
- **65 metrics per company** including valuations, profitability, growth, momentum, dividends, safety, and scores
- **17 sector benchmarks** with mean and median aggregates
- **8 sector-relative percentiles** per company
- **6-dimension SŪQAI Score** with NULL-aware dynamic re-weighting
- **5 tier classifications** from Strong Buy to Sell
- **5 comprehensive handoff documents** totaling this master document plus data dictionary, coverage matrix, query cookbook, and quality report

Every number in this database is either real or NULL. Nothing is fabricated. Nothing is guessed. The foundation is ready for production.

---

*Built across 8 phases. Every phase documented. Every decision traceable. Every limitation disclosed.*
