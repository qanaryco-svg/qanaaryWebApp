import Link from 'next/link'
import { Product } from '../data/products'
import { getTranslatedProductText } from '../lib/productI18n'
import { useLanguage } from '../lib/language'
import { useCart } from '../context/CartContext'

export default function ProductCard({ p }: { p: Product }) {
  const { lang } = useLanguage()
  const { add } = useCart()
  const tx = getTranslatedProductText(p, lang)
  // Calculate discounted price
  const discountValue = typeof p.discount === 'number' ? p.discount : 0;
  const hasDiscount = discountValue > 0;
  const discountedPrice = hasDiscount ? Math.round(p.price * (1 - discountValue / 100)) : p.price;
  return (
    <div className="card border p-4 hover:shadow-lg transition relative">
      <Link href={`/products/${p.id}`}>
        <div className="relative">
          <img src={p.images?.[0] ?? '/logo.png'} alt={tx.title} className="w-full h-56 object-cover mb-3 rounded" />
          {hasDiscount && (
            <div className="absolute top-2 left-6 animate-discount-badge" style={{zIndex:2}}>
              <span className="discount-badge-circle">
                {p.discount}%
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{tx.title}</h3>
          <div className="text-sm text-gray-500">{p.category}</div>
        </div>
        <div className="text-right">
          {hasDiscount ? (
            <>
              <div className="font-bold text-qanariDark">
                {discountedPrice.toLocaleString()} تومان
              </div>
              <div className="text-xs text-gray-400 line-through">
                {p.price.toLocaleString()} تومان
              </div>
            </>
          ) : (
            <div className="font-bold text-qanariDark">{p.price.toLocaleString()} تومان</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {/* Advanced size and color options */}
        <div className="flex gap-2 items-center mb-2">
          <label className="text-sm text-gray-600">سایز:</label>
          {p.category === 'کفش' ? (
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
        <div className="flex gap-2">
          <button onClick={() => add(p, 1)} className="btn-primary">افزودن</button>
          <Link href={`/products/${p.id}`} className="px-3 py-2 border rounded text-sm text-qanariDark">مشاهده</Link>
        </div>
      </div>
    </div>
  )
}
