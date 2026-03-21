"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  iconName: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

import {
  Home,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  Briefcase,
  Info,
  PieChart,
  Gauge,
  Zap,
  BarChart3,
  GitCompare,
  DollarSign,
  LineChart,
  Users,
  Activity,
  Scale,
  Eye,
  Leaf,
  Target,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Home,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  Briefcase,
  Info,
  PieChart,
  Gauge,
  Zap,
  BarChart3,
  GitCompare,
  DollarSign,
  LineChart,
  Users,
  Activity,
  Scale,
  Eye,
  Leaf,
  Target,
};

export function MobileNav({
  groups,
  locale,
}: {
  groups: NavGroup[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isAr = locale === "ar";

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center"
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid var(--c-border)",
          background: "var(--c-elevated)",
          color: "var(--c-text)", cursor: "pointer",
        }}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Drawer — all groups always expanded */}
      <div
        style={{
          position: "fixed",
          top: 0,
          [isAr ? "right" : "left"]: 0,
          bottom: 0,
          width: 300,
          zIndex: 999,
          background: "var(--c-base)",
          borderRight: isAr ? "none" : "1px solid var(--c-border)",
          borderLeft: isAr ? "1px solid var(--c-border)" : "none",
          transform: open
            ? "translateX(0)"
            : isAr ? "translateX(100%)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "16px 16px",
            borderBottom: "1px solid var(--c-border)",
            background: "var(--c-base)", zIndex: 1,
            flexShrink: 0,
          }}
        >
          <Link href={`/${locale}`} onClick={() => setOpen(false)} className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--c-gold-dim), rgba(200,169,81,0.15))", border: "1px solid var(--c-gold-ring)" }}>
              <TrendingUp size={12} style={{ color: "var(--c-gold)" }} />
            </div>
            <span style={{ color: "var(--c-gold)", fontFamily: "var(--font-grotesk)", fontWeight: 700, fontSize: 16 }}>SŪQAI</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* All Nav Links — always visible, grouped with section headers */}
        <div style={{ padding: "8px 12px", flex: 1, overflowY: "auto" }}>
          {groups.map((group) => (
            <div key={group.title} style={{ marginBottom: 6 }}>
              {/* Section header — only show for multi-item groups */}
              {group.items.length > 1 && (
                <div
                  style={{
                    padding: "8px 14px 4px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--c-gold)",
                    fontFamily: "var(--font-grotesk)",
                    opacity: 0.7,
                  }}
                >
                  {group.title}
                </div>
              )}

              {/* All items always rendered */}
              {group.items.map((item) => {
                const Icon = iconMap[item.iconName] ?? Home;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3"
                    style={{
                      padding: "11px 14px",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: isActive ? "var(--c-gold)" : "var(--c-text)",
                      background: isActive ? "var(--c-gold-dim)" : "transparent",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      marginBottom: 2,
                      display: "flex",
                    }}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Language toggle */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--c-border)", background: "var(--c-base)", flexShrink: 0 }}>
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--c-border-md)", background: "var(--c-elevated)" }}
          >
            {[{ code: "ar", label: "عربي" }, { code: "en", label: "English" }].map(({ code, label }) => (
              <Link
                key={code}
                href={`/${code}`}
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-semibold"
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
    </>
  );
}
