import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
