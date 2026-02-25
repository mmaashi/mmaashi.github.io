/**
 * Argaam data source — Saudi financial news and filings
 *
 * Argaam (argaam.com) is the leading Saudi financial news portal.
 * We use their RSS feed + article scraping for news aggregation.
 *
 * RSS feeds:
 *   - https://www.argaam.com/en/feeds/articles-rss  (English)
 *   - https://www.argaam.com/ar/feeds/articles-rss  (Arabic)
 */

export interface ArgaamArticle {
  title: string
  title_ar: string | null
  description: string
  url: string
  publishedAt: string // ISO timestamp
  source: 'argaam'
  category: 'news' | 'analysis' | 'filing' | 'market'
  relatedTickers: string[] // extracted ticker symbols
}

const ARGAAM_RSS_EN = 'https://www.argaam.com/en/feeds/articles-rss'
const ARGAAM_RSS_AR = 'https://www.argaam.com/ar/feeds/articles-rss'

// Known Saudi company name → ticker mapping for entity extraction
const COMPANY_KEYWORDS: Record<string, string> = {
  aramco: '2222.SR',
  'saudi aramco': '2222.SR',
  'أرامكو': '2222.SR',
  'al rajhi': '1120.SR',
  'الراجحي': '1120.SR',
  sabic: '2010.SR',
  'سابك': '2010.SR',
  stc: '7010.SR',
  'الاتصالات السعودية': '7010.SR',
  'saudi telecom': '7010.SR',
  acwa: '2082.SR',
  'أكوا باور': '2082.SR',
  'acwa power': '2082.SR',
  'snb': '1180.SR',
  'البنك الأهلي': '1180.SR',
  'saudi national bank': '1180.SR',
  maaden: '1211.SR',
  'معادن': '1211.SR',
  'saudi arabian mining': '1211.SR',
  'jarir': '4190.SR',
  'جرير': '4190.SR',
  'extra': '4003.SR',
  'الحكير': '4006.SR',
  'almarai': '2280.SR',
  'المراعي': '2280.SR',
}

/**
 * Parse RSS XML into article objects.
 * Simple XML parsing without external deps.
 */
function parseRSSItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = []

  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const getTag = (tag: string) => {
      const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'))
      return tagMatch?.[1]?.trim() ?? ''
    }

    items.push({
      title: getTag('title'),
      link: getTag('link'),
      description: getTag('description'),
      pubDate: getTag('pubDate'),
    })
  }

  return items
}

/**
 * Extract related ticker symbols from article text.
 */
function extractTickers(text: string): string[] {
  const tickers = new Set<string>()
  const lowerText = text.toLowerCase()

  for (const [keyword, ticker] of Object.entries(COMPANY_KEYWORDS)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tickers.add(ticker)
    }
  }

  // Also match raw ticker patterns like "2222" or "2222.SE"
  const tickerPattern = /\b(\d{4})(?:\.SE)?\b/g
  let tickerMatch: RegExpExecArray | null
  while ((tickerMatch = tickerPattern.exec(text)) !== null) {
    // Only add if it looks like a valid Tadawul ticker (1000-9999)
    const num = parseInt(tickerMatch[1], 10)
    if (num >= 1000 && num <= 9999) {
      tickers.add(`${tickerMatch[1]}.SE`)
    }
  }

  return Array.from(tickers)
}

/**
 * Categorize article based on title/description keywords.
 */
function categorizeArticle(title: string, description: string): ArgaamArticle['category'] {
  const text = `${title} ${description}`.toLowerCase()

  if (text.includes('filing') || text.includes('disclosure') || text.includes('إفصاح') || text.includes('تقرير')) {
    return 'filing'
  }
  if (text.includes('analysis') || text.includes('تحليل') || text.includes('forecast') || text.includes('outlook')) {
    return 'analysis'
  }
  if (text.includes('tasi') || text.includes('index') || text.includes('مؤشر') || text.includes('تاسي')) {
    return 'market'
  }
  return 'news'
}

/**
 * Fetch latest articles from Argaam RSS feeds.
 * Fetches both English and Arabic feeds, deduplicates by URL.
 */
export async function fetchArgaamNews(limit = 30): Promise<ArgaamArticle[]> {
  const articles: ArgaamArticle[] = []

  // Fetch English feed
  try {
    const enRes = await fetch(ARGAAM_RSS_EN, {
      headers: { 'User-Agent': 'SUQAI/1.0' },
      next: { revalidate: 0 },
    })
    if (enRes.ok) {
      const xml = await enRes.text()
      const items = parseRSSItems(xml)

      for (const item of items.slice(0, limit)) {
        articles.push({
          title: item.title,
          title_ar: null, // Will be matched with Arabic feed
          description: item.description.replace(/<[^>]+>/g, '').slice(0, 500),
          url: item.link,
          publishedAt: new Date(item.pubDate).toISOString(),
          source: 'argaam',
          category: categorizeArticle(item.title, item.description),
          relatedTickers: extractTickers(`${item.title} ${item.description}`),
        })
      }
    }
  } catch (err) {
    console.error('Argaam EN feed error:', err)
  }

  // Fetch Arabic feed
  try {
    const arRes = await fetch(ARGAAM_RSS_AR, {
      headers: { 'User-Agent': 'SUQAI/1.0' },
      next: { revalidate: 0 },
    })
    if (arRes.ok) {
      const xml = await arRes.text()
      const items = parseRSSItems(xml)

      for (const item of items.slice(0, limit)) {
        // Check if we already have an English version by URL pattern
        const existingIdx = articles.findIndex(
          (a) => a.url.replace('/en/', '/ar/') === item.link || a.url.replace('/ar/', '/en/') === item.link
        )

        if (existingIdx >= 0) {
          // Merge Arabic title into existing article
          articles[existingIdx].title_ar = item.title
        } else {
          articles.push({
            title: item.title, // Arabic title in title field
            title_ar: item.title,
            description: item.description.replace(/<[^>]+>/g, '').slice(0, 500),
            url: item.link,
            publishedAt: new Date(item.pubDate).toISOString(),
            source: 'argaam',
            category: categorizeArticle(item.title, item.description),
            relatedTickers: extractTickers(`${item.title} ${item.description}`),
          })
        }
      }
    }
  } catch (err) {
    console.error('Argaam AR feed error:', err)
  }

  // Sort by published date, newest first
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return articles.slice(0, limit)
}
