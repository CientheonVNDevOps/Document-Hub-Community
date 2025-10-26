import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { VersionProvider } from '@/contexts/VersionContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotePage } from '@/pages/NotePage'
import { AdminPage } from '@/pages/AdminPage'
import { TrashPage } from './pages/TrashPage'

function App() {
  return (
    <AuthProvider>
      <VersionProvider>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/note/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <NotePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/note/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <NotePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <Layout>
                <TrashPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trash"
          element={
            <ProtectedRoute>
              <Layout>
                <TrashPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      </VersionProvider>
    </AuthProvider>
  )
}

export default App
