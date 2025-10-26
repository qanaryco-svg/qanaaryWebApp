import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { registerMember, findMemberByEmail, currentMember, updateMember } from '../../lib/members'
import { useNotify } from '../../context/NotificationContext'
import { useLanguage } from '../../lib/language'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [footSize, setFootSize] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [extra, setExtra] = useState('')
  const [msg, setMsg] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [referral, setReferral] = useState('')

  useEffect(() => {
    // if already logged in, prefill form for editing
    const cm = currentMember()
    if (cm) {
      setName(cm.name || '')
      setEmail(cm.email || '')
      setPassword(cm.password || '')
      setFootSize(cm.footSize || '')
      setAge(cm.age || '')
      setCity(cm.city || '')
      setExtra(cm.extra || '')
      setOriginalEmail(cm.email || '')
    }
    // read referral code from query (if any)
    try {
      const qp = new URLSearchParams(window.location.search)
      const r = qp.get('ref')
      if (r) setReferral(r)
    } catch (e) {
      // ignore
    }
  }, [])
  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return { push: (m: string) => {} }
    }
  })()
  const { t } = useLanguage()

  const onSubmit = (e: any) => {
    e.preventDefault()
    const existing = findMemberByEmail(email)
    const cm = currentMember()
    if (cm) {
      // editing own profile (even if email changed)
      const member = { id: cm.id || existing?.id || String(Date.now()), name, email, password, footSize, age, city, extra }
      const ok = updateMember(member)
      if (ok) {
        notify.push('اطلاعات پروفایل به‌روزرسانی شد', { level: 'success' })
        router.push('/membership')
      } else {
        notify.push('بروز خطا در به‌روزرسانی پروفایل', { level: 'error' })
      }
      return
    }
    if (existing) {
      setMsg('این ایمیل قبلا ثبت شده')
      return
    }
  const member = { id: String(Date.now()), name, email, password, footSize, age, city, extra } as any
    // attach referral data if present
    try {
      if (referral) {
        // find referrer and link by referralCode
        const members = require('../../lib/members')
        const list = members.loadMembers()
        const ref = list.find((m: any) => m.referralCode === referral || m.id === referral)
        if (ref) {
          ;(member as any).referrerId = ref.id
        }
      }
    } catch (e) {
      // ignore
    }
    // generate a referral code for this member for future invites
    try {
      const members = require('../../lib/members')
  ;(member as any).referralCode = members.generateReferralCode(email)
    } catch (e) {
      // ignore
    }
    registerMember(member)
    notify.push('ثبت‌نام با موفقیت انجام شد', { level: 'success' })
    router.push('/membership')
  }

  return (
    <>
      <Header />
      <main className="container py-12">
        <h2 className="text-2xl font-semibold mb-4">{t('registerTitle')}</h2>
        <form onSubmit={onSubmit} className="max-w-lg">
          <div className="mb-3">
            <label className="block text-sm mb-1">{t('fullName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">{t('emailPlaceholder')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">{t('passwordPlaceholder')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" required />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">{t('footSizeLabel')}</label>
            <input value={footSize} onChange={(e) => setFootSize(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder={t('exampleSize')} />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">{t('ageLabel')}</label>
            <input value={age} onChange={(e) => setAge(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder={t('exampleAge')} />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">{t('cityLabel')}</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder={t('exampleCity')} />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">{t('extraInfoLabel')}</label>
            <textarea value={extra} onChange={(e) => setExtra(e.target.value)} className="w-full border px-3 py-2 rounded" rows={4} />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">{t('referralLabel')}</label>
            <input value={referral} onChange={(e) => setReferral(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder={t('referralLabel')} />
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-qanari text-qanariDark rounded font-semibold" type="submit">{t('registerAndLogin')}</button>
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.push('/')}>{t('back')}</button>
          </div>
          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
        </form>
      </main>
      <Footer />
    </>
  )
}
