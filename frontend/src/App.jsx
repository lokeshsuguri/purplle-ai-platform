import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/common/Sidebar.jsx'
import Header from './components/common/Header.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import CamerasPage from './pages/CamerasPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import { useSocketStore } from './store/socketStore.js'
import { useEffect } from 'react'

export default function App() {
  const connect = useSocketStore(s => s.connect)

  useEffect(() => {
    connect()
    return () => useSocketStore.getState().disconnect()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
