import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'
import { useEffect, useState } from 'react'
import { Product } from '../../data/products'
import { findProduct } from '../../lib/productStore'
import ProductComments from '../../components/ProductComments'
import { useLanguage } from '../../lib/language'
import { getTranslatedProductText } from '../../lib/productI18n'
import dynamic from 'next/dynamic'

const TryOnSimple = dynamic(() => import('../../components/TryOnSimple'), { ssr: false })

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState<Product | undefined>()

  const { add } = useCart()
  const [stats, setStats] = useState<{ avg: number; count: number } | null>(null)
  const [showTryOn, setShowTryOn] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = () => {
      const p = findProduct(String(id))
      setProduct(p)
    }
    load()
    // respond to product list updates so deletions/edits reflect here
    const onUpdate = () => {
      load()
    }
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'qanari:products') onUpdate()
    }
    window.addEventListener('qanari:products-updated', onUpdate)
    window.addEventListener('storage', onStorage)
    let bc: BroadcastChannel | undefined
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('qanari:products')
        bc.onmessage = () => onUpdate()
      }
    } catch (e) {
      // ignore
    }
    // stats will be provided/updated by ProductComments via onStatsChange
    return () => {
      window.removeEventListener('qanari:products-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
      try {
        if (bc) bc.close()
      } catch (e) {
        // ignore
      }
    }
  }, [id])

  const { t, lang } = useLanguage()

  if (!product) {
    return (
      <>
        <Header />
        <main className="container py-8">{t('productNotFound')}</main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Gallery images={product.images} title={getTranslatedProductText(product, lang).title} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold mb-2">{getTranslatedProductText(product, lang).title}</h1>
              {stats && stats.count > 0 && (
                <div className="text-sm bg-white/90 px-2 py-1 rounded shadow">
                  <span className="font-semibold">{stats.avg.toFixed(1)}</span>
                  <span className="text-yellow-500"> ★</span>
                  <span className="text-gray-500"> ({stats.count})</span>
                </div>
              )}
            </div>
            <p className="text-lg text-gray-700 mb-4">{product.price.toLocaleString()} تومان</p>
            <p className="text-gray-600">{getTranslatedProductText(product, lang).description}</p>
            <div className="mt-4 flex flex-col gap-2">
              {/* Advanced size and color selectors */}
              <div className="flex gap-2 items-center mb-2">
                <label className="text-sm text-gray-600">سایز:</label>
                {product.category === 'کفش' ? (
                  <select className="border rounded px-2 py-1 text-sm">
                    <option value="">انتخاب کنید</option>
                    {[...Array(10)].map((_, i) => {
                      const size = 36 + i;
                      return <option key={size} value={size}>{size}</option>;
                    })}
                  </select>
                ) : (
                  <select className="border rounded px-2 py-1 text-sm">
                    <option value="">انتخاب کنید</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                )}
              </div>
              <div className="flex gap-2 items-center mb-2">
                <label className="text-sm text-gray-600">رنگ:</label>
                <select className="border rounded px-2 py-1 text-sm">
                  <option value="">انتخاب کنید</option>
                  <option value="قرمز">قرمز</option>
                  <option value="آبی">آبی</option>
                  <option value="زرد">زرد</option>
                  <option value="سبز">سبز</option>
                  <option value="مشکی">مشکی</option>
                  <option value="سفید">سفید</option>
                </select>
              </div>
              <button className="px-4 py-2 bg-qanari text-qanariDark rounded font-semibold mr-2" onClick={() => add(product, 1)}>{t('addToCart')}</button>
            </div>
          </div>
        </div>
      
  <ProductComments productId={product.id} onStatsChange={(s) => setStats(s)} />
      </main>
      <Footer />
      {showTryOn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <TryOnSimple overlayUrl={product.images?.[0]} />
            <div className="mt-2 text-right">
              <button className="px-3 py-1 border rounded" onClick={() => setShowTryOn(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Gallery({ images, title }: { images: string[]; title?: string }) {
  const [main, setMain] = useState<string | null>(images && images.length > 0 ? images[0] : null)
  const { t } = useLanguage()

  useEffect(() => {
    setMain(images && images.length > 0 ? images[0] : null)
  }, [images])

  const isVideo = (src: string) => src.startsWith('data:video') || src.endsWith('.mp4') || src.includes('video')

  return (
    <div>
      <div className="w-full h-96 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
        {main ? (
          isVideo(main) ? (
            <video src={main} controls className="w-full h-full object-contain" />
          ) : (
            <img src={main} alt={title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="text-gray-500">{t('noImage')}</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {images.map((src, idx) => (
          <button key={idx} onClick={() => setMain(src)} className="border rounded overflow-hidden">
            {isVideo(src) ? (
              <video src={src} className="w-full h-20 object-cover" />
            ) : (
              <img src={src} className="w-full h-20 object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
