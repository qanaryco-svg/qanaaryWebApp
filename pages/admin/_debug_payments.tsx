import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function DebugPayments() {
  const [log, setLog] = useState<string[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

  const append = (s: string) => setLog((l) => [s, ...l])

  useEffect(() => {
    append('صفحه دیباگ لود شد')
    const mem = require('../../lib/members')
    const ord = require('../../lib/orders')
    setOrders(ord.loadOrders())
    setMembers(mem.loadMembers())
  }, [])

  const runSim = () => {
    const mem = require('../../lib/members')
    const ord = require('../../lib/orders')
    // find first member that has referrer chain or just pick one
    const mlist = mem.loadMembers()
    if (mlist.length < 2) return append('نیاز به حداقل 2 عضو برای تست')
    const buyer = mlist[0]
    const referrer = mlist[1]

    const id = 'debug-' + Date.now()
  const order = { id, memberEmail: buyer.email, items: [{ productId: 'p1', quantity: 1 }], total: 100000, status: 'paid', referrerId: referrer.id, createdAt: Date.now() }
  // use per-level absolute percentage distribution for debug runs
  ord.addOrderWithLevelPercents(order, [0.5, 1, 0.1])
    append('فاکتور دیباگ ساخته و پرداخت شد')
    setOrders(ord.loadOrders())
    setMembers(mem.loadMembers())
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Debug Payments</h1>
        <div className="space-y-3">
          <button onClick={runSim} className="px-4 py-2 bg-qanari text-qanariDark rounded">Run payment simulation</button>
          <div className="p-3 border rounded">
            <h3 className="font-semibold">Logs</h3>
            <ul>
              {log.map((l, i) => <li key={i} className="text-sm">{l}</li>)}
            </ul>
          </div>

          <div className="p-3 border rounded">
            <h3 className="font-semibold">Orders</h3>
            <pre className="text-xs">{JSON.stringify(orders, null, 2)}</pre>
          </div>

          <div className="p-3 border rounded">
            <h3 className="font-semibold">Members</h3>
            <pre className="text-xs">{JSON.stringify(members, null, 2)}</pre>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
