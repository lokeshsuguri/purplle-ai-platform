import CameraGrid from '../components/cameras/CameraGrid.jsx'
import LiveEventFeed from '../components/dashboard/LiveEventFeed.jsx'

export default function CamerasPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-lg font-bold text-white">Camera Management</h1>
      <CameraGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveEventFeed />
        <div className="card">
          <div className="stat-label mb-3">Camera Roles</div>
          <div className="space-y-2 text-sm">
            {[
              { id:'CAM1', role:'Browsing A', tasks:'Dwell time · Zone analytics' },
              { id:'CAM2', role:'Browsing B', tasks:'Dwell time · Zone analytics' },
              { id:'CAM3', role:'Entry/Exit', tasks:'ENTRY · EXIT · Footfall count' },
              { id:'CAM4', role:'Billing',    tasks:'Queue depth · Wait time est.' },
              { id:'CAM5', role:'Operations', tasks:'Queue depth · Staff utilisation' },
            ].map(c => (
              <div key={c.id} className="flex flex-col gap-2 py-2 border-b border-surface-border last:border-0 sm:flex-row sm:items-center">
                <span className="font-mono text-brand-400 w-12">{c.id}</span>
                <span className="text-white min-w-0 sm:w-28 truncate">{c.role}</span>
                <span className="text-purple-300/60 flex-1 min-w-0 truncate">{c.tasks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
