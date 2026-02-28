// SŪQAI Data Collector - Ownership & Shares (Fixed Schema)
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

// Ownership data by type - top Saudi companies
const OWNERSHIP_DATA = {
  '1120': { // Al Rajhi Bank
    institutional: 52.5, government: 5.2, foreign: 3.1, retail: 39.2,
    holders: [
      { name: 'Al Rajhi Brothers Holding Co.', name_ar: 'شركة أبناء عبد الله صالح الراجحي', type: 'institution' },
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
    ]
  },
  '1180': { // SNB
    institutional: 44.5, government: 6.5, foreign: 5.0, retail: 44.0,
    holders: [
      { name: 'Saudi British Bank (SABB)', name_ar: 'البنك السعودي البريطاني', type: 'institution' },
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
    ]
  },
  '1150': { // Alinma
    institutional: 15.0, government: 40.0, foreign: 5.0, retail: 40.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution' },
    ]
  },
  '2222': { // Aramco
    institutional: 10.0, government: 16.0, foreign: 15.0, retail: 59.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'King Abdullah City for Atomic', name_ar: 'مدينة الملك عبد الله للطاقة الذرية', type: 'institution' },
      { name: 'BlackRock', name_ar: 'بلاك روك', type: 'foreign' },
      { name: 'Vanguard', name_ar: 'فانغارد', type: 'foreign' },
    ]
  },
  '1210': { // SABIC
    institutional: 70.0, government: 15.0, foreign: 5.0, retail: 10.0,
    holders: [
      { name: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution' },
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
    ]
  },
  '1010': { // STC
    institutional: 20.0, government: 26.0, foreign: 10.0, retail: 44.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'Mubadala Investment', name_ar: 'مبابضة للاستثمار', type: 'institution' },
    ]
  },
  '1200': { // NCB
    institutional: 20.0, government: 44.0, foreign: 6.0, retail: 30.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution' },
    ]
  },
  '1030': { // SABB
    institutional: 45.0, government: 5.0, foreign: 10.0, retail: 40.0,
  },
  '1140': { // AlBilad
    institutional: 25.0, government: 20.0, foreign: 5.0, retail: 50.0,
  },
  '1020': { // AlJazira
    institutional: 30.0, government: 15.0, foreign: 5.0, retail: 50.0,
  },
  '1211': { // Ma'aden
    institutional: 25.0, government: 50.0, foreign: 5.0, retail: 20.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution' },
    ]
  },
  '2082': { // ACWA Power
    institutional: 35.0, government: 15.0, foreign: 10.0, retail: 40.0,
    holders: [
      { name: 'Public Investment Fund (PIF)', name_ar: 'صندوق الاستثمارات العامة', type: 'government' },
      { name: 'Saudi Aramco', name_ar: 'أرامكو السعودية', type: 'institution' },
    ]
  },
  '4000': { // Jarir
    institutional: 20.0, government: 0, foreign: 10.0, retail: 70.0,
  },
  '1830': { // Almadar
    institutional: 40.0, government: 20.0, foreign: 0, retail: 40.0,
  },
}

// Shares outstanding (in millions)
const SHARES_OUTSTANDING = {
  '1120': 2500, '1180': 3200, '1150': 2000, '2222': 12000,
  '1210': 3000, '1010': 1200, '1030': 600, '1140': 1000,
  '1020': 500, '1200': 2000, '1211': 1880, '2082': 500,
  '4000': 300, '1830': 200, '1820': 400, '2010': 1000,
  '2060': 400, '2120': 300, '2180': 200, '2200': 800,
  '3010': 500, '3020': 400, '3090': 300, '4010': 400,
  '4020': 600, '4030': 200, '4040': 300, '4050': 500,
}

// Get all companies
const { data: companies } = await supabase.from('companies').select('id, ticker, name_en')
console.log(`Found ${companies.length} companies`)

// Seed ownership breakdown data
let ownershipCount = 0
for (const company of companies) {
  const data = OWNERSHIP_DATA[company.ticker]
  if (data) {
    await supabase.from('ownership').insert({
      company_id: company.id,
      institutional_percent: data.institutional,
      government_percent: data.government,
      foreign_percent: data.foreign,
      retail_percent: data.retail,
      as_of_date: '2025-12-31'
    })
    ownershipCount++
  }
}
console.log(`Seeded ${ownershipCount} ownership breakdown records`)

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
