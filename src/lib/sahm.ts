/**
 * Sahm API integration for SŪQAI
 * Base URL: https://app.sahmk.sa/api/v1
 * Auth: Bearer token via SAHM_API_KEY
 *
 * ISR strategy:
 *   - Market summary: revalidate every 900s (15 min)
 *   - Movers (gainers/losers): revalidate every 300s (5 min)
 *   - Individual quote: revalidate every 300s (5 min)
 */

const SAHM_BASE = 'https://app.sahmk.sa/api/v1'

function getApiKey(): string {
  const key = process.env.SAHM_API_KEY
  if (!key) throw new Error('SAHM_API_KEY is not set')
  return key
}

function headers(): HeadersInit {
  return {
    'X-API-Key': getApiKey(),
    'Accept': 'application/json',
  }
}

// ─── Response types ──────────────────────────────────────────

export interface MarketSummary {
  timestamp: string
  index_value: number
  index_change: number
  index_change_percent: number
  total_volume: number
  advancing: number
  declining: number
  unchanged: number
  market_mood: string // 'bullish' | 'bearish' | 'neutral'
}

export interface StockMover {
  symbol: string
  name: string
  name_en: string | null
  price: number
  change: number
  change_percent: number
  volume: number
  updated_at: string
}

export interface MoversResponse {
  gainers?: StockMover[]
  losers?: StockMover[]
  count: number
}

export interface CompanyQuote {
  symbol: string
  name: string
  name_en: string | null
  price: number
  change: number
  change_percent: number
  open: number
  high: number
  low: number
  previous_close: number
  volume: number
  value: number
  bid: number
  ask: number
  liquidity: {
    inflow_value: number
    inflow_volume: number
    inflow_trades: number
    outflow_value: number
    outflow_volume: number
    outflow_trades: number
    net_value: number
  }
  updated_at: string
  is_delayed: boolean
}

// ─── Error handling ──────────────────────────────────────────

export class SahmApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    message?: string,
  ) {
    super(message ?? `Sahm API error ${status} on ${endpoint}`)
    this.name = 'SahmApiError'
  }
}

async function sahmFetch<T>(
  path: string,
  revalidate: number,
): Promise<T> {
  const url = `${SAHM_BASE}${path}`

  try {
    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate },
    })

    if (!res.ok) {
      throw new SahmApiError(res.status, path, `Sahm API ${res.status}: ${res.statusText}`)
    }

    return (await res.json()) as T
  } catch (err) {
    if (err instanceof SahmApiError) throw err
    throw new SahmApiError(0, path, `Sahm API network error: ${(err as Error).message}`)
  }
}

// ─── Public API functions ────────────────────────────────────

/**
 * Get market summary (TASI index, volume, mood).
 * ISR: revalidates every 15 minutes.
 */
export async function getMarketSummary(): Promise<MarketSummary> {
  return sahmFetch<MarketSummary>('/market/summary/', 900)
}

/**
 * Get a single company quote by ticker.
 * ISR: revalidates every 5 minutes.
 */
export async function getCompanyQuote(ticker: string): Promise<CompanyQuote> {
  return sahmFetch<CompanyQuote>(`/quote/${encodeURIComponent(ticker)}/`, 300)
}

/**
 * Get top 10 market gainers.
 * ISR: revalidates every 5 minutes.
 */
export async function getTopGainers(): Promise<StockMover[]> {
  const data = await sahmFetch<{ gainers: StockMover[]; count: number }>(
    '/market/gainers/',
    300,
  )
  return data.gainers
}

/**
 * Get top 10 market losers.
 * ISR: revalidates every 5 minutes.
 */
export async function getTopLosers(): Promise<StockMover[]> {
  const data = await sahmFetch<{ losers: StockMover[]; count: number }>(
    '/market/losers/',
    300,
  )
  return data.losers
}

/**
 * Fetch both gainers and losers in parallel.
 * Convenience wrapper for the dashboard.
 */
export async function getTopMovers(): Promise<{
  gainers: StockMover[]
  losers: StockMover[]
}> {
  const [gainers, losers] = await Promise.all([
    getTopGainers(),
    getTopLosers(),
  ])
  return { gainers, losers }
}
