import { useState } from 'react'

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [user, setUser] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white p-6 rounded shadow max-w-md w-full z-70">
        <h3 className="text-lg font-semibold mb-3">ورود یا ثبت‌نام</h3>
        <label className="block text-sm">شماره موبایل یا ایمیل</label>
        <input value={user} onChange={(e) => setUser(e.target.value)} className="w-full border px-3 py-2 mt-2 rounded" />
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border">انصراف</button>
          <button onClick={onClose} className="btn-cta">ورود</button>
        </div>
      </div>
    </div>
  )
}
