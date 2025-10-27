import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Only redirect to login if not already on a public page
      const currentPath = window.location.pathname
      const publicPaths = ['/login', '/register', '/docs']
      if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/docs')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
