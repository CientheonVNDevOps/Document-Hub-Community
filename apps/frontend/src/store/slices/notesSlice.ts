import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  description?: string
  version: number
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  parent_id?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface NoteVersion {
  id: string
  note_id: string
  title: string
  content: string
  version: number
  created_at: string
}

interface NotesState {
  notes: Note[]
  folders: Folder[]
  currentNote: Note | null
  selectedFolder: string | null
  searchQuery: string
  isLoading: boolean
  error: string | null
}

const initialState: NotesState = {
  notes: [],
  folders: [],
  currentNote: null,
  selectedFolder: null,
  searchQuery: '',
  isLoading: false,
  error: null,
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setNotes: (state: any, action: PayloadAction<Note[]>) => {
      state.notes = action.payload
    },
    addNote: (state: any, action: PayloadAction<Note>) => {
      state.notes.unshift(action.payload)
    },
    updateNote: (state: any, action: PayloadAction<Note>) => {
      const index = state.notes.findIndex((note: any) => note.id === action.payload.id)
      if (index !== -1) {
        state.notes[index] = action.payload
      }
      if (state.currentNote?.id === action.payload.id) {
        state.currentNote = action.payload
      }
    },
    deleteNote: (state: any, action: PayloadAction<string>) => {
      state.notes = state.notes.filter((note: any) => note.id !== action.payload)
      if (state.currentNote?.id === action.payload) {
        state.currentNote = null
      }
    },
    setFolders: (state: any, action: PayloadAction<Folder[]>) => {
      state.folders = action.payload
    },
    addFolder: (state: any, action: PayloadAction<Folder>) => {
      state.folders.push(action.payload)
    },
    updateFolder: (state: any, action: PayloadAction<Folder>) => {
      const index = state.folders.findIndex((folder: any) => folder.id === action.payload.id)
      if (index !== -1) {
        state.folders[index] = action.payload
      }
    },
    deleteFolder: (state: any, action: PayloadAction<string>) => {
      state.folders = state.folders.filter((folder: any) => folder.id !== action.payload)
    },
    setCurrentNote: (state: any, action: PayloadAction<Note | null>) => {
      state.currentNote = action.payload
    },
    setSelectedFolder: (state: any, action: PayloadAction<string | null>) => {
      state.selectedFolder = action.payload
    },
    setSearchQuery: (state: any, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    setLoading: (state: any, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state: any, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state: any) => {
      state.error = null
    },
  },
})

export const {
  setNotes,
  addNote,
  updateNote,
  deleteNote,
  setFolders,
  addFolder,
  updateFolder,
  deleteFolder,
  setCurrentNote,
  setSelectedFolder,
  setSearchQuery,
  setLoading,
  setError,
  clearError,
} = notesSlice.actions

export default notesSlice.reducer
