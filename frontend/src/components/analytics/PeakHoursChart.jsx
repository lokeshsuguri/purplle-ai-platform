import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a',
                     '12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs">
      <div className="text-purple-300/70 mb-1">{HOUR_LABELS[label] || label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function PeakHoursChart() {
  const { data, loading } = useApi(() => api.getPeakHours(7), [], { refreshInterval: 300_000 })

  const full = Array.from({ length: 24 }, (_, i) => {
    const found = (data || []).find(d => d.hour === i)
    return { hour: i, label: HOUR_LABELS[i], entries: found?.entries || 0, exits: found?.exits || 0, total: found?.total_footfall || 0 }
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="stat-label">Peak Hours Analysis</div>
          <div className="text-xs text-purple-400/50 mt-0.5">7-day average · All cameras</div>
        </div>
        {loading && <span className="text-xs text-purple-400/50 animate-pulse">Loading…</span>}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={full} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
          <XAxis dataKey="label" tick={{ fill: '#a78bfa', fontSize: 9 }} tickLine={false} axisLine={false}
            interval={2} />
          <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a78bfa' }} />
          <Bar dataKey="entries" name="Entries" fill="#8b45f5" opacity={0.8} radius={[2,2,0,0]} />
          <Bar dataKey="exits" name="Exits" fill="#22c55e" opacity={0.6} radius={[2,2,0,0]} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#f59e0b"
            strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
