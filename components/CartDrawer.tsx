import { useCart } from '../context/CartContext'
import Link from 'next/link'
import { useState } from 'react'

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQuantity, remove, clear } = useCart()
  const [loading, setLoading] = useState(false)

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative bg-white w-full max-w-sm h-full p-4 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">سبد خرید</h3>
          <button onClick={onClose} aria-label="بستن" className="px-2 py-1">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="py-8 text-center">سبد خرید خالی است</div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.product.id} className="flex items-center gap-3">
                <img src={it.product.images?.[0] ?? '/logo.png'} alt={it.product.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{it.product.title}</div>
                  <div className="text-sm text-gray-500">{it.product.price.toLocaleString()} تومان</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => updateQuantity(it.product.id, Math.max(0, it.quantity - 1))} className="px-2 border rounded">-</button>
                    <div className="px-3">{it.quantity}</div>
                    <button onClick={() => updateQuantity(it.product.id, it.quantity + 1)} className="px-2 border rounded">+</button>
                    <button onClick={() => remove(it.product.id)} className="ml-2 text-red-600" aria-label="حذف">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 3a3 3 0 0 1 6 0h3a1 1 0 1 1 0 2h-1v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5H6a1 1 0 1 1 0-2h3zm1 0a1 1 0 0 1 2 0h-2zm-3 6h10l-.7 10.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-1.99-1.9L7 9zm2 2v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0zm4 0v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-2 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">جمع</div>
                <div className="font-bold">{total.toLocaleString()} تومان</div>
              </div>
              <div className="flex gap-2">
                <Link href="/checkout" className="btn-cta flex-1 text-center py-2">پرداخت</Link>
                <button onClick={() => clear()} className="border px-3 py-2">پاک کردن</button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
