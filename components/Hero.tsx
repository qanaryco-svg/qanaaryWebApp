import Link from 'next/link'
import { useEffect, useState } from 'react'

const SLIDES = ['/R.jpg', '/p1.svg', '/p2.svg', '/p3.svg']

export default function Hero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)
  const next = () => setIndex((i) => (i + 1) % SLIDES.length)

  return (
    <section className="hero-full relative overflow-hidden min-h-[260px] sm:min-h-[300px] md:min-h-[64vh]">
  {/* Smooth gradient background behind grid */}
  <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-r from-[rgba(251, 255, 12, 0.95)] via-[rgba(217, 245, 60, 0.89)] to-[rgba(255,255,255,0.98)]" />
      {/* layout: left panel | center slideshow | right panel */}
  <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[minmax(0,22%)_1fr]">
        {/* left panel */}
        <div className="hidden md:flex items-center justify-center z-20">
          <div className="flex flex-col items-center justify-center text-center px-4 py-6 bg-qanari text-white h-full w-full">
            <div className="text-sm uppercase tracking-widest mb-2">Qanary</div>
            <div className="text-2xl font-light mb-4">Women's wear</div>
            <button
              onClick={() => {
                try {
                  const el = typeof document !== 'undefined' ? document.getElementById('products') : null
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else if (typeof window !== 'undefined') {
                    // fallback: navigate to anchor
                    window.location.href = '/#products'
                  }
                } catch (e) {
                  /* ignore */
                }
              }}
              className="mt-2 inline-block bg-white text-black rounded-full px-6 py-3 text-sm font-medium"
            >
              Shop now
            </button>
          </div>
        </div>

        {/* center slideshow */}
  <div className="relative overflow-hidden h-[220px] sm:h-[300px] md:h-auto">
          {/* soft blur overlay at the boundary to visually blend the left panel and slideshow */}
          <div className="pointer-events-none hidden md:block absolute left-[22%] top-0 bottom-0 w-16 -translate-x-1/2" aria-hidden>
            <div className="w-full h-full" style={{background: 'linear-gradient(90deg, rgba(212,125,166,0.20), rgba(212,125,166,0.06) 40%, rgba(255,255,255,0.0) 85%)', backdropFilter: 'blur(8px)'}} />
          </div>
          {SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`hero-${i}`}
              className={`absolute left-0 top-0 w-full h-full object-cover transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      </div>

      {/* framed border: outer + inner to create double-rectangle effect */}
      {/* framed border: outer + inner to create double-rectangle effect
          make frames essentially flush on the smallest screens to remove spacing below hero */}
      <div className="absolute inset-0 sm:inset-1 md:inset-8 pointer-events-none z-30">
        <div className="w-full h-full border border-white/80 rounded-sm" />
      </div>
      <div className="absolute inset-1 sm:inset-3 md:inset-12 pointer-events-none z-30">
        <div className="w-full h-full border border-white/60 rounded-sm" />
      </div>

      {/* right caption removed - promo moved into header */}

      {/* navigation arrows (clickable) */}
        <button onClick={prev} aria-label="previous" className="flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-40 w-8 md:w-10 h-8 md:h-12 rounded-l-md text-lg md:text-2xl text-gray-800 dark:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
        ‹
      </button>
        <button onClick={next} aria-label="next" className="flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-2 md:right-4 z-40 w-8 md:w-10 h-8 md:h-12 rounded-r-md text-lg md:text-2xl text-gray-800 dark:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
        ›
      </button>

      {/* decorative blurred lights */}
      <div className="hero-glow hero-glow-left hidden sm:block" aria-hidden />
      <div className="hero-glow hero-glow-right hidden sm:block" aria-hidden />
    </section>
  )
}
