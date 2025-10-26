import React, { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'qanari:heroImage'

export default function LogoUploader() {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v) setPreview(v)
    } catch (e) {
      // ignore
    }
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      try {
        localStorage.setItem(STORAGE_KEY, result)
        setPreview(result)
        // notify other parts of the app
        window.dispatchEvent(new Event('qanari:hero-update'))
      } catch (err) {
        console.error('failed to save hero image', err)
      }
    }
    reader.readAsDataURL(f)
  }

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPreview(null)
    window.dispatchEvent(new Event('qanari:hero-update'))
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="mt-3 text-sm text-right">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <span className="px-3 py-2 border rounded bg-white">آپلود عکس قهرمان</span>
      </label>
      <button onClick={clear} className="mr-2 px-3 py-2 border rounded text-sm">بازنشانی</button>
      {preview && (
        <div className="mt-2 flex items-center gap-2">
          <img src={preview} alt="پیش‌نمایش" className="h-12 w-auto object-contain border" />
        </div>
      )}
    </div>
  )
}
