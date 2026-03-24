"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Gauge, Newspaper, Briefcase } from "lucide-react";

const tabs = [
  { href: "home", icon: Home, labelEn: "Home", labelAr: "الرئيسية" },
  { href: "screener", icon: SlidersHorizontal, labelEn: "Screener", labelAr: "فرز" },
  { href: "sentiment", icon: Gauge, labelEn: "Market", labelAr: "السوق" },
  { href: "news", icon: Newspaper, labelEn: "News", labelAr: "أخبار" },
  { href: "portfolio", icon: Briefcase, labelEn: "My SŪQAI", labelAr: "سوقي" },
];

export function MobileBottomBar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isAr = locale === "ar";

  return (
    <nav className="mobile-bottom-bar" aria-label="Bottom navigation">
      {tabs.map(({ href, icon: Icon, labelEn, labelAr }) => {
        const fullHref = href === "home" ? `/${locale}` : `/${locale}/${href}`;
        const isActive =
          href === "home"
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : pathname.startsWith(`/${locale}/${href}`);

        return (
          <Link
            key={href}
            href={fullHref}
            className={`bottom-tab${isActive ? " active" : ""}`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
            <span>{isAr ? labelAr : labelEn}</span>
          </Link>
        );
      })}
    </nav>
  );
}
