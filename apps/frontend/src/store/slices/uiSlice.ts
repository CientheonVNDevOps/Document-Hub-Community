import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  modals: {
    createNote: boolean
    createFolder: boolean
    deleteNote: boolean
    deleteFolder: boolean
    noteVersions: boolean
  }
  selectedNoteId: string | null
  selectedFolderId: string | null
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'light',
  modals: {
    createNote: false,
    createFolder: false,
    deleteNote: false,
    deleteFolder: false,
    noteVersions: false,
  },
  selectedNoteId: null,
  selectedFolderId: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state: any) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state: any, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleTheme: (state: any) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme: (state: any, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    openModal: (state: any, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state: any, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = false
    },
    closeAllModals: (state: any) => {
      Object.keys(state.modals).forEach((key: any) => {
        state.modals[key as keyof UiState['modals']] = false
      })
    },
    setSelectedNoteId: (state: any, action: PayloadAction<string | null>) => {
      state.selectedNoteId = action.payload
    },
    setSelectedFolderId: (state: any, action: PayloadAction<string | null>) => {
      state.selectedFolderId = action.payload
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  openModal,
  closeModal,
  closeAllModals,
  setSelectedNoteId,
  setSelectedFolderId,
} = uiSlice.actions

export default uiSlice.reducer
