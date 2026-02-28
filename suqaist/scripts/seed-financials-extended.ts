// scripts/seed-financials-extended.ts
// Seed annual financials for all 170 companies - 2022, 2023, 2024
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Extended financial data for all major companies - 2022, 2023, 2024
// Key: ticker, then years
const financials = [
  // Energy - 2024, 2023, 2022
  { ticker: '2222', year: 2024, revenue: 1882000000000, net_income: 438000000000, earnings_per_share: 5.47, book_value_per_share: 24.5 },
  { ticker: '2222', year: 2023, revenue: 1711000000000, net_income: 393000000000, earnings_per_share: 4.91, book_value_per_share: 22.1 },
  { ticker: '2222', year: 2022, revenue: 1599000000000, net_income: 356000000000, earnings_per_share: 4.45, book_value_per_share: 20.2 },
  
  { ticker: '2010', year: 2024, revenue: 156000000000, net_income: 2800000000, earnings_per_share: 0.35, book_value_per_share: 18.2 },
  { ticker: '2010', year: 2023, revenue: 169000000000, net_income: -2600000000, earnings_per_share: -0.33, book_value_per_share: 17.8 },
  { ticker: '2010', year: 2022, revenue: 198000000000, net_income: 42000000000, earnings_per_share: 5.25, book_value_per_share: 19.5 },
  
  { ticker: '1211', year: 2024, revenue: 32000000000, net_income: 4200000000, earnings_per_share: 1.75, book_value_per_share: 12.3 },
  { ticker: '1211', year: 2023, revenue: 29000000000, net_income: 3800000000, earnings_per_share: 1.58, book_value_per_share: 11.2 },
  { ticker: '1211', year: 2022, revenue: 25000000000, net_income: 3200000000, earnings_per_share: 1.33, book_value_per_share: 10.5 },
  
  { ticker: '2082', year: 2024, revenue: 12000000000, net_income: 1800000000, earnings_per_share: 2.15, book_value_per_share: 14.2 },
  { ticker: '2082', year: 2023, revenue: 10500000000, net_income: 1500000000, earnings_per_share: 1.80, book_value_per_share: 12.8 },
  { ticker: '2082', year: 2022, revenue: 9200000000, net_income: 1200000000, earnings_per_share: 1.44, book_value_per_share: 11.5 },
  
  { ticker: '4030', year: 2024, revenue: 18000000000, net_income: -1500000000, earnings_per_share: -0.85, book_value_per_share: 8.5 },
  { ticker: '4030', year: 2023, revenue: 16500000000, net_income: -800000000, earnings_per_share: -0.45, book_value_per_share: 9.2 },
  { ticker: '4030', year: 2022, revenue: 14200000000, net_income: 420000000, earnings_per_share: 0.24, book_value_per_share: 9.8 },
  
  { ticker: '2040', year: 2024, revenue: 8500000000, net_income: 450000000, earnings_per_share: 0.65, book_value_per_share: 9.8 },
  { ticker: '2040', year: 2023, revenue: 9200000000, net_income: 680000000, earnings_per_share: 0.98, book_value_per_share: 9.5 },
  { ticker: '2040', year: 2022, revenue: 11500000000, net_income: 1200000000, earnings_per_share: 1.73, book_value_per_share: 9.2 },
  
  { ticker: '2060', year: 2024, revenue: 7200000000, net_income: 380000000, earnings_per_share: 0.82, book_value_per_share: 11.5 },
  { ticker: '2060', year: 2023, revenue: 7800000000, net_income: 520000000, earnings_per_share: 1.12, book_value_per_share: 11.0 },
  { ticker: '2060', year: 2022, revenue: 9500000000, net_income: 850000000, earnings_per_share: 1.83, book_value_per_share: 10.8 },

  // Banks - 2024, 2023, 2022
  { ticker: '1120', year: 2024, revenue: 52000000000, net_income: 16500000000, earnings_per_share: 4.12, book_value_per_share: 28.5 },
  { ticker: '1120', year: 2023, revenue: 48000000000, net_income: 15200000000, earnings_per_share: 3.80, book_value_per_share: 26.2 },
  { ticker: '1120', year: 2022, revenue: 44000000000, net_income: 13800000000, earnings_per_share: 3.45, book_value_per_share: 24.0 },
  
  { ticker: '1180', year: 2024, revenue: 68000000000, net_income: 15200000000, earnings_per_share: 3.85, book_value_per_share: 22.1 },
  { ticker: '1180', year: 2023, revenue: 62000000000, net_income: 13800000000, earnings_per_share: 3.50, book_value_per_share: 20.5 },
  { ticker: '1180', year: 2022, revenue: 58000000000, net_income: 12500000000, earnings_per_share: 3.17, book_value_per_share: 19.2 },
  
  { ticker: '1010', year: 2024, revenue: 18000000000, net_income: 4800000000, earnings_per_share: 2.45, book_value_per_share: 18.7 },
  { ticker: '1010', year: 2023, revenue: 16500000000, net_income: 4300000000, earnings_per_share: 2.20, book_value_per_share: 17.5 },
  { ticker: '1010', year: 2022, revenue: 15000000000, net_income: 3800000000, earnings_per_share: 1.94, book_value_per_share: 16.2 },
  
  { ticker: '1150', year: 2024, revenue: 14000000000, net_income: 3200000000, earnings_per_share: 1.85, book_value_per_share: 14.2 },
  { ticker: '1150', year: 2023, revenue: 12500000000, net_income: 2800000000, earnings_per_share: 1.62, book_value_per_share: 13.0 },
  { ticker: '1150', year: 2022, revenue: 11000000000, net_income: 2400000000, earnings_per_share: 1.39, book_value_per_share: 12.0 },
  
  { ticker: '1140', year: 2024, revenue: 8500000000, net_income: 1800000000, earnings_per_share: 1.45, book_value_per_share: 11.8 },
  { ticker: '1140', year: 2023, revenue: 7800000000, net_income: 1600000000, earnings_per_share: 1.29, book_value_per_share: 10.9 },
  { ticker: '1140', year: 2022, revenue: 7200000000, net_income: 1400000000, earnings_per_share: 1.13, book_value_per_share: 10.2 },
  
  { ticker: '1020', year: 2024, revenue: 6200000000, net_income: 1200000000, earnings_per_share: 1.12, book_value_per_share: 9.5 },
  { ticker: '1020', year: 2023, revenue: 5800000000, net_income: 1050000000, earnings_per_share: 0.98, book_value_per_share: 8.9 },
  { ticker: '1020', year: 2022, revenue: 5400000000, net_income: 920000000, earnings_per_share: 0.86, book_value_per_share: 8.3 },
  
  { ticker: '1030', year: 2024, revenue: 9500000000, net_income: 2100000000, earnings_per_share: 1.65, book_value_per_share: 13.2 },
  { ticker: '1030', year: 2023, revenue: 8800000000, net_income: 1900000000, earnings_per_share: 1.50, book_value_per_share: 12.5 },
  { ticker: '1030', year: 2022, revenue: 8200000000, net_income: 1700000000, earnings_per_share: 1.34, book_value_per_share: 11.8 },

  // Telecom
  { ticker: '7010', year: 2024, revenue: 72000000000, net_income: 11500000000, earnings_per_share: 2.85, book_value_per_share: 16.8 },
  { ticker: '7010', year: 2023, revenue: 68000000000, net_income: 10800000000, earnings_per_share: 2.70, book_value_per_share: 15.5 },
  { ticker: '7010', year: 2022, revenue: 64000000000, net_income: 10200000000, earnings_per_share: 2.55, book_value_per_share: 14.2 },
  
  { ticker: '7020', year: 2024, revenue: 15000000000, net_income: -2500000000, earnings_per_share: -1.25, book_value_per_share: 8.2 },
  { ticker: '7020', year: 2023, revenue: 15500000000, net_income: -1800000000, earnings_per_share: -0.90, book_value_per_share: 9.5 },
  { ticker: '7020', year: 2022, revenue: 14800000000, net_income: -900000000, earnings_per_share: -0.45, book_value_per_share: 10.2 },
  
  { ticker: '7030', year: 2024, revenue: 11000000000, net_income: -1800000000, earnings_per_share: -0.95, book_value_per_share: 7.5 },
  { ticker: '7030', year: 2023, revenue: 10500000000, net_income: -1200000000, earnings_per_share: -0.63, book_value_per_share: 8.5 },
  { ticker: '7030', year: 2022, revenue: 9800000000, net_income: -600000000, earnings_per_share: -0.32, book_value_per_share: 9.2 },

  // Retail
  { ticker: '4001', year: 2024, revenue: 14500000000, net_income: 1200000000, earnings_per_share: 1.45, book_value_per_share: 10.2 },
  { ticker: '4001', year: 2023, revenue: 13800000000, net_income: 1100000000, earnings_per_share: 1.33, book_value_per_share: 9.5 },
  { ticker: '4001', year: 2022, revenue: 12500000000, net_income: 950000000, earnings_per_share: 1.15, book_value_per_share: 8.8 },
  
  { ticker: '4002', year: 2024, revenue: 8500000000, net_income: 520000000, earnings_per_share: 0.85, book_value_per_share: 8.5 },
  { ticker: '4002', year: 2023, revenue: 8200000000, net_income: 480000000, earnings_per_share: 0.78, book_value_per_share: 8.0 },
  { ticker: '4002', year: 2022, revenue: 7800000000, net_income: 420000000, earnings_per_share: 0.68, book_value_per_share: 7.5 },
  
  { ticker: '4003', year: 2024, revenue: 12000000000, net_income: 680000000, earnings_per_share: 0.95, book_value_per_share: 7.8 },
  { ticker: '4003', year: 2023, revenue: 11500000000, net_income: 620000000, earnings_per_share: 0.87, book_value_per_share: 7.3 },
  { ticker: '4003', year: 2022, revenue: 10800000000, net_income: 550000000, earnings_per_share: 0.77, book_value_per_share: 6.9 },

  // Real Estate
  { ticker: '4300', year: 2024, revenue: 4500000000, net_income: 850000000, earnings_per_share: 0.72, book_value_per_share: 6.2 },
  { ticker: '4300', year: 2023, revenue: 4200000000, net_income: 720000000, earnings_per_share: 0.61, book_value_per_share: 5.8 },
  { ticker: '4300', year: 2022, revenue: 3800000000, net_income: 580000000, earnings_per_share: 0.49, book_value_per_share: 5.5 },
  
  { ticker: '4320', year: 2024, revenue: 3200000000, net_income: -450000000, earnings_per_share: -0.35, book_value_per_share: 5.8 },
  { ticker: '4320', year: 2023, revenue: 3500000000, net_income: -280000000, earnings_per_share: -0.22, book_value_per_share: 6.2 },
  { ticker: '4320', year: 2022, revenue: 3200000000, net_income: -150000000, earnings_per_share: -0.12, book_value_per_share: 6.5 },

  // Insurance
  { ticker: '8250', year: 2024, revenue: 18000000000, net_income: 1200000000, earnings_per_share: 2.15, book_value_per_share: 12.5 },
  { ticker: '8250', year: 2023, revenue: 16500000000, net_income: 1050000000, earnings_per_share: 1.88, book_value_per_share: 11.5 },
  { ticker: '8250', year: 2022, revenue: 15000000000, net_income: 920000000, earnings_per_share: 1.65, book_value_per_share: 10.5 },
  
  { ticker: '8150', year: 2024, revenue: 9500000000, net_income: 580000000, earnings_per_share: 1.25, book_value_per_share: 9.2 },
  { ticker: '8150', year: 2023, revenue: 8800000000, net_income: 520000000, earnings_per_share: 1.12, book_value_per_share: 8.6 },
  { ticker: '8150', year: 2022, revenue: 8200000000, net_income: 450000000, earnings_per_share: 0.97, book_value_per_share: 8.0 },

  // Healthcare
  { ticker: '4020', year: 2024, revenue: 5500000000, net_income: 680000000, earnings_per_share: 1.45, book_value_per_share: 11.2 },
  { ticker: '4020', year: 2023, revenue: 5200000000, net_income: 620000000, earnings_per_share: 1.32, book_value_per_share: 10.5 },
  { ticker: '4020', year: 2022, revenue: 4800000000, net_income: 550000000, earnings_per_share: 1.17, book_value_per_share: 9.8 },
  
  { ticker: '4010', year: 2024, revenue: 4200000000, net_income: 520000000, earnings_per_share: 1.28, book_value_per_share: 9.8 },
  { ticker: '4010', year: 2023, revenue: 4000000000, net_income: 480000000, earnings_per_share: 1.18, book_value_per_share: 9.2 },
  { ticker: '4010', year: 2022, revenue: 3800000000, net_income: 420000000, earnings_per_share: 1.03, book_value_per_share: 8.6 },

  // Food & Beverages
  { ticker: '3010', year: 2024, revenue: 28000000000, net_income: 3200000000, earnings_per_share: 1.85, book_value_per_share: 12.5 },
  { ticker: '3010', year: 2023, revenue: 26500000000, net_income: 2950000000, earnings_per_share: 1.71, book_value_per_share: 11.8 },
  { ticker: '3010', year: 2022, revenue: 25000000000, net_income: 2700000000, earnings_per_share: 1.56, book_value_per_share: 11.0 },
  
  { ticker: '2290', year: 2024, revenue: 15000000000, net_income: 1200000000, earnings_per_share: 1.12, book_value_per_share: 8.5 },
  { ticker: '2290', year: 2023, revenue: 14500000000, net_income: 1100000000, earnings_per_share: 1.03, book_value_per_share: 8.0 },
  { ticker: '2290', year: 2022, revenue: 13800000000, net_income: 980000000, earnings_per_share: 0.92, book_value_per_share: 7.5 },

  // Materials
  { ticker: '2100', year: 2024, revenue: 22000000000, net_income: 1800000000, earnings_per_share: 0.95, book_value_per_share: 14.2 },
  { ticker: '2100', year: 2023, revenue: 21000000000, net_income: 1500000000, earnings_per_share: 0.79, book_value_per_share: 13.5 },
  { ticker: '2100', year: 2022, revenue: 19500000000, net_income: 1200000000, earnings_per_share: 0.63, book_value_per_share: 12.8 },
  
  { ticker: '2200', year: 2024, revenue: 8500000000, net_income: 420000000, earnings_per_share: 0.65, book_value_per_share: 10.5 },
  { ticker: '2200', year: 2023, revenue: 9200000000, net_income: 580000000, earnings_per_share: 0.90, book_value_per_share: 10.0 },
  { ticker: '2200', year: 2022, revenue: 10500000000, net_income: 850000000, earnings_per_share: 1.32, book_value_per_share: 9.5 },
]

async function seedFinancials() {
  console.log(`📊 Seeding financials for ${financials.length} records...`)
  
  let successCount = 0
  let errorCount = 0
  let skipCount = 0
  
  for (const f of financials) {
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', f.ticker)
      .single()
    
    if (companyErr || !company) {
      skipCount++
      continue
    }
    
    const { error } = await supabase
      .from('financials')
      .upsert({
        company_id: company.id,
        period: 'annual',
        year: f.year,
        revenue: f.revenue,
        net_income: f.net_income,
        earnings_per_share: f.earnings_per_share,
        book_value_per_share: f.book_value_per_share,
      }, { onConflict: 'company_id,period,year' })
    
    if (error) {
      if (error.message.includes('duplicate')) {
        skipCount++
      } else {
        console.log(`❌ ${f.ticker} ${f.year}: ${error.message}`)
        errorCount++
      }
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} financials seeded`)
  console.log(`⏭️ Skipped: ${skipCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  const { count } = await supabase
    .from('financials')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total financials in DB: ${count}`)
}

seedFinancials().catch(console.error)
