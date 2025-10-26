export type UploadItem = {
  id: string
  type: 'image' | 'video' | 'font'
  name: string
  dataUrl: string
  // optional gallery id to scope uploads per gallery/product
  galleryId?: string | null
  createdAt: number
}

const KEY = 'qanari:uploads'

export function loadUploads(galleryId?: string | null): UploadItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list: UploadItem[] = raw ? JSON.parse(raw) : []
    if (galleryId === undefined) return list
    return list.filter((u) => u.galleryId === galleryId)
  } catch (e) {
    return []
  }
}

export function saveUploads(list: UploadItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (e) {
    // ignore
  }
}

export function addUpload(item: UploadItem) {
  const list = loadUploads()
  list.unshift(item)
  saveUploads(list)
}

export function deleteUpload(id: string) {
  const list = loadUploads().filter((u) => u.id !== id)
  saveUploads(list)
}

export function updateUpload(updated: Partial<UploadItem> & { id: string }) {
  try {
    const list = loadUploads()
    const idx = list.findIndex((u) => u.id === updated.id)
    if (idx === -1) return false
    const item = list[idx]
    list[idx] = { ...item, ...updated }
    saveUploads(list)
    return true
  } catch (e) {
    return false
  }
}

export function listUploads(opts?: { type?: string; category?: string }) {
  try {
    let list = loadUploads()
    if (opts?.type) list = list.filter((u) => u.type === opts.type)
    // category field is optional on UploadItem, skip if not present
    // this keeps backwards compatibility
    if (opts?.category) list = (list as any).filter((u: any) => u.category === opts.category)
    return list
  } catch (e) {
    return []
  }
}

// Move uploads that belong to oldGalleryId to newGalleryId. Useful when
// creating a new product: uploads created under a temp id are transferred
// to the real product id.
export function transferUploads(oldGalleryId: string, newGalleryId: string) {
  try {
    const list = loadUploads()
    let changed = false
    for (const u of list) {
      if (u.galleryId === oldGalleryId) {
        u.galleryId = newGalleryId
        changed = true
      }
    }
    if (changed) saveUploads(list)
  } catch (e) {
    // ignore
  }
}
