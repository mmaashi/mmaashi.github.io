// SŪQAI Extended News Fetcher
// Fetches more news from Mubasher categories

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const idx = line.indexOf('=')
    const key = line.substring(0, idx).trim()
    const val = line.substring(idx + 1).trim()
    env[key] = val
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const CATEGORIES = [
  'https://www.mubasher.info/news/sa/category/banking',
  'https://www.mubasher.info/news/sa/category/realEstate',
  'https://www.mubasher.info/news/sa/pulse/analysis',
]

async function fetchNews(url) {
  const response = await fetch(url)
  const html = await response.text()
  
  const newsItems = []
  const regex = /\/news\/(\d+)\/([^\"]+)\">([^<]+)<\/a>/g
  let match
  const seen = new Set()
  
  while ((match = regex.exec(html)) !== null && newsItems.length < 30) {
    const id = match[1]
    const slug = match[2]
    const title = match[3].trim()
    
    if (!seen.has(id) && title.length > 10) {
      seen.add(id)
      newsItems.push({
        id,
        title_en: title,
        source_url: `https://www.mubasher.info/news/${id}/${slug}`
      })
    }
  }
  
  return newsItems
}

let totalNew = 0
for (const url of CATEGORIES) {
  const news = await fetchNews(url)
  console.log(`Found ${news.length} from ${url.split('/').pop()}`)
  
  for (const item of news) {
    const { error } = await supabase.from('news').insert({
      title_en: item.title_en,
      title_ar: item.title_en,
      source: 'mubasher',
      source_url: item.source_url,
      published_at: new Date().toISOString()
    })
    if (!error) totalNew++
  }
}

console.log(`Inserted ${totalNew} new news items`)

// Get total
const { count } = await supabase.from('news').select('*', { count: 'exact', head: true })
console.log(`Total news in DB: ${count}`)
