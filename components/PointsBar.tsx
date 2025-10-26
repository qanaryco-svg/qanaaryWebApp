import React, { useEffect, useState } from 'react'
import gamification from '../lib/gamification'
import { currentMember } from '../lib/members'

export default function PointsBar() {
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState('bronze')

  const load = () => {
    try {
      const m = currentMember()
      if (!m) return
      const u = gamification.getUserStats(m.id)
      setPoints(u.points || 0)
      setLevel(u.level || 'bronze')
    } catch (e) {}
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    try {
      window.addEventListener('qanari:gamification-updated', onUpdate as EventListener)
    } catch (e) {}
    return () => {
      try {
        window.removeEventListener('qanari:gamification-updated', onUpdate as EventListener)
      } catch (e) {}
    }
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="badge-icon bg-yellow-400 mr-1 animate-pulse" />
        <div className="text-sm text-yellow-400 font-semibold">امتیاز: {points}</div>
      </div>
      <div className="text-xs text-gray-300">سطح: {level}</div>
    </div>
  )
}
