import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import { format } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs shadow-xl">
      <div className="text-purple-300/60 mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-purple-300/80">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function FootfallChart({ hours = 24 }) {
  const { data, loading } = useApi(() => api.getFootfall(hours), [hours], { refreshInterval: 60_000 })

  const chartData = (data || []).map(d => ({
    hour: format(new Date(d.hour), 'HH:mm'),
    Entries: d.entries,
    Exits: d.exits,
    'Net Footfall': d.net_footfall,
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="stat-label">Hourly Footfall — Past {hours}h</div>
        {loading && <span className="text-xs text-purple-400/40 animate-pulse">Loading…</span>}
      </div>
      {chartData.length === 0 && !loading ? (
        <div className="h-48 flex items-center justify-center text-purple-400/30 text-sm">
          No footfall data yet. Start the AI service to populate.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gEntry" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
            <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            <Area type="monotone" dataKey="Entries" stroke="#22c55e" strokeWidth={2} fill="url(#gEntry)" dot={false} />
            <Area type="monotone" dataKey="Exits"   stroke="#ef4444" strokeWidth={2} fill="url(#gExit)"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
