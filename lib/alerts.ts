export type Alert = {
  id: string
  ts: number
  level: 'info' | 'warning' | 'critical'
  message: string
  read?: boolean
}

const KEY = 'qanari:alerts'

function load(): Alert[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function save(list: Alert[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:alerts-updated'))
  } catch (e) {}
}

export function listAlerts() {
  return load().sort((a, b) => b.ts - a.ts)
}

export function addAlert(level: Alert['level'], message: string) {
  const list = load()
  const a: Alert = { id: `a_${Date.now()}`, ts: Date.now(), level, message }
  list.unshift(a)
  save(list)
  return a
}

// programmatic helper to add an alert and broadcast an optional event
export function sendAlert(level: Alert['level'], message: string) {
  const a = addAlert(level, message)
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:alerts-send', { detail: a }))
  } catch (e) {}
  return a
}

export function markRead(id: string) {
  const list = load()
  const it = list.find((x) => x.id === id)
  if (it) {
    it.read = true
    save(list)
  }
}

export function clearAlerts() {
  save([])
}
