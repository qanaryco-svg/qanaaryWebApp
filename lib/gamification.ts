import { loadMembers } from './members'

const KEY = 'qanari:gamification'

export type GamUser = {
  id: string
  points: number
  badges: string[]
  level: string
  missions?: Record<string, { progress: number; completed: boolean }>
  wheelSpins?: number
}

type Store = {
  users: Record<string, GamUser>
  settings: any
  transactions: Array<{ id: string; userId: string; type: string; points: number; reason?: string; ts: number }>
}

function safeRead(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { users: {}, settings: {}, transactions: [] }
    return JSON.parse(raw) as Store
  } catch (e) {
    return { users: {}, settings: {}, transactions: [] }
  }
}

function safeWrite(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    try {
      window.dispatchEvent(new CustomEvent('qanari:gamification-updated', { detail: {} }))
    } catch (e) {}
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('qanari:gamification')
        bc.postMessage({ type: 'updated' })
      }
    } catch (e) {}
  } catch (e) {}
}

export function ensureUser(userId: string) {
  const s = safeRead()
  if (!s.users[userId]) {
    s.users[userId] = { id: userId, points: 0, badges: [], level: 'bronze', missions: {}, wheelSpins: 0 }
    safeWrite(s)
  }
}

export function getUserStats(userId: string): GamUser {
  const s = safeRead()
  const u = s.users[userId]
  if (u) return u
  // fallback: create a user entry if member exists
  const members = loadMembers()
  const member = members.find((m: any) => m.id === userId)
  if (member) {
    const newUser: GamUser = { id: userId, points: 0, badges: [], level: 'bronze', missions: {}, wheelSpins: 0 }
    s.users[userId] = newUser
    safeWrite(s)
    return newUser
  }
  // anonymous fallback
  return { id: userId, points: 0, badges: [], level: 'bronze', missions: {}, wheelSpins: 0 }
}

export function addPoints(userId: string, pts: number, reason?: string) {
  if (!userId) return
  const s = safeRead()
  if (!s.users[userId]) s.users[userId] = { id: userId, points: 0, badges: [], level: 'bronze', missions: {}, wheelSpins: 0 }
  s.users[userId].points = (s.users[userId].points || 0) + pts
  // simple level check
  s.users[userId].level = computeLevel(s.users[userId].points)
  const tx = { id: `t_${Date.now()}`, userId, type: 'add', points: pts, reason, ts: Date.now() }
  s.transactions.push(tx)
  safeWrite(s)
  return tx
}

export function awardBadge(userId: string, badgeId: string) {
  if (!userId) return
  const s = safeRead()
  const u = s.users[userId] || { id: userId, points: 0, badges: [], level: 'bronze', missions: {}, wheelSpins: 0 }
  if (!u.badges.includes(badgeId)) {
    u.badges.push(badgeId)
    s.users[userId] = u
    s.transactions.push({ id: `t_${Date.now()}`, userId, type: 'badge', points: 0, reason: badgeId, ts: Date.now() })
    safeWrite(s)
  }
}

export function computeLevel(points: number) {
  if (points >= 5000) return 'gold'
  if (points >= 1000) return 'silver'
  return 'bronze'
}

export function getLeaderboard(limit = 10) {
  const s = safeRead()
  const users = Object.values(s.users)
  users.sort((a, b) => (b.points || 0) - (a.points || 0))
  return users.slice(0, limit)
}

export function redeemReward(userId: string, rewardId: string) {
  // Placeholder: in a production app redeeming should be server-verified.
  const s = safeRead()
  const tx = { id: `t_${Date.now()}`, userId, type: 'redeem', points: 0, reason: rewardId, ts: Date.now() }
  s.transactions.push(tx)
  safeWrite(s)
  return tx
}

export function listTransactions(userId?: string) {
  const s = safeRead()
  return userId ? s.transactions.filter((t) => t.userId === userId) : s.transactions
}

export default {
  ensureUser,
  getUserStats,
  addPoints,
  awardBadge,
  getLeaderboard,
  redeemReward,
  listTransactions,
}
