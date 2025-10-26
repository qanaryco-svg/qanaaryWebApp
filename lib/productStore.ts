import { products as seed } from '../data/products'
import type { Product } from '../data/products'

const STORAGE_KEY = 'qanari:products'

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Product[]
  } catch (e) {
    // ignore
  }
  // seed initially
  try {
    const copy = seed.map((p) => ({ ...p }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy))
    return copy
  } catch (e) {
    return seed
  }
}

export function saveProducts(list: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qanari:products-updated'))
    }
  } catch (e) {
    // ignore
  }
  // BroadcastChannel is more reliable across tabs than relying on storage events alone.
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('qanari:products')
      bc.postMessage({ type: 'updated' })
      bc.close()
    }
  } catch (e) {
    // ignore
  }
}

export function resetProducts() {
  try {
    const copy = seed.map((p) => ({ ...p }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qanari:products-updated'))
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('qanari:products')
        bc.postMessage({ type: 'reset' })
        bc.close()
      }
    } catch (e) {
      // ignore
    }
    return true
  } catch (e) {
    return false
  }
}

export function findProduct(id?: string) {
  if (!id) return undefined
  const list = loadProducts()
  return list.find((p) => p.id === id)
}

export function addProduct(p: Product) {
  const list = loadProducts()
  list.unshift(p)
  saveProducts(list)
}

export function updateProduct(updated: Product) {
  const list = loadProducts()
  const idx = list.findIndex((p) => p.id === updated.id)
  if (idx >= 0) list[idx] = updated
  saveProducts(list)
}

export function deleteProduct(id: string) {
  const list = loadProducts().filter((p) => p.id !== id)
  saveProducts(list)
}
