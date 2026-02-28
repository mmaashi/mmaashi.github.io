// scripts/seed-dividends-v2.ts
// Seed dividend data - insert instead of upsert due to schema
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Dividend data for major Saudi companies (2023-2025)
const dividends = [
  // Saudi Aramco - pays quarterly
  { ticker: '2222', ex_date: '2025-02-15', payment_date: '2025-03-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2024-11-14', payment_date: '2024-12-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2024-08-14', payment_date: '2024-09-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2024-05-14', payment_date: '2024-06-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2024-02-14', payment_date: '2024-03-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2023-11-14', payment_date: '2023-12-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2023-08-14', payment_date: '2023-09-15', amount_per_share: 0.4681 },
  { ticker: '2222', ex_date: '2023-05-14', payment_date: '2023-06-15', amount_per_share: 0.4681 },
  
  // Al Rajhi Bank
  { ticker: '1120', ex_date: '2024-10-05', payment_date: '2024-10-20', amount_per_share: 1.0 },
  { ticker: '1120', ex_date: '2024-04-05', payment_date: '2024-04-20', amount_per_share: 1.0 },
  { ticker: '1120', ex_date: '2023-10-05', payment_date: '2023-10-20', amount_per_share: 1.0 },
  { ticker: '1120', ex_date: '2023-04-05', payment_date: '2023-04-20', amount_per_share: 1.0 },
  
  // STC
  { ticker: '7010', ex_date: '2024-12-10', payment_date: '2024-12-25', amount_per_share: 1.0 },
  { ticker: '7010', ex_date: '2024-06-10', payment_date: '2024-06-25', amount_per_share: 1.0 },
  { ticker: '7010', ex_date: '2023-12-10', payment_date: '2023-12-25', amount_per_share: 1.0 },
  { ticker: '7010', ex_date: '2023-06-10', payment_date: '2023-06-25', amount_per_share: 1.0 },
  
  // SABIC
  { ticker: '2010', ex_date: '2024-06-20', payment_date: '2024-07-10', amount_per_share: 0.75 },
  { ticker: '2010', ex_date: '2023-06-20', payment_date: '2023-07-10', amount_per_share: 0.75 },
  
  // Alinma Bank
  { ticker: '1150', ex_date: '2024-09-15', payment_date: '2024-10-01', amount_per_share: 0.65 },
  { ticker: '1150', ex_date: '2024-04-15', payment_date: '2024-05-01', amount_per_share: 0.65 },
  { ticker: '1150', ex_date: '2023-09-15', payment_date: '2023-10-01', amount_per_share: 0.65 },
  
  // Riyad Bank
  { ticker: '1010', ex_date: '2024-10-01', payment_date: '2024-10-15', amount_per_share: 0.8 },
  { ticker: '1010', ex_date: '2024-04-01', payment_date: '2024-04-15', amount_per_share: 0.8 },
  { ticker: '1010', ex_date: '2023-10-01', payment_date: '2023-10-15', amount_per_share: 0.8 },
  
  // Ma'aden
  { ticker: '1211', ex_date: '2024-09-20', payment_date: '2024-10-10', amount_per_share: 0.55 },
  { ticker: '1211', ex_date: '2024-04-20', payment_date: '2024-05-10', amount_per_share: 0.55 },
  
  // Almarai
  { ticker: '3010', ex_date: '2024-05-15', payment_date: '2024-06-05', amount_per_share: 0.7 },
  { ticker: '3010', ex_date: '2023-05-15', payment_date: '2023-06-05', amount_per_share: 0.7 },
  
  // Jarir Marketing
  { ticker: '4001', ex_date: '2024-04-20', payment_date: '2024-05-10', amount_per_share: 1.5 },
  { ticker: '4001', ex_date: '2023-04-20', payment_date: '2023-05-10', amount_per_share: 1.5 },
  
  // Saudi National Bank (SNB)
  { ticker: '1180', ex_date: '2024-10-15', payment_date: '2024-11-01', amount_per_share: 0.9 },
  { ticker: '1180', ex_date: '2024-04-15', payment_date: '2024-05-01', amount_per_share: 0.9 },
  
  // ACWA Power
  { ticker: '2082', ex_date: '2024-09-30', payment_date: '2024-10-15', amount_per_share: 1.2 },
  { ticker: '2082', ex_date: '2024-03-30', payment_date: '2024-04-15', amount_per_share: 1.2 },
  
  // Bupa Arabia
  { ticker: '8250', ex_date: '2024-05-20', payment_date: '2024-06-05', amount_per_share: 1.8 },
  { ticker: '8250', ex_date: '2023-05-20', payment_date: '2023-06-05', amount_per_share: 1.8 },
  
  // Tawuniya
  { ticker: '8150', ex_date: '2024-04-25', payment_date: '2024-05-10', amount_per_share: 1.2 },
  { ticker: '8150', ex_date: '2023-04-25', payment_date: '2023-05-10', amount_per_share: 1.2 },
]

async function seedDividends() {
  console.log(`📊 Seeding dividends for ${dividends.length} dividend events...`)
  
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (const d of dividends) {
    // Get company UUID by ticker
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', d.ticker)
      .single()
    
    if (companyErr || !company) {
      console.log(`⚠️ Skip ${d.ticker}: not in DB`)
      skipCount++
      continue
    }
    
    // Insert instead of upsert (no unique constraint)
    const { error } = await supabase
      .from('dividends')
      .insert({
        company_id: company.id,
        ex_date: d.ex_date,
        payment_date: d.payment_date,
        amount_per_share: d.amount_per_share,
        currency: 'SAR',
      })
    
    if (error) {
      // Check if duplicate
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log(`⏭️ Skip ${d.ticker} (${d.ex_date}): already exists`)
        skipCount++
      } else {
        console.log(`❌ ${d.ticker} (${d.ex_date}): ${error.message}`)
        errorCount++
      }
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} dividends seeded`)
  console.log(`⏭️ Skipped: ${skipCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Verify count
  const { count } = await supabase
    .from('dividends')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total dividends in DB: ${count}`)
}

seedDividends().catch(console.error)
