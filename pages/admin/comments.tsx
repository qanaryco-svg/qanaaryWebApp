import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadAllComments, deleteComment, persistAllComments } from '../../lib/commentsStore'
import { loadProducts } from '../../lib/productStore'
import { Product } from '../../data/products'
import { useLanguage } from '../../lib/language'
import { getTranslatedProductText } from '../../lib/productI18n'
import { useRouter } from 'next/router'
import Link from 'next/link'

type CommentWithProduct = {
  id: string
  productId: string
  name: string
  rating: number
  text: string
  createdAt: number
  product?: Product
}

type SortField = 'date' | 'rating' | 'name'
type SortOrder = 'asc' | 'desc'

export default function AdminComments() {
  const [comments, setComments] = useState<CommentWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterProduct, setFilterProduct] = useState<string>('')
  const [filterRating, setFilterRating] = useState<number>(0)
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const { lang } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')

    const prods = loadProducts()
    setProducts(prods)
    
    const cmts = loadAllComments().map(c => ({
      ...c,
      product: prods.find(p => p.id === c.productId)
    }))
    setComments(cmts)
  }, [])

  const filteredComments = comments.filter(c => {
    if (filterProduct && c.productId !== filterProduct) return false
    if (filterRating > 0 && c.rating !== filterRating) return false
    if (searchText) {
      const search = searchText.toLowerCase()
      const productName = c.product ? getTranslatedProductText(c.product, lang).title.toLowerCase() : ''
      return c.name.toLowerCase().includes(search) ||
             c.text.toLowerCase().includes(search) ||
             productName.includes(search)
    }
    return true
  }).sort((a, b) => {
    if (sortField === 'date') {
      return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    }
    if (sortField === 'rating') {
      return sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating
    }
    // name
    return sortOrder === 'desc' 
      ? b.name.localeCompare(a.name)
      : a.name.localeCompare(b.name)
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return
    if (!confirm('آیا از حذف ' + selectedIds.size + ' نظر انتخاب شده مطمئن هستید؟')) return

    const remainingComments = comments.filter(c => !selectedIds.has(c.id))
    persistAllComments(remainingComments)
    setComments(remainingComments)
    setSelectedIds(new Set())
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredComments.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const clearAllComments = () => {
    if (!confirm('آیا از حذف تمام نظرات مطمئن هستید؟ این عمل برگشت‌پذیر نیست.')) return
    try {
      persistAllComments([])
      // mark seeded so comments won't be reseeded automatically
      try { localStorage.setItem('qanari:comments-seeded','true') } catch (e) {}
      setComments([])
      setSelectedIds(new Set())
    } catch (e) {
      // ignore
    }
  }

  const resetSeeding = () => {
    if (!confirm('آیا می‌خواهید نمونه‌های پیش‌فرض را بازگردانید؟')) return
    try {
      localStorage.removeItem('qanari:comments-seeded')
      localStorage.removeItem('qanari:comments')
      router.reload()
    } catch (e) {
      // ignore
    }
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">مدیریت نظرات</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSeeding}
              className="px-3 py-2 border rounded hover:bg-gray-50"
            >
              بازگرداندن نمونه‌ها
            </button>
            <button
              onClick={clearAllComments}
              className="px-3 py-2 border rounded text-red-600 hover:bg-red-50"
            >
              حذف همه نظرات
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="جستجو در نام، متن نظر یا محصول..."
                  className="w-full px-3 py-2 border rounded"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </div>
              <div>
                <select 
                  className="px-3 py-2 border rounded"
                  value={filterProduct}
                  onChange={e => setFilterProduct(e.target.value)}
                >
                  <option value="">همه محصولات</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {getTranslatedProductText(p, lang).title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="px-3 py-2 border rounded"
                  value={filterRating}
                  onChange={e => setFilterRating(Number(e.target.value))}
                >
                  <option value="0">همه امتیازها</option>
                  {[5,4,3,2,1].map(r => (
                    <option key={r} value={r}>{r} ستاره</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredComments.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('name')}
                  >
                    نام کاربر
                    {sortField === 'name' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('rating')}
                  >
                    امتیاز
                    {sortField === 'rating' && (
                      <span className="mr-1">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-right">متن نظر</th>
                  <th className="px-4 py-3 text-right">محصول</th>
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
                {filteredComments.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={e => {
                          const next = new Set(selectedIds)
                          if (e.target.checked) {
                            next.add(c.id)
                          } else {
                            next.delete(c.id)
                          }
                          setSelectedIds(next)
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-yellow-500">
                        {('★'.repeat(c.rating) + '☆'.repeat(5-c.rating))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md truncate">{c.text}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.product ? (
                        <Link 
                          href={'/products/' + c.productId}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          {getTranslatedProductText(c.product, lang).title}
                        </Link>
                      ) : c.productId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return
                          deleteComment(c.id)
                          setComments(comments.filter(x => x.id !== c.id))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredComments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {comments.length === 0 ? 'هیچ نظری ثبت نشده است.' : 'نظری با این فیلترها یافت نشد.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedIds.size > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedIds.size} نظر انتخاب شده
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  حذف موارد انتخاب شده
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}