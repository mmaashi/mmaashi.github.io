import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  TrendingUp,
  Info,
  Briefcase,
} from "lucide-react";
import "../globals.css";
import { getMarketSummary } from "@/lib/sahm";
import { t } from "@/lib/i18n";
import { NavLink } from "@/components/NavLink";

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

  const navLinks = [
    { href: `/${locale}`,          label: t(locale, "home"),     Icon: LayoutDashboard },
    { href: `/${locale}/screener`, label: t(locale, "screener"), Icon: SlidersHorizontal },
    { href: `/${locale}/news`,     label: t(locale, "news"),     Icon: Newspaper },
    { href: `/${locale}/calendar`, label: t(locale, "calendar"), Icon: CalendarDays },
    { href: `/${locale}/portfolio`, label: t(locale, "portfolio"), Icon: Briefcase },
    { href: `/${locale}/about`,    label: t(locale, "about"),    Icon: Info },
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

            {/* Right: TASI chip + lang toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
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
        <main style={{ paddingTop: 56, paddingBottom: 72 }}>{children}</main>

        {/* ── Mobile bottom nav ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            background: "rgba(6,13,24,0.95)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
            borderTop: "1px solid var(--c-border)",
          }}
        >
          <div className="flex justify-around items-center" style={{ height: 54 }}>
            {navLinks.slice(0, 5).map(({ href, label, Icon }) => (
              <NavLink
                key={href}
                href={href}
                className="mobile-nav-link"
                style={{ textDecoration: "none" }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
