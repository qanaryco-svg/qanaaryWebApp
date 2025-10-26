import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/language'
import { Product } from '../data/products'
import { loadUploads, addUpload, transferUploads, UploadItem } from '../lib/uploads'
import { loadProducts } from '../lib/productStore'

type Props = {
  product: Product | null
  onCancel: () => void
  onSave: (p: Product) => void
}

export default function AdminProductForm({ product, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(product?.title || '')
  const [price, setPrice] = useState(product?.price || 0)
  const [discount, setDiscount] = useState(product?.discount ?? 0)
  const [images, setImages] = useState(product?.images.join(',') || '')
  const [description, setDescription] = useState(product?.description || '')
  const [category, setCategory] = useState(product?.category || '')
  const [styleTags, setStyleTags] = useState((product && product.style && product.style.tags) ? product.style.tags.join(',') : '')
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; price?: string; images?: string; discount?: string }>({})
  const [isValid, setIsValid] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])

  // Keep form fields in sync when the product prop changes (e.g., opening edit)
  useEffect(() => {
    setTitle(product?.title || '')
    setPrice(product?.price || 0)
    setDiscount(product?.discount ?? 0)
    setImages(product?.images ? product.images.join(',') : '')
    setDescription(product?.description || '')
    setCategory(product?.category || '')
    setStyleTags((product && product.style && product.style.tags) ? product.style.tags.join(',') : '')
  }, [product])

  const genId = () => 'p_' + Date.now().toString(36)
  // temp gallery id for new products without an id yet
  // keep a stable temp id for the form instance and derive the actual galleryId
  const [tempGalleryId] = useState('temp_' + Math.random().toString(36).slice(2, 8))
  const galleryId = product && product.id ? product.id : tempGalleryId

  const save = (e: any) => {
    e.preventDefault()
    if (!validate()) return
    const id = product && product.id ? product.id : genId()
    // ensure at least one image exists so product cards render
    // use a neutral product placeholder (from seeded assets) instead of the site logo
    let parts = images.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) {
      parts = ['/p1.svg']
      setImages(parts.join(','))
    }
  const p: Product = { id, title: title.trim(), price: Number(price), images: parts, description, category, discount: Number(discount) }
  // attach style metadata if present
  const st = styleTags.split(',').map(s => s.trim()).filter(Boolean)
  if (st.length > 0) p.style = { tags: st }
    // if we used a temp gallery id for uploads, transfer them to the new product id
    try {
      if (tempGalleryId && tempGalleryId.startsWith('temp_') && id && (!product || !product.id)) {
        transferUploads(tempGalleryId, id)
      }
    } catch (e) {
      // ignore
    }
    onSave(p)
  }

  useEffect(() => {
    // derive preview urls from images string
    const parts = images.split(',').map((s) => s.trim()).filter(Boolean)
    setPreviewUrls(parts)
    // live-validate
    validate(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, title, price])

  useEffect(() => {
    try {
      setUploads(loadUploads(galleryId))
    } catch (e) {
      setUploads([])
    }
    try {
      const prods = loadProducts()
      setCategorySuggestions(Array.from(new Set(prods.map((p) => p.category).filter(Boolean))))
    } catch (e) {
      setCategorySuggestions([])
    }
  }, [galleryId])

  const insertUpload = (u: UploadItem) => {
    // append dataUrl to images list
    const next = images.split(',').map((s) => s.trim()).filter(Boolean)
    next.push(u.dataUrl)
    setImages(next.join(','))
  }

  const handleFileInput = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = String(reader.result || '')
        const type = f.type.startsWith('image') ? 'image' : 'video'
        const item: UploadItem = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6), type, name: f.name, dataUrl, createdAt: Date.now(), galleryId }
        try {
          addUpload(item)
          setUploads(loadUploads(galleryId))
          // insert newly uploaded item into product images for convenience
          insertUpload(item)
        } catch (e) {
          // ignore
        }
      }
      reader.readAsDataURL(f)
    })
  }

  const imageParts = images.split(',').map((s) => s.trim()).filter(Boolean)

  const removeImageAt = (idx: number) => {
    const arr = [...imageParts]
    arr.splice(idx, 1)
    setImages(arr.join(','))
  }

  const setAsMain = (idx: number) => {
    const arr = [...imageParts]
    const [item] = arr.splice(idx, 1)
    arr.unshift(item)
    setImages(arr.join(','))
  }

  const moveImage = (idx: number, dir: number) => {
    const arr = [...imageParts]
    const to = idx + dir
    if (to < 0 || to >= arr.length) return
    const tmp = arr[to]
    arr[to] = arr[idx]
    arr[idx] = tmp
    setImages(arr.join(','))
  }

  const validate = (setState = true) => {
  const e: { title?: string; price?: string; images?: string; discount?: string } = {}
  if (!title || title.trim().length === 0) e.title = 'عنوان نمی‌تواند خالی باشد.'
  if (isNaN(Number(price)) || Number(price) < 0) e.price = 'قیمت باید عدد و صفر یا بیشتر باشد.'
  if (isNaN(Number(discount)) || Number(discount) < 0 || Number(discount) > 99) e.discount = 'تخفیف باید بین 0 تا 99 باشد.'
  // images are optional; if none provided we'll use a default image on save
  if (setState) setErrors(e)
  const ok = Object.keys(e).length === 0
  setIsValid(ok)
  return ok
  }

  const { t } = useLanguage()

  return (
  <form onSubmit={save} className="max-w-lg p-4 border rounded">
      <div className="mb-2">
        <label className="block text-sm">{t('titleLabel')}</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2 py-1 border rounded" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">{t('priceLabel')}</label>
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-2 py-1 border rounded" type="number" />
      </div>
      <div className="mb-2">
        <label className="block text-sm">درصد تخفیف</label>
        <input value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-2 py-1 border rounded" type="number" min="0" max="99" />
        {errors.discount && <div className="text-sm text-red-600 mt-1">{errors.discount}</div>}
      </div>
      <div className="mb-2">
        <label className="block text-sm">{t('imagesLabel')}</label>
        <input value={images} onChange={(e) => setImages(e.target.value)} className="w-full px-2 py-1 border rounded" />
        {errors.images && <div className="text-sm text-red-600 mt-1">{errors.images}</div>}
        {previewUrls.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">{t('preview')}:</div>
            <div className="mt-2 flex gap-2 items-center">
              {imageParts.map((src, idx) => (
                <div key={idx} className="border p-1 text-center">
                  {src.startsWith('data:video') || src.endsWith('.mp4') || src.startsWith('blob:') ? (
                    <video src={src} className="h-20 w-20 object-cover" />
                  ) : (
                    <img src={src} alt={`preview-${idx}`} className="h-20 w-20 object-contain" />
                  )}
                  <div className="mt-1 flex gap-1 justify-center">
                    <button type="button" onClick={() => removeImageAt(idx)} className="px-2 py-1 text-xs border rounded text-red-600">حذف</button>
                    <button type="button" onClick={() => setAsMain(idx)} className="px-2 py-1 text-xs border rounded">تنظیم به عنوان اصلی</button>
                    <button type="button" onClick={() => moveImage(idx, -1)} className="px-2 py-1 text-xs border rounded">←</button>
                    <button type="button" onClick={() => moveImage(idx, 1)} className="px-2 py-1 text-xs border rounded">→</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3">
          <label className="block text-sm font-semibold mb-2">آپلود جدید (تصویر/ویدیو)</label>
          <input type="file" accept="image/*,image/jpeg,image/jpg,video/*" multiple onChange={(e) => handleFileInput(e.target.files)} />
        </div>
        <div className="mt-3">
          <div className="text-sm font-semibold mb-2">{t('uploadedFilesTitle')}</div>
          <div className="grid grid-cols-3 gap-2">
            {uploads.map((u) => (
              <div key={u.id} className="border p-1 text-center">
                {u.type === 'image' ? (
                  <img src={u.dataUrl} className="h-20 w-full object-cover" />
                ) : (
                  <video src={u.dataUrl} className="h-20 w-full" />
                )}
                <div className="mt-1 flex gap-1 justify-center">
                  <button type="button" onClick={() => insertUpload(u)} className="px-2 py-1 text-xs border rounded">اضافه</button>
                </div>
              </div>
            ))}
            {uploads.length === 0 && <div className="text-gray-500">{t('noFilesMsg')}</div>}
          </div>
        </div>
      </div>
      <div className="mb-2">
        <label className="block text-sm">{t('categoryLabel')}</label>
        <input list="category-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2 py-1 border rounded" />
        <datalist id="category-suggestions">
          {categorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="mb-2">
        <label className="block text-sm">ویژگی‌های استایل (تگ‌ها، با کاما جداکن)</label>
        <input value={styleTags} onChange={(e) => setStyleTags(e.target.value)} placeholder="مثال: casual, summer, fitted" className="w-full px-2 py-1 border rounded" />
        <div className="text-xs text-gray-500 mt-1">این تگ‌ها به Style Finder کمک می‌کنند تا محصولات را بهتر دسته‌بندی کند.</div>
      </div>
      <div className="mb-2">
        {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
        {errors.price && <div className="text-sm text-red-600">{errors.price}</div>}
      </div>
      <div className="mb-2">
        <label className="block text-sm">{t('descriptionLabel')}</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-2 py-1 border rounded" />
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-qanari text-qanariDark rounded" type="submit" disabled={!isValid}>{t('save')}</button>
        <button type="button" className="px-4 py-2 border rounded" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </form>
  )
}
