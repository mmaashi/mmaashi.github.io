# SŪQAI Product Blueprint — Simply Wall St Comparison
Version: 2026-03-12

---

## Overview

This blueprint was developed from competitive research comparing SŪQAI to Simply Wall St,
adapted for the Saudi Exchange (Tadawul) market. It defines the page-by-page structure,
scoring model, data layers, and recommended build order.

---

## SŪQAI Score — 5-Pillar Model

Each company receives a score from 0–100 based on five equally weighted pillars:

| Pillar | Weight | Key Metrics |
|--------|--------|-------------|
| **Value** | 20% | P/E vs sector, P/B, DCF fair value estimate |
| **Growth** | 20% | Revenue CAGR, EPS growth, forecast earnings growth |
| **Past Performance** | 20% | ROE, ROA, earnings stability, 5-year return |
| **Financial Health** | 20% | Debt/Equity, current ratio, interest coverage, operating CF |
| **Dividend Quality** | 20% | Yield, payout ratio, consistency, growth |

**Visual:** Radar/snowflake chart showing all 5 axes.
Each pillar also has a ✅/⚠️/❌ pass/fail check for quick scanning.

---

## Navigation Labels (EN / AR)

| English | Arabic |
|---------|--------|
| Home | الرئيسية |
| Dashboard | لوحة المتابعة |
| Screener | الفرز |
| Markets | الأسواق |
| Company | الشركة |
| Portfolio | المحفظة |
| Watchlist | قائمة المراقبة |
| Dividends | التوزيعات |
| News | الأخبار |
| Alerts | التنبيهات |
| Methodology | المنهجية |
| Learn | تعلّم |
| Login | تسجيل الدخول |
| Sign Up | إنشاء حساب |

---

## Page-by-Page Blueprint

### 1. Home Page (الرئيسية)

**Purpose:** First impression — show market pulse and draw users deeper.

**Sections:**
- **Hero Banner** — TASI index value + daily change, market status (open/closed)
- **Market Summary Strip** — TASI, NOMU, top gainer, top loser, most active
- **Sector Heat Map** — Compact grid with color intensity by % change
- **Trending Stocks** — 6–8 cards with mini sparklines, score badge
- **Today's Movers** — Top 5 gainers/losers table
- **Latest News** — 4 headline cards with thumbnails
- **CTA Banner** — "Create free portfolio" / "Start screening"

### 2. Dashboard (لوحة المتابعة)

**Purpose:** Personalized overview for logged-in users.

**Sections:**
- **Portfolio Summary** — Total value, daily P&L, allocation donut chart
- **Watchlist Quick View** — Top 5 watched stocks with price + change
- **Active Alerts** — Recent triggered alerts
- **Upcoming Dividends** — Next 5 ex-dates from portfolio/watchlist
- **Market Snapshot** — TASI mini chart + key indices
- **Recommended Actions** — AI-suggested rebalancing or alerts

### 3. Screener (الفرز)

**Purpose:** Filter the full Tadawul universe with analysis-grade criteria.

**Features:**
- **Preset Strategies** — Value picks, dividend champions, growth stars, low debt
- **Filter Categories:**
  - Fundamentals: P/E, P/B, EPS growth, ROE, debt/equity
  - Dividends: yield, payout ratio, consistency
  - Price: 52-week range, moving averages
  - Size: market cap, sector, revenue range
  - SŪQAI Score: overall and per-pillar
- **Results View** — Sortable table with inline sparklines
- **Visual Scan** — Card view with radar charts per stock
- **Save & Alert** — Save screener criteria, get notified on new matches
- **Explain Results** — AI narrative: "These 12 stocks passed because…"

### 4. Markets (الأسواق)

**Purpose:** Bird's-eye view of Tadawul.

**Sections:**
- **Index Dashboard** — TASI, NOMU with intraday charts
- **Sector Performance** — Bar chart of today's sector returns
- **Sector Drill-Down** — Click sector → list of stocks with key metrics
- **Market Breadth** — Advancing vs. declining count
- **Volume Analysis** — Market-wide volume bar chart
- **Calendar** — Earnings dates, dividend ex-dates, IPOs

### 5. Company Profile (الشركة)

**Purpose:** The deepest page — full analysis of a single stock.

**Tab Structure:**

#### Summary Tab
- Score snowflake (radar chart)
- 5-pillar pass/fail badges
- Key metrics row: Price, P/E, EPS, Market Cap, Div Yield
- 1-paragraph AI narrative summary
- Price chart (1D / 1W / 1M / 3M / 1Y / 5Y / Max)

#### Fair Value Tab
- DCF model result with assumptions
- P/E-based fair value
- Analyst consensus target
- "Is it undervalued?" verdict with explanation

#### Growth Tab
- Revenue trend chart (5 years)
- EPS trend chart
- Forecast vs. actual comparison
- Peer comparison table

#### Financial Health Tab
- Balance sheet summary (assets, liabilities, equity)
- Debt/Equity trend
- Current ratio trend
- Interest coverage
- Operating cash flow trend
- Free cash flow trend

#### Dividends Tab
- Dividend history chart (last 5 years)
- Yield trend
- Payout ratio trend
- Ex-date calendar
- Sustainability analysis

#### Risks Tab
- Key risk factors (narrative)
- Insider transactions
- Short interest (if available)
- Debt maturity schedule

#### Peers Tab
- Sector comparison table
- Relative valuation chart
- Performance comparison (1Y, 3Y, 5Y)

### 6. Portfolio (المحفظة)

**Purpose:** Track real holdings with analysis overlay.

**Features:**
- Add holdings manually (ticker + quantity + avg price)
- Portfolio diversification analysis (sector, size, pillar scores)
- Performance tracking (total return, daily P&L)
- Dividend income projection
- Risk analysis (concentration, correlation)
- Suggested improvements based on SŪQAI Score

### 7. Watchlist (قائمة المراقبة)

**Purpose:** Track stocks you're interested in but don't own yet.

**Features:**
- Multiple named watchlists
- Table view with customizable columns
- Sort/filter within watchlist
- Price alert integration
- Compare button (side-by-side analysis)

### 8. Dividends (التوزيعات)

**Purpose:** Dedicated dividend research and tracking.

**Sections:**
- **Upcoming Ex-Dates** — Calendar view + list view
- **Dividend Champions** — Stocks with 5+ years of consistent/growing dividends
- **Yield Screener** — Filter by yield, payout ratio, consistency
- **My Dividend Income** — From portfolio: projected annual income, payment calendar
- **Dividend History** — Per-stock historical payments table

### 9. Alerts (التنبيهات)

**Purpose:** Never miss a move.

**Alert Types:**
- Price crosses threshold
- SŪQAI Score changes
- New dividend announced
- Earnings report published
- Screener match found
- Insider transaction detected

**Delivery:** In-app notification + optional email

### 10. Methodology (المنهجية)

**Purpose:** Transparency — explain how scores are calculated.

**Sections:**
- Overall scoring formula
- Each pillar's sub-metrics and weights
- Data sources and update frequency
- Fair value model assumptions
- Disclaimer and limitations
- "We believe in transparency" mission statement

---

## Data Layers Architecture

| Layer | Description | Source | Update Frequency |
|-------|-------------|--------|-----------------|
| **1. Market Data** | Prices, volume, indices | SAHM API | Real-time / 15-min delay |
| **2. Fundamentals** | Revenue, EPS, balance sheet | Tadawul / Argaam / Mubasher | Quarterly |
| **3. Dividends** | Ex-dates, amounts, history | Tadawul announcements | As announced |
| **4. Derived Metrics** | P/E, P/B, ROE, D/E ratios | Calculated from layers 1+2 | On data update |
| **5. SŪQAI Score** | 5-pillar composite score | Calculated from layers 2+3+4 | Daily |
| **6. AI Narratives** | Summary text, explanations | LLM (Claude API) | On score change |

---

## What Each Page Needs from the Database

| Page | Tables Used |
|------|-------------|
| Home | stock_prices, companies, sectors |
| Dashboard | portfolio, watchlist, stock_prices, dividends |
| Screener | companies, financials, stock_prices, dividends |
| Markets | stock_prices, companies, sectors |
| Company Profile | companies, financials, stock_prices, dividends, (ai_narratives) |
| Portfolio | portfolio_holdings, stock_prices, companies, dividends |
| Watchlist | watchlist_items, stock_prices, companies |
| Dividends | dividends, companies, portfolio_holdings |
| Alerts | alerts, stock_prices, dividends, financials |
| Methodology | static content |

---

## Shared Design System Components

| Component | Used On |
|-----------|---------|
| StockCard | Home, Screener, Watchlist |
| PriceChart | Company Profile, Dashboard |
| RadarChart (Snowflake) | Company Profile, Screener (visual scan) |
| MetricRow | Company Profile, Portfolio |
| SectorHeatMap | Home, Markets |
| DividendCalendar | Dividends, Company Profile |
| AlertBadge | Dashboard, Alerts |
| SearchBar | Global header |
| LocaleSwitcher | Global header |

---

## Recommended Build Order

| Phase | Pages | Why |
|-------|-------|-----|
| **Phase 1** | Company Profile | Core value — deepest page, proves the analysis |
| **Phase 2** | Screener | Discovery — how users find stocks |
| **Phase 3** | Dashboard + Watchlist | Engagement — personalized experience |
| **Phase 4** | Portfolio | Retention — track real investments |
| **Phase 5** | Dividends | Differentiation — Saudi market loves dividends |
| **Phase 6** | Home + Markets | Polish — first impression and market overview |
| **Phase 7** | Methodology + Learn | Trust — transparency and education |
| **Phase 8** | Alerts | Advanced — notification system |

---

## Arabic UX Copy Guidelines

- Use Modern Standard Arabic (فصحى) for UI labels, not dialect
- Financial terms: use established Arabic financial terminology
- Numbers: always use Western Arabic numerals (1, 2, 3) not Eastern (١, ٢, ٣)
- RTL layout: ensure all charts, tables, and cards mirror correctly
- Keep labels short — Arabic text is typically 20–30% longer than English
- Test with native speakers for natural phrasing

---

## Current State vs. Blueprint

### Already Built ✅
- Company Profile (basic tabs, price chart, financials)
- Screener (basic filters, table view)
- Markets (TASI index, sector heat map, movers)
- Home (market summary, trending stocks)
- Bilingual AR/EN with locale switcher
- SAHM API integration for live prices

### Needs Data Population 🔄
- Financial Health tab (total_assets, total_liabilities, current_ratio, operating_cash_flow)
- Dividend history and calendar
- Historical stock prices for charts
- → DataDigger agent working on this (see DATADIGGER_PROMPT.md)

### Not Yet Built 🔲
- SŪQAI Score (5-pillar scoring model)
- Fair Value analysis (DCF, P/E-based)
- AI Narrative summaries
- Portfolio tracking
- Watchlist (multiple lists)
- Alerts system
- Methodology page
- Peer comparison
- Risk analysis
