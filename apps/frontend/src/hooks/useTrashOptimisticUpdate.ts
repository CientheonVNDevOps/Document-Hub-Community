import { useQueryClient } from '@tanstack/react-query'
import { Note } from '@/services/notesService'

export const useTrashOptimisticUpdate = () => {
  const queryClient = useQueryClient()

  const addToTrashOptimistically = (note: Note) => {
    // Add note to trash cache immediately
    queryClient.setQueryData(['trash-notes'], (oldData: Note[] = []) => {
      // Check if note already exists to avoid duplicates
      const exists = oldData.some(existingNote => existingNote.id === note.id)
      if (exists) return oldData
      
      // Add the note with deleted_at timestamp
      const noteWithTrashData = {
        ...note,
        is_deleted: true,
        deleted_at: new Date().toISOString()
      }
      
      return [noteWithTrashData, ...oldData]
    })

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
  }

  const removeFromTrashOptimistically = (noteId: string) => {
    // Remove note from trash cache immediately
    queryClient.setQueryData(['trash-notes'], (oldData: Note[] = []) => 
      oldData.filter(note => note.id !== noteId)
    )

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
  }

  const clearTrashOptimistically = () => {
    // Clear trash cache immediately
    queryClient.setQueryData(['trash-notes'], [])

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
  }

  return {
    addToTrashOptimistically,
    removeFromTrashOptimistically,
    clearTrashOptimistically
  }
}
