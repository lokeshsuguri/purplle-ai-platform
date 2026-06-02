const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Analytics
  getKPI:         () => request('/analytics/kpi'),
  getFootfall:    (hours = 24) => request(`/analytics/footfall?hours=${hours}`),
  getDwell:       () => request('/analytics/dwell'),
  getQueueTrend:  (hours = 8) => request(`/analytics/queue?hours=${hours}`),
  getPeakHours:   (days = 7) => request(`/analytics/peak-hours?days=${days}`),

  // Events
  getEvents:      (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/events?${qs}`)
  },

  // Occupancy
  getLiveOccupancy: () => request('/occupancy/live'),

  // Cameras
  getCameras:     () => request('/cameras'),

  // Health
  health:         () => fetch('/health').then(r => r.json()),
}
