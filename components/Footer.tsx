import { useEffect, useState } from 'react'
import { loadFooter, FooterSettings } from '../lib/footer'
import { useLanguage } from '../lib/language'

export default function Footer() {
  const [s, setS] = useState<FooterSettings | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    try {
      setS(loadFooter())
    } catch (e) {
      setS(null)
    }
  }, [])

  const address = s?.address || 'تهران، خیابان نمونه، پلاک ۱۲۳'
  const mapQuery = s?.mapQuery || '35.6892,51.3890'
  const phone = s?.phone || '+98 912 345 6789'
  const email = s?.email || 'info@qanari.example'
  const whatsapp = s?.whatsapp || '989123456789'
  const instagram = s?.instagram || 'qanari.shop'

  return (
    <footer className="border-t mt-8 py-8 bg-qanari">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
        <div>
          <div className="font-semibold mb-2">{t('shopName')}</div>
          <div>© {new Date().getFullYear()} {t('shopName')}</div>
          <div className="text-xs text-gray-500 mt-1">{t('allRightsReserved')}</div>
        </div>

        <div>
          <div className="font-semibold mb-2">{t('addressTitle')}</div>
          <div className="text-gray-600">{address}</div>
          <a
            className="text-sm text-qanari mt-1 inline-block"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
          >{t('viewOnMap')}</a>
        </div>

        <div>
          <div className="font-semibold mb-2">{t('contactTitle')}</div>
          <div className="flex flex-col gap-1">
            <a className="text-gray-700" href={`tel:${phone}`}>{t('phoneLabel')}: {phone}</a>
            <a className="text-gray-700" href={`mailto:${email}`}>{t('emailLabel')}: {email}</a>
            <a
              className="text-green-600"
              href={`https://wa.me/${whatsapp}?text=%D8%B3%D9%84%D8%A7%D9%85`}
              target="_blank"
              rel="noopener noreferrer"
            >{t('whatsappLabel')}: {phone}</a>
            <a
              className="text-pink-600"
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
            >{t('instagramLabel')}: @{instagram}</a>
          </div>
        </div>
      </div>

      <div className="container text-center text-sm text-gray-600 mt-6">
        {t('developedBy')}
      </div>
    </footer>
  )
}
