import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { notesService, Note } from '@/services/notesService'
import { useTrashOptimisticUpdate } from '@/hooks/useTrashOptimisticUpdate'
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
  CheckCircle
} from 'lucide-react'

const TrashPage = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false)
  const [isRecoverDialogOpen, setIsRecoverDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const queryClient = useQueryClient()
  const { removeFromTrashOptimistically, clearTrashOptimistically } = useTrashOptimisticUpdate()

  // Fetch trash notes using React Query
  const { data: trashNotes = [], isLoading, error } = useQuery({
    queryKey: ['trash-notes'],
    queryFn: () => notesService.getTrashNotes(),
    retry: 1,
    refetchOnWindowFocus: false
  })

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
      queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      
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
      queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
      setIsDeleteDialogOpen(false)
      setSelectedNote(null)
    }
  })

  const emptyTrashMutation = useMutation({
    mutationFn: () => notesService.emptyTrash(),
    onSuccess: () => {
      // Optimistic update: Clear trash immediately
      clearTrashOptimistically()
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
      setIsEmptyTrashDialogOpen(false)
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

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate()
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
          {trashNotes.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsEmptyTrashDialogOpen(true)}
              disabled={emptyTrashMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {emptyTrashMutation.isPending ? 'Emptying...' : 'Empty Trash'}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading trash items...</div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading trash</h3>
            <p className="text-gray-500 mb-4">Failed to load trash items. Please try again.</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['trash-notes'] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : trashNotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
            <p className="text-gray-500">No deleted notes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trashNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
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
              This action cannot be undone. All notes in trash will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-red-50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">
                Warning: {trashNotes.length} note{trashNotes.length !== 1 ? 's' : ''} will be permanently deleted
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
    </div>
  )
}

export { TrashPage }
