import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getMarketSummary } from "@/lib/sahm";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: "SŪQAI | Saudi Market Intelligence",
  description: "Multilingual AI platform for Saudi stock market intelligence",
  manifest: "/manifest.json",
};

const locales = ["en", "ar"];
const defaultLocale = "en";

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

  if (!locales.includes(locale)) {
    notFound();
  }

  const isRTL = locale === "ar";

  // Fetch live TASI data — fall back gracefully if API is unavailable
  let tasi: { value: string; change: string; isPositive: boolean; status: string } = {
    value: "--",
    change: "--",
    isPositive: true,
    status: "Market Closed",
  };

  try {
    const summary = await getMarketSummary();
    const isPositive = summary.index_change >= 0;
    const sign = isPositive ? "+" : "";

    // Determine market status based on Riyadh time (UTC+3)
    const riyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    const day = riyadh.getDay(); // 0=Sun … 6=Sat
    const minuteOfDay = riyadh.getHours() * 60 + riyadh.getMinutes();
    const isOpen = day >= 0 && day <= 4 && minuteOfDay >= 600 && minuteOfDay <= 900;

    tasi = {
      value: summary.index_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: `${sign}${summary.index_change_percent.toFixed(2)}%`,
      isPositive,
      status: isOpen ? "Market Open" : "Market Closed",
    };
  } catch {
    // API unavailable — keep fallback values
  }

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
      <body
        className={`${ibmPlexArabic.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased bg-[#0A0F1C] text-[#F9FAFB] min-h-screen`}
      >
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#111827] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#C8A951]">SŪQAI</span>
            </div>

            {/* Market Status Bar — Live TASI */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-400">TASI</span>
              <span className={tasi.isPositive ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>
                {tasi.value}
              </span>
              <span className={tasi.isPositive ? "text-[#10B981]" : "text-[#EF4444]"}>
                {tasi.change}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tasi.status === "Market Open"
                  ? "bg-green-900/50 text-green-400"
                  : "bg-gray-800 text-gray-500"
              }`}>
                {tasi.status}
              </span>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <a
                href="/ar"
                className={`px-3 py-1 text-sm font-medium ${locale === "ar" ? "text-[#C8A951]" : "text-gray-400 hover:text-white"}`}
              >
                AR
              </a>
              <span className="text-gray-600">|</span>
              <a
                href="/en"
                className={`px-3 py-1 text-sm font-medium ${locale === "en" ? "text-[#C8A951]" : "text-gray-400 hover:text-white"}`}
              >
                EN
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-14 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#111827] border-t border-gray-800 z-50">
          <div className="flex justify-around items-center h-14">
            <a href="/?lang=en" className="flex flex-col items-center justify-center p-2 text-[#C8A951]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              <span className="text-xs mt-1">Home</span>
            </a>
            <a href="/en/screener" className="flex flex-col items-center justify-center p-2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              <span className="text-xs mt-1">Screener</span>
            </a>
            <a href="/en/watchlist" className="flex flex-col items-center justify-center p-2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <span className="text-xs mt-1">Watchlist</span>
            </a>
            <a href="/en/news" className="flex flex-col items-center justify-center p-2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
              <span className="text-xs mt-1">News</span>
            </a>
            <a href="/en/calendar" className="flex flex-col items-center justify-center p-2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              <span className="text-xs mt-1">More</span>
            </a>
          </div>
        </nav>
      </body>
    </html>
  );
}
