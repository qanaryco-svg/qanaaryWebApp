import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { defaultCategories } from '../data/categories'
import { products as seedProducts } from '../data/products'

// Merge defaultCategories with any categories discovered in the product seed data.
// We key categories by their label (Persian name) because product.category stores the label.
const categories = (function buildCategories() {
  const map = new Map<string, { id: string; label: string; image: string; href: string }>()
  // add defaults keyed by label
  for (const c of defaultCategories) map.set(c.label, c)
  // add categories from products if missing: use first product image as thumbnail fallback
  for (const p of seedProducts) {
    const label = p.category || 'سایر'
    if (!map.has(label)) {
      map.set(label, {
        id: 'cat_' + label.replace(/\s+/g, '_'),
        label,
        image: (p.images && p.images[0]) || '/logo.png',
        href: `/search?cat=${encodeURIComponent(label)}`,
      })
    }
  }
  return Array.from(map.values())
})()

export default function CategorySlider() {
  const [index, setIndex] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % categories.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setIsAdmin(sessionStorage.getItem('qanari:admin') === 'true')
      }
    } catch (e) {
      setIsAdmin(false)
    }
  }, [])

  const prev = () => setIndex((i) => (i - 1 + categories.length) % categories.length)
  const next = () => setIndex((i) => (i + 1) % categories.length)

  return (
    <div id="carouselBasicExample" className="carousel slide carousel-fade relative" role="region" aria-roledescription="carousel">
      {/* Admin customize button - only visible to logged-in admin in sessionStorage */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-40">
          <a href="/admin/manage" title="سفارشی‌سازی دسته‌ها" className="inline-flex items-center gap-2 bg-yellow-400 text-black px-3 py-1 rounded shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M11.3 1.046a1 1 0 00-2.6 0l-.2.86a7.002 7.002 0 00-1.716.75l-.76-.45a1 1 0 00-1.116 1.664l.7.413a6.96 6.96 0 000 1.5l-.7.413a1 1 0 001.116 1.664l.76-.45c.52.336 1.08.603 1.716.75l.2.86a1 1 0 002.6 0l.2-.86c.636-.147 1.196-.414 1.716-.75l.76.45a1 1 0 001.116-1.664l-.7-.413a6.96 6.96 0 000-1.5l.7-.413A1 1 0 0016.6 2.12l-.76.45a7.002 7.002 0 00-1.716-.75l-.2-.86z" />
            </svg>
            <span className="text-sm">سفارشی‌سازی</span>
          </a>
        </div>
      )}
      {/* Indicators */}
      <div className="carousel-indicators absolute left-1/2 transform -translate-x-1/2 bottom-4 z-20 flex gap-2">
        {categories.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>

      {/* Inner: fixed height so absolute slides can overlap instead of stacking */}
      <div className="carousel-inner relative overflow-hidden h-48 sm:h-56 md:h-64 lg:h-72">
        {categories.map((cat, i) => (
          <div
            key={cat.label}
            className={`carousel-item absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-10'}`}
          >
            <Link href={cat.href} className="block w-full h-full">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${cat.image}')` }} />
              <div className="absolute left-0 right-0 bottom-4 text-center">
                <h5 className="font-semibold text-lg text-white/90 drop-shadow">{cat.label}</h5>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button
        className="carousel-control-prev absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 rounded-full shadow px-2 py-1 text-2xl"
        onClick={prev}
        aria-label="قبلی"
      >
        <span aria-hidden>‹</span>
      </button>
      <button
        className="carousel-control-next absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 rounded-full shadow px-2 py-1 text-2xl"
        onClick={next}
        aria-label="بعدی"
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  )
}
