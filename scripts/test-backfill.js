// quick node test harness to simulate seller-based backfill
const mem = require('../lib/members')
const ord = require('../lib/orders')

function reset() {
  const members = mem.loadMembers()
  members.forEach(m => m.commissionEarned = 0)
  mem.saveMembers(members)
}

function logMembers() {
  const members = mem.loadMembers()
  console.log('Members:')
  members.forEach(m => console.log(m.id, m.name, 'commission=', m.commissionEarned || 0))
}

function run() {
  // create two members mamad and bahar (if not exist)
  let members = mem.loadMembers()
  let mamad = members.find(m => m.email === 'mamad@example.com')
  if (!mamad) {
    mamad = { id: 'mamad', name: 'mamad', email: 'mamad@example.com', password: 'x', referralCode: 'r_mamad', referrerId: undefined, commissionEarned: 0 }
    members.push(mamad)
  }
  let bahar = members.find(m => m.email === 'bahar@example.com')
  if (!bahar) {
    bahar = { id: 'bahar', name: 'bahar', email: 'bahar@example.com', password: 'x', referralCode: 'r_bahar', referrerId: mamad.id, commissionEarned: 0 }
    members.push(bahar)
  }
  mem.saveMembers(members)

  // create a paid order with sellerId = bahar and total = 7034000
  const orders = ord.loadOrders()
  const testOrder = { id: 'test_bahar_sale', memberEmail: 'customer@example.com', items: [{ productId: 'p1', quantity: 1 }], total: 7034000, status: 'paid', sellerId: bahar.id, createdAt: Date.now() }
  // insert test order
  const existing = orders.filter(o => o.id !== testOrder.id)
  existing.unshift(testOrder)
  ord.saveOrders(existing)

  // reset commissions
  reset()

  // run the admin rebuild logic (same as marketing page)
  const commissionPercent = 5
  const ordersList = ord.loadOrders()
  for (const o of ordersList) {
    if (o.status === 'paid') {
      if (o.sellerId) {
        try {
          const allMembers = mem.loadMembers()
          const seller = allMembers.find(m => m.id === o.sellerId)
          if (seller) {
            const sellerAmt = Math.round((o.total * 3.5) / 100)
            mem.creditCommission(seller.id, sellerAmt)
            const lvl1 = seller.referrerId
            if (lvl1) {
              const amt1 = Math.round((o.total * 1) / 100)
              mem.creditCommission(lvl1, amt1)
            }
            let lvl2 = undefined
            if (seller.referrerId) {
              const p = allMembers.find(m => m.id === seller.referrerId)
              lvl2 = p ? p.referrerId : undefined
            }
            if (lvl2) {
              const amt2 = Math.round((o.total * 0.5) / 100)
              mem.creditCommission(lvl2, amt2)
            }
          }
        } catch (e) {
        }
      } else {
        let refId = o.referrerId
        if (!refId && o.memberEmail) {
          const buyer = mem.findMemberByEmail(o.memberEmail)
          if (buyer && buyer.referrerId) refId = buyer.referrerId
        }
        if (refId) {
          const totalAmount = Math.round((o.total * commissionPercent) / 100)
          if (typeof mem.distributeCommissionUpchain === 'function') {
            mem.distributeCommissionUpchain(refId, totalAmount)
          } else {
            mem.creditCommission(refId, totalAmount)
          }
          if (!o.referrerId) o.referrerId = refId
        }
      }
    }
  }

  console.log('After backfill:')
  logMembers()
}

run()
