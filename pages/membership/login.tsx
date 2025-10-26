import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useLanguage } from '../../lib/language'
import { login } from '../../lib/members'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const onSubmit = (e: any) => {
    e.preventDefault()
    const m = login(email, password)
    if (m) {
      router.push('/membership')
    } else {
      setMsg(t('loginError'))
    }
  }

  const { t } = useLanguage()

  return (
    <>
      <Header />
      <main className="container py-12">
        <h2 className="text-2xl font-semibold mb-4">{t('loginTitle')}</h2>
        <form onSubmit={onSubmit} className="max-w-md">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="w-full p-3 border rounded mb-2" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className="w-full p-3 border rounded mb-2" />
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-qanari text-qanariDark rounded">{t('login')}</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.push('/membership/register')}>{t('register')}</button>
          </div>
          {msg && <div className="mt-2 text-sm text-red-600">{msg}</div>}
        </form>
      </main>
      <Footer />
    </>
  )
}
