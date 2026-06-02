import { useSocketStore } from '../../store/socketStore.js'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import clsx from 'clsx'

export default function OccupancyGauge() {
  const liveOccupancy = useSocketStore(s => s.occupancy)
  const { data: fallback } = useApi(() => api.getLiveOccupancy(), [], { refreshInterval: 10_000 })

  const data = liveOccupancy || fallback
  const count = data?.current_count ?? 0
  const threshold = data?.threshold ?? 50
  const pct = Math.min(100, Math.round((count / threshold) * 100))

  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'
  const label = pct >= 90 ? 'OVER CAPACITY' : pct >= 70 ? 'HIGH' : pct >= 40 ? 'MODERATE' : 'LOW'

  const R = 70
  const cx = 90, cy = 90
  const circumference = Math.PI * R
  const progress = (pct / 100) * circumference
  const startX = cx - R, startY = cy
  const endX = cx + R, endY = cy

  return (
    <div className="card flex flex-col items-center">
      <div className="stat-label mb-3">Store Occupancy</div>
      <svg viewBox="0 0 180 100" className="w-48 h-28">
        <path d={`M ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY}`}
          fill="none" stroke="#2a2040" strokeWidth="14" strokeLinecap="round" />
        <path d={`M ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="Inter">{count}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#a78bfa" fontSize="10" fontFamily="Inter">of {threshold}</text>
      </svg>
      <div className={clsx('mt-1 px-3 py-1 rounded-full text-xs font-semibold',
        pct >= 90 ? 'bg-red-900/50 text-red-300' :
        pct >= 70 ? 'bg-amber-900/50 text-amber-300' : 'bg-green-900/50 text-green-300')}>
        {label}
      </div>
      <div className="mt-3 w-full grid grid-cols-2 gap-2 text-center">
        <div className="bg-surface-tertiary rounded-lg p-2">
          <div className="text-xs text-purple-300/60">Entries</div>
          <div className="text-sm font-bold text-white">{data?.today_entries ?? '—'}</div>
        </div>
        <div className="bg-surface-tertiary rounded-lg p-2">
          <div className="text-xs text-purple-300/60">Exits</div>
          <div className="text-sm font-bold text-white">{data?.today_exits ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
