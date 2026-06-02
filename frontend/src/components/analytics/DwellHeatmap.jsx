import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell
} from 'recharts'

const ZONE_LABELS = {
  aisle_skincare: 'Skincare',
  aisle_makeup: 'Makeup',
  aisle_haircare: 'Haircare',
  general: 'General',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs">
      <div className="font-semibold text-white mb-1">{d.zone}</div>
      <div className="text-purple-300">Avg dwell: <span className="text-white font-bold">{d.avg}s</span></div>
      <div className="text-purple-300/60">Max: {d.max}s · Visits: {d.count}</div>
      <div className="text-purple-400/50 mt-1 text-[10px]">
        &lt;30s: {d.under30} · 30–120s: {d.mid} · &gt;120s: {d.over120}
      </div>
    </div>
  )
}

export default function DwellHeatmap() {
  const { data, loading } = useApi(() => api.getDwell(), [], { refreshInterval: 120_000 })

  const chartData = (data || []).map(d => ({
    zone: ZONE_LABELS[d.zone] || d.zone,
    camera: d.camera_id,
    avg: d.avg_dwell_seconds,
    max: d.max_dwell_seconds,
    count: d.count,
    under30: d.distribution?.under_30s || 0,
    mid: d.distribution?.s30_to_120 || 0,
    over120: d.distribution?.over_120s || 0,
  }))

  const maxAvg = Math.max(...chartData.map(d => d.avg), 1)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="stat-label">Dwell Time by Zone</div>
          <div className="text-xs text-purple-400/50 mt-0.5">CAM1 & CAM2 · Browsing areas</div>
        </div>
        {loading && <span className="text-xs text-purple-400/50 animate-pulse">Loading…</span>}
      </div>
      {chartData.length === 0 && !loading ? (
        <div className="h-40 flex items-center justify-center text-purple-400/40 text-sm">
          No dwell data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
            <XAxis dataKey="zone" tick={{ fill: '#a78bfa', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} unit="s" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Avg Dwell (s)" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => {
                const intensity = entry.avg / maxAvg
                const r = Math.round(139 + (intensity * 80))
                const g = Math.round(69 - (intensity * 30))
                const b = Math.round(245 - (intensity * 60))
                return <Cell key={i} fill={`rgb(${r},${g},${b})`} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
