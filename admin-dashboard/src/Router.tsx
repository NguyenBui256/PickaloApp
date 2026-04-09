import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'

export default function Router() {
  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/users" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-2xl font-bold">User Management</h1></div>
              </ProtectedRoute>
            } />
            <Route path="/venues" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-2xl font-bold">Venue Management</h1></div>
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-2xl font-bold">Booking Oversight</h1></div>
              </ProtectedRoute>
            } />
            <Route path="/content" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-2xl font-bold">Content Moderation</h1></div>
              </ProtectedRoute>
            } />
            <Route path="/audit-log" element={
              <ProtectedRoute>
                <div className="p-8"><h1 className="text-2xl font-bold">Audit Log</h1></div>
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}
