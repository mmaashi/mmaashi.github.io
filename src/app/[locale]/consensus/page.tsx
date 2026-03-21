import { createServiceClient } from '@/lib/supabase/server';
import { t, tSector } from '@/lib/i18n';
import { Target, TrendingUp, TrendingDown, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

export const revalidate = 900;

interface CompanyMetrics {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  price: number;
  pe_ratio: number;
  roe: number;
  market_cap: number;
  dividend_yield: number;
  book_value: number;
  beta: number;
}

interface ConsensusData {
  company_id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  current_price: number;
  fair_value_low: number;
  fair_value_mid: number;
  fair_value_high: number;
  upside_pct: number;
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  pe_ratio: number;
  roe: number;
  market_cap: number;
}

interface MarketOverview {
  strong_buy_pct: number;
  buy_pct: number;
  hold_pct: number;
  sell_pct: number;
  strong_sell_pct: number;
  avg_upside: number;
  most_undervalued: ConsensusData | null;
  most_overvalued: ConsensusData | null;
}

async function fetchConsensusData(locale: string): Promise<{
  consensus: ConsensusData[];
  overview: MarketOverview;
}> {
  const supabase = createServiceClient();

  try {
    // Fetch top 50 companies by market cap with latest metrics
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(
        `
        id,
        ticker,
        name_en,
        name_ar,
        sector,
        company_metrics_daily (
          price,
          pe_ratio,
          roe,
          market_cap,
          dividend_yield,
          book_value,
          beta,
          as_of_date
        ),
        financials (
          revenue,
          net_income,
          earnings_per_share,
          total_assets,
          total_liabilities,
          gross_profit,
          operating_income,
          period,
          period_type
        )
      `
      )
      .order('market_cap', { ascending: false })
      .limit(50);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return { consensus: [], overview: getEmptyOverview() };
    }

    if (!companies || companies.length === 0) {
      return { consensus: [], overview: getEmptyOverview() };
    }

    // Process consensus data for each company
    const consensus: ConsensusData[] = companies
      .map((company: any) => {
        const metrics = company.company_metrics_daily?.[0];
        const financials = company.financials?.[0];

        if (!metrics || !metrics.price) return null;

        // Synthetic consensus model based on financial data
        const { fairValueLow, fairValueMid, fairValueHigh, rating } =
          calculateConsensus(
            metrics.price,
            metrics.pe_ratio,
            metrics.roe,
            metrics.market_cap,
            metrics.book_value,
            financials,
            companies
          );

        const upside = ((fairValueMid - metrics.price) / metrics.price) * 100;

        return {
          company_id: company.id,
          ticker: company.ticker,
          name_en: company.name_en,
          name_ar: company.name_ar,
          sector: company.sector,
          current_price: metrics.price,
          fair_value_low: fairValueLow,
          fair_value_mid: fairValueMid,
          fair_value_high: fairValueHigh,
          upside_pct: upside,
          rating,
          pe_ratio: metrics.pe_ratio || 0,
          roe: metrics.roe || 0,
          market_cap: metrics.market_cap || 0,
        };
      })
      .filter((item): item is ConsensusData => item !== null)
      .sort((a, b) => b.upside_pct - a.upside_pct);

    // Calculate market overview
    const overview = calculateMarketOverview(consensus);

    return { consensus, overview };
  } catch (error) {
    console.error('Error fetching consensus data:', error);
    return { consensus: [], overview: getEmptyOverview() };
  }
}

function calculateConsensus(
  currentPrice: number,
  peRatio: number,
  roe: number,
  marketCap: number,
  bookValue: number,
  financials: any,
  allCompanies: any[]
): {
  fairValueLow: number;
  fairValueMid: number;
  fairValueHigh: number;
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
} {
  const valuations: number[] = [];

  // Method 1: P/E based valuation (relative to sector average)
  if (peRatio && peRatio > 0) {
    const sectorAvgPE = 16; // Saudi market average P/E
    const sectorPEFactors = [0.8, 1.0, 1.2]; // Low, Mid, High
    sectorPEFactors.forEach((factor) => {
      const impliedEPS = currentPrice / peRatio;
      const fairPrice = impliedEPS * (sectorAvgPE * factor);
      valuations.push(fairPrice);
    });
  }

  // Method 2: Book Value based valuation (P/B multiple)
  if (bookValue && bookValue > 0) {
    const pbMultiples = [1.2, 1.5, 1.8];
    pbMultiples.forEach((multiple) => {
      const fairPrice = bookValue * multiple;
      valuations.push(fairPrice);
    });
  }

  // Method 3: ROE-based valuation (DuPont/Gordon Growth)
  if (roe && roe > 0 && bookValue && bookValue > 0) {
    const requiredReturn = 0.08; // 8% required return
    const growthRates = [0.02, 0.04, 0.06]; // 2-6% growth
    growthRates.forEach((growth) => {
      if (requiredReturn > growth) {
        const payout = 0.3; // Assume 30% payout ratio
        const roe_pct = Math.min(roe / 100, 0.25); // Cap at 25% ROE
        const fairPrice =
          bookValue *
          (1 +
            roe_pct * (1 - payout) * ((requiredReturn - growth) / (requiredReturn - growth)));
        if (!isNaN(fairPrice) && fairPrice > 0) {
          valuations.push(Math.min(fairPrice, currentPrice * 3)); // Cap at 3x current
        }
      }
    });
  }

  // Default valuation if no data
  if (valuations.length === 0) {
    valuations.push(currentPrice * 0.9, currentPrice, currentPrice * 1.1);
  }

  // Sort and get percentiles
  valuations.sort((a, b) => a - b);
  const fairValueLow = Math.max(valuations[0] * 0.95, valuations[0]);
  const fairValueMid = valuations[Math.floor(valuations.length / 2)];
  const fairValueHigh = Math.min(valuations[valuations.length - 1] * 1.05, valuations[valuations.length - 1]);

  // Determine rating based on current price vs fair value
  const priceToFV = currentPrice / fairValueMid;
  let rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

  if (priceToFV < 0.8) {
    rating = 'Strong Buy';
  } else if (priceToFV < 0.95) {
    rating = 'Buy';
  } else if (priceToFV <= 1.05) {
    rating = 'Hold';
  } else if (priceToFV <= 1.2) {
    rating = 'Sell';
  } else {
    rating = 'Strong Sell';
  }

  return {
    fairValueLow,
    fairValueMid,
    fairValueHigh,
    rating,
  };
}

function calculateMarketOverview(consensus: ConsensusData[]): MarketOverview {
  const ratingCounts = {
    'Strong Buy': 0,
    Buy: 0,
    Hold: 0,
    Sell: 0,
    'Strong Sell': 0,
  };

  let totalUpside = 0;
  let mostUndervalued: ConsensusData | null = null;
  let mostOvervalued: ConsensusData | null = null;
  let maxUpside = -Infinity;
  let minUpside = Infinity;

  consensus.forEach((item) => {
    ratingCounts[item.rating]++;
    totalUpside += item.upside_pct;

    if (item.upside_pct > maxUpside) {
      maxUpside = item.upside_pct;
      mostUndervalued = item;
    }
    if (item.upside_pct < minUpside) {
      minUpside = item.upside_pct;
      mostOvervalued = item;
    }
  });

  const total = consensus.length || 1;

  return {
    strong_buy_pct: (ratingCounts['Strong Buy'] / total) * 100,
    buy_pct: (ratingCounts['Buy'] / total) * 100,
    hold_pct: (ratingCounts['Hold'] / total) * 100,
    sell_pct: (ratingCounts['Sell'] / total) * 100,
    strong_sell_pct: (ratingCounts['Strong Sell'] / total) * 100,
    avg_upside: totalUpside / total,
    most_undervalued: mostUndervalued,
    most_overvalued: mostOvervalued,
  };
}

function getEmptyOverview(): MarketOverview {
  return {
    strong_buy_pct: 0,
    buy_pct: 0,
    hold_pct: 0,
    sell_pct: 0,
    strong_sell_pct: 0,
    avg_upside: 0,
    most_undervalued: null,
    most_overvalued: null,
  };
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'Strong Buy':
      return '#22c55e';
    case 'Buy':
      return '#84cc16';
    case 'Hold':
      return '#f59e0b';
    case 'Sell':
      return '#ef4444';
    case 'Strong Sell':
      return '#7f1d1d';
    default:
      return '#6b7280';
  }
}

function getRatingBgColor(rating: string): string {
  switch (rating) {
    case 'Strong Buy':
      return 'rgba(34, 197, 94, 0.1)';
    case 'Buy':
      return 'rgba(132, 204, 22, 0.1)';
    case 'Hold':
      return 'rgba(245, 158, 11, 0.1)';
    case 'Sell':
      return 'rgba(239, 68, 68, 0.1)';
    case 'Strong Sell':
      return 'rgba(127, 29, 29, 0.1)';
    default:
      return 'rgba(107, 114, 128, 0.1)';
  }
}

export default async function ConsensusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  const { consensus, overview } = await fetchConsensusData(locale);

  const translations = {
    en: {
      title: 'Analyst Consensus',
      subtitle: 'Synthetic consensus ratings based on financial analysis',
      marketOverview: 'Market Overview',
      buyRating: 'Buy Rating %',
      sellRating: 'Sell Rating %',
      holdRating: 'Hold Rating %',
      mostUndervalued: 'Most Undervalued',
      mostOvervalued: 'Most Overvalued',
      averageUpside: 'Average Market Upside',
      upside: 'Upside',
      ticker: 'Ticker',
      name: 'Company',
      price: 'Price',
      fairValue: 'Fair Value',
      upside_pct: 'Upside %',
      rating: 'Rating',
      pe: 'P/E Ratio',
      roe: 'ROE %',
      marketCap: 'Market Cap',
      ratingDistribution: 'Rating Distribution',
      strongBuy: 'Strong Buy',
      buy: 'Buy',
      hold: 'Hold',
      sell: 'Sell',
      strongSell: 'Strong Sell',
      noData: 'No consensus data available',
      lowFairValue: 'Low',
      midFairValue: 'Mid',
      highFairValue: 'High',
    },
    ar: {
      title: 'إجماع المحللين',
      subtitle: 'تقييمات إجماع اصطناعية بناءً على التحليل المالي',
      marketOverview: 'نظرة عامة على السوق',
      buyRating: 'نسبة التقييم بـ شراء %',
      sellRating: 'نسبة التقييم بـ بيع %',
      holdRating: 'نسبة التقييم بـ احتفاظ %',
      mostUndervalued: 'الأكثر تقويماً بأقل من قيمتها',
      mostOvervalued: 'الأكثر تقويماً بأكثر من قيمتها',
      averageUpside: 'متوسط الارتفاع المحتمل في السوق',
      upside: 'الارتفاع المحتمل',
      ticker: 'الرمز',
      name: 'الشركة',
      price: 'السعر',
      fairValue: 'القيمة العادلة',
      upside_pct: 'نسبة الارتفاع %',
      rating: 'التقييم',
      pe: 'نسبة السعر إلى الربح',
      roe: 'العائد على حقوق الملكية %',
      marketCap: 'القيمة السوقية',
      ratingDistribution: 'توزيع التقييمات',
      strongBuy: 'شراء قوي',
      buy: 'شراء',
      hold: 'احتفاظ',
      sell: 'بيع',
      strongSell: 'بيع قوي',
      noData: 'لا توجد بيانات إجماع متاحة',
      lowFairValue: 'منخفض',
      midFairValue: 'متوسط',
      highFairValue: 'مرتفع',
    },
  };

  const trans = translations[isAr ? 'ar' : 'en'];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--c-base)',
        color: 'var(--c-text)',
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
          borderBottom: '1px solid var(--c-border)',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Target style={{ width: '32px', height: '32px', color: 'var(--c-gold)' }} />
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                fontFamily: 'var(--font-grotesk)',
                margin: 0,
                color: 'var(--c-gold)',
              }}
            >
              {trans.title}
            </h1>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--c-muted)', margin: 0 }}>
            {trans.subtitle}
          </p>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            fontFamily: 'var(--font-grotesk)',
            marginBottom: '1.5rem',
            marginTop: 0,
          }}
        >
          {trans.marketOverview}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Most Undervalued */}
          {overview.most_undervalued ? (
            <div
              style={{
                backgroundColor: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: 'var(--c-gold)' }} />
                <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-muted)', fontWeight: '500' }}>
                  {trans.mostUndervalued}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <p
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: 0,
                    color: 'var(--c-green)',
                    fontFamily: 'var(--font-num)',
                  }}
                >
                  {overview.most_undervalued.ticker}
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--c-muted)', margin: '0.5rem 0 0 0' }}>
                {isAr ? overview.most_undervalued.name_ar : overview.most_undervalued.name_en}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--c-border)',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', margin: '0 0 0.25rem 0' }}>
                    {trans.upside}
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      margin: 0,
                      color: 'var(--c-gold)',
                      fontFamily: 'var(--font-num)',
                    }}
                  >
                    {overview.most_undervalued.upside_pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Most Overvalued */}
          {overview.most_overvalued ? (
            <div
              style={{
                backgroundColor: 'var(--c-surface)',
                border: '1px solid var(--c-border)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <TrendingDown style={{ width: '20px', height: '20px', color: 'var(--c-red)' }} />
                <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-muted)', fontWeight: '500' }}>
                  {trans.mostOvervalued}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <p
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: 0,
                    color: 'var(--c-red)',
                    fontFamily: 'var(--font-num)',
                  }}
                >
                  {overview.most_overvalued.ticker}
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--c-muted)', margin: '0.5rem 0 0 0' }}>
                {isAr ? overview.most_overvalued.name_ar : overview.most_overvalued.name_en}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--c-border)',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', margin: '0 0 0.25rem 0' }}>
                    {trans.upside}
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      margin: 0,
                      color: 'var(--c-red)',
                      fontFamily: 'var(--font-num)',
                    }}
                  >
                    {overview.most_overvalued.upside_pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Average Upside */}
          <div
            style={{
              backgroundColor: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: 'var(--c-gold)' }} />
              <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--c-muted)', fontWeight: '500' }}>
                {trans.averageUpside}
              </h3>
            </div>
            <p
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '1rem 0',
                color: overview.avg_upside > 0 ? 'var(--c-green)' : 'var(--c-red)',
                fontFamily: 'var(--font-num)',
              }}
            >
              {overview.avg_upside.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div
          style={{
            backgroundColor: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              fontFamily: 'var(--font-grotesk)',
              marginTop: 0,
              marginBottom: '1.5rem',
            }}
          >
            {trans.ratingDistribution}
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '120px', marginBottom: '1rem' }}>
            {[
              { label: trans.strongBuy, value: overview.strong_buy_pct, color: '#22c55e' },
              { label: trans.buy, value: overview.buy_pct, color: '#84cc16' },
              { label: trans.hold, value: overview.hold_pct, color: '#f59e0b' },
              { label: trans.sell, value: overview.sell_pct, color: '#ef4444' },
              { label: trans.strongSell, value: overview.strong_sell_pct, color: '#7f1d1d' },
            ].map((item) => (
              <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(item.value * 2, 4)}px`,
                    backgroundColor: item.color,
                    borderRadius: '4px 4px 0 0',
                    minHeight: '8px',
                  }}
                />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--c-muted)',
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0',
                    fontFamily: 'var(--font-num)',
                  }}
                >
                  {item.value.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Companies Table */}
        {consensus.length > 0 ? (
          <div
            style={{
              backgroundColor: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: isAr ? 'right' : 'left',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.ticker}
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: isAr ? 'right' : 'left',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.name}
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.price}
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.fairValue}
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.upside_pct}
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: isAr ? 'right' : 'left',
                        fontWeight: '600',
                        color: 'var(--c-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {trans.rating}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consensus.map((item, idx) => (
                    <tr
                      key={item.company_id}
                      style={{
                        borderBottom: idx < consensus.length - 1 ? '1px solid var(--c-border)' : 'none',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(217, 119, 6, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: '700', fontFamily: 'var(--font-grotesk)' }}>
                        {item.ticker}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--c-text)' }}>
                        {isAr ? item.name_ar : item.name_en}
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-num)',
                          color: 'var(--c-gold)',
                          fontWeight: '600',
                        }}
                      >
                        {item.current_price.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontSize: '0.8125rem',
                          fontFamily: 'var(--font-num)',
                        }}
                      >
                        <div style={{ color: 'var(--c-muted)', marginBottom: '0.25rem' }}>
                          {item.fair_value_low.toFixed(2)}–{item.fair_value_high.toFixed(2)}
                        </div>
                        <div style={{ color: 'var(--c-gold)', fontWeight: '600' }}>
                          {trans.midFairValue}: {item.fair_value_mid.toFixed(2)}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-num)',
                          fontWeight: '700',
                          color: item.upside_pct > 0 ? 'var(--c-green)' : 'var(--c-red)',
                        }}
                      >
                        {item.upside_pct > 0 ? '+' : ''}
                        {item.upside_pct.toFixed(1)}%
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: getRatingBgColor(item.rating),
                            color: getRatingColor(item.rating),
                          }}
                        >
                          {item.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--c-muted)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--c-muted)', margin: 0 }}>{trans.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}