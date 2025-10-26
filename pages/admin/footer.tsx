import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadFooter, saveFooter, FooterSettings } from '../../lib/footer'
import { useRouter } from 'next/router'
import { useNotify } from '../../context/NotificationContext'

export default function AdminFooterPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<FooterSettings>({})
  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return { push: (m: string) => {} }
    }
  })()

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
    setSettings(loadFooter())
  }, [])

  const onSave = () => {
    console.log('Saving footer settings', settings)
    const ok = saveFooter(settings)
    if (ok) {
      // reload from storage to ensure consistency
      setSettings(loadFooter())
      notify.push('تنظیمات فوتر ذخیره شد', { level: 'success' })
    } else {
      notify.push('خطا در ذخیره تنظیمات فوتر', { level: 'error' })
    }
  }

  const onReset = () => {
    try {
      localStorage.removeItem('qanari:footer')
      setSettings(loadFooter())
      notify.push('تنظیمات فوتر به حالت پیش‌فرض بازگشت', { level: 'success' })
    } catch (e) {
      notify.push('خطا در بازنشانی تنظیمات', { level: 'error' })
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">ویرایش فوتر سایت</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">آدرس (نمایش)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">جستجوی نقشه (برای لینک)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.mapQuery || ''} onChange={(e) => setSettings({ ...settings, mapQuery: e.target.value })} placeholder="مثال: 35.6892,51.3890" />
          </div>
          <div>
            <label className="block text-sm mb-1">تلفن</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+98 912 345 6789" />
          </div>
          <div>
            <label className="block text-sm mb-1">ایمیل</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">واتساپ (شماره بین‌المللی)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.whatsapp || ''} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="989123456789" />
          </div>
          <div>
            <label className="block text-sm mb-1">اینستاگرام (handle)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.instagram || ''} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} placeholder="qanari.shop" />
          </div>

          <div className="flex gap-3">
            <button onClick={onSave} className="px-4 py-2 bg-qanari text-qanariDark rounded">ذخیره</button>
            <button onClick={onReset} className="px-4 py-2 border rounded">بازنشانی</button>
            <button onClick={() => router.push('/admin')} className="px-4 py-2 border rounded">بازگشت</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
