import { useQueryClient } from '@tanstack/react-query'
import { Note, Folder } from '@/services/notesService'

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

  const addFolderToTrashOptimistically = (folder: Folder) => {
    // Add folder to trash cache immediately
    queryClient.setQueryData(['trash-folders'], (oldData: Folder[] = []) => {
      // Check if folder already exists to avoid duplicates
      const exists = oldData.some(existingFolder => existingFolder.id === folder.id)
      if (exists) return oldData
      
      // Add the folder with deleted_at timestamp
      const folderWithTrashData = {
        ...folder,
        is_deleted: true,
        deleted_at: new Date().toISOString()
      }
      
      return [folderWithTrashData, ...oldData]
    })

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-folders'] })
  }

  const removeFromTrashOptimistically = (noteId: string) => {
    // Remove note from trash cache immediately
    queryClient.setQueryData(['trash-notes'], (oldData: Note[] = []) => 
      oldData.filter(note => note.id !== noteId)
    )

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
  }

  const removeFolderFromTrashOptimistically = (folderId: string) => {
    // Remove folder from trash cache immediately
    queryClient.setQueryData(['trash-folders'], (oldData: Folder[] = []) => 
      oldData.filter(folder => folder.id !== folderId)
    )

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-folders'] })
  }

  const clearTrashOptimistically = () => {
    // Clear trash cache immediately
    queryClient.setQueryData(['trash-notes'], [])
    queryClient.setQueryData(['trash-folders'], [])

    // Also trigger a refetch to ensure the sidebar trash count updates
    queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
    queryClient.invalidateQueries({ queryKey: ['trash-folders'] })
  }

  return {
    addToTrashOptimistically,
    addFolderToTrashOptimistically,
    removeFromTrashOptimistically,
    removeFolderFromTrashOptimistically,
    clearTrashOptimistically
  }
}
