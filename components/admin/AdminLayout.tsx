import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useNotify } from '../../context/NotificationContext'
import { loadProducts } from '../../lib/productStore'
import { getTranslatedProductText } from '../../lib/productI18n'
import { loadMembers } from '../../lib/members'
import { loadContents } from '../../lib/content'
import { useLanguage } from '../../lib/language'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ type: string; id: string; title: string }>>([])
  const searchRef = useRef<HTMLInputElement | null>(null)

  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return { push: (m: string) => {} }
    }
  })()

  const logout = () => {
    try {
      sessionStorage.removeItem('qanari:admin')
    } catch (e) {
      // ignore
    }
    notify.push('شما از پنل مدیریت خارج شدید', { level: 'success' })
    router.push('/')
  }
  const { t, lang, setLang } = useLanguage()

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([])
      return
    }
    const q = query.trim().toLowerCase()
    const out: Array<{ type: string; id: string; title: string }> = []
    try {
      const products = loadProducts()
      for (const p of products) {
        const txt = getTranslatedProductText(p, lang)
        if ((txt.title || '').toLowerCase().includes(q) || (txt.description || '').toLowerCase().includes(q)) {
          out.push({ type: 'product', id: p.id, title: txt.title || p.title })
        }
      }
    } catch (e) {}
    try {
      const members = loadMembers()
      for (const m of members) {
        if ((m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)) {
          out.push({ type: 'member', id: m.id, title: m.name || m.email })
        }
      }
    } catch (e) {}
    try {
      const contents = loadContents()
      for (const c of contents) {
        if (c.title.toLowerCase().includes(q) || (c.excerpt || '').toLowerCase().includes(q)) {
          out.push({ type: 'content', id: c.id, title: c.title })
        }
      }
    } catch (e) {}
    setResults(out.slice(0, 10))
  }, [query])
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-md p-4">
          <div className="mb-6 font-bold text-gray-900">{t('adminPanel')}</div>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/admin">{t('adminPanel')}</Link>
            <Link href="/admin/users">{t('users')}</Link>
            <Link href="/admin/comments">مدیریت نظرات</Link>
            <Link href="/admin/media">مدیریت فایل‌ها</Link>
            <Link href="/admin/header">هدر و برند</Link>
            <Link href="/admin/content">{t('content')}</Link>
            <Link href="/admin/footer">{t('footer')}</Link>
            <Link href="/admin/style-finder">Style Finder</Link>
            <Link href="/admin/orders">{t('orders')}</Link>
            <Link href="/admin/marketing">{t('marketing')}</Link>
            <Link href="/">{t('backToSite')}</Link>
          </nav>
          <div className="mt-6">
            <button onClick={() => setConfirmOpen(true)} className="w-full px-3 py-2 bg-red-50 text-red-600 border rounded text-sm">{t('logout')}</button>
          </div>
        </aside>
        <main className="flex-1 p-6 text-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => router.push('/admin/content')} className="px-3 py-2 border rounded text-sm">افزودن محتوا</button>
                <button onClick={() => { try { window.dispatchEvent(new CustomEvent('qanari:alerts-send')) } catch(e){} }} className="px-3 py-2 border rounded text-sm">ارسال اعلان</button>
              </div>

              <div className="ml-4 relative">
                <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو بین محصولات، کاربران، محتوا..." className="px-3 py-2 border rounded w-96 text-sm" />
                {results.length > 0 && (
                  <div className="absolute mt-1 bg-white border rounded shadow max-h-64 overflow-auto w-96 z-40">
                    {results.map((r) => (
                      <div key={`${r.type}:${r.id}`} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-right" onClick={() => {
                        setQuery('')
                        setResults([])
                        if (r.type === 'product') router.push(`/admin/manage`)
                        else if (r.type === 'member') router.push(`/admin/users`)
                        else if (r.type === 'content') router.push(`/admin/content`)
                      }}>
                        <div className="text-sm">{r.title}</div>
                        <div className="text-xs text-gray-500">{r.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="admin-lang" className="sr-only">زبان</label>
                <select id="admin-lang" value={lang} onChange={(e) => setLang(e.target.value as any)} className="border px-2 py-1 rounded text-sm">
                  <option value="fa">فارسی</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>

              <button className="px-3 py-2 border rounded" onClick={() => setConfirmOpen(true)}>خروج</button>
            </div>
          </div>

          {children}
        </main>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
              <div className="text-lg font-semibold mb-4">{t('confirmLogout')}</div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmOpen(false)} className="px-3 py-1 border rounded">{t('cancel')}</button>
              <button onClick={() => { setConfirmOpen(false); logout() }} className="px-3 py-1 bg-red-600 text-white rounded">{t('logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
