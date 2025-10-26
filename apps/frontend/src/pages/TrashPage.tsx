import { useState, useMemo } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { notesService, Note, Folder } from '@/services/notesService'
import { useTrashOptimisticUpdate } from '@/hooks/useTrashOptimisticUpdate'
import { useVersion } from '@/contexts/VersionContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Trash2, 
  RotateCcw, 
  Eye, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Folder as FolderIcon,
  FolderOpen,
  RotateCcw as RecoverAllIcon
} from 'lucide-react'

const TrashPage = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false)
  const [isViewFolderOpen, setIsViewFolderOpen] = useState(false)
  const [isRecoverDialogOpen, setIsRecoverDialogOpen] = useState(false)
  const [isRecoverFolderDialogOpen, setIsRecoverFolderDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false)
  const [isRecoverAllDialogOpen, setIsRecoverAllDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Use shared version context
  const { currentVersion } = useVersion()
  
  const queryClient = useQueryClient()
  const { removeFromTrashOptimistically, removeFolderFromTrashOptimistically, clearTrashOptimistically } = useTrashOptimisticUpdate()

  // Fetch trash notes using React Query with version filtering
  const { data: trashNotes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['trash-notes', currentVersion?.id],
    queryFn: () => notesService.getTrashNotes(currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Fetch trash folders using React Query with version filtering
  const { data: trashFolders = [], isLoading: foldersLoading, error: foldersError } = useQuery({
    queryKey: ['trash-folders', currentVersion?.id],
    queryFn: () => notesService.getTrashFolders(currentVersion?.id),
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Calculate notes count per folder
  const notesCountPerFolder = useMemo(() => {
    const counts: Record<string, number> = {}
    trashNotes.forEach(note => {
      if (note.folder_id) {
        counts[note.folder_id] = (counts[note.folder_id] || 0) + 1
      }
    })
    return counts
  }, [trashNotes])

  // Get notes for selected folder
  const folderNotes = useMemo(() => {
    if (!selectedFolder) return []
    return trashNotes.filter(note => note.folder_id === selectedFolder.id)
  }, [trashNotes, selectedFolder])

  const recoverNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesService.recoverNote(noteId),
    onSuccess: (recoveredNote, noteId) => {
      // Optimistic update: Remove from trash immediately
      removeFromTrashOptimistically(noteId)
      
      // Add to notes cache optimistically
      queryClient.setQueryData(['notes'], (oldData: Note[] = []) => 
        [...oldData, recoveredNote]
      )
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      
      setIsRecoverDialogOpen(false)
      setSelectedNote(null)
    }
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesService.deleteNote(noteId),
    onSuccess: (_, noteId) => {
      // Optimistic update: Remove from trash immediately
      removeFromTrashOptimistically(noteId)
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
      setIsDeleteDialogOpen(false)
      setSelectedNote(null)
    }
  })

  const emptyTrashMutation = useMutation({
    mutationFn: () => notesService.emptyTrash(currentVersion?.id),
    onSuccess: () => {
      // Optimistic update: Clear trash immediately
      clearTrashOptimistically()
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
      setIsEmptyTrashDialogOpen(false)
    }
  })

  const recoverFolderMutation = useMutation({
    mutationFn: (folderId: string) => notesService.recoverFolder(folderId),
    onSuccess: (_, folderId) => {
      // Optimistic update: Remove folder from trash immediately
      removeFolderFromTrashOptimistically(folderId)
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      setIsRecoverFolderDialogOpen(false)
      setSelectedFolder(null)
    }
  })

  const recoverAllMutation = useMutation({
    mutationFn: () => notesService.recoverAllFromTrash(currentVersion?.id),
    onSuccess: () => {
      // Optimistic update: Clear all trash immediately
      clearTrashOptimistically()
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['notes', currentVersion?.id] })
      queryClient.invalidateQueries({ queryKey: ['folders', currentVersion?.id] })
      setIsRecoverAllDialogOpen(false)
    }
  })

  const handleViewNote = async (note: Note) => {
    try {
      setLoading(true)
      // For trash notes, we can use the note data directly since it's already loaded
      setSelectedNote(note)
      setIsViewNoteOpen(true)
    } catch (error) {
      console.error('Failed to load note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFolder = (folder: Folder) => {
    setSelectedFolder(folder)
    setIsViewFolderOpen(true)
  }

  const handleRecoverNote = () => {
    if (selectedNote) {
      recoverNoteMutation.mutate(selectedNote.id)
    }
  }

  const handleDeleteNote = () => {
    if (selectedNote) {
      deleteNoteMutation.mutate(selectedNote.id)
    }
  }

  const openRecoverDialog = (note: Note) => {
    setSelectedNote(note)
    setIsRecoverDialogOpen(true)
  }

  const openDeleteDialog = (note: Note) => {
    setSelectedNote(note)
    setIsDeleteDialogOpen(true)
  }

  const openRecoverFolderDialog = (folder: Folder) => {
    setSelectedFolder(folder)
    setIsRecoverFolderDialogOpen(true)
  }

  const handleRecoverFolder = () => {
    if (selectedFolder) {
      recoverFolderMutation.mutate(selectedFolder.id)
    }
  }

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate()
  }

  const handleRecoverAll = () => {
    recoverAllMutation.mutate()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Trash2 className="h-6 w-6 mr-2 text-red-500" />
              Trash
            </h1>
            <p className="text-gray-600">
              Deleted notes are kept here for 30 days before being permanently removed.
            </p>
          </div>
          {(trashNotes.length > 0 || trashFolders.length > 0) && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsRecoverAllDialogOpen(true)}
                disabled={recoverAllMutation.isPending}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <RecoverAllIcon className="h-4 w-4 mr-2" />
                {recoverAllMutation.isPending ? 'Recovering All...' : 'Recover All'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsEmptyTrashDialogOpen(true)}
                disabled={emptyTrashMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {emptyTrashMutation.isPending ? 'Emptying...' : 'Empty Trash'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {notesLoading || foldersLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading trash items...</div>
        </div>
      ) : notesError || foldersError ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading trash</h3>
            <p className="text-gray-500 mb-4">Failed to load trash items. Please try again.</p>
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['trash-notes', currentVersion?.id] })
              queryClient.invalidateQueries({ queryKey: ['trash-folders', currentVersion?.id] })
            }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : trashNotes.length === 0 && trashFolders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
            <p className="text-gray-500">No deleted notes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Deleted Folders */}
          {trashFolders.map((folder) => {
            const notesCount = notesCountPerFolder[folder.id] || 0
            return (
              <Card key={`folder-${folder.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FolderIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{folder.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span>Deleted {folder.deleted_at ? new Date(folder.deleted_at).toLocaleDateString() : 'Unknown date'}</span>
                          {notesCount > 0 && (
                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {notesCount} note{notesCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {notesCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFolder(folder)}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          View Contents
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRecoverFolderDialog(folder)}
                        disabled={recoverFolderMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Deleted Notes */}
          {trashNotes.map((note) => (
            <Card key={`note-${note.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{note.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        Deleted {note.deleted_at ? new Date(note.deleted_at).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                      variant="outline"
                      size="sm"
                      onClick={() => openRecoverDialog(note)}
                      disabled={recoverNoteMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Recover
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(note)}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Note Dialog */}
      <Dialog open={isViewNoteOpen} onOpenChange={setIsViewNoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {selectedNote?.title}
            </DialogTitle>
            <DialogDescription>
              Note content preview
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedNote && (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {selectedNote.content}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewNoteOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewNoteOpen(false)
              if (selectedNote) openRecoverDialog(selectedNote)
            }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Recover Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recover Note Dialog */}
      <Dialog open={isRecoverDialogOpen} onOpenChange={setIsRecoverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-green-500" />
              Recover Note
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to recover this note? It will be restored to its original location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">
                Note: "{selectedNote?.title}" will be restored
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRecoverDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecoverNote}
              disabled={recoverNoteMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {recoverNoteMutation.isPending ? 'Recovering...' : 'Recover Note'}
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
              Permanently Delete Note
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The note will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-red-50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">
                Warning: "{selectedNote?.title}" will be permanently deleted
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
              onClick={handleDeleteNote}
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty Trash Dialog */}
      <Dialog open={isEmptyTrashDialogOpen} onOpenChange={setIsEmptyTrashDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Empty Trash
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All notes and folders in trash will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-red-50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">
                Warning: {trashNotes.length + trashFolders.length} item{(trashNotes.length + trashFolders.length) !== 1 ? 's' : ''} will be permanently deleted
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEmptyTrashDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleEmptyTrash}
              disabled={emptyTrashMutation.isPending}
            >
              {emptyTrashMutation.isPending ? 'Emptying...' : 'Empty Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recover Folder Dialog */}
      <Dialog open={isRecoverFolderDialogOpen} onOpenChange={setIsRecoverFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-green-500" />
              Recover Folder
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to recover this folder? It will be restored to its original location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">
                Folder: "{selectedFolder?.name}" will be restored
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRecoverFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecoverFolder}
              disabled={recoverFolderMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {recoverFolderMutation.isPending ? 'Recovering...' : 'Recover Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Folder Dialog */}
      <Dialog open={isViewFolderOpen} onOpenChange={setIsViewFolderOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              {selectedFolder?.name}
            </DialogTitle>
            <DialogDescription>
              Contents of deleted folder ({folderNotes.length} note{folderNotes.length !== 1 ? 's' : ''})
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {folderNotes.length === 0 ? (
              <div className="text-center py-8">
                <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No notes found in this folder.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folderNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{note.title}</h4>
                            <p className="text-sm text-gray-500">
                              Deleted {note.deleted_at ? new Date(note.deleted_at).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsViewFolderOpen(false)
                              handleViewNote(note)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsViewFolderOpen(false)
                              setSelectedNote(note)
                              setIsRecoverDialogOpen(true)
                            }}
                            disabled={recoverNoteMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Recover
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewFolderOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewFolderOpen(false)
                if (selectedFolder) openRecoverFolderDialog(selectedFolder)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recover Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recover All Dialog */}
      <Dialog open={isRecoverAllDialogOpen} onOpenChange={setIsRecoverAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RecoverAllIcon className="h-5 w-5 mr-2 text-green-500" />
              Recover All Items
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to recover all items from trash? This will restore all notes and folders to their original locations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">
                {trashNotes.length} note{trashNotes.length !== 1 ? 's' : ''} and {trashFolders.length} folder{trashFolders.length !== 1 ? 's' : ''} will be restored
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRecoverAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecoverAll}
              disabled={recoverAllMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {recoverAllMutation.isPending ? 'Recovering All...' : 'Recover All Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { TrashPage }
