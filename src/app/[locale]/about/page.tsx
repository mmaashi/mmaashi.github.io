import { t } from "@/lib/i18n";
import {
  TrendingUp,
  SlidersHorizontal,
  Newspaper,
  CalendarDays,
  Languages,
  Briefcase,
  GitCompare,
  Star,
  Bot,
  Rocket,
} from "lucide-react";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const features = [
    {
      icon: SlidersHorizontal,
      title: t(locale, "about.feature_screener"),
      desc: t(locale, "about.feature_screener_desc"),
      color: "var(--c-gold)",
      bg: "var(--c-gold-dim)",
      ring: "var(--c-gold-ring)",
    },
    {
      icon: Newspaper,
      title: t(locale, "about.feature_news"),
      desc: t(locale, "about.feature_news_desc"),
      color: "var(--c-blue, #60a5fa)",
      bg: "rgba(96,165,250,0.08)",
      ring: "rgba(96,165,250,0.2)",
    },
    {
      icon: CalendarDays,
      title: t(locale, "about.feature_calendar"),
      desc: t(locale, "about.feature_calendar_desc"),
      color: "var(--c-green)",
      bg: "var(--c-green-bg)",
      ring: "var(--c-green-ring)",
    },
    {
      icon: Languages,
      title: t(locale, "about.feature_bilingual"),
      desc: t(locale, "about.feature_bilingual_desc"),
      color: "var(--c-purple, #a78bfa)",
      bg: "rgba(167,139,250,0.08)",
      ring: "rgba(167,139,250,0.2)",
    },
  ];

  const comingSoon = [
    { icon: Briefcase, label: t(locale, "about.coming_portfolio") },
    { icon: GitCompare, label: t(locale, "about.coming_compare") },
    { icon: Star, label: t(locale, "about.coming_score") },
    { icon: Bot, label: t(locale, "about.coming_ai") },
  ];

  return (
    <div className="page-wrap">
      {/* Hero */}
      <div className="text-center mb-10 fade-up" style={{ paddingTop: 24 }}>
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--c-gold-dim)", border: "2px solid var(--c-gold-ring)" }}
          >
            <TrendingUp size={28} style={{ color: "var(--c-gold)" }} />
          </div>
        </div>
        <h1
          className="font-bold tracking-tight mb-2"
          style={{
            fontSize: 32,
            color: "var(--c-gold)",
            fontFamily: "var(--font-grotesk)",
            letterSpacing: "-0.02em",
          }}
        >
          {t(locale, "about.title")}
        </h1>
        <p className="font-semibold mb-4" style={{ fontSize: 18, color: "var(--c-text)" }}>
          {t(locale, "about.subtitle")}
        </p>
        <p style={{ fontSize: 15, color: "var(--c-muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          {t(locale, "about.description")}
        </p>
      </div>

      {/* Vision */}
      <div className="card mb-6 fade-up" style={{ padding: "24px 28px", textAlign: "center" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Rocket size={16} style={{ color: "var(--c-gold)" }} />
          <h2 className="font-bold" style={{ fontSize: 18, color: "var(--c-text)" }}>
            {t(locale, "about.vision")}
          </h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--c-text-sm)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
          {t(locale, "about.vision_text")}
        </p>
      </div>

      {/* Features Grid */}
      <div className="mb-8 fade-up">
        <h2 className="font-bold text-center mb-5" style={{ fontSize: 18, color: "var(--c-text)" }}>
          {t(locale, "about.features")}
        </h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {features.map(({ icon: Icon, title, desc, color, bg, ring }) => (
            <div key={title} className="card" style={{ padding: "22px" }}>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: bg, border: `1px solid ${ring}` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ fontSize: 15, color: "var(--c-text)" }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card mb-6 fade-up" style={{ padding: "24px 28px" }}>
        <h2 className="font-bold text-center mb-5" style={{ fontSize: 18, color: "var(--c-text)" }}>
          {t(locale, "about.coming_soon")}
        </h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {comingSoon.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl"
              style={{ padding: "14px 16px", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border-md)" }}
              >
                <Icon size={14} style={{ color: "var(--c-muted)" }} />
              </div>
              <span style={{ fontSize: 13, color: "var(--c-text-sm)", fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <hr className="gradient-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center" }}>
        {t(locale, "about.disclaimer")}
      </p>
    </div>
  );
}
