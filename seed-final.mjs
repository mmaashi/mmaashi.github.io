/**
 * SŪQAI — Final Seed Fix
 * Fixes: dividends (no upsert, plain insert) + remaining 11 stock prices (slow retry)
 *
 * Run: node seed-final.mjs
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

const delay = ms => new Promise(r => setTimeout(r, ms))
const log   = (icon, msg) => console.log(`  ${icon} ${msg}`)

// ─── Sahm API fetch with full error detail ────────────────────
async function sahmQuote(ticker) {
  return new Promise((resolve, reject) => {
    const url = `https://app.sahmk.sa/api/v1/quote/${encodeURIComponent(ticker)}/`
    const options = {
      hostname: 'app.sahmk.sa',
      path: `/api/v1/quote/${encodeURIComponent(ticker)}/`,
      method: 'GET',
      headers: {
        'X-API-Key': SAHM_KEY,
        'Accept': 'application/json',
        'User-Agent': 'SUQAI/1.0',
      },
      timeout: 15000,
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({ status: res.statusCode, raw: data })
      })
    })

    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout after 15s')) })
    req.on('error', err => reject(err))
    req.end()
  })
}

// ─── Step 1: Fix dividends — plain INSERT, no upsert ─────────
async function fixDividends() {
  console.log('\n💰 Fixing dividends (plain INSERT, no constraint needed)...')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, ticker')

  const companyMap = Object.fromEntries(companies.map(c => [c.ticker, c.id]))

  const dividendData = [
    { ticker: '2222', amount: 0.35, ex_date: '2025-09-15', payment_date: '2025-10-05' },
    { ticker: '2222', amount: 0.35, ex_date: '2025-06-15', payment_date: '2025-07-05' },
    { ticker: '1120', amount: 1.00, ex_date: '2025-04-01', payment_date: '2025-04-20' },
    { ticker: '1180', amount: 0.75, ex_date: '2025-05-01', payment_date: '2025-05-25' },
    { ticker: '1010', amount: 0.70, ex_date: '2025-04-10', payment_date: '2025-04-30' },
    { ticker: '2010', amount: 1.50, ex_date: '2025-03-20', payment_date: '2025-04-10' },
    { ticker: '1150', amount: 0.45, ex_date: '2025-05-10', payment_date: '2025-05-30' },
    { ticker: '2082', amount: 0.60, ex_date: '2025-04-20', payment_date: '2025-05-10' },
    { ticker: '2222', amount: 0.35, ex_date: '2024-12-15', payment_date: '2025-01-05' },
    { ticker: '2222', amount: 0.35, ex_date: '2024-09-15', payment_date: '2024-10-05' },
    { ticker: '1120', amount: 0.95, ex_date: '2024-10-01', payment_date: '2024-10-20' },
    { ticker: '1010', amount: 0.65, ex_date: '2024-10-10', payment_date: '2024-10-30' },
  ]

  let ok = 0, skipped = 0

  for (const d of dividendData) {
    const company_id = companyMap[d.ticker]
    if (!company_id) {
      log('⚠️ ', `Ticker ${d.ticker} not in DB`)
      continue
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('dividends')
      .select('id')
      .eq('company_id', company_id)
      .eq('ex_date', d.ex_date)
      .limit(1)

    if (existing?.length) {
      skipped++
      continue
    }

    const { error } = await supabase.from('dividends').insert({
      company_id,
      ex_date:          d.ex_date,
      payment_date:     d.payment_date,
      amount_per_share: d.amount,
      currency:         'SAR',
    })

    if (error) {
      log('❌', `${d.ticker} ${d.ex_date}: ${error.message}`)
    } else {
      log('✅', `${d.ticker.padEnd(6)} SAR ${d.amount}/share  ex-date: ${d.ex_date}`)
      ok++
    }
  }

  log('✅', `Dividends: ${ok} inserted, ${skipped} already existed`)
}

// ─── Step 2: Retry 11 prices with long delay + full diagnostics
async function fixStockPrices() {
  console.log('\n📈 Retrying 11 stock prices (2s delay, full diagnostics)...')
  console.log('  ⏳ This will take ~22 seconds — please wait...\n')

  const missing = ['4000','2280','1010','2010','1810','2040','2090','2222','2020','1050','1180']

  const { data: companies } = await supabase
    .from('companies')
    .select('id, ticker, name_en')
    .in('ticker', missing)

  const today = new Date().toISOString().split('T')[0]
  let ok = 0, fail = 0, rateLimited = 0

  for (const company of companies) {
    await delay(2000) // 2 full seconds between each call

    try {
      const { status, raw } = await sahmQuote(company.ticker)

      if (status === 429) {
        log('⏳', `${company.ticker} — still rate limited (429). Will need to wait longer.`)
        rateLimited++
        continue
      }

      if (status === 404) {
        log('⚠️ ', `${company.ticker} — not found in Sahm API (404). Ticker may differ.`)
        fail++
        continue
      }

      if (status !== 200) {
        log('❌', `${company.ticker} — HTTP ${status}: ${raw.slice(0, 80)}`)
        fail++
        continue
      }

      let parsed
      try { parsed = JSON.parse(raw) }
      catch { log('❌', `${company.ticker} — invalid JSON: ${raw.slice(0, 60)}`); fail++; continue }

      if (!parsed?.price) {
        log('⚠️ ', `${company.ticker} — no price in response: ${JSON.stringify(parsed).slice(0, 80)}`)
        fail++
        continue
      }

      const { error } = await supabase.from('stock_prices').insert({
        company_id:     company.id,
        date:           today,
        open:           parsed.open           ?? parsed.price,
        high:           parsed.high           ?? parsed.price,
        low:            parsed.low            ?? parsed.price,
        close:          parsed.price,
        volume:         parsed.volume         ?? 0,
        adjusted_close: parsed.price,
      })

      if (error && error.code === '23505') {
        // Already exists for today — update it
        await supabase.from('stock_prices')
          .update({ close: parsed.price, high: parsed.high ?? parsed.price, low: parsed.low ?? parsed.price, volume: parsed.volume ?? 0 })
          .eq('company_id', company.id)
          .eq('date', today)
        log('✅', `${company.ticker.padEnd(8)} ${company.name_en.padEnd(35)} SAR ${parsed.price?.toFixed(2)} (updated)`)
        ok++
      } else if (error) {
        log('❌', `${company.ticker} DB error: ${error.message}`)
        fail++
      } else {
        const pct = parsed.change_percent ?? 0
        log('✅', `${company.ticker.padEnd(8)} ${company.name_en.padEnd(35)} SAR ${parsed.price?.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct?.toFixed(2)}%)`)
        ok++
      }

    } catch (err) {
      log('❌', `${company.ticker} — ${err.message || err.code || 'unknown error'}`)
      fail++
    }
  }

  console.log(`\n  ✅ Done: ${ok} saved, ${fail} failed, ${rateLimited} still rate-limited`)

  if (rateLimited > 0) {
    console.log(`\n  ⏳ ${rateLimited} tickers still rate-limited by Sahm API.`)
    console.log('     Wait 5 minutes then run again — the limit resets per minute window.')
  }
  if (fail > 0) {
    console.log(`\n  ℹ️  ${fail} tickers may use different symbols in the Sahm API.`)
    console.log('     Check https://app.sahmk.sa to verify ticker formats.')
  }
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 SŪQAI — Final Seed Fix')
  console.log('='.repeat(50))

  await fixDividends()
  await fixStockPrices()

  console.log('\n' + '='.repeat(50))
  console.log('✅ Done! Run: node check-db.mjs to verify\n')
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
