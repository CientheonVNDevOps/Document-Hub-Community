import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notesService, Note, Folder } from '@/services/notesService'
import { useTrashOptimisticUpdate } from '@/hooks/useTrashOptimisticUpdate'
import { useVersion } from '@/contexts/VersionContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, FileText, Folder as FolderIcon, FolderOpen, Clock, ChevronRight, ChevronDown, Eye, Trash2, AlertTriangle } from 'lucide-react'

export const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToTrashOptimistically } = useTrashOptimisticUpdate()
  
  // Use shared version context
  const { currentVersion } = useVersion()
  
  // Modal states
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false)
  const [isViewFolderOpen, setIsViewFolderOpen] = useState(false)
  const [isViewFoldersOpen, setIsViewFoldersOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  
  // Form states
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteFolderId, setNewNoteFolderId] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  
  // View states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [folderContents, setFolderContents] = useState<{ subfolders: Folder[], notes: Note[] } | null>(null)
  const [folderTree, setFolderTree] = useState<any>(null)
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', currentVersion?.id],
    queryFn: () => notesService.getNotes(undefined, currentVersion?.id),
  })

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', currentVersion?.id],
    queryFn: () => notesService.getFolders(currentVersion?.id),
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => notesService.searchNotes(searchQuery),
    enabled: searchQuery.length > 2,
  })

  const recentNotes = notes.slice(0, 5)

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesService.moveToTrash(noteId),
    onSuccess: (_, noteId) => {
      // Optimistic update: Add note to trash immediately
      const note = notes.find(n => n.id === noteId)
      if (note) {
        addToTrashOptimistically(note)
      }
      
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      
      setIsDeleteDialogOpen(false)
      setNoteToDelete(null)
    }
  })

  // Handler functions
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return

    try {
      setLoading(true)
      await notesService.createNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        folder_id: newNoteFolderId || undefined
      })
      
      // Reset form and close modal
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteFolderId('')
      setIsCreateNoteOpen(false)
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
    } catch (error) {
      console.error('Failed to create note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      setLoading(true)
      await notesService.createFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined
      })
      
      // Reset form and close modal
      setNewFolderName('')
      setNewFolderDescription('')
      setIsCreateFolderOpen(false)
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
    } catch (error) {
      console.error('Failed to create folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteNoteMutation.mutate(noteToDelete.id)
    }
  }

  const handleViewNote = async (note: Note) => {
    try {
      setLoading(true)
      const fullNote = await notesService.getNote(note.id)
      setSelectedNote(fullNote)
      setIsViewNoteOpen(true)
    } catch (error) {
      console.error('Failed to load note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFolder = async (folder: Folder) => {
    try {
      setLoading(true)
      const contents = await notesService.getFolderContents(folder.id)
      setSelectedFolder(folder)
      setFolderContents(contents)
      setIsViewFolderOpen(true)
    } catch (error) {
      console.error('Failed to load folder contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFolders = async () => {
    try {
      setLoading(true)
      const tree = await notesService.getFolderTree()
      setFolderTree(tree)
      setIsViewFoldersOpen(true)
    } catch (error) {
      console.error('Failed to load folder tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your notes.</p>      
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Notes
              </CardTitle>
              <CardDescription>
                Find your notes quickly with our powerful search
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="space-y-4 flex-1">
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <h4 className="font-medium">Search Results</h4>
                    {searchResults.map((note) => (
                      <div 
                        key={note.id} 
                        className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/note/${note.id}`)}
                      >
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {note.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 flex flex-col justify-center">
              <Button 
                className="w-full justify-start"
                onClick={() => setIsCreateNoteOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewFolders}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                {loading ? 'Loading...' : 'View All Folders'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Notes
            </CardTitle>
            <CardDescription>
              Your most recently updated notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-gray-500">
                          Updated {new Date(note.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewNote(note)}
                        disabled={loading}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/note/${note.id}`)}
                      >
                        Open
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteNote(note)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notes yet. Create your first note!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>
                Organize your notes with folders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div key={folder.id} className="p-4 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="h-5 w-5 mr-3 text-blue-500" />
                        <div>
                          <div className="font-medium">{folder.name}</div>
                          <div className="text-sm text-gray-500">
                            {notes.filter(note => note.folder_id === folder.id).length} notes
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewFolder(folder)}
                        disabled={loading}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Note Modal */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Create a new note to capture your thoughts and ideas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter note content"
                className="mt-1 min-h-[200px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Folder (Optional)</label>
              <select 
                value={newNoteFolderId} 
                onChange={(e) => setNewNoteFolderId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNote}
              disabled={!newNoteTitle.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Modal */}
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
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Enter folder description"
                className="mt-1"
              />
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
              disabled={!newFolderName.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Note Modal */}
      <Dialog open={isViewNoteOpen} onOpenChange={setIsViewNoteOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              Note content and details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedNote && (
              <>
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedNote.created_at).toLocaleString()}
                  {selectedNote.updated_at !== selectedNote.created_at && (
                    <span> • Updated: {new Date(selectedNote.updated_at).toLocaleString()}</span>
                  )}
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedNote.content}
                  </pre>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewNoteOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewNoteOpen(false)
                if (selectedNote) navigate(`/note/${selectedNote.id}`)
              }}
            >
              Open in Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Folder Modal */}
      <Dialog open={isViewFolderOpen} onOpenChange={setIsViewFolderOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderIcon className="h-5 w-5 mr-2" />
              {selectedFolder?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedFolder?.description || 'Folder contents'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {folderContents && (
              <>
            
                {folderContents.notes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <div className="space-y-2">
                      {folderContents.notes.map((note) => (
                        <div key={note.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium">{note.title}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setIsViewFolderOpen(false)
                                handleViewNote(note)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setIsViewFolderOpen(false)
                                navigate(`/note/${note.id}`)
                              }}
                            >
                              Open
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {folderContents.subfolders.length === 0 && folderContents.notes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>This folder is empty</p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewFolderOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Folders Modal */}
      <Dialog open={isViewFoldersOpen} onOpenChange={setIsViewFoldersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderIcon className="h-5 w-5 mr-2" />
              All Folders
            </DialogTitle>
            <DialogDescription>
              Complete folder tree structure with all notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {folderTree && (
              <div className="space-y-4">
                {/* Render folder tree */}
                {folderTree.folders && folderTree.folders.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Folder Structure</h4>
                    <div className="space-y-2">
                      {folderTree.folders.map((folder: any) => (
                        <div key={folder.id} className="border rounded">
                          <div 
                            className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleFolderExpansion(folder.id)}
                          >
                            {folder.notes && folder.notes.length > 0 ? (
                              expandedFolders.includes(folder.id) ? (
                                <div className="flex items-center mr-2">
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  <FolderOpen className="h-4 w-4 text-blue-500" />
                                </div>
                              ) : (
                                <div className="flex items-center mr-2">
                                  <ChevronRight className="h-4 w-4 mr-1" />
                                  <FolderIcon className="h-4 w-4 text-blue-500" />
                                </div>
                              )
                            ) : (
                              <div className="flex items-center mr-2">
                                <div className="w-4 mr-1" />
                                <FolderIcon className="h-4 w-4 text-blue-500" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{folder.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({folder.notes?.length || 0} notes)
                            </span>
                          </div>
                          
                          {expandedFolders.includes(folder.id) && folder.notes && folder.notes.length > 0 && (
                            <div className="ml-6 space-y-1 pb-2">
                              {folder.notes.map((note: Note) => (
                                <div key={note.id} className="flex items-center justify-between p-1 hover:bg-gray-50">
                                  <div className="flex items-center">
                                    <FileText className="h-3 w-3 mr-2 text-gray-500" />
                                    <span className="text-xs">{note.title}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setIsViewFoldersOpen(false)
                                        handleViewNote(note)
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-6 w-6 p-0 mr-6"
                                      onClick={() => {
                                        setIsViewFoldersOpen(false)
                                        navigate(`/note/${note.id}`)
                                      }}
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewFoldersOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Move to Trash
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to move this note to trash? You can recover it later from the trash folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-yellow-50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-700">
                Note: "{noteToDelete?.title}" will be moved to trash
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteNote}
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? 'Moving...' : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
