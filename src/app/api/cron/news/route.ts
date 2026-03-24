import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchArgaamNews } from '@/lib/data-sources/argaam'
import { fetchAllAnnouncements } from '@/lib/data-sources/cma'
import { fetchMubasherNews } from '@/lib/data-sources/mubasher'
import { decodeHtml } from '@/lib/decode-html'

/**
 * Cron: Fetch and store news articles with company linking.
 *
 * Schedule: Every 4 hours — vercel.json: "0 */4 * * *"
 *
 * Sources:
 *   1. Mubasher (Arabic + English) — Saudi market news & technical analysis
 *   2. Argaam (Arabic + English) — Saudi financial news & filings
 *   3. CMA + Tadawul — Regulatory announcements
 *
 * Requires UNIQUE(source_url) on the news table.
 * Run in Supabase SQL Editor if not already applied:
 *   ALTER TABLE news ADD CONSTRAINT news_source_url_unique UNIQUE (source_url);
 */

const CRON_SECRET = process.env.CRON_SECRET

type NewsRow = {
  company_id: string | null
  title_en: string | null
  title_ar: string | null
  body_en: string | null
  body_ar: string | null
  source: string
  source_url: string
  sentiment_score: null
  published_at: string
}

async function resolveCompanyId(
  supabase: ReturnType<typeof createServiceClient>,
  tickers: string[]
): Promise<string | null> {
  if (tickers.length === 0) return null
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

async function safeInsert(
  supabase: ReturnType<typeof createServiceClient>,
  row: NewsRow
): Promise<'inserted' | 'skipped' | 'error'> {
  // Try upsert first (requires UNIQUE constraint on source_url)
  const { error } = await supabase.from('news').upsert(row, {
    onConflict: 'source_url',
    ignoreDuplicates: true,
  })

  if (!error) return 'inserted'

  // If upsert fails due to missing constraint, fall back to manual dedup
  if (error.message.includes('no unique or exclusion constraint')) {
    const { data: existing } = await supabase
      .from('news')
      .select('id')
      .eq('source_url', row.source_url)
      .limit(1)

    if (existing && existing.length > 0) return 'skipped'

    const { error: insertErr } = await supabase.from('news').insert(row)
    if (insertErr?.code === '23505') return 'skipped'  // race condition duplicate
    if (insertErr) throw new Error(insertErr.message)
    return 'inserted'
  }

  if (error.code === '23505') return 'skipped'  // unique violation
  throw new Error(error.message)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = createServiceClient()

  let mubasherInserted = 0
  let argaamInserted = 0
  let announcementsInserted = 0
  let skipped = 0
  const errors: string[] = []

  // ── 1. Mubasher news ──────────────────────────────────────────
  let mubasherFetched = 0
  try {
    const mubasherArticles = await fetchMubasherNews(50)
    mubasherFetched = mubasherArticles.length

    for (const article of mubasherArticles) {
      try {
        const companyId = await resolveCompanyId(supabase, article.relatedTickers)
        const row: NewsRow = {
          company_id: companyId,
          title_en: article.title,
          title_ar: article.title_ar,
          body_en: article.description || null,
          body_ar: article.title_ar ? (article.description || null) : null,
          source: 'mubasher',
          source_url: article.url,
          sentiment_score: null,
          published_at: article.publishedAt,
        }
        const result = await safeInsert(supabase, row)
        if (result === 'inserted') mubasherInserted++
        else skipped++
      } catch (err) {
        errors.push(`Mubasher: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } catch (err) {
    errors.push(`Mubasher fetch failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 2. Argaam news ────────────────────────────────────────────
  let argaamFetched = 0
  try {
    const argaamArticles = await fetchArgaamNews(40)
    argaamFetched = argaamArticles.length

    for (const article of argaamArticles) {
      try {
        const companyId = await resolveCompanyId(supabase, article.relatedTickers)
        const row: NewsRow = {
          company_id: companyId,
          title_en: article.title,
          title_ar: article.title_ar,
          body_en: article.description || null,
          body_ar: null,
          source: 'argaam',
          source_url: article.url,
          sentiment_score: null,
          published_at: article.publishedAt,
        }
        const result = await safeInsert(supabase, row)
        if (result === 'inserted') argaamInserted++
        else skipped++
      } catch (err) {
        errors.push(`Argaam: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } catch (err) {
    errors.push(`Argaam fetch failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 3. CMA + Tadawul announcements ───────────────────────────
  let announcementsFetched = 0
  try {
    const announcements = await fetchAllAnnouncements(20)
    announcementsFetched = announcements.length

    for (const ann of announcements) {
      try {
        const annCompanyId = await resolveCompanyId(supabase, ann.relatedTickers)
        const row: NewsRow = {
          company_id: annCompanyId,
          title_en: decodeHtml(ann.title),
          title_ar: ann.title_ar ? decodeHtml(ann.title_ar) : null,
          body_en: ann.description ? decodeHtml(ann.description) : null,
          body_ar: null,
          source: ann.source,
          source_url: ann.url,
          sentiment_score: null,
          published_at: ann.publishedAt,
        }
        const result = await safeInsert(supabase, row)
        if (result === 'inserted') announcementsInserted++
        else skipped++
      } catch (err) {
        errors.push(`${ann.source}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  } catch (err) {
    errors.push(`Announcements fetch failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── 4. Clean old HTML entities in existing data ──────────────
  // One-time cleanup: decode &quot; and similar in existing titles
  let cleaned = 0
  try {
    const { data: dirtyRows } = await supabase
      .from('news')
      .select('id, title_en, title_ar')
      .or('title_en.like.%&quot;%,title_ar.like.%&quot;%,title_en.like.%&amp;%,title_ar.like.%&amp;%')
      .limit(100)

    if (dirtyRows && dirtyRows.length > 0) {
      for (const row of dirtyRows) {
        const updates: Record<string, string> = {}
        if (row.title_en && (row.title_en.includes('&quot;') || row.title_en.includes('&amp;'))) {
          updates.title_en = decodeHtml(row.title_en)
        }
        if (row.title_ar && (row.title_ar.includes('&quot;') || row.title_ar.includes('&amp;'))) {
          updates.title_ar = decodeHtml(row.title_ar)
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('news').update(updates).eq('id', row.id)
          cleaned++
        }
      }
    }
  } catch (err) {
    errors.push(`Cleanup: ${err instanceof Error ? err.message : String(err)}`)
  }

  return NextResponse.json({
    success: true,
    inserted: {
      mubasher: mubasherInserted,
      argaam: argaamInserted,
      announcements: announcementsInserted,
    },
    cleaned,
    skipped,
    fetched: {
      mubasher: mubasherFetched,
      argaam: argaamFetched,
      announcements: announcementsFetched,
    },
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    elapsedMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  })
}
