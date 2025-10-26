import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { useEffect, useState } from 'react'
import gamification from '../../lib/gamification'
import { currentMember } from '../../lib/members'

export default function ClubPage() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => {
    const m = currentMember()
    if (m && m.id) {
      setStats(gamification.getUserStats(m.id))
    }
  }, [])

  if (!stats) return (
    <>
      <Header />
      <main className="container py-12">
        <div className="text-center">برای مشاهده باشگاه مشتریان لطفاً وارد شوید.</div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Header />
      <main className="container py-12">
        <h1 className="text-2xl font-bold mb-4">باشگاه مشتریان قناری</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">امتیاز شما</div>
            <div className="text-2xl font-bold">{stats.points}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">سطح شما</div>
            <div className="text-2xl font-bold">{stats.level}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">نشان‌ها</div>
            <div className="flex gap-2 mt-2">{(stats.badges || []).map((b: string) => <div key={b} className="px-2 py-1 bg-yellow-200 rounded">{b}</div>)}</div>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">مزایا</h2>
          <ul className="list-disc pl-6 text-sm text-gray-600">
            <li>تخفیف‌های اختصاصی براساس سطح</li>
            <li>دسترسی به ورکشاپ‌ها و رویدادها</li>
            <li>پیشنهادات شخصی‌سازی‌شده</li>
          </ul>
        </section>

      </main>
      <Footer />
    </>
  )
}
