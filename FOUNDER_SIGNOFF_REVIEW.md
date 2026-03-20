# SŪQAI Homepage — Final Founder Sign-Off Review

**Reviewer role:** Skeptical founder / CTO / design lead  
**Date:** 2026-03-13  
**Scope:** `/en` and `/ar` homepage (`src/app/[locale]/page.tsx`, ~1049 lines)  
**Method:** Full source-code audit (Chrome browser + WebFetch unavailable for visual verification)

---

## 1 · Final Founder Verdict

The homepage has come a very long way from its initial state. It has a coherent visual identity (dark + gold), a complete bilingual system, proper error boundaries, Suspense loading states, and a meaningful trust/methodology section. The Featured Analysis cards now show real pillar-level detail — mini-bars, labels, verdict text, contribution chips, and data-freshness dates. The score system is transparent.

However, **it is not ready for public launch** without acknowledging and mitigating one systemic issue: the underlying financial data is incomplete. Most companies will display "—" for P/E, Debt/Equity, Operating CF, and similar fields, and the scoring algorithm silently absorbs this (dividends default to 0/5 instead of N/A, momentum uses placeholder 2.5 instead of real 52-week data). A user landing on a stock page will see a confident-looking score badge that is actually computed from only 1–2 of 5 pillars. This is a **trust-critical problem** for a product that positions itself as an "analysis" tool.

For a **founder demo** (controlled audience, known caveats), the homepage is ready with minor fixes.

---

## 2 · Category-by-Category Sign-Off

### 2.1 Product Clarity — **PASS**
- Hero headline "Saudi stock analysis, made easier" is clear, specific, unpretentious.
- Four feature cards explain what the product does (screener, score, calendar, news).
- CTAs ("Explore Stocks", "Open Screener") point to real, functional pages.
- Arabic headline "تحليل الأسهم السعودية بطريقة أبسط" matches meaning accurately.

### 2.2 Trust & Credibility — **PARTIAL**
- ✓ Trust section ("How SŪQAI works") exists with 3 methodology cards — data sources, analysis logic, disclaimer.
- ✓ Footer disclaimer: "SŪQAI provides translated market data for informational purposes only. Not investment advice."
- ✓ Verdict sentences are dynamically generated from actual score data, not generic boilerplate.
- ✗ No inline disclaimer near the score badges themselves. A user could see "78/100 Good" and think it's a buy recommendation.
- ✗ No visible "last updated" timestamp on the Market Snapshot (TASI data freshness is unknown).
- ✗ Disclaimer link in footer goes to `/about#disclaimer` — if that anchor doesn't exist or has sparse content, trust erodes.

### 2.3 Visual / Brand Identity — **PASS**
- Consistent dark + gold palette via CSS custom properties (`--c-gold`, `--c-card`, `--c-text`, etc.).
- Font system: Grotesk for headings, tabular numerals for data (`font-num` class).
- Card styling is uniform: `card` class with `--c-border` borders, `--c-elevated` backgrounds.
- Golden accent line (`gold-line`) used sparingly for section dividers.
- Badge system (`badge-up`, `badge-down`) for positive/negative changes is clean.

### 2.4 Premium Polish — **PARTIAL**
- ✓ Shimmer skeleton cards for Suspense fallbacks.
- ✓ Hover effects on cards (opacity transition, group hover for "View Analysis" badge).
- ✓ Stagger animation class on Trust section grid.
- ✓ `fade-up` animation on sections.
- ✗ SectorHeatMap uses `scrollbarWidth: "none"` but no WebKit equivalent (`&::-webkit-scrollbar { display: none }`) — scrollbar may appear on Chrome/Safari.
- ✗ Hardcoded inline styles throughout (padding, font sizes, colors) — not a quality issue per se, but makes it fragile for future theme changes.

### 2.5 Naming Quality — **PARTIAL**
- ✓ `displayName()` correctly used for Hero featured stock and Featured Analysis cards.
- ✗ **MoversPanel (line 743) uses raw `s.name_ar` / `s.name_en`** — bypasses the normalization pipeline. ALL CAPS names like "SAUDI ARABIAN OIL CO" will render un-normalized in the movers list.
- ✓ `UPPERCASE_WORDS` set handles STC, SABIC, ACWA correctly.
- ✓ Corporate suffix stripping (SJSC, LLC, etc.) works.

### 2.6 Localization Quality — **PASS**
- Full EN↔AR translation coverage for all 10 sections: hero, search, features, featured analysis, snapshot, movers, news, trust, footer.
- `isAr` checks for arrow direction (`scaleX(-1)` on ArrowUpRight icon).
- Date formatting respects locale (`ar-SA` vs `en-US`).
- `tSector()` and `tMood()` provide Arabic sector/mood names.
- Arabic trust section ("كيف يعمل SŪQAI") reads naturally.
- Pillar names translated in both mini-bar labels and H4 chips (التقييم، النمو، الزخم، الملاءة، التوزيعات).

### 2.7 Data Integrity — **FAIL**
- `fiftyTwoHigh` and `fiftyTwoLow` are hardcoded as `null` in `fetchFundamentals()` (line 155). Momentum score defaults to ~2.5 regardless of actual 52-week range. This means the score badge on the homepage is computed from incomplete data.
- Dividend score starts at 0 (not a neutral default) when yield data is missing — this punishes companies with no dividend data recorded, dragging their overall score down unfairly.
- Most companies in the DB have NULL for `debt_to_equity`, `current_ratio`, `operating_cash_flow`, `roe` — the Health pillar falls back to ~2.5 for these.
- Net effect: a company with only P/E and EPS data gets scored as if dividends = 0/5 and momentum/health = 2.5/5, yielding ~40-50/100 regardless of actual quality.

### 2.8 Error Handling — **PASS**
- `MarketSnapshot`, `MoversPanel`, and `NewsPanel` all wrapped in try/catch with graceful fallback messages.
- `DashboardPage` uses 4 `<Suspense>` boundaries with `<SkeletonCard>` fallbacks.
- `fetchFundamentals()` returns a safe default object on failure, preventing section crash.
- `computeVerdict()` returns "Insufficient data for analysis" when score is null or no pillars pass threshold.

### 2.9 Code Health — **PASS**
- 0 TypeScript errors in homepage files (all 16 existing errors are in unrelated `ipo/page.tsx` and `self-improving-agent`).
- Clean component structure: 10 named section components + 1 assembler.
- All DB queries use `createServiceClient()` (server-side, no key exposure).
- No `"use client"` on the page — pure server components with proper data fetching.

### 2.10 Founder-Demo Readiness — **PARTIAL**
- ✓ The page looks complete and professional in structure.
- ✓ Real market data (TASI, movers, news) should populate if cron jobs have run.
- ✗ If demoing with a stock that has sparse financial data, the score may look inaccurate or confusingly low.
- ✗ The movers list may show ALL CAPS company names (naming bug in MoversPanel).
- ✗ No way for the founder to know which scores are high-confidence vs. data-starved.

---

## 3 · Remaining Red Flags

| # | Severity | Issue |
|---|----------|-------|
| R1 | 🔴 Critical | **Score accuracy**: Homepage scores computed with null 52W data + 0-default dividends. Scores look authoritative but are systematically biased. |
| R2 | 🟡 Medium | **MoversPanel raw names**: Line 743 bypasses `displayName()` — ALL CAPS names will leak through to the movers UI. |
| R3 | 🟡 Medium | **No score confidence indicator**: Users have no way to know if a "62/100" is backed by 5 pillars or 2 pillars of data. |
| R4 | 🟠 Low-Med | **SectorHeatMap scrollbar leak**: Missing `-webkit-scrollbar` CSS — visible scrollbar on WebKit browsers. |
| R5 | 🟢 Low | **Hardcoded featured tickers** `["1120", "2222", "7010"]` — if any of these companies has no data, Featured Analysis renders poorly. |

---

## 4 · Sign-Off Threshold Test

| # | Question | Answer |
|---|----------|--------|
| 1 | Can a new visitor understand what SŪQAI does within 5 seconds? | **Yes** — headline + feature cards make it clear. |
| 2 | Are all scores shown on the homepage computed from real, sufficient data? | **No** — momentum uses placeholder, dividends default to 0, health often falls back to 2.5. |
| 3 | Does every company name display cleanly (no ALL CAPS, no trailing suffixes)? | **Almost** — Hero and Featured cards use `displayName()`, but MoversPanel does not. |
| 4 | Is the Arabic version equally polished and complete? | **Yes** — full translation coverage, correct RTL arrow handling, locale-aware dates. |
| 5 | Are legal/disclaimer protections visible and adequate? | **Almost** — footer disclaimer present, trust section exists, but no inline disclaimer near scores. |
| 6 | Does the page handle missing/errored data gracefully? | **Yes** — Suspense fallbacks, try/catch on all data sections, safe defaults in `fetchFundamentals`. |
| 7 | Is the visual design consistent and professional? | **Yes** — unified dark+gold palette, consistent card styling, proper typography hierarchy. |
| 8 | Would a Saudi finance professional find the UI credible? | **Almost** — professional appearance, but data-sparse scores would raise questions on closer inspection. |
| 9 | Are there any TypeScript errors or build-blocking issues in homepage code? | **No** — 0 errors in homepage files. |
| 10 | Would you be comfortable showing this to investors / early users? | **Almost** — comfortable for founder demo with caveats acknowledged; not yet for unsupervised public use. |

---

## 5 · Final Blocking Issues

**For public launch (blocks):**
1. Score accuracy on homepage — scores computed with incomplete pillar data appear authoritative but are systematically unreliable. Need either: (a) populate the missing financial data, or (b) show a data-confidence indicator on each score, or (c) don't show scores on homepage cards at all — just show them on stock detail pages with proper context.
2. MoversPanel naming — one-line fix to use `displayName()` instead of raw `s.name_en/s.name_ar`.

**For founder demo (does not block, but note):**
- Pick 3 featured tickers that you know have good data coverage in the DB so the demo cards look credible.
- Be prepared to explain that scores will improve as financial data pipeline matures.

---

## 6 · Final Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Product Clarity | 8/10 | Clear value prop, good CTAs, coherent feature messaging |
| Trust & Credibility | 6/10 | Trust section exists but no inline score disclaimers |
| Visual Identity | 8/10 | Strong dark+gold system, consistent styling |
| Premium Polish | 7/10 | Good animations and loading states, minor scrollbar leak |
| Naming Quality | 7/10 | displayName() works well but MoversPanel bypasses it |
| Localization Quality | 9/10 | Excellent bilingual coverage, proper RTL handling |
| Data Integrity | 4/10 | Systematic gaps in scoring data, no confidence signals |
| Error Handling | 9/10 | Comprehensive Suspense + try/catch + safe defaults |
| Code Health | 9/10 | Clean TS, proper server components, no homepage errors |
| Founder-Demo Readiness | 7/10 | Looks great structurally but data gaps undermine credibility |

**Overall: 7.4 / 10**

---

## 7 · Final Decision

| Decision | Status |
|----------|--------|
| **Reject** | No |
| **Approve for founder demo** | **Yes** — with the understanding that featured tickers should be cherry-picked for good data coverage, and the MoversPanel naming bug should be fixed (5-minute fix). |
| **Approve for public launch** | **Not yet** — the score accuracy issue (R1) is a trust-critical problem. Users will see scores that look definitive but are computed from incomplete data. This needs resolution before unsupervised public exposure. |

### Recommended path to public readiness:
1. **Quick fix (30 min):** Fix MoversPanel to use `displayName()`. Add `-webkit-scrollbar` CSS. Add a subtle "Beta" or "Score based on available data" note near score badges.
2. **Medium fix (1–2 days):** Build the financial data cron job (per the existing plan Step 1) to populate the NULL fields. Once debt_to_equity, current_ratio, and ROE are populated, Health scores become meaningful. Fetch 52-week high/low data so Momentum scores are real.
3. **Full fix (1 week):** Add a data-confidence indicator (e.g., "Based on 5/5 pillars" vs "Based on 2/5 pillars") so users know the reliability of each score. Set dividend score default to N/A instead of 0 for companies with no dividend data.

---

*Review conducted via full source-code audit of page.tsx (1049 lines), scores.ts, format.ts, display-names.ts, SectorHeatMap.tsx, and i18n.ts translations. Visual verification was not possible (Chrome browser disconnected, WebFetch blocked for suqaist.vercel.app).*
