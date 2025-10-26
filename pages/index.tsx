import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import CategoryTile from '../components/CategoryTile'
import CategorySlider from '../components/CategorySlider'
import Link from 'next/link'
import { products as seedProducts } from '../data/products'
import { loadProducts } from '../lib/productStore'
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/language'
import { getTranslatedProductText } from '../lib/productI18n'
import { useRouter } from 'next/router'
import recommend from '../lib/recommend'
import { currentMember } from '../lib/members'
import { Product } from '../data/products'
export default function Home() {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const { add } = useCart()
  const [products, setProducts] = useState(seedProducts)
  const [visibleCount, setVisibleCount] = useState(6)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [personalRecommendations, setPersonalRecommendations] = useState<Product[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  // scroll helper: smooth-scroll to products area on client
  const scrollToProducts = () => {
    try {
      if (typeof window === 'undefined') return
      // slight timeout to allow layout to update after product list changes
      setTimeout(() => {
        try {
          const el = document.getElementById('products')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (e) {}
      }, 60)
    } catch (e) {}
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setIsAdmin(sessionStorage.getItem('qanari:admin') === 'true')
      } catch (e) {
        setIsAdmin(false)
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const all = loadProducts()
        // if a query is present in the URL, apply it (persisted search)
        const q = typeof router.query.q === 'string' ? router.query.q : ''
        if (q && q.trim()) {
          const qq = q.trim().toLowerCase()
          const filtered = all.filter((p) => {
            const tx = getTranslatedProductText(p, lang)
            return (
              (tx.title || '').toLowerCase().includes(qq) ||
              (tx.description || '').toLowerCase().includes(qq) ||
              (p.category || '').toLowerCase().includes(qq)
            )
          })
          setProducts(filtered)
          // scroll to results when a query is present
          scrollToProducts()
        } else {
          setProducts(all)
          // if navigated without query, ensure not to auto-scroll
        }
      } catch (e) {
        setProducts(seedProducts)
      }
    }
  }, [lang, router.query])

  useEffect(() => {
    try {
      const m = currentMember()
      if (m && m.email) {
        const rec = recommend.recommendByHistory(m.email, 6)
        setPersonalRecommendations(rec)
      }
    } catch (e) {}
  }, [])

  const handleSearch = (q?: string) => {
    try {
      const qq = (q || '').trim().toLowerCase()
      const all = loadProducts()
      if (!qq) {
        setProducts(all)
        router.push({ pathname: '/', query: {} }, undefined, { shallow: true })
        return
      }
      const filtered = all.filter((p) => {
        const tx = getTranslatedProductText(p, lang)
        return (
          (tx.title || '').toLowerCase().includes(qq) ||
          (tx.description || '').toLowerCase().includes(qq) ||
          (p.category || '').toLowerCase().includes(qq)
        )
      })
      setProducts(filtered)
      // scroll to show results
      scrollToProducts()
      router.push({ pathname: '/', query: { q: qq } }, undefined, { shallow: true })
    } catch (e) {
      // ignore
    }
  }

  // avoid reading sessionStorage during render — read member on client after mount
  const [member, setMember] = useState<any>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') setMember(currentMember())
    } catch (e) {
      setMember(null)
    }
  }, [])

  return (
    <>
      <Head>
        <title>{t('heroTitle')}</title>
      </Head>
      <Header />
      {/* admin hint removed */}
      <Hero />

      {/* Best Sellers section before categories */}
      <div className="container mt-10">
        <h2 className="text-xl font-semibold mb-4 animate-gradient-text">
          محصولات پر فروش
        </h2>
        {/* TODO: Replace with real best sellers logic if available */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.slice(0, 3).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* category tiles like the reference */}
      <div className="container mt-10">
        <h2 className="text-xl font-semibold mb-4 animate-gradient-underline">
          دسته‌بندی‌ها
        </h2>
        <CategorySlider />
      </div>

      <main id="products" className="container py-12 mt-12 hero-bottom-gap">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{t('productsTitle')}</h2>

          {/* Dropdown menu for categories */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              دسته بندی را انتخاب کنید
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => {
                const category = e.target.value
                setSelectedCategory(category)
                const filteredProducts = category
                  ? seedProducts.filter((p) => p.category === category)
                  : seedProducts
                setProducts(filteredProducts)
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-qanari focus:border-qanari sm:text-sm rounded-md"
            >
              <option value="">{t('allCategories')}</option>
              {[...new Set(seedProducts.map((p) => p.category))].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 && (
              <div className="text-center col-span-full text-muted">{t('noSearchResults')}</div>
            )}
            {products.slice(0, visibleCount).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {/* Load more button */}
          {products.length > visibleCount && (
            <div className="mt-6 flex justify-center">
              <button
                className="btn-cta"
                onClick={() => setVisibleCount((c) => Math.min(products.length, c + 6))}
              >
                {t('loadMore')}
              </button>
            </div>
          )}
        </section>

        {/* Blog section removed per user request */}

        {/* Recommendations section - new code starts here */}
        <section className="mb-8">
          {personalRecommendations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">پیشنهادهای برای شما</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personalRecommendations.map((p) => (
                  <div key={p.id} className="card border p-3">
                    <img src={p.images?.[0] ?? '/logo.png'} className="w-full h-32 object-cover mb-2" />
                    <div className="font-semibold">{getTranslatedProductText(p, lang).title}</div>
                    <div className="text-sm text-gray-600">{p.price.toLocaleString()} تومان</div>
                    <button onClick={() => add(p, 1)} className="btn-primary mt-2">{t('addToCart')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      {/* Points notification bottom right */}
      {member && member.email && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-white/90 rounded-lg shadow-lg px-4 py-3 border border-yellow-300 animate-fade-in">
          {getRoleBadge(member.role)}
          <div className="flex flex-col">
            <div className="text-sm text-yellow-600 font-semibold">{member.name ?? member.email}</div>
            {typeof member.commissionEarned === 'number' && (
              <div className="text-xs text-gray-700">امتیاز: {member.commissionEarned}</div>
            )}
            <div className="text-xs text-gray-700">رتبه: {member.role === 'admin' ? 'ادمین' : member.role === 'seller' ? 'فروشنده' : 'خریدار'}</div>
          </div>
        </div>
      )}
      <Footer />
    </>
  )
}

function SearchBar({
  placeholder,
  onSearch,
}: {
  placeholder?: string
  onSearch?: (q: string) => void
}) {
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch?.(q)
      }}
      className="mt-6 flex items-center justify-center gap-3"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full max-w-2xl px-4 py-3 rounded-l-lg border bg-white/5 focus:outline-none focus:ring-2 focus:ring-qanari"
      />
      <button
        type="submit"
        className="btn-cta focus:outline-none focus:ring-2 focus:ring-qanari"
        aria-label={t('searchButton')}
      >
        {t('searchButton')}
      </button>
    </form>
  )
}

function getRoleBadge(role: string | undefined) {
  if (role === 'admin') return <span className="badge-icon bg-yellow-400 border-2 border-yellow-600 mr-1 animate-pulse" title="ادمین" />
  if (role === 'seller') return <span className="badge-icon bg-gray-300 border-2 border-gray-400 mr-1 animate-pulse" title="فروشنده" />
  return <span className="badge-icon bg-yellow-700 border-2 border-yellow-900 mr-1 animate-pulse" title="خریدار" />
}

