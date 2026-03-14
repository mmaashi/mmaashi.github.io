# Phase 2: Company Identity Completion — REPORT

## Status: ✅ COMPLETE (Yahoo-sourced fields)

## Method
- **Source:** Yahoo Finance `assetProfile`, `quoteType`, `summaryProfile` modules
- **Pipeline:** Supabase Edge Function (`batch-company-profiles`) → `pg_net` async HTTP → `company_profiles_staging` table → UPDATE to `companies`
- **Batches:** 8 batches of 15 tickers (119 total), all HTTP 200

## Results — Fields Populated

| Field | Before | After | Coverage |
|-------|--------|-------|----------|
| `website_url` | 0 | 116 | 97.5% |
| `sub_sector` (from Yahoo `industry`) | 0 | 118 | 99.2% |
| `description_en` | 5 (placeholder) | 117 | 98.3% |
| `employee_count` | 0 | 19 | 16.0% |
| `name_en` | 119 | 119 | 100% |
| `name_ar` | 119 | 119 | 100% |

## Gaps Remaining (3 companies)

| Ticker | Name | Missing |
|--------|------|---------|
| 4168 | Nice One | ALL identity fields (Yahoo 404 — delisted/new?) |
| 4331 | AlJazira REIT | website_url, employee_count |
| 4342 | Jadwa REIT Saudi | website_url, description_en, employee_count |

## Fields Yahoo CANNOT Fill (need alternative sources)

| Field | Coverage | Source Needed |
|-------|----------|---------------|
| `isin` | 0% | Tadawul / CMA registry |
| `founded_year` | 0% | Tadawul company profiles |
| `ceo_name_en` | 0% | Tadawul / annual reports |
| `ceo_name_ar` | 0% | Tadawul / annual reports |
| `logo_url` | 0% | Company websites / manual |
| `employee_count` | 16% | Only 19 companies reported to Yahoo — Tadawul annual reports for rest |

## Data Quality Notes
- `sub_sector` mapped from Yahoo `industry` field (English labels like "Banks—Diversified", "Oil & Gas Integrated")
- `description_en` contains Yahoo `longBusinessSummary` — rich multi-sentence descriptions
- Employee counts sparse because most Saudi companies don't report to Yahoo Finance
- 4168 (Nice One) complete Yahoo failure — needs manual data entry

## Staging Artifacts
- `company_profiles_staging` table: 119 rows preserved for audit trail
- Edge function `batch-company-profiles`: deployed, reusable for future refreshes
