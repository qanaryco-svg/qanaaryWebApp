import { evaluateSeo } from '../lib/seo'

describe('seo evaluation', () => {
  it('scores well when title and meta and content OK', () => {
    const res = evaluateSeo({ title: 'این یک عنوان مناسب است', metaDescription: 'توضیحات متا کافی و طول مناسب برای تست', content: 'کلمه کلیدی این مطلب شروع شده است. ' + 'کلمه '.repeat(300), images: [{ alt: 'تصویر' }] })
    expect(res.score).toBeGreaterThan(0)
  })
})
