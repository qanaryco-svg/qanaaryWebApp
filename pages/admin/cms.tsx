import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminContentForm from '../../components/AdminContentForm'
import { loadContents, addContent, updateContent, deleteContent, listCategories, seedIfEmpty } from '../../lib/content'
import { ContentItem } from '../../lib/content'
// simple id generator to avoid extra dependency
function genId() {
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function AdminCMS() {
  const [list, setList] = useState<ContentItem[]>([])
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [category, setCategory] = useState('همه')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'pending'>('all')

  useEffect(() => {
    seedIfEmpty()
    setList(loadContents())
  }, [])

  const categories = ['همه', ...list.map((c) => c.category || '').filter(Boolean)]

  const onAdd = (c: ContentItem) => {
    const item: ContentItem = { ...c, id: genId(), createdAt: Date.now() }
    addContent(item)
    setList(loadContents())
    setEditing(null)
  }

  const onUpdate = (c: ContentItem) => {
    updateContent(c)
    setList(loadContents())
    setEditing(null)
  }

  const onDelete = (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید حذف کنید؟')) return
    deleteContent(id)
    setList(loadContents())
  }

  const filtered = list.filter((c) => (category === 'همه' ? true : c.category === category) && (statusFilter === 'all' ? true : c.status === statusFilter))

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">مدیریت محتوا (CMS)</h1>
        <div className="mb-4 flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setEditing({ id: '', title: '', excerpt: '', body: '', type: 'article', media: [], category: '', tags: [], status: 'draft', createdAt: Date.now() })}>افزودن محتوا</button>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-1 border rounded">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-2 py-1 border rounded">
            <option value="all">همه</option>
            <option value="published">منتشر شده</option>
            <option value="draft">پیش‌نویس</option>
            <option value="pending">در انتظار تأیید</option>
          </select>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminContentForm item={editing} onSave={(c) => (editing && editing.id ? onUpdate(c) : onAdd(c))} onCancel={() => setEditing(null)} />
            <div>
              <h3 className="font-semibold mb-2">پیش‌نمایش</h3>
              <div className="p-4 border rounded">
                <h2 className="font-bold">{editing.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: editing.body || '' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-gray-600">{c.category} • {c.tags?.join(', ')} • {c.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => setEditing(c)}>ویرایش</button>
                    <button className="px-2 py-1 border rounded text-red-600" onClick={() => onDelete(c.id)}>حذف</button>
                  </div>
                </div>
                <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: c.excerpt || (c.body || '').slice(0, 200) }} />
                {c.media && c.media.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {c.media.map((m) => (
                      <div key={m} className="w-24 h-24 overflow-hidden rounded">
                        {c.type === 'image' ? <img src={m} alt={c.title} className="w-full h-full object-cover" /> : <video src={m} className="w-full h-full object-cover" controls />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
