import React, { useState } from 'react'
import { Answers, recommendByAnswers } from '../lib/styleFinder'
import { getTranslatedProductText } from '../lib/productI18n'
import { useCart } from '../context/CartContext'
import { useNotify } from '../context/NotificationContext'
import { currentMember, updateMember } from '../lib/members'

export default function StyleFinder({ onClose }: { onClose?: () => void }) {
  const { add } = (() => {
    try {
      return useCart()
    } catch (e) {
      return { add: (_: any, __?: number) => {} } as any
    }
  })()
  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return undefined
    }
  })()

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [results, setResults] = useState<any[]>([])

  const questions = [
    { key: 'color', text: 'کدام رنگ را بیشتر می‌پسندید؟', options: [{ v: 'red', t: 'قرمز' }, { v: 'blue', t: 'آبی' }, { v: 'neutral', t: 'خنثی' }] },
    { key: 'occasion', text: 'برای چه مناسبتی نیاز دارید؟', options: [{ v: 'casual', t: 'روزمره' }, { v: 'party', t: 'مهمانی' }, { v: 'work', t: 'محیط کار' }] },
    { key: 'silhouette', text: 'ترجیح فرم لباس؟', options: [{ v: 'fitted', t: 'فیت/چسبان' }, { v: 'loose', t: 'آزاد' }] },
    { key: 'budget', text: 'بودجه تقریبی شما؟', options: [{ v: 'low', t: 'کم' }, { v: 'mid', t: 'متوسط' }, { v: 'high', t: 'زیاد' }] },
  ]

  const onSelect = (k: string, v: any) => {
    (setAnswers as any)((prev: any) => ({ ...prev, [k]: v }))
    if (step < questions.length - 1) setStep(step + 1)
    else {
      const merged = { ...answers, [k]: v } as Answers
      const rec = recommendByAnswers(merged, 'fa')
      setResults(rec)

      // persist to member profile if logged in
      try {
        const m = currentMember()
        if (m && m.id) {
          const updated = { ...m, extra: JSON.stringify(Object.assign({}, typeof m.extra === 'object' && m.extra ? m.extra : {}, { styleProfile: merged })) }
          updateMember(updated)
          try { window.dispatchEvent(new CustomEvent('qanari:members-updated')) } catch (e) {}
        }
      } catch (e) {}
    }
  }

  const onAdd = (p: any) => {
    try {
      add(p, 1)
      notify?.push('محصول به سبد اضافه شد', { level: 'success' })
    } catch (e) {
      try { notify?.push('خطا در افزودن به سبد', { level: 'error' }) } catch (e) {}
    }
  }

  return (
    <div className="p-4 rounded shadow max-w-3xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all transform motion-safe:animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">استایل‌فایندر</h2>
        <div>
          <button className="px-3 py-1 text-sm" onClick={() => { setStep(0); setAnswers({}); setResults([]); if (onClose) onClose() }}>بستن</button>
        </div>
      </div>

      {!results.length ? (
        <div>
          <div className="mb-4">
            <div className="font-semibold mb-2">{questions[step].text}</div>
            <div className="flex gap-3">
              {questions[step].options.map((o) => (
                <button key={o.v} className="px-4 py-2 border rounded hover:scale-105 transition-transform" onClick={() => onSelect(questions[step].key, o.v)}>{o.t}</button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500">سوال {step + 1} از {questions.length}</div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold mb-3">محصولات پیشنهادی برای شما</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p: any) => (
              <div key={p.id} className="border rounded p-3 bg-white dark:bg-gray-800">
                <img src={p.images?.[0] ?? '/logo.png'} alt={getTranslatedProductText(p, 'fa').title} className="w-full h-40 object-cover mb-2" />
                <div className="font-semibold mb-1">{getTranslatedProductText(p, 'fa').title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{p.price.toLocaleString()} تومان</div>
                <button className="px-3 py-2 bg-qanari text-qanariDark rounded" onClick={() => onAdd(p)}>افزودن به سبد</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
