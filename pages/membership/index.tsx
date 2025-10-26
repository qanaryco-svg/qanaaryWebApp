import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { currentMember, logout } from '../../lib/members'
// lazy imports for utility functions
import * as membersLib from '../../lib/members'
import { useNotify } from '../../context/NotificationContext'
import { products } from '../../data/products'
import { getTranslatedProductText } from '../../lib/productI18n'
import { useLanguage } from '../../lib/language'
import { useRouter } from 'next/router'

export default function MembershipPage() {
  const router = useRouter()
  const [member, setMember] = useState<any>(null)

  useEffect(() => {
    const m = currentMember()
    setMember(m)
    // ensure existing member has a referralCode (for older accounts)
    try {
      if (m && !m.referralCode) {
        const code = membersLib.generateReferralCode(m.email)
        const updated = { ...m, referralCode: code }
        // persist updated member
        membersLib.updateMember(updated)
        setMember(updated)
      }
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

  const handleLogout = () => {
    logout()
    setMember(null)
    router.push('/')
  }

  const { lang } = useLanguage()
  const { t } = useLanguage()

  const suggestBySize = (size?: string) => {
    if (!size) return []
    // naive: look for 'کفش' in title or category (translated)
    return products.filter((p) => {
      const txt = getTranslatedProductText(p, lang)
      return (txt.title || '').includes('کفش') || (txt.category || '').includes('کفش')
    })
  }

  const shoes = suggestBySize(member?.footSize)

  return (
    <>
      <Header />
      <main className="container py-12">
          {!member ? (
            <div>
              <h2 className="text-2xl font-semibold mb-4">{t('membership')}</h2>
              <p className="mb-4">{t('membershipPrompt')}</p>
              <div className="flex gap-3">
                <a href="/membership/login" className="px-4 py-2 bg-qanari text-qanariDark rounded">{t('login')}</a>
                <a href="/membership/register" className="px-4 py-2 border rounded">{t('register')}</a>
              </div>
            </div>
          ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('welcome')}, {member.name}</h2>
            {member.referralCode && (
              <div className="mb-4 p-4 border rounded bg-white">
                <div className="font-semibold">{t('referralCodeLabel')}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="px-3 py-2 border rounded bg-gray-50 font-mono">{member.referralCode}</div>
                  <button
                    className="px-3 py-2 border rounded text-sm"
                    onClick={() => {
                      try {
                        const link = `${window.location.origin}/membership/register?ref=${member.referralCode}`
                        navigator.clipboard.writeText(link)
                        notify.push(t('copySuccess'), { level: 'success' })
                      } catch (e) {
                        notify.push(t('copyFail'), { level: 'error' })
                      }
                    }}
                  >
                    {t('copyInvite')}
                  </button>
                  <a className="px-3 py-2 bg-green-600 text-white rounded text-sm" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent('برای ثبت‌نام از این لینک استفاده کن: ' + (typeof window !== 'undefined' ? `${window.location.origin}/membership/register?ref=${member.referralCode}` : ''))}`}>
                    {t('sendWhatsapp')}
                  </a>
                </div>
              </div>
            )}
            <p className="mb-4">{t('yourSize')}: {member.footSize || t('notSet')}</p>

            <section className="mb-6">
              <h3 className="font-semibold mb-2">{t('suggestBySizeTitle')}</h3>
              {shoes.length === 0 ? (
                <div className="text-sm text-gray-600">{t('noShoesFound')}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shoes.map((s) => (
                    <div key={s.id} className="border p-3">
                      <img src={s.images[0]} alt={getTranslatedProductText(s, lang).title} className="w-full h-40 object-cover mb-2" />
                      <div className="font-semibold">{getTranslatedProductText(s, lang).title}</div>
                      <div className="text-sm text-gray-600">{s.price.toLocaleString()} تومان</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded" onClick={handleLogout}>{t('logout')}</button>
              <a className="px-4 py-2 bg-qanari text-qanariDark rounded" href="/membership/register">{t('editProfile')}</a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
