import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AdminBrandForm from '../../components/AdminBrandForm'

export default function AdminBranding() {
  const router = useRouter()

  useEffect(() => {
    const ok = sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
  }, [])

  return (
    <>
      <Header />
      <main className="container py-8">
        <h2 className="text-2xl font-bold mb-4">تنظیمات برند</h2>
        <AdminBrandForm onSaved={() => { /* noop */ }} />
      </main>
      <Footer />
    </>
  )
}
