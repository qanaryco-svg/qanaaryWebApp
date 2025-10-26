import React, { useState, useEffect, useMemo } from 'react'
import { defaultCategories, Category } from '../../data/categories'
import { useNotify } from '../../context/NotificationContext'

const STORAGE_KEY = 'qanari:categories-order'

export default function AdminCategoryOrder() {
  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return { push: (m: string) => {} }
    }
  })()

  // start with defaults on server and client to avoid hydration mismatches
  const [categories, setCategories] = useState<Category[]>(defaultCategories)

  // hydrate saved order from localStorage on client mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const ids: string[] = JSON.parse(raw)
        const byId = Object.fromEntries(defaultCategories.map((c) => [c.id, c]))
        const ordered = ids.map((id) => byId[id]).filter(Boolean)
        for (const c of defaultCategories) if (!ids.includes(c.id)) ordered.push(c)
        setCategories(ordered)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // keep original order to detect changes
  const originalIds = useMemo(() => defaultCategories.map((c) => c.id), [])

  useEffect(() => {
    // nothing here but keep for future hooks
  }, [])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= categories.length) return
    const updated = [...categories]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    setCategories(updated)
  }

  // drag state for HTML5 drag-n-drop
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, i: number) => {
    setDragIndex(i)
    try {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(i))
    } catch (err) {}
  }

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    const from = dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData('text/plain'))
    if (!Number.isNaN(from)) move(from, i)
    setDragIndex(null)
  }

  const handleDragEnd = () => setDragIndex(null)

  const save = () => {
    try {
      const ids = categories.map((c) => c.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
      notify.push('ترتیب دسته‌بندی‌ها ذخیره شد', { level: 'success' })
    } catch (e) {
      notify.push('خطا در ذخیره‌سازی', { level: 'error' })
    }
  }

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setCategories(defaultCategories)
      notify.push('ترتیب به حالت پیش‌فرض بازگشت', { level: 'success' })
    } catch (e) {
      notify.push('خطا در بازنشانی', { level: 'error' })
    }
  }

  const isDirty = useMemo(() => {
    const ids = categories.map((c) => c.id)
    const savedRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!savedRaw) return JSON.stringify(ids) !== JSON.stringify(originalIds)
    try {
      const saved = JSON.parse(savedRaw || '[]')
      return JSON.stringify(saved) !== JSON.stringify(ids)
    } catch (e) {
      return true
    }
  }, [categories, originalIds])

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">ترتیب دسته‌بندی‌ها</h2>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-1 border rounded text-sm">بازنشانی</button>
          <button onClick={save} disabled={!isDirty} className={`px-3 py-1 rounded text-sm ${isDirty ? 'bg-qanari text-qanariDark' : 'bg-gray-100 text-gray-400'}`}>
            ذخیره
          </button>
        </div>
      </div>

      <ul className="divide-y">
        {categories.map((cat, i) => (
          <li
            key={cat.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-between py-3 transition-colors ${dragIndex === i ? 'bg-gray-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                <img src={cat.image} alt={cat.label} className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-medium">{cat.label}</div>
                <div className="text-xs text-gray-500">{cat.id}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => move(i, i - 1)} disabled={i === 0} className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100" aria-label="move up">▲</button>
              <button onClick={() => move(i, i + 1)} disabled={i === categories.length - 1} className="px-2 py-1 bg-gray-50 border rounded hover:bg-gray-100" aria-label="move down">▼</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
