export type Member = {
  id: string
  name: string
  email: string
  password: string
  footSize?: string
  age?: string
  city?: string
  extra?: string
  // new fields for seller/referral system
  role?: 'seller' | 'buyer' | 'admin'
  referralCode?: string
  referrerId?: string
  commissionEarned?: number
  // account status
  blocked?: boolean
}

const KEY = 'qanari:members'
const SESSION = 'qanari:session'

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveMembers(members: Member[]) {
  localStorage.setItem(KEY, JSON.stringify(members))
  // notify other tabs / UI that members changed
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qanari:members-updated'))
      // BroadcastChannel is optional — close after posting
      try {
        // @ts-ignore
        if ((window as any).BroadcastChannel) {
          // @ts-ignore
          const bc = new BroadcastChannel('qanari:members')
          bc.postMessage({ type: 'members-updated' })
          bc.close()
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }
}

export function registerMember(m: Member) {
  const members = loadMembers()
  members.push(m)
  saveMembers(members)
  sessionStorage.setItem(SESSION, m.email)
  try {
    // lazy require activity
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const activity = require('./activity')
    if (activity && typeof activity.addActivity === 'function') activity.addActivity(m.id, 'member_registered', { email: m.email })
  } catch (e) {}
}

export function generateReferralCode(email: string) {
  // simple code: base64-ish short string
  try {
    return 'r_' + btoa(email).replace(/=+$/, '').slice(0, 8)
  } catch (e) {
    return 'r_' + String(Date.now()).slice(-8)
  }
}

export function creditCommission(memberId: string | undefined, amount: number) {
  if (!memberId) return false
  const list = loadMembers()
  const idx = list.findIndex((m) => m.id === memberId)
  if (idx === -1) return false
  const m = list[idx]
  m.commissionEarned = (m.commissionEarned || 0) + amount
  list[idx] = m
  saveMembers(list)
  return true
}

export function findMemberByReferralCode(code: string) {
  return loadMembers().find((m) => m.referralCode === code)
}

export function getChildren(memberId: string) {
  return loadMembers().filter((m) => m.referrerId === memberId)
}

export type ReferralNode = {
  member: Member
  children: ReferralNode[]
}

export function buildReferralTree(rootId?: string): ReferralNode[] {
  const list = loadMembers()
  const map = new Map<string, Member>()
  list.forEach((m) => map.set(m.id, m))

  const build = (id: string): ReferralNode => {
    const member = map.get(id)!
    const kids = list.filter((x) => x.referrerId === id).map((c) => build(c.id))
    return { member, children: kids }
  }

  if (rootId) {
    if (!map.has(rootId)) return []
    return [build(rootId)]
  }

  // return forest: roots are members without referrerId OR whose referrerId points
  // to a missing member (orphans). This ensures that if a parent is deleted,
  // their children don't silently disappear from the admin referral tree.
  const roots = list.filter((m) => {
    if (!m.referrerId || m.referrerId === '') return true
    // referrerId exists but may point to a deleted/missing member -> treat as root
    if (!map.has(m.referrerId)) return true
    return false
  })
  return roots.map((r) => build(r.id))
}

export function getDescendants(memberId: string): Member[] {
  const list = loadMembers()
  const out: Member[] = []
  const map = new Map<string, Member>()
  list.forEach((m) => map.set(m.id, m))
  const walk = (id: string) => {
    const children = list.filter((m) => m.referrerId === id)
    for (const c of children) {
      out.push(c)
      walk(c.id)
    }
  }
  walk(memberId)
  return out
}

export function getUpline(memberId: string, levels = 3): string[] {
  const list = loadMembers()
  const map = new Map<string, Member>()
  list.forEach((m) => map.set(m.id, m))
  const out: string[] = []
  let cur = memberId
  for (let i = 0; i < levels; i++) {
    const m = map.get(cur)
    if (!m || !m.referrerId) break
    out.push(m.referrerId)
    cur = m.referrerId
  }
  return out
}

export function distributeCommissionUpchain(startMemberId: string | undefined, totalCommission: number, levelPercents: number[] = [60, 30, 10]) {
  if (!startMemberId) return []
  const list = loadMembers()
  const map = new Map<string, Member>()
  list.forEach((m) => map.set(m.id, m))

  const distributions: { memberId: string; amount: number; level: number }[] = []
  let currentId: string | undefined = startMemberId
  for (let i = 0; i < levelPercents.length; i++) {
    if (!currentId) break
    const m = map.get(currentId)
    if (!m) break
    const amt = Math.round((totalCommission * levelPercents[i]) / 100)
    // credit
    creditCommission(currentId, amt)
    distributions.push({ memberId: currentId, amount: amt, level: i + 1 })
    // move to next upline
    currentId = m.referrerId
  }
  return distributions
}

// Distribute commissions as absolute percentages of the sale total.
export function distributeCommissionBySale(startMemberId: string | undefined, saleTotal: number, levelPercentsAbsolute: number[] = [1, 0.5, 0.1]) {
  if (!startMemberId) return []
  const list = loadMembers()
  const map = new Map<string, Member>()
  list.forEach((m) => map.set(m.id, m))

  const distributions: { memberId: string; amount: number; level: number }[] = []
  let currentId: string | undefined = startMemberId
  for (let i = 0; i < levelPercentsAbsolute.length; i++) {
    if (!currentId) break
    const m = map.get(currentId)
    if (!m) break
    const pct = levelPercentsAbsolute[i] || 0
    const amt = Math.round((saleTotal * pct) / 100)
    creditCommission(currentId, amt)
    distributions.push({ memberId: currentId, amount: amt, level: i + 1 })
    currentId = m.referrerId
  }
  return distributions
}

export function findMemberByEmail(email: string) {
  return loadMembers().find((m) => m.email === email)
}

export function findMemberById(id: string) {
  return loadMembers().find((m) => m.id === id)
}

export function setMemberRole(memberId: string, role: Member['role']) {
  const list = loadMembers()
  const idx = list.findIndex((m) => m.id === memberId)
  if (idx === -1) return false
  list[idx].role = role
  saveMembers(list)
  return true
}

export function setMemberBlocked(memberId: string, blocked: boolean) {
  const list = loadMembers()
  const idx = list.findIndex((m) => m.id === memberId)
  if (idx === -1) return false
  list[idx].blocked = blocked
  saveMembers(list)
  return true
}

export function deleteMemberByEmail(email: string) {
  const list = loadMembers().filter((m) => m.email !== email)
  saveMembers(list)
}

// Find a member by id, referralCode or email (flexible resolver)
export function findMemberByAnyId(identifier?: string) {
  if (!identifier) return undefined
  const list = loadMembers()
  return list.find((m) => m.id === identifier || m.referralCode === identifier || m.email === identifier)
}

export function findMemberIndexByEmail(email: string) {
  const list = loadMembers()
  return list.findIndex((m) => m.email === email)
}

export function updateMember(updated: Member) {
  const list = loadMembers()
  // find by id first (prefer stable id), fallback to email
  let idx = list.findIndex((m) => m.id === updated.id)
  if (idx === -1) idx = list.findIndex((m) => m.email === updated.email)
  if (idx >= 0) {
    const prev = list[idx]
    list[idx] = updated
    saveMembers(list)
    // if the session was for the previous email, update it to the new one
    try {
      const sess = sessionStorage.getItem(SESSION)
      if (sess && sess === prev.email && prev.email !== updated.email) {
        sessionStorage.setItem(SESSION, updated.email)
      }
    } catch (e) {
      // ignore
    }
    try {
      const activity = require('./activity')
      if (activity && typeof activity.addActivity === 'function') activity.addActivity(updated.id, 'member_updated', { email: updated.email })
    } catch (e) {}
    return true
  }
  return false
}

export function login(email: string, password: string) {
  const m = findMemberByEmail(email)
  if (m && m.password === password) {
    sessionStorage.setItem(SESSION, m.email)
    try {
      const activity = require('./activity')
      if (activity && typeof activity.addActivity === 'function') activity.addActivity(m.id, 'member_logged_in', { email: m.email })
    } catch (e) {}
    return m
  }
  return null
}

export function currentMember(): Member | null {
  const email = sessionStorage.getItem(SESSION)
  if (!email) return null
  return findMemberByEmail(email) || null
}

export function logout() {
  sessionStorage.removeItem(SESSION)
}
