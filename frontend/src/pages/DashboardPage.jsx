import KPICards from '../components/dashboard/KPICards.jsx'
import OccupancyGauge from '../components/dashboard/OccupancyGauge.jsx'
import LiveEventFeed from '../components/dashboard/LiveEventFeed.jsx'
import FootfallChart from '../components/dashboard/FootfallChart.jsx'
import QueueMonitor from '../components/dashboard/QueueMonitor.jsx'
import AlertPanel from '../components/alerts/AlertPanel.jsx'
import CameraGrid from '../components/cameras/CameraGrid.jsx'

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <AlertPanel />
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OccupancyGauge />
        <div className="lg:col-span-2">
          <FootfallChart hours={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveEventFeed />
        </div>
        <QueueMonitor />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Camera Status</h2>
        <CameraGrid />
      </div>
    </div>
  )
}
