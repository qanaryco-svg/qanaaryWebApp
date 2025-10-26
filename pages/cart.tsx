import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import Link from 'next/link'
import { useLanguage } from '../lib/language'
import { getTranslatedProductText } from '../lib/productI18n'

export default function CartPage() {
  const { items, remove, clear, updateQuantity } = useCart()

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const { t, lang } = useLanguage()

  return (
    <>
      <Header />
      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{t('cart')}</h1>

        {items.length === 0 ? (
          <p>{t('emptyCart')}</p>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.product.id} className="flex items-center justify-between border rounded p-4">
                <div className="flex items-center gap-4">
                  <img src={it.product.images[0]} alt={getTranslatedProductText(it.product, lang).title} className="w-20 h-20 object-cover" />
                  <div>
                    <div className="font-semibold">{getTranslatedProductText(it.product, lang).title}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      {t('itemsCount')}:
                      <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(it.product.id, it.quantity - 1)}>-</button>
                      <input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => updateQuantity(it.product.id, parseInt(e.target.value) || 0)}
                        className="w-12 text-center border rounded"
                      />
                      <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(it.product.id, it.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{(it.product.price * it.quantity).toLocaleString()} تومان</div>
                  <button className="text-red-500 text-sm mt-2" onClick={() => remove(it.product.id)}>{t('delete')}</button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <div className="font-bold text-lg">{t('cartTotal')}: {total.toLocaleString()} تومان</div>
                <div className="flex gap-3">
                <button className="px-4 py-2 border rounded" onClick={() => clear()}>{t('clearCart')}</button>
                <Link href="/checkout"><button className="px-4 py-2 bg-qanari text-qanariDark font-semibold rounded">{t('continueToCheckout')}</button></Link>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}
