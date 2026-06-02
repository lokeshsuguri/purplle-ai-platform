import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'

const ZONE_COLORS = {
  aisle_skincare: '#a975f8',
  aisle_makeup:   '#f472b6',
  aisle_haircare: '#38bdf8',
  general:        '#94a3b8',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-xl">
      <div className="font-medium text-white mb-1">{d.label}</div>
      <div className="text-purple-300/60">Avg: <span className="text-white font-bold">{d.avg_dwell_seconds}s</span></div>
      <div className="text-purple-300/60">Visits: <span className="text-white font-bold">{d.count}</span></div>
      <div className="mt-1.5 space-y-0.5">
        <div className="text-purple-300/40">&lt;30s: {d.under_30s}</div>
        <div className="text-purple-300/40">30–120s: {d.s30_to_120}</div>
        <div className="text-purple-300/40">&gt;120s: {d.over_120s}</div>
      </div>
    </div>
  )
}

export default function DwellChart() {
  const { data, loading } = useApi(() => api.getDwell(), [], { refreshInterval: 120_000 })

  const chartData = (data || []).map(d => ({
    label: `${d.camera_id} · ${d.zone?.replace('aisle_', '') || 'general'}`,
    avg_dwell_seconds: d.avg_dwell_seconds,
    count: d.count,
    zone: d.zone,
    under_30s: d.distribution?.under_30s || 0,
    s30_to_120: d.distribution?.s30_to_120 || 0,
    over_120s: d.distribution?.over_120s || 0,
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="stat-label">Dwell Time by Zone (seconds)</div>
        {loading && <span className="text-xs text-purple-400/40 animate-pulse">Loading…</span>}
      </div>
      {chartData.length === 0 && !loading ? (
        <div className="h-48 flex items-center justify-center text-purple-400/30 text-sm">No dwell data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg_dwell_seconds" name="Avg Dwell (s)" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={ZONE_COLORS[d.zone] || ZONE_COLORS.general} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
