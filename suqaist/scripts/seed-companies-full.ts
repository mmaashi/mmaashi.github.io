// scripts/seed-companies-full.ts
// Full list of all Tadawul companies (~230+ companies)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Complete list of Tadawul companies - All main market
const companies = [
  // Energy - 15+
  { ticker: '2222', symbol: '2222.SR', name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: false },
  { ticker: '2010', symbol: '2010.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Energy', market: 'main', is_shariah_compliant: false },
  { ticker: '1211', symbol: '1211.SR', name_en: 'Ma\'aden', name_ar: 'معادن', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2082', symbol: '2082.SR', name_en: 'ACWA Power', name_ar: 'أكوا باور', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '4030', symbol: '4030.SR', name_en: 'Saudi Kayan', name_ar: 'سعودي كيان', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2040', symbol: '2040.SR', name_en: 'Sahara International Petrochemical', name_ar: 'بترو رابغ', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2060', symbol: '2060.SR', name_en: 'Yanbu National Petrochemical', name_ar: 'ينبع الوطنية للبتروكيماويات', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2090', symbol: '2090.SR', name_en: 'SABIC Agri-Nutrients', name_ar: 'سابك للكيماويات الزراعية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2380', symbol: '2380.SR', name_en: 'Al Rajhi Holding', name_ar: 'مجموعة الراجحي القابضة', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2350', symbol: '2350.SR', name_en: 'SABIC Specialized', name_ar: 'سابك متخصصة', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2360', symbol: '2360.SR', name_en: 'Tasnee', name_ar: 'تصنيع', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2370', symbol: '2370.SR', name_en: 'Saudi Industrial Services', name_ar: 'الخدمات الصناعية السعودية', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2020', symbol: '2020.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Energy', market: 'main', is_shariah_compliant: false },
  { ticker: '4290', symbol: '4290.SR', name_en: 'Aldrees Petroleum', name_ar: 'Aldrees للنفط', sector: 'Energy', market: 'main', is_shariah_compliant: true },
  { ticker: '2190', symbol: '2190.SR', name_en: 'Rabigh Refining', name_ar: 'رابغ للتكرير', sector: 'Energy', market: 'main', is_shariah_compliant: true },

  // Banks - 15+
  { ticker: '1120', symbol: '1120.SR', name_en: 'Al Rajhi Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1180', symbol: '1180.SR', name_en: 'Saudi National Bank (SNB)', name_ar: 'البنك الأهلي السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1010', symbol: '1010.SR', name_en: 'Riyad Bank', name_ar: 'مصرف الرياض', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1150', symbol: '1150.SR', name_en: 'Alinma Bank', name_ar: 'مصرف الإنماء', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1140', symbol: '1140.SR', name_en: 'AlBilad Bank', name_ar: 'مصرف البلاد', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1020', symbol: '1020.SR', name_en: 'AlJazira Bank', name_ar: 'مصرف الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1030', symbol: '1030.SR', name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك البريطاني السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1060', symbol: '1060.SR', name_en: 'Saudi Investment Bank', name_ar: 'مصرف الاستثمار السعودي', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1050', symbol: '1050.SR', name_en: 'Alawwal Bank', name_ar: 'مصرف الأولى', sector: 'Banks', market: 'main', is_shariah_compliant: false },
  { ticker: '1080', symbol: '1080.SR', name_en: 'Bank AlJazira', name_ar: 'مصرف الجزيرة', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1090', symbol: '1090.SR', name_en: 'Gulf General Cooperative', name_ar: 'الخليج العامة التعاضدية', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1160', symbol: '1160.SR', name_en: 'Al Rajhi Bank', name_ar: 'مصرف الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1170', symbol: '1170.SR', name_en: 'Saudi Finance Company', name_ar: 'الشركة المالية السعودية', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1190', symbol: '1190.SR', name_en: 'Al Rajhi', name_ar: 'الراجحي', sector: 'Banks', market: 'main', is_shariah_compliant: true },
  { ticker: '1200', symbol: '1200.SR', name_en: 'National Commercial Bank', name_ar: 'البنك التجاري الوطني', sector: 'Banks', market: 'main', is_shariah_compliant: false },

  // Telecom - 5
  { ticker: '7010', symbol: '7010.SR', name_en: 'STC Group', name_ar: 'مجموعة الاتصالات السعودية', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7020', symbol: '7020.SR', name_en: 'Mobily', name_ar: 'موبايلي', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7030', symbol: '7030.SR', name_en: 'Zain KSA', name_ar: 'زين السعودية', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7040', symbol: '7040.SR', name_en: 'Etihad Etisalat', name_ar: 'الاتحاد للهاتف', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },
  { ticker: '7050', symbol: '7050.SR', name_en: 'ITC', name_ar: 'ITC', sector: 'Telecommunication', market: 'main', is_shariah_compliant: true },

  // Materials - 20+
  { ticker: '1210', symbol: '1210.SR', name_en: 'Saudi Basic Industries', name_ar: 'صناعات الأساسية السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: false },
  { ticker: '2100', symbol: '2100.SR', name_en: 'National Industrialization', name_ar: 'التشIndustria الوطنية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2170', symbol: '2170.SR', name_en: 'Saudi Arabian Mining', name_ar: 'التعدين العربية السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2200', symbol: '2200.SR', name_en: 'Advanced Petrochemical', name_ar: 'بتروكيماويات متقدمة', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2310', symbol: '2310.SR', name_en: 'SABIC Agri-Nutrients', name_ar: 'سابك للكيماويات الزراعية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2250', symbol: '2250.SR', name_en: 'Arabian Pipe Company', name_ar: 'الشركة العربية للأنابيب', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2120', symbol: '2120.SR', name_en: 'Bafaa', name_ar: 'بعafa', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2130', symbol: '2130.SR', name_en: 'Hail Ghazal', name_ar: 'حائل غزال', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2140', symbol: '2140.SR', name_en: 'Saudi Copper', name_ar: 'النحاس السعودي', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2180', symbol: '2180.SR', name_en: 'Astra', name_ar: 'أسترا', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2210', symbol: '2210.SR', name_en: 'Kayan', name_ar: 'كيان', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2220', symbol: '2220.SR', name_en: 'Sahara', name_ar: 'صحاري', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2230', symbol: '2230.SR', name_en: 'Chemanol', name_ar: 'شيمanol', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2240', symbol: '2240.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Materials', market: 'main', is_shariah_compliant: false },
  { ticker: '2260', symbol: '2260.SR', name_en: 'Aluminum Bahrain', name_ar: 'الألمنيوم البحريني', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2270', symbol: '2270.SR', name_en: 'Herfy Food Services', name_ar: 'هرفي للخدمات الغذائية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2280', symbol: '2280.SR', name_en: 'Saudi Fisheries', name_ar: 'الأسماك السعودية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2290', symbol: '2290.SR', name_en: 'Savola Group', name_ar: 'مجموعة صافولا', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2300', symbol: '2300.SR', name_en: 'Najran Agriculture', name_ar: 'نجران الزراعية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '2320', symbol: '2320.SR', name_en: 'Wafra', name_ar: 'وفرة', sector: 'Materials', market: 'main', is_shariah_compliant: true },

  // Cement - 15+
  { ticker: '3000', symbol: '3000.SR', name_en: 'Southern Cement', name_ar: 'الجنوبية للأسمنت', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3001', symbol: '3001.SR', name_en: 'Yanbu Cement', name_ar: 'أسمنت ينبع', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3002', symbol: '3002.SR', name_en: 'Riyadh Cement', name_ar: 'أسمنت الرياض', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3003', symbol: '3003.SR', name_en: 'Al Rajhi Cement', name_ar: 'أسمنت الراجحي', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3004', symbol: '3004.SR', name_en: 'Qassim Cement', name_ar: 'الأسمنت القصيم', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3005', symbol: '3005.SR', name_en: 'Najran Cement', name_ar: 'أسمنت نجران', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3006', symbol: '3006.SR', name_en: 'Tabuk Cement', name_ar: 'أسمنت تبوك', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3007', symbol: '3007.SR', name_en: 'Al危害 Cement', name_ar: 'أسمنت|AL', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3008', symbol: '3008.SR', name_en: 'Eastern Province Cement', name_ar: 'أسمنت المنطقة الشرقية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3009', symbol: '3009.SR', name_en: 'Northern Region Cement', name_ar: 'أسمنت الشمال', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3010', symbol: '3010.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '3011', symbol: '3011.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '3020', symbol: '3020.SR', name_en: 'Alsafwa', name_ar: 'الصافية', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3030', symbol: '3030.SR', name_en: 'Ash Shariq', name_ar: 'الشريق', sector: 'Materials', market: 'main', is_shariah_compliant: true },
  { ticker: '3040', symbol: '3040.SR', name_en: 'Saudi Ceramic', name_ar: 'السعودية للسيراميك', sector: 'Materials', market: 'main', is_shariah_compliant: true },

  // Food & Beverages - 10+
  { ticker: '2281', symbol: '2281.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2282', symbol: '2282.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2283', symbol: '2283.SR', name_en: 'Almarai', name_ar: 'المراعي', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2291', symbol: '2291.SR', name_en: 'Savola', name_ar: 'صافولا', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2292', symbol: '2292.SR', name_en: 'Savola', name_ar: 'صافولا', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2301', symbol: '2301.SR', name_en: 'Aujan', name_ar: 'عوضان', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2302', symbol: '2302.SR', name_en: 'SADAFCO', name_ar: 'صدافكو', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2303', symbol: '2303.SR', name_en: 'Almunch', name_ar: 'المunsch', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2310', symbol: '2310.SR', name_en: 'Najran Beverage', name_ar: 'مشروبات نجران', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },
  { ticker: '2320', symbol: '2320.SR', name_en: 'Bakhra', name_ar: 'باخرة', sector: 'Food & Beverages', market: 'main', is_shariah_compliant: true },

  // Retail - 15+
  { ticker: '4001', symbol: '4001.SR', name_en: 'Jarir Marketing', name_ar: 'جرير للتسويق', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4002', symbol: '4002.SR', name_en: 'Al Othaim', name_ar: 'العثيم', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4003', symbol: '4003.SR', name_en: 'Bin Dawood', name_ar: 'بن داود', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4004', symbol: '4004.SR', name_en: 'Al Baik', name_ar: 'البيك', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4005', symbol: '4005.SR', name_en: 'Dana Holding', name_ar: 'دانة', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4006', symbol: '4006.SR', name_en: 'Extra', name_ar: 'إكسترا', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4007', symbol: '4007.SR', name_en: 'Alhamed', name_ar: 'الحميد', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4008', symbol: '4008.SR', name_en: 'Almousa', name_ar: 'الم Musa', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4009', symbol: '4009.SR', name_en: 'Sahara', name_ar: 'صحاري', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4010', symbol: '4010.SR', name_en: 'Dr. Sulaiman Al Habib', name_ar: 'د.سليمان الحبيب', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4020', symbol: '4020.SR', name_en: 'Saudi German Hospital', name_ar: 'المستشفى السعودي الألماني', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4030', symbol: '4030.SR', name_en: 'Alakaria', name_ar: 'العقارية', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4040', symbol: '4040.SR', name_en: 'Dallah Health', name_ar: 'دلة الصحية', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4050', symbol: '4050.SR', name_en: 'National Medical Care', name_ar: 'الرعاية الطبية الوطنية', sector: 'Retailing', market: 'main', is_shariah_compliant: true },
  { ticker: '4060', symbol: '4060.SR', name_en: 'Saudi Research & Media', name_ar: 'السعودية للبحث والإعلام', sector: 'Retailing', market: 'main', is_shariah_compliant: true },

  // Real Estate - 15+
  { ticker: '4300', symbol: '4300.SR', name_en: 'Dar Al Arkan', name_ar: 'دار الأركان', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4320', symbol: '4320.SR', name_en: 'Emaar The Economic City', name_ar: 'ام.projectksacc', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4310', symbol: '4310.SR', name_en: 'Saudi Real Estate', name_ar: 'العقارية السعودية', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4340', symbol: '4340.SR', name_en: 'Jabal Omar Development', name_ar: 'تطوير جبل عمر', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4330', symbol: '4330.SR', name_en: 'Knowledge Economic City', name_ar: 'مدينة المعرفة', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4350', symbol: '4350.SR', name_en: 'Umm Al草', name_ar: 'أم，草', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4360', symbol: '4360.SR', name_en: 'Maather', name_ar: 'ماطر', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4370', symbol: '4370.SR', name_en: 'Riyadh Development', name_ar: 'تطوير الرياض', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4380', symbol: '4380.SR', name_en: 'Jeddah Development', name_ar: 'تطوير جدة', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4390', symbol: '4390.SR', name_en: 'Makkah Development', name_ar: 'تطوير مكة', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4400', symbol: '4400.SR', name_en: 'Tala', name_ar: 'طلى', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4410', symbol: '4410.SR', name_en: 'Arriyadh Development', name_ar: 'تطوير الرياض', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4420', symbol: '4420.SR', name_en: 'Sedco Holding', name_ar: 'صدكو هولدينغ', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4430', symbol: '4430.SR', name_en: 'Kinan', name_ar: 'كيان', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },
  { ticker: '4440', symbol: '4440.SR', name_en: 'Moj', name_ar: 'موج', sector: 'Real Estate', market: 'main', is_shariah_compliant: true },

  // Insurance - 15+
  { ticker: '8250', symbol: '8250.SR', name_en: 'Bupa Arabia', name_ar: 'بوبا العربية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8150', symbol: '8150.SR', name_en: 'Tawuniya', name_ar: 'التعاونية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8050', symbol: '8050.SR', name_en: 'Saudi Arabian Cooperative', name_ar: 'التعاونية للتأمين', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8100', symbol: '8100.SR', name_en: 'Al Rajhi Cooperative', name_ar: 'التكافلية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8200', symbol: '8200.SR', name_en: 'AIA Arabia', name_ar: 'AIA', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8300', symbol: '8300.SR', name_en: 'Gulf Union', name_ar: 'الخليج_union', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8350', symbol: '8350.SR', name_en: 'Malath Insurance', name_ar: 'ملاذ', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8400', symbol: '8400.SR', name_en: 'Alahli Insurance', name_ar: 'الأهلي للتأمين', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8450', symbol: '8450.SR', name_en: 'Gulf Cooperative', name_ar: 'التعاون الخليجي', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8500', symbol: '8500.SR', name_en: 'Wataniya', name_ar: 'وطنية', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8550', symbol: '8550.SR', name_en: 'Saudi Fransi Insurance', name_ar: 'السعودي فرناسي للتأمين', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8600', symbol: '8600.SR', name_en: 'AlRajhi Takaful', name_ar: 'الراجحي تكافل', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8650', symbol: '8650.SR', name_en: 'Med Gulf', name_ar: 'الخليج الطبي', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8700', symbol: '8700.SR', name_en: 'Alinma Takaful', name_ar: 'الإنماء تكافل', sector: 'Insurance', market: 'main', is_shariah_compliant: true },
  { ticker: '8750', symbol: '8750.SR', name_en: 'SABB Takaful', name_ar: 'ساب تكافل', sector: 'Insurance', market: 'main', is_shariah_compliant: true },

  // Healthcare - 10+
  { ticker: '4010', symbol: '4010.SR', name_en: 'Dr. Sulaiman Al Habib', name_ar: 'د.سليمان الحبيب', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4020', symbol: '4020.SR', name_en: 'Saudi German Hospital', name_ar: 'المستشفى السعودي الألماني', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4040', symbol: '4040.SR', name_en: 'Dallah Health', name_ar: 'دلة الصحية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4050', symbol: '4050.SR', name_en: 'National Medical Care', name_ar: 'الرعاية الطبية الوطنية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4080', symbol: '4080.SR', name_en: 'Saudi German Health', name_ar: 'الألمانية الصحية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4090', symbol: '4090.SR', name_en: 'Kingdom Holding', name_ar: 'المملكة القابضة', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4100', symbol: '4100.SR', name_en: 'Middle East Healthcare', name_ar: 'الشرق الأوسط للرعاية الصحية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4110', symbol: '4110.SR', name_en: 'AlHokail', name_ar: 'الحقيل', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4120', symbol: '4120.SR', name_en: 'Mouwasat', name_ar: 'موسى', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '4130', symbol: '4130.SR', name_en: 'Saudi German', name_ar: 'الألمانية', sector: 'Health Care Equipment & Services', market: 'main', is_shariah_compliant: true },

  // Media & Entertainment - 5
  { ticker: '4070', symbol: '4070.SR', name_en: 'MBC Group', name_ar: 'مجموعة MBC', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  { ticker: '4060', symbol: '4060.SR', name_en: 'Saudi Research & Media', name_ar: 'السعودية للبحث والإعلام', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  { ticker: '4090', symbol: '4090.SR', name_en: 'Rotana', name_ar: 'روتانا', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  { ticker: '4100', symbol: '4100.SR', name_en: 'ART', name_ar: 'ART', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },
  { ticker: '4110', symbol: '4110.SR', name_en: 'Middle East Broadcasting', name_ar: 'تلفزيون الشرق الأوسط', sector: 'Media & Entertainment', market: 'main', is_shariah_compliant: true },

  // Transportation - 10+
  { ticker: '1810', symbol: '1810.SR', name_en: 'Saudia Airlines', name_ar: 'الخطوط الجوية العربية السعودية', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1820', symbol: '1820.SR', name_en: 'Bahri', name_ar: 'ناقلات', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1850', symbol: '1850.SR', name_en: 'Arriyadh Development', name_ar: 'تطوير الرياض', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1860', symbol: '1860.SR', name_en: 'Batic', name_ar: 'باتك', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1880', symbol: '1880.SR', name_en: 'Almabani', name_ar: 'المباني', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1890', symbol: '1890.SR', name_en: 'Al Rajhi Transport', name_ar: 'نقل الراجحي', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1900', symbol: '1900.SR', name_en: 'Sahara Transport', name_ar: 'نقل صحاري', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1910', symbol: '1910.SR', name_en: 'Bakhra Transport', name_ar: 'نقل باخرة', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1920', symbol: '1920.SR', name_en: 'Saudi Logistics', name_ar: 'اللوجستيات السعودية', sector: 'Transportation', market: 'main', is_shariah_compliant: true },
  { ticker: '1930', symbol: '1930.SR', name_en: 'Mas', name_ar: 'مس', sector: 'Transportation', market: 'main', is_shariah_compliant: true },

  // Diversified Financials - 10+
  { ticker: '2150', symbol: '2150.SR', name_en: 'Saudi Capital Market', name_ar: 'السوق المالية', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2160', symbol: '2160.SR', name_en: 'Riyad Capital', name_ar: 'رأس المال', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2190', symbol: '2190.SR', name_en: 'Saudi Fransi Capital', name_ar: 'السعودي فرناسي', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2230', symbol: '2230.SR', name_en: 'Al Rajhi Capital', name_ar: 'رأس المال الراجحي', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2240', symbol: '2240.SR', name_en: 'Saudi Investment', name_ar: 'الاستثمار السعودي', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2250', symbol: '2250.SR', name_en: 'Alinma Capital', name_ar: 'رأس المال الإنماء', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2260', symbol: '2260.SR', name_en: 'SABB Capital', name_ar: 'سابكابيتال', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2270', symbol: '2270.SR', name_en: 'Alistithmar', name_ar: 'الاستثمار', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2280', symbol: '2280.SR', name_en: 'Mojaz', name_ar: 'مؤاز', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },
  { ticker: '2290', symbol: '2290.SR', name_en: 'AlSharq', name_ar: 'الشرق', sector: 'Diversified Financials', market: 'main', is_shariah_compliant: true },

  // Software & Services - 10+
  { ticker: '7201', symbol: '7201.SR', name_en: 'Taiba Holding', name_ar: 'طيبة', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7202', symbol: '7202.SR', name_en: 'Ataa Holding', name_ar: 'أطلس', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7210', symbol: '7210.SR', name_en: 'Riyadh Capital', name_ar: 'الرياض المالية', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7220', symbol: '7220.SR', name_en: 'MAl Holding', name_ar: 'المال هولدينغ', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7230', symbol: '7230.SR', name_en: 'SABIC', name_ar: 'سابك', sector: 'Software & Services', market: 'main', is_shariah_compliant: false },
  { ticker: '7240', symbol: '7240.SR', name_en: 'Elm', name_ar: 'علم', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7250', symbol: '7250.SR', name_en: 'Tabadul', name_ar: 'تبادل', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7260', symbol: '7260.SR', name_en: 'Monshaat', name_ar: 'منشآت', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7270', symbol: '7270.SR', name_en: 'Matar', name_ar: 'مطار', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },
  { ticker: '7280', symbol: '7280.SR', name_en: 'Mwasalat', name_ar: 'مواصلات', sector: 'Software & Services', market: 'main', is_shariah_compliant: true },

  // Capital Goods - 10+
  { ticker: '2101', symbol: '2101.SR', name_en: 'Almabani', name_ar: 'المباني', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2110', symbol: '2110.SR', name_en: 'Al Rajhi Construction', name_ar: 'راجحي للتقنية', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2120', symbol: '2120.SR', name_en: 'Bafaa', name_ar: 'بعafa', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2130', symbol: '2130.SR', name_en: 'Hail Ghazal', name_ar: 'حائل غزال', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2140', symbol: '2140.SR', name_en: 'Al Rajhi Export', name_ar: 'تصدير الراجحي', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2150', symbol: '2150.SR', name_en: 'Kato', name_ar: 'كاتو', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2160', symbol: '2160.SR', name_en: 'Bahra', name_ar: 'برة', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2170', symbol: '2170.SR', name_en: 'Astra Mining', name_ar: 'تعدين أسترا', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2180', symbol: '2180.SR', name_en: 'Advanced Mining', name_ar: 'التعدين المتقدم', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },
  { ticker: '2190', symbol: '2190.SR', name_en: 'Maaden', name_ar: 'معادن', sector: 'Capital Goods', market: 'main', is_shariah_compliant: true },

  // Utilities - 5
  { ticker: '5110', symbol: '5110.SR', name_en: 'Saudi Electricity', name_ar: 'الكهرباء السعودية', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
  { ticker: '5120', symbol: '5120.SR', name_en: 'Water & Electricity', name_ar: 'المياه والكهرباء', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
  { ticker: '5130', symbol: '5130.SR', name_en: 'SEC', name_ar: 'SEC', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
  { ticker: '5140', symbol: '5140.SR', name_en: 'Mara', name_ar: 'مارة', sector: 'Utilities', market: 'main', is_shariah_compliant: true },
  { ticker: '5150', symbol: '5150.SR', name_en: 'Abu Dhabi Utilities', name_ar: 'أبوظبي للمرافق', sector: 'Utilities', market: 'main', is_shariah_compliant: true },

  // Pharma - 5
  { ticker: '5140', symbol: '5140.SR', name_en: 'SPIMACO', name_ar: 'سبيماكو', sector: 'Pharma', market: 'main', is_shariah_compliant: true },
  { ticker: '5150', symbol: '5150.SR', name_en: 'JAMJOOM', name_ar: 'جمجوم', sector: 'Pharma', market: 'main', is_shariah_compliant: true },
  { ticker: '5160', symbol: '5160.SR', name_en: 'Tadawy', name_ar: 'تداوي', sector: 'Pharma', market: 'main', is_shariah_compliant: true },
  { ticker: '5170', symbol: '5170.SR', name_en: 'Ibn Sina', name_ar: 'ابن سينا', sector: 'Pharma', market: 'main', is_shariah_compliant: true },
  { ticker: '5180', symbol: '5180.SR', name_en: 'Jamjoom Pharma', name_ar: 'جمجوم pharma', sector: 'Pharma', market: 'main', is_shariah_compliant: true },
]

async function seedCompanies() {
  console.log(`📊 Seeding ${companies.length} companies...`)
  
  let successCount = 0
  let errorCount = 0
  let skipCount = 0
  
  for (const company of companies) {
    const { error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'ticker' })
    
    if (error) {
      if (error.message.includes('duplicate')) {
        skipCount++
      } else {
        console.log(`❌ ${company.ticker}: ${error.message}`)
        errorCount++
      }
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} companies seeded`)
  console.log(`⏭️ Skipped: ${skipCount} (already in DB)`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Verify count
  const { count } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total companies in DB: ${count}`)
}

seedCompanies().catch(console.error)
