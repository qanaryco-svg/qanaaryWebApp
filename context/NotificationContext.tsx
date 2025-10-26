import React, { createContext, useContext, useState } from 'react'

type Level = 'info' | 'success' | 'error'
type Toast = { id: string; message: string; level?: Level }

export type Notify = {
  push: (m: string, opts?: { level?: Level }) => void
}

const NotificationContext = createContext<Notify | undefined>(undefined)

export const useNotify = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider')
  return ctx
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = (message: string, opts?: { level?: Level }) => {
    const t: Toast = { id: String(Date.now()), message, level: opts?.level || 'info' }
    setToasts((s) => [...s, t])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== t.id)), 3000)
  }

  return (
    <NotificationContext.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="fixed top-4 left-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'px-4 py-2 rounded shadow max-w-xs break-words ' +
              (t.level === 'success'
                ? 'bg-green-50 text-green-800'
                : t.level === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-qanari text-qanariDark')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
