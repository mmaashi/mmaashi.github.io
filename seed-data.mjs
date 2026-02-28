/**
 * SŪQAI — Full Database Seed Script
 * Fetches REAL data from Sahm API + Argaam RSS and stores in Supabase.
 *
 * Run: node seed-data.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import https from 'https'

// ─── Load env ────────────────────────────────────────────────
const env = readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .reduce((acc, l) => {
    const [k, ...v] = l.split('=')
    acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const SAHM_KEY     = env.SAHM_API_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Helpers ─────────────────────────────────────────────────
function log(icon, msg) { console.log(`  ${icon} ${msg}`) }

async function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.end()
  })
}

// ─── Step 1: Get all companies ────────────────────────────────
async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, ticker, name_en')
    .order('name_en')

  if (error) throw new Error(`Failed to fetch companies: ${error.message}`)
  return data
}

// ─── Step 2: Seed stock prices from Sahm API ─────────────────
async function seedStockPrices(companies) {
  console.log('\n📈 Seeding stock prices from Sahm API...')
  const today = new Date().toISOString().split('T')[0]
  let ok = 0, fail = 0

  for (const company of companies) {
    try {
      const url = `https://app.sahmk.sa/api/v1/quote/${encodeURIComponent(company.ticker)}/`
      const { status, body } = await fetchJson(url, {
        'X-API-Key': SAHM_KEY,
        'Accept': 'application/json',
      })

      if (status !== 200 || !body?.price) {
        log('⚠️ ', `${company.ticker} — API returned ${status}, skipping`)
        fail++
        continue
      }

      const { error } = await supabase.from('stock_prices').upsert({
        company_id:     company.id,
        date:           today,
        open:           body.open           ?? body.price,
        high:           body.high           ?? body.price,
        low:            body.low            ?? body.price,
        close:          body.price,
        volume:         body.volume         ?? 0,
        adjusted_close: body.price,
      }, { onConflict: 'company_id,date' })

      if (error) {
        log('❌', `${company.ticker} DB error: ${error.message}`)
        fail++
      } else {
        log('✅', `${company.ticker.padEnd(8)} ${company.name_en.padEnd(35)} SAR ${body.price?.toFixed(2)} (${body.change_percent >= 0 ? '+' : ''}${body.change_percent?.toFixed(2)}%)`)
        ok++
      }

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 150))
    } catch (err) {
      log('❌', `${company.ticker} — ${err.message}`)
      fail++
    }
  }
  console.log(`\n  Done: ${ok} saved, ${fail} failed`)
}

// ─── Step 3: Seed market summary into indices table (optional) ─
async function seedMarketSummary() {
  console.log('\n📊 Fetching TASI market summary...')
  try {
    const { status, body } = await fetchJson('https://app.sahmk.sa/api/v1/market/summary/', {
      'X-API-Key': SAHM_KEY,
      'Accept': 'application/json',
    })
    if (status === 200 && body?.index_value) {
      log('✅', `TASI: ${body.index_value?.toLocaleString()} (${body.index_change_percent >= 0 ? '+' : ''}${body.index_change_percent?.toFixed(2)}%) — ${body.market_mood}`)
      log('✅', `Advancing: ${body.advancing} | Declining: ${body.declining} | Unchanged: ${body.unchanged}`)
    } else {
      log('⚠️ ', `Unexpected response: ${status}`)
    }
  } catch (err) {
    log('❌', `Market summary error: ${err.message}`)
  }
}

// ─── Step 4: Seed news from Argaam RSS ───────────────────────
async function seedNews() {
  console.log('\n📰 Fetching news from Argaam RSS...')

  const feeds = [
    { url: 'https://www.argaam.com/en/feeds/articles-rss', lang: 'en' },
    { url: 'https://www.argaam.com/ar/feeds/articles-rss', lang: 'ar' },
  ]

  const articles = []

  for (const feed of feeds) {
    try {
      const { status, body } = await fetchText(feed.url, {
        'User-Agent': 'SUQAI/1.0',
        'Accept': 'application/rss+xml, text/xml',
      })

      if (status !== 200) {
        log('⚠️ ', `Argaam ${feed.lang} feed returned ${status}`)
        continue
      }

      // Parse RSS items
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      while ((match = itemRegex.exec(body)) !== null) {
        const xml = match[1]
        const getTag = tag => {
          const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'))
          return m?.[1]?.trim() ?? ''
        }
        articles.push({
          lang: feed.lang,
          title: getTag('title'),
          link: getTag('link'),
          description: getTag('description').replace(/<[^>]+>/g, '').slice(0, 500),
          pubDate: getTag('pubDate'),
        })
      }
      log('✅', `Fetched ${articles.filter(a => a.lang === feed.lang).length} articles from ${feed.lang} feed`)
    } catch (err) {
      log('❌', `Argaam ${feed.lang}: ${err.message}`)
    }
  }

  // Merge EN + AR and insert
  const enArticles = articles.filter(a => a.lang === 'en')
  const arArticles = articles.filter(a => a.lang === 'ar')
  let inserted = 0, skipped = 0

  for (const en of enArticles) {
    if (!en.link || !en.title) continue

    // Check duplicate
    const { data: existing } = await supabase
      .from('news')
      .select('id')
      .eq('source_url', en.link)
      .limit(1)

    if (existing?.length) { skipped++; continue }

    // Find matching Arabic
    const ar = arArticles.find(a =>
      a.link?.replace('/en/', '/ar/') === en.link ||
      a.link?.replace('/ar/', '/en/') === en.link
    )

    const { error } = await supabase.from('news').insert({
      title_en:     en.title,
      title_ar:     ar?.title ?? null,
      body_en:      en.description,
      body_ar:      ar?.description ?? null,
      source:       'argaam',
      source_url:   en.link,
      published_at: new Date(en.pubDate || Date.now()).toISOString(),
    })

    if (error) {
      log('⚠️ ', `Insert failed: ${error.message.slice(0, 60)}`)
    } else {
      inserted++
    }
  }

  log('✅', `News: ${inserted} inserted, ${skipped} already existed`)
}

// ─── Step 5: Seed sample dividends for top companies ─────────
async function seedDividends(companies) {
  console.log('\n💰 Seeding sample dividend data...')

  // Real approximate dividend data for top Saudi companies (2024-2025)
  const dividendData = [
    { ticker: '2222', amount: 0.35, ex_date: '2025-09-15', payment_date: '2025-10-05' }, // Aramco Q2
    { ticker: '2222', amount: 0.35, ex_date: '2025-06-15', payment_date: '2025-07-05' }, // Aramco Q1
    { ticker: '1120', amount: 1.00, ex_date: '2025-04-01', payment_date: '2025-04-20' }, // Al Rajhi
    { ticker: '1180', amount: 0.75, ex_date: '2025-05-01', payment_date: '2025-05-25' }, // SNB
    { ticker: '1010', amount: 0.70, ex_date: '2025-04-10', payment_date: '2025-04-30' }, // Riyad Bank
    { ticker: '2010', amount: 1.50, ex_date: '2025-03-20', payment_date: '2025-04-10' }, // SABIC
    { ticker: '2280', amount: 0.80, ex_date: '2025-04-15', payment_date: '2025-05-05' }, // Almarai/Nahdi
    { ticker: '1150', amount: 0.45, ex_date: '2025-05-10', payment_date: '2025-05-30' }, // Alinma
  ]

  let ok = 0
  for (const d of dividendData) {
    const company = companies.find(c => c.ticker === d.ticker)
    if (!company) continue

    const { error } = await supabase.from('dividends').upsert({
      company_id:       company.id,
      ex_date:          d.ex_date,
      payment_date:     d.payment_date,
      amount_per_share: d.amount,
      currency:         'SAR',
    }, { onConflict: 'company_id,ex_date' })

    if (!error) {
      log('✅', `${d.ticker} — SAR ${d.amount} (ex: ${d.ex_date})`)
      ok++
    }
  }
  log('✅', `${ok} dividend records seeded`)
}

// ─── Step 6: Seed sample financials ──────────────────────────
async function seedFinancials(companies) {
  console.log('\n📋 Seeding sample annual financials...')

  // Approximate 2024 annual financials for top companies (SAR millions)
  const financialData = [
    { ticker: '2222', year: 2024, period: 'annual', revenue: 1700000, net_income: 454000, eps: 3.81 },
    { ticker: '1120', year: 2024, period: 'annual', revenue: 42000,   net_income: 17500,  eps: 8.75 },
    { ticker: '1180', year: 2024, period: 'annual', revenue: 31000,   net_income: 17000,  eps: 5.20 },
    { ticker: '2010', year: 2024, period: 'annual', revenue: 155000,  net_income: 12500,  eps: 4.17 },
    { ticker: '1010', year: 2024, period: 'annual', revenue: 22000,   net_income: 9500,   eps: 3.80 },
    { ticker: '1150', year: 2024, period: 'annual', revenue: 12000,   net_income: 4800,   eps: 1.60 },
    { ticker: '2082', year: 2024, period: 'annual', revenue: 18000,   net_income: 4200,   eps: 2.10 },
    { ticker: '1211', year: 2024, period: 'annual', revenue: 27000,   net_income: 5800,   eps: 1.45 },
  ]

  let ok = 0
  for (const f of financialData) {
    const company = companies.find(c => c.ticker === f.ticker)
    if (!company) continue

    const { error } = await supabase.from('financials').upsert({
      company_id:        company.id,
      period:            f.period,
      year:              f.year,
      revenue:           f.revenue,
      net_income:        f.net_income,
      earnings_per_share: f.eps,
    }, { onConflict: 'company_id,period,year' })

    if (!error) {
      log('✅', `${f.ticker} ${f.year} — Revenue: SAR ${(f.revenue/1000).toFixed(0)}B, Net Income: SAR ${(f.net_income/1000).toFixed(0)}B`)
      ok++
    }
  }
  log('✅', `${ok} financial records seeded`)
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🌟 SŪQAI — Database Seed Script')
  console.log('='.repeat(50))
  console.log(`  Supabase: ${SUPABASE_URL}`)
  console.log(`  Sahm API: ${SAHM_KEY ? '✅ key set' : '❌ missing'}`)
  console.log('='.repeat(50))

  const companies = await getCompanies()
  console.log(`\n✅ Found ${companies.length} companies in database`)

  await seedMarketSummary()
  await seedStockPrices(companies)
  await seedNews()
  await seedDividends(companies)
  await seedFinancials(companies)

  console.log('\n' + '='.repeat(50))
  console.log('✅ Seed complete! Run check-db.mjs to verify.\n')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
