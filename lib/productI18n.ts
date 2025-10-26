import { LANG_KEY } from './i18n'
import { Product } from '../data/products'

const STORAGE_KEY = 'qanari:product-translations'

export type ProductTranslations = Record<
  string,
  {
    fa?: { title?: string; description?: string; category?: string }
    en?: { title?: string; description?: string; category?: string }
    ar?: { title?: string; description?: string; category?: string }
    tr?: { title?: string; description?: string; category?: string }
  }
>

function safeRead(): ProductTranslations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ProductTranslations
  } catch (e) {
    return {}
  }
}

function safeWrite(map: ProductTranslations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (e) {}
}

export function getTranslatedProductText(p: Product, lang: string) {
  if (typeof window === 'undefined') return { title: p.title, description: p.description, category: p.category }
  try {
    const map = safeRead()
    const entry = map[p.id]
    if (!entry) return { title: p.title, description: p.description, category: p.category }
    const byLang = entry[lang as keyof typeof entry]
    return {
      title: (byLang && byLang.title) || p.title,
      description: (byLang && byLang.description) || p.description,
      category: (byLang && byLang.category) || p.category,
    }
  } catch (e) {
    return { title: p.title, description: p.description, category: p.category }
  }
}

export function setProductTranslation(productId: string, lang: string, data: { title?: string; description?: string; category?: string }) {
  try {
    const map = safeRead()
    const entry = map[productId] || {}
    entry[lang as keyof typeof entry] = { ...(entry[lang as keyof typeof entry] || {}), ...data }
    map[productId] = entry
    safeWrite(map)
  } catch (e) {}
}

export function listProductTranslations() {
  try {
    return safeRead()
  } catch (e) {
    return {}
  }
}
