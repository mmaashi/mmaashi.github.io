/**
 * SŪQAI Metric-Level Interpretation Engine
 *
 * Generates stock-specific, bilingual (EN/AR) interpretation for each individual metric.
 * This goes beyond the glossary (which defines what a metric is) to explain
 * what the current value means for this specific stock.
 *
 * 4 layers per metric:
 *   1. Status badge  — Attractive / Premium / Strong / Weak / Healthy / Risk / Mixed
 *   2. One-liner     — visible on the card by default
 *   3. Detail        — expanded "Why?" section with peer context and investor meaning
 *   4. Watch         — what to monitor going forward
 *
 * Rules:
 *   - Never fabricate data: if metric is null → return null (no interpretation)
 *   - Never convert NULL to 0
 *   - Arabic must read naturally — not literal translation
 *   - All percentages stored as decimals (0.12 = 12%)
 *   - All ratios stored as raw numbers
 */

export type JudgmentSignal =
  | "attractive"
  | "premium"
  | "strong"
  | "weak"
  | "healthy"
  | "pressured"
  | "improving"
  | "slowing"
  | "balanced"
  | "stretched"
  | "mixed"
  | "risk"
  | "neutral";

export interface MetricInterpretation {
  signal: JudgmentSignal;
  badge: { en: string; ar: string };
  oneLiner: { en: string; ar: string };
  detail: { en: string; ar: string };
  watch: { en: string; ar: string };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(v: number | null | undefined): v is number {
  return v != null && !Number.isNaN(v) && Number.isFinite(v);
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtRatio(v: number): string {
  return v.toFixed(2);
}

function fmtX(v: number): string {
  return `${v.toFixed(1)}x`;
}

// ─── Context for metric interpretation ──────────────────────────────────────

export interface MetricContext {
  /** Get a raw metric value by key */
  n: (key: string) => number | null;
  /** Whether company is in banking sector */
  isBankSector: boolean;
  /** Whether company pays no dividend */
  isNonDividendPayer: boolean;
  /** Whether earnings are negative */
  hasNegativeEarnings: boolean;
  /** Company name for display (already locale-resolved) */
  companyName: string;
}

// ─── Individual metric interpreters ─────────────────────────────────────────

export function interpretMetric(
  key: string,
  ctx: MetricContext,
): MetricInterpretation | null {
  const fn = interpreters[key];
  if (!fn) return null;
  return fn(ctx);
}

type InterpreterFn = (ctx: MetricContext) => MetricInterpretation | null;

const interpreters: Record<string, InterpreterFn> = {
  // ══════════════════════════════════════════════════════════════
  // VALUATION
  // ══════════════════════════════════════════════════════════════
  pe_ratio: (ctx) => {
    const v = ctx.n("pe_ratio");
    if (!ok(v)) return null;
    if (v < 0 || ctx.hasNegativeEarnings) {
      return {
        signal: "risk",
        badge: { en: "N/A", ar: "غير متاح" },
        oneLiner: { en: "Earnings are negative — P/E is not meaningful", ar: "الأرباح سلبية — مكرر الأرباح غير ذي معنى" },
        detail: { en: "When a company reports a net loss, the P/E ratio becomes meaningless. Focus on revenue trends and balance sheet strength instead.", ar: "عندما تسجل الشركة خسارة صافية، يفقد مكرر الأرباح معناه. ركّز بدلاً من ذلك على اتجاه الإيرادات وقوة الميزانية." },
        watch: { en: "Monitor for a return to profitability", ar: "تابع عودة الشركة إلى الربحية" },
      };
    }
    const pctile = ctx.n("sector_pctile_pe");
    const pctileNote = ok(pctile) ? (pctile < 30 ? " — in the lower third of its sector" : pctile > 70 ? " — in the upper third of its sector" : "") : "";
    const pctileNoteAr = ok(pctile) ? (pctile < 30 ? " — ضمن الثلث الأدنى في قطاعه" : pctile > 70 ? " — ضمن الثلث الأعلى في قطاعه" : "") : "";

    if (v < 10) {
      return {
        signal: "attractive",
        badge: { en: "Attractive", ar: "جذاب" },
        oneLiner: { en: `Low earnings multiple at ${fmtX(v)}${pctileNote}`, ar: `مكرر أرباح منخفض عند ${fmtX(v)}${pctileNoteAr}` },
        detail: { en: `Trading at ${fmtX(v)} earnings, which is below typical market levels. This can indicate undervaluation or reflect lower growth expectations.`, ar: `يتداول عند ${fmtX(v)} من الأرباح، وهو أقل من المستويات المعتادة في السوق. قد يشير ذلك إلى تقييم منخفض أو توقعات نمو أقل.` },
        watch: { en: "Check if low PE reflects genuine value or declining earnings ahead", ar: "تحقق مما إذا كان المكرر المنخفض يعكس قيمة حقيقية أو تراجعًا متوقعًا في الأرباح" },
      };
    }
    if (v < 15) {
      return {
        signal: "attractive",
        badge: { en: "Reasonable", ar: "معقول" },
        oneLiner: { en: `Moderately valued at ${fmtX(v)} earnings${pctileNote}`, ar: `تقييم معتدل عند ${fmtX(v)} من الأرباح${pctileNoteAr}` },
        detail: { en: `A P/E of ${fmtX(v)} is generally considered moderate. The market isn't pricing in excessive growth.`, ar: `مكرر أرباح ${fmtX(v)} يُعتبر عمومًا معتدلاً. السوق لا يسعّر نموًا مبالغًا فيه.` },
        watch: { en: "Earnings stability and sector comparison", ar: "استقرار الأرباح والمقارنة مع القطاع" },
      };
    }
    if (v < 25) {
      return {
        signal: "balanced",
        badge: { en: "Fair", ar: "عادل" },
        oneLiner: { en: `Fair valuation at ${fmtX(v)} earnings${pctileNote}`, ar: `تقييم عادل عند ${fmtX(v)} من الأرباح${pctileNoteAr}` },
        detail: { en: `At ${fmtX(v)}, the stock is valued in line with average market multiples. This often reflects moderate growth expectations.`, ar: `عند ${fmtX(v)}، السهم مقيّم بما يتماشى مع متوسط مضاعفات السوق. يعكس ذلك عادة توقعات نمو معتدلة.` },
        watch: { en: "Whether earnings growth justifies the current multiple", ar: "ما إذا كان نمو الأرباح يبرر المكرر الحالي" },
      };
    }
    return {
      signal: "premium",
      badge: { en: "Premium", ar: "مرتفع" },
      oneLiner: { en: `High earnings multiple at ${fmtX(v)}${pctileNote}`, ar: `مكرر أرباح مرتفع عند ${fmtX(v)}${pctileNoteAr}` },
      detail: { en: `At ${fmtX(v)}, investors are paying a premium. This is often justified by strong growth or quality, but leaves less room for disappointment.`, ar: `عند ${fmtX(v)}، المستثمرون يدفعون علاوة. قد يكون ذلك مبررًا بالنمو أو الجودة، لكنه يترك مساحة أقل للخطأ.` },
      watch: { en: "Future earnings must support this premium valuation", ar: "الأرباح المستقبلية يجب أن تدعم هذا التقييم المرتفع" },
    };
  },

  pb_ratio: (ctx) => {
    const v = ctx.n("pb_ratio");
    if (!ok(v)) return null;
    if (v < 1.0) {
      return {
        signal: "attractive",
        badge: { en: "Below Book", ar: "أقل من الدفترية" },
        oneLiner: { en: `Trading below book value at ${fmtX(v)}`, ar: `يتداول أقل من القيمة الدفترية عند ${fmtX(v)}` },
        detail: { en: `A P/B below 1.0 means the market values the company at less than its net assets. This can signal undervaluation or concerns about asset quality.`, ar: `مكرر دفترية أقل من 1.0 يعني أن السوق يقيّم الشركة بأقل من صافي أصولها. قد يشير إلى تقييم منخفض أو مخاوف حول جودة الأصول.` },
        watch: { en: "Asset quality and return on equity", ar: "جودة الأصول والعائد على حقوق الملكية" },
      };
    }
    if (v < 2.0) {
      return {
        signal: "balanced",
        badge: { en: "Fair", ar: "عادل" },
        oneLiner: { en: `Moderate book multiple at ${fmtX(v)}`, ar: `مكرر دفترية معتدل عند ${fmtX(v)}` },
        detail: { en: `A P/B of ${fmtX(v)} is within normal range, suggesting the market has moderate confidence in the company's asset-driven returns.`, ar: `مكرر دفترية ${fmtX(v)} ضمن النطاق الطبيعي، مما يعكس ثقة معتدلة من السوق في عوائد أصول الشركة.` },
        watch: { en: "Consistency of returns on equity", ar: "استمرارية العائد على حقوق الملكية" },
      };
    }
    return {
      signal: "premium",
      badge: { en: "Premium", ar: "مرتفع" },
      oneLiner: { en: `High book multiple at ${fmtX(v)}`, ar: `مكرر دفترية مرتفع عند ${fmtX(v)}` },
      detail: { en: `At ${fmtX(v)}, the market is paying well above book value. This is typical for high-quality companies but may mean limited upside if growth slows.`, ar: `عند ${fmtX(v)}، السوق يدفع أعلى بكثير من القيمة الدفترية. هذا طبيعي للشركات عالية الجودة لكنه قد يعني صعودًا محدودًا إذا تباطأ النمو.` },
      watch: { en: "Whether high returns on equity justify the premium", ar: "ما إذا كانت العوائد المرتفعة على حقوق الملكية تبرر العلاوة" },
    };
  },

  ps_ratio: (ctx) => {
    const v = ctx.n("ps_ratio");
    if (!ok(v)) return null;
    if (v < 1.5) {
      return {
        signal: "attractive",
        badge: { en: "Cheap on Sales", ar: "رخيص نسبة للمبيعات" },
        oneLiner: { en: `Low sales multiple at ${fmtX(v)}`, ar: `مكرر مبيعات منخفض عند ${fmtX(v)}` },
        detail: { en: `At ${fmtX(v)}, the stock is valued modestly relative to its revenue. This can be attractive if margins are stable or improving.`, ar: `عند ${fmtX(v)}، السهم مقيّم بشكل متواضع مقارنة بإيراداته. قد يكون ذلك جذابًا إذا كانت الهوامش مستقرة أو تتحسن.` },
        watch: { en: "Profit margins — cheap on sales means little if margins are thin", ar: "هوامش الربح — الرخص نسبة للمبيعات لا يعني شيئًا إذا كانت الهوامش ضعيفة" },
      };
    }
    if (v < 5.0) {
      return {
        signal: "balanced",
        badge: { en: "Fair", ar: "عادل" },
        oneLiner: { en: `Moderate sales multiple at ${fmtX(v)}`, ar: `مكرر مبيعات معتدل عند ${fmtX(v)}` },
        detail: { en: `A P/S of ${fmtX(v)} suggests the market is moderately valuing the company's revenue stream.`, ar: `مكرر مبيعات ${fmtX(v)} يعكس تقييمًا معتدلاً لتدفق إيرادات الشركة.` },
        watch: { en: "Revenue growth sustainability and margin trends", ar: "استدامة نمو الإيرادات واتجاه الهوامش" },
      };
    }
    return {
      signal: "premium",
      badge: { en: "Premium", ar: "مرتفع" },
      oneLiner: { en: `High sales multiple at ${fmtX(v)}`, ar: `مكرر مبيعات مرتفع عند ${fmtX(v)}` },
      detail: { en: `At ${fmtX(v)}, the stock commands a high revenue premium. This requires strong profit conversion to justify.`, ar: `عند ${fmtX(v)}، السهم يحظى بعلاوة مرتفعة على إيراداته. يتطلب ذلك تحويلاً قويًا للأرباح لتبرير التقييم.` },
      watch: { en: "Whether revenue growth and margins justify the multiple", ar: "ما إذا كان نمو الإيرادات والهوامش يبرران المكرر" },
    };
  },

  ev_ebitda: (ctx) => {
    const v = ctx.n("ev_ebitda");
    if (!ok(v)) return null;
    if (v < 8) {
      return {
        signal: "attractive",
        badge: { en: "Cheap", ar: "رخيص" },
        oneLiner: { en: `Low enterprise multiple at ${fmtX(v)}`, ar: `مكرر مؤسسة منخفض عند ${fmtX(v)}` },
        detail: { en: `An EV/EBITDA of ${fmtX(v)} is below average, suggesting the stock may be undervalued relative to its operating earnings power.`, ar: `مكرر مؤسسة ${fmtX(v)} أقل من المتوسط، مما يشير إلى احتمال أن السهم مقيّم بأقل من قدرته الربحية التشغيلية.` },
        watch: { en: "EBITDA stability and debt levels", ar: "استقرار الأرباح التشغيلية ومستوى الديون" },
      };
    }
    if (v < 15) {
      return {
        signal: "balanced",
        badge: { en: "Fair", ar: "عادل" },
        oneLiner: { en: `Moderate enterprise value at ${fmtX(v)}`, ar: `قيمة مؤسسة معتدلة عند ${fmtX(v)}` },
        detail: { en: `At ${fmtX(v)}, the company's total value relative to operating earnings is in line with typical levels.`, ar: `عند ${fmtX(v)}، القيمة الإجمالية للشركة مقارنة بأرباحها التشغيلية ضمن المستويات المعتادة.` },
        watch: { en: "Operating earnings consistency", ar: "استمرارية الأرباح التشغيلية" },
      };
    }
    return {
      signal: "premium",
      badge: { en: "Expensive", ar: "مكلف" },
      oneLiner: { en: `High enterprise multiple at ${fmtX(v)}`, ar: `مكرر مؤسسة مرتفع عند ${fmtX(v)}` },
      detail: { en: `At ${fmtX(v)}, the stock's total value is stretched relative to operating cash earnings. Growth must be strong to justify.`, ar: `عند ${fmtX(v)}، القيمة الإجمالية ممتدة مقارنة بالأرباح النقدية التشغيلية. يجب أن يكون النمو قويًا لتبرير ذلك.` },
      watch: { en: "EBITDA growth trajectory and debt reduction", ar: "مسار نمو الأرباح التشغيلية وخفض الديون" },
    };
  },

  // ══════════════════════════════════════════════════════════════
  // QUALITY
  // ══════════════════════════════════════════════════════════════
  roe: (ctx) => {
    const v = ctx.n("roe");
    if (!ok(v)) return null;
    if (v > 0.20) {
      return {
        signal: "strong",
        badge: { en: "Strong", ar: "قوي" },
        oneLiner: { en: `Excellent return on equity at ${fmtPct(v)}`, ar: `عائد ممتاز على حقوق الملكية عند ${fmtPct(v)}` },
        detail: { en: `An ROE of ${fmtPct(v)} indicates strong profitability relative to shareholder equity. The company is generating high returns from its capital base.`, ar: `عائد على حقوق الملكية ${fmtPct(v)} يشير إلى ربحية قوية. الشركة تحقق عوائد مرتفعة من رأسمالها.` },
        watch: { en: "Check if high ROE is driven by quality earnings or high leverage", ar: "تحقق مما إذا كان العائد المرتفع ناتجًا عن أرباح حقيقية أو رافعة مالية عالية" },
      };
    }
    if (v > 0.10) {
      return {
        signal: "healthy",
        badge: { en: "Good", ar: "جيد" },
        oneLiner: { en: `Solid return on equity at ${fmtPct(v)}`, ar: `عائد جيد على حقوق الملكية عند ${fmtPct(v)}` },
        detail: { en: `An ROE of ${fmtPct(v)} suggests the company is generating reasonable returns for shareholders.`, ar: `عائد على حقوق الملكية ${fmtPct(v)} يشير إلى أن الشركة تحقق عوائد معقولة للمساهمين.` },
        watch: { en: "Trend over recent quarters", ar: "الاتجاه خلال الأرباع الأخيرة" },
      };
    }
    if (v > 0) {
      return {
        signal: "weak",
        badge: { en: "Low", ar: "منخفض" },
        oneLiner: { en: `Below-average return on equity at ${fmtPct(v)}`, ar: `عائد منخفض على حقوق الملكية عند ${fmtPct(v)}` },
        detail: { en: `An ROE of ${fmtPct(v)} is below average. The company may be struggling to efficiently convert equity into profit.`, ar: `عائد ${fmtPct(v)} أقل من المتوسط. قد تواجه الشركة صعوبة في تحويل رأس المال إلى أرباح بكفاءة.` },
        watch: { en: "Whether management is taking steps to improve capital efficiency", ar: "ما إذا كانت الإدارة تتخذ خطوات لتحسين كفاءة رأس المال" },
      };
    }
    return {
      signal: "risk",
      badge: { en: "Negative", ar: "سلبي" },
      oneLiner: { en: `Negative return on equity at ${fmtPct(v)}`, ar: `عائد سلبي على حقوق الملكية عند ${fmtPct(v)}` },
      detail: { en: "The company is generating losses relative to shareholder equity, which is a warning sign.", ar: "الشركة تحقق خسائر مقارنة بحقوق المساهمين، وهذه علامة تحذيرية." },
      watch: { en: "Path to profitability", ar: "المسار نحو الربحية" },
    };
  },

  roa: (ctx) => {
    const v = ctx.n("roa");
    if (!ok(v)) return null;
    if (v > 0.08) return { signal: "strong", badge: { en: "Efficient", ar: "كفاءة عالية" }, oneLiner: { en: `Strong asset returns at ${fmtPct(v)}`, ar: `عوائد قوية على الأصول عند ${fmtPct(v)}` }, detail: { en: `The company extracts ${fmtPct(v)} profit from its asset base, indicating strong operational efficiency.`, ar: `الشركة تستخرج ${fmtPct(v)} ربحًا من أصولها، مما يشير إلى كفاءة تشغيلية عالية.` }, watch: { en: "Asset utilization trends", ar: "اتجاهات استغلال الأصول" } };
    if (v > 0.03) return { signal: "balanced", badge: { en: "Average", ar: "متوسط" }, oneLiner: { en: `Moderate asset returns at ${fmtPct(v)}`, ar: `عوائد معتدلة على الأصول عند ${fmtPct(v)}` }, detail: { en: `An ROA of ${fmtPct(v)} is in line with many companies. Asset efficiency is adequate but not exceptional.`, ar: `عائد على الأصول ${fmtPct(v)} يتماشى مع كثير من الشركات. كفاءة الأصول كافية لكن ليست استثنائية.` }, watch: { en: "Compare within sector — asset-heavy industries naturally show lower ROA", ar: "قارن داخل القطاع — الصناعات كثيفة الأصول تظهر عائدًا أقل طبيعيًا" } };
    return { signal: "weak", badge: { en: "Low", ar: "منخفض" }, oneLiner: { en: `Weak asset returns at ${fmtPct(v)}`, ar: `عوائد ضعيفة على الأصول عند ${fmtPct(v)}` }, detail: { en: `Low ROA suggests the company's assets are not generating strong profits.`, ar: `عائد منخفض يشير إلى أن أصول الشركة لا تحقق أرباحًا قوية.` }, watch: { en: "Asset restructuring or efficiency improvements", ar: "إعادة هيكلة الأصول أو تحسين الكفاءة" } };
  },

  net_margin: (ctx) => {
    const v = ctx.n("net_margin");
    if (!ok(v)) return null;
    if (v > 0.20) return { signal: "strong", badge: { en: "High Margin", ar: "هامش مرتفع" }, oneLiner: { en: `Strong profitability — ${fmtPct(v)} of revenue turns to profit`, ar: `ربحية قوية — ${fmtPct(v)} من الإيرادات تتحول إلى أرباح` }, detail: { en: `A net margin above 20% is strong. The company retains a significant portion of revenue as profit.`, ar: `هامش صافي أعلى من 20% قوي. الشركة تحتفظ بنسبة كبيرة من إيراداتها كأرباح.` }, watch: { en: "Margin sustainability and competitive pressures", ar: "استدامة الهامش والضغوط التنافسية" } };
    if (v > 0.10) return { signal: "healthy", badge: { en: "Solid", ar: "جيد" }, oneLiner: { en: `Healthy profitability at ${fmtPct(v)} net margin`, ar: `ربحية صحية عند هامش صافي ${fmtPct(v)}` }, detail: { en: `A ${fmtPct(v)} net margin indicates the business is converting revenue to profit at a reasonable rate.`, ar: `هامش صافي ${fmtPct(v)} يشير إلى أن الشركة تحوّل الإيرادات إلى أرباح بمعدل معقول.` }, watch: { en: "Cost management and revenue trends", ar: "إدارة التكاليف واتجاه الإيرادات" } };
    if (v > 0) return { signal: "pressured", badge: { en: "Thin", ar: "ضعيف" }, oneLiner: { en: `Thin profit margin at ${fmtPct(v)}`, ar: `هامش ربح ضعيف عند ${fmtPct(v)}` }, detail: { en: `A net margin of ${fmtPct(v)} leaves little room for error. Small cost increases could pressure profitability.`, ar: `هامش صافي ${fmtPct(v)} لا يترك مساحة كبيرة للخطأ. زيادات صغيرة في التكاليف قد تضغط على الربحية.` }, watch: { en: "Cost structure and pricing power", ar: "هيكل التكاليف وقوة التسعير" } };
    return { signal: "risk", badge: { en: "Loss", ar: "خسارة" }, oneLiner: { en: `Company is operating at a loss (${fmtPct(v)} margin)`, ar: `الشركة تعمل بخسارة (هامش ${fmtPct(v)})` }, detail: { en: "Negative margin means expenses exceed revenue. This is a red flag unless the company is in an investment phase.", ar: "هامش سلبي يعني أن المصاريف تتجاوز الإيرادات. هذا تحذير ما لم تكن الشركة في مرحلة استثمار." }, watch: { en: "Timeline to profitability", ar: "الجدول الزمني للوصول إلى الربحية" } };
  },

  operating_margin: (ctx) => {
    const v = ctx.n("operating_margin");
    if (!ok(v)) return null;
    if (v > 0.25) return { signal: "strong", badge: { en: "Strong", ar: "قوي" }, oneLiner: { en: `Excellent operating efficiency at ${fmtPct(v)}`, ar: `كفاءة تشغيلية ممتازة عند ${fmtPct(v)}` }, detail: { en: `Operating margin of ${fmtPct(v)} shows the core business is highly profitable before non-operating items.`, ar: `هامش تشغيلي ${fmtPct(v)} يظهر أن النشاط الأساسي مربح جدًا قبل البنود غير التشغيلية.` }, watch: { en: "Cost discipline and competitive moat", ar: "انضباط التكاليف والميزة التنافسية" } };
    if (v > 0.10) return { signal: "healthy", badge: { en: "Solid", ar: "جيد" }, oneLiner: { en: `Healthy operating margin at ${fmtPct(v)}`, ar: `هامش تشغيلي صحي عند ${fmtPct(v)}` }, detail: { en: `The core business generates solid profits at ${fmtPct(v)} operating margin.`, ar: `النشاط الأساسي يحقق أرباحًا جيدة عند هامش تشغيلي ${fmtPct(v)}.` }, watch: { en: "Operating leverage as revenue scales", ar: "الرافعة التشغيلية مع نمو الإيرادات" } };
    if (v > 0) return { signal: "pressured", badge: { en: "Thin", ar: "ضعيف" }, oneLiner: { en: `Narrow operating margin at ${fmtPct(v)}`, ar: `هامش تشغيلي ضيق عند ${fmtPct(v)}` }, detail: { en: `A ${fmtPct(v)} operating margin suggests the business has limited pricing power or high cost structure.`, ar: `هامش ${fmtPct(v)} يشير إلى قوة تسعير محدودة أو هيكل تكاليف مرتفع.` }, watch: { en: "Revenue growth and cost optimization", ar: "نمو الإيرادات وتحسين التكاليف" } };
    return { signal: "risk", badge: { en: "Operating Loss", ar: "خسارة تشغيلية" }, oneLiner: { en: "Core business is unprofitable", ar: "النشاط الأساسي غير مربح" }, detail: { en: "Negative operating margin means the company loses money on its core operations.", ar: "هامش تشغيلي سلبي يعني أن الشركة تخسر من نشاطها الأساسي." }, watch: { en: "Restructuring plans or revenue acceleration", ar: "خطط إعادة الهيكلة أو تسريع الإيرادات" } };
  },

  roce: (ctx) => {
    const v = ctx.n("roce");
    if (!ok(v)) return null;
    if (v > 0.15) return { signal: "strong", badge: { en: "Efficient", ar: "كفء" }, oneLiner: { en: `High capital efficiency at ${fmtPct(v)}`, ar: `كفاءة رأسمال عالية عند ${fmtPct(v)}` }, detail: { en: `ROCE of ${fmtPct(v)} means the company earns strong returns on every riyal invested in the business.`, ar: `عائد على رأس المال ${fmtPct(v)} يعني أن الشركة تحقق عوائد قوية على كل ريال مستثمر.` }, watch: { en: "Sustainability of returns", ar: "استدامة العوائد" } };
    if (v > 0.08) return { signal: "balanced", badge: { en: "Adequate", ar: "كافٍ" }, oneLiner: { en: `Reasonable capital returns at ${fmtPct(v)}`, ar: `عوائد رأسمال معقولة عند ${fmtPct(v)}` }, detail: { en: `A moderate ROCE indicates the business generates acceptable returns on capital employed.`, ar: `عائد معتدل يشير إلى أن الشركة تحقق عوائد مقبولة على رأس المال المستخدم.` }, watch: { en: "Capital allocation decisions", ar: "قرارات تخصيص رأس المال" } };
    return { signal: "weak", badge: { en: "Low", ar: "منخفض" }, oneLiner: { en: `Low capital returns at ${fmtPct(v)}`, ar: `عوائد رأسمال منخفضة عند ${fmtPct(v)}` }, detail: { en: "The company is not generating strong returns from its invested capital.", ar: "الشركة لا تحقق عوائد قوية من رأسمالها المستثمر." }, watch: { en: "Improvement in asset productivity", ar: "تحسن إنتاجية الأصول" } };
  },

  // ══════════════════════════════════════════════════════════════
  // GROWTH
  // ══════════════════════════════════════════════════════════════
  revenue_growth_yoy: (ctx) => {
    const v = ctx.n("revenue_growth_yoy");
    if (!ok(v)) return null;
    if (v > 0.15) return { signal: "strong", badge: { en: "Accelerating", ar: "متسارع" }, oneLiner: { en: `Strong revenue growth of ${fmtPct(v)} year-over-year`, ar: `نمو قوي في الإيرادات بنسبة ${fmtPct(v)} سنويًا` }, detail: { en: `Revenue grew ${fmtPct(v)} year-over-year, indicating a business that is expanding meaningfully.`, ar: `نمت الإيرادات بنسبة ${fmtPct(v)} مقارنة بالعام الماضي، مما يشير إلى توسع ملموس في النشاط.` }, watch: { en: "Whether growth is organic or from acquisitions", ar: "ما إذا كان النمو عضويًا أو ناتجًا عن استحواذات" } };
    if (v > 0.05) return { signal: "improving", badge: { en: "Growing", ar: "نمو" }, oneLiner: { en: `Moderate revenue growth of ${fmtPct(v)}`, ar: `نمو معتدل في الإيرادات بنسبة ${fmtPct(v)}` }, detail: { en: `The business is growing at a steady pace of ${fmtPct(v)} annually.`, ar: `النشاط ينمو بوتيرة ثابتة بنسبة ${fmtPct(v)} سنويًا.` }, watch: { en: "Revenue quality and margin impact", ar: "جودة الإيرادات وتأثيرها على الهوامش" } };
    if (v > -0.05) return { signal: "neutral", badge: { en: "Flat", ar: "مستقر" }, oneLiner: { en: `Revenue roughly flat (${fmtPct(v)})`, ar: `الإيرادات شبه ثابتة (${fmtPct(v)})` }, detail: { en: "Revenue is neither growing nor declining meaningfully.", ar: "الإيرادات لا تنمو ولا تتراجع بشكل ملموس." }, watch: { en: "Catalysts for growth re-acceleration", ar: "محفزات لإعادة تسارع النمو" } };
    return { signal: "slowing", badge: { en: "Declining", ar: "تراجع" }, oneLiner: { en: `Revenue declined ${fmtPct(v)} year-over-year`, ar: `تراجعت الإيرادات بنسبة ${fmtPct(v)} سنويًا` }, detail: { en: `Revenue fell ${fmtPct(v)}, which could signal demand weakness or competitive pressure.`, ar: `تراجعت الإيرادات بنسبة ${fmtPct(v)}، مما قد يشير إلى ضعف الطلب أو ضغوط تنافسية.` }, watch: { en: "Management guidance and market conditions", ar: "توجيهات الإدارة وظروف السوق" } };
  },

  earnings_growth_yoy: (ctx) => {
    const v = ctx.n("earnings_growth_yoy");
    if (!ok(v)) return null;
    if (v > 0.15) return { signal: "strong", badge: { en: "Surging", ar: "قفزة" }, oneLiner: { en: `Earnings surged ${fmtPct(v)} year-over-year`, ar: `قفزت الأرباح بنسبة ${fmtPct(v)} سنويًا` }, detail: { en: `Strong earnings growth of ${fmtPct(v)} indicates improving profitability.`, ar: `نمو قوي في الأرباح بنسبة ${fmtPct(v)} يشير إلى تحسن الربحية.` }, watch: { en: "Sustainability — is this one-time or recurring?", ar: "الاستدامة — هل هذا مؤقت أم متكرر؟" } };
    if (v > 0) return { signal: "improving", badge: { en: "Growing", ar: "نمو" }, oneLiner: { en: `Earnings grew ${fmtPct(v)}`, ar: `نمت الأرباح بنسبة ${fmtPct(v)}` }, detail: { en: "Positive earnings growth signals an improving profit trajectory.", ar: "نمو إيجابي في الأرباح يشير إلى مسار ربحية متحسن." }, watch: { en: "Quality of earnings growth", ar: "جودة نمو الأرباح" } };
    if (v > -0.15) return { signal: "slowing", badge: { en: "Declining", ar: "تراجع" }, oneLiner: { en: `Earnings fell ${fmtPct(v)}`, ar: `تراجعت الأرباح بنسبة ${fmtPct(v)}` }, detail: { en: "Earnings are declining, which may pressure the stock.", ar: "الأرباح في تراجع، مما قد يضغط على السهم." }, watch: { en: "Cost actions and revenue outlook", ar: "إجراءات خفض التكاليف وتوقعات الإيرادات" } };
    return { signal: "risk", badge: { en: "Sharp Decline", ar: "تراجع حاد" }, oneLiner: { en: `Earnings dropped sharply (${fmtPct(v)})`, ar: `تراجعت الأرباح بحدة (${fmtPct(v)})` }, detail: { en: "A significant earnings drop raises concern about the company's near-term profitability.", ar: "تراجع حاد في الأرباح يثير مخاوف حول ربحية الشركة على المدى القريب." }, watch: { en: "Whether the decline is structural or cyclical", ar: "ما إذا كان التراجع هيكليًا أم دوريًا" } };
  },

  eps_growth_yoy: (ctx) => {
    const v = ctx.n("eps_growth_yoy");
    if (!ok(v)) return null;
    if (v > 0.10) return { signal: "strong", badge: { en: "Growing", ar: "نمو" }, oneLiner: { en: `EPS grew ${fmtPct(v)} — improving shareholder returns`, ar: `نمت ربحية السهم ${fmtPct(v)} — تحسّن عوائد المساهمين` }, detail: { en: "Rising EPS directly benefits shareholders.", ar: "ارتفاع ربحية السهم يفيد المساهمين مباشرة." }, watch: { en: "Share buybacks vs. organic profit growth", ar: "إعادة شراء الأسهم مقابل النمو العضوي للأرباح" } };
    if (v > 0) return { signal: "improving", badge: { en: "Positive", ar: "إيجابي" }, oneLiner: { en: `EPS up ${fmtPct(v)} year-over-year`, ar: `ربحية السهم ارتفعت ${fmtPct(v)} سنويًا` }, detail: { en: "Modest positive EPS growth.", ar: "نمو متواضع إيجابي في ربحية السهم." }, watch: { en: "Trend consistency", ar: "استمرارية الاتجاه" } };
    return { signal: "slowing", badge: { en: "Declining", ar: "تراجع" }, oneLiner: { en: `EPS declined ${fmtPct(v)}`, ar: `تراجعت ربحية السهم ${fmtPct(v)}` }, detail: { en: "Declining EPS means less profit per share for investors.", ar: "تراجع ربحية السهم يعني أرباحًا أقل لكل سهم." }, watch: { en: "Earnings recovery timeline", ar: "الجدول الزمني لتعافي الأرباح" } };
  },

  revenue_cagr_3y: (ctx) => {
    const v = ctx.n("revenue_cagr_3y");
    if (!ok(v)) return null;
    if (v > 0.10) return { signal: "strong", badge: { en: "Strong Trend", ar: "اتجاه قوي" }, oneLiner: { en: `Revenue growing ${fmtPct(v)}/year over 3 years`, ar: `الإيرادات تنمو ${fmtPct(v)} سنويًا على مدى 3 سنوات` }, detail: { en: "A sustained 3-year growth trend is a positive indicator of business strength.", ar: "اتجاه نمو مستمر لـ 3 سنوات مؤشر إيجابي على قوة النشاط." }, watch: { en: "Whether growth can sustain at this rate", ar: "ما إذا كان النمو يمكن أن يستمر بهذا المعدل" } };
    if (v > 0) return { signal: "improving", badge: { en: "Positive", ar: "إيجابي" }, oneLiner: { en: `3-year revenue CAGR of ${fmtPct(v)}`, ar: `معدل نمو الإيرادات 3 سنوات ${fmtPct(v)}` }, detail: { en: "Moderate long-term revenue growth.", ar: "نمو معتدل في الإيرادات على المدى البعيد." }, watch: { en: "Acceleration or deceleration in recent quarters", ar: "التسارع أو التباطؤ في الأرباع الأخيرة" } };
    return { signal: "slowing", badge: { en: "Shrinking", ar: "انكماش" }, oneLiner: { en: `Revenue has been declining over 3 years (${fmtPct(v)}/yr)`, ar: `الإيرادات تتراجع على مدى 3 سنوات (${fmtPct(v)} سنويًا)` }, detail: { en: "A negative 3-year CAGR is a concern — the business is contracting.", ar: "معدل سلبي على 3 سنوات مقلق — النشاط في انكماش." }, watch: { en: "Turnaround strategy and market dynamics", ar: "استراتيجية التحول وديناميكيات السوق" } };
  },

  // ══════════════════════════════════════════════════════════════
  // DIVIDEND
  // ══════════════════════════════════════════════════════════════
  dividend_yield: (ctx) => {
    const v = ctx.n("dividend_yield");
    if (!ok(v) || ctx.isNonDividendPayer) return null;
    if (v > 0.06) return { signal: "strong", badge: { en: "High Yield", ar: "عائد مرتفع" }, oneLiner: { en: `Attractive yield at ${fmtPct(v)}`, ar: `عائد جذاب عند ${fmtPct(v)}` }, detail: { en: `A ${fmtPct(v)} yield is well above market average. Check payout sustainability before counting on it.`, ar: `عائد ${fmtPct(v)} أعلى بكثير من متوسط السوق. تحقق من استدامة التوزيع قبل الاعتماد عليه.` }, watch: { en: "Very high yields can be a sign of a falling stock price or unsustainable payout", ar: "العوائد المرتفعة جدًا قد تكون بسبب هبوط سعر السهم أو توزيعات غير مستدامة" } };
    if (v > 0.03) return { signal: "healthy", badge: { en: "Good Yield", ar: "عائد جيد" }, oneLiner: { en: `Solid dividend yield at ${fmtPct(v)}`, ar: `عائد توزيعات جيد عند ${fmtPct(v)}` }, detail: { en: `A ${fmtPct(v)} yield provides meaningful income while not being excessively stretched.`, ar: `عائد ${fmtPct(v)} يوفر دخلاً جيدًا دون أن يكون ممتدًا بشكل مفرط.` }, watch: { en: "Dividend growth trends", ar: "اتجاهات نمو التوزيعات" } };
    if (v > 0.01) return { signal: "balanced", badge: { en: "Modest", ar: "متواضع" }, oneLiner: { en: `Modest yield at ${fmtPct(v)}`, ar: `عائد متواضع عند ${fmtPct(v)}` }, detail: { en: "The dividend provides some income, but this is not primarily an income stock.", ar: "التوزيعات توفر بعض الدخل، لكن السهم ليس سهم دخل بالدرجة الأولى." }, watch: { en: "Whether dividends are expected to grow", ar: "ما إذا كان من المتوقع نمو التوزيعات" } };
    return { signal: "weak", badge: { en: "Minimal", ar: "ضئيل" }, oneLiner: { en: `Very low yield at ${fmtPct(v)}`, ar: `عائد ضئيل جدًا عند ${fmtPct(v)}` }, detail: { en: "Token dividend — likely not a meaningful income source.", ar: "توزيعات رمزية — غالبًا ليست مصدر دخل مهم." }, watch: { en: "Company's capital allocation priorities", ar: "أولويات تخصيص رأس مال الشركة" } };
  },

  payout_ratio: (ctx) => {
    const v = ctx.n("payout_ratio");
    if (!ok(v) || ctx.isNonDividendPayer) return null;
    if (v < 0) return { signal: "risk", badge: { en: "Unsustainable", ar: "غير مستدام" }, oneLiner: { en: "Paying dividends despite losses", ar: "يوزع أرباحًا رغم وجود خسائر" }, detail: { en: "The company is paying dividends from reserves while operating at a loss. This is not sustainable.", ar: "الشركة توزع أرباحًا من الاحتياطيات بينما تعمل بخسارة. هذا غير مستدام." }, watch: { en: "Risk of dividend cut", ar: "خطر خفض التوزيعات" } };
    if (v <= 0.50) return { signal: "strong", badge: { en: "Sustainable", ar: "مستدام" }, oneLiner: { en: `Conservative payout at ${fmtPct(v)} — room to grow`, ar: `توزيع محافظ عند ${fmtPct(v)} — مساحة للنمو` }, detail: { en: `Only ${fmtPct(v)} of earnings are paid out, leaving ample room for reinvestment and dividend increases.`, ar: `فقط ${fmtPct(v)} من الأرباح تُوزع، مما يترك مساحة كبيرة لإعادة الاستثمار وزيادة التوزيعات.` }, watch: { en: "Dividend growth potential", ar: "إمكانية نمو التوزيعات" } };
    if (v <= 0.75) return { signal: "balanced", badge: { en: "Balanced", ar: "متوازن" }, oneLiner: { en: `Moderate payout at ${fmtPct(v)}`, ar: `نسبة توزيع معتدلة عند ${fmtPct(v)}` }, detail: { en: "The payout is balanced between returning cash and retaining for growth.", ar: "التوزيع متوازن بين إعادة النقد للمساهمين والاحتفاظ بأرباح للنمو." }, watch: { en: "Earnings growth to maintain payout", ar: "نمو الأرباح للحفاظ على نسبة التوزيع" } };
    if (v <= 0.95) return { signal: "stretched", badge: { en: "Stretched", ar: "ممتد" }, oneLiner: { en: `High payout at ${fmtPct(v)} — limited flexibility`, ar: `نسبة توزيع مرتفعة ${fmtPct(v)} — مرونة محدودة` }, detail: { en: "Most earnings are being distributed, leaving little for growth or buffers.", ar: "معظم الأرباح تُوزع، مما يترك مساحة ضئيلة للنمو أو كمخزن احتياطي." }, watch: { en: "Risk of dividend cut if earnings weaken", ar: "خطر خفض التوزيعات إذا ضعفت الأرباح" } };
    return { signal: "risk", badge: { en: "Unsustainable", ar: "غير مستدام" }, oneLiner: { en: `Payout exceeds earnings at ${fmtPct(v)}`, ar: `التوزيعات تتجاوز الأرباح عند ${fmtPct(v)}` }, detail: { en: "Paying out more than the company earns is not sustainable long-term.", ar: "توزيع أكثر مما تكسبه الشركة غير مستدام على المدى الطويل." }, watch: { en: "Imminent dividend reduction risk", ar: "خطر خفض التوزيعات الوشيك" } };
  },

  years_of_dividends: (ctx) => {
    const v = ctx.n("years_of_dividends");
    if (!ok(v)) return null;
    if (v >= 10) return { signal: "strong", badge: { en: "Established", ar: "راسخ" }, oneLiner: { en: `${v.toFixed(0)} years of consecutive dividends`, ar: `${v.toFixed(0)} سنوات متتالية من التوزيعات` }, detail: { en: "A long track record signals management commitment to returning cash.", ar: "سجل طويل يشير إلى التزام الإدارة بإعادة النقد للمساهمين." }, watch: { en: "Past consistency doesn't guarantee future payments", ar: "الاستمرارية السابقة لا تضمن استمرار التوزيعات مستقبلًا" } };
    if (v >= 5) return { signal: "healthy", badge: { en: "Consistent", ar: "منتظم" }, oneLiner: { en: `${v.toFixed(0)} years of dividend history`, ar: `${v.toFixed(0)} سنوات من سجل التوزيعات` }, detail: { en: "A reasonable track record of dividend payments.", ar: "سجل معقول من التوزيعات." }, watch: { en: "Trend in dividend amounts", ar: "اتجاه مبالغ التوزيعات" } };
    if (v >= 2) return { signal: "balanced", badge: { en: "Short Record", ar: "سجل قصير" }, oneLiner: { en: `Only ${v.toFixed(0)} years of dividends`, ar: `${v.toFixed(0)} سنوات فقط من التوزيعات` }, detail: { en: "Limited dividend history. Too early to rely on consistency.", ar: "تاريخ توزيعات محدود. من المبكر الاعتماد على الاستمرارية." }, watch: { en: "Whether dividends become a regular pattern", ar: "ما إذا كانت التوزيعات ستصبح نمطًا منتظمًا" } };
    return { signal: "weak", badge: { en: "New", ar: "جديد" }, oneLiner: { en: "Recently started paying dividends", ar: "بدأ مؤخرًا في توزيع الأرباح" }, detail: { en: "Very short dividend history — no established track record yet.", ar: "تاريخ قصير جدًا — لا يوجد سجل راسخ بعد." }, watch: { en: "Management intent to maintain dividends", ar: "نوايا الإدارة للحفاظ على التوزيعات" } };
  },

  dividend_cagr_3y: (ctx) => {
    const v = ctx.n("dividend_cagr_3y");
    if (!ok(v) || ctx.isNonDividendPayer) return null;
    if (v > 0.08) return { signal: "strong", badge: { en: "Growing Fast", ar: "نمو سريع" }, oneLiner: { en: `Dividends growing ${fmtPct(v)}/year`, ar: `التوزيعات تنمو ${fmtPct(v)} سنويًا` }, detail: { en: "Strong dividend growth suggests increasing shareholder returns.", ar: "نمو قوي في التوزيعات يشير إلى زيادة عوائد المساهمين." }, watch: { en: "Payout sustainability at higher levels", ar: "استدامة التوزيع عند مستويات أعلى" } };
    if (v > 0) return { signal: "improving", badge: { en: "Growing", ar: "نمو" }, oneLiner: { en: `Dividends increasing at ${fmtPct(v)}/year`, ar: `التوزيعات تزداد بمعدل ${fmtPct(v)} سنويًا` }, detail: { en: "Modest but positive dividend growth.", ar: "نمو متواضع لكن إيجابي في التوزيعات." }, watch: { en: "Earnings support for continued growth", ar: "دعم الأرباح لاستمرار النمو" } };
    return { signal: "slowing", badge: { en: "Shrinking", ar: "تراجع" }, oneLiner: { en: `Dividends have been declining (${fmtPct(v)}/yr)`, ar: `التوزيعات في تراجع (${fmtPct(v)} سنويًا)` }, detail: { en: "Declining dividends is a warning signal for income investors.", ar: "تراجع التوزيعات علامة تحذيرية لمستثمري الدخل." }, watch: { en: "Underlying earnings and payout policy", ar: "الأرباح الأساسية وسياسة التوزيع" } };
  },

  // ══════════════════════════════════════════════════════════════
  // SAFETY
  // ══════════════════════════════════════════════════════════════
  debt_to_equity: (ctx) => {
    const v = ctx.n("debt_to_equity");
    if (!ok(v)) return null;
    if (ctx.isBankSector) return { signal: "neutral", badge: { en: "Bank", ar: "بنك" }, oneLiner: { en: "D/E not directly comparable for banks", ar: "نسبة الدين غير قابلة للمقارنة المباشرة للبنوك" }, detail: { en: "Banks operate with inherently high leverage. Use capital adequacy ratios instead.", ar: "البنوك تعمل برافعة مالية مرتفعة بطبيعتها. استخدم نسب كفاية رأس المال بدلاً من ذلك." }, watch: { en: "Capital adequacy and NPL ratios", ar: "نسب كفاية رأس المال والقروض المتعثرة" } };
    if (v < 0.3) return { signal: "strong", badge: { en: "Very Low Debt", ar: "ديون منخفضة جدًا" }, oneLiner: { en: `Minimal leverage at ${fmtRatio(v)} D/E`, ar: `رافعة مالية ضئيلة عند ${fmtRatio(v)}` }, detail: { en: "Very low debt gives the company maximum financial flexibility.", ar: "ديون منخفضة جدًا تمنح الشركة أقصى مرونة مالية." }, watch: { en: "Whether low debt is a choice or reflects limited access to credit", ar: "ما إذا كان انخفاض الدين خيارًا أم يعكس محدودية الحصول على تمويل" } };
    if (v < 1.0) return { signal: "healthy", badge: { en: "Manageable", ar: "مقبول" }, oneLiner: { en: `Conservative leverage at ${fmtRatio(v)} D/E`, ar: `رافعة مالية محافظة عند ${fmtRatio(v)}` }, detail: { en: "Debt is within comfortable range. The company can likely service obligations.", ar: "الديون ضمن النطاق المريح. الشركة قادرة على خدمة التزاماتها غالبًا." }, watch: { en: "Interest rate sensitivity", ar: "الحساسية لأسعار الفائدة" } };
    if (v < 2.0) return { signal: "pressured", badge: { en: "Elevated", ar: "مرتفع" }, oneLiner: { en: `Elevated leverage at ${fmtRatio(v)} D/E`, ar: `رافعة مالية مرتفعة عند ${fmtRatio(v)}` }, detail: { en: "Debt is above average, which may increase financial risk.", ar: "الديون أعلى من المتوسط، مما قد يزيد المخاطر المالية." }, watch: { en: "Debt repayment schedule and cash flow coverage", ar: "جدول سداد الديون وتغطية التدفقات النقدية" } };
    return { signal: "risk", badge: { en: "High Debt", ar: "ديون عالية" }, oneLiner: { en: `High leverage at ${fmtRatio(v)} D/E`, ar: `رافعة مالية عالية عند ${fmtRatio(v)}` }, detail: { en: "Significant debt load that could pressure the company in a downturn.", ar: "عبء ديون كبير قد يضغط على الشركة في فترات التراجع." }, watch: { en: "Refinancing risk and covenant compliance", ar: "مخاطر إعادة التمويل والالتزام بشروط الديون" } };
  },

  current_ratio: (ctx) => {
    const v = ctx.n("current_ratio");
    if (!ok(v)) return null;
    if (ctx.isBankSector) return { signal: "neutral", badge: { en: "N/A", ar: "غير متاح" }, oneLiner: { en: "Not applicable to banks", ar: "لا ينطبق على البنوك" }, detail: { en: "Current ratio is not meaningful for banks.", ar: "النسبة الجارية لا معنى لها للبنوك." }, watch: { en: "Focus on bank-specific liquidity measures", ar: "ركّز على مقاييس السيولة الخاصة بالبنوك" } };
    if (v > 2.0) return { signal: "strong", badge: { en: "Very Liquid", ar: "سيولة عالية" }, oneLiner: { en: `Strong liquidity at ${fmtRatio(v)}x current ratio`, ar: `سيولة قوية عند ${fmtRatio(v)} ضعف` }, detail: { en: "The company has more than enough short-term assets to cover its obligations.", ar: "الشركة لديها أصول متداولة أكثر من كافية لتغطية التزاماتها." }, watch: { en: "Very high ratios can mean idle cash", ar: "النسب العالية جدًا قد تعني نقدًا خاملاً" } };
    if (v > 1.2) return { signal: "healthy", badge: { en: "Adequate", ar: "كافية" }, oneLiner: { en: `Healthy liquidity at ${fmtRatio(v)}x`, ar: `سيولة صحية عند ${fmtRatio(v)} ضعف` }, detail: { en: "Adequate short-term coverage with a comfortable margin.", ar: "تغطية كافية على المدى القصير مع هامش مريح." }, watch: { en: "Seasonal working capital swings", ar: "التقلبات الموسمية في رأس المال العامل" } };
    if (v > 1.0) return { signal: "pressured", badge: { en: "Tight", ar: "ضيقة" }, oneLiner: { en: `Tight liquidity at ${fmtRatio(v)}x`, ar: `سيولة ضيقة عند ${fmtRatio(v)} ضعف` }, detail: { en: "Just above breakeven for short-term obligations. Any disruption could be challenging.", ar: "فوق نقطة التعادل بقليل للالتزامات قصيرة الأجل. أي اضطراب قد يشكل تحديًا." }, watch: { en: "Cash flow timing and payables management", ar: "توقيت التدفقات النقدية وإدارة المستحقات" } };
    return { signal: "risk", badge: { en: "Liquidity Risk", ar: "خطر سيولة" }, oneLiner: { en: `Below 1.0 current ratio (${fmtRatio(v)})`, ar: `النسبة الجارية أقل من 1.0 (${fmtRatio(v)})` }, detail: { en: "Short-term liabilities exceed short-term assets. Possible liquidity stress.", ar: "الالتزامات قصيرة الأجل تتجاوز الأصول المتداولة. ضغط سيولة محتمل." }, watch: { en: "Credit facilities and refinancing options", ar: "التسهيلات الائتمانية وخيارات إعادة التمويل" } };
  },

  interest_coverage: (ctx) => {
    const v = ctx.n("interest_coverage");
    if (!ok(v)) return null;
    if (v > 8) return { signal: "strong", badge: { en: "Very Strong", ar: "قوي جدًا" }, oneLiner: { en: `Easily covers interest (${fmtX(v)} coverage)`, ar: `يغطي الفوائد بسهولة (${fmtX(v)} ضعف)` }, detail: { en: "The company can comfortably pay its interest obligations many times over.", ar: "الشركة تستطيع تغطية فوائدها بسهولة عدة مرات." }, watch: { en: "Stability of operating income", ar: "استقرار الأرباح التشغيلية" } };
    if (v > 3) return { signal: "healthy", badge: { en: "Adequate", ar: "كافٍ" }, oneLiner: { en: `Reasonable interest coverage at ${fmtX(v)}`, ar: `تغطية فوائد معقولة عند ${fmtX(v)}` }, detail: { en: "Operating profits comfortably cover interest expenses.", ar: "الأرباح التشغيلية تغطي مصروفات الفوائد بشكل مريح." }, watch: { en: "Impact of rate increases", ar: "تأثير ارتفاع أسعار الفائدة" } };
    if (v > 1.5) return { signal: "pressured", badge: { en: "Tight", ar: "ضيقة" }, oneLiner: { en: `Thin interest coverage at ${fmtX(v)}`, ar: `تغطية فوائد ضيقة عند ${fmtX(v)}` }, detail: { en: "Interest is covered but leaves little margin for safety.", ar: "الفوائد مغطاة لكن مع هامش أمان ضئيل." }, watch: { en: "Any decline in operating income could be problematic", ar: "أي تراجع في الأرباح التشغيلية قد يشكل مشكلة" } };
    return { signal: "risk", badge: { en: "Debt Stress", ar: "ضغط ديون" }, oneLiner: { en: `Weak interest coverage at ${fmtX(v)}`, ar: `تغطية فوائد ضعيفة عند ${fmtX(v)}` }, detail: { en: "The company is struggling to cover interest payments from operating profits.", ar: "الشركة تواجه صعوبة في تغطية مدفوعات الفوائد من أرباحها التشغيلية." }, watch: { en: "Debt restructuring or asset sales", ar: "إعادة هيكلة الديون أو بيع أصول" } };
  },

  ocf_to_debt: (ctx) => {
    const v = ctx.n("ocf_to_debt");
    if (!ok(v)) return null;
    if (v > 0.4) return { signal: "strong", badge: { en: "Strong Cash", ar: "تدفق قوي" }, oneLiner: { en: `Strong cash flow coverage of debt (${fmtPct(v)})`, ar: `تغطية نقدية قوية للديون (${fmtPct(v)})` }, detail: { en: "Operating cash flow covers a large portion of total debt.", ar: "التدفق النقدي التشغيلي يغطي نسبة كبيرة من إجمالي الديون." }, watch: { en: "Cash flow consistency", ar: "استمرارية التدفق النقدي" } };
    if (v > 0.15) return { signal: "healthy", badge: { en: "Adequate", ar: "كافٍ" }, oneLiner: { en: `Reasonable cash coverage at ${fmtPct(v)}`, ar: `تغطية نقدية معقولة عند ${fmtPct(v)}` }, detail: { en: "Cash flow provides reasonable support for the debt load.", ar: "التدفق النقدي يوفر دعمًا معقولاً لعبء الديون." }, watch: { en: "Working capital and capex demands", ar: "متطلبات رأس المال العامل والإنفاق الرأسمالي" } };
    return { signal: "pressured", badge: { en: "Weak Coverage", ar: "تغطية ضعيفة" }, oneLiner: { en: `Low cash coverage of debt (${fmtPct(v)})`, ar: `تغطية نقدية منخفضة للديون (${fmtPct(v)})` }, detail: { en: "Cash flow does not strongly support the debt burden.", ar: "التدفق النقدي لا يدعم عبء الديون بشكل قوي." }, watch: { en: "Ability to refinance or generate more cash", ar: "القدرة على إعادة التمويل أو توليد المزيد من النقد" } };
  },

  // ══════════════════════════════════════════════════════════════
  // MOMENTUM
  // ══════════════════════════════════════════════════════════════
  return_1m: (ctx) => {
    const v = ctx.n("return_1m");
    if (!ok(v)) return null;
    if (v > 0.08) return { signal: "strong", badge: { en: "Hot", ar: "ساخن" }, oneLiner: { en: `Strong 1-month gain of ${fmtPct(v)}`, ar: `ارتفاع قوي خلال شهر بنسبة ${fmtPct(v)}` }, detail: { en: "Significant short-term momentum.", ar: "زخم قوي على المدى القصير." }, watch: { en: "Overbought risk — momentum can reverse", ar: "خطر الإفراط في الشراء — الزخم قد ينعكس" } };
    if (v > 0) return { signal: "improving", badge: { en: "Positive", ar: "إيجابي" }, oneLiner: { en: `Up ${fmtPct(v)} in the past month`, ar: `ارتفع ${fmtPct(v)} خلال الشهر الماضي` }, detail: { en: "Mild positive momentum.", ar: "زخم إيجابي معتدل." }, watch: { en: "Whether trend extends to 3-month window", ar: "ما إذا كان الاتجاه يمتد لفترة 3 أشهر" } };
    if (v > -0.08) return { signal: "slowing", badge: { en: "Dipping", ar: "تراجع" }, oneLiner: { en: `Down ${fmtPct(v)} in the past month`, ar: `انخفض ${fmtPct(v)} خلال الشهر الماضي` }, detail: { en: "Some near-term price weakness.", ar: "ضعف سعري قصير المدى." }, watch: { en: "Support levels and broader market context", ar: "مستويات الدعم وسياق السوق الأوسع" } };
    return { signal: "risk", badge: { en: "Sharp Drop", ar: "هبوط حاد" }, oneLiner: { en: `Significant 1-month decline of ${fmtPct(v)}`, ar: `هبوط ملموس خلال شهر بنسبة ${fmtPct(v)}` }, detail: { en: "Sharp short-term decline — investigate the cause.", ar: "هبوط حاد قصير المدى — تحقق من الأسباب." }, watch: { en: "News catalysts and fundamental changes", ar: "المحفزات الإخبارية والتغيرات الجوهرية" } };
  },

  return_3m: (ctx) => {
    const v = ctx.n("return_3m");
    if (!ok(v)) return null;
    if (v > 0.12) return { signal: "strong", badge: { en: "Strong", ar: "قوي" }, oneLiner: { en: `Strong 3-month return of ${fmtPct(v)}`, ar: `عائد قوي لـ 3 أشهر بنسبة ${fmtPct(v)}` }, detail: { en: "Sustained positive trend.", ar: "اتجاه إيجابي مستمر." }, watch: { en: "Continuation vs. mean reversion", ar: "الاستمرار مقابل العودة للمتوسط" } };
    if (v > 0) return { signal: "improving", badge: { en: "Positive", ar: "إيجابي" }, oneLiner: { en: `Up ${fmtPct(v)} over 3 months`, ar: `ارتفع ${fmtPct(v)} خلال 3 أشهر` }, detail: { en: "Moderate positive momentum over a meaningful timeframe.", ar: "زخم إيجابي معتدل خلال فترة ذات معنى." }, watch: { en: "Fundamental support for the move", ar: "الدعم الأساسي لهذا التحرك" } };
    if (v > -0.12) return { signal: "slowing", badge: { en: "Weak", ar: "ضعيف" }, oneLiner: { en: `Down ${fmtPct(v)} over 3 months`, ar: `انخفض ${fmtPct(v)} خلال 3 أشهر` }, detail: { en: "3-month weakness in the stock.", ar: "ضعف في السهم خلال 3 أشهر." }, watch: { en: "Whether fundamentals support a recovery", ar: "ما إذا كانت الأساسيات تدعم التعافي" } };
    return { signal: "risk", badge: { en: "Falling", ar: "هبوط" }, oneLiner: { en: `Sharp 3-month decline of ${fmtPct(v)}`, ar: `هبوط حاد لـ 3 أشهر بنسبة ${fmtPct(v)}` }, detail: { en: "Sustained downtrend over 3 months.", ar: "اتجاه هبوطي مستمر لـ 3 أشهر." }, watch: { en: "Whether selling pressure is abating", ar: "ما إذا كان ضغط البيع يتراجع" } };
  },

  return_1y: (ctx) => {
    const v = ctx.n("return_1y");
    if (!ok(v)) return null;
    if (v > 0.25) return { signal: "strong", badge: { en: "Outperformer", ar: "متفوق" }, oneLiner: { en: `Excellent 1-year return of ${fmtPct(v)}`, ar: `عائد ممتاز لسنة بنسبة ${fmtPct(v)}` }, detail: { en: "Strong long-term performance.", ar: "أداء قوي على المدى الطويل." }, watch: { en: "Past performance doesn't guarantee future returns", ar: "الأداء السابق لا يضمن العوائد المستقبلية" } };
    if (v > 0) return { signal: "improving", badge: { en: "Positive", ar: "إيجابي" }, oneLiner: { en: `Up ${fmtPct(v)} over the past year`, ar: `ارتفع ${fmtPct(v)} خلال السنة الماضية` }, detail: { en: "Positive annual performance.", ar: "أداء سنوي إيجابي." }, watch: { en: "Whether gains are sustainable", ar: "ما إذا كانت المكاسب مستدامة" } };
    return { signal: "slowing", badge: { en: "Underperformer", ar: "أداء ضعيف" }, oneLiner: { en: `Down ${fmtPct(v)} over the past year`, ar: `انخفض ${fmtPct(v)} خلال السنة الماضية` }, detail: { en: "Negative annual performance.", ar: "أداء سنوي سلبي." }, watch: { en: "Turnaround catalysts", ar: "محفزات التحول" } };
  },

  // ══════════════════════════════════════════════════════════════
  // SCORE
  // ══════════════════════════════════════════════════════════════
  suqai_score: (ctx) => {
    const v = ctx.n("suqai_score");
    if (!ok(v)) return null;
    if (v >= 75) return { signal: "strong", badge: { en: "Top Rated", ar: "تقييم ممتاز" }, oneLiner: { en: `SŪQAI Score ${v.toFixed(0)}/100 — strong across most dimensions`, ar: `درجة سُوقاي ${v.toFixed(0)}/100 — قوي في معظم الأبعاد` }, detail: { en: "High composite score indicating strength across value, quality, growth, dividend, safety, and momentum.", ar: "درجة مركبة مرتفعة تشير إلى قوة عبر القيمة والجودة والنمو والتوزيعات والسلامة والزخم." }, watch: { en: "The score is a guide, not a recommendation — review individual metrics", ar: "الدرجة مرشد وليست توصية — راجع المؤشرات الفردية" } };
    if (v >= 55) return { signal: "balanced", badge: { en: "Above Average", ar: "فوق المتوسط" }, oneLiner: { en: `SŪQAI Score ${v.toFixed(0)}/100 — above average fundamentals`, ar: `درجة سُوقاي ${v.toFixed(0)}/100 — أساسيات فوق المتوسط` }, detail: { en: "The stock scores well but has areas that could be stronger.", ar: "السهم يحقق درجة جيدة لكن لديه جوانب يمكن أن تكون أقوى." }, watch: { en: "Which dimension scores are weakest", ar: "أي الأبعاد أضعف درجة" } };
    if (v >= 35) return { signal: "mixed", badge: { en: "Mixed", ar: "مختلط" }, oneLiner: { en: `SŪQAI Score ${v.toFixed(0)}/100 — mixed signals`, ar: `درجة سُوقاي ${v.toFixed(0)}/100 — إشارات مختلطة` }, detail: { en: "The stock has both strengths and weaknesses. Look at individual dimensions.", ar: "السهم لديه نقاط قوة وضعف. انظر إلى الأبعاد الفردية." }, watch: { en: "Specific dimensions dragging the score down", ar: "الأبعاد المحددة التي تسحب الدرجة للأسفل" } };
    return { signal: "weak", badge: { en: "Below Average", ar: "أقل من المتوسط" }, oneLiner: { en: `SŪQAI Score ${v.toFixed(0)}/100 — below average`, ar: `درجة سُوقاي ${v.toFixed(0)}/100 — أقل من المتوسط` }, detail: { en: "Low composite score. The stock underperforms on multiple fundamental dimensions.", ar: "درجة مركبة منخفضة. السهم يتخلف في عدة أبعاد أساسية." }, watch: { en: "Whether any catalyst could improve fundamentals", ar: "ما إذا كان هناك محفز يمكن أن يحسن الأساسيات" } };
  },
};

// ─── Batch interpretation ───────────────────────────────────────────────────

/** Interpret all metrics at once, keyed by metric name */
export function interpretAllMetrics(
  ctx: MetricContext,
): Record<string, MetricInterpretation> {
  const result: Record<string, MetricInterpretation> = {};
  for (const key of Object.keys(interpreters)) {
    const interp = interpreters[key](ctx);
    if (interp) result[key] = interp;
  }
  return result;
}

// ─── Signal → badge color mapping ───────────────────────────────────────────

export function judgmentBadgeColor(signal: JudgmentSignal): string {
  switch (signal) {
    case "attractive": return "#22c55e";
    case "strong": return "#22c55e";
    case "healthy": return "#4ade80";
    case "improving": return "#4ade80";
    case "balanced": return "#d4a574";
    case "neutral": return "#9ca3af";
    case "mixed": return "#f59e0b";
    case "premium": return "#f59e0b";
    case "pressured": return "#f97316";
    case "stretched": return "#f97316";
    case "slowing": return "#f97316";
    case "weak": return "#ef4444";
    case "risk": return "#ef4444";
  }
}

export function judgmentBadgeBg(signal: JudgmentSignal): string {
  switch (signal) {
    case "attractive": return "rgba(34,197,94,0.12)";
    case "strong": return "rgba(34,197,94,0.12)";
    case "healthy": return "rgba(74,222,128,0.10)";
    case "improving": return "rgba(74,222,128,0.10)";
    case "balanced": return "rgba(212,165,116,0.08)";
    case "neutral": return "rgba(156,163,175,0.08)";
    case "mixed": return "rgba(245,158,11,0.10)";
    case "premium": return "rgba(245,158,11,0.10)";
    case "pressured": return "rgba(249,115,22,0.10)";
    case "stretched": return "rgba(249,115,22,0.10)";
    case "slowing": return "rgba(249,115,22,0.10)";
    case "weak": return "rgba(239,68,68,0.10)";
    case "risk": return "rgba(239,68,68,0.10)";
  }
}
