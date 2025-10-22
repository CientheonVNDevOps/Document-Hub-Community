import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface OtpData {
  email: string
  otp: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async requestOtp(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/request-otp', { email })
    return response.data
  },

  async verifyOtp(data: OtpData): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', data)
    return response.data
  },

  async logout(): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/logout')
      // Clear token from localStorage
      localStorage.removeItem('token')
      return response.data
    } catch (error) {
      // Even if the API call fails, we should still clear local storage
      localStorage.removeItem('token')
      throw error
    }
  },

  async getProfile(): Promise<AuthResponse['user']> {
    const response = await api.get('/users/profile')
    return response.data
  },
}
