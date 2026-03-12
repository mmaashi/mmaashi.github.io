# SŪQAI — Senior Web Expert Analysis
**Date:** 2026-03-03 | **Analyst:** Claude (senior review)
**Scope:** Data architecture, design system, UX copy, code quality

---

## 1. Data Architecture — What Has Been Done ✅

### What Your Agent Completed Today
| Item | Status | Notes |
|------|--------|-------|
| Companies table refresh | ✅ Done | 119 corrected records with real EN/AR names |
| `sector_ar` column added | ⚠️ Unused | Column exists in DB but 0 lines of code use it |
| SAHM_API_KEY added | ⚠️ Preview only | Not yet in Production environment |
| Company descriptions | 🔄 In progress | 5 done, 114 pending (Gemini generating) |
| Sector names | ✅ Working | `tSector()` function handles EN→AR at render time |

### Critical Finding: `sector_ar` Column is Wired to Nothing
Your agent added `sector_ar` to the database but the code uses a different system — a translation map
in `src/lib/i18n.ts` that converts English sector names (e.g. "Banks") to Arabic ("البنوك") at render time.
The `sector_ar` column is unused by any component or query in the entire codebase.

**Your choices:**
- Option A (recommended): Leave `sector_ar` as-is. The i18n map already works. No code changes needed.
- Option B: Wire `sector_ar` into the queries — but this requires changes to 3+ files and adds complexity.

---

## 2. Financial Data Status — Field-by-Field Assessment

Applied the GAAP financial statements framework to audit what the SŪQAI stock pages can actually display.

### Income Statement Fields
| Field | DB Column | Status | Shows on Stock Page? |
|-------|-----------|--------|---------------------|
| Revenue | `revenue` | ✅ Partially populated | ✅ Yes — "Revenue Trend" chart |
| Net Income | `net_income` | ✅ Partially populated | ✅ Yes — "Net Income Trend" chart |
| EPS | `earnings_per_share` | ✅ Partially populated | ✅ Yes — "EPS (SAR)" metric |
| Net Margin | derived | ✅ Calculated from above | ✅ Yes — shown as % |
| P/E Ratio | derived | ✅ Calculated (price ÷ EPS) | ✅ Yes — shown as multiple |

### Balance Sheet Fields
| Field | DB Column | Status | Shows on Stock Page? |
|-------|-----------|--------|---------------------|
| Total Assets | `total_assets` | ❌ NULL for most | ❌ No |
| Total Liabilities | `total_liabilities` | ❌ NULL for most | ❌ No |
| Debt/Equity | `debt_to_equity` | ❌ NULL for most | Shows "—" |
| Current Ratio | `current_ratio` | ❌ NULL for most | Shows "—" |
| Book Value/Share | `book_value_per_share` | ❌ NULL | Not displayed |

### Cash Flow Fields
| Field | DB Column | Status | Shows on Stock Page? |
|-------|-----------|--------|---------------------|
| Operating Cash Flow | `operating_cash_flow` | ❌ NULL | Shows "—" |
| Free Cash Flow | `free_cash_flow` | ❌ NULL | Not displayed |

### Good News: Smart Fallback Code Already Exists
The stock page (line 171-175) is smart — if `debt_to_equity` is NULL but `total_assets` and
`total_liabilities` ARE populated, it calculates the ratio automatically:
```
debtEq = totalLiabilities / (totalAssets - totalLiabilities)
```
So if your agent populates `total_assets` and `total_liabilities`, the Debt/Equity ratio
will appear automatically without any code changes.

### What to Tell Your Agent
To make the most data appear with the least work, populate these columns in priority order:
1. `total_assets` + `total_liabilities` → unlocks Debt/Equity ratio automatically
2. `current_ratio` → one field, shows directly
3. `operating_cash_flow` → one field, shows directly
4. `earnings_per_share` (fill gaps) → improves P/E ratio coverage

The financial chart (`FinancialChart.tsx`) requires at least 2 rows with non-null revenue
OR 2 rows with non-null net_income to render. If a company has only 1 record, the chart
shows "Not enough financial data to show trends."

---

## 3. Design System Audit

Applied the /design-system audit framework to the SŪQAI codebase.

**Summary: Components reviewed: 8 | Issues found: 12 | Overall Score: 74/100**

### Strengths
- Design token system is excellent: well-named CSS variables cover all surfaces, borders, brand, status, text, glass, shadows, radii, and transitions
- RTL/Arabic support is built into the design system via `[dir="rtl"] body` selector
- Consistent dark terminal aesthetic with gold brand accents
- Good animation library (fade-up, scale-in, shimmer, pulse-dot, border-shimmer, stagger)
- Font feature settings for numeric data (`tnum`, `lnum`) — professional touch

### Issues Found

#### Token Coverage — Hardcoded Values in Components
| Component | Hardcoded Values | Should Use |
|-----------|-----------------|------------|
| `SectorHeatMap.tsx` | `rgba(14,203,129,0.22)` | `var(--c-green-bg)` or new token |
| `SectorHeatMap.tsx` | `rgba(246,70,93,0.10)` | `var(--c-red-bg)` |
| `FinancialChart.tsx` | `rgba(200,169,81,1)` | `var(--c-gold)` |
| `FinancialChart.tsx` | `rgba(200,169,81,0.38)` | New token: `--c-gold-faded` |
| Multiple components | `rgba(0,0,0,0.X)` overlays | `var(--c-overlay)` or `--shadow-*` |

**Estimated hardcoded instances:** ~18 across all components.
This is a maintenance risk — if you ever update the brand gold or green/red colors,
you'd need to hunt down all the hardcoded RGBA values manually.

#### Missing Design Tokens
These tokens should be added to `:root` in `globals.css`:
- `--c-gold-faded: rgba(200, 169, 81, 0.38)` — used in chart bars
- `--z-tooltip: 100`, `--z-modal: 200`, `--z-nav: 50` — no z-index scale exists
- `--c-green-strong: rgba(14,203,129,0.22)` — sector heatmap strong green
- `--c-red-strong: rgba(246,70,93,0.22)` — sector heatmap strong red

#### Component States Not Defined
| Component | Missing States |
|-----------|---------------|
| `.btn` | No disabled state in CSS |
| `.input-field` | No error state defined |
| `.card` | No selected/active state |
| ScreenerTable | No skeleton loading state |

#### Styling Inconsistency: Three Approaches Mixed
The codebase uses three different styling approaches inconsistently:
1. Tailwind utility classes (`className="flex items-center gap-3"`)
2. CSS component classes (`className="card card-gold"`)
3. Inline `style={{ }}` objects (very heavy use throughout)

The stock page has `style={{ }}` inline props on nearly every JSX element. This makes
future design changes expensive — changing the padding on a section requires finding
dozens of inline style props across 800+ lines. Recommend migrating high-frequency
patterns to named component classes in `globals.css`.

#### Missing: Loading Skeleton Components
There are no loading skeleton components in the codebase. When data loads slowly
(especially the 8 parallel Supabase calls on the stock page), users see blank space
with no indication that content is coming. The CSS already has a `shimmer` animation
defined — it just needs a `.skeleton` component class to use it.

### Priority Design Actions
1. Add `--c-gold-faded`, `--z-*`, `--c-green-strong`, `--c-red-strong` to `:root` tokens
2. Create a `.skeleton` component class using the existing `shimmer` animation
3. Add a disabled state to `.btn` (opacity: 0.4 + cursor: not-allowed)
4. Consider consolidating the most-used inline styles into reusable classes

---

## 4. UX Copy Review

Applied the /ux-copy framework to all 500+ translation strings in `src/lib/i18n.ts`.

### Critical Issues

#### The About Page Is Outdated — Two "Coming Soon" Features Already Exist
This is live on your website RIGHT NOW and misleading users:

```
"about.coming_score": "SŪQAI Score (Value/Health/Dividend)"  ← ALREADY BUILT
"about.coming_ai":    "AI-Powered Chat Assistant"            ← StockChat.tsx EXISTS
```

Both features are fully implemented but listed as "Coming Soon." Update these keys to
show them as live features, or remove them from the "Coming Soon" section.

Also: `"about.feature_screener_desc"` says "260+ companies" but you now have 119.

#### "N/A" Is Too Generic for Financial Data
The single key `"common.na": "N/A"` is used everywhere missing data appears.
In financial interfaces, users need to understand WHY data is missing:

| Context | Current | Better |
|---------|---------|--------|
| P/E when no EPS data | "N/A" | "No earnings data" |
| Debt/Equity when no balance sheet | "N/A" | "—" (em dash — international standard) |
| Dividend Yield when no dividends | "N/A" | "No dividends" |
| General missing number | "N/A" | "—" |

The Arabic translation `"common.na": "غ.م"` is an abbreviation that many users won't understand.
Consider using "—" universally for missing numeric data (locale-neutral).

#### Error and Loading States Missing from i18n
There are no translation keys for these user-facing situations:
- API timeout / network error on stock page
- "Try again" action
- Form validation errors (if any forms exist)
- Skeleton loading labels for screen readers
- Empty state when screener returns 0 results (the key exists — `"screener.no_results"` — but there's no "clear filters" suggestion)

#### Arrow Direction in Strings is Fragile
```
"stock.browse": "← Browse all stocks"    (English — arrow hardcoded)
"stock.browse": "→ تصفح جميع الأسهم"   (Arabic — arrow hardcoded correctly for RTL)
```
This works, but if you ever change the arrow to an icon component, you'd need to
remove these characters from both string values. Consider using a CSS `::before`
pseudo-element or a React icon component instead.

#### Tagline Undersells the Product
```
"market.tagline": "AI-powered insights for the Saudi stock market"
```
This is generic. Every fintech startup says "AI-powered insights." SŪQAI's actual
differentiator is bilingual access — making Saudi market data accessible to both
Arabic and English speakers. Suggest:

**English:** "Saudi market data — in Arabic and English"
**Arabic:** "بيانات السوق السعودي — بالعربية والإنجليزية"

Or more compelling: "The Tadawul, in your language"

#### Copy Improvements by Page

**Dashboard:**
- `"market.unavailable"`: "Market data temporarily unavailable" → "Market data is offline. Showing last known values."
- `"market.movers_unavail"`: "Movers data unavailable" → "Unable to load movers right now"

**Stock Page:**
- `"stock.not_found"`: "Stock Not Found" → "Stock Not Found" ✅ (fine)
- `"stock.not_found_desc"`: "No data for ticker" → "We don't have data for this ticker yet."
- `"stock.price_unavail"`: "Price data unavailable" → "Live price unavailable — showing last close"

**Chart:**
- `"chart.no_history"`: "No price history yet" ✅ (good)
- `"chart.populates"`: "Populates as daily data is collected" → "Updates each trading day"
- `"chart.accumulates"`: "Chart fills as daily data accumulates" → same as above (duplicate — consolidate into one key)

**Screener:**
- `"screener.no_results"`: "No companies match your filters" →
  "No companies match. Try broadening your search or clearing filters."

**Portfolio:**
- `"portfolio.demo_desc"`: "This is a sample portfolio to showcase the feature. Sign in to create your own."
  This implies authentication is available. If sign-in isn't fully implemented yet, remove this line.

### UX Copy Score: 68/100
The Arabic translations are strong and technically accurate. The main gap is in
error/empty/loading states — the copy handles the happy path well but leaves
users without guidance when things go wrong.

---

## 5. Summary: Priority Actions by Effort

### ✅ Zero-Code Fixes (just data + text)
1. **Update about page copy**: Remove SŪQAI Score and AI Chat from "Coming Soon" — they exist
2. **Fix company count**: "260+" → "119" in the about page
3. **Ask your agent** to fill `total_assets` + `total_liabilities` — this auto-unlocks Debt/Equity ratio
4. **SAHM_API_KEY**: Add to Vercel **Production** environment (it's only in Preview now)

### 🔧 Small Code Changes (1 file, 1-2 lines each)
5. **Update tagline** in i18n.ts: More compelling value proposition
6. **Fix "chart.accumulates"**: Duplicate of "chart.populates" — remove one
7. **Replace "260+" with "119"** in about page description_en
8. **Remove `year ago` filter** from recentDivs query if dividends remain sparse

### 🎨 Design Token Additions (globals.css only, no component changes)
9. Add `--c-gold-faded`, `--c-green-strong`, `--c-red-strong`, `--z-nav/modal/tooltip`
10. Add `.skeleton` class using the existing `shimmer` animation

### 📦 Medium Work (1-2 components)
11. **sector_ar**: Leave unused OR wire into screener sector filter for companies with non-standard English sector names
12. **Loading skeleton**: Add `<div className="skeleton" />` placeholders to stock page hero stats while 8 parallel queries resolve

---

## 6. What Is Working Well

- The financial fallback chain is excellent: Live API → DB price → null, all handled gracefully
- `Promise.allSettled` on the stock page means one failed query never crashes the whole page
- The `calculateScores()` SŪQAI Score system is sound and well-factored
- The debt_to_equity auto-calculation from assets/liabilities is clever
- News deduplication via `source_url` prevents duplicates across cron runs
- `tSector()` and `tMood()` make localization clean for enum values
- The design token system in `:root` is well-organized and comprehensive
- Arabic RTL support is complete and correct
