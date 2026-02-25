# SŪQAI — Saudi Market Intelligence Platform

## Product Specification v1.0 (CORRECTED)

---

## 1. Executive Summary

**SŪQAI** (سوقAI) is a multilingual AI-powered market intelligence platform focused exclusively on the Saudi stock exchange (Tadawul). It targets foreign investors — particularly Chinese and English-speaking — who gained full access to the Saudi market when CMA removed all foreign investor restrictions on February 1, 2026.

**Why now:** Saudi Arabia's $2.9T+ market just opened to ALL foreign investors. There is no product purpose-built for non-Arabic-speaking investors to navigate Tadawul. SimplyWall.st covers Saudi stocks but treats them as afterthought global coverage — no Arabic financial terminology translation, no Saudi regulatory context, no Vision 2030 alignment analysis.

**Revenue model:** Freemium SaaS
- Free: 3 stock analyses/day, basic screener, delayed data
- Pro ($9.99/mo): Unlimited analyses, real-time data, AI insights, portfolio tracking
- Institutional ($99/mo): API access, bulk exports, custom alerts, team accounts
- Target: 10,000 paid subscribers = $1.2M ARR

---

## 2. Competitive Analysis — What SimplyWall.st Does (And Where We Beat Them)

### SimplyWall.st Core Features
| Feature | Description | SŪQAI Advantage |
|---------|-------------|-----------------|
| Snowflake Chart | 5-dimension visual (Value, Future, Past, Health, Dividend) | We add Saudi-specific dimensions: Shariah compliance, Vision 2030 alignment, Foreign ownership % |
| Stock Screener | Filter by metrics across global markets | Saudi-only deep screener with CMA regulatory filters, sector-specific Saudi metrics |
| Portfolio Tracker | Track holdings, see diversification | Multi-currency (SAR/USD/CNY), automatic dividend tracking in local currency |
| Company Analysis | Detailed narratives + data | AI-generated analysis in 3 languages, with Saudi regulatory context |
| Valuation Models | DCF, comparable analysis | Saudi-adjusted models accounting for government subsidies, oil correlation |
| Community Notes | User notes on stocks | AI-translated community insights across language barriers |
| Global Coverage | 54,000+ companies, Saudi is afterthought | 233+ Saudi companies with DEEP coverage — every filing, every disclosure |

### SŪQAI Unique Features (Not in SimplyWall.st)
1. **Real-time Arabic→English→Chinese translation** of company filings, news, CMA announcements
2. **Shariah compliance scoring** — critical for Islamic finance investors
3. **Vision 2030 alignment score** — which companies benefit from Saudi mega-projects
4. **Saudi news sentiment analysis** — Arabic NLP on local news sources
5. **Foreign ownership tracker** — real-time QFII/foreign holding data
6. **Oil price correlation dashboard** — every Saudi stock's beta to Brent crude
7. **IPO pipeline tracker** — upcoming Tadawul listings with analysis
8. **CMA regulatory alerts** — translated instantly to all 3 languages
9. **Ramadan/Eid trading calendar** — market schedule with timezone converter
10. **WeChat/LINE integration** — reach Chinese investors where they are

---

## 3. Feature Specification

### 3.1 Dashboard (Home)
- **Market Overview**: TASI index, Nomu index, sector heat map
- **Top Movers**: Gainers, losers, most active — with AI commentary
- **News Feed**: Aggregated from Saudi Gazette, Argaam, Al Arabiya, CMA announcements
- **Quick Search**: Company name/ticker in any of 3 languages
- **Portfolio Summary**: If logged in, show portfolio performance widget
- **Market Status**: Open/closed indicator with countdown, trading hours in user's timezone

### 3.2 Stock Analysis Page
Each of Tadawul's ~233 companies gets a deep analysis page:

#### 3.2.1 Header Section
- Company name (Arabic + English + Chinese)
- Ticker symbol, sector, sub-sector
- Current price, change %, volume
- Market cap in SAR + USD + CNY
- Quick action buttons: Add to portfolio, Set alert, Share

#### 3.2.2 SŪQAI Hexagon™ (Our Snowflake Alternative) — PHASE 2
Six-dimensional radar chart (built after MVP):
1. **Value** — P/E, P/B, DCF discount/premium
2. **Growth** — Revenue, earnings, dividend growth rates
3. **Health** — Debt/equity, current ratio, interest coverage
4. **Dividend** — Yield, payout ratio, consistency, growth
5. **Shariah** — Compliance score based on AAOIFI standards
6. **Vision 2030** — Alignment with Saudi national transformation

Each dimension scored 0-5, color-coded green/yellow/red.

#### 3.2.3 Financial Data Tabs
- **Overview**: Key metrics summary, business description
- **Financials**: Income statement, balance sheet, cash flow (5yr history)
- **Valuation**: DCF model, peer comparison, historical P/E band
- **Dividends**: History, yield chart, ex-date calendar
- **Ownership**: Foreign %, institutional %, insider transactions
- **News & Filings**: Translated company announcements, CMA filings

#### 3.2.4 AI Insights Panel — PHASE 2
- **AI Summary**: 3-paragraph analysis generated in user's language
- **Risk Assessment**: Key risks in plain language
- **Peer Comparison**: How this stock compares to sector averages across key metrics, with visual charts
- **Sentiment Score**: Based on news + social media analysis

**NOTE: NO PRICE TARGETS** — Generating price targets constitutes investment advice under Saudi CMA regulations. SŪQAI is a data and translation platform, NOT an investment advisor.

### 3.3 Stock Screener
Multi-filter screener with Saudi-specific filters:

**Standard Filters:**
- Market cap range
- P/E ratio range
- Dividend yield range
- Revenue growth range
- Debt/equity range
- Sector / Sub-sector

**Saudi-Specific Filters:**
- Shariah compliant (Yes/No)
- Vision 2030 sector (Tourism, Entertainment, Tech, Mining, etc.)
- Foreign ownership % range
- Nomu vs Main Market
- Government ownership (PIF-backed, etc.)
- Oil price sensitivity (Low/Medium/High)

**Preset Screens:**
- "Shariah Compliant Dividend Champions"
- "Vision 2030 Growth Plays"
- "Undervalued Saudi Blue Chips"
- "High Foreign Interest Stocks"
- "Low Oil Sensitivity Picks"

### 3.4 Portfolio Tracker — PHASE 2
- Add holdings manually or import via CSV
- Real-time P&L in SAR, USD, or CNY
- Diversification analysis (sector, market cap, Shariah/non-Shariah)
- Dividend income tracker with calendar
- Performance vs TASI benchmark
- Tax report generator (for foreign investors)
- Multiple portfolios (watchlist vs actual holdings)

### 3.5 AI Features

#### 3.5.1 Real-Time Translation Engine — MVP
- All CMA announcements auto-translated Arabic → English → Chinese
- Company filings (quarterly/annual) translated within minutes
- Financial terminology glossary (Arabic↔English↔Chinese)
- Quality: Financial-domain fine-tuned, not generic Google Translate
- **CRITICAL**: Uses translation_cache table to avoid redundant API calls

#### 3.5.2 Sentiment Analysis — PHASE 2
- Arabic NLP on Saudi news sources (Argaam, Maaal, Al Arabiya Business)
- Social media monitoring (Twitter/X Saudi fintwit)
- Aggregate sentiment score per stock (-100 to +100)
- Sentiment trend charts (7d, 30d, 90d)

#### 3.5.3 AI Stock Analyst — PHASE 2
- Natural language Q&A: "Is Saudi Aramco a good dividend stock?"
- Comparative analysis: "Compare Al Rajhi Bank vs SNB"
- Explain in simple terms: "Why did SABIC drop 5% today?"
- Available in all 3 languages

#### 3.5.4 Smart Alerts — PHASE 3
- Price alerts (above/below threshold)
- Sentiment shift alerts
- New CMA filing alerts (translated)
- Foreign ownership change alerts
- Dividend announcement alerts
- Earnings surprise alerts

### 3.6 Saudi Market Calendar
- Trading days (Sun-Thu) with holiday schedule
- Earnings season dates
- Dividend ex-dates and payment dates
- IPO dates
- CMA regulatory deadlines
- Ramadan adjusted hours
- Timezone converter (Riyadh / Beijing / New York / London)

### 3.7 Education Hub — PHASE 3
- "Investing in Saudi Arabia" guides in 3 languages
- CMA regulations explained for foreign investors
- Account opening guides (how to get a Saudi brokerage account)
- Shariah investing explained
- Vision 2030 investment thesis
- Saudi market structure (main market vs Nomu)

---

## 4. Technical Architecture

### 4.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS 3 + shadcn/ui |
| State | Zustand (client) + React Query (server) |
| Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI/ML | Google Gemini Flash 2.0 (translation) + Claude Haiku 4.5 (analysis) |
| Charts | Recharts + D3.js (for Hexagon) |
| i18n | next-intl (AR/EN/ZH) |
| Hosting | Vercel (Edge) |
| Data Feed | Sahm API (sahmk.sa) + Argaam RSS + CMA RSS |
| Search | Supabase Full-Text Search + pg_trgm |
| Payments | RevenueCat (Phase 3) + Stripe (Phase 3) |
| Email | Resend |
| Analytics | PostHog |
| CDN | Vercel Edge + Cloudflare Images |

### 4.2 Database Schema

```sql
-- Core tables
companies
├── id (uuid, PK)
├── ticker (text, unique) — e.g., "2222"
├── name_ar (text)
├── name_en (text)
├── name_zh (text)
├── sector (text)
├── sub_sector (text)
├── market (enum: main, nomu)
├── is_shariah_compliant (boolean)
├── vision_2030_score (decimal)
├── logo_url (text)
├── description_ar (text)
├── description_en (text)
├── description_zh (text)
├── website_url (text)
├── employee_count (integer)
├── founded_year (integer)
├── ceo_name_ar (text)
├── ceo_name_en (text)
├── government_contracts (text[])
├── mega_projects (text[])
├── created_at, updated_at

stock_prices
├── id (bigint, PK)
├── company_id (uuid, FK)
├── date (date)
├── open, high, low, close (decimal)
├── volume (bigint)
├── adjusted_close (decimal)

financials
├── id (uuid, PK)
├── company_id (uuid, FK)
├── period (enum: Q1, Q2, Q3, Q4, annual)
├── year (int)
├── revenue, net_income, total_assets, total_liabilities (decimal)
├── earnings_per_share, book_value_per_share (decimal)
├── operating_cash_flow, free_cash_flow (decimal)
├── debt_to_equity, current_ratio (decimal)

dividends
├── id (uuid, PK)
├── company_id (uuid, FK)
├── ex_date, payment_date (date)
├── amount_per_share (decimal)
├── currency (text, default 'SAR')

ownership
├── id (uuid, PK)
├── company_id (uuid, FK)
├── date (date)
├── foreign_percent, institutional_percent (decimal)
├── government_percent, retail_percent (decimal)

news
├── id (uuid, PK)
├── company_id (uuid, FK, nullable)
├── title_ar, title_en, title_zh (text)
├── body_ar, body_en, body_zh (text)
├── source (text)
├── sentiment_score (decimal)
├── published_at (timestamptz)
├── url (text)

translations_cache
├── id (uuid, PK)
├── source_text_hash (text) — SHA-256 of original text
├── source_language (text) — default 'ar'
├── target_language (text)
├── translated_text (text)
├── model_used (text) — 'gemini-flash'
├── created_at (timestamptz)
UNIQUE(source_text_hash, target_language)

chat_sessions
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── messages (JSONB)
├── language (text) — 'en', 'ar', 'zh'
├── created_at, updated_at

community_votes
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── company_id (uuid, FK → companies)
├── vote (text) — 'bullish', 'bearish', 'neutral'
├── voted_at (timestamptz)
UNIQUE(user_id, company_id)

ipos
├── id (uuid, PK)
├── company_name_ar (text)
├── company_name_en (text)
├── company_name_zh (text)
├── sector (text)
├── expected_date (date)
├── subscription_start (date)
├── subscription_end (date)
├── price_range_low (decimal)
├── price_range_high (decimal)
├── status (text) — 'upcoming', 'active', 'completed', 'cancelled'
├── details_ar, details_en, details_zh (text)
├── source_url (text)
├── created_at, updated_at

users
├── id (uuid, PK) — from Supabase Auth
├── email, full_name (text)
├── preferred_language (enum: ar, en, zh)
├── subscription_tier (enum: free, pro, institutional)
├── subscription_expires_at (timestamptz)
├── timezone (text) — default 'Asia/Riyadh'
├── telegram_chat_id (text)
├── whatsapp_number (text)
├── morning_brief_enabled (boolean)
├── notification_preferences (JSONB)

portfolios
├── id (uuid, PK)
├── user_id (uuid, FK)
├── name (text)
├── is_watchlist (boolean)

portfolio_holdings
├── id (uuid, PK)
├── portfolio_id (uuid, FK)
├── company_id (uuid, FK)
├── shares (decimal)
├── avg_cost (decimal)
├── added_at (timestamptz)

alerts
├── id (uuid, PK)
├── user_id (uuid, FK)
├── company_id (uuid, FK)
├── type (enum: price_above, price_below, sentiment, filing, dividend, ownership)
├── threshold (decimal, nullable)
├── is_active (boolean)
├── last_triggered_at (timestamptz)
```

### 4.3 API Routes

```
/api/
├── auth/           — Supabase Auth handlers
├── companies/
│   ├── GET /                    — List all (with filters)
│   ├── GET /[ticker]            — Company detail
│   ├── GET /[ticker]/price     — Price history
│   ├── GET /[ticker]/financials
│   ├── GET /[ticker]/dividends
│   ├── GET /[ticker]/ownership
│   ├── GET /[ticker]/news
│   └── GET /[ticker]/hexagon   — Hexagon scores (Phase 2)
├── market/
│   ├── GET /overview           — TASI, Nomu, sectors (Sahm API)
│   ├── GET /movers             — Top gainers/losers
│   ├── GET /calendar           — Trading calendar
│   └── GET /ipo                — IPO pipeline
├── screener/
│   └── POST /                  — Advanced filter query
├── portfolio/
│   ├── GET /                   — User portfolios
│   ├── POST /                  — Create portfolio
│   ├── PUT /[id]              — Update
│   ├── DELETE /[id]            — Delete
│   └── POST /[id]/holdings     — Add holding
├── translate/
│   └── POST /                  — Translate text (checks cache first)
├── chat/
│   └── POST /ask               — "Ask SŪQAI" conversational AI
├── community/
│   ├── POST /vote              — Cast bullish/bearish/neutral vote
│   └── GET /votes/[ticker]     — Get vote counts
├── brief/
│   └── GET /morning            — Generate morning brief
├── news/
│   ├── GET /                   — News feed
│   └── GET /[id]               — Single article
└── cron/
    ├── /prices/                — Update stock prices (15 min)
    └── /news/                  — Fetch news (30 min)
```

**REMOVED (Phase 3 only):**
- `/api/stripe/checkout`
- `/api/stripe/webhook`

### 4.4 App Router Structure

```
app/
├── [locale]/                   — ar | en (ZH in Phase 2)
│   ├── layout.tsx              — Root layout with i18n, RTL, dark theme
│   ├── page.tsx                — Dashboard / Home (after login)
│   ├── login/                  — Auth pages
│   ├── stock/
│   │   └── [ticker]/
│   │       ├── page.tsx       — Stock analysis
│   │       ├── financials/
│   │       ├── dividends/
│   │       └── news/
│   ├── screener/
│   │   └── page.tsx           — Stock screener
│   ├── portfolio/
│   │   ├── page.tsx           — Portfolio list
│   │   └── [id]/page.tsx      — Portfolio detail
│   ├── news/
│   │   ├── page.tsx           — News feed
│   │   └── [id]/page.tsx      — Article detail
│   ├── calendar/
│   │   └── page.tsx           — Dividend calendar
│   ├── ipo/
│   │   └── page.tsx           — IPO tracker
│   ├── blog/                   — SEO blog (Phase 1)
│   └── settings/
│       └── page.tsx           — User settings
├── api/                        — Route handlers
├── globals.css
└── middleware.ts               — Locale detection + auth
```

---

## 5. UI/UX Design System

### 5.1 Brand Identity
- **Name**: SŪQAI (سوقAI)
- **Tagline EN**: "Saudi Markets, Decoded"
- **Tagline AR**: "الأسواق السعودية، مفهومة"
- **Tagline ZH**: "沙特市场，智能解读"

### 5.2 Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#006C35` | Saudi green — CTAs, active states |
| Primary Dark | `#004D25` | Hover states |
| Secondary | `#C8A951` | Gold accents — premium features |
| Background | `#0A0F1C` | Dark mode default |
| Surface | `#111827` | Cards, panels |
| Surface Elevated | `#1F2937` | Modals, dropdowns |
| Text Primary | `#F9FAFB` | Main text |
| Text Secondary | `#9CA3AF` | Subtitles, metadata |
| Positive | `#10B981` | Stock up, gains |
| Negative | `#EF4444` | Stock down, losses |
| Warning | `#F59E0B` | Caution, alerts |
| Info | `#3B82F6` | Informational |

### 5.3 Typography
- **Latin/Chinese**: Inter (body), Space Grotesk (headings/numbers)
- **Arabic**: IBM Plex Sans Arabic (body), Tajawal (headings)
- **Monospace**: JetBrains Mono (prices, ticker symbols)

### 5.4 Layout Principles
- **Mobile-first**: 375px → 768px → 1024px → 1440px
- **Dark mode default** (light mode Phase 2)
- **RTL-first for Arabic**: Using Tailwind's `rtl:` variants + `dir` attribute
- **Card-based UI**: Every data unit is a card
- **Sticky header**: Market status bar always visible
- **Bottom nav on mobile**: 5 tabs (Home, Screener, Portfolio, News, More)

### 5.5 Key UI Components
- **HexagonChart**: 6-axis radar chart (Phase 2)
- **StockCard**: Compact stock preview
- **PriceChart**: Interactive candlestick/line chart
- **SectorHeatMap**: Treemap visualization
- **NewsCard**: Title, source, sentiment badge, timestamp
- **ScreenerFilter**: Collapsible filter panel
- **LanguageSwitcher**: AR/EN toggle in header
- **MarketStatusBar**: TASI value + change, market open/close

### 5.6 Required Components
- **Loading Skeletons**: animate-pulse on placeholder cards
- **Error Boundaries**: Friendly "Market data unavailable" message
- **Empty States**: "Add your first stock" CTAs
- **Disclaimer**: On every stock and news page

---

## 6. Data Sources

### 6.1 Market Data (CORRECTED)
| Source | Data | Method | Cost |
|--------|------|--------|------|
| **Sahm API (sahmk.sa/developers)** | Stock prices, financials, dividends, market overview, gainers/losers, company fundamentals, P/E, EPS, market cap, volume, OHLCV | REST API | Free: 100 req/day, Starter: 5,000 req/day |
| **Argaam (argaam.com)** | Saudi financial news in Arabic | RSS feed | Free |
| **CMA (cma.org.sa)** | Regulatory announcements, IPO approvals, company filings | RSS feed | Free |
| **Twelve Data** | Supplementary historical data (backup) | REST API | Free tier, $29/mo | **SECONDARY** |

**REMOVED:**
- Tadawul website scraping
- Mubasher scraping
- Yahoo Finance / yfinance
- Alpha Vantage

### 6.2 AI/NLP (CORRECTED)
| Service | Use Case | Why | Cost |
|---------|-----------|-----|------|
| **Google Gemini Flash 2.0** | Arabic→English translation, Arabic→Chinese translation, bulk news translation | Best Arabic language comprehension (trained on Google's Arabic web corpus), FREE tier covers MVP | $0/month |
| **Anthropic Claude Haiku 4.5** | AI stock analysis, "Ask SŪQAI" Q&A, Morning Brief generation | Superior financial reasoning, better instruction following, natural multilingual output | $30-50/month |
| **Anthropic Claude Sonnet 4.5** | Complex institutional-grade analysis (Pro/Institutional tier) | Highest quality output for premium features | On-demand ~$3/1M tokens |

### 6.3 Data Pipeline
1. **Cron (every 15 min during trading 10:00-15:00 AST)**: Fetch prices from Sahm `/market/summary/`, `/market/gainers/`, `/market/losers/`
2. **Cron (every 30 min)**: Parse Argaam RSS, translate via Gemini, store both versions
3. **Cron (daily 15:30 AST)**: Update company financials from Sahm `/quote/{symbol}/`
4. **Cron (quarterly)**: Ingest new financial statements
5. **On-demand**: AI translation — check `translations_cache` first before calling Gemini
6. **Realtime**: Supabase Realtime for pushing price updates

---

## 7. Internationalization (i18n)

### 7.1 Language Support
| Language | Code | Direction | Priority |
|----------|------|-----------|----------|
| English | `en` | LTR | Default |
| Arabic | `ar` | RTL | Default for Arabic browsers / Saudi IPs |
| Chinese (Simplified) | `zh` | LTR | Phase 2 |

### 7.2 Implementation
- **Framework**: next-intl with App Router
- **URL pattern**: `/en/stock/2222`, `/ar/stock/2222`
- **Auto-detect**: Browser language → geo-IP → default English
- **Switchable**: Language toggle in header

---

## 8. Authentication & Authorization

### 8.1 Auth Flow
- **Provider**: Supabase Auth
- **Methods**: Email/password, Google OAuth
- **Session**: JWT stored in httpOnly cookies

### 8.2 Tiers
| Feature | Free | Pro ($9.99/mo) | Institutional ($99/mo) |
|---------|------|----------------|----------------------|
| Stock analyses/day | 3 | Unlimited | Unlimited |
| Data delay | 15 min | Real-time | Real-time |
| Portfolio tracking | 1 portfolio, 10 stocks | 5 portfolios, unlimited | Unlimited |
| AI Q&A | 5/day | 50/day | Unlimited |
| Screener filters | Basic (5) | All | All + custom |
| Alerts | 3 | 25 | Unlimited |
| Export/API | ❌ | CSV export | Full REST API |
| Team members | ❌ | ❌ | Up to 10 |

---

## 9. MVP Build Order (Phase 1)

### Step 1: Database Setup
- Run all SQL from Section 4.2
- Create tables: companies, stock_prices, financials, dividends, ownership, news, translations_cache, chat_sessions, community_votes, ipos, portfolios, portfolio_holdings, alerts
- Add columns to companies and users tables

### Step 2: API Utilities
- Create `lib/sahm.ts` with Sahm API integration
- Create `lib/translate.ts` with translation + caching
- Set up Supabase client

### Step 3: Core Pages
- Root layout with i18n, RTL, dark theme, market status bar
- Dashboard with TASI, sector heatmap, top movers
- Company profile pages (top 50 companies)
- News feed with translation
- Auth (email + Google)
- Watchlist feature

### Step 4: Additional Pages
- Dividend calendar
- IPO tracker
- Basic screener
- SEO blog (3 company analyses)

### Step 5: Polish
- Mobile responsive + bottom nav
- PWA manifest
- Loading skeletons
- Error boundaries
- Empty states
- Disclaimer component on all pages

### Step 6: Deploy
- Deploy to Vercel
- Connect domain

---

## 10. Disclaimer

**Every page must include this disclaimer:**

> **English:** "SŪQAI provides translated market data and AI-generated analysis for informational purposes only. This is not investment advice. Always consult a licensed financial advisor before making investment decisions."
>
> **Arabic:** "سوقAI يقدم بيانات السوق المترجمة والتحليلات المولدة بالذكاء الاصطناعي لأغراض إعلامية فقط. هذا ليس نصيحة استثمارية."

---

## 11. Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# Market Data
SAHM_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=https://suqai.com
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## 12. Key Metrics

| Metric | Target (3 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Registered Users | 5,000 | 50,000 |
| Pro Subscribers | 500 | 8,000 |
| Institutional Subscribers | 10 | 200 |
| MRR | $5,000 | $100,000 |
| ARR | $60,000 | $1,200,000 |
| DAU | 1,000 | 10,000 |

---

*Last updated: February 25, 2026*
*Author: BuildMaster ⚡*
