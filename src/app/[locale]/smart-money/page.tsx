import { createServiceClient } from '@/lib/supabase/server';
import { t, tSector } from '@/lib/i18n';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';

export const revalidate = 900;

interface OwnershipRecord {
  id: string;
  company_id: string;
  owner_name: string;
  owner_type: 'Government' | 'Institution' | 'Board';
  percentage: number;
  previous_percentage: number;
  change_date: string;
  created_at: string;
  company?: {
    ticker: string;
    name_en: string;
    name_ar: string;
    sector: string;
  };
}

interface SummaryData {
  totalMoves: number;
  netBuying: number;
  netSelling: number;
  mostAccumulated: { ticker: string; name: string; totalChange: number } | null;
  mostDistributed: { ticker: string; name: string; totalChange: number } | null;
}

async function fetchOwnershipData(): Promise<OwnershipRecord[]> {
  const supabase = createServiceClient();
  
  // Fetch ownership records from last 30 days with company info
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data, error } = await supabase
    .from('ownership')
    .select(`
      id,
      company_id,
      owner_name,
      owner_type,
      percentage,
      previous_percentage,
      change_date,
      created_at,
      companies (
        ticker,
        name_en,
        name_ar,
        sector
      )
    `)
    .gte('change_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('change_date', { ascending: false });

  if (error) {
    console.error('Error fetching ownership data:', error);
    return [];
  }

  return (data || []).map((record: any) => ({
    id: record.id,
    company_id: record.company_id,
    owner_name: record.owner_name,
    owner_type: record.owner_type,
    percentage: record.percentage,
    previous_percentage: record.previous_percentage,
    change_date: record.change_date,
    created_at: record.created_at,
    company: record.companies ? {
      ticker: record.companies.ticker,
      name_en: record.companies.name_en,
      name_ar: record.companies.name_ar,
      sector: record.companies.sector,
    } : undefined,
  }));
}

function calculateSummary(records: OwnershipRecord[]): SummaryData {
  const byCompany = new Map<string, { buys: number; sells: number; ticker: string; name_en: string; name_ar: string }>();

  records.forEach((record) => {
    if (!record.company) return;
    
    const key = record.company_id;
    const change = record.percentage - record.previous_percentage;
    
    if (!byCompany.has(key)) {
      byCompany.set(key, {
        buys: 0,
        sells: 0,
        ticker: record.company.ticker,
        name_en: record.company.name_en,
        name_ar: record.company.name_ar,
      });
    }

    const company = byCompany.get(key)!;
    if (change > 0) {
      company.buys += change;
    } else {
      company.sells += Math.abs(change);
    }
  });

  let mostAccumulated: { ticker: string; name: string; totalChange: number } | null = null;
  let mostDistributed: { ticker: string; name: string; totalChange: number } | null = null;
  let maxBuy = 0;
  let maxSell = 0;
  let totalBuying = 0;
  let totalSelling = 0;

  byCompany.forEach((company, key) => {
    const netChange = company.buys - company.sells;
    
    if (company.buys > maxBuy) {
      maxBuy = company.buys;
      mostAccumulated = {
        ticker: company.ticker,
        name: company.name_en,
        totalChange: company.buys,
      };
    }

    if (company.sells > maxSell) {
      maxSell = company.sells;
      mostDistributed = {
        ticker: company.ticker,
        name: company.name_en,
        totalChange: company.sells,
      };
    }

    totalBuying += company.buys;
    totalSelling += company.sells;
  });

  return {
    totalMoves: records.length,
    netBuying: totalBuying,
    netSelling: totalSelling,
    mostAccumulated,
    mostDistributed,
  };
}

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPercentage(value: number, isAr: boolean): string {
  const formatted = Math.abs(value).toFixed(2);
  return isAr ? `${formatted}%` : `${formatted}%`;
}

function getOwnerTypeIcon(ownerType: string) {
  switch (ownerType) {
    case 'Government':
      return <Building2 className="w-4 h-4" />;
    case 'Institution':
      return <Briefcase className="w-4 h-4" />;
    case 'Board':
      return <Users className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
}

function getOwnerTypeLabel(ownerType: string, locale: string): string {
  if (locale === 'ar') {
    switch (ownerType) {
      case 'Government':
        return 'حكومي';
      case 'Institution':
        return 'مؤسسة';
      case 'Board':
        return 'مجلس الإدارة';
      default:
        return ownerType;
    }
  }
  return ownerType;
}

export default async function SmartMoneyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  const records = await fetchOwnershipData();
  const summary = calculateSummary(records);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-base)' }}>
      {/* Hero Section */}
      <section
        className="py-16 px-4 sm:px-6 lg:px-8 border-b"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8" style={{ color: 'var(--c-gold)' }} />
            <h1
              className="text-4xl sm:text-5xl font-bold"
              style={{
                fontFamily: 'var(--font-grotesk)',
                color: 'var(--c-text)',
              }}
            >
              {isAr ? 'متتبع الأموال الذكية' : 'Smart Money Tracker'}
            </h1>
          </div>
          <p
            className="text-lg mt-2"
            style={{ color: 'var(--c-muted)' }}
          >
            {isAr
              ? 'تتبع حركات المؤسسات والحكومة والمساهمين الرئيسيين في سوق الأسهم السعودي'
              : 'Track institutional, government, and major shareholder movements in the Saudi stock market'}
          </p>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{ marginBottom: '2rem' }}
          >
            {/* Total Moves Card */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--c-surface)',
                borderColor: 'var(--c-border)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--c-muted)' }}
                >
                  {isAr ? 'إجمالي الحركات' : 'Total Moves'}
                </span>
                <Eye className="w-4 h-4" style={{ color: 'var(--c-gold)' }} />
              </div>
              <p
                className="text-3xl font-bold font-num"
                style={{ color: 'var(--c-text)' }}
              >
                {summary.totalMoves}
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--c-muted)' }}
              >
                {isAr ? 'آخر 30 يوم' : 'Last 30 days'}
              </p>
            </div>

            {/* Net Buying Card */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--c-surface)',
                borderColor: 'var(--c-border)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--c-muted)' }}
                >
                  {isAr ? 'إجمالي الشراء' : 'Net Buying'}
                </span>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--c-green)' }} />
              </div>
              <p
                className="text-3xl font-bold font-num"
                style={{ color: 'var(--c-green)' }}
              >
                {summary.netBuying.toFixed(2)}%
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--c-muted)' }}
              >
                {isAr ? 'إجمالي الحصص المشتراة' : 'Total shares accumulated'}
              </p>
            </div>

            {/* Net Selling Card */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--c-surface)',
                borderColor: 'var(--c-border)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--c-muted)' }}
                >
                  {isAr ? 'إجمالي البيع' : 'Net Selling'}
                </span>
                <TrendingDown className="w-4 h-4" style={{ color: 'var(--c-red)' }} />
              </div>
              <p
                className="text-3xl font-bold font-num"
                style={{ color: 'var(--c-red)' }}
              >
                {summary.netSelling.toFixed(2)}%
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--c-muted)' }}
              >
                {isAr ? 'إجمالي الحصص المباعة' : 'Total shares distributed'}
              </p>
            </div>

            {/* Smart Signal Card */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--c-surface)',
                borderColor: 'var(--c-border)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--c-muted)' }}
                >
                  {isAr ? 'الإشارة الذكية' : 'Smart Signal'}
                </span>
                <Eye className="w-4 h-4" style={{ color: 'var(--c-gold)' }} />
              </div>
              <p
                className="text-2xl font-bold font-num"
                style={{
                  color:
                    summary.netBuying > summary.netSelling
                      ? 'var(--c-green)'
                      : 'var(--c-red)',
                }}
              >
                {summary.netBuying > summary.netSelling
                  ? isAr
                    ? 'شراء'
                    : 'BUY'
                  : isAr
                    ? 'بيع'
                    : 'SELL'}
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: 'var(--c-muted)' }}
              >
                {isAr ? 'بناءً على الحركات الأخيرة' : 'Based on recent moves'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notable Moves Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl font-bold mb-6"
            style={{
              fontFamily: 'var(--font-grotesk)',
              color: 'var(--c-text)',
            }}
          >
            {isAr ? 'الحركات الملحوظة' : 'Notable Moves'}
          </h2>

          <div
            className="overflow-x-auto rounded-lg border"
            style={{
              backgroundColor: 'var(--c-surface)',
              borderColor: 'var(--c-border)',
            }}
          >
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--c-border)' }}
                >
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'الشركة' : 'Company'}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'المالك' : 'Owner'}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'النوع' : 'Type'}
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'التغير' : 'Change'}
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'السابق → الجديد' : 'Previous → New'}
                  </th>
                  <th
                    className="px-6 py-4 text-right text-sm font-semibold"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'التاريخ' : 'Date'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((record) => {
                  const change = record.percentage - record.previous_percentage;
                  const isPositive = change > 0;

                  return (
                    <tr
                      key={record.id}
                      className="border-b hover:opacity-70 transition-opacity"
                      style={{ borderColor: 'var(--c-border)' }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: 'var(--c-text)' }}
                          >
                            {record.company?.[isAr ? 'name_ar' : 'name_en'] ||
                              'N/A'}
                          </p>
                          <p
                            className="text-xs font-mono"
                            style={{ color: 'var(--c-muted)' }}
                          >
                            {record.company?.ticker || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ color: 'var(--c-text)' }}
                      >
                        {record.owner_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getOwnerTypeIcon(record.owner_type)}
                          <span style={{ color: 'var(--c-muted)' }}>
                            {getOwnerTypeLabel(record.owner_type, locale)}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-right font-num font-semibold"
                        style={{
                          color: isPositive ? 'var(--c-green)' : 'var(--c-red)',
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                          {formatPercentage(change, isAr)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-right font-num"
                        style={{ color: 'var(--c-muted)' }}
                      >
                        {record.previous_percentage.toFixed(2)}% →{' '}
                        {record.percentage.toFixed(2)}%
                      </td>
                      <td
                        className="px-6 py-4 text-right text-sm"
                        style={{ color: 'var(--c-muted)' }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(record.change_date, locale)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {records.length === 0 && (
              <div className="p-12 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p style={{ color: 'var(--c-muted)' }}>
                  {isAr
                    ? 'لا توجد حركات ملحوظة في الفترة الأخيرة'
                    : 'No notable moves in the recent period'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Top Accumulated & Distributed */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Accumulated */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--c-green)' }} />
                <h3
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-grotesk)',
                    color: 'var(--c-text)',
                  }}
                >
                  {isAr ? 'الأكثر تراكماً' : 'Top Accumulated'}
                </h3>
              </div>

              {summary.mostAccumulated ? (
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'الحصة الأعلى' : 'Highest Share'}
                  </p>
                  <p
                    className="text-2xl font-bold mt-2"
                    style={{ color: 'var(--c-text)' }}
                  >
                    {summary.mostAccumulated.ticker}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {summary.mostAccumulated.name}
                  </p>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--c-muted)' }}
                    >
                      {isAr ? 'إجمالي التراكم' : 'Total Accumulated'}
                    </p>
                    <p
                      className="text-3xl font-bold font-num mt-1"
                      style={{ color: 'var(--c-green)' }}
                    >
                      +{summary.mostAccumulated.totalChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="p-6 rounded-lg border text-center"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <p style={{ color: 'var(--c-muted)' }}>
                    {isAr ? 'لا توجد بيانات' : 'No data'}
                  </p>
                </div>
              )}
            </div>

            {/* Top Distributed */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="w-5 h-5" style={{ color: 'var(--c-red)' }} />
                <h3
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-grotesk)',
                    color: 'var(--c-text)',
                  }}
                >
                  {isAr ? 'الأكثر توزيعاً' : 'Top Distributed'}
                </h3>
              </div>

              {summary.mostDistributed ? (
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {isAr ? 'الحصة الأعلى' : 'Highest Share'}
                  </p>
                  <p
                    className="text-2xl font-bold mt-2"
                    style={{ color: 'var(--c-text)' }}
                  >
                    {summary.mostDistributed.ticker}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--c-muted)' }}
                  >
                    {summary.mostDistributed.name}
                  </p>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--c-muted)' }}
                    >
                      {isAr ? 'إجمالي التوزيع' : 'Total Distributed'}
                    </p>
                    <p
                      className="text-3xl font-bold font-num mt-1"
                      style={{ color: 'var(--c-red)' }}
                    >
                      -{summary.mostDistributed.totalChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="p-6 rounded-lg border text-center"
                  style={{
                    backgroundColor: 'var(--c-surface)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <p style={{ color: 'var(--c-muted)' }}>
                    {isAr ? 'لا توجد بيانات' : 'No data'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
