import { useApi } from '../../hooks/useApi.js'
import { useSocketStore } from '../../store/socketStore.js'
import { api } from '../../services/api.js'
import clsx from 'clsx'
import { format } from 'date-fns'

const CAMERA_ROLE_ICONS = {
  browsing: '🛍',
  entry_exit: '🚪',
  billing: '💳',
  operations: '⚙️',
}

function CameraCard({ camera, lastEvent }) {
  const isOnline = camera.status === 'online'
  return (
    <div className="card-sm">
      {/* Simulated camera view */}
      <div className="relative rounded-lg bg-black/60 border border-surface-border aspect-video mb-3 overflow-hidden flex items-center justify-center">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent animate-pulse-slow pointer-events-none" />
        <div className="text-center">
          <div className="text-3xl">{CAMERA_ROLE_ICONS[camera.role]}</div>
          <div className="text-xs text-purple-400/50 mt-1">{camera.location}</div>
        </div>
        {/* Status dot */}
        <div className={clsx(
          'absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
          isOnline ? 'bg-green-900/70 text-green-400' : 'bg-red-900/70 text-red-400'
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
          {camera.status.toUpperCase()}
        </div>
        {/* Camera ID badge */}
        <div className="absolute top-2 left-2 bg-black/60 text-purple-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
          {camera.camera_id}
        </div>
      </div>
      <div className="font-semibold text-white text-sm">{camera.name}</div>
      <div className="text-xs text-purple-400/60 mt-0.5">{camera.location}</div>
      {lastEvent && (
        <div className="mt-2 text-[10px] text-purple-400/40 truncate">
          Last: {lastEvent.event_type} · {format(new Date(lastEvent.timestamp), 'HH:mm:ss')}
        </div>
      )}
    </div>
  )
}

export default function CameraGrid() {
  const { data: cameras, loading } = useApi(() => api.getCameras(), [], { refreshInterval: 30_000 })
  const liveEvents = useSocketStore(s => s.liveEvents)

  // Last event per camera
  const lastEvents = {}
  for (const ev of liveEvents) {
    if (!lastEvents[ev.camera_id]) lastEvents[ev.camera_id] = ev
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card-sm animate-pulse">
            <div className="aspect-video bg-surface-tertiary rounded-lg mb-3" />
            <div className="h-3 bg-surface-tertiary rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  const cams = cameras?.length ? cameras : [
    { camera_id:'CAM1', name:'Browsing Zone A', location:'Aisle 1-3', role:'browsing', status:'online' },
    { camera_id:'CAM2', name:'Browsing Zone B', location:'Aisle 4-6', role:'browsing', status:'online' },
    { camera_id:'CAM3', name:'Main Entrance',   location:'Entrance', role:'entry_exit', status:'online' },
    { camera_id:'CAM4', name:'Billing Counter', location:'Checkout', role:'billing', status:'online' },
    { camera_id:'CAM5', name:'Ops Counter',     location:'Service', role:'operations', status:'online' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cams.map(cam => (
        <CameraCard key={cam.camera_id} camera={cam} lastEvent={lastEvents[cam.camera_id]} />
      ))}
    </div>
  )
}
