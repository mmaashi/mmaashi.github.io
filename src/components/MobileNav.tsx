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

// We can't pass React components (Icons) through server→client serialization,
// so we pass icon names and resolve them here.
import {
  Home,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  Briefcase,
  Info,
  PieChart,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Home,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  Briefcase,
  Info,
  PieChart,
};

export function MobileNav({
  links,
  locale,
}: {
  links: NavItem[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isAr = locale === "ar";

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "1px solid var(--c-border)",
          background: "var(--c-elevated)",
          color: "var(--c-text)",
          cursor: "pointer",
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
            position: "fixed",
            inset: 0,
            zIndex: 998,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Slide-out drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          [isAr ? "right" : "left"]: 0,
          bottom: 0,
          width: 280,
          zIndex: 999,
          background: "rgba(6,13,24,0.98)",
          borderRight: isAr ? "none" : "1px solid var(--c-border)",
          borderLeft: isAr ? "1px solid var(--c-border)" : "none",
          transform: open
            ? "translateX(0)"
            : isAr
              ? "translateX(100%)"
              : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
          gap: 4,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--c-gold-dim), rgba(200,169,81,0.15))",
                border: "1px solid var(--c-gold-ring)",
              }}
            >
              <TrendingUp size={12} style={{ color: "var(--c-gold)" }} />
            </div>
            <span
              style={{
                color: "var(--c-gold)",
                fontFamily: "var(--font-grotesk)",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              SŪQAI
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--c-border)",
              background: "transparent",
              color: "var(--c-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, iconName }) => {
            const Icon = iconMap[iconName] ?? Home;
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: isActive ? "var(--c-gold)" : "var(--c-text)",
                  background: isActive ? "var(--c-gold-dim)" : "transparent",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle at bottom */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--c-border)" }}>
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--c-border-md)", background: "var(--c-elevated)" }}
          >
            {[{ code: "ar", label: "عربي" }, { code: "en", label: "English" }].map(({ code, label }) => (
              <Link
                key={code}
                href={`/${code}`}
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-2 text-sm font-semibold"
                style={{
                  color: locale === code ? "var(--c-base)" : "var(--c-muted)",
                  background: locale === code ? "var(--c-gold)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
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
