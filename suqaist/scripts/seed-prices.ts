// scripts/seed-prices.ts
// Fetch 1 year of daily prices from Yahoo Finance for all companies
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

async function fetchYahooPrices(symbol: string, range = '1y') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    if (!res.ok) {
      console.error(`Yahoo failed: ${symbol} → ${res.status}`)
      return []
    }
    
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    
    if (!result) {
      console.error(`No data: ${symbol}`)
      return []
    }
    
    const timestamps: number[] = result.timestamp
    const q = result.indicators?.quote?.[0]
    
    if (!q) return []
    
    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        open: q.open?.[i] ?? 0,
        high: q.high?.[i] ?? 0,
        low: q.low?.[i] ?? 0,
        close: q.close?.[i] ?? 0,
        volume: q.volume?.[i] ?? 0,
        adjusted_close: q.close?.[i] ?? 0,
      }))
      .filter(r => r.close > 0)
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err)
    return []
  }
}

async function seedPricesForTicker(ticker: string) {
  // 1. Get company UUID
  const { data: company, error: err } = await supabase
    .from('companies')
    .select('id')
    .eq('ticker', ticker)
    .single()
  
  if (err || !company) {
    console.log(`⚠️ Skip ${ticker}: not in DB`)
    return { ticker, status: 'skipped', rows: 0 }
  }
  
  // 2. Fetch Yahoo prices
  const prices = await fetchYahooPrices(`${ticker}.SR`)
  
  if (prices.length === 0) {
    console.log(`⚠️ No prices: ${ticker}`)
    return { ticker, status: 'no_data', rows: 0 }
  }
  
  // 3. Batch upsert in chunks of 500
  const rows = prices.map(p => ({
    company_id: company.id,
    ...p
  }))
  
  let totalInserted = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('stock_prices')
      .upsert(batch, { onConflict: 'company_id,date' })
    
    if (error) {
      console.error(`❌ ${ticker} batch ${i}: ${error.message}`)
    } else {
      totalInserted += batch.length
    }
  }
  
  console.log(`✅ ${ticker}: ${totalInserted} price rows`)
  return { ticker, status: 'success', rows: totalInserted }
}

async function main() {
  // Get all tickers from DB
  const { data: companies, error } = await supabase
    .from('companies')
    .select('ticker')
    .order('ticker')
  
  if (error || !companies) {
    console.error('Cannot read companies table:', error)
    return
  }
  
  console.log(`📊 Seeding prices for ${companies.length} companies...`)
  console.log('⏳ This will take a while (500ms delay between requests)\n')
  
  let success = 0
  let skipped = 0
  let noData = 0
  
  for (const { ticker } of companies) {
    const result = await seedPricesForTicker(ticker)
    
    if (result.status === 'success') success++
    else if (result.status === 'skipped') skipped++
    else noData++
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 500))
  }
  
  console.log(`\n📈 Summary:`)
  console.log(`  ✅ Success: ${success}`)
  console.log(`  ⚠️ Skipped: ${skipped}`)
  console.log(`  ❌ No data: ${noData}`)
  
  // Check total price rows
  const { count } = await supabase
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Total price rows in DB: ${count}`)
}

main().catch(console.error)
