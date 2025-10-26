export type FooterSettings = {
  address?: string
  mapQuery?: string
  phone?: string
  email?: string
  whatsapp?: string
  instagram?: string
}

const KEY = 'qanari:footer'

export function loadFooter(): FooterSettings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export function saveFooter(s: FooterSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    return true
  } catch (e) {
    return false
  }
}

export function resetFooter() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    // ignore
  }
}
