import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

export default function QueueTrendChart() {
  const { data, loading } = useApi(() => api.getQueueTrend(8), [], { refreshInterval: 60_000 })

  // Separate by camera
  const cam4 = (data || []).filter(d => d.camera_id === 'CAM4').map(d => ({
    t: format(new Date(d.bucket), 'HH:mm'),
    CAM4: d.avg_queue_depth
  }))
  const cam5 = (data || []).filter(d => d.camera_id === 'CAM5').map(d => ({
    t: format(new Date(d.bucket), 'HH:mm'),
    CAM5: d.avg_queue_depth
  }))

  // Merge by time
  const merged = {}
  cam4.forEach(d => { merged[d.t] = { ...merged[d.t], t: d.t, CAM4: d.CAM4 } })
  cam5.forEach(d => { merged[d.t] = { ...merged[d.t], t: d.t, CAM5: d.CAM5 } })
  const chartData = Object.values(merged).sort((a, b) => a.t.localeCompare(b.t))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="stat-label">Queue Depth — Last 8h</div>
          <div className="text-xs text-purple-400/50 mt-0.5">CAM4 Billing · CAM5 Operations</div>
        </div>
        {loading && <span className="text-xs text-purple-400/50 animate-pulse">Loading…</span>}
      </div>
      {chartData.length === 0 && !loading ? (
        <div className="h-40 flex items-center justify-center text-purple-400/40 text-sm">No queue data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2040" />
            <XAxis dataKey="t" tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#a78bfa', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#2a2040', border: '1px solid #3d3060', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#a78bfa' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a78bfa' }} />
            <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Alert', fill: '#ef4444', fontSize: 10 }} />
            <Line type="monotone" dataKey="CAM4" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="CAM5" stroke="#8b45f5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
