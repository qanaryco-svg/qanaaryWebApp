import React, { useEffect, useRef, useState } from 'react'
import { ChatMessage } from '../lib/chatbot'

function nowId() { return Math.random().toString(36).slice(2,9) }

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  // start with the same default content on server and client to avoid hydration mismatches
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'شما با دستیار قناری صحبت می‌کنید. می‌توانم درباره محصولات، سفارش و پرداخت کمک کنم.' }
  ])

  // on client mount, hydrate from sessionStorage if present
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem('qanari:chat')
        if (raw) setMessages(JSON.parse(raw))
      }
    } catch (e) {
      // ignore
    }
  }, [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try { sessionStorage.setItem('qanari:chat', JSON.stringify(messages)) } catch (e) {}
    // auto-scroll to bottom
    try { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight } catch (e) {}
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  async function send() {
    if (!input.trim()) return
    const user: ChatMessage = { role: 'user', content: input }
    const next = [...messages, user]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next })
      })
      const data = await resp.json()
      const text = data?.text || data?.fallback || 'متأسفانه پاسخی دریافت نشد.'
      setMessages(prev => [...prev, { role: 'assistant', content: String(text) }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'خطا در ارسال پیام. دوباره تلاش کنید.' }])
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className={`fixed bottom-6 left-6 z-50`}> 
        <button aria-label="open-chat" onClick={() => setOpen(o => !o)} className="bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center">{open ? '×' : 'چت'}</button>
      </div>

      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-96 max-w-[90vw] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-medium">دستیار قناری</div>
          <div className="p-3 h-64 overflow-auto" id="qanari-chat-scroll" ref={scrollRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-blue-50 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-700'}`}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} className="flex-1 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="سوالتان را بنویسید..." />
            <button onClick={send} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded">{loading ? 'در حال ارسال...' : 'ارسال'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
