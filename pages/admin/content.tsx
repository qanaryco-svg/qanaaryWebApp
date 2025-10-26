import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadProducts, addProduct, updateProduct, deleteProduct, resetProducts } from '../../lib/productStore'
import { Product } from '../../data/products'
import { getTranslatedProductText } from '../../lib/productI18n'
import AdminProductForm from '../../components/AdminProductForm'
import { useRouter } from 'next/router'
import { useLanguage } from '../../lib/language'

export default function AdminContentPage() {
  const [list, setList] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({})
  const [category, setCategory] = useState('همه')
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'pending'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const pageSize = 12
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
    setList(loadProducts())
  }, [])

  // When editing is set, scroll the editor into view and focus the first input for accessibility
  useEffect(() => {
    if (!editing) return
    try {
      const el = editorRef.current
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      // focus the first input inside the editor after a short delay to allow scroll
      setTimeout(() => {
        try {
          const firstInput = el?.querySelector('input, textarea, select') as HTMLElement | null
          firstInput?.focus()
        } catch (e) {
          // ignore
        }
      }, 300)
    } catch (e) {
      // ignore
    }
  }, [editing])

  useEffect(() => {
    try {
      const { getStats } = require('../../lib/commentsStore')
      const map: Record<string, { avg: number; count: number }> = {}
      list.forEach((p) => {
        map[p.id] = getStats(p.id)
      })
      setRatings(map)
    } catch (e) {
      setRatings({})
    }
  }, [list])

  const { t, lang } = ((): any => {
    try {
      const u = require('../../lib/language').useLanguage()
      return u
    } catch (e) {
      return { t: (k: string) => k, lang: 'fa' }
    }
  })()

  const categories = useMemo(() => Array.from(new Set(['همه', ...list.map((p) => getTranslatedProductText(p, lang).category)])), [list, lang])

  const filtered = useMemo(() => {
    let out = [...list]
    if (filter) {
      const s = filter.toLowerCase()
      out = out.filter(p => getTranslatedProductText(p, lang).title.toLowerCase().includes(s) || getTranslatedProductText(p, lang).description.toLowerCase().includes(s) || p.id.toLowerCase().includes(s))
    }
    if (category !== 'همه') out = out.filter(p => getTranslatedProductText(p, lang).category === category)
    // statusFilter placeholder — products don't have status yet
    return out
  }, [list, filter, category, statusFilter, lang])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

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
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">پنل محتوا</h2>
          <div className="flex items-center gap-2">
            <input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} placeholder="جستجو عنوان، متن یا شناسه" className="px-3 py-2 border rounded w-60" />
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} className="px-3 py-2 border rounded">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setEditing({ id: '', title: '', price: 0, images: [''], description: '', category: '' })}>افزودن مطلب</button>
            <button className="px-3 py-2 border rounded" onClick={() => { if (confirm('بازنشانی محصولات به حالت اولیه انجام شود؟')) { resetProducts(); setList(loadProducts()) } }}>بازنشانی</button>
            <button className="px-3 py-2 border rounded" onClick={logout}>خروج</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">کل محصولات</div>
            <div className="text-2xl font-bold mt-1">{list.length}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">محصولات نمایش داده شده</div>
            <div className="text-2xl font-bold mt-1">{filtered.length}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">نظرات (کل)</div>
            <div className="text-2xl font-bold mt-1">{Object.values(ratings).reduce((s, r) => s + (r.count || 0), 0)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">میانگین امتیاز</div>
            <div className="text-2xl font-bold mt-1">{(Object.values(ratings).reduce((s, r) => s + (r.avg || 0), 0) / (Object.values(ratings).length || 1)).toFixed(1)}</div>
          </div>
        </div>

        <div className="bg-white rounded shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">وضعیت:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-2 py-1 border rounded">
                <option value="all">همه</option>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
                <option value="pending">در انتظار</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <>
                  <button className="px-3 py-2 border rounded text-red-600" onClick={() => { if (!confirm(`آیا از حذف ${selected.size} مورد اطمینان دارید؟`)) return; selected.forEach(id => { try { deleteProduct(id) } catch (e) {} }); setSelected(new Set()); setList(loadProducts()) }}>حذف {selected.size}</button>
                  <button className="px-3 py-2 border rounded" onClick={() => { setSelected(new Set()) }}>لغو انتخاب</button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right"><input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={(e) => { if (e.target.checked) setSelected(new Set(filtered.map(p => p.id))); else setSelected(new Set()) }} /></th>
                  <th className="px-4 py-3 text-right">تصویر</th>
                  <th className="px-4 py-3 text-right">عنوان</th>
                  <th className="px-4 py-3 text-right">قیمت</th>
                  <th className="px-4 py-3 text-right">دسته</th>
                  <th className="px-4 py-3 text-right">نظرات</th>
                  <th className="px-4 py-3 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={(e) => { const nxt = new Set(selected); if (e.target.checked) nxt.add(p.id); else nxt.delete(p.id); setSelected(nxt) }} /></td>
                    <td className="px-4 py-3"><img src={p.images?.[0] || '/logo.png'} className="w-16 h-16 object-cover rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{getTranslatedProductText(p, lang).title}</div>
                      <div className="text-xs text-gray-500">{p.id}</div>
                    </td>
                    <td className="px-4 py-3">{p.price.toLocaleString()} تومان</td>
                    <td className="px-4 py-3">{getTranslatedProductText(p, lang).category}</td>
                    <td className="px-4 py-3">{ratings[p.id]?.count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={`/products/${p.id}`} target="_blank" rel="noreferrer" className="text-blue-600">نمایش</a>
                        <button onClick={() => setEditing(p)} className="text-green-600">ویرایش</button>
                        <button onClick={() => { if (!confirm('آیا حذف شود؟')) return; onDelete(p.id); setList(loadProducts()) }} className="text-red-600">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">موردی یافت نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">نمایش {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} از {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">قبلی</button>
              <div className="px-3 py-1 border rounded">{page} / {pages}</div>
              <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">بعدی</button>
            </div>
          </div>
        </div>

        {editing && (
          <div ref={editorRef} className="bg-white rounded shadow p-6">
            <h3 className="text-xl font-semibold mb-4">{editing.id ? 'ویرایش محصول' : 'افزودن محصول'}</h3>
            <AdminProductForm product={editing} onCancel={() => setEditing(null)} onSave={(p) => { editing && editing.id ? onUpdate(p) : onAdd(p); setList(loadProducts()) }} />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// Uploads UI removed — uploads are now managed inside AdminProductForm

function HeaderSettings() {
  const [title, setTitle] = useState('')
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const t = localStorage.getItem('qanari:heroTitle')
      const i = localStorage.getItem('qanari:heroImage')
      if (t) setTitle(t)
      if (i) setImage(i)
    } catch (e) {
      // ignore
    }
  }, [])

  const handleFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const d = String(reader.result || '')
      setImage(d)
    }
    reader.readAsDataURL(f)
  }

  const save = () => {
    try {
      if (image) localStorage.setItem('qanari:heroImage', image)
      localStorage.setItem('qanari:heroTitle', title)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:hero-update'))
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm">عنوان هدر</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="px-2 py-1 border rounded" />
      <label className="text-sm">عکس هدر (آپلود)</label>
      <input type="file" accept="image/*,image/jpeg,image/jpg" onChange={(e) => handleFile(e.target.files)} />
      {image && <img src={image} className="w-48 h-24 object-cover mt-2 rounded" />}
      <div className="mt-2">
        <button className="px-3 py-1 border rounded" onClick={save}>ذخیره تنظیمات هدر</button>
      </div>
    </div>
  )
}
