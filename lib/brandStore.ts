export type FontInfo = {
  name: string
  // optional data URL when user uploads a custom font
  dataUrl?: string | null
}

export type BrandSettings = {
  logo?: string | null // data URL
  primaryColor?: string // hex
  secondaryColor?: string // hex
  fontPersian?: FontInfo | null
  fontLatin?: FontInfo | null
  language?: 'fa' | 'en'
}

const STORAGE_KEY = 'qanari:brand'

export function loadBrand(): BrandSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as BrandSettings
  } catch (e) {
    // ignore
  }
  // defaults
  return {
    logo: null,
    primaryColor: '#0ea5a4',
    secondaryColor: '#334155',
    fontPersian: { name: 'IranSans' },
    fontLatin: { name: 'System' },
    language: 'fa',
  }
}

function notify() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qanari:brand-updated'))
    }
  } catch (e) {
    // ignore
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('qanari:brand')
      bc.postMessage({ type: 'updated' })
      bc.close()
    }
  } catch (e) {
    // ignore
  }
}

export function saveBrand(b: BrandSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(b))
    notify()
    return true
  } catch (e) {
    return false
  }
}

export function resetBrand() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    notify()
    return true
  } catch (e) {
    return false
  }
}
