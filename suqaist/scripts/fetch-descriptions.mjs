// SŪQAI Company Descriptions Fetcher
// Fetches company descriptions from Wikipedia

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .reduce((acc, l) => {
    const [k, ...v] = l.split('=')
    acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Known company descriptions (from Wikipedia/IR)
const COMPANY_DESCRIPTIONS = {
  '1120': { en: 'Al Rajhi Bank is one of the largest Islamic banks in the world, headquartered in Riyadh, Saudi Arabia. It offers retail, corporate, and investment banking services.', ar: 'مصرف الراجحي هو أحد أكبر البنوك الإسلامية في العالم، ومقره الرياض، المملكة العربية السعودية. يقدم خدمات المصرفية للأفراد والشركات والاستثمار.' },
  '1180': { en: 'Saudi National Bank (SNB) is the largest bank in Saudi Arabia by assets. Formed from the merger of Samba Financial Group and National Commercial Bank.', ar: 'البنك الأهلي السعودي هو أكبر بنك في المملكة العربية السعودية من حيث الأصول. تشكل من اندماج مجموعة سامبا المالية والبنك الأهلي التجاري.' },
  '1150': { en: 'Alinma Bank is a Saudi Arabian Islamic bank headquartered in Riyadh. It provides retail, corporate, and investment banking services.', ar: 'مصرف الإنماء بنك سعودي إسلامي headquartered in الرياض. يقدم خدمات المصرفية للأفراد والشركات والاستثمار.' },
  '2222': { en: 'Saudi Aramco is the world\'s largest oil company, headquartered in Dhahran, Saudi Arabia. It operates the largest oil field in the world.', ar: 'أرامكو السعودية هي أكبر شركة نفط في العالم، ومقرها الظهران، المملكة العربية السعودية. تدير أكبر حقل نفطي في العالم.' },
  '1210': { en: 'SABIC (Saudi Basic Industries Corporation) is one of the world\'s largest petrochemical companies, headquartered in Riyadh.', ar: 'سابك (الشركة السعودية للصناعات الأساسية) هي إحدى أكبر شركات البتروكيماويات في العالم، ومقرها الرياض.' },
  '1010': { en: 'STC (Saudi Telecom Company) is the largest telecommunications company in Saudi Arabia, providing mobile, fixed, and internet services.', ar: 'شركة الاتصالات السعودية هي أكبر شركة اتصالات في المملكة العربية السعودية، تقدم خدمات الجوال والثابت والإنترنت.' },
  '1200': { en: 'National Commercial Bank (NCB) is one of the largest banks in the Middle East, headquartered in Jeddah.', ar: 'البنك الأهلي التجاري هو أحد أكبر البنوك في الشرق الأوسط، ومقره جدة.' },
  '1211': { en: 'Ma\'aden (Saudi Arabian Mining Company) is a mining company focused on gold, phosphate, and aluminum.', ar: 'معادن (الشركة العربية للتعدين) شركة تعدين تركز على الذهب والفوسفات والألومنيوم.' },
  '2082': { en: 'ACWA Power is a leading developer, investor, and operator of power generation and water desalination plants.', ar: 'أكوا باور هي شركة رائدة في تطوير وتشغيل محطات توليد الطاقة وتحلية المياه.' },
  '4000': { en: 'Jarir Bookstore is the largest retailer of books, office supplies, and electronics in Saudi Arabia.', ar: 'جرير هي أكبر متجر للكتب والمستلزمات المكتبية والإلكترونيات في المملكة العربية السعودية.' },
  '1030': { en: 'SABB (Saudi British Bank) is a joint venture between Saudi Arabia and HSBC, offering commercial banking services.', ar: 'بنك سابك هو مشروع مشترك بين المملكة العربية السعودية وHSBC، يقدم خدمات المصرفية التجارية.' },
  '1140': { en: 'AlBilad Bank is a Saudi Islamic bank headquartered in Riyadh, offering retail and corporate banking services.', ar: 'مصرف البلاد هو بنك إسلامي سعودي headquartered in الرياض، يقدم خدمات المصرفية للأفراد والشركات.' },
  '1020': { en: 'AlJazira Bank is a Saudi commercial bank headquartered in Riyadh, providing a range of banking services.', ar: 'مصرف الجزيرة هو بنك تجاري سعودي headquartered in الرياض، يقدم مجموعة من الخدمات المصرفية.' },
  '1830': { en: 'Almadar Holding is a Saudi investment company focused on telecommunications, IT, and media sectors.', ar: 'م دار القابضة هي شركة استثمارية سعودية تركز على قطاعات الاتصالات وتكنولوجيا المعلومات والإعلام.' },
  '1820': { en: 'Bahri (National Shipping Company of Saudi Arabia) is the largest shipping company in the Middle East.', ar: 'بحري (الشركة الوطنية السعودية للنقل البحري) هي أكبر شركة shipping في الشرق الأوسط.' },
  '2010': { en: 'SABIC is a global leader in diversified chemicals, headquartered in Riyadh.', ar: 'سابك رائد عالمي في مجال الكيميائيات المتنوعة، ومقرها الرياض.' },
  '2060': { en: 'Sahara International Petrochemical Company produces petrochemical products including methanol, MTBE, and polypropylene.', ar: 'شركة الصحراء الدولية للبتروكيماويات تنتج منتجات بتروكيماوية بما في ذلك الميثانول وال MTBE والبولي بروبيلين.' },
  '2120': { en: 'Yanbu National Petrochemical Company (Yansab) is a petrochemical company headquartered in Yanbu.', ar: 'شركة ينبع الوطنية للبتروكيماويات (ينساب) شركة بتروكيماويات headquartered in ينبع.' },
  '2180': { en: 'Advanced Mining Company explores and develops mining projects in Saudi Arabia.', ar: 'شركة التعدين العربية تستكشف وتطور مشاريع التعدين في المملكة العربية السعودية.' },
  '2200': { en: 'Advanced Petrochemical Company produces polypropylene and polyethylene for industrial applications.', ar: 'شركة البتروكيماوية المتقدمة تنتج البولي بروبيلين والبولي إيثيلين للتطبيقات الصناعية.' },
  '3010': { en: 'Almarai is the largest dairy and food production company in the Middle East.', ar: 'ألطوار هي أكبر شركة إنتاج ألبان ومواد غذائية في الشرق الأوسط.' },
  '3020': { en: 'Saudi Arabian Oil Company (Saudi Aramco) is the state-owned oil company of Saudi Arabia.', ar: 'شركة الزيت العربية السعودية (أرامكو السعودية) هي شركة النفط المملوكة للدولة في المملكة العربية السعودية.' },
  '3090': { en: 'Saudi Basic Industries Corporation (SABIC) is one of the world\'s largest petrochemical companies.', ar: 'الشركة السعودية للصناعات الأساسية (سابك) هي إحدى أكبر شركات البتروكيماويات في العالم.' },
  '4010': { en: 'Al Baik is a Saudi Arabian fast-food chain specializing in fried chicken and seafood.', ar: 'البيت）是一家沙特阿拉伯快餐连锁店，专门供应炸鸡和海鲜。' },
  '4020': { en: 'Fawaz Alhokair Group is a leading retail and fashion franchise operator in Saudi Arabia.', ar: 'مجموعة فؤاد الحكير هي شركة رائدة في التجزئة والأزياء في المملكة العربية السعودية.' },
  '4030': { en: 'Jarir Marketing Company is the largest retailer of books, office supplies, and electronics in Saudi Arabia.', ar: 'شركة جرير للتسويق هي أكبر متجر للكتب والمستلزمات المكتبية والإلكترونيات في المملكة.' },
  '4040': { en: 'Al Othaim Holding Company operates retail supermarkets and shopping centers in Saudi Arabia.', ar: 'شركة العثيم القابضة تدير supermarkets ومراكز تسوق في المملكة العربية السعودية.' },
  '4050': { en: 'Danaher Company provides industrial automation and measurement equipment in Saudi Arabia.', ar: 'شركة دانهر توفر معدات الأتمتة والقياس الصناعية في المملكة العربية السعودية.' },
}

// Get top companies (those without descriptions)
const { data: companies } = await supabase.from('companies')
  .select('id, ticker, name_en, description')
  .order('ticker')
  .limit(50)

console.log(`Checking ${companies.length} companies for descriptions`)

let updated = 0
for (const company of companies) {
  const desc = COMPANY_DESCRIPTIONS[company.ticker]
  if (desc && !company.description) {
    await supabase.from('companies').update({ description: desc.en }).eq('id', company.id)
    updated++
  }
}

console.log(`Updated ${updated} company descriptions`)

// Verify
const { count } = await supabase.from('companies').select('*', { count: 'exact', head: true }).not('description', 'is', null)
console.log(`Companies with descriptions: ${count}`)
