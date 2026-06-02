import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || ''

export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  // Live data streams
  liveEvents: [],           // last 100 events
  occupancy: null,          // { current_count, threshold, today_entries, today_exits, peak_today }
  crowdAlerts: [],          // unacknowledged crowd alerts
  queueAlerts: [],          // recent queue alerts

  connect() {
    if (get().socket) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      set({ connected: true })
    })

    socket.on('disconnect', () => {
      set({ connected: false })
    })

    socket.on('live:event', (event) => {
      set(state => ({
        liveEvents: [event, ...state.liveEvents].slice(0, 100),
        // Accumulate queue alerts
        queueAlerts: event.event_type === 'QUEUE_ALERT' && event.is_alert
          ? [event, ...state.queueAlerts].slice(0, 20)
          : state.queueAlerts,
      }))
    })

    socket.on('occupancy:update', (data) => {
      set({ occupancy: data })
    })

    socket.on('alert:crowd', (alert) => {
      set(state => ({
        crowdAlerts: [
          { ...alert, id: Date.now(), acknowledged: false },
          ...state.crowdAlerts,
        ].slice(0, 10),
      }))
      // Browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('🚨 Crowd Alert — Purplle Store', {
          body: `Occupancy: ${alert.current_count}/${alert.threshold} (${alert.severity})`,
        })
      }
    })

    socket.on('alert:acknowledged', ({ eventId }) => {
      set(state => ({
        crowdAlerts: state.crowdAlerts.filter(a => a.id !== eventId),
      }))
    })

    set({ socket })
  },

  disconnect() {
    get().socket?.disconnect()
    set({ socket: null, connected: false })
  },

  acknowledgeAlert(id) {
    const { socket } = get()
    socket?.emit('alert:ack', { eventId: id })
    set(state => ({
      crowdAlerts: state.crowdAlerts.filter(a => a.id !== id),
    }))
  },
}))
