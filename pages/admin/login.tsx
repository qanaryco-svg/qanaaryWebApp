import { useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../components/admin/AdminLayout'
import { useNotify } from '../../context/NotificationContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const notify = useNotify()

  const onSubmit = (e: any) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setMsg('ایمیل و رمز عبور لازم است')
      return
    }
    // demo credential: admin@qanari / admin
    if (email === 'admin@qanari' && password === 'admin') {
      try {
        sessionStorage.setItem('qanari:admin', 'true')
      } catch (e) {
        // ignore
      }
      notify.push('ورود به پنل مدیریت موفق بود', { level: 'success' })
      router.push('/admin')
      return
    }
    setMsg('اطلاعات ورود صحیح نیست')
  }

  return (
    <AdminLayout>
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-semibold mb-4">ورود مدیریت</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ایمیل" className="w-full px-3 py-2 border rounded" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" className="w-full px-3 py-2 border rounded" />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-qanari text-qanariDark rounded">ورود</button>
          </div>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
          <div className="text-sm text-gray-600 mt-2">Demo: admin@qanari / admin</div>
        </form>
      </div>
    </AdminLayout>
  )
}
