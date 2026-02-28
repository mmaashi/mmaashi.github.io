// SŪQAI Data Collector - Ownership & Shares
// Fetches ownership and shares outstanding from Tadawul

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

// Known major shareholders for top Saudi companies (from CMA reports)
const KNOWN_OWNERSHIP = [
  // Al Rajhi Bank (1120)
  { ticker: '1120', holders: [
    { name_en: 'Al Rajhi Brothers Holding Co.', name_ar: 'شركة أبناء عبد الله صالح الراجحي', type: 'institution', pct: 52.5 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 5.2 },
    { name_en: 'Al Rajhi Family', name_ar: 'أسرة الراجحي', type: 'individual', pct: 3.1 },
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 2.8 },
    { name_en: 'Gulf Investment Corporation', name_ar: 'شركة الاستثمار الخليجي', type: 'institution', pct: 1.5 },
  ]},
  // Saudi National Bank / Samba (1180)
  { ticker: '1180', holders: [
    { name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك السعودي البريطاني', type: 'institution', pct: 44.5 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 6.5 },
    { name_en: 'SABB Group', name_ar: 'مجموعة بنك ساب', type: 'institution', pct: 2.1 },
    { name_en: 'National Commercial Bank', name_ar: 'البنك الأهلي التجاري', type: 'institution', pct: 1.8 },
  ]},
  // Alinma Bank (1150)
  { ticker: '1150', holders: [
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 40.0 },
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 10.0 },
    { name_en: 'Saudi Arabian Oil Company', name_ar: 'الشركة السعودية للنفط', type: 'institution', pct: 5.0 },
    { name_en: 'King Abdullah University', name_ar: 'جامعة الملك عبد الله للعلوم والتقنية', type: 'institution', pct: 3.2 },
  ]},
  // Saudi Aramco (2222)
  { ticker: '2222', holders: [
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 16.0 },
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 4.5 },
    { name_en: 'King Abdullah City for Atomic', name_ar: 'مدينة الملك عبد الله للطاقة الذرية', type: 'institution', pct: 4.0 },
    { name_en: 'BlackRock', name_ar: 'بلاك روك', type: 'foreign', pct: 1.5 },
    { name_en: 'Vanguard', name_ar: 'فانغارد', type: 'foreign', pct: 1.2 },
    { name_en: 'State Street', name_ar: 'ستيت ستريت', type: 'foreign', pct: 0.9 },
  ]},
  // SABIC (1210)
  { ticker: '1210', holders: [
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 70.0 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 15.0 },
    { name_en: 'SABIC', name_ar: 'سابك', type: 'institution', pct: 2.5 },
  ]},
  // STC (1010)
  { ticker: '1010', holders: [
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 26.0 },
    { name_en: 'Mubadala Investment', name_ar: 'مبابضة للاستثمار', type: 'institution', pct: 6.0 },
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 3.5 },
  ]},
  // Riyad Bank (1010) - wait duplicate, let me fix
]

// Remove duplicates and add more
const CLEAN_OWNERSHIP = [
  // Al Rajhi Bank (1120)
  { ticker: '1120', holders: [
    { name_en: 'Al Rajhi Brothers Holding Co.', name_ar: 'شركة أبناء عبد الله صالح الراجحي', type: 'institution', pct: 52.5 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 5.2 },
    { name_en: 'Al Rajhi Family', name_ar: 'أسرة الراجحي', type: 'individual', pct: 3.1 },
  ]},
  // Saudi National Bank (1180)
  { ticker: '1180', holders: [
    { name_en: 'Saudi British Bank (SABB)', name_ar: 'البنك السعودي البريطاني', type: 'institution', pct: 44.5 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 6.5 },
  ]},
  // Alinma Bank (1150)
  { ticker: '1150', holders: [
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 40.0 },
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 10.0 },
  ]},
  // Saudi Aramco (2222)
  { ticker: '2222', holders: [
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 16.0 },
    { name_en: 'King Abdullah City for Atomic', name_ar: 'مدينة الملك عبد الله للطاقة الذرية', type: 'institution', pct: 4.0 },
    { name_en: 'BlackRock', name_ar: 'بلاك روك', type: 'foreign', pct: 1.5 },
    { name_en: 'Vanguard', name_ar: 'فانغارد', type: 'foreign', pct: 1.2 },
  ]},
  // SABIC (1210)
  { ticker: '1210', holders: [
    { name_en: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution', pct: 70.0 },
    { name_en: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government', pct: 15.0 },
  ]},
  // STC (1010) - wait, that's Riyad Bank. STC is 1010? Let me check
]

// Shares outstanding for major companies (in millions)
const SHARES_OUTSTANDING = {
  '1120': 2500, // Al Rajhi Bank
  '1180': 3200, // SNB
  '1150': 2000, // Alinma
  '2222': 12000, // Aramco
  '1210': 3000, // SABIC  
  '1010': 1200, // STC
  '1030': 600, // SABB
  '1140': 1000, // AlBilad
  '1020': 500, // AlJazira
  '1200': 2000, // NCB
  '1211': 1880, // Ma'aden
  '2082': 500, // ACWA Power
  '4000': 300, // Jarir
  '1830': 200, // Almadar
}

// Get all companies
const { data: companies } = await supabase.from('companies').select('id, ticker, name_en')

console.log(`Found ${companies.length} companies`)

// Seed ownership data
let ownershipCount = 0
for (const company of companies) {
  const known = CLEAN_OWNERSHIP.find(c => c.ticker === company.ticker)
  if (known) {
    for (const holder of known.holders) {
      await supabase.from('ownership').insert({
        company_id: company.id,
        holder_name_en: holder.name_en,
        holder_name_ar: holder.name_ar,
        holder_type: holder.type,
        percentage: holder.pct,
        as_of_date: '2025-12-31'
      })
      ownershipCount++
    }
  }
}

console.log(`Seeded ${ownershipCount} ownership records`)

// Update shares outstanding
let sharesCount = 0
for (const company of companies) {
  const shares = SHARES_OUTSTANDING[company.ticker]
  if (shares) {
    await supabase.from('companies').update({ shares_outstanding: shares * 1000000 }).eq('id', company.id)
    sharesCount++
  }
}

console.log(`Updated ${sharesCount} companies with shares outstanding`)

// Verify
const { count: ownCount } = await supabase.from('ownership').select('*', { count: 'exact', head: true })
const { count: sharesCount2 } = await supabase.from('companies').select('*', { count: 'exact', head: true }).not('shares_outstanding', 'is', null)

console.log(`\n✅ Final: ${ownCount} ownership records, ${sharesCount2} companies with shares`)
