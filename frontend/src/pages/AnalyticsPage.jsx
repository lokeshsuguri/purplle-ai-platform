import FootfallChart from '../components/dashboard/FootfallChart.jsx'
import DwellHeatmap from '../components/analytics/DwellHeatmap.jsx'
import PeakHoursChart from '../components/analytics/PeakHoursChart.jsx'
import QueueTrendChart from '../components/analytics/QueueTrendChart.jsx'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-lg font-bold text-white">Analytics & Business Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FootfallChart hours={48} />
        <PeakHoursChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DwellHeatmap />
        <QueueTrendChart />
      </div>

      {/* Business insights summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="stat-label mb-2">💡 Insight: Dwell Zones</div>
          <p className="text-sm text-purple-200/70">
            High dwell in Skincare aisle suggests strong engagement.
            Consider upsell placement near CAM1 zone.
          </p>
        </div>
        <div className="card">
          <div className="stat-label mb-2">💡 Insight: Peak Hours</div>
          <p className="text-sm text-purple-200/70">
            Traffic peaks 11am–2pm. Staff additional checkout agents
            during this window to reduce queue alerts.
          </p>
        </div>
        <div className="card">
          <div className="stat-label mb-2">💡 Insight: Conversion Proxy</div>
          <p className="text-sm text-purple-200/70">
            Entry-to-billing ratio tracks conversion. Low ratio may
            indicate browse abandonment near exits.
          </p>
        </div>
      </div>
    </div>
  )
}
