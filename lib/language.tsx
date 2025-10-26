import React, { createContext, useContext, useEffect, useState } from 'react'
import { LANG_KEY, Lang, tFor } from './i18n'
import { productTranslationsSeed } from './productTranslationSeed'
import { listProductTranslations, setProductTranslation } from './productI18n'

type LangContext = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const Ctx = createContext<LangContext | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('fa')

  useEffect(() => {
    try {
      const v = localStorage.getItem(LANG_KEY) as Lang | null
      if (v) setLangState(v)
    } catch (e) {}
  }, [])

  const setLang = (l: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, l)
      setLangState(l)
      try {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qanari:lang-updated', { detail: l }))
      } catch (e) {}
    } catch (e) {}
  }

  const t = (key: string) => tFor(lang, key)

  // apply lang/dir globally so all pages pick it up (client-only)
  React.useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang === 'fa' ? 'fa' : lang === 'ar' ? 'ar' : 'en'
        document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl'
      }
    } catch (e) {}
  }, [lang])

  // Seed product translations on first client load if none exist
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const existing = listProductTranslations()
      const hasAny = Object.keys(existing).length > 0
      if (!hasAny) {
        // write seed
        Object.keys(productTranslationsSeed).forEach((pid) => {
          const entry = (productTranslationsSeed as any)[pid]
          if (!entry) return
          Object.keys(entry).forEach((langKey) => {
            const data = (entry as any)[langKey]
            try {
              setProductTranslation(pid, langKey, data)
            } catch (e) {
              // ignore individual failures
            }
          })
        })
      }
    } catch (e) {
      // ignore
    }
  }, [])

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useLanguage = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
