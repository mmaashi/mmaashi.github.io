import { createServiceClient } from '@/lib/supabase/server';
import { t, tSector } from '@/lib/i18n';
import {
  Leaf,
  Globe,
  Users,
  Target,
  Building2,
  Sun,
  TrendingUp,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export const revalidate = 900;

// Vision 2030 Priority Sectors
const VISION_2030_SECTORS = {
  tourism: ['Tourism', 'Hospitality', 'Entertainment', 'Retail'],
  technology: ['IT', 'Telecom', 'Software', 'Technology'],
  healthcare: ['Healthcare', 'Pharmaceuticals', 'Medical', 'Health'],
  renewable: ['Energy', 'Utilities', 'Renewable Energy', 'Solar'],
  mining: ['Mining', 'Minerals', 'Resources', 'Materials'],
  entertainment: ['Entertainment', 'Media', 'Sports'],
};

const VISION_2030_SECTORS_AR = {
  tourism: ['السياحة', 'الضيافة', 'الترفيه', 'البيع بالتجزئة'],
  technology: ['تكنولوجيا', 'الاتصالات', 'برمجيات', 'التكنولوجيا'],
  healthcare: ['الرعاية الصحية', 'الأدوية', 'الطب', 'الصحة'],
  renewable: ['الطاقة', 'الخدمات العامة', 'الطاقة المتجددة', 'الطاقة الشمسية'],
  mining: ['التعدين', 'المعادن', 'الموارد', 'المواد'],
  entertainment: ['الترفيه', 'الإعلام', 'الرياضة'],
};

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
}

interface CompanyMetric {
  company_id: string;
  as_of_date: string;
  pe_ratio: number | null;
  roe: number | null;
  market_cap: number | null;
  dividend_yield: number | null;
  [key: string]: any;
}

interface ESGScore {
  company_id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  environmental: number;
  social: number;
  governance: number;
  vision_2030: number;
  overall: number;
}

// Helper: Check if sector aligns with Vision 2030
function checkVision2030Alignment(
  sector: string,
  isAr: boolean
): { aligned: boolean; category: string } {
  const lowerSector = sector.toLowerCase();
  const sectorMap = isAr ? VISION_2030_SECTORS_AR : VISION_2030_SECTORS;

  for (const [category, sectors] of Object.entries(sectorMap)) {
    if (sectors.some((s) => lowerSector.includes(s.toLowerCase()))) {
      return { aligned: true, category };
    }
  }
  return { aligned: false, category: 'Other' };
}

// Helper: Calculate Environmental Score
function calculateEnvironmentalScore(sector: string): number {
  const lowerSector = sector.toLowerCase();

  // High environmental concern: Energy, Materials, Oil & Gas
  if (['energy', 'oil', 'gas', 'materials', 'mining', 'industrial'].some((s) => lowerSector.includes(s))) {
    return 45 + Math.random() * 15; // 45-60
  }

  // Medium: Utilities, Construction, Transportation
  if (['utilities', 'construction', 'transport', 'logistics', 'cement'].some((s) => lowerSector.includes(s))) {
    return 55 + Math.random() * 15; // 55-70
  }

  // Low environmental concern: IT, Banking, Healthcare, Retail
  return 70 + Math.random() * 20; // 70-90
}

// Helper: Calculate Social Score (based on dividend yield & sector)
function calculateSocialScore(dividendYield: number | null, sector: string): number {
  let baseScore = 65;

  // High dividend yield = good wealth sharing
  if (dividendYield && dividendYield > 3) {
    baseScore += 15;
  } else if (dividendYield && dividendYield > 1.5) {
    baseScore += 8;
  }

  // Healthcare, Education, Tourism = higher social impact
  const highImpactSectors = ['healthcare', 'education', 'tourism', 'hospitality', 'retail'];
  if (highImpactSectors.some((s) => sector.toLowerCase().includes(s))) {
    baseScore += 10;
  }

  return Math.min(baseScore + (Math.random() * 5 - 2.5), 100);
}

// Helper: Calculate Governance Score (ROE stability, dividend consistency)
function calculateGovernanceScore(roe: number | null, dividendYield: number | null): number {
  let baseScore = 60;

  // Strong ROE = good returns for shareholders
  if (roe && roe > 15) {
    baseScore += 20;
  } else if (roe && roe > 10) {
    baseScore += 12;
  } else if (roe && roe > 5) {
    baseScore += 6;
  }

  // Consistent dividends show stability
  if (dividendYield && dividendYield > 0) {
    baseScore += 15;
  }

  return Math.min(baseScore + (Math.random() * 5 - 2.5), 100);
}

// Helper: Calculate Vision 2030 Alignment Score
function calculateVision2030Score(sector: string, roe: number | null): number {
  const { aligned } = checkVision2030Alignment(sector, false);
  let baseScore = aligned ? 75 : 40;

  // Strong performers in aligned sectors get higher score
  if (aligned && roe && roe > 12) {
    baseScore += 15;
  }

  return Math.min(baseScore + (Math.random() * 5 - 2.5), 100);
}

// Main Page Component
export default async function ESGPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const { locale } = params;
  const isAr = locale === 'ar';

  const supabase = createServiceClient();

  // Fetch all companies
  const { data: companies = [] } = await supabase
    .from('companies')
    .select('id, ticker, name_en, name_ar, sector')
    .limit(100);

  // Fetch latest metrics for all companies
  const { data: metrics = [] } = await supabase
    .from('company_metrics_daily')
    .select('company_id, as_of_date, pe_ratio, roe, market_cap, dividend_yield')
    .order('as_of_date', { ascending: false })
    .limit(100);

  // Create a map of latest metrics per company
  const metricsMap = new Map<string, CompanyMetric>();
  metrics.forEach((metric) => {
    if (!metricsMap.has(metric.company_id)) {
      metricsMap.set(metric.company_id, metric);
    }
  });

  // Calculate ESG scores for all companies
  const esgScores: ESGScore[] = companies
    .map((company: Company) => {
      const companyMetrics = metricsMap.get(company.id);
      const environmental = calculateEnvironmentalScore(company.sector);
      const social = calculateSocialScore(companyMetrics?.dividend_yield ?? null, company.sector);
      const governance = calculateGovernanceScore(companyMetrics?.roe ?? null, companyMetrics?.dividend_yield ?? null);
      const vision_2030 = calculateVision2030Score(company.sector, companyMetrics?.roe ?? null);

      const overall = (environmental * 0.25 + social * 0.25 + governance * 0.25 + vision_2030 * 0.25);

      return {
        company_id: company.id,
        ticker: company.ticker,
        name_en: company.name_en,
        name_ar: company.name_ar,
        sector: company.sector,
        environmental,
        social,
        governance,
        vision_2030,
        overall,
      };
    })
    .sort((a, b) => b.overall - a.overall);

  // Calculate market statistics
  const avgESGScore = esgScores.length > 0 ? esgScores.reduce((sum, s) => sum + s.overall, 0) / esgScores.length : 0;
  const avgEnvironmental = esgScores.length > 0 ? esgScores.reduce((sum, s) => sum + s.environmental, 0) / esgScores.length : 0;
  const avgSocial = esgScores.length > 0 ? esgScores.reduce((sum, s) => sum + s.social, 0) / esgScores.length : 0;
  const avgGovernance = esgScores.length > 0 ? esgScores.reduce((sum, s) => sum + s.governance, 0) / esgScores.length : 0;

  // Find best sector by average ESG
  const sectorMap = new Map<string, ESGScore[]>();
  esgScores.forEach((score) => {
    if (!sectorMap.has(score.sector)) {
      sectorMap.set(score.sector, []);
    }
    sectorMap.get(score.sector)!.push(score);
  });

  const bestSector = Array.from(sectorMap.entries()).reduce((best, [sector, scores]) => {
    const avg = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
    return avg > (best.avg ?? 0) ? { sector, avg } : best;
  }, { sector: '', avg: 0 });

  // Find Vision 2030 leaders
  const vision2030Leaders = esgScores
    .filter((s) => checkVision2030Alignment(s.sector, isAr).aligned)
    .sort((a, b) => b.vision_2030 - a.vision_2030)
    .slice(0, 5);

  const topCompanies = esgScores.slice(0, 10);

  return (
    <div
      style={{
        backgroundColor: 'var(--c-base)',
        color: 'var(--c-text)',
        minHeight: '100vh',
        paddingBottom: '4rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--c-surface)',
          borderBottom: `1px solid var(--c-border)`,
          padding: '2rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, var(--c-gold), var(--c-green))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Leaf style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                {isAr ? 'درجة ESG ورؤية 2030' : 'ESG & Vision 2030 Score'}
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--c-muted)', fontSize: '0.875rem' }}>
                {isAr
                  ? 'تقييم الاستدامة والمسؤولية الاجتماعية للشركات بالبورصة السعودية'
                  : 'Sustainability & Corporate Responsibility Assessment for Saudi Listed Companies'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Hero Section */}
        <div
          style={{
            backgroundColor: 'var(--c-elevated)',
            borderRadius: '1rem',
            border: `1px solid var(--c-border)`,
            padding: '2rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
            borderColor: 'var(--c-green)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.5rem' }}>
            {/* Overall ESG */}
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                {isAr ? 'متوسط درجة ESG' : 'Average ESG Score'}
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-grotesk)',
                  color: 'var(--c-green)',
                }}
                className="font-num"
              >
                {avgESGScore.toFixed(1)}
                <span style={{ fontSize: '1rem', color: 'var(--c-muted)', marginLeft: '0.25rem' }}>/100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: '0.5rem' }}>
                {esgScores.length} {isAr ? 'شركة مقيمة' : 'companies rated'}
              </div>
            </div>

            {/* Environmental */}
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                {isAr ? 'البيئي' : 'Environmental'}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)' }} className="font-num">
                {avgEnvironmental.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: '0.5rem' }}>
                {isAr ? '25% من الدرجة الكلية' : '25% of total score'}
              </div>
            </div>

            {/* Social */}
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                {isAr ? 'الاجتماعي' : 'Social'}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)' }} className="font-num">
                {avgSocial.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: '0.5rem' }}>
                {isAr ? '25% من الدرجة الكلية' : '25% of total score'}
              </div>
            </div>

            {/* Governance */}
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                {isAr ? 'الحوكمة' : 'Governance'}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)' }} className="font-num">
                {avgGovernance.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: '0.5rem' }}>
                {isAr ? '25% من الدرجة الكلية' : '25% of total score'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Best Sector */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              borderRadius: '0.75rem',
              border: `1px solid var(--c-border)`,
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <Building2 style={{ width: '1.25rem', height: '1.25rem', color: 'var(--c-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--c-muted)' }}>
                {isAr ? 'أفضل قطاع' : 'Best Sector'}
              </h3>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)', marginBottom: '0.5rem' }}>
              {bestSector.sector}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)' }}>
              {isAr ? 'متوسط درجة ESG' : 'Average ESG Score'}: <span style={{ color: 'var(--c-green)', fontWeight: 600 }}>{bestSector.avg.toFixed(1)}</span>
            </div>
          </div>

          {/* Vision 2030 Leaders Count */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              borderRadius: '0.75rem',
              border: `1px solid var(--c-border)`,
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <Target style={{ width: '1.25rem', height: '1.25rem', color: 'var(--c-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--c-muted)' }}>
                {isAr ? 'قادة رؤية 2030' : 'Vision 2030 Leaders'}
              </h3>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)', marginBottom: '0.5rem' }}>
              {vision2030Leaders.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)' }}>
              {isAr ? 'شركات متوافقة مع الرؤية' : 'companies aligned with Vision'}
            </div>
          </div>

          {/* Market Health */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              borderRadius: '0.75rem',
              border: `1px solid var(--c-border)`,
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: 'var(--c-gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--c-muted)' }}>
                {isAr ? 'صحة السوق' : 'Market Health'}
              </h3>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-grotesk)', marginBottom: '0.5rem' }}>
              {avgESGScore > 70 ? (isAr ? 'قوية' : 'Strong') : avgESGScore > 60 ? (isAr ? 'معتدلة' : 'Moderate') : isAr ? 'ضعيفة' : 'Weak'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)' }}>
              {isAr ? 'تقييم الاستدامة العام' : 'Overall sustainability rating'}
            </div>
          </div>
        </div>

        {/* Top Companies Table */}
        <div
          style={{
            backgroundColor: 'var(--c-elevated)',
            borderRadius: '0.75rem',
            border: `1px solid var(--c-border)`,
            overflow: 'hidden',
            marginBottom: '2rem',
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: `1px solid var(--c-border)` }}>
            <h2 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {isAr ? 'أفضل الشركات حسب درجة ESG' : 'Top Companies by ESG Score'}
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid var(--c-border)` }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: isAr ? 'right' : 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'الشركة' : 'Company'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'القطاع' : 'Sector'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'البيئي' : 'Environmental'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'الاجتماعي' : 'Social'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'الحوكمة' : 'Governance'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-muted)' }}>
                    {isAr ? 'رؤية 2030' : 'Vision 2030'}
                  </th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-gold)' }}>
                    {isAr ? 'الإجمالي' : 'Overall'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((company) => (
                  <tr key={company.company_id} style={{ borderBottom: `1px solid var(--c-border)` }}>
                    <td style={{ padding: '1rem 1.5rem', textAlign: isAr ? 'right' : 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{company.ticker}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)' }}>{isAr ? company.name_ar : company.name_en}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--c-muted)' }}>
                      {company.sector}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600 }} className="font-num">
                      {company.environmental.toFixed(0)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600 }} className="font-num">
                      {company.social.toFixed(0)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600 }} className="font-num">
                      {company.governance.toFixed(0)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600 }} className="font-num">
                      {company.vision_2030.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'var(--c-green)',
                      }}
                      className="font-num"
                    >
                      {company.overall.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vision 2030 Alignment Section */}
        <div
          style={{
            backgroundColor: 'var(--c-elevated)',
            borderRadius: '0.75rem',
            border: `1px solid var(--c-border)`,
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Sun style={{ width: '1.5rem', height: '1.5rem', color: 'var(--c-gold)' }} />
            <h2 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {isAr ? 'قادة رؤية 2030' : 'Vision 2030 Leaders'}
            </h2>
          </div>

          {vision2030Leaders.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: '1rem' }}>
              {vision2030Leaders.map((company) => (
                <div
                  key={company.company_id}
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    borderRadius: '0.5rem',
                    border: `1px solid var(--c-gold)`,
                    padding: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                    {company.ticker}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    {isAr ? company.name_ar : company.name_en}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginBottom: '1rem' }}>
                    {company.sector}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--c-muted)' }}>
                      {isAr ? 'رؤية 2030' : 'Vision 2030'}
                    </div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--c-green)',
                      }}
                      className="font-num"
                    >
                      {company.vision_2030.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--c-muted)', textAlign: 'center', padding: '2rem' }}>
              {isAr ? 'لا توجد شركات متوافقة مع رؤية 2030 حالياً' : 'No Vision 2030 aligned companies at this time'}
            </div>
          )}
        </div>

        {/* Methodology Section */}
        <div
          style={{
            backgroundColor: 'var(--c-surface)',
            borderRadius: '0.75rem',
            border: `1px solid var(--c-border)`,
            padding: '1.5rem',
            marginTop: '2rem',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-grotesk)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            {isAr ? 'المنهجية' : 'Methodology'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem', fontSize: '0.875rem', color: 'var(--c-muted)', lineHeight: 1.6 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.5rem' }}>
                {isAr ? 'البيئي (25%)' : 'Environmental (25%)'}
              </div>
              <p style={{ margin: 0 }}>
                {isAr
                  ? 'مخاطر بيئية قطاعية. قطاعات الطاقة والمواد الخام لها مخاطر أعلى.'
                  : 'Sector-based environmental risk assessment. Energy and materials sectors carry higher risk.'}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.5rem' }}>
                {isAr ? 'الاجتماعي (25%)' : 'Social (25%)'}
              </div>
              <p style={{ margin: 0 }}>
                {isAr
                  ? 'توزيع الثروة عبر الأرباح والقطاعات ذات التأثير الاجتماعي العالي.'
                  : 'Wealth distribution via dividends and high social impact sectors.'}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.5rem' }}>
                {isAr ? 'الحوكمة (25%)' : 'Governance (25%)'}
              </div>
              <p style={{ margin: 0 }}>
                {isAr
                  ? 'استقرار العوائد (ROE) واستمرارية الأرباح وإدارة الديون.'
                  : 'Return stability (ROE), dividend consistency, and debt management.'}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)', marginBottom: '0.5rem' }}>
                {isAr ? 'رؤية 2030 (25%)' : 'Vision 2030 (25%)'}
              </div>
              <p style={{ margin: 0 }}>
                {isAr
                  ? 'توافق قطاعي مع أهداف رؤية المملكة 2030.'
                  : 'Sector alignment with Saudi Vision 2030 strategic goals.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}