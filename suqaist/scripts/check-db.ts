import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fszmvnmfazgjhsrbbpvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem12bm1mYXpnamhzcmJicHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDk2NiwiZXhwIjoyMDg3NjAwOTY2fQ.rQRW9NNokfh58LcEDvxk4y-NYTMPehRa5aNKYlazYqU'
)

async function checkTables() {
  console.log('📊 Database Table Counts:\n')
  
  const tables = ['companies', 'stock_prices', 'financials', 'dividends', 'news']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ ${table}: Error - ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count ?? 0} rows`)
    }
  }
  
  // Also check sample companies
  console.log('\n📈 Sample Companies (first 5):')
  const { data: companies } = await supabase
    .from('companies')
    .select('ticker, name_en, sector')
    .limit(5)
  
  companies?.forEach(c => {
    console.log(`  ${c.ticker} - ${c.name_en} (${c.sector})`)
  })
}

checkTables().catch(console.error)
