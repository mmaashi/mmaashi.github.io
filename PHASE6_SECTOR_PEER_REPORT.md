# SŪQAI Phase 6: Sector Averages & Peer Context Engine — Report

**Date:** 2026-03-13
**Status:** ✅ COMPLETE

---

## Summary

Phase 6 built the sector context layer: sector-level averages/medians for 17 sectors plus a market-wide benchmark, and within-sector percentile rankings for all 118 companies across 8 key metrics. This enables peer comparison ("Is this stock cheap vs its sector?") and relative valuation for the scoring engine in Phase 7.

---

## Sector Averages Table

### Structure
The `sector_averages` table holds 18 rows (17 sectors + 1 "Market" row) with 30 columns of aggregated metrics.

### Columns Added (Phase 6)
15 new columns were added to the existing table:

| Column group | Columns |
|-------------|---------|
| Median valuations | median_pe, median_pb, median_dividend_yield |
| Additional valuation | avg_ps, median_ps, avg_ev_ebitda, median_ev_ebitda |
| Profitability | avg_operating_margin, median_roe, median_net_margin |
| Leverage | avg_current_ratio |
| Risk/Return | avg_payout_ratio, avg_volatility_30d, avg_return_1m, avg_return_1y |

### Why Medians Matter
| Sector | avg_pe | median_pe | Spread |
|--------|--------|-----------|--------|
| Transportation | 180.33 | 11.96 | 15× (one extreme outlier) |
| Utilities | 117.28 | 68.13 | 1.7× |
| REITs | 34.49 | 40.05 | ~equal |
| Banks | 10.70 | 9.87 | ~equal |

Transportation demonstrates why median is essential — one company with PE ~900 pulls the average to 180, while the typical company trades at ~12×.

### Sector Summary (by total market cap)

| Sector | Companies | Median PE | Median ROE | Total MCap (SAR B) |
|--------|-----------|-----------|------------|-------------------|
| Energy | 7 | 22.74 | 12.7% | 6,582 |
| Banks | 10 | 9.87 | 13.3% | 1,031 |
| Materials | 24 | 15.12 | 7.0% | 591 |
| Telecommunication | 4 | 14.48 | 17.3% | 275 |
| Utilities | 4 | 68.13 | 7.9% | 201 |
| Health Care | 7 | 18.39 | 16.9% | 126 |
| Information Technology | 5 | 17.57 | 24.1% | 71 |
| Food & Beverages | 8 | 12.90 | 14.3% | 68 |
| Insurance | 8 | 22.73 | 5.6% | 63 |
| Retailing | 8 | 16.41 | 26.3% | 56 |
| Real Estate | 7 | 10.73 | 10.3% | 52 |
| Transportation | 6 | 11.96 | 13.9% | 31 |
| Consumer Services | 5 | 18.50 | 17.0% | 22 |
| Media | 3 | 15.41 | -5.7% | 22 |
| Financial Services | 4 | 31.00 | 4.1% | 20 |
| REITs | 6 | 40.05 | 2.4% | 8 |
| Commercial Services | 2 | 15.53 | 25.3% | 4 |
| **Market (all)** | **118** | **15.98** | **12.3%** | **9,222** |

---

## Peer Percentile Rankings

### New Columns in `company_metrics_daily`

| Column | Type | Meaning |
|--------|------|---------|
| sector_pctile_pe | NUMERIC (0-1) | PE cheapness rank within sector (1.0 = cheapest) |
| sector_pctile_pb | NUMERIC (0-1) | PB cheapness rank within sector (1.0 = cheapest) |
| sector_pctile_dividend_yield | NUMERIC (0-1) | Dividend yield rank (1.0 = highest yield) |
| sector_pctile_roe | NUMERIC (0-1) | ROE rank (1.0 = highest ROE) |
| sector_pctile_net_margin | NUMERIC (0-1) | Net margin rank (1.0 = highest margin) |
| sector_pctile_revenue_growth | NUMERIC (0-1) | Revenue growth rank (1.0 = fastest growth) |
| sector_pctile_debt_to_equity | NUMERIC (0-1) | D/E rank (1.0 = lowest leverage) |
| sector_pctile_return_1y | NUMERIC (0-1) | 1-year return rank (1.0 = best performer) |
| sector_rank_market_cap | INTEGER | Market cap rank within sector (1 = largest) |
| sector_peer_count | INTEGER | Number of companies in the sector |

### Percentile Method
- **PERCENT_RANK()** window function, partitioned by sector
- "Lower is better" metrics (PE, PB, D/E): ORDER BY DESC → cheapest/lowest gets 1.0
- "Higher is better" metrics (ROE, margin, yield, growth, return): ORDER BY ASC → highest gets 1.0
- **NULL handling:** Companies with NULL underlying metric get NULL percentile (not 0.0 or 1.0)

### Coverage

| Percentile metric | Non-NULL count | Coverage |
|-------------------|---------------|----------|
| sector_pctile_pe | 95 | 81% |
| sector_pctile_pb | 117 | 99% |
| sector_pctile_dividend_yield | 81 | 69% |
| sector_pctile_roe | 118 | 100% |
| sector_pctile_net_margin | 118 | 100% |
| sector_pctile_revenue_growth | 111 | 94% |
| sector_pctile_debt_to_equity | 117 | 99% |
| sector_pctile_return_1y | 116 | 98% |
| sector_rank_market_cap | 118 | 100% |
| sector_peer_count | 118 | 100% |

Coverage exactly matches the underlying metric coverage — no inflated or missing data.

### Verification Example: Banks Sector (10 companies)

| Company | PE | PE pctile | ROE | ROE pctile | MCap Rank |
|---------|-----|-----------|------|------------|-----------|
| Al Rajhi Bank | 17.30 | 0.00 (most expensive) | 23.6% | 1.00 (highest) | 1 |
| Saudi Investment Bank | 7.58 | 1.00 (cheapest) | 5.7% | 0.00 (lowest) | 9 |
| Bank Aljazira | 11.20 | 0.33 | 8.3% | 0.11 | 10 |

Al Rajhi: highest PE (most expensive → pctile 0.0) but highest ROE (best profitability → pctile 1.0). This is exactly the expected pattern for a premium bank.

---

## Data Quality Decisions

1. **NULL percentiles for NULL metrics:** A company missing dividend data should not appear as "best dividend payer" (pctile 1.0). Fixed via post-processing: WHERE metric IS NULL → SET pctile = NULL.

2. **Market-wide benchmark row:** The "Market" row in sector_averages uses all 118 companies, enabling both sector-relative and market-relative comparison.

3. **Median as primary benchmark:** For sectors with outliers (Transportation, Utilities), median provides a much more representative "typical company" than mean.

4. **PERCENT_RANK vs NTILE:** PERCENT_RANK returns continuous 0.0-1.0 values, better for small sectors (2-10 companies) than NTILE which would create artificial quartile boundaries.

---

## Limitations

1. **Small sector sizes:** Commercial Services (2 companies) and Media (3 companies) have very limited peer context. Percentiles within 2-company sectors are always 0.0 or 1.0.

2. **Static computation:** Percentiles are computed once and not automatically refreshed when prices change. A cron or trigger would be needed for daily updates.

3. **Single-year metrics:** Sector averages use current-period metrics only. Historical sector trends (how did Banks PE change over 3 years?) are not yet available.

4. **Equal weighting:** Sector averages use simple mean/median, not market-cap-weighted. Saudi Aramco (5.5T SAR) has the same weight as the smallest Energy company in the mean calculation.

---

## Phase 6 Conclusion

Phase 6 delivers the peer context layer needed for relative valuation and scoring. Every company can now be compared to its sector peers across 8 dimensions, and sector benchmarks provide the "is this cheap or expensive?" context that raw metrics alone cannot convey. The 17-sector + market-wide framework is ready for Phase 7's scoring engine.

**Next:** Phase 7 — Score/Valuation Readiness Audit
