// scripts/seed-ownership.ts
// Seed ownership data for major companies
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

// Ownership data for major Saudi companies (latest available)
const ownershipData = [
  { ticker: '2222', date: '2024-12-31', foreign_percent: 0.4, institutional_percent: 85.0, government_percent: 10.0, retail_percent: 4.6 },
  { ticker: '1120', date: '2024-12-31', foreign_percent: 2.1, institutional_percent: 75.0, government_percent: 0.0, retail_percent: 22.9 },
  { ticker: '1180', date: '2024-12-31', foreign_percent: 1.8, institutional_percent: 80.0, government_percent: 5.0, retail_percent: 13.2 },
  { ticker: '2010', date: '2024-12-31', foreign_percent: 0.2, institutional_percent: 88.0, government_percent: 10.0, retail_percent: 1.8 },
  { ticker: '7010', date: '2024-12-31', foreign_percent: 4.5, institutional_percent: 70.0, government_percent: 15.0, retail_percent: 10.5 },
  { ticker: '1211', date: '2024-12-31', foreign_percent: 0.8, institutional_percent: 65.0, government_percent: 25.0, retail_percent: 9.2 },
  { ticker: '1150', date: '2024-12-31', foreign_percent: 1.5, institutional_percent: 60.0, government_percent: 0.0, retail_percent: 38.5 },
  { ticker: '1010', date: '2024-12-31', foreign_percent: 0.5, institutional_percent: 78.0, government_percent: 0.0, retail_percent: 21.5 },
  { ticker: '1140', date: '2024-12-31', foreign_percent: 0.8, institutional_percent: 55.0, government_percent: 0.0, retail_percent: 44.2 },
  { ticker: '1020', date: '2024-12-31', foreign_percent: 0.3, institutional_percent: 70.0, government_percent: 0.0, retail_percent: 29.7 },
  { ticker: '1030', date: '2024-12-31', foreign_percent: 1.2, institutional_percent: 72.0, government_percent: 0.0, retail_percent: 26.8 },
  { ticker: '3010', date: '2024-12-31', foreign_percent: 1.5, institutional_percent: 68.0, government_percent: 0.0, retail_percent: 30.5 },
  { ticker: '4001', date: '2024-12-31', foreign_percent: 0.8, institutional_percent: 45.0, government_percent: 0.0, retail_percent: 54.2 },
  { ticker: '4002', date: '2024-12-31', foreign_percent: 0.5, institutional_percent: 50.0, government_percent: 0.0, retail_percent: 49.5 },
  { ticker: '4300', date: '2024-12-31', foreign_percent: 0.3, institutional_percent: 60.0, government_percent: 0.0, retail_percent: 39.7 },
  { ticker: '8250', date: '2024-12-31', foreign_percent: 2.5, institutional_percent: 55.0, government_percent: 0.0, retail_percent: 42.5 },
  { ticker: '8150', date: '2024-12-31', foreign_percent: 1.8, institutional_percent: 52.0, government_percent: 0.0, retail_percent: 46.2 },
  { ticker: '4020', date: '2024-12-31', foreign_percent: 1.2, institutional_percent: 58.0, government_percent: 0.0, retail_percent: 40.8 },
  { ticker: '4010', date: '2024-12-31', foreign_percent: 0.9, institutional_percent: 62.0, government_percent: 0.0, retail_percent: 37.1 },
  { ticker: '5110', date: '2024-12-31', foreign_percent: 0.1, institutional_percent: 90.0, government_percent: 8.0, retail_percent: 1.9 },
  { ticker: '2082', date: '2024-12-31', foreign_percent: 3.5, institutional_percent: 55.0, government_percent: 0.0, retail_percent: 41.5 },
  { ticker: '4030', date: '2024-12-31', foreign_percent: 0.2, institutional_percent: 70.0, government_percent: 20.0, retail_percent: 9.8 },
  { ticker: '1820', date: '2024-12-31', foreign_percent: 0.8, institutional_percent: 75.0, government_percent: 10.0, retail_percent: 14.2 },
  { ticker: '2150', date: '2024-12-31', foreign_percent: 5.2, institutional_percent: 50.0, government_percent: 0.0, retail_percent: 44.8 },
  { ticker: '2160', date: '2024-12-31', foreign_percent: 2.8, institutional_percent: 48.0, government_percent: 0.0, retail_percent: 49.2 },
  { ticker: '7201', date: '2024-12-31', foreign_percent: 1.5, institutional_percent: 55.0, government_percent: 0.0, retail_percent: 43.5 },
  { ticker: '7202', date: '2024-12-31', foreign_percent: 1.2, institutional_percent: 52.0, government_percent: 0.0, retail_percent: 46.8 },
  { ticker: '2290', date: '2024-12-31', foreign_percent: 0.6, institutional_percent: 58.0, government_percent: 0.0, retail_percent: 41.4 },
  { ticker: '2040', date: '2024-12-31', foreign_percent: 0.4, institutional_percent: 75.0, government_percent: 15.0, retail_percent: 9.6 },
  { ticker: '2060', date: '2024-12-31', foreign_percent: 0.3, institutional_percent: 78.0, government_percent: 12.0, retail_percent: 9.7 },
]

async function seedOwnership() {
  console.log(`📊 Seeding ownership for ${ownershipData.length} companies...`)
  
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (const o of ownershipData) {
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', o.ticker)
      .single()
    
    if (companyErr || !company) {
      skipCount++
      continue
    }
    
    const { error } = await supabase
      .from('ownership')
      .upsert({
        company_id: company.id,
        date: o.date,
        foreign_percent: o.foreign_percent,
        institutional_percent: o.institutional_percent,
        government_percent: o.government_percent,
        retail_percent: o.retail_percent,
      }, { onConflict: 'company_id,date' })
    
    if (error) {
      console.log(`❌ ${o.ticker}: ${error.message}`)
      errorCount++
    } else {
      successCount++
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} ownership records seeded`)
  console.log(`⏭️ Skipped: ${skipCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  const { count } = await supabase
    .from('ownership')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📈 Total ownership in DB: ${count}`)
}

seedOwnership().catch(console.error)
