import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useSelector((state: RootState) => state.auth)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
