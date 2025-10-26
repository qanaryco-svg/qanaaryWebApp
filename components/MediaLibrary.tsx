import React, { useEffect, useRef, useState } from 'react'
import { UploadItem, addUpload, loadUploads, deleteUpload, updateUpload } from '../lib/uploads'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('failed to read file'))
    r.readAsDataURL(file)
  })
}

export default function MediaLibrary() {
  const [list, setList] = useState<UploadItem[]>([])
  const [query, setQuery] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [editing, setEditing] = useState<UploadItem | null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)

  const reload = () => setList(loadUploads())

  useEffect(() => {
    reload()
  }, [])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await readFileAsDataUrl(f)
    const isFont = /\.(woff2?|ttf|otf)$/i.test(f.name) || f.type.startsWith('font')
    const item: UploadItem = {
      id: `u_${Date.now()}`,
      type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : isFont ? 'font' : 'image',
      name: f.name,
      dataUrl,
      galleryId: null,
      createdAt: Date.now(),
    }
    addUpload(item)
    reload()
    if (fileRef.current) fileRef.current.value = ''
  }

  const onDelete = (id: string) => {
    if (!confirm('آیا از حذف مطمئن هستید؟')) return
    deleteUpload(id)
    reload()
  }

  const startEdit = (it: UploadItem) => {
    setEditing(it)
    setEditDraft({ name: it.name, category: (it as any).category || '' })
  }

  const applyEdit = () => {
    if (!editing) return
    updateUpload({ id: editing.id, name: editDraft.name, ...(editDraft.category ? { category: editDraft.category } : {}) })
    setEditing(null)
    setEditDraft(null)
    reload()
  }

  const filtered = list.filter((l) => (query ? l.name.toLowerCase().includes(query.toLowerCase()) : true))

  // ensure @font-face rules are present for font uploads so we can preview them
  useEffect(() => {
    for (const u of list) {
      if (u.type !== 'font') continue
      const ruleId = `font-face-${u.id}`
      if (document.getElementById(ruleId)) continue
      try {
        const style = document.createElement('style')
        style.id = ruleId
        const fontFamily = `qanari-font-${u.id}`
        style.innerHTML = `@font-face { font-family: '${fontFamily}'; src: url('${u.dataUrl}'); }`;
        document.head.appendChild(style)
      } catch (e) {
        // ignore
      }
    }
    return () => {
      // cleanup removed fonts (if any were deleted while component mounted)
      const existing = Array.from(document.querySelectorAll('style[id^="font-face-"]'))
      for (const s of existing) {
        const id = s.id
        const found = list.find((l) => `font-face-${l.id}` === id)
        if (!found) s.remove()
      }
    }
  }, [list])

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <input ref={fileRef} type="file" accept="image/*,video/*,.woff,.ttf,.otf" onChange={onFile} />
        <input placeholder="جستجو" value={query} onChange={(e) => setQuery(e.target.value)} className="px-2 py-1 border rounded" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map((u) => (
          <div key={u.id} className="border p-2 rounded text-right">
            {u.type === 'image' ? (
              <img src={u.dataUrl} alt={u.name} className="h-32 w-full object-contain mb-2" />
            ) : u.type === 'video' ? (
              <video src={u.dataUrl} className="h-32 w-full mb-2" controls />
            ) : (
              <div className="h-32 w-full mb-2 flex items-center justify-center bg-gray-50">
                <div style={{ fontFamily: `qanari-font-${u.id}` }} className="text-center">
                  <div className="text-sm">نمونه فونت</div>
                  <div className="text-xs text-gray-600">{u.name}</div>
                </div>
              </div>
            )}
            <div className="text-sm font-medium">{u.name}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => startEdit(u)} className="px-2 py-1 border rounded text-sm">ویرایش</button>
              <button onClick={() => onDelete(u.id)} className="px-2 py-1 border rounded text-sm text-red-600">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow max-w-md w-full text-right">
            <h3 className="text-lg font-semibold mb-2">ویرایش رسانه</h3>
            <div className="mb-2">
              <label className="block text-sm mb-1">نام</label>
              <input value={editDraft?.name || ''} className="w-full border px-2 py-1" onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="block text-sm mb-1">گروه/دسته</label>
              <input value={editDraft?.category || ''} className="w-full border px-2 py-1" onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">انصراف</button>
              <button onClick={() => applyEdit()} className="px-3 py-1 bg-green-500 text-white rounded">ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
