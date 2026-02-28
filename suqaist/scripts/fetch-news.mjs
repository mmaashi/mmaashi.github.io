// SŪQAI News Fetcher - Mubasher
// Fetches latest Saudi news from Mubasher

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .reduce((acc, l) => {
    const [k, ...v] = l.split('=')
    acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Fetch news from Mubasher
async function fetchMubasherNews() {
  const response = await fetch('https://www.mubasher.info/news/sa/now/latest')
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
        slug,
        title_en: title,
        source_url: `https://www.mubasher.info/news/${id}/${slug}`
      })
    }
  }
  
  return newsItems
}

async function fetchMoreNews() {
  const pages = [
    'https://www.mubasher.info/news/sa/pulse/stocks',
    'https://www.mubasher.info/news/sa/pulse/local',
  ]
  
  const allNews = []
  
  for (const page of pages) {
    try {
      const response = await fetch(page)
      const html = await response.text()
      
      const regex = /\/news\/(\d+)\/([^\"]+)\">([^<]+)<\/a>/g
      let match
      const seen = new Set()
      
      while ((match = regex.exec(html)) !== null && allNews.length < 50) {
        const id = match[1]
        const slug = match[2]
        const title = match[3].trim()
        
        if (!seen.has(id) && title.length > 10) {
          seen.add(id)
          allNews.push({
            id,
            slug,
            title_en: title,
            source_url: `https://www.mubasher.info/news/${id}/${slug}`
          })
        }
      }
    } catch (e) {
      console.log(`Error fetching ${page}:`, e.message)
    }
  }
  
  return allNews
}

console.log('Fetching news from Mubasher...')
const news1 = await fetchMubasherNews()
console.log(`Found ${news1.length} news items from latest`)

const news2 = await fetchMoreNews()
console.log(`Found ${news2.length} more news items`)

// Merge and dedupe
const allNews = [...news1]
for (const item of news2) {
  if (!allNews.find(n => n.id === item.id)) {
    allNews.push(item)
  }
}

console.log(`Total unique: ${allNews.length} news items`)

// Store in database
let inserted = 0
let errors = 0
for (const item of allNews) {
  const { error } = await supabase.from('news').insert({
    title_en: item.title_en,
    title_ar: item.title_en, // Use same for now
    source: 'mubasher',
    source_url: item.source_url,
    published_at: new Date().toISOString()
  })
  
  if (!error) inserted++
  else errors++
}

console.log(`Inserted ${inserted} news items, ${errors} errors`)

// Verify
const { count } = await supabase.from('news').select('*', { count: 'exact', head: true })
console.log(`Total news in DB: ${count}`)
