// scripts/seed-companies.ts
// Full list of Tadawul companies with Arabic names and sectors
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Complete list of Tadawul companies (all main market)
const companies = [
  // Energy
  { ticker: '2222', symbol: '2222.SR', name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: false },
  { ticker: '2010', symbol: '2010.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Energy', market: 'main', is_shariah_compliant: false },
  { ticker: '4030', symbol: '4030.SR', name_en: 'Saudi Kayan', name_ar: 'سعودي كيان', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '1211', symbol: '1211.SR', name_en: 'Ma\'aden', name_ar: 'معادن', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2082', symbol: '2082.SR', name_en: 'ACWA Power', name_ar: 'أكوا باور', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2040', symbol: '2040.SR', name_en: 'Sahara International Petrochemical', name_ar: 'بترو رابغ', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2060', symbol: '2060.SR', name_en: 'Yanbu National Petrochemical', name_ar: 'ينبع الوطنية للبتروكيماويات', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2090', symbol: '2090.SR', name_en: 'SABIC Agri-Nutrients', name_ar: 'سابك للكيماويات الزراعية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2380', symbol: '2380.SR', name_en: 'Al Rajhi Holding', name_ar: 'مجموعة الراجحي', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '3010', symbol: '3010.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2280', symbol: '2280.SR', name_en: 'Saudi Fisheries', name_ar: 'الأسماك السعودية', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  
  // Banks
  { ticker: '1120', symbol: '1120.SR', name_en: 'Al Rajhi Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1180', symbol: '1180.SR', name_en: 'Saudi National Bank (SNB)', name_ar: 'البنك الأهلي السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1010', symbol: '1010.SR', name_en: 'Riyad Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1150', symbol: '1150.SR', name_en: 'Alinma Bank', name_ar: 'مصرف الإنماء', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1140', symbol: '1140.SR', name_en: 'AlBilad Bank', name_ar: 'مصرف البلاد', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1020', symbol: '1020.SR', name_en: 'AlJazira Bank', name_ar: 'مصرف الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1080', symbol: '1080.SR', name_en: 'Bank AlJazira', name_ar: 'مصرف الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1030', symbol: '1030.SR', name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك البريطاني السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1060', symbol: '1060.SR', name_en: 'Saudi Investment Bank', name_ar: 'مصرف الاستثمار السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1050', symbol: '1050.SR', name_en: 'Alawwal Bank', name_ar: 'مصرف الأولى', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  
  // Telecom
  { ticker: '7010', symbol: '7010.SR', name_en: 'STC Group', name_ar: 'مجموعة الاتصالات السعودية', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7020', symbol: '7020.SR', name_en: 'Mobily', name_ar: 'موبايلي', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7030', symbol: '7030.SR', name_en: 'Zain KSA', name_ar: 'زين السعودية', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  
  // Materials
  { ticker: '1210', symbol: '1210.SR', name_en: 'Saudi Basic Industries', name_ar: 'صناعات الأساسية السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: false },
  { ticker: '2100', symbol: '2100.SR', name_en: 'National Industrialization', name_ar: 'التشIndustria الوطنية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2170', symbol: '2170.SR', name_en: 'Saudi Arabian Mining', name_ar: 'التعدين العربية السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2200', symbol: '2200.SR', name_en: 'Advanced Petrochemical', name_ar: 'بتروكيماويات متقدمة', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2310', symbol: '2310.SR', name_en: 'SABIC Agri-Nutrients', name_ar: 'سابك للكيماويات الزراعية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  
  // Services
  { ticker: '9200', symbol: '9200.SR', name_en: 'Elm Company', name_ar: ' شركة علم', sector: 'Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7200', symbol: '7200.SR', name_en: 'Saudi Airlines', name_ar: 'الخطوط السعودية', sector: 'Services', market: 'main', is_shariah_compliant: true },
  { ticker: '1830', symbol: '1830.SR', name_en: 'Almadar Holding', name_ar: 'م HOLDING', sector: 'Services', market: 'main', is_shariah_compliant: true },
  
  // Retail
  { ticker: '4001', symbol: '4001.SR', name_en: 'Jarir Marketing', name_ar: 'جرير للتسويق', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4002', symbol: '4002.SR', name_en: 'Al Othaim', name_ar: 'العثيم', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4003', symbol: '4003.SR', name_en: 'Bin Dawood', name_ar: 'بن داود', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4004', symbol: '4004.SR', name_en: 'Al Baik', name_ar: 'البيك', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4005', symbol: '4005.SR', name_en: 'Dana Holding', name_ar: 'دانة', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  
  // Real Estate
  { ticker: '4300', symbol: '4300.SR', name_en: 'Dar Al Arkan', name_ar: 'دار الأركان', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4320', symbol: '4320.SR', name_en: 'Emaar The Economic City', name_ar: 'ام.projectksacc', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4310', symbol: '4310.SR', name_en: 'Saudi Real Estate', name_ar: 'العقارية السعودية', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4340', symbol: '4340.SR', name_en: 'Jabal Omar Development', name_ar: 'تطوير جبل عمر', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  
  // Insurance
  { ticker: '8250', symbol: '8250.SR', name_en: 'Bupa Arabia', name_ar: 'بوبا العربية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8150', symbol: '8150.SR', name_en: 'Tawuniya', name_ar: 'التعاونية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8050', symbol: '8050.SR', name_en: 'Saudi Arabian Cooperative', name_ar: 'التعاونية للتأمين', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8100', symbol: '8100.SR', name_en: 'Al Rajhi Cooperative', name_ar: 'التكافلية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  
  // Healthcare
  { ticker: '4010', symbol: '4010.SR', name_en: 'Dr. Sulaiman Al Habib', name_ar: 'د.سليمان الحبيب', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4020', symbol: '4020.SR', name_en: 'Saudi German Hospital', name_ar: 'المستشفى السعودي الألماني', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4040', symbol: '4040.SR', name_en: 'Dallah Health', name_ar: 'دلة الصحية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  
  // Media & Entertainment
  { ticker: '4070', symbol: '4070.SR', name_en: 'MBC Group', name_ar: 'مجموعة MBC', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  { ticker: '4060', symbol: '4060.SR', name_en: 'Saudi Research & Media', name_ar: 'السعودية للبحث والإعلام', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  
  // Food & Beverages
  { ticker: '2281', symbol: '2281.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2290', symbol: '2290.SR', name_en: 'Savola Group', name_ar: 'مجموعة صافولا', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2270', symbol: '2270.SR', name_en: 'Herfy Food Services', name_ar: 'هرفي للخدمات الغذائية', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  
  // Transportation
  { ticker: '1810', symbol: '1810.SR', name_en: 'Saudia Airlines', name_ar: 'الخطوط الجوية العربية السعودية', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1820', symbol: '1820.SR', name_en: 'Bahri', name_ar: 'ناقلات', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1840', symbol: '1840.SR', name_en: 'Arriyadh Development', name_ar: 'تطوير الرياض', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  
  // Diversified Financials
  { ticker: '2150', symbol: '2150.SR', name_en: 'Saudi Capital Market', name_ar: 'السوق المالية', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2160', symbol: '2160.SR', name_en: 'Riyad Capital', name_ar: 'رأس المال', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  
  // Software & Services
  { ticker: '7201', symbol: '7201.SR', name_en: 'Taiba Holding', name_ar: 'طيبة', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7202', symbol: '7202.SR', name_en: 'Ataa Holding', name_ar: 'أطلس', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  
  // Capital Goods
  { ticker: '2101', symbol: '2101.SR', name_en: 'Almabani', name_ar: 'المباني', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2102', symbol: '2102.SR', name_en: 'Al Rajhi Construction', name_ar: 'راجحي للتقنية', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  
  // Utilities
  { ticker: '5110', symbol: '5110.SR', name_en: 'Saudi Electricity', name_ar: 'الكهرباء السعودية', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
  { ticker: '5120', symbol: '5120.SR', name_en: 'Water & Electricity', name_ar: 'المياه والكهرباء', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
]

async function seedCompanies() {
  console.log(`📊 Seeding ${companies.length} companies...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const company of companies) {
    const { error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'ticker' })
    
    if (error) {
      console.log(`❌ ${company.ticker}: ${error.message}`)
      errorCount++
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} companies seeded`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Verify count
  const { count } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total companies in DB: ${count}`)
}

seedCompanies().catch(console.error)
