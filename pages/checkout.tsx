import React, { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLanguage } from '../lib/language'
import { useCart } from '../context/CartContext'
// lightweight UUID v4 generator (no external dep)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// lazy imports for libs that use localStorage
const ordersLib = require('../lib/orders')
const membersLib = require('../lib/members')

export default function CheckoutPage() {
  const { items, clear } = useCart()
  const [method, setMethod] = useState<'gateway' | 'crypto'>('gateway')
  const [processing, setProcessing] = useState(false)
  const [invoice, setInvoice] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const startPayment = () => {
    if (items.length === 0) return setMessage(t('emptyCart'))
    setProcessing(true)
    const id = uuidv4()
    const member = membersLib.currentMember ? membersLib.currentMember() : null
    const referrerId = member ? member.referrerId : undefined

    const order = {
      id,
      memberEmail: member ? member.email : undefined,
      items: items.map((it: any) => ({ productId: it.product.id, quantity: it.quantity })),
      total,
      status: 'pending',
      referrerId,
      createdAt: Date.now(),
    }

    // save pending order
    try {
      ordersLib.addOrder(order)
  const invoiceCode = `INV-${String(id).slice(0, 8)}`
  setInvoice(invoiceCode)
  setMessage(t('invoiceCreated').replace('{code}', invoiceCode).replace('{method}', method === 'gateway' ? t('gatewayOption') : t('cryptoOption')))
    } catch (e) {
  setMessage(t('invoiceError'))
    }

    setProcessing(false)
  }

  const simulateGatewayReturn = () => {
  if (!invoice) return setMessage(t('invoiceNotStarted'))
    // find the order by invoice-ish id prefix
    const list = ordersLib.loadOrders()
    const o = list.find((x: any) => x.id && x.id.startsWith(invoice.replace('INV-', '')))
  if (!o) return setMessage(t('orderNotFound'))
  // mark paid and save with per-level absolute percentage commission credit
  const paid = { ...o, status: 'paid' }
  ordersLib.deleteOrder(o.id)
  // levelPercentsAbsolute: index 0 -> immediate referrer (0.5%), index 1 -> next upline (1%), index 2 -> next (0.1%)
  ordersLib.addOrderWithLevelPercents(paid, [0.5, 1, 0.1])
    clear()
    setMessage(t('paymentSimulatedGateway'))
    setInvoice(null)
  }

  const simulateCryptoConfirm = () => {
  if (!invoice) return setMessage(t('invoiceNotStarted'))
    const list = ordersLib.loadOrders()
    const o = list.find((x: any) => x.id && x.id.startsWith(invoice.replace('INV-', '')))
  if (!o) return setMessage(t('orderNotFound'))
  const paid = { ...o, status: 'paid' }
  ordersLib.deleteOrder(o.id)
  ordersLib.addOrderWithLevelPercents(paid, [0.5, 1, 0.1])
    clear()
    setMessage(t('paymentSimulatedCrypto'))
    setInvoice(null)
  }

  const { t } = useLanguage()

  return (
    <>
      <Header />
      <main className="container py-8">
  <h1 className="text-2xl font-bold mb-6">{t('paymentPageTitle')}</h1>

        <div className="space-y-4">
          <div className="p-4 border rounded">
            <div className="font-semibold">{t('cartTotal')}: {total.toLocaleString()} تومان</div>
            <div className="text-sm text-gray-600">{t('itemsCount')}: {items.length}</div>
          </div>

          <div className="p-4 border rounded">
            <label className="block mb-2">{t('paymentMethod')}</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="border p-2 rounded">
              <option value="gateway">{t('gatewayOption')}</option>
              <option value="crypto">{t('cryptoOption')}</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-qanari text-qanariDark font-semibold rounded" onClick={startPayment} disabled={processing}>{t('startPayment')}</button>
            {invoice && method === 'gateway' && (
              <button className="px-4 py-2 border rounded" onClick={simulateGatewayReturn}>{t('simulateGatewayReturn')}</button>
            )}
            {invoice && method === 'crypto' && (
              <button className="px-4 py-2 border rounded" onClick={simulateCryptoConfirm}>{t('simulateCryptoConfirm')}</button>
            )}
          </div>

          {invoice && (
            <div className="p-4 mt-4 border rounded bg-gray-50">
              <div className="font-medium">کد پرداخت / فاکتور: {invoice}</div>
              {method === 'crypto' && <div className="text-sm mt-2">آدرس پرداخت (نماد): 0xDEADBEEF... (نمونه)</div>}
            </div>
          )}

          {message && <div className="mt-4 p-3 rounded bg-green-50 text-green-800">{message}</div>}
        </div>
      </main>
      <Footer />
    </>
  )
}
