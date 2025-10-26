import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AdminMarketing() {
  const [tree, setTree] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [membersRaw, setMembersRaw] = useState<any[] | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadAll = () => {
      try {
        const mem = require('../../lib/members')
        const ord = require('../../lib/orders')
        setTree(mem.buildReferralTree())
        setOrders(ord.loadOrders())
        setMembersRaw(mem.loadMembers())
      } catch (e) {
        setTree([])
        setOrders([])
        setMembersRaw([])
      }
    }

    loadAll()

    const onUpdate = () => loadAll()

    try {
      if (typeof window !== 'undefined') {
        window.addEventListener('qanari:orders-updated', onUpdate)
        window.addEventListener('qanari:members-updated', onUpdate)
        try {
          // @ts-ignore
          if ((window as any).BroadcastChannel) {
            // @ts-ignore
            const bc = new BroadcastChannel('qanari:orders')
            bc.onmessage = onUpdate
            // @ts-ignore
            const bc2 = new BroadcastChannel('qanari:members')
            bc2.onmessage = onUpdate
            ;(window as any).__qanari_bc_orders = bc
            ;(window as any).__qanari_bc_members = bc2
          }
        } catch (e) {}
      }
    } catch (e) {}

    return () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('qanari:orders-updated', onUpdate)
          window.removeEventListener('qanari:members-updated', onUpdate)
          try {
            const bc: any = (window as any).__qanari_bc_orders
            const bc2: any = (window as any).__qanari_bc_members
            if (bc) bc.close()
            if (bc2) bc2.close()
            delete (window as any).__qanari_bc_orders
            delete (window as any).__qanari_bc_members
          } catch (e) {}
        }
      } catch (e) {}
    }
  // mark mounted after initial load; ensures client and server initial markup match
  setMounted(true)
  }, [])

  const Node = ({ node, depth = 0 }: { node: any; depth?: number }) => {
    const [open, setOpen] = useState(depth < 1)
    // read fresh orders and members so UI shows up-to-date values
    let referredTotal = 0
    let freshMemberCommission = node.member.commissionEarned || 0
    try {
      const freshOrders = orders
      const referredOrders = freshOrders.filter((o: any) => o.referrerId === node.member.id && o.status === 'paid')
      referredTotal = referredOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0)
      const fm = (membersRaw || []).find((m: any) => m.id === node.member.id)
      if (fm) freshMemberCommission = fm.commissionEarned || 0
    } catch (e) {
      // ignore
    }
    return (
      <div className="pl-" style={{ paddingLeft: depth * 16 }}>
        <div className="p-2 border rounded mb-2 bg-white flex items-center justify-between">
          <div>
            <button onClick={() => setOpen(!open)} className="mr-2 px-2 py-1 border rounded text-sm">{open ? '-' : '+'}</button>
            <span className="font-semibold">{node.member.name || node.member.email}</span>
            <div className="text-xs text-gray-600">کد: {node.member.referralCode || '—'}</div>
          </div>
          <div className="text-right text-sm">
            <div>سود: <strong>{(freshMemberCommission || 0).toLocaleString()}</strong></div>
            <div>مبلغ ارجاع: <strong>{referredTotal.toLocaleString()}</strong></div>
          </div>
        </div>
        {open && node.children && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map((c: any) => (
              <Node key={c.member.id} node={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">فروش و بازاریابی — درخت معرف‌ها</h1>
        <p className="text-sm text-gray-600 mb-4">نمایش سلسله‌مراتبی اعضا و شبکه معرف‌ها (چندسطحی).</p>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => {
            try {
              const mem = require('../../lib/members')
              const ord = require('../../lib/orders')
              setTree(mem.buildReferralTree())
              setOrders(ord.loadOrders())
            } catch (e) {}
          }} className="px-3 py-2 border rounded">بارگذاری مجدد</button>
          {/* rebuilding buttons hidden by request */}
          <div className="text-sm text-gray-500">(برای اطمینان از تازه‌سازی دستی)</div>
        </div>
        <div className="space-y-3">
          {tree.map((root: any) => (
            <Node key={root.member.id} node={root} depth={0} />
          ))}
        </div>

        {/* Raw Debug Data removed from UI to keep admin panel clean. */}

        <div className="mt-6 p-3 border rounded">
          <h3 className="font-semibold mb-2">پرداخت‌های بدون معرف (اختیاری)</h3>
          <p className="text-sm text-gray-600 mb-2">برای هر سفارش پرداخت‌شده که معرف ندارد، یک معرف انتخاب کنید تا سود محاسبه و ثبت شود.</p>
          {
            // build list of paid orders missing referrer
            (() => {
                try {
                const paidNoRef = orders.filter((o: any) => o.status === 'paid' && !o.referrerId)
                const members = membersRaw || []
                if (paidNoRef.length === 0) return <div className="text-sm text-gray-600">سفارشی یافت نشد.</div>
                return (
                  <div className="space-y-3">
                    {paidNoRef.map((o: any) => (
                      <div key={o.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm">#{o.id} — مبلغ: {o.total.toLocaleString()} تومان — خریدار: {o.memberEmail || 'مهمان'}</div>
                        </div>
                        <div>
                          <select id={`sel-${o.id}`} className="border p-1 rounded">
                            <option value="">انتخاب معرف...</option>
                            {members.map((m: any) => (
                              <option key={m.id} value={m.id}>{m.name || m.email}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <button className="px-3 py-1 bg-qanari text-qanariDark rounded" onClick={() => {
                            try {
                              const sel = (document.getElementById(`sel-${o.id}`) as HTMLSelectElement)
                              const refId = sel ? sel.value : ''
                              if (!refId) return alert('لطفا معرف را انتخاب کنید')
                              // perform library ops only on client
                              const ordLib = require('../../lib/orders')
                              const memLib = require('../../lib/members')
                              const allOrders = ordLib.loadOrders()
                              const idx = allOrders.findIndex((x: any) => x.id === o.id)
                              if (idx === -1) return alert('سفارش پیدا نشد')
                              const commissionPercent = 5
                              const totalAmount = Math.round((allOrders[idx].total * commissionPercent) / 100)
                              if (typeof memLib.distributeCommissionUpchain === 'function') {
                                memLib.distributeCommissionUpchain(refId, totalAmount)
                              } else {
                                memLib.creditCommission(refId, totalAmount)
                              }
                              allOrders[idx].referrerId = refId
                              ordLib.saveOrders(allOrders)
                              try { window.dispatchEvent(new CustomEvent('qanari:members-updated')) } catch(e){}
                              try { window.dispatchEvent(new CustomEvent('qanari:orders-updated')) } catch(e){}
                              alert('معرف ثبت و سود اعمال شد')
                              // refresh state from libs
                              setOrders(ordLib.loadOrders())
                              setMembersRaw(memLib.loadMembers())
                              setTree(memLib.buildReferralTree())
                            } catch (err) {
                              console.error(err)
                              alert('خطا در اعمال')
                            }
                          }}>ثبت و اعمال</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              } catch (e) {
                return <div className="text-sm text-red-500">خطا در بارگذاری سفارش‌ها</div>
              }
            })()
          }
        </div>
      </div>
    </AdminLayout>
  )
}
