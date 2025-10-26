import React from 'react'

type Props = {
  min: number
  max: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}

export default function DualRange({ min, max, value, onChange }: Props) {
  const [low, high] = value

  const onLow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), high - 1)
    onChange([v, high])
  }
  const onHigh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), low + 1)
    onChange([low, v])
  }

  return (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} value={low} onChange={onLow} className="w-full" />
      <input type="range" min={min} max={max} value={high} onChange={onHigh} className="w-full" />
      <div className="text-sm w-40 text-right">{low.toLocaleString()} - {high.toLocaleString()} تومان</div>
    </div>
  )
}
