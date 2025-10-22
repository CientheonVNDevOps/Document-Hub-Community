import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotePage } from '@/pages/NotePage'
import { AdminPage } from '@/pages/AdminPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/note/:id" element={<NotePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
