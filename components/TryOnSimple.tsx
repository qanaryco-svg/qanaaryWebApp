import React, { useState, useRef } from 'react'

export default function TryOnSimple({ overlayUrl }: { overlayUrl?: string }) {
  const [img, setImg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setImg(String(reader.result))
    reader.readAsDataURL(f)
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded shadow">
      <div className="mb-3">
        <button className="px-3 py-2 border rounded mr-2" onClick={() => inputRef.current?.click()}>آپلود عکس</button>
        <input ref={inputRef as any} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {img ? (
          <img src={img} alt="user" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">هیچ تصویری آپلود نشده است</div>
        )}
        {overlayUrl && (
          <img src={overlayUrl} alt="overlay" className="absolute left-1/2 top-1/4 w-48 transform -translate-x-1/2 opacity-80 pointer-events-none" />
        )}
      </div>
    </div>
  )
}
