import { useMemo, useState } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useHousingSnapshot } from './queries'

const money = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 })

export function HousingPage() {
  const [zoneId, setZoneId] = useState('all')
  const { data, isLoading, isFetching, error, refetch } = useHousingSnapshot()

  const view = useMemo(() => {
    if (!data) return null

    const units = zoneId === 'all' ? data.units : data.units.filter((item) => item.zone_id === zoneId)
    const stays = (zoneId === 'all' ? data.stays : data.stays.filter((item) => item.zone_id === zoneId))
      .filter((item) => item.status === 'ACTIVE')
    const assessments = zoneId === 'all'
      ? data.assessments
      : data.assessments.filter((item) => item.zone_id === zoneId)

    const capacity = units.reduce((sum, item) => sum + item.capacity, 0)
    const occupied = stays.length
    const pending = assessments.filter((item) => item.deduction_status === 'PENDING')
    const awaiting = assessments.filter((item) => item.deduction_status === 'AWAITING_HOURS')

    return {
      units,
      stays,
      assessments,
      capacity,
      occupied,
      available: Math.max(capacity - occupied, 0),
      occupancyRate: capacity ? (occupied / capacity) * 100 : 0,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, item) => sum + Number(item.deduction_amount || 0), 0),
      awaitingCount: awaiting.length,
    }
  }, [data, zoneId])

  if (!isSupabaseConfigured) {
    return <StateCard title="Staging غير مربوط" detail="أضف VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY لبيئة V2 فقط." />
  }

  if (isLoading) {
    return <StateCard title="جاري تحميل السكن" detail="TanStack Query بيحمّل Snapshot السكن من Staging…" loading />
  }

  if (error || !data || !view) {
    return (
      <StateCard
        title="تعذر تحميل Staging"
        detail={error instanceof Error ? error.message : 'Unknown staging error'}
        action={<button className="ghost-btn" onClick={() => refetch()}>إعادة المحاولة</button>}
      />
    )
  }

  const zoneName = (id: string) => data.zones.find((zone) => zone.id === id)?.name_ar ?? '—'
  const unitOccupancy = (unitId: string) => view.stays.filter((stay) => stay.unit_id === unitId).length

  return (
    <section className="housing-page" aria-label="Housing V2 read-only">
      <div className="module-head">
        <div>
          <p className="eyebrow">HOUSING · V2 STAGING</p>
          <h2>السكن</h2>
          <p>أول Module حقيقي على Architecture الجديدة — قراءة فقط حاليًا، بدون أي Mutation على Production.</p>
        </div>
        <div className="module-actions">
          <select className="v2-select" value={zoneId} onChange={(event) => setZoneId(event.target.value)} aria-label="اختيار الزون">
            <option value="all">كل الزونات</option>
            {data.zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name_ar}</option>)}
          </select>
          <button className="ghost-btn" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'تحديث…' : 'تحديث'}</button>
        </div>
      </div>

      <div className="housing-kpis">
        <Kpi label="الشقق" value={view.units.length} sub="وحدات متاحة في الفلتر" />
        <Kpi label="المقيمون حاليًا" value={view.occupied} sub={`من سعة ${view.capacity}`} />
        <Kpi label="أماكن متاحة" value={view.available} sub={`إشغال ${percent.format(view.occupancyRate)}%`} />
        <Kpi label="خصومات معلقة" value={view.pendingCount} sub={`${money.format(view.pendingAmount)} ج`} accent />
        <Kpi label="بانتظار الساعات" value={view.awaitingCount} sub="Assessment يحتاج ساعات" />
      </div>

      <div className="v2-panel">
        <div className="panel-title-row">
          <div>
            <span className="micro-label">LIVE SNAPSHOT</span>
            <h3>حالة الشقق</h3>
          </div>
          <span className="readonly-badge">READ ONLY</span>
        </div>
        <div className="unit-grid">
          {view.units.map((unit) => {
            const used = unitOccupancy(unit.id)
            const fill = unit.capacity ? Math.min((used / unit.capacity) * 100, 100) : 0
            return (
              <article className="unit-card" key={unit.id}>
                <div className="unit-card-top">
                  <div>
                    <small>{zoneName(unit.zone_id)}</small>
                    <h4>{unit.name}</h4>
                  </div>
                  <span className={`status-dot ${unit.status === 'ACTIVE' ? 'ok' : ''}`}>{unit.status}</span>
                </div>
                <div className="occupancy-line"><span style={{ width: `${fill}%` }} /></div>
                <div className="unit-meta">
                  <span><b>{used}</b> مقيم</span>
                  <span><b>{unit.capacity}</b> سعة</span>
                  <span><b>{Math.max(unit.capacity - used, 0)}</b> متاح</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="v2-panel">
        <div className="panel-title-row">
          <div>
            <span className="micro-label">ACTIVE STAYS</span>
            <h3>المقيمون الحاليون</h3>
          </div>
          <span className="data-count">{view.stays.length}</span>
        </div>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Rider ID</th><th>المندوب</th><th>الزون</th><th>الوحدة</th><th>الدخول</th></tr></thead>
            <tbody>
              {view.stays.map((stay) => (
                <tr key={stay.id}>
                  <td className="mono">{stay.rider_id}</td>
                  <td>{stay.rider_name}</td>
                  <td>{zoneName(stay.zone_id)}</td>
                  <td>{data.units.find((unit) => unit.id === stay.unit_id)?.name ?? '—'}</td>
                  <td>{stay.check_in_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, value, sub, accent = false }: { label: string; value: number; sub: string; accent?: boolean }) {
  return <article className={`housing-kpi ${accent ? 'accent' : ''}`}><small>{label}</small><strong>{money.format(value)}</strong><span>{sub}</span></article>
}

function StateCard({ title, detail, action, loading = false }: { title: string; detail: string; action?: React.ReactNode; loading?: boolean }) {
  return <section className="state-card"><div className={loading ? 'state-orb loading' : 'state-orb'}>007</div><h2>{title}</h2><p>{detail}</p>{action}</section>
}
