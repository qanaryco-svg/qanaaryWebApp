export type OrderItem = {
  productId: string
  quantity: number
}

export type Order = {
  id: string
  memberEmail?: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  // optional referral/seller tracking
  referrerId?: string
  sellerId?: string
  createdAt: number
}

const KEY = 'qanari:orders'

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveOrders(list: Order[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qanari:orders-updated'))
      try {
        // @ts-ignore
        if ((window as any).BroadcastChannel) {
          // @ts-ignore
          const bc = new BroadcastChannel('qanari:orders')
          bc.postMessage({ type: 'orders-updated' })
          bc.close()
        }
      } catch (e) {}
    }
  } catch (e) {}
}

export function addOrder(o: Order) {
  const list = loadOrders()
  list.unshift(o)
  saveOrders(list)
  try {
    // log activity (lazy require to avoid cycles)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const activity = require('./activity')
    if (activity && typeof activity.addActivity === 'function') {
      activity.addActivity(o.memberEmail || undefined, 'order_created', { orderId: o.id, total: o.total, status: o.status })
    }
  } catch (e) {}
}

// mark an order as metricsProcessed (idempotent) so reprocessing won't double-count
function markOrderMetricsProcessed(orderId: string) {
  try {
    const list = loadOrders()
    const idx = list.findIndex((x) => x.id === orderId)
    if (idx !== -1) {
      ;(list[idx] as any).metricsProcessed = true
      saveOrders(list)
    }
  } catch (e) {
    // ignore
  }
}

// helper to add order and credit commissions if paid
export function addOrderWithCommission(o: Order, commissionPercent = 5) {
  addOrder(o)
  // update metrics if order is already paid
  try {
    if (o.status === 'paid') {
      // lazy import metrics to avoid circular deps
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const metrics = require('./metrics')
      if (typeof metrics.addSale === 'function') metrics.addSale(o.total)
      // mark as processed so future reprocess pass won't double-count
      try { markOrderMetricsProcessed(o.id) } catch (e) {}
      try {
        const activity = require('./activity')
        if (activity && typeof activity.addActivity === 'function') activity.addActivity(o.memberEmail || undefined, 'order_paid', { orderId: o.id, total: o.total })
      } catch (e) {}
    }
  } catch (e) {
    // ignore metric update failures
  }
  // if order is already paid and a referrer exists, credit commission
  try {
    if (o.status === 'paid' && o.referrerId) {
      // Lazy import to avoid circular issues in build
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const members = require('./members')
      const totalAmount = Math.round((o.total * commissionPercent) / 100)
      // distribute up the chain with default level splits (60/30/10)
      if (typeof members.distributeCommissionUpchain === 'function') {
        const res = members.distributeCommissionUpchain(o.referrerId, totalAmount)
        // after distribution, notify members updated
        try {
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:members-updated'))
        } catch (e) {}
      } else {
        members.creditCommission(o.referrerId, totalAmount)
        try {
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:members-updated'))
        } catch (e) {}
      }
    }
  } catch (e) {
    // ignore failures in local crediting
  }
}

// helper to add order and credit commissions using absolute per-level percentages
export function addOrderWithLevelPercents(o: Order, levelPercentsAbsolute: number[] = [0.5, 1, 0.1]) {
  addOrder(o)
  // also update site-wide metrics for sales so dashboard shows totals
  try {
    if (o.status === 'paid') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const metrics = require('./metrics')
      if (typeof metrics.addSale === 'function') metrics.addSale(o.total)
        // mark as processed so future reprocess pass won't double-count
        try { markOrderMetricsProcessed(o.id) } catch (e) {}
        // mark as processed so future reprocess pass won't double-count
        try { markOrderMetricsProcessed(o.id) } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
  try {
    if (o.status === 'paid') {
      // Determine the start member for distribution.
      // Prefer seller's uplines when sellerId is set (commissions paid based on seller's referral chain).
      // Otherwise fall back to order.referrerId (buyer-referrer flows).
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const members = require('./members')
      let startMemberId: string | undefined = undefined
      if (o.sellerId) {
        try {
          // try to resolve seller by id/referralCode/email
          const resolver = members.findMemberByAnyId
          const seller = typeof resolver === 'function' ? resolver(o.sellerId) : members.loadMembers().find((m: any) => m.id === o.sellerId)
          // start from the seller's referrer (immediate upline of the seller)
          startMemberId = seller ? seller.referrerId : undefined
        } catch (e) {
          startMemberId = undefined
        }
      }
      // fallback to order.referrerId (buyer-referred purchase)
      if (!startMemberId) startMemberId = o.referrerId

      if (startMemberId) {
        // If seller is present, we credit seller + uplines according to the requested split:
        // seller: 3.5% of sale, seller's immediate upline: 1%, next upline: 0.5% (total 5%).
        if (o.sellerId) {
          try {
            // credit the seller directly
            const sellerId = o.sellerId
            const sellerAmt = Math.round((o.total * 3.5) / 100)
            members.creditCommission(sellerId, sellerAmt)

            // credit immediate upline (seller's referrer)
            const list = members.loadMembers()
            const seller = list.find((m: any) => m.id === sellerId)
            const lvl1 = seller ? seller.referrerId : undefined
            if (lvl1) {
              const amt1 = Math.round((o.total * 1) / 100)
              members.creditCommission(lvl1, amt1)
            }

            // credit next upline (two levels above seller)
            let lvl2: string | undefined = undefined
            if (lvl1) {
              const parent = list.find((m: any) => m.id === lvl1)
              lvl2 = parent ? parent.referrerId : undefined
            }
            if (lvl2) {
              const amt2 = Math.round((o.total * 0.5) / 100)
              members.creditCommission(lvl2, amt2)
            }

            try {
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:members-updated'))
            } catch (e) {}
          } catch (e) {
            // ignore crediting failures
          }
        } else if (typeof members.distributeCommissionBySale === 'function') {
          // fallback: use existing per-level absolute distribution starting from startMemberId
          members.distributeCommissionBySale(startMemberId, o.total, levelPercentsAbsolute)
          try {
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:members-updated'))
          } catch (e) {}
        } else {
          const totalPct = levelPercentsAbsolute.reduce((a, b) => a + b, 0)
          const amt = Math.round((o.total * totalPct) / 100)
          members.creditCommission(startMemberId, amt)
          try {
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:members-updated'))
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    // ignore local crediting errors
  }
}

export function deleteOrder(id: string) {
  const list = loadOrders().filter((x) => x.id !== id)
  saveOrders(list)
}

export function seedOrdersIfEmpty() {
  const existing = loadOrders()
  if (existing.length > 0) return
  const now = Date.now()
  const sample: Order[] = [
    { id: 'o1', memberEmail: 'ali@example.com', items: [{ productId: 'p1', quantity: 1 }], total: 129000, status: 'pending', createdAt: now - 1000 * 60 * 60 },
    { id: 'o2', memberEmail: 'sara@example.com', items: [{ productId: 'p5', quantity: 2 }], total: 298000, status: 'paid', createdAt: now - 1000 * 60 * 30 },
  ]
  saveOrders(sample)
}

// Idempotent reprocess: credit site metrics for paid orders that were saved before metrics wiring existed.
// Marks each order with `metricsProcessed = true` to avoid double-processing.
export function reprocessPaidOrdersForMetrics() {
  try {
    const list = loadOrders()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const metrics = require('./metrics')
    let changed = false
    for (const o of list) {
      // only process paid orders that haven't been processed yet
      if (o.status === 'paid' && !(o as any).metricsProcessed) {
        if (typeof metrics.addSale === 'function') {
          try {
            metrics.addSale(o.total)
            ;(o as any).metricsProcessed = true
            changed = true
          } catch (e) {
            // continue on error for individual orders
          }
        }
      }
    }
    if (changed) saveOrders(list)
    return { processed: changed }
  } catch (e) {
    return { processed: false, error: String(e) }
  }
}

// Reprocess single order idempotently for metrics
export function reprocessSingleOrderForMetrics(orderId: string) {
  try {
    const list = loadOrders()
    const o = list.find((x) => x.id === orderId)
    if (!o) return { processed: false, reason: 'not_found' }
    if (o.status !== 'paid') return { processed: false, reason: 'not_paid' }
    if ((o as any).metricsProcessed) return { processed: false, reason: 'already' }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const metrics = require('./metrics')
    if (typeof metrics.addSale === 'function') metrics.addSale(o.total)
    ;(o as any).metricsProcessed = true
    saveOrders(list)
    return { processed: true }
  } catch (e) {
    return { processed: false, error: String(e) }
  }
}
