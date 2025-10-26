import Link from 'next/link'

export default function CategoryTile({ href, image, label }: { href: string; image: string; label: string }) {
  return (
    <a className="category-tile block overflow-hidden rounded" href={href}>
      <div className="thumb bg-cover bg-center h-40" style={{ backgroundImage: `url('${image}')` }} />
      <div className="meta p-3 bg-white/60 text-center">
        <div className="label font-medium">{label}</div>
      </div>
    </a>
  )
}
