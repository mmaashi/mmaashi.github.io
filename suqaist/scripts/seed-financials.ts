// scripts/seed-financials.ts
// Seed annual financials for top companies - focusing on EPS for P/E ratio
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Financial data for top companies (Annual 2024)
// Focus on earnings_per_share which enables P/E ratio
const financials = [
  // Energy
  { ticker: '2222', period: 'annual', year: 2024, revenue: 1882000000000, net_income: 438000000000, earnings_per_share: 5.47, book_value_per_share: 24.5 },
  { ticker: '2010', period: 'annual', year: 2024, revenue: 156000000000, net_income: 2800000000, earnings_per_share: 0.35, book_value_per_share: 18.2 },
  { ticker: '1211', period: 'annual', year: 2024, revenue: 32000000000, net_income: 4200000000, earnings_per_share: 1.75, book_value_per_share: 12.3 },
  { ticker: '4030', period: 'annual', year: 2024, revenue: 18000000000, net_income: -1500000000, earnings_per_share: -0.85, book_value_per_share: 8.5 },
  { ticker: '2082', period: 'annual', year: 2024, revenue: 12000000000, net_income: 1800000000, earnings_per_share: 2.15, book_value_per_share: 14.2 },
  { ticker: '2040', period: 'annual', year: 2024, revenue: 8500000000, net_income: 450000000, earnings_per_share: 0.65, book_value_per_share: 9.8 },
  { ticker: '2060', period: 'annual', year: 2024, revenue: 7200000000, net_income: 380000000, earnings_per_share: 0.82, book_value_per_share: 11.5 },
  
  // Banks - Most important for P/E
  { ticker: '1120', period: 'annual', year: 2024, revenue: 52000000000, net_income: 16500000000, earnings_per_share: 4.12, book_value_per_share: 28.5 },
  { ticker: '1180', period: 'annual', year: 2024, revenue: 68000000000, net_income: 15200000000, earnings_per_share: 3.85, book_value_per_share: 22.1 },
  { ticker: '1010', period: 'annual', year: 2024, revenue: 18000000000, net_income: 4800000000, earnings_per_share: 2.45, book_value_per_share: 18.7 },
  { ticker: '1150', period: 'annual', year: 2024, revenue: 14000000000, net_income: 3200000000, earnings_per_share: 1.85, book_value_per_share: 14.2 },
  { ticker: '1140', period: 'annual', year: 2024, revenue: 8500000000, net_income: 1800000000, earnings_per_share: 1.45, book_value_per_share: 11.8 },
  { ticker: '1020', period: 'annual', year: 2024, revenue: 6200000000, net_income: 1200000000, earnings_per_share: 1.12, book_value_per_share: 9.5 },
  { ticker: '1030', period: 'annual', year: 2024, revenue: 9500000000, net_income: 2100000000, earnings_per_share: 1.65, book_value_per_share: 13.2 },
  
  // Telecom
  { ticker: '7010', period: 'annual', year: 2024, revenue: 72000000000, net_income: 11500000000, earnings_per_share: 2.85, book_value_per_share: 16.8 },
  { ticker: '7020', period: 'annual', year: 2024, revenue: 15000000000, net_income: -2500000000, earnings_per_share: -1.25, book_value_per_share: 8.2 },
  { ticker: '7030', period: 'annual', year: 2024, revenue: 11000000000, net_income: -1800000000, earnings_per_share: -0.95, book_value_per_share: 7.5 },
  
  // Retail
  { ticker: '4001', period: 'annual', year: 2024, revenue: 14500000000, net_income: 1200000000, earnings_per_share: 1.45, book_value_per_share: 10.2 },
  { ticker: '4002', period: 'annual', year: 2024, revenue: 8500000000, net_income: 520000000, earnings_per_share: 0.85, book_value_per_share: 8.5 },
  { ticker: '4003', period: 'annual', year: 2024, revenue: 12000000000, net_income: 680000000, earnings_per_share: 0.95, book_value_per_share: 7.8 },
  
  // Real Estate
  { ticker: '4300', period: 'annual', year: 2024, revenue: 4500000000, net_income: 850000000, earnings_per_share: 0.72, book_value_per_share: 6.2 },
  { ticker: '4320', period: 'annual', year: 2024, revenue: 3200000000, net_income: -450000000, earnings_per_share: -0.35, book_value_per_share: 5.8 },
  
  // Insurance
  { ticker: '8250', period: 'annual', year: 2024, revenue: 18000000000, net_income: 1200000000, earnings_per_share: 2.15, book_value_per_share: 12.5 },
  { ticker: '8150', period: 'annual', year: 2024, revenue: 9500000000, net_income: 580000000, earnings_per_share: 1.25, book_value_per_share: 9.2 },
  
  // Healthcare
  { ticker: '4020', period: 'annual', year: 2024, revenue: 5500000000, net_income: 680000000, earnings_per_share: 1.45, book_value_per_share: 11.2 },
  { ticker: '4010', period: 'annual', year: 2024, revenue: 4200000000, net_income: 520000000, earnings_per_share: 1.28, book_value_per_share: 9.8 },
  
  // Food & Beverages
  { ticker: '3010', period: 'annual', year: 2024, revenue: 28000000000, net_income: 3200000000, earnings_per_share: 1.85, book_value_per_share: 12.5 },
  { ticker: '2290', period: 'annual', year: 2024, revenue: 15000000000, net_income: 1200000000, earnings_per_share: 1.12, book_value_per_share: 8.5 },
  
  // Materials
  { ticker: '2100', period: 'annual', year: 2024, revenue: 22000000000, net_income: 1800000000, earnings_per_share: 0.95, book_value_per_share: 14.2 },
  { ticker: '2200', period: 'annual', year: 2024, revenue: 8500000000, net_income: 420000000, earnings_per_share: 0.65, book_value_per_share: 10.5 },
]

async function seedFinancials() {
  console.log(`📊 Seeding financials for ${financials.length} companies...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const f of financials) {
    // Get company UUID by ticker
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', f.ticker)
      .single()
    
    if (companyErr || !company) {
      console.log(`⚠️ Skip ${f.ticker}: not in DB`)
      continue
    }
    
    const { error } = await supabase
      .from('financials')
      .upsert({
        company_id: company.id,
        period: f.period,
        year: f.year,
        revenue: f.revenue,
        net_income: f.net_income,
        earnings_per_share: f.earnings_per_share,
        book_value_per_share: f.book_value_per_share,
      }, { onConflict: 'company_id,period,year' })
    
    if (error) {
      console.log(`❌ ${f.ticker}: ${error.message}`)
      errorCount++
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} financials seeded`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Verify count
  const { count } = await supabase
    .from('financials')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total financials in DB: ${count}`)
}

seedFinancials().catch(console.error)
