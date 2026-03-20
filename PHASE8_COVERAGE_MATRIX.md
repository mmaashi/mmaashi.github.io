# SŪQAI Phase 8: Coverage Matrix

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Overview

This document maps every metric in `company_metrics_daily` to its coverage level across the 118 Saudi-listed companies, explains why gaps exist, and identifies which gaps are fixable vs structural.

---

## Coverage Tiers

### Tier 1 — Full Coverage (100%, 118/118)

| Metric | Source | Notes |
|--------|--------|-------|
| close_price | Sahm API → stock_prices | Daily quote |
| market_cap | close_price × shares_outstanding | Derived |
| roe | Yahoo Finance (defaultKeyStatistics) | Return on equity |
| roa | Yahoo Finance (defaultKeyStatistics) | Return on assets |
| net_margin | Yahoo Finance (financialData.profitMargin) | Stored as decimal (0.25 = 25%) |
| operating_margin | Yahoo Finance (financialData) | Stored as decimal |
| volatility_30d | Computed from stock_prices | Std dev of 30-day returns |
| week52_high_distance | (close - 52w_high) / 52w_high | Derived from price history |
| suqai_score | Phase 7 scoring engine | 0–100 composite, NULL-aware re-weighting |
| score_tier | Derived from suqai_score | Strong Buy/Buy/Hold/Underperform/Sell |
| sector_pctile_roe | PERCENT_RANK() within sector | 1.0 = highest ROE in sector |
| sector_pctile_net_margin | PERCENT_RANK() within sector | 1.0 = highest margin |
| sector_peer_count | COUNT(*) per sector | Range: 2–24 |
| sector_rank_market_cap | RANK() within sector | 1 = largest |
| years_of_dividends | COUNT(DISTINCT year) from dividends | 0 for non-payers (not NULL) |

**Why 100%:** These metrics either come from universally available price data, are derived computations that always produce a result, or were explicitly designed to never be NULL (years_of_dividends set to 0 for non-payers).

---

### Tier 2 — Near-Complete (98–99%, 116–117/118)

| Metric | Count | Coverage | Gap Reason |
|--------|-------|----------|------------|
| pb_ratio | 117 | 99% | 1 company missing book value |
| debt_to_equity | 117 | 99% | 1 company missing equity data |
| return_1d | 117 | 99% | 1 company no trading on reference day |
| return_1w | 117 | 99% | Same as return_1d |
| return_1m | 117 | 99% | Same |
| return_3m | 117 | 99% | Same |
| sector_pctile_pb | 117 | 99% | Mirrors pb_ratio coverage |
| sector_pctile_debt_to_equity | 117 | 99% | Mirrors debt_to_equity coverage |
| ps_ratio | 116 | 98% | 2 companies missing revenue |
| return_1y | 116 | 98% | 2 companies IPO'd < 1 year ago |
| relative_perf_vs_tasi | 116 | 98% | Requires return_1y |
| sector_pctile_return_1y | 116 | 98% | Mirrors return_1y coverage |

**Why near-complete:** Gaps are structural — recent IPOs lack 1-year history, and 1–2 companies have incomplete Yahoo fundamentals. Not fixable without waiting for time to pass (IPOs) or alternative data sources.

---

### Tier 3 — Strong (88–94%, 104–111/118)

| Metric | Count | Coverage | Gap Reason |
|--------|-------|----------|------------|
| revenue_growth_yoy | 111 | 94% | 7 companies missing prior-year revenue |
| sector_pctile_revenue_growth | 111 | 94% | Mirrors revenue_growth_yoy |
| ocf_to_debt | 110 | 93% | 8 companies missing OCF or total_debt |
| roce | 106 | 90% | 12 companies missing capital employed components |
| interest_coverage | 104 | 88% | 14 companies with zero interest expense or missing EBIT |

**Why gaps exist:** These metrics require multiple input fields. If any input is NULL, the derived metric is NULL (missing > misleading principle). Most gaps are in smaller companies where Yahoo Finance has incomplete financials.

---

### Tier 4 — Moderate (69–86%, 81–102/118)

| Metric | Count | Coverage | Gap Reason |
|--------|-------|----------|------------|
| net_debt_ebitda | 102 | 86% | 16 companies missing EBITDA or net debt components |
| pe_ratio | 95 | 81% | 23 companies with negative earnings (PE undefined) |
| sector_pctile_pe | 95 | 81% | Mirrors pe_ratio |
| ev_ebitda | 91 | 77% | 27 companies missing enterprise value or EBITDA |
| current_ratio | 88 | 75% | 30 companies missing current assets/liabilities (mostly banks — not applicable) |
| dividend_yield | 81 | 69% | 37 companies: 20 non-payers + 17 with no 2024 dividends |
| sector_pctile_dividend_yield | 81 | 69% | Mirrors dividend_yield |

**Key insight — PE ratio at 81%:** The 23 missing companies have negative earnings, making PE meaningless. This is correct behavior, not a data gap. Displaying "N/A" for negative-earnings PE is more honest than showing a negative PE.

**Key insight — Current ratio at 75%:** Banks and financial institutions do not report current assets/liabilities in the traditional sense. The 30 missing companies are overwhelmingly financials where current_ratio is not a meaningful metric.

---

### Tier 5 — Partial (43–75%, 51–88/118)

| Metric | Count | Coverage | Gap Reason |
|--------|-------|----------|------------|
| eps_growth_yoy | 75 | 64% | 43 companies missing prior-year EPS (Yahoo limitation) |
| payout_ratio | 74 | 63% | 44 companies: 20 non-payers + 24 with negative/missing earnings |
| earnings_growth_yoy | 73 | 62% | 45 companies missing prior-year net_income |
| dividend_cagr_3y | 51 | 43% | Requires dividends in both 2021 AND 2024; only 51 qualify |

**Why partial:** Growth metrics require multi-year data. Yahoo Finance provides limited historical data for Saudi stocks — income statement items available for 2021–2024, but coverage is uneven. Dividend CAGR requires 3-year history which many companies lack.

---

### Tier 6 — Low/Minimal (0–12%, 0–14/118)

| Metric | Count | Coverage | Gap Reason |
|--------|-------|----------|------------|
| revenue_cagr_3y | 14 | 12% | Requires 2021 revenue (only 22 companies have it) + outlier filter eliminates 8 |
| week52_high | 118 | 100% | *(listed here for completeness — actually full coverage)* |
| week52_low | 118 | 100% | *(same)* |

---

### Tier 7 — Zero Coverage (0/118)

| Metric | Coverage | Reason | Fixable? |
|--------|----------|--------|----------|
| forward_pe | 0% | Requires analyst consensus estimates | Yes — paid data provider (e.g., Refinitiv, Bloomberg) |
| peg_ratio | 0% | Requires forward_pe + growth estimate | Yes — depends on forward_pe |
| revenue_cagr_5y | 0% | Requires 2019 revenue (no source available) | Partially — Tadawul filings may have 2019 data |
| return_3y | 0% | Requires 3 years of price history; data starts 2025-01-01 | Yes — automatically available by Jan 2028 |
| fair_value_estimate | 0% | Not implemented (DCF model needed) | Yes — build DCF engine |
| fair_value_gap | 0% | Derived from fair_value_estimate | Yes — depends on DCF |
| cash_payout_ratio | 0% | Requires free_cash_flow / dividends_paid per share | Partially — FCF available for ~60% of companies |

---

## Coverage by Dimension (Scoring Engine Inputs)

The SŪQAI Score uses 18 inputs across 6 dimensions. Coverage of scoring inputs determines score quality.

| Dimension | Weight | Input Metrics | Min Coverage | Impact |
|-----------|--------|---------------|-------------|--------|
| **Value** | 25% | pe_ratio (81%), pb_ratio (99%), ev_ebitda (77%) | 77% | 23 companies scored on 2 of 3 inputs |
| **Quality** | 20% | roe (100%), net_margin (100%), operating_margin (100%) | 100% | All companies scored on full inputs |
| **Growth** | 15% | revenue_growth_yoy (94%), earnings_growth_yoy (62%) | 62% | 45 companies scored on 1 of 2 inputs |
| **Momentum** | 15% | return_1y (98%), week52_high_distance (100%), volatility_30d (100%) | 98% | Near-complete |
| **Dividend** | 15% | dividend_yield (69%), years_of_dividends (100%), payout_ratio (63%) | 63% | 37 companies scored on 2 of 3 inputs |
| **Safety** | 10% | debt_to_equity (99%), current_ratio (75%), ocf_to_debt (93%) | 75% | 30 companies scored on 2 of 3 inputs |

**Quality dimension has perfect coverage.** Growth and Dividend have the weakest input coverage, but the NULL-aware re-weighting ensures all 118 companies still receive valid composite scores.

---

## Coverage by Table

| Table | Rows | Companies | Date Range | Completeness |
|-------|------|-----------|------------|-------------|
| companies | 118 | 118 | — | 100% identity coverage |
| company_metrics_daily | 118 | 118 | Single snapshot | 15 metrics at 100%, 7 at 0% |
| financials | ~341 | 118 | 2020–2025 | 2024 complete; prior years partial |
| dividends | 1,250 | 98 (payers) | 2016–2026 | ex_date 100%; pay_date 0% (all NULL) |
| stock_prices | 29,310 | 118 | 2025-01-01 to 2026-03-12 | 287 trading days |
| sector_averages | 18 | 17 sectors + Market | Single snapshot | 30 columns, all populated |
| news | variable | variable | ongoing | Fetched via cron |

---

## Fixability Assessment

### Fixable with Current Infrastructure
- **return_3y**: Will automatically become available as price history accumulates (by Jan 2028)
- **cash_payout_ratio**: Can be computed from existing FCF and dividend data (~60% coverage possible)

### Fixable with New Data Sources
- **forward_pe, peg_ratio**: Require analyst consensus estimates → paid data provider needed
- **revenue_cagr_5y**: Requires 2019 revenue → Tadawul direct filings or paid data provider
- **fair_value_estimate, fair_value_gap**: Require DCF model implementation + growth assumptions

### Structural Gaps (Not Fixable)
- **PE for negative-earnings companies**: By definition, PE is undefined when earnings ≤ 0. Correct behavior.
- **Current ratio for banks**: Not a meaningful metric for financial institutions. Correct to leave NULL.
- **Dividend metrics for non-payers**: Companies that don't pay dividends cannot have yield/payout. Correct to leave NULL (years_of_dividends = 0).
- **pay_date in dividends**: Yahoo Finance does not provide payment dates for Saudi stocks. Only ex_date is available.

---

## Recommendations for Front-End Builders

1. **Always check for NULL before displaying any metric.** Show "N/A" or "—" with a tooltip explaining why (e.g., "PE not applicable — negative earnings").

2. **Use coverage tiers to decide which metrics to feature prominently.** Tier 1–2 metrics (100–98%) are safe for primary display. Tier 5–7 metrics should be secondary or hidden behind "Show more."

3. **Score dimensions with <70% input coverage should show a data quality indicator.** Growth and Dividend dimensions could display a small icon indicating "limited data" for companies missing inputs.

4. **The SŪQAI Score itself is always available (100% coverage).** The NULL-aware re-weighting guarantees every company gets a score. But scores based on fewer inputs are inherently less precise — consider showing a "confidence level" based on how many of the 18 inputs were non-NULL.

5. **Sector comparisons are most reliable for sectors with 5+ companies.** Commercial Services (2) and Media (3) have limited peer context. Consider grouping them with related sectors for display purposes.
