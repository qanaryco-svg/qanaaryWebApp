import AdminLayout from '../../components/admin/AdminLayout'
import gamification from '../../lib/gamification'
import { useState, useEffect } from 'react'

export default function AdminGamification() {
  const [leaders, setLeaders] = useState<any[]>([])
  useEffect(() => {
    setLeaders(gamification.getLeaderboard(20))
  }, [])

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">گیمیفیکیشن — لیدربورد</h1>
        <div className="border rounded p-4">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th>رتبه</th>
                <th>کاربر</th>
                <th>امتیاز</th>
                <th>سطح</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((u, i) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2">{u.id}</td>
                  <td className="py-2">{u.points}</td>
                  <td className="py-2">{u.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
