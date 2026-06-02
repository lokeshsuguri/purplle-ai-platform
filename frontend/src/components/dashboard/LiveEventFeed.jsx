import { useSocketStore } from '../../store/socketStore.js'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import clsx from 'clsx'
import { format } from 'date-fns'

const EVENT_META = {
  ENTRY:       { icon: '🟢', color: 'text-green-400',  bg: 'bg-green-900/20' },
  EXIT:        { icon: '🔴', color: 'text-red-400',    bg: 'bg-red-900/20'   },
  DWELL_TIME:  { icon: '🟡', color: 'text-amber-400',  bg: 'bg-amber-900/20' },
  QUEUE_ALERT: { icon: '🟠', color: 'text-orange-400', bg: 'bg-orange-900/20'},
  CROWD_ALERT: { icon: '🚨', color: 'text-red-300',    bg: 'bg-red-900/30'   },
}

function EventRow({ event }) {
  const meta = EVENT_META[event.event_type] || EVENT_META.ENTRY
  const ts = new Date(event.timestamp)
  const detail = event.payload?.dwell?.duration_seconds
    ? `${event.payload.dwell.duration_seconds}s · ${event.payload.dwell.zone || ''}`
    : event.payload?.queue?.depth !== undefined
    ? `Queue: ${event.payload.queue.depth} persons`
    : event.payload?.crowd?.current_count
    ? `Count: ${event.payload.crowd.current_count} [${event.payload.crowd.severity}]`
    : `Track #${event.payload?.person?.track_id ?? '—'}`

  return (
    <div className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-xs animate-fade-in', meta.bg)}>
      <span>{meta.icon}</span>
      <span className={clsx('font-semibold w-24 shrink-0', meta.color)}>{event.event_type}</span>
      <span className="text-purple-300/60 w-12 shrink-0">{event.camera_id}</span>
      <span className="text-purple-200/80 flex-1 truncate">{detail}</span>
      <span className="text-purple-400/50 shrink-0">{format(ts, 'HH:mm:ss')}</span>
    </div>
  )
}

export default function LiveEventFeed() {
  const liveEvents = useSocketStore(s => s.liveEvents)
  const { data: initialEvents } = useApi(
    () => api.getEvents({ limit: 20 }),
    [],
    {}
  )

  const events = liveEvents.length > 0 ? liveEvents : (initialEvents?.events || [])

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="stat-label">Live Event Feed</div>
        <span className="text-xs text-purple-400/50">{events.length} events</span>
      </div>
      <div className="space-y-1 overflow-y-auto max-h-80 pr-1">
        {events.length === 0 && (
          <div className="text-center text-purple-400/40 py-8 text-sm">Waiting for events…</div>
        )}
        {events.slice(0, 40).map((ev, i) => (
          <EventRow key={ev.id || ev._id || i} event={ev} />
        ))}
      </div>
    </div>
  )
}
