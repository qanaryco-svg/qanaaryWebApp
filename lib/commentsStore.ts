export type Comment = {
  id: string
  productId: string
  name: string
  rating: number
  text: string
  createdAt: number
}

const STORAGE_KEY = 'qanari:comments'

export function loadAllComments(): Comment[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function getCommentsFor(productId: string): Comment[] {
  return loadAllComments().filter((c) => c.productId === productId)
}

export function getStats(productId: string): { avg: number; count: number } {
  const comments = getCommentsFor(productId)
  const count = comments.length
  if (count === 0) return { avg: 0, count: 0 }
  const sum = comments.reduce((s, c) => s + (c.rating || 0), 0)
  const avg = sum / count
  return { avg, count }
}

// Persist the full comments array back to localStorage
export function persistAllComments(all: Comment[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qanari:comments-updated'))
      }
    } catch (e) {
      // ignore
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('qanari:comments')
        bc.postMessage({ type: 'updated' })
        bc.close()
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

export function addComment(c: Comment) {
  const all = loadAllComments()
  const next = [c, ...all]
  persistAllComments(next)
}

export function deleteComment(id: string) {
  const all = loadAllComments()
  const next = all.filter((c) => c.id !== id)
  persistAllComments(next)
}

export function deleteCommentsForProduct(productId: string) {
  const all = loadAllComments()
  const next = all.filter((c) => c.productId !== productId)
  persistAllComments(next)
}
