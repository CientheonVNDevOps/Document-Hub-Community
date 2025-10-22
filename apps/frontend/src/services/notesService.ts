import api from './api'

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

export interface CreateNoteData {
  title: string
  content: string
  folder_id?: string
  description?: string
}

export interface UpdateNoteData {
  title?: string
  content?: string
  folder_id?: string
  description?: string
}

export interface CreateFolderData {
  name: string
  parent_id?: string
  description?: string
}

export const notesService = {
  // Notes
  async getNotes(folderId?: string): Promise<Note[]> {
    const params = folderId ? { folderId } : {}
    const response = await api.get('/notes', { params })
    return response.data
  },

  async getNote(id: string): Promise<Note> {
    const response = await api.get(`/notes/${id}`)
    return response.data
  },

  async createNote(data: CreateNoteData): Promise<Note> {
    const response = await api.post('/notes', data)
    return response.data
  },

  async updateNote(id: string, data: UpdateNoteData): Promise<Note> {
    const response = await api.patch(`/notes/${id}`, data)
    return response.data
  },

  async deleteNote(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/notes/${id}`)
    return response.data
  },

  async searchNotes(query: string): Promise<Note[]> {
    const response = await api.get('/notes/search', { params: { q: query } })
    return response.data
  },

  // Folders
  async getFolders(parentId?: string): Promise<Folder[]> {
    const params = parentId ? { parentId } : {}
    const response = await api.get('/notes/folders', { params })
    return response.data
  },

  async getFolder(id: string): Promise<Folder> {
    const response = await api.get(`/notes/folders/${id}`)
    return response.data
  },

  async createFolder(data: CreateFolderData): Promise<Folder> {
    const response = await api.post('/notes/folders', data)
    return response.data
  },

  async updateFolder(id: string, data: Partial<CreateFolderData>): Promise<Folder> {
    const response = await api.patch(`/notes/folders/${id}`, data)
    return response.data
  },

  async deleteFolder(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/notes/folders/${id}`)
    return response.data
  },

  // Versions
  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    const response = await api.get(`/notes/${noteId}/versions`)
    return response.data
  },

  async restoreNoteVersion(noteId: string, versionId: string): Promise<Note> {
    const response = await api.post(`/notes/${noteId}/versions/${versionId}/restore`)
    return response.data
  },
}
