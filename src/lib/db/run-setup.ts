/**
 * Execute setup.sql against Supabase.
 *
 * Usage:
 *   DB_URL="postgresql://postgres:[PASSWORD]@db.fszmvnmfazgjhsrbbpvx.supabase.co:5432/postgres" npx tsx src/lib/db/run-setup.ts
 *
 * Or paste setup.sql contents into Supabase Dashboard → SQL Editor.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

const DB_URL = process.env.DB_URL
if (!DB_URL) {
  console.error('❌ DB_URL not set.')
  console.error('   Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)')
  console.error('   Then run:')
  console.error('   DB_URL="postgresql://..." npx tsx src/lib/db/run-setup.ts')
  process.exit(1)
}

async function main() {
  const sql = postgres(DB_URL!, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
  })

  console.log('🔌 Connecting to database...')

  // Test connection
  const [{ current_database }] = await sql`SELECT current_database()`
  console.log(`✅ Connected to: ${current_database}`)

  // Read setup.sql
  const setupPath = join(__dirname, 'setup.sql')
  const setupSql = readFileSync(setupPath, 'utf-8')

  console.log('📄 Running setup.sql...')

  // Execute the entire SQL file as one transaction
  await sql.unsafe(setupSql)

  console.log('✅ Schema created successfully!')

  // Verify tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `
  console.log(`\n📊 Tables created (${tables.length}):`)
  for (const t of tables) {
    console.log(`   • ${t.table_name}`)
  }

  await sql.end()
  console.log('\n✅ Setup complete.')
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})
