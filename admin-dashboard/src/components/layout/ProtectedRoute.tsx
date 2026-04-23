import { Navigate } from 'react-router-dom'
import { isAuthenticated, isTokenExpired } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated() || isTokenExpired()) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
