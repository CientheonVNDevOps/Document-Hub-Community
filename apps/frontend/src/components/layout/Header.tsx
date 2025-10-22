import { Menu, Search, Bell, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDispatch } from 'react-redux'
import { logout } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  user: any
  onMenuClick: () => void
}

export const Header = ({ user, onMenuClick }: HeaderProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await dispatch(logout() as any)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              className="w-64"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="text-sm">
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500">{user?.email}</div>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
