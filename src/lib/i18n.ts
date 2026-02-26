// ─────────────────────────────────────────────────────────────
// SŪQAI Translations  (EN + AR)
// Usage: import { t, tSector, tMood } from "@/lib/i18n"
// ─────────────────────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  en: {
    // Nav
    home: "Home",
    screener: "Screener",
    news: "News",
    calendar: "Calendar",
    open: "Open",
    closed: "Closed",

    // Dashboard
    "market.index": "TADAWUL ALL-SHARE INDEX (TASI)",
    "market.volume": "VOLUME",
    "market.unchanged": "UNCHANGED",
    "market.declining": "DECLINING",
    "market.advancing": "ADVANCING",
    "market.advancing_pct": "advancing",
    "market.mood": "Market",
    "market.latest_news": "LATEST NEWS",
    "market.view_all": "View all",
    "market.top_gainers": "TOP GAINERS",
    "market.top_losers": "TOP LOSERS",

    // Screener
    "screener.title": "Stock Screener",
    "screener.subtitle": "Filter and sort all Tadawul-listed companies",
    "screener.of": "of",
    "screener.companies": "companies",
    "screener.search_placeholder": "Search ticker or name…",
    "screener.all_sectors": "All Sectors",
    "screener.shariah": "Shariah",
    "screener.view": "View",
    "screener.col.ticker": "TICKER",
    "screener.col.company": "COMPANY",
    "screener.col.price": "PRICE",
    "screener.col.change": "CHANGE",
    "screener.col.volume": "VOLUME",
    "screener.col.sector": "SECTOR",

    // Stock page
    "stock.back": "Stock Screener",
    "stock.back_btn": "Back to Screener",
    "stock.live": "Live",
    "stock.shariah": "Shariah",
    "stock.market": "Market",
    "stock.open": "Open",
    "stock.high": "High",
    "stock.low": "Low",
    "stock.volume": "Volume",
    "stock.pe": "P/E Ratio",
    "stock.eps": "EPS (SAR)",
    "stock.div_yield": "Dividend Yield",
    "stock.52w": "52W Range",
    "stock.price_history": "Price History",
    "stock.days": "days",
    "stock.financials": "Financials",
    "stock.revenue": "Revenue",
    "stock.net_income": "Net Income",
    "stock.div_history": "DIVIDEND HISTORY",
    "stock.ex_date": "Ex-Date",
    "stock.amount": "Amount",
    "stock.pay_date": "Pay Date",
    "stock.not_found": "Stock Not Found",
    "stock.not_found_desc": "No data for ticker",
    "stock.browse": "← Browse all stocks",
    "stock.price_unavail": "Price data unavailable",

    // Calendar
    "calendar.title": "Dividend Calendar",
    "calendar.subtitle_records": "records",
    "calendar.subtitle_companies": "companies",
    "calendar.total": "Total Records",
    "calendar.upcoming": "Upcoming",
    "calendar.recent": "Recent",
    "calendar.companies": "Companies",
    "calendar.avg_yield": "Avg Yield",
    "calendar.upcoming_dates": "Upcoming Ex-Dates",
    "calendar.recent_divs": "Recent Dividends",
    "calendar.top_yield": "Top Dividend Yield",
    "calendar.col.company": "Company",
    "calendar.col.ex_date": "Ex-Date",
    "calendar.col.pay_date": "Pay Date",
    "calendar.col.amount": "Amount",
    "calendar.col.yield": "Yield",
    "calendar.col.rank": "#",
    "calendar.col.last_div": "Last Div",
    "calendar.col.price": "Price",
    "calendar.no_records": "No dividend records found",

    // News
    "news.title": "Financial News",
    "news.subtitle": "Latest Saudi Market News",
    "news.positive": "Positive",
    "news.negative": "Negative",
    "news.neutral": "Neutral",
    "news.back": "Back to News",
    "news.source": "Source",
    "news.translated": "Translated & summarized by SŪQAI",
    "news.no_content": "Article content is not available at this time.",
    "news.announcements": "CMA Announcements",

    // Chart
    "chart.no_history": "No price history yet",
    "chart.populates": "Populates as daily data is collected",
    "chart.today": "Today's price",
    "chart.accumulates": "Chart fills as daily data accumulates",

    // Common
    "common.sar": "SAR",
    "common.na": "N/A",
    "common.disclaimer": "SŪQAI provides translated market data for informational purposes only. Not investment advice.",
    "common.main_market": "Main Market",
  },

  ar: {
    // Nav
    home: "الرئيسية",
    screener: "المصفاة",
    news: "الأخبار",
    calendar: "التقويم",
    open: "مفتوح",
    closed: "مغلق",

    // Dashboard
    "market.index": "مؤشر تداول العام (تاسي)",
    "market.volume": "الحجم",
    "market.unchanged": "مستقر",
    "market.declining": "هابط",
    "market.advancing": "صاعد",
    "market.advancing_pct": "صاعد",
    "market.mood": "السوق",
    "market.latest_news": "آخر الأخبار",
    "market.view_all": "عرض الكل",
    "market.top_gainers": "أعلى الرابحين",
    "market.top_losers": "أكثر الخاسرين",

    // Screener
    "screener.title": "مصفاة الأسهم",
    "screener.subtitle": "تصفية وفرز جميع الأسهم المدرجة في تداول",
    "screener.of": "من أصل",
    "screener.companies": "شركة",
    "screener.search_placeholder": "ابحث برمز أو اسم السهم…",
    "screener.all_sectors": "جميع القطاعات",
    "screener.shariah": "شرعي",
    "screener.view": "عرض",
    "screener.col.ticker": "الرمز",
    "screener.col.company": "الشركة",
    "screener.col.price": "السعر",
    "screener.col.change": "التغير",
    "screener.col.volume": "الحجم",
    "screener.col.sector": "القطاع",

    // Stock page
    "stock.back": "مصفاة الأسهم",
    "stock.back_btn": "العودة للمصفاة",
    "stock.live": "مباشر",
    "stock.shariah": "متوافق مع الشريعة",
    "stock.market": "السوق",
    "stock.open": "الافتتاح",
    "stock.high": "الأعلى",
    "stock.low": "الأدنى",
    "stock.volume": "الحجم",
    "stock.pe": "مكرر الربحية",
    "stock.eps": "ربح السهم (ر.س)",
    "stock.div_yield": "عائد التوزيعات",
    "stock.52w": "نطاق 52 أسبوع",
    "stock.price_history": "تاريخ السعر",
    "stock.days": "يوم",
    "stock.financials": "المؤشرات المالية",
    "stock.revenue": "الإيرادات",
    "stock.net_income": "صافي الربح",
    "stock.div_history": "تاريخ التوزيعات",
    "stock.ex_date": "تاريخ الاستحقاق",
    "stock.amount": "المبلغ",
    "stock.pay_date": "تاريخ الدفع",
    "stock.not_found": "السهم غير موجود",
    "stock.not_found_desc": "لا توجد بيانات للرمز",
    "stock.browse": "→ تصفح جميع الأسهم",
    "stock.price_unavail": "بيانات السعر غير متاحة",

    // Calendar
    "calendar.title": "تقويم الأرباح الموزعة",
    "calendar.subtitle_records": "سجل",
    "calendar.subtitle_companies": "شركة",
    "calendar.total": "إجمالي السجلات",
    "calendar.upcoming": "القادمة",
    "calendar.recent": "الحديثة",
    "calendar.companies": "الشركات",
    "calendar.avg_yield": "متوسط العائد",
    "calendar.upcoming_dates": "تواريخ الاستحقاق القادمة",
    "calendar.recent_divs": "توزيعات حديثة",
    "calendar.top_yield": "أعلى عائد توزيعات",
    "calendar.col.company": "الشركة",
    "calendar.col.ex_date": "تاريخ الاستحقاق",
    "calendar.col.pay_date": "تاريخ الدفع",
    "calendar.col.amount": "المبلغ",
    "calendar.col.yield": "العائد",
    "calendar.col.rank": "#",
    "calendar.col.last_div": "آخر توزيع",
    "calendar.col.price": "السعر",
    "calendar.no_records": "لا توجد سجلات توزيعات",

    // News
    "news.title": "الأخبار المالية",
    "news.subtitle": "آخر أخبار السوق السعودي",
    "news.positive": "إيجابي",
    "news.negative": "سلبي",
    "news.neutral": "محايد",
    "news.back": "العودة للأخبار",
    "news.source": "المصدر",
    "news.translated": "مترجم ومُلخَّص بواسطة SŪQAI",
    "news.no_content": "محتوى المقال غير متاح حالياً.",
    "news.announcements": "إعلانات هيئة السوق المالية",

    // Chart
    "chart.no_history": "لا يوجد تاريخ أسعار بعد",
    "chart.populates": "سيتم تحديثه مع جمع البيانات اليومية",
    "chart.today": "سعر اليوم",
    "chart.accumulates": "المخطط سيمتلئ مع تراكم البيانات",

    // Common
    "common.sar": "ر.س",
    "common.na": "غ.م",
    "common.disclaimer": "تقدم SŪQAI بيانات السوق المترجمة لأغراض إعلامية فقط. لا تُعدّ نصيحة استثمارية.",
    "common.main_market": "السوق الرئيسي",
  },
};

export function t(locale: string, key: string): string {
  return translations[locale]?.[key] ?? translations["en"][key] ?? key;
}

// Sector name translations
const sectorMap: Record<string, string> = {
  Banks: "البنوك",
  Materials: "المواد",
  Telecommunication: "الاتصالات",
  Telecommunications: "الاتصالات",
  Energy: "الطاقة",
  Utilities: "المرافق",
  Healthcare: "الرعاية الصحية",
  Insurance: "التأمين",
  "Real Estate": "العقارات",
  "Retail trade": "التجزئة",
  Retail: "التجزئة",
  "Diversified Financials": "الخدمات المالية",
  Transportation: "النقل",
  "Consumer Durables": "السلع المعمرة",
  Food: "الغذاء",
  "Food & Beverages": "الأغذية والمشروبات",
  Hotels: "الفنادق",
  "Hotels & Tourism": "الفنادق والسياحة",
  Media: "الإعلام",
  "Capital Goods": "السلع الرأسمالية",
  "Commercial & Professional Svs": "الخدمات التجارية",
  Petrochemicals: "البتروكيماويات",
  "Pharma, Biotech & Life Science": "الصيدلة والتقنية الحيوية",
  Software: "البرمجيات",
  "Diversified Tele.": "الاتصالات المتنوعة",
  Other: "أخرى",
};

export function tSector(locale: string, sector: string): string {
  if (locale !== "ar") return sector;
  return sectorMap[sector] ?? sector;
}

// Market mood translations
const moodMap: Record<string, string> = {
  bullish: "صاعد",
  bearish: "هابط",
  moderately_bullish: "صاعد معتدل",
  moderately_bearish: "هابط معتدل",
  slightly_bullish: "صاعد طفيف",
  slightly_bearish: "هابط طفيف",
  highly_bullish: "صاعد قوي",
  highly_bearish: "هابط قوي",
  neutral: "محايد",
};

export function tMood(locale: string, mood: string): string {
  const cleaned = mood.replace(/_/g, " ");
  if (locale !== "ar") return cleaned;
  return moodMap[mood] ?? cleaned;
}
