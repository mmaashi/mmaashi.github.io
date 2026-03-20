# SŪQAI Agent Handoff
Last Updated: 2026-03-12

---

## Schema Status

| Field | Value |
|-------|-------|
| Schema version | v2.0 |
| Last migration | `20260312_v2_staging_metrics_scores.sql` |
| Contract file | `docs/data-contract.md` |

---

## Data Completeness

| Table | Status | Records | Notes |
|-------|--------|---------|-------|
| companies | Complete | 119 | All Tadawul companies. name_en, name_ar, sector, sector_ar filled |
| stock_prices | EMPTY | 0 | Priority 1 — blocks screener, charts, movers |
| financials | Partial | ~119 | revenue, net_income, EPS exist; total_assets, total_liabilities, OCF, current_ratio are NULL |
| dividends | EMPTY | 0 | Priority 2 — blocks dividend calendar, yield |
| earnings | EMPTY | 0 | Can be merged with financials |
| analyst_ratings | EMPTY | 0 | Phase 2 |
| ownership | EMPTY | 0 | Phase 3 |
| company_metrics_daily | NOT YET CREATED | 0 | Requires migration + compute job |
| company_scores_daily | NOT YET CREATED | 0 | Requires migration + scoring engine |
| sector_averages | NOT YET CREATED | 0 | Requires migration + compute job |
| staging.* | NOT YET CREATED | 0 | Requires migration |
| raw.* | NOT YET CREATED | 0 | Requires migration |
| etl_job_runs | NOT YET CREATED | 0 | Requires migration |
| etl_row_errors | NOT YET CREATED | 0 | Requires migration |

---

## Data Agent Tasks (Priority Order)

### Phase 1 — Unblock the app (CURRENT)
1. **Populate stock_prices** — last 1 year of daily OHLCV for all 119 companies
2. **Fill financials NULLs** — total_assets, total_liabilities, total_equity, operating_cash_flow, current_ratio, free_cash_flow
3. **Populate dividends** — last 3 years of dividend history for paying companies

### Phase 2 — Enable scoring engine
4. Create and run nightly compute job for `company_metrics_daily`
5. Create and run scoring engine for `company_scores_daily`
6. Create and run `sector_averages` computation
7. Populate analyst_ratings/forecasts if data available

### Phase 3 — Advanced
8. Ownership data
9. Corporate events / announcements
10. Insider trading data

---

## Builder Agent Tasks (Priority Order)

### Phase 1 — Depends on data population
1. Company Profile page — tabs (Summary, Fair Value, Growth, Health, Dividends, Risks, Peers)
2. Screener — preset strategies, score-based filters, visual scan mode
3. Enhanced charts using historical stock_prices data

### Phase 2 — Depends on metrics/scores tables
4. Dashboard (personalized overview)
5. Watchlist (multiple lists, compare)
6. SŪQAI Score radar chart using `company_scores_daily`
7. Screener integration with pre-computed metrics

### Phase 3 — User features
8. Portfolio tracking
9. Dividend income projection
10. Alert system
11. Methodology page

---

## Builder Blockers

| Blocker | Waiting On | Status |
|---------|-----------|--------|
| Screener shows dashes for prices | stock_prices data | Data Agent working |
| P/E, EPS show N/A on stock pages | financials completion | Data Agent working |
| Dividend Calendar empty | dividends data | Data Agent Phase 1 |
| Score radar uses placeholder logic | company_scores_daily table + scoring engine | Needs Phase 2 |
| No sector comparison possible | sector_averages table | Needs Phase 2 |

---

## Data Agent Blockers

| Blocker | Status |
|---------|--------|
| Need staging/raw/metrics/scores tables created | Migration ready, needs to be run |
| SAHM API rate limits unknown | Test with small batch first |
| Some companies may not have public financial statements | Use staging.status = 'incomplete' |

---

## Recently Completed

- [2026-03-03] Fixed sectorMap in i18n.ts to match all 17 DB sector names
- [2026-03-03] Fixed screener limit from 200 to 1200
- [2026-03-03] Fixed SectorHeatMap date query (two-query approach)
- [2026-03-12] Created DATADIGGER_PROMPT.md for Data Agent database access
- [2026-03-12] Created PRODUCT_BLUEPRINT.md from Simply Wall St research
- [2026-03-12] Created data-contract.md (this schema version)
- [2026-03-12] Created this handoff file

---

## Git Status

- Commit `bd152d2` is ahead of origin by 1 commit (NOT PUSHED)
- User must run `git push origin main` from Mac Terminal
- Sandbox cannot push (HTTP 403 from proxy)
