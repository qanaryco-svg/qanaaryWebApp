import { loadProducts } from './productStore'
import { Product } from '../data/products'
import { loadOrders } from './orders'
import { currentMember } from './members'

export function recommendByHistory(userId: string, limit = 6): Product[] {
  try {
    const all = loadProducts()
    const orders = loadOrders().filter((o) => o.memberEmail && (o.memberEmail === userId || o.memberEmail === (currentMember()?.email)))
    // collect categories from previous purchases
    const counts: Record<string, number> = {}
    for (const o of orders) {
      for (const it of o.items) {
        const p = all.find((x) => x.id === it.productId)
        if (p) counts[p.category] = (counts[p.category] || 0) + it.quantity
      }
    }
    const preferred = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
    if (preferred.length === 0) return all.slice(0, limit)
    const res: Product[] = []
    for (const cat of preferred) {
      const found = all.filter((p) => p.category === cat)
      for (const f of found) {
        if (res.length < limit && !res.find((r) => r.id === f.id)) res.push(f)
      }
      if (res.length >= limit) break
    }
    // fill remainder
    for (const p of all) {
      if (res.length >= limit) break
      if (!res.find((r) => r.id === p.id)) res.push(p)
    }
    return res
  } catch (e) {
    return loadProducts().slice(0, limit)
  }
}

export function recommendByProduct(productId: string, limit = 6): Product[] {
  const all = loadProducts()
  const base = all.find((p) => p.id === productId)
  if (!base) return all.slice(0, limit)
  const sameCat = all.filter((p) => p.category === base.category && p.id !== base.id)
  if (sameCat.length >= limit) return sameCat.slice(0, limit)
  const others = all.filter((p) => p.category !== base.category)
  return [...sameCat, ...others].slice(0, limit)
}

export function recommendByStyle(answers: any, limit = 6) {
  const s = require('./styleFinder')
  return s.recommendByAnswers(answers).slice(0, limit)
}

export default { recommendByHistory, recommendByProduct, recommendByStyle }
