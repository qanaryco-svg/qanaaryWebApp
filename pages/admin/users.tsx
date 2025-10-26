import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { loadMembers, updateMember, setMemberRole, setMemberBlocked, deleteMemberByEmail } from '../../lib/members'
import { Member } from '../../lib/members'
import { listActivityForMember } from '../../lib/activity'

export default function AdminUsers() {
  const [list, setList] = useState<Member[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setList(loadMembers())
  }, [])

  const filtered = list.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()) || m.email.toLowerCase().includes(filter.toLowerCase()))

  const onDelete = (email: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return
    deleteMemberByEmail(email)
    setList(loadMembers())
  }

  const onToggleBlock = (id: string, blocked?: boolean) => {
    setMemberBlocked(id, !blocked)
    setList(loadMembers())
  }

  const onChangeRole = (id: string, role: Member['role']) => {
    setMemberRole(id, role)
    setList(loadMembers())
  }

  const onEdit = (m: Member) => {
    const name = prompt('نام', m.name) || m.name
    const city = prompt('شهر', m.city || '') || m.city
    const updated = { ...m, name, city }
    updateMember(updated)
    setList(loadMembers())
  }

  const [activeActivities, setActiveActivities] = useState<any[] | null>(null)
  const showActivity = (id: string) => {
    const acts = listActivityForMember(id)
    setActiveActivities(acts)
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">کاربران</h1>
        <div className="mb-4 flex gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="جستجو با نام یا ایمیل" className="px-3 py-2 border rounded flex-1" />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filtered.map((m) => (
            <div key={m.email} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{m.name} {m.blocked ? <span className="text-xs text-red-600">(مسدود)</span> : null}</div>
                <div className="text-sm text-gray-600">{m.email}</div>
                <div className="text-sm text-gray-600">نقش: {m.role || 'buyer'}</div>
              </div>
              <div className="flex gap-2 items-center">
                <select value={m.role || 'buyer'} onChange={(e) => onChangeRole(m.id, e.target.value as any)} className="px-2 py-1 border rounded">
                  <option value="buyer">خریدار</option>
                  <option value="seller">فروشنده</option>
                  <option value="admin">ادمین</option>
                </select>
                <button className="px-3 py-1 border rounded" onClick={() => onEdit(m)}>ویرایش</button>
                <button className="px-3 py-1 border rounded" onClick={() => showActivity(m.id)}>تاریخچه</button>
                <button className="px-3 py-1 border rounded" onClick={() => onToggleBlock(m.id, m.blocked)}>{m.blocked ? 'فعال‌سازی' : 'مسدود'}</button>
                <button className="px-3 py-1 border rounded text-red-600" onClick={() => onDelete(m.email)}>حذف</button>
              </div>
            </div>
          ))}
        </div>

        {activeActivities ? (
          <div className="mt-4 p-3 border rounded">
            <h3 className="font-semibold mb-2">تاریخچه فعالیت</h3>
            {activeActivities.length === 0 ? <div className="text-sm text-gray-600">فعالیتی پیدا نشد</div> : (
              <ul className="space-y-2 text-sm">
                {activeActivities.map((a: any) => (
                  <li key={a.id} className="p-2 border rounded">
                    <div className="font-medium">{a.type}</div>
                    <div className="text-gray-600">{new Date(a.ts).toLocaleString()}</div>
                    <div className="text-xs">{JSON.stringify(a.payload)}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2"><button className="px-3 py-1 border rounded" onClick={() => setActiveActivities(null)}>بستن</button></div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
