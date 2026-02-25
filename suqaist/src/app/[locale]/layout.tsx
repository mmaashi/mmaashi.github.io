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
} from "lucide-react";
import "../globals.css";
import { getMarketSummary } from "@/lib/sahm";

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
    { href: `/${locale}`,          label: locale === "ar" ? "الرئيسية" : "Dashboard", Icon: LayoutDashboard },
    { href: `/${locale}/screener`, label: locale === "ar" ? "المصفاة"  : "Screener",  Icon: SlidersHorizontal },
    { href: `/${locale}/news`,     label: locale === "ar" ? "الأخبار"  : "News",      Icon: Newspaper },
    { href: `/${locale}/calendar`, label: locale === "ar" ? "التقويم"  : "Calendar",  Icon: CalendarDays },
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
            background: "rgba(7,15,28,0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--c-border)",
          }}
        >
          <div
            className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4"
            style={{ height: 60 }}
          >
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0" style={{ textDecoration: "none" }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
              >
                <TrendingUp size={14} style={{ color: "var(--c-gold)" }} />
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}
              >
                SŪQAI
              </span>
            </Link>

            {/* Desktop nav — pure CSS hover via .nav-link class */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="nav-link">
                  <Icon size={13} />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right: TASI chip + lang toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* TASI chip */}
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border-md)" }}
              >
                <span style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>
                  TASI
                </span>
                <span className="font-num font-semibold text-sm" style={{ color: "var(--c-text)" }}>
                  {tasi.value}
                </span>
                <span
                  className="font-num text-sm font-semibold"
                  style={{ color: tasi.isPositive ? "var(--c-green)" : "var(--c-red)" }}
                >
                  {tasi.change}
                </span>
                <span
                  className={tasi.isOpen ? "badge badge-open" : "badge badge-closed"}
                  style={{ fontSize: 10, padding: "1px 7px", gap: 4 }}
                >
                  {tasi.isOpen ? (
                    <><span className="live-dot" style={{ width: 5, height: 5 }} />Open</>
                  ) : (
                    "Closed"
                  )}
                </span>
              </div>

              {/* Language toggle */}
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--c-border-md)", background: "var(--c-elevated)" }}
              >
                {[{ code: "ar", label: "AR" }, { code: "en", label: "EN" }].map(({ code, label }) => (
                  <Link
                    key={code}
                    href={`/${code}`}
                    className="px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      color: locale === code ? "var(--c-base)" : "var(--c-muted)",
                      background: locale === code ? "var(--c-gold)" : "transparent",
                      textDecoration: "none",
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
        <main style={{ paddingTop: 60, paddingBottom: 72 }}>{children}</main>

        {/* ── Mobile bottom nav ── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            background: "rgba(7,15,28,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid var(--c-border)",
          }}
        >
          <div className="flex justify-around items-center" style={{ height: 56 }}>
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1"
                style={{ color: "var(--c-muted)", minWidth: 56, textDecoration: "none" }}
              >
                <Icon size={18} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
