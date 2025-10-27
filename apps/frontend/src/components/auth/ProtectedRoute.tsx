import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from './AuthProvider'
import { RootState } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useSelector((state: RootState) => state.auth)
  const { isInitializing } = useAuth()

  // Wait for initialization before redirecting
  if (isInitializing) {
    return null
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
