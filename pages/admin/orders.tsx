import { useEffect, useState, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadOrders, deleteOrder, Order, reprocessSingleOrderForMetrics, saveOrders } from '../../lib/orders'
import { loadProducts } from '../../lib/productStore'
import { Product } from '../../data/products'
import { getTranslatedProductText } from '../../lib/productI18n'
import { useLanguage } from '../../lib/language'

type SortField = 'date' | 'total' | 'email'
type SortOrder = 'asc' | 'desc'
type DateRange = 'all' | 'today' | 'week' | 'month'

export default function AdminOrders() {
  const [list, setList] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [invoiceFor, setInvoiceFor] = useState<Order | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { lang } = useLanguage()

  useEffect(() => {
    const orders = loadOrders()
    setList(orders)
    setProducts(loadProducts())

    // Listen for updates from other tabs
    const handleUpdate = () => {
      setList(loadOrders())
    }
    window.addEventListener('qanari:orders-updated', handleUpdate)
    return () => window.removeEventListener('qanari:orders-updated', handleUpdate)
  }, [])

  const getDateRangeStart = (range: DateRange): number => {
    const now = new Date()
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      case 'week':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime()
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime()
      default:
        return 0
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filtered = useMemo(() => {
    return list
      .filter(o => {
        // Status filter
        if (statusFilter !== 'all' && o.status !== statusFilter) return false
        
        // Date range filter
        if (dateRange !== 'all') {
          const rangeStart = getDateRangeStart(dateRange)
          if (o.createdAt < rangeStart) return false
        }
        
        // Text search
        if (filter) {
          const searchLower = filter.toLowerCase()
          const matchId = o.id.toLowerCase().includes(searchLower)
          const matchEmail = (o.memberEmail || '').toLowerCase().includes(searchLower)
          const matchProducts = o.items.some(item => {
            const product = products.find(p => p.id === item.productId)
            if (!product) return false
            return getTranslatedProductText(product, lang).title.toLowerCase().includes(searchLower)
          })
          if (!matchId && !matchEmail && !matchProducts) return false
        }
        
        return true
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
        }
        if (sortField === 'total') {
          return sortOrder === 'desc' ? b.total - a.total : a.total - b.total
        }
        // email
        const emailA = a.memberEmail || ''
        const emailB = b.memberEmail || ''
        return sortOrder === 'desc' ? emailB.localeCompare(emailA) : emailA.localeCompare(emailB)
      })
  }, [list, statusFilter, dateRange, filter, sortField, sortOrder, products, lang])

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, o) => sum + o.total, 0)
    const counts = filtered.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {} as Record<Order['status'], number>)
    return { total, counts }
  }, [filtered])

  const onDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید می‌خواهید این سفارش را حذف کنید؟')) return
    deleteOrder(id)
    setList(loadOrders())
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return
    if (!confirm('آیا از حذف ' + selectedIds.size + ' سفارش انتخاب شده مطمئن هستید؟')) return
    
    const remainingOrders = list.filter(o => !selectedIds.has(o.id))
    saveOrders(remainingOrders)
    setList(remainingOrders)
    setSelectedIds(new Set())
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map(o => o.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const updateStatus = (id: string, status: Order['status']) => {
    const next = list.map((o) => (o.id === id ? { ...o, status } : o))
    try {
      localStorage.setItem('qanari:orders', JSON.stringify(next))
      setList(next)
    } catch (e) {
      // ignore
    }
  }

  const statusColors: Record<Order['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    shipped: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const formatStatus = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      pending: 'در انتظار پرداخت',
      paid: 'پرداخت شده',
      shipped: 'ارسال شده',
      cancelled: 'لغو شده'
    }
    return labels[status]
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">مدیریت سفارش‌ها</h1>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-3 py-2 border rounded text-sm"
            >
              <option value="all">همه زمان‌ها</option>
              <option value="today">امروز</option>
              <option value="week">هفته اخیر</option>
              <option value="month">ماه اخیر</option>
            </select>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50"
              >
                حذف {selectedIds.size} سفارش
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">کل سفارش‌ها</div>
            <div className="text-2xl font-bold mt-1">{filtered.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">مجموع فروش</div>
            <div className="text-2xl font-bold mt-1">{stats.total.toLocaleString()} تومان</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">در انتظار پرداخت</div>
            <div className="text-2xl font-bold mt-1">{stats.counts.pending || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">تکمیل شده</div>
            <div className="text-2xl font-bold mt-1">{stats.counts.shipped || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="جستجو در شناسه، ایمیل یا محصولات..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
                className="px-3 py-2 border rounded"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار پرداخت</option>
                <option value="paid">پرداخت شده</option>
                <option value="shipped">ارسال شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-3 text-right">شناسه</th>
                  <th 
                    className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('email')}
                  >
                    مشتری
                    {sortField === 'email' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('total')}
                  >
                    مبلغ
                    {sortField === 'total' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-right">وضعیت</th>
                  <th 
                    className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('date')}
                  >
                    تاریخ
                    {sortField === 'date' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.id)}
                        onChange={e => {
                          const next = new Set(selectedIds)
                          if (e.target.checked) {
                            next.add(o.id)
                          } else {
                            next.delete(o.id)
                          }
                          setSelectedIds(next)
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.id}</div>
                      <div className="text-xs text-gray-500">
                        {o.items.length} محصول
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.memberEmail || 'مهمان'}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {o.total.toLocaleString()} تومان
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as Order['status'])}
                        className={`px-2 py-1 rounded text-sm ${statusColors[o.status]}`}
                      >
                        <option value="pending">در انتظار پرداخت</option>
                        <option value="paid">پرداخت شده</option>
                        <option value="shipped">ارسال شده</option>
                        <option value="cancelled">لغو شده</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInvoiceFor(o)}
                          className="text-blue-600 hover:text-blue-800"
                          title="نمایش فاکتور"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { const res = reprocessSingleOrderForMetrics(o.id); alert(JSON.stringify(res)); }}
                          className="text-gray-600 hover:text-gray-800"
                          title="بررسی متریک"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(o.id)}
                          className="text-red-600 hover:text-red-800"
                          title="حذف سفارش"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      هیچ سفارشی با این فیلترها پیدا نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {invoiceFor ? (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-4 rounded w-11/12 max-w-xl">
              <h3 className="font-semibold mb-2">فاکتور {invoiceFor.id}</h3>
              <div>تاریخ: {new Date(invoiceFor.createdAt).toLocaleString()}</div>
              <div>ایمیل مشتری: {invoiceFor.memberEmail || 'مهمان'}</div>
              <ul className="list-disc ml-6 mt-2">
                {invoiceFor.items.map((it, idx) => <li key={idx}>{it.productId} × {it.quantity}</li>)}
              </ul>
              <div className="mt-2 font-semibold">مجموع: {invoiceFor.total.toLocaleString()} تومان</div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => window.print()}>چاپ</button>
                <button className="px-3 py-1 border rounded" onClick={() => setInvoiceFor(null)}>بستن</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
