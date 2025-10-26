import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { LANG_KEY, Lang, tFor } from './i18n'

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
	useEffect(() => {
			try {
				if (typeof document !== 'undefined') {
					// set proper html lang and direction for supported languages
					document.documentElement.lang = lang === 'fa' ? 'fa' : lang === 'ar' ? 'ar' : lang === 'tr' ? 'tr' : 'en'
					document.documentElement.dir = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'
				}
			} catch (e) {}
	}, [lang])

	return React.createElement(Ctx.Provider, { value: { lang, setLang, t } }, children)
}

export const useLanguage = () => {
	const ctx = useContext(Ctx)
	if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
	return ctx
}
