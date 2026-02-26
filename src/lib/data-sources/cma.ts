/**
 * CMA (Capital Market Authority) data source
 *
 * The Saudi CMA (cma.org.sa) publishes regulatory announcements,
 * enforcement actions, new regulations, and market circulars.
 *
 * Sources:
 *   - CMA announcements page: https://cma.org.sa/en/Market/NEWS/Pages/default.aspx
 *   - Tadawul announcements: https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/news-updates
 */

export interface CMAannouncement {
  title: string
  title_ar: string | null
  description: string
  url: string
  publishedAt: string
  source: 'cma' | 'tadawul'
  type: CMAAnnouncementType
  relatedTickers: string[]
}

export type CMAAnnouncementType =
  | 'regulation'       // New rules or amendments
  | 'enforcement'      // Penalties, violations
  | 'circular'         // Market circulars
  | 'listing'          // IPO approvals, delistings
  | 'corporate_action' // Dividends, rights issues, mergers
  | 'general'          // Everything else

const CMA_NEWS_EN = 'https://cma.org.sa/en/Market/NEWS/Pages/default.aspx'
const CMA_NEWS_AR = 'https://cma.org.sa/ar/Market/NEWS/Pages/default.aspx'
const TADAWUL_NEWS = 'https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/news-updates'

/**
 * Classify announcement type from title/description.
 */
function classifyAnnouncement(text: string): CMAAnnouncementType {
  const lower = text.toLowerCase()

  if (lower.includes('regulation') || lower.includes('rule') || lower.includes('لائحة') || lower.includes('نظام')) {
    return 'regulation'
  }
  if (lower.includes('penalty') || lower.includes('violation') || lower.includes('مخالفة') || lower.includes('غرامة')) {
    return 'enforcement'
  }
  if (lower.includes('circular') || lower.includes('تعميم')) {
    return 'circular'
  }
  if (lower.includes('listing') || lower.includes('ipo') || lower.includes('إدراج') || lower.includes('طرح')) {
    return 'listing'
  }
  if (
    lower.includes('dividend') || lower.includes('rights') || lower.includes('merger') ||
    lower.includes('توزيعات') || lower.includes('حقوق أولوية') || lower.includes('اندماج')
  ) {
    return 'corporate_action'
  }
  return 'general'
}

/**
 * Fetch CMA announcements by scraping the announcements page.
 * Falls back gracefully if scraping fails.
 */
export async function fetchCMAannouncements(limit = 20): Promise<CMAannouncement[]> {
  const announcements: CMAannouncement[] = []

  // Fetch CMA English page
  try {
    const res = await fetch(CMA_NEWS_EN, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SUQAI/1.0)',
        'Accept': 'text/html',
      },
      next: { revalidate: 0 },
    })

    if (res.ok) {
      const html = await res.text()
      const parsed = parseCMAPage(html, 'en')
      announcements.push(...parsed)
    }
  } catch (err) {
    console.error('CMA EN fetch error:', err)
  }

  // Fetch CMA Arabic page for Arabic titles
  try {
    const res = await fetch(CMA_NEWS_AR, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SUQAI/1.0)',
        'Accept': 'text/html',
      },
      next: { revalidate: 0 },
    })

    if (res.ok) {
      const html = await res.text()
      const parsed = parseCMAPage(html, 'ar')

      // Merge Arabic titles into English announcements or add new ones
      for (const arItem of parsed) {
        const existingIdx = announcements.findIndex(
          (a) => Math.abs(new Date(a.publishedAt).getTime() - new Date(arItem.publishedAt).getTime()) < 86400000
            && a.type === arItem.type
        )
        if (existingIdx >= 0) {
          announcements[existingIdx].title_ar = arItem.title
        } else {
          announcements.push(arItem)
        }
      }
    }
  } catch (err) {
    console.error('CMA AR fetch error:', err)
  }

  return announcements
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

/**
 * Parse CMA announcements page HTML.
 * CMA uses SharePoint-style pages. We look for common patterns.
 */
function parseCMAPage(html: string, lang: 'en' | 'ar'): CMAannouncement[] {
  const items: CMAannouncement[] = []

  // CMA pages typically have news items in list format
  // Pattern: <a> tags with hrefs containing /NEWS/ and dates nearby
  const linkPattern = /<a[^>]*href="([^"]*\/NEWS\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1].startsWith('http')
      ? match[1]
      : `https://cma.org.sa${match[1]}`
    const title = match[2].replace(/<[^>]+>/g, '').trim()

    if (!title || title.length < 10) continue

    // Try to find a date near this link
    const dateMatch = html.slice(Math.max(0, match.index - 200), match.index + match[0].length + 200)
      .match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/)
    const publishedAt = dateMatch
      ? new Date(dateMatch[0]).toISOString()
      : new Date().toISOString()

    items.push({
      title,
      title_ar: lang === 'ar' ? title : null,
      description: title,
      url,
      publishedAt,
      source: 'cma',
      type: classifyAnnouncement(title),
      relatedTickers: [],
    })
  }

  return items
}

/**
 * Fetch Saudi Exchange (Tadawul) company announcements.
 * These are the official company disclosures filed through Tadawul.
 */
export async function fetchTadawulAnnouncements(limit = 20): Promise<CMAannouncement[]> {
  const announcements: CMAannouncement[] = []

  try {
    // Tadawul has a JSON API for announcements
    const res = await fetch(
      'https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/news-updates/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8zi_Tx8nD0MLIy83V1DnA0CXSwtPIxcDA0MPM31w1EV-Lv7BYe4m_s5uxoxwAEcDQgq9yUJBPkGOOorBJcUZaYn5uoX5OTH56emA0A9ECnKA!!/p0/IZ7_NHLCH082KOAG20A6COBJ5Q0080=CZ6_NHLCH082KOAG20A6COBJ5Q00G4=N/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SUQAI/1.0)',
          'Accept': 'application/json, text/html',
        },
        next: { revalidate: 0 },
      }
    )

    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('json')) {
        const data = await res.json()
        // Process JSON response
        if (Array.isArray(data)) {
          for (const item of data.slice(0, limit)) {
            announcements.push({
              title: item.title || item.Title || '',
              title_ar: item.titleAr || item.TitleAr || null,
              description: (item.description || item.Description || '').slice(0, 500),
              url: item.url || item.Url || TADAWUL_NEWS,
              publishedAt: item.publishDate
                ? new Date(item.publishDate).toISOString()
                : new Date().toISOString(),
              source: 'tadawul',
              type: classifyAnnouncement(item.title || ''),
              relatedTickers: [],
            })
          }
        }
      }
    }
  } catch (err) {
    console.error('Tadawul announcements fetch error:', err)
  }

  return announcements.slice(0, limit)
}

/**
 * Fetch all regulatory and market announcements from both CMA and Tadawul.
 */
export async function fetchAllAnnouncements(limit = 30): Promise<CMAannouncement[]> {
  const [cmaItems, tadawulItems] = await Promise.allSettled([
    fetchCMAannouncements(limit),
    fetchTadawulAnnouncements(limit),
  ])

  const all: CMAannouncement[] = [
    ...(cmaItems.status === 'fulfilled' ? cmaItems.value : []),
    ...(tadawulItems.status === 'fulfilled' ? tadawulItems.value : []),
  ]

  return all
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}
