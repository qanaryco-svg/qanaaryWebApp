import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import MediaLibrary from '../../components/MediaLibrary'

export default function AdminMedia() {
  const router = useRouter()

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
  }, [])

  return (
    <>
      <Header />
      <main className="container py-8">
        <h2 className="text-2xl font-bold mb-4">کتابخانه رسانه</h2>
        <MediaLibrary />
      </main>
      <Footer />
    </>
  )
}
