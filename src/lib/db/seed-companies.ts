/**
 * Seed top 50 Saudi companies by market cap into Supabase.
 *
 * Usage: npx tsx src/lib/db/seed-companies.ts
 *
 * Data sourced from Tadawul (Saudi Exchange) as of Feb 2026.
 */

import { createClient } from '@supabase/supabase-js'

// Load env from .env.local when running as script
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fszmvnmfazgjhsrbbpvx.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Run with:')
  console.error('   source .env.local && npx tsx src/lib/db/seed-companies.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type CompanySeed = {
  ticker: string
  symbol: string
  name_en: string
  name_ar: string
  sector: string
  market: 'main' | 'nomu'
  is_shariah_compliant: boolean
}

const COMPANIES: CompanySeed[] = [
  // === Energy ===
  { ticker: '2222', symbol: '2222.SR', name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2082', symbol: '2082.SR', name_en: 'ACWA Power', name_ar: 'أكوا باور', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '4030', symbol: '4030.SR', name_en: 'Al Baha Investment & Development', name_ar: 'الباحة', sector: 'Energy', market: 'main', is_shariah_compliant: true },

  // === Banks ===
  { ticker: '1120', symbol: '1120.SR', name_en: 'Al Rajhi Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1180', symbol: '1180.SR', name_en: 'Saudi National Bank (SNB)', name_ar: 'البنك الأهلي السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1010', symbol: '1010.SR', name_en: 'Riyad Bank', name_ar: 'بنك الرياض', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1050', symbol: '1050.SR', name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك السعودي البريطاني', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1060', symbol: '1060.SR', name_en: 'Saudi Investment Bank', name_ar: 'البنك السعودي للاستثمار', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1080', symbol: '1080.SR', name_en: 'Arab National Bank', name_ar: 'البنك العربي الوطني', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1150', symbol: '1150.SR', name_en: 'Alinma Bank', name_ar: 'مصرف الإنماء', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1140', symbol: '1140.SR', name_en: 'Bank AlBilad', name_ar: 'بنك البلاد', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1020', symbol: '1020.SR', name_en: 'Bank AlJazira', name_ar: 'بنك الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },

  // === Materials ===
  { ticker: '2010', symbol: '2010.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '1211', symbol: '1211.SR', name_en: 'Saudi Arabian Mining (Ma\'aden)', name_ar: 'التعدين العربية السعودية (معادن)', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2060', symbol: '2060.SR', name_en: 'National Industrialization (Tasnee)', name_ar: 'التصنيع الوطنية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2290', symbol: '2290.SR', name_en: 'Yanbu National Petrochemical (Yansab)', name_ar: 'ينساب', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2350', symbol: '2350.SR', name_en: 'Saudi Kayan', name_ar: 'كيان السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '1320', symbol: '1320.SR', name_en: 'Saudi Steel Pipes', name_ar: 'الأنابيب السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3010', symbol: '3010.SR', name_en: 'Arabian Cement', name_ar: 'أسمنت العربية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3020', symbol: '3020.SR', name_en: 'Yamama Cement', name_ar: 'أسمنت اليمامة', sector: 'Materials', market: 'main', is_shariah_compliant: true },

  // === Telecom ===
  { ticker: '7010', symbol: '7010.SR', name_en: 'Saudi Telecom (stc)', name_ar: 'الاتصالات السعودية', sector: 'Telecommunication Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7020', symbol: '7020.SR', name_en: 'Etihad Etisalat (Mobily)', name_ar: 'اتحاد اتصالات', sector: 'Telecommunication Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7030', symbol: '7030.SR', name_en: 'Zain KSA', name_ar: 'زين السعودية', sector: 'Telecommunication Services', market: 'main', is_shariah_compliant: true },

  // === Retail ===
  { ticker: '4190', symbol: '4190.SR', name_en: 'Jarir Marketing', name_ar: 'جرير', sector: 'Consumer Discretionary', market: 'main', is_shariah_compliant: true },
  { ticker: '4003', symbol: '4003.SR', name_en: 'Extra (United Electronics)', name_ar: 'إكسترا', sector: 'Consumer Discretionary', market: 'main', is_shariah_compliant: true },
  { ticker: '4006', symbol: '4006.SR', name_en: 'Fawaz Abdulaziz Al Hokair (Al Hokair)', name_ar: 'الحكير', sector: 'Consumer Discretionary', market: 'main', is_shariah_compliant: true },
  { ticker: '4001', symbol: '4001.SR', name_en: 'Abdullah Al Othaim Markets', name_ar: 'أسواق عبدالله العثيم', sector: 'Consumer Staples', market: 'main', is_shariah_compliant: true },
  { ticker: '4180', symbol: '4180.SR', name_en: 'Fitaihi Holding', name_ar: 'مجموعة فتيحي', sector: 'Consumer Discretionary', market: 'main', is_shariah_compliant: true },

  // === Food & Beverage ===
  { ticker: '2280', symbol: '2280.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2050', symbol: '2050.SR', name_en: 'Savola Group', name_ar: 'مجموعة صافولا', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '6001', symbol: '6001.SR', name_en: 'Halwani Brothers', name_ar: 'حلواني إخوان', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },

  // === Healthcare ===
  { ticker: '4002', symbol: '4002.SR', name_en: 'Mouwasat Medical Services', name_ar: 'المواساة', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4004', symbol: '4004.SR', name_en: 'Dallah Healthcare', name_ar: 'دله الصحية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4005', symbol: '4005.SR', name_en: 'National Medical Care (Care)', name_ar: 'الرعاية الطبية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },

  // === Real Estate ===
  { ticker: '4300', symbol: '4300.SR', name_en: 'Dar Al Arkan', name_ar: 'دار الأركان', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4310', symbol: '4310.SR', name_en: 'Knowledge Economic City (KEC)', name_ar: 'مدينة المعرفة', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4020', symbol: '4020.SR', name_en: 'Saudi Real Estate', name_ar: 'العقارية السعودية', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },

  // === Insurance ===
  { ticker: '8010', symbol: '8010.SR', name_en: 'Bupa Arabia', name_ar: 'بوبا العربية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8200', symbol: '8200.SR', name_en: 'Saudi Re (Cooperative Reinsurance)', name_ar: 'إعادة التأمين السعودية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8030', symbol: '8030.SR', name_en: 'Medgulf Insurance', name_ar: 'ميدغلف للتأمين', sector: 'Insurance', market: 'main', is_shariah_compliant: true },

  // === Utilities ===
  { ticker: '5110', symbol: '5110.SR', name_en: 'Saudi Electricity Company', name_ar: 'الشركة السعودية للكهرباء', sector: 'Utilities', market: 'main', is_shariah_compliant: false },

  // === Transportation ===
  { ticker: '4031', symbol: '4031.SR', name_en: 'Saudi Airlines Catering', name_ar: 'سعودي كيترنغ', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '4040', symbol: '4040.SR', name_en: 'Saudi Ground Services', name_ar: 'الخدمات الأرضية', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '4261', symbol: '4261.SR', name_en: 'Budget Saudi Arabia', name_ar: 'بدجت السعودية', sector: 'Transportation', market: 'main', is_shariah_compliant: true },

  // === Media & Entertainment ===
  { ticker: '4070', symbol: '4070.SR', name_en: 'Tihama Advertising', name_ar: 'تهامة للإعلان', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },

  // === Capital Goods ===
  { ticker: '2030', symbol: '2030.SR', name_en: 'Saudi Arabian Fertilizers (SAFCO)', name_ar: 'الأسمدة العربية السعودية (سافكو)', sector: 'Materials', market: 'main', is_shariah_compliant: true },

  // === Technology ===
  { ticker: '7200', symbol: '7200.SR', name_en: 'Elm Company', name_ar: 'شركة علم', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7203', symbol: '7203.SR', name_en: 'Solutions by STC', name_ar: 'حلول إس تي سي', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },

  // === Diversified ===
  { ticker: '2380', symbol: '2380.SR', name_en: 'Rabigh Refining (Petro Rabigh)', name_ar: 'بترو رابغ', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2170', symbol: '2170.SR', name_en: 'Alujain Corporation', name_ar: 'اللجين', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2310', symbol: '2310.SR', name_en: 'Saudi International Petrochemical (Sipchem)', name_ar: 'سبكيم العالمية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
]

async function seed() {
  console.log(`🌱 Seeding ${COMPANIES.length} Saudi companies into SŪQAI...`)
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`)

  let inserted = 0
  let updated = 0
  let errors = 0

  for (const company of COMPANIES) {
    const { error, status } = await supabase
      .from('companies')
      .upsert(
        {
          ticker: company.ticker,
          symbol: company.symbol,
          name_en: company.name_en,
          name_ar: company.name_ar,
          name_zh: null,
          sector: company.sector,
          sub_sector: null,
          market: company.market,
          is_shariah_compliant: company.is_shariah_compliant,
          vision_2030_score: null,
          logo_url: null,
          description_ar: null,
          description_en: null,
          description_zh: null,
        },
        { onConflict: 'ticker' }
      )

    if (error) {
      console.error(`  ❌ ${company.ticker} ${company.name_en}: ${error.message}`)
      errors++
    } else if (status === 201) {
      console.log(`  ✅ ${company.ticker} ${company.name_en}`)
      inserted++
    } else {
      console.log(`  🔄 ${company.ticker} ${company.name_en} (updated)`)
      updated++
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`   Inserted: ${inserted}`)
  console.log(`   Updated:  ${updated}`)
  console.log(`   Errors:   ${errors}`)
  console.log(`   Total:    ${COMPANIES.length}`)
}

seed()
  .then(() => {
    console.log('\n✅ Seed complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  })
