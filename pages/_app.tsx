import '../styles/globals.css'
import 'quill/dist/quill.snow.css'
import type { AppProps } from 'next/app'
import { CartProvider } from '../context/CartContext'
import { NotificationProvider } from '../context/NotificationContext'
import { useEffect } from 'react'
import { incrementView, setUsers } from '../lib/metrics'
import { loadMembers } from '../lib/members'
import { LanguageProvider } from '../lib/language'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const Chatbot = dynamic(() => import('../components/Chatbot'), { ssr: false })

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // client-only metrics updates
    try {
      incrementView()
      const members = loadMembers()
      setUsers(members.length)
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <NotificationProvider>
      <CartProvider>
        <LanguageProvider>
          <Head>
            <meta name="description" content="فروشگاه آنلاین لباس زنانه قناری - انتخاب‌های متنوع، قیمت‌های رقابتی و ارسال سریع." />
            <meta name="keywords" content="لباس زنانه, کفش زنانه, مد روز, خرید آنلاین لباس" />
            <meta name="author" content="فروشگاه قناری" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </Head>
          <Component {...pageProps} />
          <Chatbot />
        </LanguageProvider>
      </CartProvider>
    </NotificationProvider>
  )
}
