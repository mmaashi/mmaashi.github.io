/**
 * SŪQAI — Supabase Database Health Check
 * Run from project root: node check-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env from .env.local
const env = readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .reduce((acc, l) => {
    const [k, ...v] = l.split('=')
    acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const tables = [
  'companies', 'stock_prices', 'financials', 'dividends', 'ownership',
  'news', 'translations_cache', 'ipos', 'portfolios', 'portfolio_holdings',
  'alerts', 'user_profiles', 'chat_sessions', 'community_votes'
]

console.log('\n🔍 SŪQAI — Supabase Database Health Check')
console.log('='.repeat(50))

let allGood = true

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.log(`  ❌ ${table.padEnd(25)} ERROR: ${error.message}`)
    allGood = false
  } else {
    const icon = count === 0 ? '⚠️ ' : '✅'
    const note = count === 0 ? '(empty — needs seeding)' : ''
    console.log(`  ${icon} ${table.padEnd(25)} ${String(count).padStart(6)} rows  ${note}`)
  }
}

console.log('\n' + '='.repeat(50))

// Check sample companies
console.log('\n📋 Sample Companies:')
const { data: companies, error: cErr } = await supabase
  .from('companies')
  .select('ticker, name_en, sector')
  .limit(5)
  .order('name_en')

if (cErr) {
  console.log('  ❌ Could not fetch companies:', cErr.message)
} else if (!companies?.length) {
  console.log('  ⚠️  No companies found — run the seed script!')
} else {
  companies.forEach(c => console.log(`  • ${c.ticker.padEnd(12)} ${c.name_en.padEnd(30)} [${c.sector}]`))
}

// Check latest news
console.log('\n📰 Latest News:')
const { data: news, error: nErr } = await supabase
  .from('news')
  .select('title_en, source, published_at')
  .order('published_at', { ascending: false })
  .limit(3)

if (nErr || !news?.length) {
  console.log('  ⚠️  No news yet — cron job hasn\'t run or needs triggering')
} else {
  news.forEach(n => console.log(`  • [${n.source}] ${(n.title_en || '').slice(0, 60)}`))
}

// Summary
console.log('\n' + '='.repeat(50))
console.log(allGood ? '✅ All tables accessible!' : '❌ Some tables have issues — check above')
console.log('\nDone.\n')
