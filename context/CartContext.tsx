import React, { createContext, useContext, useEffect, useState } from 'react'
import { Product } from '../data/products'
import { useNotify, Notify } from './NotificationContext'
import gamification from '../lib/gamification'
import { currentMember } from '../lib/members'

type CartItem = {
  product: Product
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  count: number
  add: (p: Product, qty?: number) => void
  updateQuantity: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  let notify: Notify | undefined
  try {
    // useNotify throws if provider missing; we only call if available
    notify = useNotify()
  } catch (_) {
    notify = undefined
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('qanari_cart')
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('qanari_cart', JSON.stringify(items))
  }, [items])

  const add = (product: Product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id)
      if (found) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      return [...prev, { product, quantity: qty }]
    })
    try {
      if (notify) {
        // prefer translated title when available
        const { t, lang } = require('../lib/language').useLanguage ? require('../lib/language').useLanguage() : { t: (k: string) => k, lang: 'fa' }
        const title = (() => {
          try {
            const tr = require('../lib/productI18n').getTranslatedProductText(product, lang)
            return tr.title || product.title
          } catch (e) {
            return product.title
          }
        })()
        notify.push(`${title} ${t('addToCart')}`, { level: 'success' })
      }
    } catch (e) {
      if (notify) notify.push(`${product.title} به سبد اضافه شد`, { level: 'success' })
    }

    // award points for adding to cart if user is logged in
    try {
      const m = currentMember()
      if (m && m.id) {
        const pointsPerItem = Math.max(1, Math.round(product.price / 10000))
        gamification.addPoints(m.id, pointsPerItem * qty, `add_to_cart:${product.id}`)
      }
    } catch (e) {}
  }

  const updateQuantity = (id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.product.id !== id)
      return prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
    })
  }

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id))
  }

  const clear = () => setItems([])

  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, add, updateQuantity, remove, clear }}>{children}</CartContext.Provider>
  )
}
