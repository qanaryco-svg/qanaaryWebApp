import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { loadCategories } from '../../lib/categoryStore'
import { loadProducts } from '../../lib/productStore'
import type { Category } from '../../data/categories'
import type { Product } from '../../data/products'
import Link from 'next/link'

export default function CategoryPage() {
  const router = useRouter()
  const { id } = router.query
  const [cat, setCat] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    try {
      setLoading(true)
      const cats = loadCategories()
      const found = (cats || []).find((c) => c.id === id)
      if (!found) {
        setCat(null)
        setProducts([])
        setLoading(false)
        return
      }
      setCat(found)
      if (found.archived) {
        setProducts([])
        setLoading(false)
        return
      }
      const all = loadProducts()
      const filtered = all.filter((p) => (p.category || '').trim() === (found.id || '').trim())
      setProducts(filtered)
    } catch (e) {
      setCat(null)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [id])

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center">در حال بارگذاری...</div>

  return (
    <>
      <Header />
      <main className="container py-8">
        {!cat ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-right">
            <div className="font-semibold mb-2">دسته‌بندی پیدا نشد</div>
            <div className="text-sm text-gray-600">دسته‌ای با این شناسه وجود ندارد یا ممکن است حذف شده باشد.</div>
            <div className="mt-3">
              <Link href="/categories" className="text-sm text-blue-600">بازگشت به دسته‌ها</Link>
            </div>
          </div>
        ) : cat.archived ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-right">
            <div className="font-semibold mb-2">دسته‌ی انتخاب‌شده در حالت آرشیو قرار دارد</div>
            <div className="text-sm text-gray-600">برای مشاهده محصولات، ابتدا دسته را از پنل مدیریت فعال کنید یا دسته‌ی دیگری انتخاب نمایید.</div>
            <div className="mt-3">
              <Link href="/categories" className="text-sm text-blue-600">بازگشت به دسته‌ها</Link>
            </div>
          </div>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{cat.label}</h1>
                <div className="text-sm text-gray-600">{products.length} محصول</div>
              </div>
              <div>
                <Link href="/categories" className="text-sm text-blue-600">بازگشت به دسته‌ها</Link>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center text-gray-600">هیچ محصولی برای این دسته وجود ندارد.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
