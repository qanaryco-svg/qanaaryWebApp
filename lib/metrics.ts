export type Metrics = {
  users: number
  viewsToday: number
  salesThisWeek: number
  // historical events stored as timestamps (ms)
  viewEvents?: number[]
  saleEvents?: { ts: number; amount: number }[]
}

const KEY = 'qanari:metrics'

function load(): Metrics {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { users: 0, viewsToday: 0, salesThisWeek: 0, viewEvents: [], saleEvents: [] }
    // parse then normalize numeric fields to avoid string concatenation or undefined
    const parsed = JSON.parse(raw) as Partial<Metrics>
    // normalize and derive viewsToday from viewEvents so daily counts don't stale
    const viewEvents = (parsed?.viewEvents || []) as number[]
    // compute start of today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTs = todayStart.getTime()
    const viewsTodayFromEvents = viewEvents.filter((t: number) => Number(t) >= todayTs).length
    const m: Metrics = {
      users: Number(parsed?.users || 0),
      // prefer computed value from events; fall back to stored numeric value
      viewsToday: viewsTodayFromEvents || Number(parsed?.viewsToday || 0),
      salesThisWeek: Number(parsed?.salesThisWeek || 0),
      viewEvents: viewEvents,
      saleEvents: parsed?.saleEvents || []
    }
    return m
  } catch (e) {
    return { users: 0, viewsToday: 0, salesThisWeek: 0, viewEvents: [], saleEvents: [] }
  }
}

function save(m: Metrics) {
  localStorage.setItem(KEY, JSON.stringify(m))
}

export function getMetrics(): Metrics {
  return load()
}

export function incrementView() {
  try {
    // Guard against React StrictMode / Fast Refresh double-mounts in dev
    const last = sessionStorage.getItem('qanari:lastViewTs')
    const now = Date.now()
    if (last) {
      const diff = now - Number(last)
      // if we incremented in the last 2 seconds, skip to avoid duplicates
      if (diff < 2000) return
    }
    sessionStorage.setItem('qanari:lastViewTs', String(now))

    const m = load()
    // append event timestamp and recompute viewsToday will be derived on next load
    m.viewEvents = m.viewEvents || []
    m.viewEvents.push(now)
    // keep only last 30 days of events to avoid unbounded storage
    const cutoff = now - 30 * 24 * 60 * 60 * 1000
    m.viewEvents = m.viewEvents.filter((t) => Number(t) >= cutoff)
    // also update the numeric quick-count for same-session reads
    m.viewsToday = (m.viewEvents || []).filter((t) => t >= (new Date().setHours(0,0,0,0))).length
    save(m)
  } catch (e) {
    // ignore storage errors
  }
}

export function setUsers(count: number) {
  const m = load()
  m.users = count
  save(m)
}

export function addSale(amount: number) {
  const now = Date.now()
  const m = load()
  m.salesThisWeek = (Number(m.salesThisWeek) || 0) + Number(amount)
  m.saleEvents = m.saleEvents || []
  m.saleEvents.push({ ts: now, amount: Number(amount) })
  save(m)
}

// Recompute metrics from canonical orders storage (idempotent). Useful to recover from double-counts.
export function recomputeMetricsFromOrders() {
  try {
    // lazy require orders to avoid cycles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ordersLib = require('./orders')
    const orders = (typeof ordersLib.loadOrders === 'function') ? ordersLib.loadOrders() : []
    // build fresh metrics
  const fresh: Metrics = { users: 0, viewsToday: 0, salesThisWeek: 0, viewEvents: [], saleEvents: [] }
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    for (const o of orders) {
      if (o && o.status === 'paid') {
        const ts = Number(o.createdAt || now)
        const amt = Number(o.total || 0)
        fresh.saleEvents = fresh.saleEvents || []
        fresh.saleEvents.push({ ts, amount: amt })
        // only include in salesThisWeek if within last 7 days
        if (ts >= weekAgo) fresh.salesThisWeek += amt
      }
    }
  // preserve existing users and derive viewsToday from existing viewEvents
  const current = load()
  fresh.users = current.users || 0
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  fresh.viewsToday = (current.viewEvents || []).filter((t) => Number(t) >= todayStart.getTime()).length
    save(fresh as Metrics)
    return { rebuilt: true, salesThisWeek: fresh.salesThisWeek }
  } catch (e) {
    return { rebuilt: false, error: String(e) }
  }
}

export function resetDailyViews() {
  const m = load()
  m.viewsToday = 0
  // optionally clear viewEvents older than today
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  m.viewEvents = (m.viewEvents || []).filter((t) => t >= startOfToday.getTime())
  save(m)
}

// helpers to compute last N days series
function startOfDayTs(daysAgo = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.getTime()
}

export function seriesLastNDays(n = 7) {
  const m = load()
  const viewEvents = m.viewEvents || []
  const saleEvents = m.saleEvents || []
  const res = { views: [] as number[], sales: [] as number[] }
  for (let i = n - 1; i >= 0; i--) {
    const start = startOfDayTs(i)
    const end = start + 24 * 60 * 60 * 1000
    const views = viewEvents.filter((t) => t >= start && t < end).length
    const sales = saleEvents.filter((s) => s.ts >= start && s.ts < end).reduce((acc, s) => acc + (s.amount || 0), 0)
    res.views.push(views)
    res.sales.push(sales)
  }
  return res
}

// Aggregate last N weeks (each week = 7 days). Returns arrays ordered from oldest to newest.
export function seriesLastNWeeks(n = 4) {
  const days = seriesLastNDays(n * 7)
  const res = { views: [] as number[], sales: [] as number[] }
  for (let i = 0; i < n; i++) {
    const start = i * 7
    const chunkViews = days.views.slice(start, start + 7).reduce((a, b) => a + b, 0)
    const chunkSales = days.sales.slice(start, start + 7).reduce((a, b) => a + b, 0)
    res.views.push(chunkViews)
    res.sales.push(chunkSales)
  }
  return res
}

// Aggregate last N months approximated as 30-day blocks.
export function seriesLastNMonths(n = 6) {
  const days = seriesLastNDays(n * 30)
  const res = { views: [] as number[], sales: [] as number[] }
  for (let i = 0; i < n; i++) {
    const start = i * 30
    const chunkViews = days.views.slice(start, start + 30).reduce((a, b) => a + b, 0)
    const chunkSales = days.sales.slice(start, start + 30).reduce((a, b) => a + b, 0)
    res.views.push(chunkViews)
    res.sales.push(chunkSales)
  }
  return res
}

// Aggregate last N calendar years (ordered oldest -> newest)
export function seriesLastNYears(n = 5) {
  const m = load()
  const saleEvents = m.saleEvents || []
  const res = { views: [] as number[], sales: [] as number[] }
  const now = new Date()
  const currentYear = now.getFullYear()
  // build years from oldest to newest
  const years: number[] = []
  for (let i = n - 1; i >= 0; i--) {
    years.push(currentYear - i)
  }

  for (const y of years) {
    const start = new Date(y, 0, 1).getTime()
    const end = new Date(y + 1, 0, 1).getTime()
    const chunkSales = (saleEvents || []).filter((s) => s.ts >= start && s.ts < end).reduce((acc, s) => acc + (s.amount || 0), 0)
    // views are not tracked per year in this simple model (keep zero)
    res.views.push(0)
    res.sales.push(chunkSales)
  }

  return res
}
