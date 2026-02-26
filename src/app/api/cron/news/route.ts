import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchArgaamNews } from '@/lib/data-sources/argaam'
import { fetchAllAnnouncements } from '@/lib/data-sources/cma'

/**
 * Cron: Fetch and store news articles
 *
 * Schedule: Every hour
 * Vercel Cron: "0 * * * *"
 *
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/news",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify cron secret
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
    // 1. Fetch Argaam news
    const argaamArticles = await fetchArgaamNews(30)

    for (const article of argaamArticles) {
      // Deduplicate by source URL
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('source_url', article.url)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      // Find related company IDs from extracted tickers
      let companyId: string | null = null
      if (article.relatedTickers.length > 0) {
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('symbol', article.relatedTickers[0])
          .limit(1)

        if (company?.[0]) {
          companyId = company[0].id
        }
      }

      const { error } = await supabase.from('news').insert({
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
      })

      if (error) {
        errors.push(`Argaam insert: ${error.message}`)
      } else {
        newsInserted++
      }
    }

    // 2. Fetch CMA + Tadawul announcements
    const announcements = await fetchAllAnnouncements(20)

    for (const ann of announcements) {
      // Deduplicate by URL
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('source_url', ann.url)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      const { error } = await supabase.from('news').insert({
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
      })

      if (error) {
        errors.push(`${ann.source} insert: ${error.message}`)
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
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('News cron error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
