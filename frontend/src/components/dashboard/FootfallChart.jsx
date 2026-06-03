import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs">
      <div className="text-purple-300/70 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function FootfallChart({ hours = 24 }) {
  const { data, loading } = useApi(() => api.getFootfall(hours), [hours], { refreshInterval: 60_000 })
  const rows = Array.isArray(data) ? data : []

  const chartData = rows.map(d => ({
    time: d.hour ? format(new Date(d.hour), 'HH:mm') : '—',
    Entries: d.entries || 0,
    Exits: d.exits || 0,
    Occupancy: d.peak_occupancy || 0,
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="stat-label">Footfall — Last {hours}h</div>
        {loading && <span className="text-xs text-purple-400/50 animate-pulse">Loading…</span>}
      </div>
      {chartData.length === 0 && !loading ? (
        <div className="h-40 flex items-center justify-center text-purple-400/40 text-sm">
          No data yet — start the AI service to populate
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gEntries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b45f5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b45f5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gExits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
            <XAxis dataKey="time" tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a78bfa' }} />
            <Area type="monotone" dataKey="Entries" stroke="#8b45f5" fill="url(#gEntries)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Exits" stroke="#22c55e" fill="url(#gExits)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
