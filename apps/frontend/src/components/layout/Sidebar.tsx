import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Folder as FolderIcon,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Shield,
  Edit2,
  Check,
  X,
  FilePlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { useVersion } from '@/contexts/VersionContext'
import { notesService, Note, Folder } from '@/services/notesService'
import { useTrashOptimisticUpdate } from '@/hooks/useTrashOptimisticUpdate'
import { VersionDropdown } from '@/components/ui/dropdown-version'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // File creation states
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [selectedFolderForFile, setSelectedFolderForFile] = useState<string | null>(null)

  // Rename states
  const [editingItem, setEditingItem] = useState<{ type: 'folder' | 'note', id: string } | null>(null)
  const [editName, setEditName] = useState('')
  
  // Use shared version context
  const { currentVersion, setCurrentVersion } = useVersion()
  
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { addToTrashOptimistically, addFolderToTrashOptimistically } = useTrashOptimisticUpdate()

  // Move to trash functionality with optimistic updates
  const handleMoveToTrash = async (noteId: string) => {
    let noteToMove: Note | undefined

    try {
      // Optimistic update: Remove from local state immediately
      noteToMove = notesData.find(note => note.id === noteId)
      // Note: We don't need to update local state since we're using React Query data directly

      // Update trash count optimistically
      if (noteToMove) {
        // Add to trash cache immediately for instant UI update
        addToTrashOptimistically(noteToMove)
      }

      // Perform the actual API call
      await notesService.moveToTrash(noteId)
      
      // Invalidate caches to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
    } catch (error) {
      console.error('Failed to move note to trash:', error)
      // Revert optimistic update on error - React Query will handle this automatically
      if (noteToMove) {
        // React Query will refetch and restore the correct state
      }
    }
  }

  // Move folder to trash functionality
  const handleMoveFolderToTrash = async (folderId: string) => {
    let folderToMove: Folder | undefined

    try {
      // Find the folder to move for optimistic updates
      folderToMove = foldersData.find(folder => folder.id === folderId)
      
      // Optimistic update: Remove from folders cache immediately
      if (folderToMove) {
        queryClient.setQueryData(['folders', currentVersion?.id], (oldData: Folder[] = []) => 
          oldData.filter(folder => folder.id !== folderId)
        )
        
        // Add to trash folders cache optimistically using the hook
        addFolderToTrashOptimistically(folderToMove)
      }

      // Perform the actual API call
      const result = await notesService.deleteFolder(folderId)
      
      // Show success message
      if (result.message) {
        console.log(result.message)
      }
      
      // Invalidate caches to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
    } catch (error) {
      console.error('Failed to move folder to trash:', error)
      
      // Show user-friendly error message
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.status === 403) {
          const errorMessage = axiosError.response?.data?.message || 'Cannot delete folder with contents'
          alert(`Error: ${errorMessage}`)
        } else {
          alert('Failed to delete folder. Please try again.')
        }
      } else {
        alert('Failed to delete folder. Please try again.')
      }
      
      // Revert optimistic update on error
      if (folderToMove) {
        queryClient.setQueryData(['folders', currentVersion?.id], (oldData: Folder[] = []) => 
          [...oldData, folderToMove]
        )
        // Remove from trash folders cache
        queryClient.setQueryData(['trash-folders', currentVersion?.id], (oldData: Folder[] = []) => 
          oldData.filter(folder => folder.id !== folderId)
        )
      }
      
      // React Query will refetch and restore the correct state
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
    }
  }

  // Get folders and notes using React Query for better caching
  const { data: foldersData = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentVersion?.id],
    queryFn: () => notesService.getFolders(currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  const { data: notesData = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', currentVersion?.id],
    queryFn: () => notesService.getNotes(undefined, currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Get trash notes count using React Query - filtered by current version
  const { data: trashNotes = [] } = useQuery({
    queryKey: ['trash-notes', currentVersion?.id],
    queryFn: () => notesService.getTrashNotes(currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Get trash folders count using React Query - filtered by current version
  const { data: trashFolders = [] } = useQuery({
    queryKey: ['trash-folders', currentVersion?.id],
    queryFn: () => notesService.getTrashFolders(currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Calculate total trash items count
  const totalTrashItems = trashNotes.length + trashFolders.length

  // Use React Query data directly instead of local state

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      await notesService.createFolder({
        name: newFolderName.trim()
      }, currentVersion?.id)

      // Invalidate and refetch folders data
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })

      // No subfolder support - only root folders

      // Reset form
      setNewFolderName('')
      setIsCreateFolderOpen(false)
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const openCreateFolderDialog = () => {
    setIsCreateFolderOpen(true)
  }

  const openCreateFileDialog = (folderId?: string) => {
    setSelectedFolderForFile(folderId || null)
    setIsCreateFileOpen(true)
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !selectedFolderForFile) return

    try {
      await notesService.createNote({
        title: newFileName.trim(),
        folder_id: selectedFolderForFile
      }, currentVersion?.id)

      // Invalidate and refetch notes data
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })

      // Keep the parent folder open
      setExpandedFolders(prev =>
        prev.includes(selectedFolderForFile)
          ? prev
          : [...prev, selectedFolderForFile]
      )

      // Reset form
      setNewFileName('')
      setSelectedFolderForFile(null)
      setIsCreateFileOpen(false)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  // Rename functions
  const startRename = (type: 'folder' | 'note', id: string, currentName: string) => {
    setEditingItem({ type, id })
    setEditName(currentName)
  }

  const handleRename = async () => {
    if (!editingItem || !editName.trim()) return

    try {
      if (editingItem.type === 'folder') {
        await notesService.renameFolder(editingItem.id, editName.trim())
        // Invalidate and refetch folders data
        queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      } else {
        await notesService.renameNote(editingItem.id, editName.trim())
        // Invalidate and refetch notes data
        queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      }

      setEditingItem(null)
      setEditName('')
    } catch (error) {
      console.error('Failed to rename:', error)
    }
  }

  const cancelRename = () => {
    setEditingItem(null)
    setEditName('')
  }

  // Get root folders (no parent) - only 2 layers: folders and files
  // Sort by updated_at in descending order (newest first)
  const rootFolders = foldersData
    .filter(folder => !folder.parent_id)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return (
    <div className={cn(
      "bg-white border-r transition-all duration-300",
      isOpen ? "w-[350px]" : "w-16"
    )}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          {isOpen &&
            <div className="flex items-center justify-center gap-x-2">
              <img src="/vite.png" alt="Document Hub Cientheon" width={30} height={30} />
              <h2 className="text-lg font-semibold">Document Hub Cientheon</h2>
            </div>
          }
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isOpen && "Dashboard"}
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/dashboard/admin"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isOpen && "Admin Panel"}
            </Link>
          )}
          <Link
            to="/trash"
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isOpen && (
              <div className="flex items-center justify-between w-full">
                <span>Trash</span>
                {totalTrashItems > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    {totalTrashItems}
                  </span>
                )}
              </div>
            )}
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 py-4 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin">
          {/* Version Dropdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Version</h3>
            <VersionDropdown 
              currentVersion={currentVersion}
              onVersionChange={setCurrentVersion}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Folders</h3>
              <div className="flex items-center gap-1">
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openCreateFolderDialog()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
            {foldersLoading || notesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-gray-500">Loading...</div>
              </div>
            ) : rootFolders.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-sm text-gray-500">No folders found</div>
              </div>
            ) : (
              rootFolders.map((folder) => (
                <div key={folder.id} className='max-w-full'>
                  <div className="flex items-center max-w-full gap-1">
                    {editingItem?.type === 'folder' && editingItem.id === folder.id ? (
                      <>
                        <div className="flex-1 flex items-center h-8 min-w-0 px-0 bg-gray-50 rounded-md">
                          <FolderIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-auto text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename()
                              if (e.key === 'Escape') cancelRename()
                            }}
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center flex-shrink-0 gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={handleRename}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={cancelRename}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start h-8 min-w-0 px-0"
                          onClick={() => toggleFolder(folder.id)}
                        >
                          {expandedFolders.includes(folder.id) ? (
                            <ChevronDown className="h-3 w-3 mr-1 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                          )}
                          <FolderIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate flex-1 min-w-0">{folder.name}</span>
                        </Button>
                        <div className="flex items-center flex-shrink-0 gap-0.5">
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => startRename('folder', folder.id, folder.name)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => openCreateFileDialog(folder.id)}
                            >
                              <FilePlus className="h-3 w-3" />
                            </Button>
                          )}
                          {user?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-red-500 hover:text-red-700"
                              onClick={() => handleMoveFolderToTrash(folder.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {expandedFolders.includes(folder.id) && (
                    <div className="ml-4 space-y-1">
                      {/* Files in this folder - 2 layers only */}
                       {(() => {
                         // Sort notes by updated_at in descending order (newest first)
                         const folderNotes = notesData
                           .filter(note => note.folder_id === folder.id)
                           .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                         const isEditingCurrentNote = (noteId: string) => editingItem?.type === 'note' && editingItem.id === noteId;
                         return folderNotes.length === 0 ? (
                          <div className="text-xs text-gray-400 py-1 px-3">
                            No notes in this folder
                          </div>
                        ) : (
                          folderNotes.map((note) => (
                            <div key={note.id} className="flex items-center max-w-full gap-1">
                              {isEditingCurrentNote(note.id) ? (
                                <>
                                  <div className="flex-1 flex items-center h-7 text-sm px-3 py-1.5 rounded-md bg-gray-50 min-w-0">
                                    <FileText className="size-3 mr-2 flex-shrink-0" />
                                    <Input
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="h-5 text-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename()
                                        if (e.key === 'Escape') cancelRename()
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="flex items-center flex-shrink-0 gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={handleRename}
                                    >
                                      <Check className="h-2 w-2" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={cancelRename}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Link
                                    to={`/dashboard/note/${note.id}`}
                                    className="flex-1 flex items-center h-7 text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors min-w-0"
                                  >
                                    <FileText className="size-3 mr-2 flex-shrink-0" />
                                    <span className="truncate flex-1 min-w-0">{note.title}</span>
                                  </Link>
                                  <div className="flex items-center flex-shrink-0 gap-0.5">
                                    {(user?.role === 'admin' || user?.role === 'manager') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => startRename('note', note.id, note.title)}
                                      >
                                        <Edit2 className="h-2 w-2" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 text-red-500 hover:text-red-700"
                                      onClick={() => handleMoveToTrash(note.id)}
                                    >
                                      <Trash2 className="h-2 w-2" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your notes and files.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="text-sm text-gray-500">
              This folder will contain your notes. You can organize notes by moving them into different folders.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create File Dialog */}
      <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Create a new file in the selected folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter file name"
                className="mt-1"
                autoFocus
              />
            </div>
            {selectedFolderForFile && (
              <div>
                <label className="text-sm font-medium">Target Folder</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {foldersData.find(f => f.id === selectedFolderForFile)?.name}
                </div>
              </div>
            )}
            <div className="text-sm text-gray-500">
              This file will be created in the selected folder. You can edit it after creation.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFileOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFile}
              disabled={!newFileName.trim() || !selectedFolderForFile}
            >
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
