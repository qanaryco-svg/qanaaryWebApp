import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '../lib/language'
import { useRouter } from 'next/router'
import CartDrawer from './CartDrawer'
import LoginModal from './LoginModal'
import dynamic from 'next/dynamic'

const THEME_KEY = 'qanari:theme'

type Theme = 'light' | 'dark'

const StyleFinderModal = dynamic(() => import('./StyleFinder'), { ssr: false })

export default function Header() {
  const { count } = useCart()
  const router = useRouter()
  const { lang, setLang, t } = useLanguage()
  const [cartOpen, setCartOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const headerRef = useRef<HTMLElement | null>(null)
  const compactRef = useRef<HTMLDivElement | null>(null)
  const [showFinder, setShowFinder] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')

  // theme state persisted to localStorage and mirrored on <html>.classList
  const [theme, setTheme] = useState<Theme>('light')

  // read persisted theme on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_KEY) as Theme | null
        if (stored === 'dark' || stored === 'light') {
          setTheme(stored)
          document.documentElement.classList.toggle('dark', stored === 'dark')
        } else {
          // respect user preference if available
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          setTheme(prefersDark ? 'dark' : 'light')
          document.documentElement.classList.toggle('dark', prefersDark)
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [])

  // react to external theme changes (other tabs)
  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === THEME_KEY && (ev.newValue === 'dark' || ev.newValue === 'light')) {
        const next = ev.newValue as Theme
        setTheme(next)
        try { document.documentElement.classList.toggle('dark', next === 'dark') } catch (e) {}
      }
    }
    try {
      window.addEventListener('storage', onStorage)
    } catch (e) {}
    return () => {
      try { window.removeEventListener('storage', onStorage) } catch (e) {}
    }
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem(THEME_KEY, next) } catch (e) {}
    try { document.documentElement.classList.toggle('dark', next === 'dark') } catch (e) {}
  }

  // hide/show header on scroll (existing behavior)
  useEffect(() => {
    const onScroll = () => {
      if (typeof window === 'undefined') return
      const y = window.scrollY || 0
      const delta = y - (lastY.current || 0)
      if (delta > 10) setHidden(true)
      else if (delta < -10) setHidden(false)
      lastY.current = y
    }
    try { window.addEventListener('scroll', onScroll, { passive: true }) } catch (e) {}
    return () => { try { window.removeEventListener('scroll', onScroll) } catch (e) {} }
  }, [])

  // update spacer height so content below doesn't get hidden by sticky header / compact bar
  useEffect(() => {
    function updateSpacer() {
      try {
        const headerH = headerRef.current ? Math.ceil(headerRef.current.getBoundingClientRect().height) : 0
        const compactH = compactRef.current ? Math.ceil(compactRef.current.getBoundingClientRect().height) : 0
        const base = hidden ? compactH : headerH
  const SAFETY_BUFFER = 36 // extra px to prevent hover-lift / shadow overlap
        const desired = Math.max(0, base + SAFETY_BUFFER)
        // expose a CSS var for layout/fallback so pure-CSS can use it when JS runs late or is disabled
        try { document.documentElement.style.setProperty('--site-header-offset', `${desired}px`) } catch (e) {}
      } catch (e) {}
    }
    // initial and on resize; also after window load and a short timeout so images/layout settle
    updateSpacer()
    try { window.addEventListener('resize', updateSpacer) } catch (e) {}
    try { window.addEventListener('load', () => { setTimeout(updateSpacer, 80) }) } catch (e) {}
    // also run a micro timeout in case load already fired
    setTimeout(updateSpacer, 120)
    return () => { try { window.removeEventListener('resize', updateSpacer) } catch (e) {} }
  }, [hidden])

  return (
    <>
      {/* Main header (hides on scroll down) */}
      <header ref={headerRef as any} className={`glass header-glass sticky top-0 z-50 will-change-transform transform-gpu transition-all duration-300 ease-in-out ${hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="qanari" className="h-10 w-auto header-logo" />
            </Link>
            {/* promo removed per user request */}
          </div>

          <div className="flex-1 flex items-center justify-center mx-8">
            {/* Desktop search: visible on md+ */}
            <div className="hidden md:flex w-full max-w-2xl">
              <form onSubmit={(e)=>{ e.preventDefault(); const el = (e.target as HTMLFormElement).querySelector('input[name=q]') as HTMLInputElement | null; if (el) { try { router.push({ pathname: '/', query: { q: el.value } }, undefined, { shallow: true }) } catch (err) { router.push(`/?q=${encodeURIComponent(el.value)}`) } } }} className="w-full flex">
                <div className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-lg w-full">
                  <input name="q" placeholder="جستجو در محصولات..." className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400" />
                  <button type="submit" className="btn-cta mx-1 px-5 py-2">جستجو</button>
                </div>
              </form>
            </div>
            {/* Mobile: small search icon (toggles overlay) */}
            <button aria-label="باز کردن جستجو" onClick={() => setMobileSearchOpen(true)} className="md:hidden ml-2 p-2 rounded-full hover:bg-white/6 transition">
              <span aria-hidden className="text-xl">🔍</span>
            </button>
          </div>

          <nav className="text-sm text-gray-700 flex items-center gap-4">
              <Link href="/" className="relative nav-link flex items-center gap-2 text-xs md:text-sm transition-all">
                <span className="md:hidden mobile-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1V11.5z"/></svg>
                </span>
                <span className="hidden md:inline">{t('home')}</span>
              </Link>
              <Link href="/membership" className="relative nav-link flex items-center gap-2 text-xs md:text-sm transition-all">
                <span className="md:hidden mobile-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 20a6 6 0 0 1 12 0"/></svg>
                </span>
                <span className="hidden md:inline">{t('membership')}</span>
              </Link>
              <button onClick={()=>setCartOpen(true)} className="relative nav-link flex items-center gap-2 text-xs md:text-sm transition-all">
                <span className="md:hidden mobile-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h15l-1.5 9h-11L6 6zM9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
                </span>
                <span className="hidden md:inline">{t('cart')}</span>
                {count > 0 && (
                  <span className="absolute -left-3 -top-3 bg-red-500 text-white text-xs rounded-full px-2 cart-badge">{count}</span>
                )}
              </button>
              <button onClick={() => setShowFinder(true)} className="relative nav-link px-2 py-1 border rounded text-xs md:text-sm transition-all hidden md:inline-flex">استایل‌فایندر</button>
              {/* small-screen stylefinder icon */}
              <button onClick={() => setShowFinder(true)} className="relative nav-link md:hidden px-2 py-1 rounded transition" aria-label="استایل‌یاب">
                <svg viewBox="0 0 24 24" className="icon-svg mobile-icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M3 12h18"/></svg>
              </button>
            {/* fallback link removed; StyleFinder is available via modal button */}

            <div className="flex items-center gap-2">
              <label htmlFor="lang" className="sr-only">{t('language') ?? 'language'}</label>
                <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as any)} className="relative nav-link border px-2 py-1 rounded text-xs md:text-sm hover:border-[var(--accent)] transition-all">
                <option value="fa">فارسی</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>

              <button onClick={toggleTheme} aria-label={theme === 'dark' ? t('switchToLight') ?? 'Switch to light' : t('switchToDark') ?? 'Switch to dark'} className="relative nav-link theme-toggle px-2 py-1 rounded border text-xs md:text-sm hover:border-[var(--accent)] transition-all">
                <span aria-hidden className="theme-emoji">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
          </nav>
        </div>
      </header>

      {showFinder && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl relative z-[10000] max-h-[90vh] overflow-auto p-4">
            <StyleFinderModal onClose={() => setShowFinder(false)} />
          </div>
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} />
      <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} />
      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay" role="dialog" aria-modal="true">
          <div className="mobile-search-box">
            <form onSubmit={(e)=>{ e.preventDefault(); try { setMobileSearchOpen(false); router.push(`/?q=${encodeURIComponent(mobileQuery)}`) } catch (err) { setMobileSearchOpen(false); } }} className="flex items-center w-full">
              <input name="mobile-q" value={mobileQuery} onChange={(e)=>setMobileQuery(e.target.value)} placeholder="جستجو در محصولات..." aria-label="جستجو" />
              <button type="submit" className="btn-cta px-4 py-2">جستجو</button>
            </form>
            <button className="mobile-search-close" aria-label="بستن" onClick={()=>setMobileSearchOpen(false)}>✖</button>
          </div>
        </div>
      )}
    </>
  )
}
