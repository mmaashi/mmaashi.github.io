/**
 * Translation engine for SŪQAI
 *
 * Strategy:
 *   1. SHA-256 hash the source text
 *   2. Check translations_cache in Supabase
 *   3. If miss → call Gemini Flash → store → return
 *
 * Supported languages: ar, en, zh
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ───────────────────────────────────────────────────

export type Language = 'ar' | 'en' | 'zh'

export interface TranslationResult {
  text: string
  cached: boolean
  model: string
}

// ─── SHA-256 hashing ─────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Gemini Flash translation ────────────────────────────────

const GEMINI_MODEL = 'gemini-2.0-flash'

const LANGUAGE_NAMES: Record<Language, string> = {
  ar: 'Arabic',
  en: 'English',
  zh: 'Simplified Chinese',
}

async function callGemini(
  text: string,
  sourceLang: Language,
  targetLang: Language,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const prompt = `You are a professional financial translator specializing in Saudi Arabian markets.

Translate the following ${LANGUAGE_NAMES[sourceLang]} text to ${LANGUAGE_NAMES[targetLang]}.

Rules:
- Keep financial terminology precise and domain-appropriate
- Preserve numbers, dates, ticker symbols, and proper nouns as-is
- For company names, use the official ${LANGUAGE_NAMES[targetLang]} name if one exists
- Output ONLY the translation, no explanations or extra text

Text to translate:
${text}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  const candidate = json.candidates?.[0]
  const translated = candidate?.content?.parts?.[0]?.text?.trim()

  if (!translated) {
    throw new Error('Gemini returned empty translation')
  }

  return translated
}

// ─── Cache layer ─────────────────────────────────────────────

async function getCached(
  hash: string,
  targetLang: Language,
): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('translations_cache')
    .select('translated_text')
    .eq('source_text_hash', hash)
    .eq('target_language', targetLang)
    .single()

  if (error || !data) return null
  return data.translated_text
}

async function setCache(
  hash: string,
  sourceLang: Language,
  targetLang: Language,
  translatedText: string,
  model: string,
): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('translations_cache').upsert(
    {
      source_text_hash: hash,
      source_language: sourceLang,
      target_language: targetLang,
      translated_text: translatedText,
      model_used: model,
    },
    { onConflict: 'source_text_hash,target_language' },
  )
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Translate text with caching.
 *
 * Returns the translation from cache if available, otherwise
 * calls Gemini Flash and stores the result.
 */
export async function translate(
  text: string,
  sourceLang: Language = 'ar',
  targetLang: Language = 'en',
): Promise<TranslationResult> {
  // Same language → no-op
  if (sourceLang === targetLang) {
    return { text, cached: true, model: 'passthrough' }
  }

  // Skip empty text
  if (!text.trim()) {
    return { text: '', cached: true, model: 'passthrough' }
  }

  const hash = await sha256(text)

  // 1. Check cache
  const cached = await getCached(hash, targetLang)
  if (cached) {
    return { text: cached, cached: true, model: GEMINI_MODEL }
  }

  // 2. Call Gemini
  const translated = await callGemini(text, sourceLang, targetLang)

  // 3. Store in cache (fire-and-forget, don't block the response)
  setCache(hash, sourceLang, targetLang, translated, GEMINI_MODEL).catch(
    (err) => console.error('Failed to cache translation:', err),
  )

  return { text: translated, cached: false, model: GEMINI_MODEL }
}

/**
 * Translate to multiple target languages in parallel.
 */
export async function translateMulti(
  text: string,
  sourceLang: Language = 'ar',
  targetLangs: Language[] = ['en', 'zh'],
): Promise<Record<Language, TranslationResult>> {
  const results = await Promise.all(
    targetLangs.map(async (lang) => {
      const result = await translate(text, sourceLang, lang)
      return [lang, result] as const
    }),
  )

  return Object.fromEntries(results) as Record<Language, TranslationResult>
}
