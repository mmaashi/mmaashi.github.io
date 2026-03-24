import { Scale, CheckCircle, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/server';
import { t, tSector } from '@/lib/i18n';
import { ZakatCalculator } from '@/components/ZakatCalculator';

export const revalidate = 900;

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  is_shariah_compliant: boolean;
}

interface CompanyMetrics {
  company_id: string;
  as_of_date: string;
  pe_ratio: number | null;
  roe: number | null;
  dividend_yield: number | null;
  market_cap: number | null;
}

interface Shariah_CompliancePageProps {
  params: Promise<{ locale: string }>;
}

// Shariah Compliance Page Component
export default async function ShariaCompliancePage({
  params,
}: Shariah_CompliancePageProps) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  // Fetch companies data
  const supabase = createServiceClient();
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, ticker, name_en, name_ar, sector, is_shariah_compliant')
    .order('ticker', { ascending: true });

  if (companiesError || !companies) {
    return (
      <div
        style={{
          padding: '32px',
          color: 'var(--c-text)',
          textAlign: 'center',
        }}
      >
        <p>{isAr ? 'خطأ في تحميل البيانات' : 'Error loading data'}</p>
      </div>
    );
  }

  // Calculate statistics
  const shariaCompanies = companies.filter((c) => c.is_shariah_compliant);
  const totalCompanies = companies.length;
  const compliancePercentage = totalCompanies
    ? ((shariaCompanies.length / totalCompanies) * 100).toFixed(1)
    : '0';

  // Get top sectors among shariah compliant companies
  const sectorCounts: Record<string, number> = {};
  shariaCompanies.forEach((c) => {
    sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
  });
  const topSectors = Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, count]) => ({
      sector,
      count,
    }));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--c-base)',
        color: 'var(--c-text)',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Scale size={32} style={{ color: 'var(--c-gold)' }} />
            <h1
              style={{
                fontFamily: 'var(--font-grotesk)',
                fontSize: '36px',
                fontWeight: '700',
                margin: '0',
                color: 'var(--c-text)',
              }}
            >
              {isAr ? 'الامتثال الشرعي' : 'Shariah Compliance'}
            </h1>
          </div>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--c-muted)',
              margin: '0',
              lineHeight: '1.6',
            }}
          >
            {isAr
              ? 'استكشف الشركات المدرجة في السوق السعودي التي تلتزم بالمعايير الشرعية وحسب زكاتك الاستثمارية.'
              : 'Explore Shariah-compliant stocks in the Saudi market and calculate your investment Zakat.'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '20px',
            marginBottom: '48px',
          }}
        >
          {/* Shariah Companies Card */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <CheckCircle size={20} style={{ color: 'var(--c-gold)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--c-muted)',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {isAr ? 'الشركات الشرعية' : 'Shariah Companies'}
              </h3>
            </div>
            <div
              className="font-num"
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--c-gold)',
                marginBottom: '8px',
              }}
            >
              {shariaCompanies.length}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--c-muted)', margin: '0' }}>
              {isAr ? `من أصل ${totalCompanies}` : `of ${totalCompanies} total`}
            </p>
          </div>

          {/* Compliance Percentage Card */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Percent size={20} style={{ color: 'var(--c-gold)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--c-muted)',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {isAr ? 'نسبة الامتثال' : 'Compliance Rate'}
              </h3>
            </div>
            <div
              className="font-num"
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--c-gold)',
                marginBottom: '8px',
              }}
            >
              {compliancePercentage}%
            </div>
            <p style={{ fontSize: '14px', color: 'var(--c-muted)', margin: '0' }}>
              {isAr ? 'من السوق' : 'of market'}
            </p>
          </div>

          {/* Top Sector Card */}
          <div
            style={{
              backgroundColor: 'var(--c-elevated)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <TrendingUp size={20} style={{ color: 'var(--c-gold)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-grotesk)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--c-muted)',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {isAr ? 'أعلى القطاعات' : 'Top Sectors'}
              </h3>
            </div>
            <div>
              {topSectors.length > 0 ? (
                topSectors.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      fontSize: '13px',
                      color: idx === 0 ? 'var(--c-text)' : 'var(--c-muted)',
                    }}
                  >
                    <span>{tSector(item.sector)}</span>
                    <span className="font-num" style={{ fontWeight: '600' }}>
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--c-muted)', margin: '0' }}>
                  {isAr ? 'لا توجد بيانات' : 'No data'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Zakat Calculator Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-grotesk)',
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--c-text)',
              marginBottom: '24px',
              margin: '0 0 24px 0',
            }}
          >
            {isAr ? 'حاسبة الزكاة الاستثمارية' : 'Investment Zakat Calculator'}
          </h2>
          <ZakatCalculator locale={locale} />
        </div>

        {/* Shariah Compliant Stocks Table */}
        <div
          style={{
            backgroundColor: 'var(--c-elevated)',
            border: '1px solid var(--c-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid var(--c-border)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-grotesk)',
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--c-text)',
                margin: '0',
              }}
            >
              {isAr ? 'الأسهم الشرعية' : 'Shariah-Compliant Stocks'}
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: isAr ? 'right' : 'left',
                      fontWeight: '600',
                      color: 'var(--c-muted)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isAr ? 'الرمز' : 'Ticker'}
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: isAr ? 'right' : 'left',
                      fontWeight: '600',
                      color: 'var(--c-muted)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isAr ? 'الاسم' : 'Company'}
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: isAr ? 'right' : 'left',
                      fontWeight: '600',
                      color: 'var(--c-muted)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isAr ? 'القطاع' : 'Sector'}
                  </th>
                  <th
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: 'var(--c-muted)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isAr ? 'الامتثال' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shariaCompanies.length > 0 ? (
                  shariaCompanies.map((company, idx) => (
                    <tr
                      key={company.id}
                      style={{
                        borderBottom: idx < shariaCompanies.length - 1 ? '1px solid var(--c-border)' : 'none',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(212, 175, 55, 0.02)',
                      }}
                    >
                      <td
                        style={{
                          padding: '16px',
                          color: 'var(--c-text)',
                          fontWeight: '600',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        {company.ticker}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          color: 'var(--c-text)',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        {isAr ? company.name_ar : company.name_en}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          color: 'var(--c-muted)',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        {tSector(company.sector)}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            paddingLeft: '8px',
                            paddingRight: '8px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            borderRadius: '6px',
                          }}
                        >
                          <CheckCircle size={14} style={{ color: 'var(--c-green)' }} />
                          <span style={{ fontSize: '12px', color: 'var(--c-green)', fontWeight: '500' }}>
                            {isAr ? 'شرعي' : 'Compliant'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: 'var(--c-muted)',
                      }}
                    >
                      {isAr ? 'لا توجد أسهم شرعية متاحة' : 'No Shariah-compliant stocks available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: 'var(--c-surface)',
            borderRadius: '12px',
            border: '1px solid var(--c-border)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-grotesk)',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--c-text)',
              marginBottom: '12px',
              margin: '0 0 12px 0',
            }}
          >
            {isAr ? 'معايير الامتثال الشرعي' : 'Shariah Compliance Criteria'}
          </h3>
          <ul
            style={{
              margin: '0',
              paddingLeft: isAr ? '0' : '20px',
              paddingRight: isAr ? '20px' : '0',
              fontSize: '14px',
              color: 'var(--c-muted)',
              lineHeight: '1.8',
            }}
          >
            <li>{isAr ? 'عدم الاستثمار في الفائدة الربوية' : 'No riba (usury) involvement'}</li>
            <li>{isAr ? 'الامتناع عن الأنشطة غير الأخلاقية' : 'No haram (prohibited) activities'}</li>
            <li>{isAr ? 'الشفافية المالية والإفصاح الكامل' : 'Full financial transparency'}</li>
            <li>{isAr ? 'الامتثال للمعايير الإسلامية الدولية' : 'Alignment with Islamic standards'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
