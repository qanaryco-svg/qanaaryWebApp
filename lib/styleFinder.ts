import { loadProducts } from './productStore'
import { Product } from '../data/products'
import { getTranslatedProductText } from './productI18n'

export type Answers = {
  color?: 'red' | 'blue' | 'neutral'
  occasion?: 'casual' | 'party' | 'work'
  silhouette?: 'fitted' | 'loose'
  budget?: 'low' | 'mid' | 'high'
}

function priceBucket(price: number): 'low' | 'mid' | 'high' {
  if (price < 100000) return 'low'
  if (price < 300000) return 'mid'
  return 'high'
}

export function recommendByAnswers(ans: Answers, lang = 'fa'): Product[] {
  try {
    const all = loadProducts()
    const cfg = loadStyleFinderConfig()
    // simple scoring rules
    const categoryMap: Record<string, string[]> = {
      party: ['پیراهن', 'دامن', 'اکسسوری'],
      casual: ['تی‌شرت', 'شلوار', 'هودی', 'بافت'],
      work: ['کت و کاپشن', 'دامن', 'پیراهن'],
    }

    const colorTerms: Record<string, string[]> = {
      red: ['قرمز', 'red'],
      blue: ['آبی', 'blue'],
      neutral: ['سفید', 'سیاه', 'خاکی', 'کت', 'مشکی'],
    }

    const scored = all.map((p) => {
      let score = 0
      const tr = getTranslatedProductText(p, lang)
      const title = (tr.title || p.title || '').toLowerCase()
      const desc = (tr.description || p.description || '').toLowerCase()

      // occasion -> category match - prefer admin-configured mapping if present
      if (ans.occasion) {
        const cfgCats = (cfg && cfg.occasionMap && cfg.occasionMap[ans.occasion]) || []
        const cats = cfgCats.length > 0 ? cfgCats : (categoryMap[ans.occasion] || [])
        if (cats.includes(p.category)) score += 3
      }

      // style tags from product metadata (admin-provided)
      if (p.style && Array.isArray(p.style.tags)) {
        for (const t of p.style.tags) {
          if (ans.occasion && t.toLowerCase().includes(ans.occasion)) {
            score += 2
            break
          }
        }
      }

      // color -> presence in title/description or admin-configured colorMap
      if (ans.color) {
        const cfgTerms = (cfg && cfg.colorMap && cfg.colorMap[ans.color]) || []
        const terms = cfgTerms.length > 0 ? cfgTerms : (colorTerms[ans.color] || [])
        for (const t of terms) {
          if (title.includes(t) || desc.includes(t)) {
            score += 2
            break
          }
        }
      }

      // silhouette -> prefer fitted -> check words
      if (ans.silhouette === 'fitted') {
        if (title.includes('اسلیم') || desc.includes('فیت') || title.includes('fitted')) score += 1
      } else if (ans.silhouette === 'loose') {
        if (title.includes('آزاد') || desc.includes('آزاد')) score += 1
      }

      // budget -> price bucket
      if (ans.budget) {
        const b = priceBucket(p.price)
        if (b === ans.budget) score += 2
      }

      // popularity heuristic: lower price but reasonable -> small boost
      if (p.price < 200000) score += 0.2

      return { product: p, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.filter((s) => s.score > 0).slice(0, 12).map((s) => s.product)
  } catch (e) {
    try {
      return loadProducts().slice(0, 12)
    } catch (e) {
      return []
    }
  }
}

// Admin config helpers: persist mapping rules for the Style Finder
const SF_KEY = 'qanari:stylefinder:config'

export type StyleFinderConfig = {
  // mapping from question keys to arrays of tags/categories
  occasionMap?: Record<string, string[]>
  colorMap?: Record<string, string[]>
}

export function loadStyleFinderConfig(): StyleFinderConfig {
  try {
    if (typeof window === 'undefined') return {}
    const raw = window.localStorage.getItem(SF_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export function saveStyleFinderConfig(cfg: StyleFinderConfig) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SF_KEY, JSON.stringify(cfg))
    // dispatch an event so UI components can react
    window.dispatchEvent(new CustomEvent('qanari:stylefinder-updated'))
  } catch (e) {
    // ignore
  }
}
