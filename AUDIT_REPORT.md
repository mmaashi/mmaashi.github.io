# SŪQAI Data & Code Audit Report
**Date:** 2026-03-02 | **Auditor:** Claude (independent, no agent involvement)

---

## 1. Live API Status ✅

**Sahm API is LIVE and working** (tested March 2, 2026 during market hours):

| Endpoint | Status | Sample Result |
|---|---|---|
| `/market/summary/` | ✅ Working | TASI: 10,492.43, mood: bearish |
| `/market/gainers/` | ✅ Working | Top gainer: 9541 (+9.22%) |
| `/market/losers/` | ✅ Working | Live data returned |
| `/quote/1010/` | ✅ Working | Riyad Bank: 26.62 SAR, -1.26% |

**Note:** The `name_en` field in gainers/losers is `null` for most stocks — only Arabic names are returned. The code correctly handles this with `name_en: string | null`.

**Important:** The live Sahm API data will only reach your website AFTER you add `SAHM_API_KEY` to Vercel environment variables. Until then, the home page hero, movers section, and individual stock quotes fall back to database values.

---

## 2. Data Architecture

```
Sahm API (live)          → Home page hero, Gainers/Losers, Stock quotes
Supabase (database)      → Everything else: companies, prices, dividends, news, financials
Cron: /api/cron/prices   → Runs every 15 min during Tadawul hours, saves quotes → stock_prices table
Cron: /api/cron/news     → Runs every hour, saves Argaam news + CMA announcements → news table
```

---

## 3. Bugs Found & Fixed

### Bug 1 — Screener: Only 200 price rows for 459 companies
**File:** `src/app/[locale]/screener/page.tsx` line 23
**Problem:** `.limit(200)` fetches 200 price rows total. With 459 companies needing 2 rows each (latest + prev close), this means ~259 companies show no price or no change % in the screener.
**Fix Applied:** Changed `.limit(200)` → `.limit(1200)` (459 companies × 2 rows + buffer)
**Impact:** High — over half the screener was showing blank prices.

### Bug 2 — Sector Heat Map: Shows zero change for all sectors
**File:** `src/components/SectorHeatMap.tsx` lines 21–25
**Problem:** `.limit(2)` on stock_prices returns the first 2 ROWS, not 2 distinct DATES. If all 459 companies traded on the same day, both rows have the same date. Then latestDate === prevDate, so all price changes calculate as 0%. Every sector shows flat/neutral (grey cards).
**Fix Applied:** Now makes two separate queries — first gets latest date, second gets the previous date with `.lt("date", latestDate)`. This guarantees two truly distinct trading days.
**Impact:** High — the entire sector heatmap was broken (all zeros).

### Bug 3 — IPO Page: Crash when database returns null (ALREADY FIXED)
**File:** `src/app/[locale]/ipo/page.tsx` line 41
**Problem:** `ipos.length` threw `TypeError: Cannot read properties of null` causing build crash at prerender.
**Fix Applied (earlier this session):** Added null guard `!ipos || ipos.length === 0`
**Impact:** Critical — blocked Vercel deployment.

---

## 4. Data Quality Findings (No Code Changes Needed — Data Issues)

### Dividends: All fake data
All 722 dividend records were inserted by your AI agent with identical fake values (amount_per_share = 2.2, ex_date = 2026-06-15). This affects:
- Calendar page: shows all companies paying SAR 2.20 on June 15, 2026
- Stock page: dividend yield calculated from fake SAR 2.20 × 4 quarters = fake yield
- SŪQAI Score: dividend component inflated by fake data

**Action needed:** Delete fake dividends and load real data from Saudi Exchange.

### Companies: Missing Arabic descriptions
All 459 companies have `description_ar = NULL`. The stock page shows no Arabic description even in Arabic mode.

### Financials: Partially populated
Your agent populated revenue, net_income, and earnings_per_share. But these fields remain NULL for most companies: `debt_to_equity`, `current_ratio`, `operating_cash_flow`, `free_cash_flow`, `total_assets`, `total_liabilities`, `book_value_per_share`. That is why P/E, Debt/Equity, Current Ratio, and Operating CF show "N/A" on stock pages.

### Stock Prices: May be stale
The cron job fetches prices every 15 min during market hours — but only if `SAHM_API_KEY` is set in Vercel. Without it, the cron runs but fails at the API call, and database prices stay as whatever your agent last seeded.

---

## 5. Each Page: Data Flow Assessment

| Page | Data Source | Status | Notes |
|---|---|---|---|
| Home (`/`) | Sahm API (live) | ⚠️ Needs SAHM_API_KEY in Vercel | Falls back to null if key missing |
| Screener (`/screener`) | Supabase companies + stock_prices | ✅ Fixed (was broken for 259 companies) | |
| Stock Page (`/stock/[ticker]`) | Sahm API + Supabase (8 sources) | ⚠️ Many "N/A" fields due to missing financial data | |
| Calendar (`/calendar`) | Supabase dividends + prices | ⚠️ Shows fake dividend data | Correct code, bad data |
| IPO (`/ipo`) | Supabase ipos table | ✅ Fixed null crash | |
| News (`/news`) | Supabase news table | ✅ Working | |
| Sector Heat Map | Supabase stock_prices | ✅ Fixed (was showing all 0%) | |

---

## 6. What You Need to Do

### Immediate (deploy this fix first)
1. Run in Mac Terminal from the suqaist folder:
```bash
git add src/app/\[locale\]/screener/page.tsx src/components/SectorHeatMap.tsx
git commit -m "fix: screener limit 200→1200, sector heatmap distinct trading dates"
git push origin main
```
If rejected: `git pull origin main --no-rebase --no-edit && git push origin main`

### Critical (unlocks live data)
2. Add `SAHM_API_KEY` to Vercel:
   - Go to: https://vercel.com/mmaashi/suqaist/settings/environment-variables
   - Add: `SAHM_API_KEY` = `shmk_live_41d458b78a8492d790a1f3726959fff6576f4188beb45ad2`
   - Set for: Production + Preview + Development
   - Redeploy

### Data cleanup (tell your agent)
3. Delete all fake dividend records (amount_per_share = 2.2, ex_date = 2026-06-15)
4. Load real dividend data from Saudi Exchange (tadawul.com.sa)
5. Populate the missing financial fields: debt_to_equity, current_ratio, operating_cash_flow

---

## 7. What Is Working Well
- All pages load without crashes (after IPO fix)
- Arabic/English i18n is complete across all pages
- Stock page architecture is solid (8 parallel data sources with graceful fallbacks)
- News cron correctly deduplicates via source_url
- Prices cron correctly handles market hours and upserts on company_id + date
- SŪQAI Score calculation logic is sound (just needs real data to show meaningful scores)
- Dividend Calendar code is correct (just needs real dividend data)
