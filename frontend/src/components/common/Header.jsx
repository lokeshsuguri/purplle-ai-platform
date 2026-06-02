import { useSocketStore } from '../../store/socketStore.js'
import clsx from 'clsx'

export default function Header() {
  const { connected, crowdAlerts } = useSocketStore()
  const now = new Date()

  return (
    <header className="h-14 bg-surface-secondary border-b border-surface-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">Store Intelligence Platform</h1>
        <span className="text-xs text-purple-400/50">
          {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Alert badge */}
        {crowdAlerts.length > 0 && (
          <div className="badge-alert animate-pulse">
            🚨 {crowdAlerts.length} crowd alert{crowdAlerts.length > 1 ? 's' : ''}
          </div>
        )}

        {/* WebSocket indicator */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
          connected
            ? 'bg-green-900/30 text-green-400 border-green-700/40'
            : 'bg-red-900/30 text-red-400 border-red-700/40'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </div>
    </header>
  )
}
