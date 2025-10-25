import { useState } from 'react'
import { Menu, Search, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDispatch } from 'react-redux'
import { logout } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { SearchModal } from '@/components/ui/search-modal'
import { useSearchShortcut } from '@/hooks/useSearchShortcut'

interface HeaderProps {
  user: any
  onMenuClick: () => void
}

export const Header = ({ user, onMenuClick }: HeaderProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Add Command+K shortcut
  useSearchShortcut(() => setIsSearchOpen(true))

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
              placeholder="Search notes... (⌘K)"
              className="w-64 cursor-pointer"
              readOnly
              onClick={() => setIsSearchOpen(true)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4"> 
          <div className="flex items-center space-x-3">
          <User className="h-5 w-5 mr-2" />
            <div className="text-sm">
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500">{user?.email}</div>
            </div>
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
      
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </header>
  )
}
