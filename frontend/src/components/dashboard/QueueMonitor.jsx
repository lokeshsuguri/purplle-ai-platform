import { useSocketStore } from '../../store/socketStore.js'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import clsx from 'clsx'

function QueueBar({ cameraId, depth, maxDepth = 10 }) {
  const pct = Math.min(100, Math.round((depth / maxDepth) * 100))
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-brand-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-purple-300/70 font-medium">{cameraId}</span>
        <span className={clsx('font-bold', pct >= 80 ? 'text-red-400' : pct >= 50 ? 'text-amber-400' : 'text-white')}>
          {depth} in queue
        </span>
      </div>
      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-purple-400/40">~{depth * 45}s wait</div>
    </div>
  )
}

export default function QueueMonitor() {
  const liveEvents = useSocketStore(s => s.liveEvents)

  // Extract latest queue depth per camera from live stream
  const queueState = { CAM4: 0, CAM5: 0 }
  for (const ev of liveEvents) {
    if (ev.event_type === 'QUEUE_ALERT' && ev.payload?.queue?.depth !== undefined) {
      queueState[ev.camera_id] = ev.payload.queue.depth
    }
  }

  return (
    <div className="card">
      <div className="stat-label mb-4">Queue Monitor</div>
      <div className="space-y-4">
        <QueueBar cameraId="CAM4 · Billing" depth={queueState.CAM4} />
        <QueueBar cameraId="CAM5 · Operations" depth={queueState.CAM5} />
      </div>
      <div className="mt-4 text-xs text-purple-400/40 text-center">
        Alert threshold: 5 persons · Est. 45s/person
      </div>
    </div>
  )
}
