export function evaluateSeo({ title, content, metaDescription, images }: { title?: string; content?: string; metaDescription?: string; images?: any[] }) {
  let score = 0
  const issues: string[] = []
  const t = title || ''
  const d = metaDescription || ''
  const c = (content || '').replace(/<[^>]+>/g, '')

  // title length
  if (t.length >= 20 && t.length <= 60) score += 20
  else issues.push('طول عنوان مناسب نیست (۲۰-۶۰ کاراکتر)')

  // meta description
  if (d.length >= 50 && d.length <= 160) score += 20
  else issues.push('توضیحات متا مناسب نیست (۵۰-۱۶۰ کاراکتر)')

  // content length
  const words = c.split(/\s+/).filter(Boolean).length
  if (words >= 300) score += 20
  else issues.push('متن باید حداقل ۳۰۰ کلمه باشد')

  // images alt
  const missingAlt = (images || []).filter((img: any) => !img.alt).length
  if ((images || []).length > 0 && missingAlt === 0) score += 20
  else if ((images || []).length > 0) issues.push('برخی تصاویر متن جایگزین (alt) ندارند')
  else issues.push('تصویر برای مطلب اضافه نشده است')

  // keyword usage basic (assume first word of title)
  const kw = (t.split(' ')[0] || '').toLowerCase()
  if (kw && c.toLowerCase().includes(kw)) score += 20
  else issues.push('کلمه کلیدی هدف در متن استفاده نشده است')

  return { score, issues }
}
