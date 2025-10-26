import React, { useState, useEffect } from 'react'
import { useLanguage } from '../lib/language'
import { ContentItem } from '../lib/content'

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function AdminContentForm({ item, onSave, onCancel }: { item: ContentItem; onSave: (c: ContentItem) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item.title || '')
  const [slug, setSlug] = useState((item as any).slug || '')
  const [excerpt, setExcerpt] = useState(item.excerpt || '')
  const [body, setBody] = useState(item.body || '')
  const [type, setType] = useState<ContentItem['type']>(item.type || 'article')
  const [media, setMedia] = useState<string[]>(item.media || [])
  const [category, setCategory] = useState(item.category || '')
  const [tags, setTags] = useState<string[]>(item.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<ContentItem['status']>(item.status || 'draft')

  const { t } = useLanguage()

  // When the parent provides a new item (e.g., clicking edit), sync internal state
  useEffect(() => {
    setTitle(item.title || '')
    setSlug((item as any).slug || '')
    setExcerpt(item.excerpt || '')
    setBody(item.body || '')
    setType(item.type || 'article')
    setMedia(item.media || [])
    setCategory(item.category || '')
    setTags(item.tags || [])
    setTagInput('')
    setStatus(item.status || 'draft')
  }, [item])

  useEffect(() => {
    if (!slug) setSlug(slugify(title))
  }, [title])

  const onFile = (files: FileList | null) => {
    if (!files) return
    const f = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const d = String(reader.result || '')
      setMedia(prev => [d, ...prev])
    }
    reader.readAsDataURL(f)
  }

  const removeMedia = (i: number) => setMedia(prev => prev.filter((_, idx) => idx !== i))

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (v: string) => setTags(prev => prev.filter(t => t !== v))

  const save = () => {
    const saved: ContentItem = {
      ...item,
      title,
      excerpt,
      body,
      type,
      media,
      category,
      tags,
      status,
      updatedAt: Date.now(),
      createdAt: item.createdAt || Date.now(),
    }
    ;(saved as any).slug = slug
    onSave(saved)
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="mb-2">
            <label className="text-sm">{t('titleLabel')}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2 py-1 border rounded" />
          </div>

          <div className="mb-2 flex gap-2">
            <div className="flex-1">
              <label className="text-sm">اسلاگ (برای آدرس)</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-2 py-1 border rounded" />
            </div>
            <div>
              <label className="text-sm">وضعیت</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-2 py-1 border rounded">
                <option value="published">{t('statusPublished')}</option>
                <option value="draft">{t('statusDraft')}</option>
                <option value="pending">{t('statusPending')}</option>
              </select>
            </div>
          </div>

          <div className="mb-2">
            <label className="text-sm">{t('excerptLabel')}</label>
            <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full px-2 py-1 border rounded" />
          </div>

          <div className="mb-2">
            <label className="text-sm">{t('contentLabel')}</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-2 py-1 border rounded" />
          </div>
        </div>

        <div>
          <div className="mb-2">
            <label className="text-sm">{t('mediaLabel')}</label>
            <input type="file" accept="image/*,video/*" onChange={(e) => onFile(e.target.files)} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {media.map((m, i) => (
                <div key={i} className="relative">
                  <img src={m} className="w-full h-24 object-cover rounded" />
                  <button onClick={() => removeMedia(i)} className="absolute top-1 left-1 bg-white/80 rounded px-1 text-sm">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <label className="text-sm">{t('categoryLabel')}</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2 py-1 border rounded" />
          </div>

          <div className="mb-2">
            <label className="text-sm">{t('tagsLabel')}</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="flex-1 px-2 py-1 border rounded" placeholder="tag1, tag2" />
              <button onClick={addTag} className="px-3 py-1 border rounded">افزودن</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map(tg => (
                <div key={tg} className="px-2 py-1 bg-gray-100 rounded-full flex items-center gap-2">
                  <span className="text-sm">{tg}</span>
                  <button onClick={() => removeTag(tg)} className="text-xs">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 border rounded bg-blue-600 text-white" onClick={save}>{t('save')}</button>
        <button className="px-3 py-1 border rounded" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </div>
  )
}
