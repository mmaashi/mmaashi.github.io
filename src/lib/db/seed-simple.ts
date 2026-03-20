// Simple seed for companies table
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fszmvnmfazgjhsrbbpvx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const companies = [
  { ticker: '2222', symbol: '2222.SR', name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2082', symbol: '2082.SR', name_en: 'ACWA Power', name_ar: 'أكوا باور', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '1120', symbol: '1120.SR', name_en: 'Al Rajhi Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1180', symbol: '1180.SR', name_en: 'Saudi National Bank (SNB)', name_ar: 'البنك الأهلي السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1010', symbol: '1010.SR', name_en: 'Riyad Bank', name_ar: 'بنك الرياض', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1050', symbol: '1050.SR', name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك السعودي البريطاني', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1150', symbol: '1150.SR', name_en: 'Alinma Bank', name_ar: 'مصرف الإنماء', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1140', symbol: '1140.SR', name_en: 'Bank AlBilad', name_ar: 'بنك البلاد', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1020', symbol: '1020.SR', name_en: 'Bank AlJazira', name_ar: 'بنك الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '2010', symbol: '2010.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2090', symbol: '2090.SR', name_en: 'SAMI', name_ar: 'سامكري', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2020', symbol: '2020.SR', name_en: 'Saudi Basic Industries', name_ar: 'الصناعات الأساسية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3010', symbol: '3010.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food Products', market: 'main', is_shariah_compliant: true },
  { ticker: '2280', symbol: '2280.SR', name_en: 'Nahdi', name_ar: 'نمدي', sector: 'Consumer Retail', market: 'main', is_shariah_compliant: true },
  { ticker: '4000', symbol: '4000.SR', name_en: 'Jarir Bookstore', name_ar: 'جرير', sector: 'Consumer Retail', market: 'main', is_shariah_compliant: true },
  { ticker: '4290', symbol: '4290.SR', name_en: 'Aldrees Petroleum', name_ar: 'الدرع', sector: 'Consumer Retail', market: 'main', is_shariah_compliant: true },
  { ticker: '1830', symbol: '1830.SR', name_en: 'Al Rajhi REIT', name_ar: 'صكوك الراجحي', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4320', symbol: '4320.SR', name_en: 'Emaar The Economic City', name_ar: 'مدينة الاقتصادية', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '1810', symbol: '1810.SR', name_en: 'Sabic Agri-Nutrients', name_ar: 'سابك للنواتج الزراعية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2040', symbol: '2040.SR', name_en: 'Sahara Petrochemicals', name_ar: 'بترو رابغ', sector: 'Materials', market: 'main', is_shariah_compliant: true },
]

async function seed() {
  console.log('Seeding companies...')
  
  for (const company of companies) {
    const { error } = await supabase.from('companies').insert(company)
    if (error) {
      console.log(`❌ ${company.ticker} ${company.name_en}: ${error.message}`)
    } else {
      console.log(`✅ ${company.ticker} ${company.name_en}`)
    }
  }
  
  console.log('\nDone!')
}

seed()
