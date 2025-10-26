import React, { useEffect, useRef, useState } from 'react'
import { BrandSettings, FontInfo, loadBrand, saveBrand } from '../lib/brandStore'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('failed to read file'))
    r.readAsDataURL(file)
  })
}

export default function AdminBrandForm({ onSaved }: { onSaved?: () => void }) {
  // use defaults first (same on server and client) then hydrate from localStorage on mount
  const [settings, setSettings] = useState<BrandSettings>({
    logo: null,
    primaryColor: '#0ea5a4',
    secondaryColor: '#334155',
    fontPersian: { name: 'IranSans' },
    fontLatin: { name: 'System' },
    language: 'fa',
  })
  const logoRef = useRef<HTMLInputElement | null>(null)
  const persianFontRef = useRef<HTMLInputElement | null>(null)
  const latinFontRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setSettings(loadBrand())
  }, [])

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await readFileAsDataUrl(f)
    setSettings((s) => ({ ...s, logo: dataUrl }))
  }

  const clearLogo = () => {
    setSettings((s) => ({ ...s, logo: null }))
    if (logoRef.current) logoRef.current.value = ''
  }

  const onUploadFont = async (e: React.ChangeEvent<HTMLInputElement>, which: 'fa' | 'en') => {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await readFileAsDataUrl(f)
    const info: FontInfo = { name: f.name, dataUrl }
    setSettings((s) => (which === 'fa' ? { ...s, fontPersian: info } : { ...s, fontLatin: info }))
  }

  const onSave = () => {
    saveBrand(settings)
    if (onSaved) onSaved()
    alert('تنظیمات ذخیره شد')
  }

  const onReset = () => {
    const d = loadBrand()
    setSettings(d)
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-xl font-semibold mb-3">تنظیمات برند</h3>

      <div className="mb-4 text-right">
        <label className="block text-sm mb-1">لوگو</label>
        <div className="flex items-center gap-2">
          <input ref={logoRef} type="file" accept="image/*" onChange={onLogo} />
          <button onClick={clearLogo} className="px-3 py-1 border rounded">حذف</button>
        </div>
        {settings.logo && <img src={settings.logo} alt="logo" className="mt-2 h-16 object-contain" />}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-right">
          <label className="block text-sm mb-1">رنگ اصلی</label>
          <input value={settings.primaryColor || ''} onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))} type="color" />
        </div>
        <div className="text-right">
          <label className="block text-sm mb-1">رنگ ثانویه</label>
          <input value={settings.secondaryColor || ''} onChange={(e) => setSettings((s) => ({ ...s, secondaryColor: e.target.value }))} type="color" />
        </div>
      </div>

      <div className="mb-4 text-right">
        <label className="block text-sm mb-1">زبان پیش‌فرض</label>
        <select value={settings.language} onChange={(e) => setSettings((s) => ({ ...s, language: e.target.value as any }))} className="px-2 py-1 border rounded">
          <option value="fa">فارسی</option>
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
        </select>
      </div>

      <div className="mb-4 text-right">
        <label className="block text-sm mb-1">فونت فارسی (آپلود .woff/.ttf)</label>
        <input ref={persianFontRef} type="file" accept=".woff,.woff2,.ttf,.otf" onChange={(e) => onUploadFont(e, 'fa')} />
        <div className="mt-2 text-sm text-gray-600">{settings.fontPersian?.name || 'ندارد'}</div>
      </div>

      <div className="mb-4 text-right">
        <label className="block text-sm mb-1">فونت لاتین (آپلود .woff/.ttf)</label>
        <input ref={latinFontRef} type="file" accept=".woff,.woff2,.ttf,.otf" onChange={(e) => onUploadFont(e, 'en')} />
        <div className="mt-2 text-sm text-gray-600">{settings.fontLatin?.name || 'ندارد'}</div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onReset} className="px-3 py-2 border rounded">بازنشانی</button>
        <button onClick={onSave} className="px-3 py-2 bg-green-500 text-white rounded">ذخیره</button>
      </div>
    </div>
  )
}
