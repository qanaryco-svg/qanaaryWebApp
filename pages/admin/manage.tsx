import { useEffect, useState, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadProducts, addProduct, updateProduct, deleteProduct } from '../../lib/productStore'
import { loadAllComments, deleteComment, persistAllComments } from '../../lib/commentsStore'
import { Product } from '../../data/products'
import AdminProductForm from '../../components/AdminProductForm'
import { getTranslatedProductText } from '../../lib/productI18n'
import { useRouter } from 'next/router'
import { useLanguage } from '../../lib/language'

export default function AdminManage() {
  const [list, setList] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [tab, setTab] = useState<'products' | 'comments'>('products')
  const [comments, setComments] = useState<any[]>([])
  const router = useRouter()
  const { lang } = useLanguage()

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
    setList(loadProducts())
    setComments(loadAllComments())
  }, [])

  const onAdd = (p: Product) => {
    addProduct(p)
    setList(loadProducts())
    setEditing(null)
  }

  const onUpdate = (p: Product) => {
    updateProduct(p)
    setList(loadProducts())
    setEditing(null)
  }

  const onDelete = (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return
    deleteProduct(id)
    setList(loadProducts())
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qanari:products-updated'))
      }
    } catch (e) {
      // ignore
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('qanari:products')
        bc.postMessage({ type: 'deleted', id })
        bc.close()
      }
    } catch (e) {
      // ignore
    }
  }

  const logout = () => {
    sessionStorage.removeItem('qanari:admin')
    router.push('/')
  }

  // Sort and filter logic
  const [sortField, setSortField] = useState<'title' | 'price' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState<string>('all')

  const stats = useMemo(() => {
    return {
      totalProducts: list.length,
      totalValue: list.reduce((acc, p) => acc + p.price, 0),
      categories: list.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      totalComments: comments.length,
      averageRating: comments.length ? 
        comments.reduce((acc: number, c: any) => acc + (Number(c.rating) || 0), 0) / comments.length
        : 0
    }
  }, [list, comments])

  const filteredProducts = useMemo(() => {
    let result = [...list]
    
    // Apply filters
    if (filter) {
      const searchTerm = filter.toLowerCase()
      result = result.filter(p => 
        getTranslatedProductText(p, lang).title.toLowerCase().includes(searchTerm) ||
        getTranslatedProductText(p, lang).description.toLowerCase().includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm)
      )
    }

    if (category !== 'all') {
      result = result.filter(p => p.category === category)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'title') {
        comparison = getTranslatedProductText(a, lang).title.localeCompare(getTranslatedProductText(b, lang).title)
      } else if (sortField === 'price') {
        comparison = a.price - b.price
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [list, filter, category, sortField, sortOrder, lang])

  const toggleSort = (field: 'title' | 'price' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDelete = () => {
    if (!selectedIds.size) return
    if (!confirm(`آیا از حذف ${selectedIds.size} محصول انتخاب شده مطمئن هستید؟`)) return
    selectedIds.forEach(id => onDelete(id))
    setSelectedIds(new Set())
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">کل محصولات</div>
            <div className="text-2xl font-bold mt-1">{stats.totalProducts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">ارزش کل موجودی</div>
            <div className="text-2xl font-bold mt-1">{stats.totalValue.toLocaleString()} تومان</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">تعداد نظرات</div>
            <div className="text-2xl font-bold mt-1">{stats.totalComments}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">میانگین امتیاز</div>
            <div className="text-2xl font-bold mt-1">
              {stats.averageRating.toFixed(1)}
              <span className="text-yellow-500 mr-1">★</span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editing.id ? 'ویرایش محصول' : 'افزودن محصول جدید'}
              </h2>
            </div>
            <div className="p-6">
              <AdminProductForm 
                product={editing} 
                onCancel={() => setEditing(null)} 
                onSave={(p) => (editing.id ? onUpdate(p) : onAdd(p))} 
              />
            </div>
          </div>
        ) : tab === 'products' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="جستجو در محصولات..."
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="all">همه دسته‌ها</option>
                    {Object.entries(stats.categories).map(([cat, count]) => (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    ))}
                  </select>
                  <a
                    href="/admin/categories"
                    className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:brightness-95"
                    title="سفارشی‌سازی دسته‌ها"
                  >
                    سفارشی‌سازی دسته‌ها
                  </a>
                  <button
                    onClick={() => setEditing({ id: '', title: '', price: 0, images: [''], description: '', category: '' })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    افزودن محصول
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      حذف {selectedIds.size} محصول
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-right">تصویر</th>
                    <th 
                      className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('title')}
                    >
                      عنوان
                      {sortField === 'title' && (
                        <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('price')}
                    >
                      قیمت
                      {sortField === 'price' && (
                        <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-right">دسته</th>
                    <th className="px-6 py-3 text-right">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={(e) => {
                            const next = new Set(selectedIds)
                            if (e.target.checked) {
                              next.add(p.id)
                            } else {
                              next.delete(p.id)
                            }
                            setSelectedIds(next)
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <img 
                          src={p.images[0] || '/logo.png'} 
                          alt={getTranslatedProductText(p, lang).title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {getTranslatedProductText(p, lang).title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {p.price.toLocaleString()} تومان
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing(p)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ویرایش محصول"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="text-red-600 hover:text-red-800"
                            title="حذف محصول"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        هیچ محصولی با این فیلترها پیدا نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">مدیریت نظرات</h3>
                <button
                  onClick={() => {
                    if (!confirm('آیا از حذف تمام نظرات مطمئن هستید؟ این عمل برگشت‌پذیر نیست.')) return
                    try {
                      persistAllComments([])
                      try { localStorage.setItem('qanari:comments-seeded','true') } catch (e) {}
                      setComments([])
                    } catch (e) {
                      // ignore
                    }
                  }}
                  className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50"
                >
                  حذف همه نظرات
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {comments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    هیچ نظری ثبت نشده است.
                  </div>
                )}
                {comments.map((c: any) => (
                  <div key={c.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-sm text-yellow-500">
                            {('★'.repeat(Math.max(0, Number(c.rating) || 0)) + '☆'.repeat(Math.max(0, 5 - (Number(c.rating) || 0))))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2">{c.text}</div>
                        <div className="mt-2 text-sm text-gray-500">
                          محصول:{' '}
                          {(() => {
                            const prod = list.find((p) => p.id === c.productId)
                            return prod ? (
                              <span className="text-blue-600">
                                {getTranslatedProductText(prod, lang).title}
                              </span>
                            ) : (
                              <span className="text-red-600">{c.productId}</span>
                            )
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return
                          deleteComment(c.id)
                          setComments(loadAllComments())
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="حذف نظر"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
  // file deduplicated; single AdminManage export retained
