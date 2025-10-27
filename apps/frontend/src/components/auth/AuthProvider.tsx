import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { authService } from '@/services/authService'

interface AuthContextType {
  user: any
  isLoading: boolean
  isInitializing: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch()
  const { user, token, isLoading } = useSelector((state: RootState) => state.auth)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // Only fetch profile if we have a token but no user data
      if (token && !user) {
        try {
          const userData = await authService.getProfile()
          dispatch(setUser(userData))
        } catch (error: any) {
          // Silently handle auth errors - token might be expired or invalid
          if (error?.response?.status !== 401) {
            console.error('Failed to get user profile:', error)
          }
          // Clear invalid token
          localStorage.removeItem('token')
        }
      }
      setIsInitializing(false)
    }

    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const value = {
    user,
    isLoading: isLoading || isInitializing,
    isInitializing,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
