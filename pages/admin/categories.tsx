import { useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminCategoryOrder from '../../components/admin/AdminCategoryOrder'
import { useRouter } from 'next/router'

export default function AdminCategories() {
  const router = useRouter()

  useEffect(() => {
    const ok = typeof window !== 'undefined' && sessionStorage.getItem('qanari:admin') === 'true'
    if (!ok) router.push('/admin/login')
  }, [])

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">سفارشی‌سازی دسته‌ها</h1>
        <AdminCategoryOrder />
      </div>
    </AdminLayout>
  )
}
