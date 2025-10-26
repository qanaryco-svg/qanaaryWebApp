import React, { useEffect, useState } from 'react'
import { useNotify } from '../context/NotificationContext'
import { useLanguage } from '../lib/language'

type Comment = {
  id: string
  productId: string
  name: string
  rating: number
  text: string
  createdAt: number
}

const STORAGE_KEY = 'qanari:comments'

export default function ProductComments({ productId, onStatsChange }: { productId: string; onStatsChange?: (s: { avg: number; count: number }) => void }) {
  const [replyMap, setReplyMap] = useState<{[id: string]: string[]}>({})
  const [replyInput, setReplyInput] = useState<{[id: string]: string}>({})
  const [expandedReplies, setExpandedReplies] = useState<{[id: string]: boolean}>({})
  // Simple bad words and spam filter
  const badWords = ["کثافت","فحش","لعنت","تبلیغ","spam","ad","فروش","خرید","xxx","http","www"];
  const isClean = (txt: string) => {
    const lower = txt.toLowerCase();
    return !badWords.some(w => lower.includes(w));
  }
  const [comments, setComments] = useState<Comment[]>([])
  const [likesMap, setLikesMap] = useState<{[id: string]: number}>({})
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const { lang, t } = (() => {
    try {
      return useLanguage()
    } catch (e) {
      // fallback to defaults when provider not present
      return { lang: 'fa' as const, t: (k: string) => k }
    }
  })()
  const notify = (() => {
    try {
      return useNotify()
    } catch (e) {
      return undefined
    }
  })()

  useEffect(() => {
    // Load replies from localStorage
    try {
      const rawReplies = localStorage.getItem('qanari:commentReplies')
      const repliesObj = rawReplies ? JSON.parse(rawReplies) : {}
      setReplyMap(repliesObj)
    } catch (e) {
      setReplyMap({})
    }
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: Comment[] = raw ? JSON.parse(raw) : []
      const productComments = all.filter((c) => c.productId === productId).sort((a, b) => b.createdAt - a.createdAt)

  // If there are no comments for this product, seed 7 examples only once (avoid reseeding after admin deletions)
  const seededFlag = (() => {
    try {
      return localStorage.getItem('qanari:comments-seeded')
    } catch (e) {
      return null
    }
  })()

  if (productComments.length === 0 && !seededFlag) {
        // seed sample comments localized by current language
        const sampleNamesFa = ['مهسا', 'نسرین', 'آوا', 'سارا', 'مریم', 'نگار', 'پری']
        const sampleTextsFa = [
          'خیلی خوب و با کیفیت بود، از خریدم راضی‌ام.',
          'بافت عالی و اندازه‌اش مطابق توضیحات بود.',
          'ارسال سریع بود اما بسته‌بندی بهتر می‌توانست باشد.',
          'رنگ دقیقاً مثل عکس بود، پیشنهاد می‌کنم.',
          'قیمت مناسب و راحت است برای استفاده روزمره.',
          'دوام و جنس مناسب، برای فصل پاییز عالی بود.',
          'اندازه‌اش کمی بزرگ است، یک سایز کوچک‌تر انتخاب کنید.'
        ]
        const sampleNamesEn = ['Mahsa', 'Nasrin', 'Ava', 'Sara', 'Maryam', 'Negar', 'Pari']
        const sampleTextsEn = [
          'Very nice and good quality, I am satisfied with my purchase.',
          'Great texture and the size matched the description.',
          'Fast shipping though the packaging could be better.',
          'The color was exactly like the photo, I recommend it.',
          'Affordable price and comfortable for everyday use.',
          'Durable material, perfect for autumn.',
          'It runs a bit large; consider ordering one size down.'
        ]
        const sampleNamesAr = ['مهسا', 'نسرین', 'آوا', 'سارا', 'مریم', 'نگار', 'پری']
        const sampleTextsAr = [
          'جيد جدا وبجودة عالية، أنا راضٍ عن شرائي.',
          'نسيج رائع والحجم مطابق للوصف.',
          'كانت الشحنة سريعة لكن التغليف يمكن أن يكون أفضل.',
          'اللون مطابق للصورة تمامًا، أنصح به.',
          'سعر مناسب ومريح للاستخدام اليومي.',
          'خامة متينة وممتازة لفصل الخريف.',
          'المقاس كبير قليلاً، اختر مقاسًا أصغر.'
        ]
        const sampleNames = lang === 'en' ? sampleNamesEn : lang === 'ar' ? sampleNamesAr : sampleNamesFa
        const sampleTexts = lang === 'en' ? sampleTextsEn : lang === 'ar' ? sampleTextsAr : sampleTextsFa
        const seeded: Comment[] = []
        const now = Date.now()
        for (let i = 0; i < 7; i++) {
          seeded.push({
            id: `${productId}-seed-${i}-${now}`,
            productId,
            name: sampleNames[i % sampleNames.length],
            rating: 5 - (i % 5),
            text: sampleTexts[i % sampleTexts.length],
            createdAt: now - i * 1000
          })
        }
        const nextAll = [...seeded, ...all]
        persistAll(nextAll)
        try {
          localStorage.setItem('qanari:comments-seeded', 'true')
        } catch (e) {
          // ignore
        }
        const nextForProduct = nextAll.filter((c) => c.productId === productId).sort((a, b) => b.createdAt - a.createdAt)
        setComments(nextForProduct)
        if (onStatsChange) {
          const count = nextForProduct.length
          const sum = nextForProduct.reduce((s, c) => s + (c.rating || 0), 0)
          onStatsChange({ avg: count === 0 ? 0 : sum / count, count })
        }
        return
      }

      setComments(productComments)
      // Load likes from localStorage
      try {
        const rawLikes = localStorage.getItem('qanari:commentLikes')
        const likesObj = rawLikes ? JSON.parse(rawLikes) : {}
        setLikesMap(likesObj)
      } catch (e) {
        setLikesMap({})
      }
      if (onStatsChange) {
        const count = productComments.length
        const sum = productComments.reduce((s, c) => s + (c.rating || 0), 0)
        onStatsChange({ avg: count === 0 ? 0 : sum / count, count })
      }
    } catch (e) {
      setComments([])
    }
  }, [productId])

  const persistAll = (all: Comment[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch (e) {
      // ignore
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !name.trim()) return
    const c: Comment = {
      id: String(Date.now()),
      productId,
      name: name.trim(),
      rating,
      text: text.trim(),
      createdAt: Date.now(),
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: Comment[] = raw ? JSON.parse(raw) : []
      const next = [c, ...all]
      persistAll(next)
      const nextForProduct = next.filter((x) => x.productId === productId).sort((a, b) => b.createdAt - a.createdAt)
      setComments(nextForProduct)
      if (onStatsChange) {
        const count = nextForProduct.length
        const sum = nextForProduct.reduce((s, c) => s + (c.rating || 0), 0)
        onStatsChange({ avg: count === 0 ? 0 : sum / count, count })
      }
  setText('')
  if (notify) notify.push(t('commentSaved') ?? 'نظر شما ثبت شد', { level: 'success' })
    } catch (err) {
      // ignore
    }
  }

  const handleDelete = (id: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: Comment[] = raw ? JSON.parse(raw) : []
      const next = all.filter((c) => c.id !== id)
      persistAll(next)
      const nextForProduct = next.filter((x) => x.productId === productId).sort((a, b) => b.createdAt - a.createdAt)
      setComments(nextForProduct)
      if (onStatsChange) {
        const count = nextForProduct.length
        const sum = nextForProduct.reduce((s, c) => s + (c.rating || 0), 0)
        onStatsChange({ avg: count === 0 ? 0 : sum / count, count })
      }
  if (notify) notify.push(t('commentDeleted') ?? 'نظر حذف شد', { level: 'info' })
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-4">{t('userComments') ?? 'نظرات کاربران'}</h3>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('yourName') ?? 'نام شما'} className="flex-1 px-3 py-2 border rounded" />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="px-3 py-2 border rounded">
            {[5,4,3,2,1].map((r) => (
              <option key={r} value={r}>{r} {t('stars') ?? 'ستاره'}</option>
            ))}
          </select>
        </div>
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('yourCommentPlaceholder') ?? 'نظر شما دربارهٔ این محصول'} className="w-full px-3 py-2 border rounded" rows={4} />
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-qanari text-qanariDark rounded font-semibold">{t('submitComment') ?? 'ثبت نظر'}</button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 && <div className="text-gray-600">{t('noCommentsYet') ?? 'هنوز نظری ثبت نشده است.'}</div>}
        {comments.map((c) => (
          <div key={c.id} className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-sm text-yellow-600 mb-2">{'★'.repeat(c.rating)}{'☆'.repeat(5-c.rating)}</div>
            <div className="text-gray-800 mb-2">{c.text}</div>
            <div className="flex flex-row-reverse items-center gap-3 mt-2">
              <button className="text-sm text-pink-600 flex items-center gap-1" onClick={() => {
                const newLikes = { ...likesMap, [c.id]: (likesMap[c.id] || 0) + 1 };
                setLikesMap(newLikes);
                try {
                  localStorage.setItem('qanari:commentLikes', JSON.stringify(newLikes));
                } catch (e) {}
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 1.01 4.5 2.09C13.09 4.01 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>{likesMap[c.id] || 0}</span>
              </button>
              <form onSubmit={e => {
                e.preventDefault();
                const txt = replyInput[c.id]?.trim() || "";
                if (!txt) return;
                if (!isClean(txt)) {
                  if (notify) notify.push("پاسخ شما شامل تبلیغ یا فحاشی است.", { level: "error" });
                  return;
                }
                const newReplies = { ...replyMap, [c.id]: [...(replyMap[c.id] || []), txt] };
                setReplyMap(newReplies);
                setReplyInput({ ...replyInput, [c.id]: "" });
                try {
                  localStorage.setItem('qanari:commentReplies', JSON.stringify(newReplies));
                } catch (e) {}
              }} className="flex items-center gap-1">
                <input type="text" value={replyInput[c.id] || ""} onChange={e => setReplyInput({ ...replyInput, [c.id]: e.target.value })} placeholder="پاسخ کوتاه..." className="border rounded px-2 py-1 text-sm" maxLength={64} />
                <button type="submit" className="text-xs px-2 py-1 bg-qanari text-qanariDark rounded">ثبت</button>
              </form>
            </div>
            {replyMap[c.id] && replyMap[c.id].length > 0 && (
              <div className="mt-2 text-left">
                <div className="text-xs text-gray-500 mb-1">پاسخ‌ها:</div>
                <ul className="space-y-1">
                  {replyMap[c.id].slice(0, expandedReplies[c.id] ? undefined : 3).map((r, idx) => (
                    <li key={idx} className="text-xs bg-gray-100 rounded px-2 py-1">{r}</li>
                  ))}
                </ul>
                {replyMap[c.id].length > 3 && !expandedReplies[c.id] && (
                  <button 
                    onClick={() => setExpandedReplies({...expandedReplies, [c.id]: true})}
                    className="text-xs text-qanariDark bg-qanari bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 mt-1 transition-colors"
                  >
                    {replyMap[c.id].length - 3} پاسخ بیشتر...
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
