import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  TrendingUp,
  Info,
  Briefcase,
  PieChart,
  Gauge,
  Zap,
  GitCompare,
  BarChart3,
  Users,
  LineChart,
  DollarSign,
  Scale,
  Eye,
  Leaf,
  Target,
} from "lucide-react";
import "../globals.css";
import { getMarketSummary } from "@/lib/sahm";
import { t } from "@/lib/i18n";
import { NavLink } from "@/components/NavLink";
import { MobileNav } from "@/components/MobileNav";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "SŪQAI | Saudi Market Intelligence",
  description: "Multilingual AI platform for Saudi stock market intelligence",
};

const locales = ["en", "ar"];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  const isRTL = locale === "ar";

  let tasi = { value: "--", change: "--", isPositive: true, isOpen: false };
  try {
    const s = await getMarketSummary();
    const isPositive = s.index_change >= 0;
    const riyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    const day = riyadh.getDay();
    const min = riyadh.getHours() * 60 + riyadh.getMinutes();
    tasi = {
      value: s.index_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: `${isPositive ? "+" : ""}${s.index_change_percent.toFixed(2)}%`,
      isPositive,
      isOpen: day >= 0 && day <= 4 && min >= 600 && min <= 900,
    };
  } catch {}

  // Desktop nav — compact, 5 items max
  const navLinks = [
    { href: `/${locale}`,            label: t(locale, "home"),     Icon: Home,               iconName: "Home" },
    { href: `/${locale}/screener`,   label: t(locale, "screener"), Icon: SlidersHorizontal,  iconName: "SlidersHorizontal" },
    { href: `/${locale}/sentiment`,  label: isRTL ? "السوق" : "Market", Icon: Gauge,   iconName: "Gauge" },
    { href: `/${locale}/news`,       label: t(locale, "news"),     Icon: Newspaper,          iconName: "Newspaper" },
    { href: `/${locale}/portfolio`,  label: isRTL ? "سوقي" : "My SŪQAI", Icon: Briefcase,    iconName: "Briefcase" },
  ];

  // Mobile nav — organized by category groups
  const mobileGroups = [
    { title: isRTL ? "الرئيسية" : "HOME", items: [
      { href: `/${locale}`, label: t(locale, "home"), iconName: "Home" },
    ]},
    { title: isRTL ? "الأسهم" : "STOCKS", items: [
      { href: `/${locale}/screener`, label: t(locale, "screener"), iconName: "SlidersHorizontal" },
      { href: `/${locale}/sectors`, label: isRTL ? "القطاعات" : "Sectors", iconName: "PieChart" },
      { href: `/${locale}/compare`, label: isRTL ? "مقارنة" : "Compare", iconName: "GitCompare" },
    ]},
    { title: isRTL ? "السوق" : "MARKET", items: [
      { href: `/${locale}/sentiment`, label: isRTL ? "معنويات السوق" : "Market Sentiment", iconName: "Gauge" },
      { href: `/${locale}/movers`, label: isRTL ? "المحركات" : "Top Movers", iconName: "Zap" },
      { href: `/${locale}/breadth`, label: isRTL ? "اتساع السوق" : "Market Breadth", iconName: "BarChart3" },
    ]},
    { title: isRTL ? "المالية" : "FINANCIALS", items: [
      { href: `/${locale}/dividends`, label: isRTL ? "التوزيعات" : "Dividends", iconName: "DollarSign" },
      { href: `/${locale}/earnings`, label: isRTL ? "الأرباح" : "Earnings", iconName: "LineChart" },
      { href: `/${locale}/insiders`, label: isRTL ? "المطلعين" : "Insiders", iconName: "Users" },
      { href: `/${locale}/consensus`, label: isRTL ? "إجماع المحللين" : "Consensus", iconName: "Target" },
    ]},
    { title: isRTL ? "الرؤى" : "INSIGHTS", items: [
      { href: `/${locale}/shariah`, label: isRTL ? "الشريعة والزكاة" : "Shariah & Zakat", iconName: "Scale" },
      { href: `/${locale}/smart-money`, label: isRTL ? "الأموال الذكية" : "Smart Money", iconName: "Eye" },
      { href: `/${locale}/esg`, label: isRTL ? "ESG ورؤية 2030" : "ESG & Vision 2030", iconName: "Leaf" },
    ]},
    { title: isRTL ? "الأخبار" : "NEWS", items: [
      { href: `/${locale}/news`, label: t(locale, "news"), iconName: "Newspaper" },
    ]},
    { title: isRTL ? "سوقي" : "MY SŪQAI", items: [
      { href: `/${locale}/portfolio`, label: isRTL ? "محفظتي" : "Portfolio", iconName: "Briefcase" },
      { href: `/${locale}/calendar`, label: t(locale, "calendar"), iconName: "CalendarDays" },
    ]},
    { title: isRTL ? "المزيد" : "MORE", items: [
      { href: `/${locale}/about`, label: t(locale, "about"), iconName: "Info" },
    ]},
  ];

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
      <body
        className={`${ibmPlexArabic.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased min-h-screen`}
        style={{ backgroundColor: "var(--c-base)", color: "var(--c-text)" }}
      >
        {/* ── Header ── */}
        <header
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            background: "rgba(6,13,24,0.92)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
            borderBottom: "1px solid var(--c-border)",
          }}
        >
          <div
            className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4"
            style={{ height: 56 }}
          >
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group" style={{ textDecoration: "none" }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--c-gold-dim), rgba(200,169,81,0.15))",
                  border: "1px solid var(--c-gold-ring)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <TrendingUp size={14} style={{ color: "var(--c-gold)" }} />
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{
                  color: "var(--c-gold)",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                SŪQAI
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, Icon }) => (
                <NavLink key={href} href={href}>
                  <Icon size={13} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right: hamburger (mobile) + TASI chip + lang toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <MobileNav groups={mobileGroups} locale={locale} />
              {/* TASI chip */}
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: "var(--c-elevated)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <span style={{ color: "var(--c-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                  TASI
                </span>
                <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 13 }}>
                  {tasi.value}
                </span>
                <span
                  className="font-num font-semibold"
                  style={{ color: tasi.isPositive ? "var(--c-green)" : "var(--c-red)", fontSize: 13 }}
                >
                  {tasi.change}
                </span>
                <span
                  className={tasi.isOpen ? "badge badge-open" : "badge badge-closed"}
                  style={{ fontSize: 9, padding: "1px 7px", gap: 4 }}
                >
                  {tasi.isOpen ? (
                    <><span className="live-dot" style={{ width: 5, height: 5 }} />{t(locale, "open")}</>
                  ) : (
                    t(locale, "closed")
                  )}
                </span>
              </div>

              {/* Language toggle */}
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--c-border-md)", background: "var(--c-elevated)" }}
              >
                {[{ code: "ar", label: "عر" }, { code: "en", label: "EN" }].map(({ code, label }) => (
                  <Link
                    key={code}
                    href={`/${code}`}
                    className="px-3 py-1.5 text-xs font-bold"
                    style={{
                      color: locale === code ? "var(--c-base)" : "var(--c-muted)",
                      background: locale === code ? "var(--c-gold)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      fontSize: 11,
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ paddingTop: 56, paddingBottom: 24 }}>{children}</main>
      </body>
    </html>
  );
}
