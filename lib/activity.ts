export type Activity = {
  id: string
  ts: number
  memberId?: string
  type: string
  payload?: any
}

const KEY = 'qanari:activity'

function load(): Activity[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function save(list: Activity[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function listActivityForMember(memberId: string) {
  return load().filter((a) => a.memberId === memberId).sort((a, b) => b.ts - a.ts)
}

export function addActivity(memberId: string | undefined, type: string, payload?: any) {
  const list = load()
  const a: Activity = { id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ts: Date.now(), memberId, type, payload }
  list.unshift(a)
  save(list)
  return a
}

export function listAllActivity() {
  return load().sort((a, b) => b.ts - a.ts)
}
