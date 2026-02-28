// scripts/seed-ipos.ts
// Seed IPO data
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

const ipos = [
  // Completed IPOs 2023-2024
  { company_name_en: 'Saudi Arabian Oil Company (Aramco)', company_name_ar: 'أرامكو السعودية', sector: 'Energy', expected_date: null, subscription_start: '2019-11-03', subscription_end: '2019-11-17', price_range_low: 30, price_range_high: 32, status: 'completed', source_url: 'https://www.saudiexchange.com/aramco-ipo' },
  { company_name_en: 'Saudi Telecom Company (STC)', company_name_ar: 'الاتصالات السعودية', sector: 'Telecommunication', expected_date: null, subscription_start: '2003-06-01', subscription_end: '2003-06-15', price_range_low: 10, price_range_high: 12, status: 'completed', source_url: 'https://www.saudiexchange.com/stc-ipo' },
  { company_name_en: 'Riyad Bank', company_name_ar: 'مصرف الرياض', sector: 'Banks', expected_date: null, subscription_start: '2007-11-01', subscription_end: '2007-11-15', price_range_low: 25, price_range_high: 30, status: 'completed', source_url: 'https://www.saudiexchange.com/riyad-ipo' },
  { company_name_en: 'Al Rajhi Bank', company_name_ar: 'مصرف الراجحي', sector: 'Banks', expected_date: null, subscription_start: '2008-04-01', subscription_end: '2008-04-15', price_range_low: 45, price_range_high: 52, status: 'completed', source_url: 'https://www.saudiexchange.com/alrajhi-ipo' },
  { company_name_en: 'Saudi National Bank', company_name_ar: 'البنك الأهلي السعودي', sector: 'Banks', expected_date: null, subscription_start: '2021-09-01', subscription_end: '2021-09-10', price_range_low: 50, price_range_high: 54, status: 'completed', source_url: 'https://www.saudiexchange.com/snb-ipo' },
  { company_name_en: 'ACWA Power', company_name_ar: 'أكوا باور', sector: 'Energy', expected_date: null, subscription_start: '2021-10-01', subscription_end: '2021-10-10', price_range_low: 52, price_range_high: 56, status: 'completed', source_url: 'https://www.saudiexchange.com/acwa-ipo' },
  { company_name_en: 'Saudi Arabian Mining Company (Maaden)', company_name_ar: 'معادن', sector: 'Materials', expected_date: null, subscription_start: '2022-05-01', subscription_end: '2022-05-10', price_range_low: 40, price_range_high: 45, status: 'completed', source_url: 'https://www.saudiexchange.com/maaden-ipo' },
  { company_name_en: 'Elm Company', company_name_ar: 'شركة علم', sector: 'Software & Services', expected_date: null, subscription_start: '2022-08-01', subscription_end: '2022-08-10', price_range_low: 120, price_range_high: 130, status: 'completed', source_url: 'https://www.saudiexchange.com/elm-ipo' },
  { company_name_en: 'Alinma Bank', company_name_ar: 'مصرف الإنماء', sector: 'Banks', expected_date: null, subscription_start: '2009-04-01', subscription_end: '2009-04-15', price_range_low: 15, price_range_high: 18, status: 'completed', source_url: 'https://www.saudiexchange.com/alinma-ipo' },
  { company_name_en: 'AlBilad Bank', company_name_ar: 'مصرف البلاد', sector: 'Banks', expected_date: null, subscription_start: '2009-10-01', subscription_end: '2009-10-15', price_range_low: 20, price_range_high: 25, status: 'completed', source_url: 'https://www.saudiexchange.com/albilad-ipo' },
  
  // Upcoming/Active IPOs
  { company_name_en: 'Saudi Arabian Oil Company (Secondary)', company_name_ar: 'أرامكو (الطرح الثاني)', sector: 'Energy', expected_date: '2026-06-01', subscription_start: null, subscription_end: null, price_range_low: null, price_range_high: null, status: 'upcoming', source_url: 'https://www.saudiexchange.com/aramco-secondary' },
  { company_name_en: 'Saudi Arabian Oil Company (Third)', company_name_ar: 'أرامكو (الطرح الثالث)', sector: 'Energy', expected_date: '2027-01-01', subscription_start: null, subscription_end: null, price_range_low: null, price_range_high: null, status: 'upcoming', source_url: 'https://www.saudiexchange.com/aramco-third' },
  { company_name_en: 'NEOM Company', company_name_ar: 'شركة نيوم', sector: 'Real Estate', expected_date: '2026-12-01', subscription_start: null, subscription_end: null, price_range_low: null, price_range_high: null, status: 'upcoming', source_url: 'https://www.saudiexchange.com/neom-ipo' },
  { company_name_en: 'Qiddiya Company', company_name_ar: 'شركة القدية', sector: 'Entertainment', expected_date: '2027-06-01', subscription_start: null, subscription_end: null, price_range_low: null, price_range_high: null, status: 'upcoming', source_url: 'https://www.saudiexchange.com/qiddiya-ipo' },
]

async function seedIPOs() {
  console.log(`📊 Seeding ${ipos.length} IPO records...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const ipo of ipos) {
    const { error } = await supabase.from('ipos').insert(ipo)
    
    if (error) {
      if (error.code === '23505') {
        console.log(`⏭️ Skip: ${ipo.company_name_en} (already exists)`)
      } else {
        console.log(`❌ ${ipo.company_name_en}: ${error.message}`)
        errorCount++
      }
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} IPOs seeded`)
  console.log(`❌ Errors: ${errorCount}`)
  
  const { count } = await supabase
    .from('ipos')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total IPOs in DB: ${count}`)
}

seedIPOs().catch(console.error)
