import { useApi } from '../../hooks/useApi.js'
import { useSocketStore } from '../../store/socketStore.js'
import { api } from '../../services/api.js'
import clsx from 'clsx'

function StatCard({ label, value, sub, color = 'purple', icon }) {
  const colorMap = {
    purple: 'from-brand-900/50 to-brand-800/30 border-brand-700/30 text-brand-400',
    green:  'from-green-900/50 to-green-800/30 border-green-700/30 text-green-400',
    red:    'from-red-900/50 to-red-800/30 border-red-700/30 text-red-400',
    amber:  'from-amber-900/50 to-amber-800/30 border-amber-700/30 text-amber-400',
  }
  return (
    <div className={clsx('card bg-gradient-to-br', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-1">{value ?? '—'}</div>
          {sub && <div className="text-xs text-purple-300/50 mt-1">{sub}</div>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export default function KPICards() {
  const liveOccupancy = useSocketStore(s => s.occupancy)
  const { data: kpi, loading } = useApi(() => api.getKPI(), [], { refreshInterval: 30_000 })

  const occ = liveOccupancy || kpi
  const currentCount = occ?.current_count ?? occ?.current_occupancy ?? 0
  const threshold = occ?.threshold ?? occ?.occupancy_threshold ?? 50
  const pct = occ?.occupancy_pct ?? (threshold ? Math.round((currentCount / threshold) * 100) : 0)
  const todayEntries = occ?.today_entries ?? kpi?.today_entries
  const todayExits = occ?.today_exits ?? kpi?.today_exits
  const peakCount = occ?.peak_today?.count ?? kpi?.peak_today?.count

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon="👥"
        label="Current Occupancy"
        value={occ ? currentCount : (loading ? '…' : '—')}
        sub={`${pct}% of capacity (${threshold} max)`}
        color={pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green'}
      />
      <StatCard
        icon="🚪"
        label="Today's Entries"
        value={todayEntries != null ? todayEntries : (loading ? '…' : '—')}
        sub={`Exits: ${todayExits != null ? todayExits : '—'}`}
        color="purple"
      />
      <StatCard
        icon="⏱"
        label="Avg Dwell Time"
        value={kpi?.avg_dwell_seconds ? `${Math.round(kpi.avg_dwell_seconds)}s` : (loading ? '…' : '—')}
        sub="Browsing zones today"
        color="amber"
      />
      <StatCard
        icon="⚠️"
        label="Alerts Today"
        value={kpi?.alerts_today ?? (loading ? '…' : '—')}
        sub={`Peak: ${occ?.peak_today?.count ?? kpi?.peak_today?.count ?? '—'} persons`}
        color={kpi?.alerts_today > 0 ? 'red' : 'green'}
      />
    </div>
  )
}
