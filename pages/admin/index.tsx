import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getMetrics, Metrics, seriesLastNDays, seriesLastNWeeks, seriesLastNMonths, seriesLastNYears } from '../../lib/metrics'
import { listAlerts, addAlert, clearAlerts } from '../../lib/alerts'
import { reprocessPaidOrdersForMetrics } from '../../lib/orders'
import { useRouter } from 'next/router'

function BarChart({ data, width = 300, height = 120 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(...data, 1)
  const bw = Math.floor(width / data.length)
  return (
    <svg width={width} height={height} className="block">
      {data.map((v, i) => {
        const h = Math.round((v / max) * (height - 20))
        const x = i * bw + 4
        const y = height - h - 10
        return <rect key={i} x={x} y={y} width={bw - 6} height={h} fill="#60a5fa" />
      })}
    </svg>
  )
}

function LineChart({ data, width = 300, height = 120 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(...data, 1)
  const step = width / Math.max(data.length - 1, 1)
  const points = data.map((v, i) => `${i * step},${height - Math.round((v / max) * (height - 20)) - 10}`)
  return (
    <svg width={width} height={height} className="block">
      <polyline points={points.join(' ')} fill="none" stroke="#34d399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = i * step
        const y = height - Math.round((v / max) * (height - 20)) - 10
        return <circle key={i} cx={x} cy={y} r={3} fill="#10b981" />
      })}
    </svg>
  )
}

export default function AdminIndex() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [series, setSeries] = useState<{ views: number[]; sales: number[] } | null>(null)
  const [working, setWorking] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [alerts, setAlerts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    setMetrics(getMetrics())
    setSeries(seriesLastNDays(7))
    setAlerts(listAlerts())
  }, [])

  const reprocess = () => {
    setMsg(null)
    setWorking(true)
    try {
      const res = reprocessPaidOrdersForMetrics()
      // refresh metrics
      setMetrics(getMetrics())
      setSeries(seriesLastNDays(7))
      if (res && (res as any).processed) setMsg('پردازش سفارش‌های پرداخت‌شده انجام شد')
      else setMsg('هیچ سفارشی برای پردازش وجود نداشت یا خطا رخ داد')
    } catch (e) {
      setMsg('خطا هنگام پردازش: ' + String(e))
    }
    setWorking(false)
  }

  const rebuildMetrics = () => {
    setMsg(null)
    setWorking(true)
    try {
      // lazy require metrics module
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const metricsLib = require('../../lib/metrics')
      const res = typeof metricsLib.recomputeMetricsFromOrders === 'function' ? metricsLib.recomputeMetricsFromOrders() : null
      setMetrics(getMetrics())
      setSeries(seriesLastNDays(7))
      if (res && (res as any).rebuilt) setMsg('بازسازی متریک‌ها انجام شد')
      else setMsg('بازسازی انجام نشد یا خطا رخ داد')
    } catch (e) {
      setMsg('خطا هنگام بازسازی: ' + String(e))
    }
    setWorking(false)
  }

  const refreshSeriesForPeriod = (p: typeof period) => {
    setPeriod(p)
    if (p === 'day') setSeries(seriesLastNDays(7))
    else if (p === 'week') setSeries(seriesLastNWeeks(4))
    else if (p === 'month') setSeries(seriesLastNMonths(6))
    else setSeries(seriesLastNYears(5))
  }

  const onAddTestAlert = () => {
    addAlert('warning', 'آزمون: رویداد هشدار جدید')
    setAlerts(listAlerts())
  }

  const onClearAlerts = () => {
    clearAlerts()
    setAlerts([])
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">پیشخوان</h1>
        <div className="flex items-center gap-2 mb-4">
          <button className="px-3 py-1 border rounded" onClick={reprocess} disabled={working}>{working ? 'در حال پردازش…' : 'پردازش سفارش‌های پرداخت‌شده'}</button>
          <button className="px-3 py-1 border rounded ml-2" onClick={() => router.push('/admin/gamification')}>گیمیفیکیشن</button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <button className="px-3 py-1 border rounded" onClick={reprocess} disabled={working}>{working ? 'در حال پردازش…' : 'پردازش سفارش‌های پرداخت‌شده'}</button>
          <button className="px-3 py-1 border rounded" onClick={rebuildMetrics} disabled={working}>{working ? 'در حال پردازش…' : 'بازسازی متریک از سفارش‌ها'}</button>
          {msg ? <div className="text-sm text-gray-700">{msg}</div> : null}
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm">دوره:</div>
            <button className={`px-2 py-1 border rounded ${period === 'day' ? 'bg-gray-200' : ''}`} onClick={() => refreshSeriesForPeriod('day')}>روز</button>
            <button className={`px-2 py-1 border rounded ${period === 'week' ? 'bg-gray-200' : ''}`} onClick={() => refreshSeriesForPeriod('week')}>هفته</button>
            <button className={`px-2 py-1 border rounded ${period === 'month' ? 'bg-gray-200' : ''}`} onClick={() => refreshSeriesForPeriod('month')}>ماه</button>
            <button className={`px-2 py-1 border rounded ${period === 'year' ? 'bg-gray-200' : ''}`} onClick={() => refreshSeriesForPeriod('year')}>سال</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="neo-card p-4">تعداد کاربران: <strong>{metrics ? metrics.users : '—'}</strong></div>
          <div className="neo-card p-4">بازدید امروز: <strong>{metrics ? metrics.viewsToday : '—'}</strong></div>
          <div className="neo-card p-4">
            فروش این هفته: <strong>{metrics && typeof metrics.salesThisWeek === 'number' ? metrics.salesThisWeek.toLocaleString() : '—'}</strong>
          </div>
          <div className="neo-card p-4">کل بازدید ثبت‌شده: <strong>{metrics ? (metrics.viewEvents || []).length : '—'}</strong></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neo-card p-4">
            <h3 className="font-semibold mb-2">بازدید (7 روز اخیر)</h3>
            {series ? <BarChart data={series.views} width={360} height={140} /> : <div>درحال بارگذاری…</div>}
            <div className="text-sm text-gray-600 mt-2">روزها از چپ (قدیمی) به راست (جدید)</div>
          </div>

          <div className="neo-card p-4">
            <h3 className="font-semibold mb-2">فروش (7 روز اخیر)</h3>
            {series ? <LineChart data={series.sales} width={360} height={140} /> : <div>درحال بارگذاری…</div>}
            <div className="text-sm text-gray-600 mt-2">مبلغ فروش به تومان</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">اعلان‌ها</h3>
          <div className="neo-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <button className="px-2 py-1 border rounded" onClick={onAddTestAlert}>افزودن اعلان تست</button>
              <button className="px-2 py-1 border rounded" onClick={onClearAlerts}>پاک کردن اعلان‌ها</button>
            </div>
            {alerts.length === 0 ? (
              <div className="text-sm text-gray-600">اعنانی وجود ندارد</div>
            ) : (
              <ul className="space-y-2">
                {alerts.map((a: any) => (
                  <li key={a.id} className="p-2 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{a.level.toUpperCase()}</div>
                      <div className="text-sm">{a.message}</div>
                      <div className="text-xs text-gray-500">{new Date(a.ts).toLocaleString()}</div>
                    </div>
                    <div>{a.read ? 'خوانده شده' : 'جدید'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => router.push('/admin/blog')}
          >
            مدیریت مطالب وبلاگ
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
// Management UI moved to pages/admin/manage.tsx
