import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadBrand, saveBrand, resetBrand, BrandSettings } from '../../lib/brandStore'
import { useRouter } from 'next/router'
import { useNotify } from '../../context/NotificationContext'
import LogoUploader from '../../components/LogoUploader'

export default function AdminHeaderPage() {
  const router = useRouter()
  // start with defaults to keep server/client markup consistent, then hydrate on mount
  const [settings, setSettings] = useState<BrandSettings>({
    logo: null,
    primaryColor: '#0ea5a4',
    secondaryColor: '#334155',
    fontPersian: { name: 'IranSans' },
    fontLatin: { name: 'System' },
    language: 'fa',
  })
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
    setSettings(loadBrand())
  }, [])

  const onSave = () => {
    const ok = saveBrand(settings)
    if (ok) {
      setSettings(loadBrand())
      notify.push('تنظیمات هدر ذخیره شد', { level: 'success' })
    } else {
      notify.push('خطا در ذخیره تنظیمات هدر', { level: 'error' })
    }
  }

  const onReset = () => {
    try {
      resetBrand()
      setSettings(loadBrand())
      notify.push('تنظیمات هدر به حالت پیش‌فرض بازگشت', { level: 'success' })
    } catch (e) {
      notify.push('خطا در بازنشانی تنظیمات', { level: 'error' })
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">ویرایش هدر و برند</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">لوگو (آپلود)</label>
            <LogoUploader />
          </div>

          <div>
            <label className="block text-sm mb-1">رنگ اصلی (hex)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.primaryColor || ''} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} placeholder="#0ea5a4" />
          </div>

          <div>
            <label className="block text-sm mb-1">رنگ ثانویه (hex)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.secondaryColor || ''} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} placeholder="#334155" />
          </div>

          <div>
            <label className="block text-sm mb-1">فونت فارسی (نام)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.fontPersian?.name || ''} onChange={(e) => setSettings({ ...settings, fontPersian: { ...(settings.fontPersian || { name: '' }), name: e.target.value } })} placeholder="IranSans" />
          </div>

          <div>
            <label className="block text-sm mb-1">فونت لاتین (نام)</label>
            <input className="w-full border px-3 py-2 rounded" value={settings.fontLatin?.name || ''} onChange={(e) => setSettings({ ...settings, fontLatin: { ...(settings.fontLatin || { name: '' }), name: e.target.value } })} placeholder="System" />
          </div>

          <div className="flex gap-3">
            <button onClick={onSave} className="px-4 py-2 bg-qanari text-qanariDark rounded">ذخیره</button>
            <button onClick={onReset} className="px-4 py-2 border rounded">بازنشانی</button>
            <button onClick={() => router.push('/admin')} className="px-4 py-2 border rounded">بازگشت</button>
            <button onClick={() => router.push('/admin/categories')} className="px-4 py-2 bg-yellow-400 text-black rounded">سفارشی‌سازی دسته‌ها</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
