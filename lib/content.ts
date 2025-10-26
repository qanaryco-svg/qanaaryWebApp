export type ContentItem = {
  id: string
  title: string
  excerpt?: string
  body?: string
  type: 'article' | 'image' | 'video'
  media?: string[] // data urls or external urls
  category?: string
  tags?: string[]
  status: 'published' | 'draft' | 'pending'
  authorId?: string
  createdAt: number
  updatedAt?: number
}

const KEY = 'qanari:contents'

export function loadContents(): ContentItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveContents(list: ContentItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:contents-updated'))
  } catch (e) {}
}

export function addContent(item: ContentItem) {
  const list = loadContents()
  list.unshift(item)
  saveContents(list)
  try {
    // lazy require to avoid circular deps
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const activity = require('./activity')
    if (activity && typeof activity.addActivity === 'function') {
      activity.addActivity(item.authorId || undefined, 'content_created', { id: item.id, title: item.title })
    }
  } catch (e) {}
}

export function updateContent(item: ContentItem) {
  const list = loadContents()
  const idx = list.findIndex((c) => c.id === item.id)
  if (idx === -1) return false
  item.updatedAt = Date.now()
  list[idx] = item
  saveContents(list)
  try {
    const activity = require('./activity')
    if (activity && typeof activity.addActivity === 'function') activity.addActivity(item.authorId || undefined, 'content_updated', { id: item.id, title: item.title })
  } catch (e) {}
  return true
}

export function deleteContent(id: string) {
  const list = loadContents().filter((c) => c.id !== id)
  saveContents(list)
  try {
    const activity = require('./activity')
    if (activity && typeof activity.addActivity === 'function') activity.addActivity(undefined, 'content_deleted', { id })
  } catch (e) {}
}

export function listCategories() {
  const list = loadContents()
  const set = new Set<string>()
  list.forEach((c) => { if (c.category) set.add(c.category) })
  return Array.from(set)
}

export function listTags() {
  const list = loadContents()
  const set = new Set<string>()
  list.forEach((c) => { (c.tags || []).forEach((t) => set.add(t)) })
  return Array.from(set)
}

export function seedIfEmpty() {
  const list = loadContents()
  if (list.length > 0) return
  const now = Date.now()
  const sample: ContentItem[] = [
    { id: 'c1', title: 'درباره ما', excerpt: 'متنی درباره سایت', body: '<p>متن درباره ما</p>', type: 'article', category: 'اطلاعات', tags: ['درباره'], status: 'published', createdAt: now - 1000 * 60 * 60 * 24 * 10 },
    { id: 'c2', title: 'راهنمای خرید', excerpt: 'چگونه خرید کنیم', body: '<p>راهنمای خرید</p>', type: 'article', category: 'راهنما', tags: ['خرید'], status: 'draft', createdAt: now - 1000 * 60 * 60 * 24 * 5 }
  ]
  saveContents(sample)
}
