/**
 * SŪQAI Metric Glossary — Bilingual (EN/AR)
 *
 * Each metric entry contains:
 *   - what:  one-sentence definition
 *   - why:   why investors care
 *   - how:   how to read it (higher/lower/context)
 *   - watch: limitations & edge cases
 *
 * Dynamic interpretation is handled separately via the interpretation engine.
 */

export interface MetricGlossaryEntry {
  key: string;
  en: { what: string; why: string; how: string; watch: string };
  ar: { what: string; why: string; how: string; watch: string };
  /** Category for grouping in section explainers */
  category: "valuation" | "quality" | "growth" | "dividend" | "safety" | "momentum" | "score";
}

// ─── Full Glossary ──────────────────────────────────────────────────────────

export const metricGlossary: Record<string, MetricGlossaryEntry> = {
  // ══════════════════════════════════════════════════════════════
  // VALUATION
  // ══════════════════════════════════════════════════════════════
  pe_ratio: {
    key: "pe_ratio",
    category: "valuation",
    en: {
      what: "P/E compares the stock price to the company's earnings per share.",
      why: "It helps investors judge whether a stock looks cheap or expensive relative to its earnings.",
      how: "A lower P/E can suggest a cheaper stock, while a higher P/E can suggest stronger growth expectations. Compare within the same sector.",
      watch: "If earnings are negative, P/E is not meaningful.",
    },
    ar: {
      what: "مكرر الأرباح يقارن سعر السهم بربحية السهم.",
      why: "يساعد المستثمر على معرفة ما إذا كان السهم يبدو رخيصًا أو مرتفع التقييم مقارنة بأرباحه.",
      how: "انخفاض مكرر الأرباح قد يعني أن السهم أرخص، وارتفاعه قد يعني أن السوق يتوقع نموًا أعلى. ويجب مقارنته بشركات القطاع نفسه.",
      watch: "إذا كانت أرباح الشركة سلبية، فلا يكون مكرر الأرباح ذا معنى.",
    },
  },

  pb_ratio: {
    key: "pb_ratio",
    category: "valuation",
    en: {
      what: "P/B compares the stock price to the company's book value.",
      why: "It helps investors see how the market values the company relative to its net assets.",
      how: "A lower P/B may suggest cheaper valuation, while a higher P/B may suggest the market expects stronger returns.",
      watch: "More useful in some sectors (banks, industrials) than others.",
    },
    ar: {
      what: "مكرر القيمة الدفترية يقارن سعر السهم بالقيمة الدفترية للشركة.",
      why: "يساعد على فهم كيف يقيّم السوق الشركة مقارنة بصافي أصولها.",
      how: "انخفاضه قد يشير إلى تقييم أقل، وارتفاعه قد يعكس توقعات أعلى من السوق.",
      watch: "تكون فائدته أكبر في بعض القطاعات (البنوك، الصناعة) أكثر من غيرها.",
    },
  },

  ps_ratio: {
    key: "ps_ratio",
    category: "valuation",
    en: {
      what: "P/S compares the company's market value to its revenue.",
      why: "It helps evaluate valuation when earnings are weak or unstable.",
      how: "A lower ratio can suggest a cheaper stock relative to sales, but sales alone do not guarantee profit.",
      watch: "High revenue is not enough if profit margins are weak.",
    },
    ar: {
      what: "مكرر المبيعات يقارن القيمة السوقية للشركة بإيراداتها.",
      why: "يساعد في تقييم السهم خاصة عندما تكون الأرباح ضعيفة أو غير مستقرة.",
      how: "انخفاضه قد يشير إلى تقييم أقل مقارنة بالمبيعات، لكن المبيعات وحدها لا تعني أن الشركة مربحة.",
      watch: "ارتفاع الإيرادات لا يكفي إذا كانت هوامش الربح ضعيفة.",
    },
  },

  ev_ebitda: {
    key: "ev_ebitda",
    category: "valuation",
    en: {
      what: "This compares the company's total value to its operating earnings before some accounting items.",
      why: "It is often used to compare companies with different debt levels.",
      how: "A lower ratio can suggest cheaper valuation, but compare with sector peers.",
      watch: "Less useful when EBITDA is negative or for some financial companies.",
    },
    ar: {
      what: "يقارن هذا المؤشر القيمة الإجمالية للشركة بأرباحها التشغيلية قبل بعض البنود المحاسبية.",
      why: "يُستخدم كثيرًا لمقارنة الشركات التي تختلف في مستويات الديون.",
      how: "انخفاضه قد يشير إلى تقييم أقل، لكن الأفضل مقارنته بشركات القطاع نفسه.",
      watch: "تقل فائدته إذا كانت الأرباح التشغيلية سالبة أو في بعض الشركات المالية.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // QUALITY
  // ══════════════════════════════════════════════════════════════
  roe: {
    key: "roe",
    category: "quality",
    en: {
      what: "ROE shows how efficiently the company turns shareholders' equity into profit.",
      why: "It is a key measure of profitability and business quality.",
      how: "Higher is often better, especially if consistent and not driven by excessive debt.",
      watch: "A very high ROE can sometimes be distorted by weak equity.",
    },
    ar: {
      what: "العائد على حقوق المساهمين يوضح مدى كفاءة الشركة في تحويل حقوق المساهمين إلى أرباح.",
      why: "يعد من أهم مؤشرات الربحية وجودة الأعمال.",
      how: "كلما كان أعلى كان ذلك أفضل غالبًا، خاصة إذا كان مستقرًا وليس ناتجًا عن ديون مرتفعة.",
      watch: "قد يبدو مرتفعًا بشكل مضلل إذا كانت حقوق الملكية منخفضة جدًا.",
    },
  },

  roa: {
    key: "roa",
    category: "quality",
    en: {
      what: "ROA shows how efficiently the company uses its assets to generate profit.",
      why: "It helps investors judge how productive the company's asset base is.",
      how: "Higher is usually better.",
      watch: "Compare within the same sector — asset-heavy industries naturally have lower ROA.",
    },
    ar: {
      what: "العائد على الأصول يوضح مدى كفاءة الشركة في استخدام أصولها لتحقيق الأرباح.",
      why: "يساعد المستثمر على معرفة مدى إنتاجية أصول الشركة.",
      how: "ارتفاعه يكون أفضل في العادة.",
      watch: "الأفضل مقارنته بشركات القطاع نفسه — الصناعات كثيفة الأصول يكون عائدها أقل طبيعيًا.",
    },
  },

  roce: {
    key: "roce",
    category: "quality",
    en: {
      what: "ROCE measures how efficiently the company uses its capital to generate operating profit.",
      why: "It shows how strong the company is at producing returns from the money invested in the business.",
      how: "Higher is generally better.",
      watch: "Best used together with other profitability metrics.",
    },
    ar: {
      what: "العائد على رأس المال المستخدم يقيس كفاءة الشركة في استخدام رأس المال لتحقيق أرباح تشغيلية.",
      why: "يساعد على معرفة قدرة الشركة على توليد عوائد من الأموال المستثمرة في النشاط.",
      how: "كلما كان أعلى كان ذلك أفضل غالبًا.",
      watch: "من الأفضل قراءته مع مؤشرات ربحية أخرى.",
    },
  },

  net_margin: {
    key: "net_margin",
    category: "quality",
    en: {
      what: "Net margin shows how much profit the company keeps from each unit of revenue after all expenses.",
      why: "It tells you how profitable the company really is.",
      how: "Higher margins usually mean stronger profitability.",
      watch: "Margins differ widely by sector.",
    },
    ar: {
      what: "هامش الربح الصافي يوضح مقدار الربح الذي تحتفظ به الشركة من كل وحدة إيراد بعد جميع المصاريف.",
      why: "يعطيك صورة أوضح عن الربحية الفعلية للشركة.",
      how: "ارتفاع الهامش يعني عادة ربحية أقوى.",
      watch: "تختلف الهوامش بشكل كبير بين القطاعات.",
    },
  },

  operating_margin: {
    key: "operating_margin",
    category: "quality",
    en: {
      what: "Operating margin shows how profitable the company's main business is before non-operating items.",
      why: "It helps investors judge the strength of the core business.",
      how: "Higher is usually better.",
      watch: "One-time events can affect the number.",
    },
    ar: {
      what: "هامش الربح التشغيلي يوضح ربحية نشاط الشركة الأساسي قبل البنود غير التشغيلية.",
      why: "يساعد المستثمر على تقييم قوة النشاط الرئيسي للشركة.",
      how: "ارتفاعه يكون أفضل غالبًا.",
      watch: "قد تتأثر النسبة أحيانًا بعوامل أو بنود غير متكررة.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROWTH
  // ══════════════════════════════════════════════════════════════
  revenue_growth_yoy: {
    key: "revenue_growth_yoy",
    category: "growth",
    en: {
      what: "This shows how much the company's revenue changed compared with the same period last year.",
      why: "It helps investors see whether the business is expanding.",
      how: "Positive growth usually suggests expansion, while falling revenue can signal pressure.",
      watch: "Growth should be read together with profitability.",
    },
    ar: {
      what: "يوضح هذا المؤشر مدى تغير إيرادات الشركة مقارنة بالفترة نفسها من العام الماضي.",
      why: "يساعد على معرفة ما إذا كان نشاط الشركة يتوسع أم لا.",
      how: "النمو الإيجابي يشير عادة إلى توسع، بينما تراجع الإيرادات قد يكون علامة ضغط على النشاط.",
      watch: "يجب قراءة النمو مع الربحية، وليس بمفرده.",
    },
  },

  earnings_growth_yoy: {
    key: "earnings_growth_yoy",
    category: "growth",
    en: {
      what: "This shows how much net income changed compared with last year.",
      why: "It tells you whether profits are improving or weakening.",
      how: "Higher growth is generally better, but volatile profits need caution.",
      watch: "A company can grow earnings for temporary reasons.",
    },
    ar: {
      what: "يوضح هذا المؤشر مدى تغير صافي الربح مقارنة بالعام الماضي.",
      why: "يعطي إشارة إلى ما إذا كانت الأرباح تتحسن أو تضعف.",
      how: "ارتفاع النمو يكون أفضل غالبًا، لكن الأرباح المتذبذبة تحتاج إلى حذر.",
      watch: "قد ترتفع الأرباح أحيانًا لأسباب مؤقتة وليست دائمة.",
    },
  },

  eps_growth_yoy: {
    key: "eps_growth_yoy",
    category: "growth",
    en: {
      what: "This shows how much earnings per share changed versus last year.",
      why: "It reflects profit growth from the shareholder's point of view.",
      how: "Higher growth is generally positive.",
      watch: "EPS can be affected by changes in share count.",
    },
    ar: {
      what: "يوضح هذا المؤشر مدى تغير ربحية السهم مقارنة بالعام الماضي.",
      why: "يعكس نمو الأرباح من زاوية المساهم.",
      how: "ارتفاعه يعد إيجابيًا في العادة.",
      watch: "قد تتأثر ربحية السهم بتغير عدد الأسهم القائمة.",
    },
  },

  revenue_cagr_3y: {
    key: "revenue_cagr_3y",
    category: "growth",
    en: {
      what: "This shows the average annual revenue growth rate over the past three years.",
      why: "It smooths out short-term swings to show the underlying growth trend.",
      how: "A positive CAGR suggests sustained revenue expansion.",
      watch: "A strong three-year trend does not guarantee future growth.",
    },
    ar: {
      what: "يوضح هذا المؤشر متوسط معدل نمو الإيرادات السنوي خلال آخر ثلاث سنوات.",
      why: "يُنعّم التقلبات قصيرة المدى ليعكس اتجاه النمو الأساسي.",
      how: "المعدل الإيجابي يشير إلى توسع مستدام في الإيرادات.",
      watch: "الأداء القوي خلال ثلاث سنوات لا يضمن استمرار النمو مستقبلًا.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // DIVIDEND
  // ══════════════════════════════════════════════════════════════
  dividend_yield: {
    key: "dividend_yield",
    category: "dividend",
    en: {
      what: "Dividend yield shows how much cash dividend the stock pays relative to its price.",
      why: "It helps income-focused investors compare dividend returns.",
      how: "A higher yield can be attractive, but it is not always safer.",
      watch: "A very high yield can sometimes reflect a falling stock price or an unsustainable payout.",
    },
    ar: {
      what: "عائد التوزيعات يوضح مقدار التوزيعات النقدية مقارنة بسعر السهم.",
      why: "يساعد المستثمر الباحث عن الدخل على مقارنة العائد من التوزيعات بين الأسهم.",
      how: "ارتفاعه قد يكون جذابًا، لكنه لا يعني دائمًا أن السهم أفضل أو أكثر أمانًا.",
      watch: "العائد المرتفع جدًا قد يكون بسبب هبوط سعر السهم أو بسبب توزيعات قد لا تكون مستدامة.",
    },
  },

  payout_ratio: {
    key: "payout_ratio",
    category: "dividend",
    en: {
      what: "Payout ratio shows how much of the company's earnings are paid out as dividends.",
      why: "It helps investors judge whether the dividend looks sustainable.",
      how: "A moderate payout is often healthier than an extremely high one.",
      watch: "A very high payout can mean limited room to grow or protect future dividends.",
    },
    ar: {
      what: "نسبة توزيع الأرباح توضح مقدار ما تدفعه الشركة من أرباحها على شكل توزيعات نقدية.",
      why: "تساعد على تقييم ما إذا كانت التوزيعات تبدو قابلة للاستمرار.",
      how: "النسبة المعتدلة تكون غالبًا أكثر صحة من النسبة المرتفعة جدًا.",
      watch: "الارتفاع الكبير قد يعني أن الشركة تملك مساحة أقل للنمو أو للحفاظ على التوزيعات مستقبلًا.",
    },
  },

  dividend_cagr_3y: {
    key: "dividend_cagr_3y",
    category: "dividend",
    en: {
      what: "This shows the average annual dividend growth rate over the past three years.",
      why: "It helps judge if the company is increasing its payouts over time.",
      how: "A positive growth rate suggests improving shareholder returns.",
      watch: "Past dividend growth does not guarantee future increases.",
    },
    ar: {
      what: "يوضح معدل نمو التوزيعات السنوي خلال آخر ثلاث سنوات.",
      why: "يساعد على معرفة ما إذا كانت الشركة تزيد توزيعاتها مع مرور الوقت.",
      how: "المعدل الإيجابي يشير إلى تحسن العائد للمساهمين.",
      watch: "نمو التوزيعات في الماضي لا يضمن استمراره مستقبلًا.",
    },
  },

  years_of_dividends: {
    key: "years_of_dividends",
    category: "dividend",
    en: {
      what: "This shows how many years the company has paid dividends.",
      why: "It gives a simple view of dividend consistency.",
      how: "A longer history can suggest a more established dividend profile.",
      watch: "A long history does not guarantee future payments.",
    },
    ar: {
      what: "يوضح هذا المؤشر عدد السنوات التي قامت فيها الشركة بتوزيع أرباح.",
      why: "يعطي صورة سريعة عن استمرارية التوزيعات عبر الوقت.",
      how: "كلما كانت المدة أطول، دل ذلك غالبًا على سياسة توزيعات أكثر استقرارًا.",
      watch: "الاستمرار في الماضي لا يضمن استمرار التوزيعات في المستقبل.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // SAFETY
  // ══════════════════════════════════════════════════════════════
  debt_to_equity: {
    key: "debt_to_equity",
    category: "safety",
    en: {
      what: "This compares the company's debt to shareholders' equity.",
      why: "It helps investors understand how heavily the company relies on debt.",
      how: "Lower often means lower leverage, but sector context matters.",
      watch: "Some sectors normally operate with higher debt than others.",
    },
    ar: {
      what: "تقارن هذه النسبة ديون الشركة بحقوق المساهمين.",
      why: "تساعد المستثمر على فهم مدى اعتماد الشركة على التمويل بالدين.",
      how: "انخفاضها يعني عادة مديونية أقل، لكن المقارنة يجب أن تكون داخل القطاع نفسه.",
      watch: "بعض القطاعات تعمل عادة بمستويات ديون أعلى من غيرها.",
    },
  },

  current_ratio: {
    key: "current_ratio",
    category: "safety",
    en: {
      what: "Current ratio compares short-term assets to short-term liabilities.",
      why: "It helps judge the company's short-term liquidity.",
      how: "A higher ratio can suggest stronger short-term financial flexibility.",
      watch: "Less meaningful for banks and some financial companies.",
    },
    ar: {
      what: "تقارن النسبة الجارية الأصول المتداولة بالالتزامات المتداولة.",
      why: "تساعد على تقييم قدرة الشركة على الوفاء بالتزاماتها قصيرة الأجل.",
      how: "ارتفاعها قد يشير إلى مرونة أفضل على المدى القصير.",
      watch: "تكون أقل فائدة للبنوك وبعض الشركات المالية.",
    },
  },

  interest_coverage: {
    key: "interest_coverage",
    category: "safety",
    en: {
      what: "This shows how easily the company can cover its interest payments from operating profit.",
      why: "It helps investors understand debt pressure.",
      how: "Higher is usually better because it means more room to service debt.",
      watch: "Low coverage can be a warning sign if debt costs rise or profits weaken.",
    },
    ar: {
      what: "توضح نسبة تغطية الفوائد مدى قدرة الشركة على تغطية مصروفات الفوائد من أرباحها التشغيلية.",
      why: "تساعد المستثمر على فهم مستوى ضغط الديون على الشركة.",
      how: "كلما كانت أعلى كان ذلك أفضل غالبًا، لأنه يعني قدرة أكبر على خدمة الدين.",
      watch: "انخفاضها قد يكون إشارة تحذير إذا ارتفعت تكلفة الدين أو تراجعت الأرباح.",
    },
  },

  net_debt_ebitda: {
    key: "net_debt_ebitda",
    category: "safety",
    en: {
      what: "This shows how many years of operating earnings it would take to pay off the company's net debt.",
      why: "It is a quick way to gauge overall debt burden.",
      how: "Lower is usually better — under 2x is often considered comfortable.",
      watch: "It depends on the industry and cash flow stability.",
    },
    ar: {
      what: "يوضح هذا المؤشر عدد سنوات الأرباح التشغيلية اللازمة لسداد صافي ديون الشركة.",
      why: "طريقة سريعة لتقييم عبء الدين الإجمالي.",
      how: "انخفاضه يكون أفضل غالبًا — أقل من 2 مرة يُعتبر عادة مريحًا.",
      watch: "يعتمد على القطاع واستقرار التدفقات النقدية.",
    },
  },

  ocf_to_debt: {
    key: "ocf_to_debt",
    category: "safety",
    en: {
      what: "This compares operating cash flow to total debt.",
      why: "It shows how much real cash generation supports the debt load.",
      how: "Higher is usually better.",
      watch: "Profit and cash flow are not always the same — this metric adds an important reality check.",
    },
    ar: {
      what: "تقارن هذه النسبة التدفق النقدي التشغيلي بإجمالي الدين.",
      why: "توضح مدى دعم التدفقات النقدية الفعلية لعبء الدين على الشركة.",
      how: "ارتفاعها يكون أفضل غالبًا.",
      watch: "الأرباح المحاسبية والتدفقات النقدية ليست الشيء نفسه، لذلك تعد هذه النسبة اختبارًا مهمًا للجودة المالية.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // MOMENTUM
  // ══════════════════════════════════════════════════════════════
  return_1m: {
    key: "return_1m",
    category: "momentum",
    en: {
      what: "This shows the stock's total return over the past month.",
      why: "It indicates short-term price momentum.",
      how: "Positive is bullish, negative is bearish — but short-term moves can reverse quickly.",
      watch: "One month can be noisy. Look at 3-month and 1-year returns for a fuller picture.",
    },
    ar: {
      what: "يوضح هذا المؤشر العائد الإجمالي للسهم خلال الشهر الماضي.",
      why: "يعطي إشارة عن زخم السعر على المدى القصير.",
      how: "العائد الإيجابي يشير إلى اتجاه صاعد، والسلبي إلى اتجاه هابط — لكن الحركات قصيرة المدى قد تنعكس بسرعة.",
      watch: "شهر واحد قد لا يكون كافيًا. انظر إلى العوائد لـ 3 أشهر وسنة للحصول على صورة أوسع.",
    },
  },

  return_3m: {
    key: "return_3m",
    category: "momentum",
    en: {
      what: "This shows the stock's total return over the past three months.",
      why: "A three-month window helps smooth out daily noise.",
      how: "Positive returns suggest a strengthening trend.",
      watch: "Even three-month trends can reverse, especially in volatile markets.",
    },
    ar: {
      what: "يوضح هذا المؤشر العائد الإجمالي للسهم خلال آخر ثلاثة أشهر.",
      why: "الفترة الأطول تساعد في تنعيم التقلبات اليومية.",
      how: "العائد الإيجابي يشير إلى اتجاه متماسك.",
      watch: "حتى الاتجاهات لثلاثة أشهر قد تنعكس، خاصة في الأسواق المتقلبة.",
    },
  },

  return_1y: {
    key: "return_1y",
    category: "momentum",
    en: {
      what: "This shows the stock's total return over the past year.",
      why: "It gives a broader view of how the stock has performed.",
      how: "Strong annual returns suggest sustained investor confidence.",
      watch: "Past performance does not predict future returns.",
    },
    ar: {
      what: "يوضح هذا المؤشر العائد الإجمالي للسهم خلال السنة الماضية.",
      why: "يعطي نظرة أوسع على أداء السهم.",
      how: "العوائد السنوية القوية تشير إلى ثقة مستمرة من المستثمرين.",
      watch: "الأداء السابق لا يتنبأ بالعوائد المستقبلية.",
    },
  },

  relative_perf_vs_tasi: {
    key: "relative_perf_vs_tasi",
    category: "momentum",
    en: {
      what: "This compares the stock's performance to the overall TASI market index.",
      why: "It shows whether the stock is outperforming or underperforming the market.",
      how: "A positive number means the stock did better than TASI; negative means it lagged.",
      watch: "Outperformance can reverse, especially in sector rotations.",
    },
    ar: {
      what: "يقارن هذا المؤشر أداء السهم بأداء مؤشر السوق العام (تاسي).",
      why: "يوضح ما إذا كان السهم يتفوق أو يتأخر عن أداء السوق.",
      how: "الرقم الموجب يعني أن السهم أفضل من تاسي، والسالب يعني أنه أقل أداءً.",
      watch: "التفوق قد ينعكس، خاصة عند تدوير القطاعات في السوق.",
    },
  },

  volatility_30d: {
    key: "volatility_30d",
    category: "momentum",
    en: {
      what: "This measures how much the stock's price has fluctuated over the past 30 days.",
      why: "It helps investors understand the risk level of the stock.",
      how: "Higher volatility means bigger price swings — more risk but also more opportunity.",
      watch: "Low volatility does not mean the stock is safe. Events can cause sudden spikes.",
    },
    ar: {
      what: "يقيس هذا المؤشر مدى تذبذب سعر السهم خلال آخر 30 يومًا.",
      why: "يساعد المستثمر على فهم مستوى مخاطر السهم.",
      how: "ارتفاع التذبذب يعني تقلبات سعرية أكبر — مخاطر أعلى لكن أيضًا فرص أكبر.",
      watch: "انخفاض التذبذب لا يعني أن السهم آمن. الأحداث المفاجئة قد تسبب قفزات كبيرة.",
    },
  },

  // ══════════════════════════════════════════════════════════════
  // SCORE
  // ══════════════════════════════════════════════════════════════
  suqai_score: {
    key: "suqai_score",
    category: "score",
    en: {
      what: "SŪQAI Score is a combined rating that summarizes value, quality, growth, dividend, safety, and momentum.",
      why: "It helps investors quickly compare companies in one simple view.",
      how: "A higher score is generally better, but it should support research, not replace it.",
      watch: "The score is a guide, not a guarantee. Always review the underlying metrics too.",
    },
    ar: {
      what: "درجة سُوقاي هي تقييم مركب يجمع بين القيمة والربحية والنمو والتوزيعات والسلامة المالية والزخم.",
      why: "تساعد المستثمر على مقارنة الشركات بسرعة من خلال نظرة موحدة ومبسطة.",
      how: "كلما كانت الدرجة أعلى كان ذلك أفضل غالبًا، لكنها أداة مساعدة وليست بديلًا عن التحليل.",
      watch: "الدرجة ليست ضمانًا. من الأفضل دائمًا مراجعة المؤشرات الأساسية التي تقف خلفها.",
    },
  },
};

// ─── Section Explainers ─────────────────────────────────────────────────────

export interface SectionExplainer {
  en: string;
  ar: string;
}

export const sectionExplainers: Record<string, SectionExplainer> = {
  valuation: {
    en: "These metrics help you understand whether the stock price looks cheap, fair, or expensive compared to what the company earns, owns, and sells. Lower ratios can suggest cheaper valuation, but always compare within the same sector.",
    ar: "تساعدك هذه المؤشرات على فهم ما إذا كان سعر السهم يبدو رخيصًا أو عادلًا أو مرتفعًا مقارنة بأرباح الشركة وأصولها ومبيعاتها. النسب المنخفضة قد تشير إلى تقييم أقل، لكن يجب دائمًا المقارنة داخل القطاع نفسه.",
  },
  quality: {
    en: "These metrics measure the company's profitability and efficiency. Strong margins and high returns on equity or assets usually indicate a well-managed, high-quality business.",
    ar: "تقيس هذه المؤشرات ربحية الشركة وكفاءتها. الهوامش القوية والعوائد المرتفعة على حقوق الملكية أو الأصول تشير عادة إلى شركة ذات إدارة جيدة وجودة عالية.",
  },
  growth: {
    en: "These metrics show whether the business is expanding. Look at revenue, earnings, and EPS growth together to understand the full picture.",
    ar: "توضح هذه المؤشرات ما إذا كان نشاط الشركة يتوسع. انظر إلى نمو الإيرادات والأرباح وربحية السهم معًا لفهم الصورة الكاملة.",
  },
  dividend: {
    en: "These metrics help you evaluate the company's dividend payments — how much it pays, how sustainable those payments look, and how they have grown over time.",
    ar: "تساعدك هذه المؤشرات على تقييم توزيعات الشركة — كم تدفع، ومدى استدامة هذه التوزيعات، وكيف نمت عبر الوقت.",
  },
  safety: {
    en: "These metrics assess the company's financial health and debt levels. A strong balance sheet provides protection during downturns.",
    ar: "تقيّم هذه المؤشرات صحة الشركة المالية ومستوى ديونها. الميزانية القوية توفر حماية في فترات التراجع.",
  },
  momentum: {
    en: "These metrics track the stock's recent price performance and volatility. They help you see whether the trend is strengthening or weakening.",
    ar: "تتبع هذه المؤشرات أداء السهم السعري الأخير وتذبذبه. تساعدك على رؤية ما إذا كان الاتجاه يتقوى أو يضعف.",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get a glossary entry by metric key */
export function getGlossary(metricKey: string): MetricGlossaryEntry | null {
  return metricGlossary[metricKey] ?? null;
}

/** Get section explainer text */
export function getSectionExplainer(section: string, locale: string): string | null {
  const entry = sectionExplainers[section];
  if (!entry) return null;
  return locale === "ar" ? entry.ar : entry.en;
}
