import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadStyleFinderConfig, saveStyleFinderConfig, StyleFinderConfig } from '../../lib/styleFinder'
import { useLanguage } from '../../lib/language'

export default function AdminStyleFinderPage() {
  const { t } = useLanguage()
  const [cfg, setCfg] = useState<StyleFinderConfig>({})

  useEffect(() => {
    setCfg(loadStyleFinderConfig())
  }, [])

  const updateMap = (key: keyof StyleFinderConfig, mapStr: string) => {
    try {
      const parsed = JSON.parse(mapStr)
      const next = { ...cfg, [key]: parsed }
      setCfg(next)
    } catch (e) {
      // ignore parse errors
      alert('JSON نامعتبر است. لطفاً یک شی یا مپ معتبر وارد کنید.')
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 max-w-3xl">
        <h2 className="text-xl font-semibold">تنظیمات Style Finder</h2>
        <p className="mt-2 text-sm text-gray-600">در این صفحه نگاشت‌ها را برای سوالات Style Finder مدیریت کنید. از فرمت JSON استفاده کنید.</p>

        <div className="mt-4">
          <label className="block font-medium">occasionMap (مثال: {'{"party":["پیراهن","اکسسوری"]}'})</label>
          <textarea className="w-full h-40 p-2 border rounded mt-1" defaultValue={JSON.stringify(cfg.occasionMap || {}, null, 2)} onBlur={(e) => updateMap('occasionMap', e.currentTarget.value)} />
        </div>

        <div className="mt-4">
          <label className="block font-medium">colorMap (مثال: {'{"red":["قرمز","زرشکی"]}'})</label>
          <textarea className="w-full h-40 p-2 border rounded mt-1" defaultValue={JSON.stringify(cfg.colorMap || {}, null, 2)} onBlur={(e) => updateMap('colorMap', e.currentTarget.value)} />
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-qanari text-white rounded" onClick={() => { saveStyleFinderConfig(cfg); alert('ذخیره شد') }}>ذخیره</button>
          <button className="px-4 py-2 border rounded" onClick={() => setCfg(loadStyleFinderConfig())}>بارگذاری</button>
        </div>
      </div>
    </AdminLayout>
  )
}
