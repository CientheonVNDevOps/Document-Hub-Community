import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService } from '@/services/authService'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials)
    localStorage.setItem('token', response.access_token)
    return response
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; name: string }) => {
    const response = await authService.register(userData)
    return response
  }
)

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (email: string) => {
    const response = await authService.requestOtp(email)
    return response
  }
)

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data: { email: string; otp: string }) => {
    const response = await authService.verifyOtp(data)
    localStorage.setItem('token', response.access_token)
    return response
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout()
    localStorage.removeItem('token')
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder: any) => {
    builder
      // Login
      .addCase(login.pending, (state: any) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state: any, action: any) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.error = null
      })
      .addCase(login.rejected, (state: any, action: any) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      // Register
      .addCase(register.pending, (state: any) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state: any, action: any) => {
        state.isLoading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(register.rejected, (state: any, action: any) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
      })
      // Request OTP
      .addCase(requestOtp.pending, (state: any) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(requestOtp.fulfilled, (state: any) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(requestOtp.rejected, (state: any, action: any) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to send OTP'
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state: any) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(verifyOtp.fulfilled, (state: any, action: any) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.error = null
      })
      .addCase(verifyOtp.rejected, (state: any, action: any) => {
        state.isLoading = false
        state.error = action.error.message || 'Invalid OTP'
      })
      // Logout
      .addCase(logout.fulfilled, (state: any) => {
        state.user = null
        state.token = null
        state.error = null
      })
  },
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
