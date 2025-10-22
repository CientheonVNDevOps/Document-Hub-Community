import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Folder, 
  Plus, 
  Trash2,
  ChevronRight,
  ChevronDown,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const { user } = useAuth()

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  // Mock data - in real app, this would come from Redux store
  const folders = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Personal', parent_id: null },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Work', parent_id: null },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Projects', parent_id: '550e8400-e29b-41d4-a716-446655440002' },
  ]

  const notes = [
    { id: '550e8400-e29b-41d4-a716-446655440011', title: 'Meeting Notes', folder_id: '550e8400-e29b-41d4-a716-446655440002' },
    { id: '550e8400-e29b-41d4-a716-446655440012', title: 'Ideas', folder_id: '550e8400-e29b-41d4-a716-446655440001' },
    { id: '550e8400-e29b-41d4-a716-446655440013', title: 'Project Plan', folder_id: '550e8400-e29b-41d4-a716-446655440003' },
  ]

  return (
    <div className={cn(
      "bg-white border-r transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {isOpen && <h2 className="text-lg font-semibold">Notes</h2>}
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <FileText className="h-4 w-4 mr-2" />
              {isOpen && "All Notes"}
            </Link>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/trash">
              <Trash2 className="h-4 w-4 mr-2" />
              {isOpen && "Trash"}
            </Link>
          </Button>
          
          {user?.role === 'admin' && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin">
                <Shield className="h-4 w-4 mr-2" />
                {isOpen && "Admin Panel"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Folders</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {folders.map((folder) => (
              <div key={folder.id}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8"
                  onClick={() => toggleFolder(folder.id)}
                >
                  {expandedFolders.includes(folder.id) ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  <Folder className="h-3 w-3 mr-2" />
                  {folder.name}
                </Button>
                
                {expandedFolders.includes(folder.id) && (
                  <div className="ml-4 space-y-1">
                    {notes
                      .filter(note => note.folder_id === folder.id)
                      .map((note) => (
                        <Button
                          key={note.id}
                          variant="ghost"
                          className="w-full justify-start h-7 text-sm"
                          asChild
                        >
                          <Link to={`/note/${note.id}`}>
                            <FileText className="h-3 w-3 mr-2" />
                            {note.title}
                          </Link>
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
