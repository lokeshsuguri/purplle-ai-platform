import { useSocketStore } from '../../store/socketStore.js'
import clsx from 'clsx'
import { format } from 'date-fns'

function AlertCard({ alert, onAck }) {
  const severityStyle = {
    HIGH:   'border-red-500/50 bg-red-900/20 text-red-300',
    MEDIUM: 'border-amber-500/50 bg-amber-900/20 text-amber-300',
    LOW:    'border-yellow-500/50 bg-yellow-900/20 text-yellow-300',
  }[alert.severity] || 'border-red-500/50 bg-red-900/20 text-red-300'

  return (
    <div className={clsx('border rounded-lg p-3 animate-slide-up', severityStyle)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <span className="font-semibold text-sm">CROWD ALERT · {alert.severity}</span>
          </div>
          <div className="text-xs mt-1 opacity-80">
            Occupancy: {alert.current_count}/{alert.threshold} persons
            {alert.camera_id && ` · ${alert.camera_id}`}
          </div>
          <div className="text-xs opacity-60 mt-0.5">
            {format(new Date(alert.timestamp || Date.now()), 'HH:mm:ss')}
          </div>
        </div>
        <button
          onClick={() => onAck(alert.id)}
          className="shrink-0 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default function AlertPanel() {
  const { crowdAlerts, acknowledgeAlert } = useSocketStore()

  if (crowdAlerts.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="stat-label">Active Alerts</div>
      {crowdAlerts.map(a => (
        <AlertCard key={a.id} alert={a} onAck={acknowledgeAlert} />
      ))}
    </div>
  )
}
