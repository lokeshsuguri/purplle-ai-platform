import { useApi } from '../hooks/useApi.js'
import { api } from '../services/api.js'
import { useSocketStore } from '../store/socketStore.js'
import { format } from 'date-fns'
import clsx from 'clsx'

const EVENT_META = {
  CROWD_ALERT: { icon:'🚨', color:'text-red-400', bg:'bg-red-900/20 border-red-800/30' },
  QUEUE_ALERT: { icon:'🟠', color:'text-orange-400', bg:'bg-orange-900/20 border-orange-800/30' },
}

export default function AlertsPage() {
  const { data, loading, refetch } = useApi(
    () => api.getEvents({ is_alert: true, limit: 50 }),
    [],
    { refreshInterval: 30_000 }
  )
  const crowdAlerts = useSocketStore(s => s.crowdAlerts)
  const acknowledgeAlert = useSocketStore(s => s.acknowledgeAlert)

  const alerts = data?.events || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Alert History</h1>
        <button onClick={refetch} className="text-xs text-purple-400 hover:text-white px-3 py-1.5 bg-surface-card rounded-lg border border-surface-border transition-colors">
          Refresh
        </button>
      </div>

      {/* Active alerts */}
      {crowdAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="stat-label">Active — Requires Action</div>
          {crowdAlerts.map(a => (
            <div key={a.id} className="card border-red-500/30 bg-red-900/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-red-300">🚨 CROWD ALERT · {a.severity}</div>
                <div className="text-xs text-red-300/70 mt-0.5">
                  Occupancy {a.current_count}/{a.threshold} · {a.camera_id}
                </div>
              </div>
              <button
                onClick={() => acknowledgeAlert(a.id)}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-900/50 text-red-300 hover:bg-red-900 border border-red-700/50 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Historical */}
      <div className="card">
        <div className="stat-label mb-3">Alert History (last 50)</div>
        {loading && <div className="text-purple-400/50 text-sm py-4 text-center animate-pulse">Loading…</div>}
        {!loading && alerts.length === 0 && (
          <div className="text-purple-400/40 text-sm py-8 text-center">No alerts recorded yet</div>
        )}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {alerts.map((a, i) => {
            const meta = EVENT_META[a.event_type] || EVENT_META.CROWD_ALERT
            return (
              <div key={a._id || i} className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-xs border', meta.bg)}>
                <span>{meta.icon}</span>
                <span className={clsx('font-semibold w-28 shrink-0', meta.color)}>{a.event_type}</span>
                <span className="text-purple-300/60 w-12 shrink-0">{a.camera_id}</span>
                <span className="text-purple-200/70 flex-1">
                  {a.crowd?.current_count ? `Occupancy: ${a.crowd.current_count} [${a.crowd.severity}]` : ''}
                  {a.queue?.depth !== undefined ? `Queue: ${a.queue.depth} persons` : ''}
                </span>
                <span className={clsx('shrink-0', a.acknowledged ? 'text-green-400/60' : 'text-purple-400/40')}>
                  {a.acknowledged ? '✓ Ack' : format(new Date(a.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
