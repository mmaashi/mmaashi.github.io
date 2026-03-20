import { createServiceClient } from '@/lib/supabase/server';
import { getMarketSummary } from '@/lib/data-sources';
import { t } from '@/lib/i18n';

interface FearGreedData {
  index: number;
  momentum: number;
  breadth: number;
  highsLows: number;
  volatility: number;
  safeHaven: number;
  timestamp: string;
}

interface ComponentScore {
  name: string;
  value: number;
}

async function calculateFearGreedIndex(): Promise<FearGreedData> {
  const supabase = await createServiceClient();

  // Fetch all companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, ticker, sector');

  if (!companies || companies.length === 0) {
    return {
      index: 50,
      momentum: 50,
      breadth: 50,
      highsLows: 50,
      volatility: 50,
      safeHaven: 50,
      timestamp: new Date().toISOString(),
    };
  }

  const companyIds = companies.map(c => c.id);

  // ─────────────────────────────────────────────────────────
  // 1. TASI MOMENTUM (current vs 125-day MA)
  // ─────────────────────────────────────────────────────────
  const { data: allPrices } = await supabase
    .from('stock_prices')
    .select('company_id, close, date')
    .in('company_id', companyIds)
    .order('date', { ascending: false })
    .limit(250 * companyIds.length); // Fetch ~250 days per stock

  let momentum = 50;
  if (allPrices && allPrices.length > 0) {
    // Group prices by company and date
    const pricesByDate = new Map<string, number[]>();
    const datesSeen = new Set<string>();

    for (const price of allPrices) {
      datesSeen.add(price.date);
      if (!pricesByDate.has(price.date)) {
        pricesByDate.set(price.date, []);
      }
      pricesByDate.get(price.date)!.push(Number(price.close));
    }

    // Sort dates descending
    const sortedDates = Array.from(datesSeen).sort().reverse().slice(0, 200);

    if (sortedDates.length >= 125) {
      // Calculate TASI-like index for each date (average of all prices)
      const tasiValues = sortedDates.map(date => {
        const prices = pricesByDate.get(date) || [];
        return prices.length > 0
          ? prices.reduce((a, b) => a + b, 0) / prices.length
          : 0;
      });

      const currentValue = tasiValues[0];
      const ma125 = tasiValues.slice(0, 125).reduce((a, b) => a + b, 0) / 125;

      if (ma125 > 0) {
        const momentumPercent = ((currentValue - ma125) / ma125) * 100;
        // Map ±5% to 0-100 scale
        momentum = Math.max(0, Math.min(100, 50 + momentumPercent * 5));
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. MARKET BREADTH (advancing vs declining)
  // ─────────────────────────────────────────────────────────
  let breadth = 50;
  if (allPrices && allPrices.length > 0) {
    // Get latest price for each company
    const latestPrices = new Map<string, number>();
    const previousPrices = new Map<string, number>();

    // Reverse sort to process latest first
    const sortedPrices = [...allPrices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const price of sortedPrices) {
      if (!latestPrices.has(price.company_id)) {
        latestPrices.set(price.company_id, Number(price.close));
      } else if (!previousPrices.has(price.company_id)) {
        previousPrices.set(price.company_id, Number(price.close));
      }
    }

    let advancing = 0;
    let declining = 0;

    for (const [compId, latestPrice] of latestPrices) {
      const prevPrice = previousPrices.get(compId);
      if (prevPrice) {
        if (latestPrice > prevPrice) advancing++;
        else if (latestPrice < prevPrice) declining++;
      }
    }

    const total = advancing + declining;
    if (total > 0) {
      breadth = (advancing / total) * 100;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. 52-WEEK HIGHS/LOWS
  // ─────────────────────────────────────────────────────────
  let highsLows = 50;
  if (allPrices && allPrices.length > 0) {
    // Group by company and find 52-week high/low
    const companyStats = new Map<string, { high: number; low: number; current: number }>();

    for (const price of allPrices) {
      const current = Number(price.close);
      const stats = companyStats.get(price.company_id) || { high: current, low: current, current };
      companyStats.set(price.company_id, {
        high: Math.max(stats.high, current),
        low: Math.min(stats.low, current),
        current: stats.current,
      });
    }

    let at52High = 0;
    let at52Low = 0;

    for (const stats of companyStats.values()) {
      const range = stats.high - stats.low;
      const distFromLow = stats.current - stats.low;
      const percentOfRange = range > 0 ? distFromLow / range : 0.5;

      if (percentOfRange > 0.9) at52High++;
      if (percentOfRange < 0.1) at52Low++;
    }

    const total = at52High + at52Low;
    if (total > 0) {
      highsLows = (at52High / total) * 100;
    }
  }

  // ─────────────────────────────────────────────────────────
  // 4. MARKET VOLATILITY (recent 30-day standard deviation)
  // ─────────────────────────────────────────────────────────
  let volatility = 50;
  if (allPrices && allPrices.length > 0) {
    // Get last 30 days of prices
    const dates = Array.from(new Set(allPrices.map(p => p.date)))
      .sort()
      .reverse()
      .slice(0, 30);

    const returns: number[] = [];

    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = dates[i];
      const prevDate = dates[i + 1];

      const currentPrices = allPrices
        .filter(p => p.date === currentDate)
        .map(p => Number(p.close));

      const prevPrices = allPrices
        .filter(p => p.date === prevDate)
        .map(p => Number(p.close));

      if (currentPrices.length > 0 && prevPrices.length > 0) {
        const avgCurrent = currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
        const avgPrev = prevPrices.reduce((a, b) => a + b, 0) / prevPrices.length;

        if (avgPrev > 0) {
          returns.push((avgCurrent - avgPrev) / avgPrev);
        }
      }
    }

    if (returns.length > 0) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance) * 100; // Convert to percentage

      // Map volatility: 0-5% is high greed (low vol), 5-15% is normal, >15% is fear (high vol)
      volatility = Math.max(0, Math.min(100, 100 - stdDev * 6));
    }
  }

  // ─────────────────────────────────────────────────────────
  // 5. SAFE HAVEN DEMAND (Banks/Utilities vs cyclicals)
  // ─────────────────────────────────────────────────────────
  let safeHaven = 50;
  if (allPrices && allPrices.length > 0) {
    const defensiveSectors = ['Banks', 'Utilities'];
    const cyclicalSectors = [
      'Energy',
      'Materials',
      'Consumer Services',
      'Retailing',
      'Transportation',
    ];

    // Get latest prices for each company
    const latestPrices = new Map<string, { price: number; sector: string }>();
    for (const price of allPrices) {
      if (!latestPrices.has(price.company_id)) {
        const company = companies.find(c => c.id === price.company_id);
        if (company) {
          latestPrices.set(price.company_id, { price: Number(price.close), sector: company.sector });
        }
      }
    }

    let defensiveValue = 0;
    let cyclicalValue = 0;

    for (const [, data] of latestPrices) {
      if (defensiveSectors.includes(data.sector)) {
        defensiveValue += data.price;
      }
      if (cyclicalSectors.includes(data.sector)) {
        cyclicalValue += data.price;
      }
    }

    const total = defensiveValue + cyclicalValue;
    if (total > 0) {
      // When defensive % is high, market is fearful
      const defensivePercent = (defensiveValue / total) * 100;
      // Map: 40% defensive = 0 (max greed), 60% defensive = 100 (max fear)
      safeHaven = Math.max(0, Math.min(100, (defensivePercent - 40) * 5));
    }
  }

  // ─────────────────────────────────────────────────────────
  // Calculate overall index (simple average of 5 components)
  // ─────────────────────────────────────────────────────────
  const index = (momentum + breadth + highsLows + volatility + safeHaven) / 5;

  return {
    index: Math.round(index),
    momentum: Math.round(momentum),
    breadth: Math.round(breadth),
    highsLows: Math.round(highsLows),
    volatility: Math.round(volatility),
    safeHaven: Math.round(safeHaven),
    timestamp: new Date().toISOString(),
  };
}

function getGaugeColor(value: number): string {
  if (value < 25) return 'rgb(246, 70, 93)'; // Red - Extreme Fear
  if (value < 45) return 'rgb(255, 171, 47)'; // Orange - Fear
  if (value < 55) return 'rgb(76, 175, 80)'; // Green - Neutral
  if (value < 75) return 'rgb(12, 203, 129)'; // Light Green - Greed
  return 'rgb(12, 203, 129)'; // Green - Extreme Greed
}

function getSentimentLabel(value: number): string {
  if (value < 25) return 'sentiment.extreme_fear';
  if (value < 45) return 'sentiment.fear';
  if (value < 55) return 'sentiment.neutral';
  if (value < 75) return 'sentiment.greed';
  return 'sentiment.extreme_greed';
}

function calculateGaugeRotation(value: number): number {
  return -90 + (value / 100) * 180;
}

export default async function SentimentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  const data = await calculateFearGreedIndex();

  const sentimentLabel = getSentimentLabel(data.index);
  const gaugeColor = getGaugeColor(data.index);
  const rotation = calculateGaugeRotation(data.index);

  const components: ComponentScore[] = [
    { name: t(locale, 'sentiment.momentum'), value: data.momentum },
    { name: t(locale, 'sentiment.breadth'), value: data.breadth },
    { name: t(locale, 'sentiment.highs_lows'), value: data.highsLows },
    { name: t(locale, 'sentiment.volatility'), value: data.volatility },
    { name: t(locale, 'sentiment.safe_haven'), value: data.safeHaven },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--c-base)',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: '3rem',
            textAlign: isAr ? 'right' : 'left',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--c-text)',
              margin: '0 0 0.5rem 0',
            }}
          >
            {t(locale, 'sentiment.title')}
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--c-muted)',
              margin: 0,
            }}
          >
            {t(locale, 'sentiment.subtitle')}
          </p>
        </div>

        {/* Main gauge section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          {/* Gauge */}
          <div
            style={{
              backgroundColor: 'var(--c-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--c-border)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 300 200" width={300} height={200} style={{ marginBottom: '1rem' }}>
              {/* Background arc */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(246, 70, 93)" />
                  <stop offset="25%" stopColor="rgb(255, 171, 47)" />
                  <stop offset="50%" stopColor="rgb(76, 175, 80)" />
                  <stop offset="75%" stopColor="rgb(12, 203, 129)" />
                  <stop offset="100%" stopColor="rgb(12, 203, 129)" />
                </linearGradient>
              </defs>

              {/* Arc background */}
              <path
                d="M 50 150 A 100 100 0 0 1 250 150"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                opacity="0.3"
              />

              {/* Arc fill */}
              <path
                d="M 50 150 A 100 100 0 0 1 250 150"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="8"
                strokeDasharray={`${(data.index / 100) * 314.16} 314.16`}
                opacity="1"
              />

              {/* Needle */}
              <g transform={`translate(150, 150) rotate(${rotation})`}>
                <line x1="0" y1="0" x2="0" y2="-90" stroke="var(--c-gold)" strokeWidth="3" />
                <circle cx="0" cy="0" r="6" fill="var(--c-gold)" />
              </g>

              {/* Labels on arc */}
              <text x="60" y="165" fontSize="10" fill="var(--c-muted)" textAnchor="middle">
                0
              </text>
              <text x="240" y="165" fontSize="10" fill="var(--c-muted)" textAnchor="middle">
                100
              </text>

              {/* Fear/Greed zones text */}
              <text x="80" y="70" fontSize="11" fill="var(--c-muted)" textAnchor="middle">
                {t(locale, 'sentiment.fear')}
              </text>
              <text x="220" y="70" fontSize="11" fill="var(--c-muted)" textAnchor="middle">
                {t(locale, 'sentiment.greed')}
              </text>
            </svg>

            {/* Index value and label */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: gaugeColor,
                  margin: '0 0 0.5rem 0',
                }}
              >
                {data.index}
              </p>
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--c-text)',
                  margin: 0,
                }}
              >
                {t(locale, sentimentLabel)}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--c-muted)',
                  margin: '0.5rem 0 0 0',
                }}
              >
                Updated: {new Date(data.timestamp).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--c-border)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'var(--c-gold)',
                  margin: '0 0 1rem 0',
                  textAlign: isAr ? 'right' : 'left',
                }}
              >
                {t(locale, 'sentiment.what_means')}
              </h3>

              {data.index < 45 && (
                <p
                  style={{
                    color: 'var(--c-text)',
                    lineHeight: '1.6',
                    margin: 0,
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  {t(locale, 'sentiment.fear_desc')}
                </p>
              )}
              {data.index >= 45 && data.index < 55 && (
                <p
                  style={{
                    color: 'var(--c-text)',
                    lineHeight: '1.6',
                    margin: 0,
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  {t(locale, 'sentiment.neutral_desc')}
                </p>
              )}
              {data.index >= 55 && (
                <p
                  style={{
                    color: 'var(--c-text)',
                    lineHeight: '1.6',
                    margin: 0,
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  {t(locale, 'sentiment.greed_desc')}
                </p>
              )}
            </div>

            {/* Safe Haven callout */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid var(--c-border)',
                fontSize: '0.875rem',
                color: 'var(--c-muted)',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <p style={{ margin: 0 }}>
                💡{' '}
                {isAr
                  ? 'تلميح: يتم حساب هذا المؤشر يومياً بناءً على 5 مؤشرات رئيسية تعكس معنويات السوق السعودي.'
                  : 'Tip: This index is calculated daily based on 5 key indicators reflecting Saudi market sentiment.'}
              </p>
            </div>
          </div>
        </div>

        {/* Component indicators */}
        <div
          style={{
            backgroundColor: 'var(--c-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--c-border)',
            padding: '2rem',
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'var(--c-text)',
              margin: '0 0 2rem 0',
              textAlign: isAr ? 'right' : 'left',
            }}
          >
            {isAr ? 'مؤشرات المكونات' : 'Component Indicators'}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
            }}
          >
            {components.map((comp, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--c-text)',
                      fontWeight: 'bold',
                      margin: 0,
                      textAlign: isAr ? 'right' : 'left',
                      flex: 1,
                    }}
                  >
                    {comp.name}
                  </p>
                  <p
                    style={{
                      color: 'var(--c-gold)',
                      fontWeight: 'bold',
                      margin: 0,
                      marginLeft: '1rem',
                    }}
                  >
                    {comp.value}
                  </p>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--c-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${comp.value}%`,
                      background: 'linear-gradient(90deg, rgb(246, 70, 93) 0%, rgb(12, 203, 129) 100%)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--c-elevated)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid var(--c-border)`,
            fontSize: '0.875rem',
            color: 'var(--c-muted)',
            textAlign: isAr ? 'right' : 'left',
          }}
        >
          <p style={{ margin: 0 }}>
            ⚠️ {t(locale, 'common.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
