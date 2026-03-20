import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCompanyQuote, SahmApiError } from '@/lib/sahm'

/**
 * Cron: Update stock prices from Sahm API.
 *
 * Schedule: Every 15 min during Tadawul hours (Sun-Thu 10:00-15:00 AST).
 * Vercel Cron: "0/15 7-12 * * 0-4" (UTC → matches 10:00-15:00 AST)
 */

const CRON_SECRET = process.env.CRON_SECRET

function isTadawulOpen(): boolean {
  const now = new Date()
  // Convert to Riyadh time (UTC+3)
  const riyadh = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }))
  const day = riyadh.getDay() // 0=Sun, 6=Sat
  const hour = riyadh.getHours()
  const minute = riyadh.getMinutes()

  // Tadawul: Sun-Thu, 10:00-15:00 AST
  if (day === 5 || day === 6) return false // Fri, Sat
  const minuteOfDay = hour * 60 + minute
  return minuteOfDay >= 600 && minuteOfDay <= 900 // 10:00-15:00
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const force = request.nextUrl.searchParams.get('force') === 'true'

  if (!force && !isTadawulOpen()) {
    return NextResponse.json({
      success: true,
      message: 'Market is closed. Skipping price update.',
      marketOpen: false,
    })
  }

  const supabase = createServiceClient()

  try {
    // 1. Get all active companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, ticker')

    if (companiesError) {
      console.error('Failed to fetch companies:', companiesError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!companies?.length) {
      return NextResponse.json({ success: true, message: 'No companies to update', updated: 0 })
    }

    // 2. Fetch quotes from Sahm API (sequentially to respect rate limits)
    const today = new Date().toISOString().split('T')[0]
    let updated = 0
    let failed = 0

    for (const company of companies) {
      try {
        const quote = await getCompanyQuote(company.ticker)

        const { error } = await supabase
          .from('stock_prices')
          .upsert(
            {
              company_id: company.id,
              date: today,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              close: quote.price,
              volume: quote.volume,
              adjusted_close: quote.price,
            },
            { onConflict: 'company_id,date' },
          )

        if (error) {
          console.error(`DB upsert failed for ${company.ticker}:`, error)
          failed++
        } else {
          updated++
        }
      } catch (err) {
        if (err instanceof SahmApiError) {
          console.error(`Sahm API error for ${company.ticker}: ${err.message}`)
        } else {
          console.error(`Unknown error for ${company.ticker}:`, err)
        }
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      marketOpen: true,
      updated,
      failed,
      total: companies.length,
      elapsedMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Price cron error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
