import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { authService } from '@/services/authService'

interface AuthContextType {
  user: any
  isLoading: boolean
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

  useEffect(() => {
    const initializeAuth = async () => {
      if (token && !user) {
        try {
          const userData = await authService.getProfile()
          dispatch(setUser(userData))
        } catch (error) {
          console.error('Failed to get user profile:', error)
        }
      }
    }

    initializeAuth()
  }, [token, user, dispatch])

  const value = {
    user,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
