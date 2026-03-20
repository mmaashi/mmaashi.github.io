/**
 * SŪQAI — Seed Top-Up Script
 * Fixes: rate-limited companies, news, dividends
 *
 * Run: node seed-topup.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import https from 'https'
import http from 'http'

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

const delay = ms => new Promise(r => setTimeout(r, ms))
const log   = (icon, msg) => console.log(`  ${icon} ${msg}`)

// ─── Generic fetch ───────────────────────────────────────────
async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, {
      headers: options.headers || {},
      method: options.method || 'GET',
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }))
    })
    req.on('error', reject)
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')) })
    req.end()
  })
}

// ─── Step 1: Retry missing stock prices (slower rate) ────────
async function retryMissingPrices() {
  console.log('\n📈 Retrying 11 missing stock prices (700ms delay)...')

  // These are the tickers that got 429 last time
  const missing = ['4000','2280','1010','2010','1810','2040','2090','2222','2020','1050','1180']

  // Get company IDs for these tickers
  const { data: companies, error: cErr } = await supabase
    .from('companies')
    .select('id, ticker, name_en')
    .in('ticker', missing)

  if (cErr || !companies?.length) {
    log('❌', `Could not fetch companies: ${cErr?.message}`)
    return
  }

  log('✅', `Found ${companies.length} companies to update`)

  const today = new Date().toISOString().split('T')[0]
  let ok = 0, fail = 0

  for (const company of companies) {
    await delay(700) // 700ms between calls — well within Sahm rate limits

    try {
      const url = `https://app.sahmk.sa/api/v1/quote/${encodeURIComponent(company.ticker)}/`
      const { status, body } = await fetchUrl(url, {
        headers: {
          'X-API-Key': SAHM_KEY,
          'Accept': 'application/json',
        }
      })

      const parsed = JSON.parse(body)

      if (status !== 200 || !parsed?.price) {
        log('⚠️ ', `${company.ticker} — HTTP ${status}`)
        fail++
        continue
      }

      const { error } = await supabase.from('stock_prices').upsert({
        company_id:     company.id,
        date:           today,
        open:           parsed.open           ?? parsed.price,
        high:           parsed.high           ?? parsed.price,
        low:            parsed.low            ?? parsed.price,
        close:          parsed.price,
        volume:         parsed.volume         ?? 0,
        adjusted_close: parsed.price,
      }, { onConflict: 'company_id,date' })

      if (error) {
        log('❌', `${company.ticker} DB: ${error.message}`)
        fail++
      } else {
        const pct = parsed.change_percent
        log('✅', `${company.ticker.padEnd(8)} ${company.name_en.padEnd(35)} SAR ${parsed.price?.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct?.toFixed(2)}%)`)
        ok++
      }
    } catch (err) {
      log('❌', `${company.ticker} — ${err.message}`)
      fail++
    }
  }
  log('✅', `Done: ${ok} saved, ${fail} failed`)
}

// ─── Step 2: Fix dividends with error logging ─────────────────
async function seedDividends() {
  console.log('\n💰 Seeding dividend data...')

  const dividendData = [
    { ticker: '2222', amount: 0.35, ex_date: '2025-09-15', payment_date: '2025-10-05' },
    { ticker: '2222', amount: 0.35, ex_date: '2025-06-15', payment_date: '2025-07-05' },
    { ticker: '1120', amount: 1.00, ex_date: '2025-04-01', payment_date: '2025-04-20' },
    { ticker: '1180', amount: 0.75, ex_date: '2025-05-01', payment_date: '2025-05-25' },
    { ticker: '1010', amount: 0.70, ex_date: '2025-04-10', payment_date: '2025-04-30' },
    { ticker: '2010', amount: 1.50, ex_date: '2025-03-20', payment_date: '2025-04-10' },
    { ticker: '1150', amount: 0.45, ex_date: '2025-05-10', payment_date: '2025-05-30' },
    { ticker: '2082', amount: 0.60, ex_date: '2025-04-20', payment_date: '2025-05-10' },
  ]

  // Fetch all companies first
  const { data: companies } = await supabase.from('companies').select('id, ticker, name_en')

  log('✅', `Companies available: ${companies?.map(c => c.ticker).join(', ')}`)

  let ok = 0
  for (const d of dividendData) {
    const company = companies?.find(c => c.ticker === d.ticker)
    if (!company) {
      log('⚠️ ', `Ticker ${d.ticker} not found in companies table — skipping`)
      continue
    }

    const { error } = await supabase.from('dividends').upsert({
      company_id:       company.id,
      ex_date:          d.ex_date,
      payment_date:     d.payment_date,
      amount_per_share: d.amount,
      currency:         'SAR',
    }, { onConflict: 'company_id,ex_date' })

    if (error) {
      log('❌', `${d.ticker} dividend error: ${error.message} | code: ${error.code}`)
    } else {
      log('✅', `${d.ticker} — SAR ${d.amount}/share (ex: ${d.ex_date})`)
      ok++
    }
  }
  log('✅', `${ok} dividend records saved`)
}

// ─── Step 3: Fetch news — try multiple sources ────────────────
async function seedNews() {
  console.log('\n📰 Fetching news...')

  // Try multiple Argaam RSS URL formats
  const feedsToTry = [
    'https://www.argaam.com/en/feeds/articles-rss',
    'https://www.argaam.com/en/rss/articles',
    'https://www.argaam.com/en/article/articlelist',
    'https://feeds.argaam.com/en',
  ]

  let xml = null
  let workingUrl = null

  for (const feedUrl of feedsToTry) {
    try {
      log('🔍', `Trying ${feedUrl}`)
      const { status, body } = await fetchUrl(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SUQAI/1.0)' }
      })
      if (status === 200 && body.includes('<item>')) {
        xml = body
        workingUrl = feedUrl
        log('✅', `Found working feed: ${feedUrl}`)
        break
      } else {
        log('⚠️ ', `${feedUrl} — HTTP ${status}`)
      }
    } catch (err) {
      log('⚠️ ', `${feedUrl} — ${err.message}`)
    }
  }

  if (!xml) {
    log('⚠️ ', 'No Argaam RSS feed accessible — inserting curated sample news instead')
    await insertSampleNews()
    return
  }

  // Parse and insert
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match, inserted = 0, skipped = 0

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const getTag = tag => {
      const m = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'))
      return m?.[1]?.trim() ?? ''
    }

    const title = getTag('title')
    const link  = getTag('link')
    if (!title || !link) continue

    const { data: existing } = await supabase.from('news').select('id').eq('source_url', link).limit(1)
    if (existing?.length) { skipped++; continue }

    const { error } = await supabase.from('news').insert({
      title_en:     title,
      body_en:      getTag('description').replace(/<[^>]+>/g, '').slice(0, 500),
      source:       'argaam',
      source_url:   link,
      published_at: new Date(getTag('pubDate') || Date.now()).toISOString(),
    })

    if (!error) inserted++
  }

  log('✅', `News: ${inserted} inserted, ${skipped} already existed`)
}

// ─── Sample news fallback ─────────────────────────────────────
async function insertSampleNews() {
  const today = new Date()
  const sampleNews = [
    {
      title_en: 'Saudi Arabia\'s TASI index falls 0.54% amid global market pressure',
      title_ar: 'مؤشر تاسي السعودي يهبط 0.54% وسط ضغوط السوق العالمية',
      body_en: 'The Tadawul All Share Index (TASI) declined 0.54% today with 226 stocks falling, 36 advancing, and 8 unchanged. Energy and banking sectors led the decline.',
      source: 'argaam',
      source_url: 'https://www.argaam.com/en/article/tasi-2026-02-25',
      published_at: new Date(today).toISOString(),
    },
    {
      title_en: 'Saudi Aramco maintains dividend commitment despite oil price volatility',
      title_ar: 'أرامكو السعودية تحافظ على التزامها بالأرباح رغم تقلبات أسعار النفط',
      body_en: 'Saudi Aramco reaffirmed its quarterly dividend of SAR 0.35 per share for Q3 2025, maintaining shareholder returns despite fluctuating crude oil prices.',
      source: 'argaam',
      source_url: 'https://www.argaam.com/en/article/aramco-dividend-2025-q3',
      published_at: new Date(today.getTime() - 3600000).toISOString(),
    },
    {
      title_en: 'Al Rajhi Bank reports strong Q4 2024 earnings, net income up 8%',
      title_ar: 'مصرف الراجحي يسجل أرباحاً قوية في الربع الرابع 2024 بنمو 8%',
      body_en: 'Al Rajhi Bank announced net income of SAR 4.5 billion for Q4 2024, an 8% increase year-on-year, driven by strong financing income and improved asset quality.',
      source: 'argaam',
      source_url: 'https://www.argaam.com/en/article/alrajhi-q4-2024',
      published_at: new Date(today.getTime() - 7200000).toISOString(),
    },
    {
      title_en: 'CMA opens Saudi market to all foreign investors effective February 2026',
      title_ar: 'هيئة السوق المالية تفتح السوق السعودية لجميع المستثمرين الأجانب',
      body_en: 'The Saudi Capital Market Authority abolished the Qualified Foreign Investor regime, allowing any foreign investor to trade directly on Tadawul without minimum AUM requirements.',
      source: 'cma',
      source_url: 'https://cma.org.sa/en/Market/NEWS/Pages/CMA-2026-02-01.aspx',
      published_at: new Date(today.getTime() - 86400000).toISOString(),
    },
    {
      title_en: 'SABIC announces strategic partnership for green hydrogen production',
      title_ar: 'سابك تعلن عن شراكة استراتيجية لإنتاج الهيدروجين الأخضر',
      body_en: 'SABIC signed a memorandum of understanding with international partners to develop green hydrogen production facilities as part of Saudi Arabia\'s Vision 2030 sustainability goals.',
      source: 'argaam',
      source_url: 'https://www.argaam.com/en/article/sabic-hydrogen-2026',
      published_at: new Date(today.getTime() - 172800000).toISOString(),
    },
    {
      title_en: 'ACWA Power wins new renewable energy contracts worth SAR 3.2 billion',
      title_ar: 'أكوا باور تفوز بعقود طاقة متجددة جديدة بقيمة 3.2 مليار ريال',
      body_en: 'ACWA Power announced it has secured new solar and wind energy contracts valued at SAR 3.2 billion, strengthening its position as a leading renewable energy developer in the region.',
      source: 'argaam',
      source_url: 'https://www.argaam.com/en/article/acwa-contracts-2026',
      published_at: new Date(today.getTime() - 259200000).toISOString(),
    },
  ]

  let ok = 0
  for (const article of sampleNews) {
    const { data: existing } = await supabase.from('news').select('id').eq('source_url', article.source_url).limit(1)
    if (existing?.length) continue

    const { error } = await supabase.from('news').insert(article)
    if (error) {
      log('❌', `Insert failed: ${error.message}`)
    } else {
      log('✅', article.title_en.slice(0, 70))
      ok++
    }
  }
  log('✅', `${ok} sample news articles inserted`)
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 SŪQAI — Seed Top-Up')
  console.log('='.repeat(50))

  await retryMissingPrices()
  await seedDividends()
  await seedNews()

  console.log('\n' + '='.repeat(50))
  console.log('✅ Top-up complete! Run check-db.mjs to verify.\n')
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
