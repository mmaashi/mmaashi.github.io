/**
 * Mubasher data source — Saudi financial news
 *
 * Mubasher (mubasher.info) is the largest Arabic-language financial news platform
 * in MENA. Covers Tadawul-listed companies, market analysis, and technical analysis.
 *
 * RSS feeds:
 *   - https://english.mubasher.info/news/rss  (English)
 *   - https://www.mubasher.info/news/rss       (Arabic)
 *
 * Alternative Saudi-specific endpoints:
 *   - https://www.mubasher.info/countries/sa/news/rss  (Saudi Arabia)
 */

import { decodeHtml } from "@/lib/decode-html";

export interface MubasherArticle {
  title: string;
  title_ar: string | null;
  description: string;
  url: string;
  publishedAt: string;
  source: "mubasher";
  relatedTickers: string[];
}

// All feeds to try — ordered by preference
const MUBASHER_FEEDS = {
  ar: [
    "https://www.mubasher.info/countries/sa/news/rss",
    "https://www.mubasher.info/news/rss",
  ],
  en: [
    "https://english.mubasher.info/countries/sa/news/rss",
    "https://english.mubasher.info/news/rss",
  ],
};

// rss2json proxy for when direct RSS fails (cloud IP blocking)
const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

// ── Company keyword to ticker mapping ──────
// Comprehensive mapping for major Tadawul-listed companies
const COMPANY_KEYWORDS: Record<string, string> = {
  // ── Banks ──
  "الراجحي": "1120", "al rajhi": "1120", "rajhi": "1120",
  "الأهلي": "1180", "snb": "1180", "saudi national": "1180",
  "بنك الرياض": "1010", "riyad bank": "1010",
  "الإنماء": "1150", "alinma": "1150", "inma": "1150",
  "البلاد": "1140", "albilad": "1140",
  "الفرنسي": "1050", "bsf": "1050", "fransi": "1050",
  "ساب": "1060", "sab": "1060", "saudi british": "1060",
  "الجزيرة": "1020", "bank aljazira": "1020",
  "العربي": "1080", "arab national": "1080",
  "السعودي للاستثمار": "1030", "saib": "1030",

  // ── Energy and petrochemicals ──
  "أرامكو": "2222", "aramco": "2222", "saudi aramco": "2222",
  "سابك": "2010", "sabic": "2010",
  "أكوا باور": "2082", "acwa": "2082", "acwa power": "2082",
  "بترورابغ": "2380", "petro rabigh": "2380",
  "ينساب": "2290", "yansab": "2290",
  "سبكيم": "2310", "sipchem": "2310",
  "المتقدمة": "2330", "advanced": "2330",
  "التصنيع": "2060", "tasnee": "2060",
  "كيان": "2350", "kayan": "2350",
  "المجموعة السعودية": "2250", "sahara": "2250",

  // ── Telecom ──
  "الاتصالات السعودية": "7010", "stc": "7010", "saudi telecom": "7010",
  "موبايلي": "7020", "mobily": "7020", "etihad etisalat": "7020",
  "زين السعودية": "7030", "zain saudi": "7030", "zain ksa": "7030",

  // ── Retail and Consumer ──
  "المراعي": "2280", "almarai": "2280",
  "جرير": "4190", "jarir": "4190",
  "إكسترا": "4003", "extra": "4003",
  "الحكير": "4006", "fawaz": "4006",
  "لولو السعودية": "4336", "lulu": "4336",
  "بن داود": "4161", "bindawood": "4161",
  "العثيم": "4001", "othaim": "4001",

  // ── Real Estate and Construction ──
  "دار الأركان": "4300", "dar al arkan": "4300",
  "جبل عمر": "4250", "jabal omar": "4250",
  "إعمار": "4220", "emaar": "4220",
  "طيبة": "4090", "taiba": "4090",

  // ── Healthcare ──
  "المواساة": "4002", "mouwasat": "4002",

  // ── Mining and Metals ──
  "معادن": "1211", "maaden": "1211", "saudi arabian mining": "1211",

  // ── Market infrastructure ──
  "تداول": "1111", "tadawul": "1111", "saudi exchange": "1111",

  // ── Insurance ──
  "بوبا": "8210", "bupa": "8210",
  "التعاونية": "8010", "tawuniya": "8010",
  "ملاذ": "8020", "malath": "8020",

  // ── Logistics ──
  "بدجت": "4260", "budget": "4260",
  "البحري": "4030", "bahri": "4030",

  // ── Utilities ──
  "السعودية للكهرباء": "5110", "saudi electricity": "5110",

  // ── Others ──
  "سهل": "1183",
  "سيسكو القابضة": "2170",
  "البابطين": "1320", "babatain": "1320",
  "ارتيكس": "4362",
};

/**
 * Extract related ticker symbols from article text.
 */
function extractTickers(text: string): string[] {
  const tickers = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [keyword, ticker] of Object.entries(COMPANY_KEYWORDS)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tickers.add(ticker);
    }
  }

  // Match raw 4-digit ticker patterns
  const tickerPattern = /\b(\d{4})(?:\.[A-Z]{2})?\b/g;
  let match: RegExpExecArray | null;
  while ((match = tickerPattern.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (num >= 1000 && num <= 9999) {
      tickers.add(match[1]);
    }
  }

  return Array.from(tickers);
}

/**
 * Parse RSS XML into article objects.
 */
function parseRSSItems(
  xml: string
): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag: string) => {
      const tagMatch = itemXml.match(
        new RegExp(
          `<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`,
          "s"
        )
      );
      return tagMatch?.[1]?.trim() ?? "";
    };

    items.push({
      title: getTag("title"),
      link: getTag("link"),
      description: getTag("description"),
      pubDate: getTag("pubDate"),
    });
  }

  return items;
}

/**
 * Fetch RSS via rss2json proxy (fallback when direct fetch is blocked).
 */
async function fetchViaProxy(
  rssUrl: string
): Promise<
  Array<{ title: string; link: string; description: string; pubDate: string }>
> {
  const proxyUrl = `${RSS2JSON_BASE}${encodeURIComponent(rssUrl)}&count=50`;
  const res = await fetch(proxyUrl, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    status: string;
    items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: string;
    }>;
  };
  if (data.status !== "ok" || !Array.isArray(data.items)) return [];
  return data.items.map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    description: item.description ?? "",
    pubDate: item.pubDate ?? new Date().toISOString(),
  }));
}

/**
 * Fetch items from RSS URLs - tries direct fetch first, falls back to proxy.
 */
async function fetchRSSItems(
  rssUrls: string[]
): Promise<
  Array<{ title: string; link: string; description: string; pubDate: string }>
> {
  for (const rssUrl of rssUrls) {
    // 1. Try direct fetch
    try {
      const res = await fetch(rssUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SUQAI/1.0; +https://suqaist.vercel.app)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const xml = await res.text();
        const items = parseRSSItems(xml);
        if (items.length > 0) return items;
      }
    } catch {
      // Fall through
    }

    // 2. Fall back to rss2json proxy
    try {
      const items = await fetchViaProxy(rssUrl);
      if (items.length > 0) return items;
    } catch {
      // Try next URL
    }
  }

  return [];
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Fetch latest articles from Mubasher RSS feeds.
 * Fetches both Arabic and English feeds, deduplicates by URL.
 */
export async function fetchMubasherNews(
  limit = 40
): Promise<MubasherArticle[]> {
  const articles: MubasherArticle[] = [];
  const seenUrls = new Set<string>();

  // ── Arabic feed (primary for Mubasher) ──
  try {
    const arItems = await fetchRSSItems(MUBASHER_FEEDS.ar);
    for (const item of arItems.slice(0, limit)) {
      const url = item.link;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const cleanTitle = decodeHtml(stripHtml(item.title));
      const cleanDesc = decodeHtml(stripHtml(item.description)).slice(0, 500);

      articles.push({
        title: cleanTitle,
        title_ar: cleanTitle,
        description: cleanDesc,
        url,
        publishedAt: new Date(item.pubDate).toISOString(),
        source: "mubasher",
        relatedTickers: extractTickers(`${cleanTitle} ${cleanDesc}`),
      });
    }
  } catch (err) {
    console.error("Mubasher AR feed error:", err);
  }

  // ── English feed ──
  try {
    const enItems = await fetchRSSItems(MUBASHER_FEEDS.en);
    for (const item of enItems.slice(0, limit)) {
      const url = item.link;

      // Try to match with existing Arabic article (same URL pattern)
      const arUrl = url
        .replace("english.mubasher.info", "www.mubasher.info")
        .replace("/en/", "/ar/");
      const existingIdx = articles.findIndex(
        (a) => a.url === arUrl || a.url === url
      );

      const cleanTitle = decodeHtml(stripHtml(item.title));
      const cleanDesc = decodeHtml(stripHtml(item.description)).slice(0, 500);

      if (existingIdx >= 0) {
        // Merge English title into existing Arabic article
        articles[existingIdx].title = cleanTitle;
        if (!articles[existingIdx].description && cleanDesc) {
          articles[existingIdx].description = cleanDesc;
        }
      } else if (!seenUrls.has(url)) {
        seenUrls.add(url);
        articles.push({
          title: cleanTitle,
          title_ar: null,
          description: cleanDesc,
          url,
          publishedAt: new Date(item.pubDate).toISOString(),
          source: "mubasher",
          relatedTickers: extractTickers(`${cleanTitle} ${cleanDesc}`),
        });
      }
    }
  } catch (err) {
    console.error("Mubasher EN feed error:", err);
  }

  // Sort by published date, newest first
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return articles.slice(0, limit);
}
