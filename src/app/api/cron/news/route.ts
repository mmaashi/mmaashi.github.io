import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchArgaamNews } from '@/lib/data-sources/argaam'
import { fetchAllAnnouncements } from '@/lib/data-sources/cma'

/**
 * Cron: Fetch and store news articles with company linking.
 *
 * Schedule: Every hour
 * Vercel Cron: "0 * * * *"
 *
 * Company linking logic:
 *   1. argaam.ts extracts 4-digit Tadawul tickers from article text
 *      (both via keyword map and regex: "2222", "7010", etc.)
 *   2. We look up the FIRST matched ticker in companies.ticker
 *   3. If found, the news row gets company_id set → appears on the stock page
 *   4. If no match, company_id = null → appears only in the general news feed
 *
 * Deduplication: upsert with onConflict: 'source_url' — safe to re-run.
 */

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Look up a company ID from a list of extracted ticker strings.
 * Returns the first matching company's UUID, or null.
 */
async function resolveCompanyId(
  supabase: ReturnType<typeof createServiceClient>,
  tickers: string[]
): Promise<string | null> {
  if (tickers.length === 0) return null

  // Try each ticker in order — return first match
  for (const ticker of tickers) {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('ticker', ticker)
      .limit(1)
      .single()

    if (data?.id) return data.id
  }

  return null
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically via CRON_SECRET env var)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = createServiceClient()

  let newsInserted = 0
  let announcementsInserted = 0
  let skipped = 0
  const errors: string[] = []

  try {
    // ── 1. Fetch Argaam news (EN + AR feeds merged) ─────────────
    const argaamArticles = await fetchArgaamNews(40)

    for (const article of argaamArticles) {
      // Resolve company_id from extracted tickers (tries all, returns first match)
      const companyId = await resolveCompanyId(supabase, article.relatedTickers)

      // Upsert — safe to re-run, skips duplicate source_url rows
      const { error, statusText } = await supabase.from('news').upsert(
        {
          company_id: companyId,
          title_en: article.title,
          title_ar: article.title_ar,
          title_zh: null,
          body_en: article.description,
          body_ar: null,
          body_zh: null,
          source: 'argaam',
          source_url: article.url,
          sentiment_score: null,
          published_at: article.publishedAt,
        },
        {
          onConflict: 'source_url',
          ignoreDuplicates: true,
        }
      )

      if (error) {
        // "23505" = unique violation — treated as a skip, not an error
        if (error.code === '23505' || statusText === 'Conflict') {
          skipped++
        } else {
          errors.push(`Argaam insert (${article.url.slice(-40)}): ${error.message}`)
        }
      } else {
        newsInserted++
      }
    }

    // ── 2. Fetch CMA + Tadawul regulatory announcements ─────────
    const announcements = await fetchAllAnnouncements(20)

    for (const ann of announcements) {
      const { error, statusText } = await supabase.from('news').upsert(
        {
          company_id: null,
          title_en: ann.title,
          title_ar: ann.title_ar,
          title_zh: null,
          body_en: ann.description,
          body_ar: null,
          body_zh: null,
          source: ann.source,
          source_url: ann.url,
          sentiment_score: null,
          published_at: ann.publishedAt,
        },
        {
          onConflict: 'source_url',
          ignoreDuplicates: true,
        }
      )

      if (error) {
        if (error.code === '23505' || statusText === 'Conflict') {
          skipped++
        } else {
          errors.push(`${ann.source} insert: ${error.message}`)
        }
      } else {
        announcementsInserted++
      }
    }

    const elapsed = Date.now() - startTime

    return NextResponse.json({
      success: true,
      newsInserted,
      announcementsInserted,
      skipped,
      total: argaamArticles.length + announcements.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('News cron error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
