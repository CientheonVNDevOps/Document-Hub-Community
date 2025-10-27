import api from './api'

export interface Note {
  id: string
  title: string
  content: string
  folder_id?: string | null
  user_id?: string
  description?: string
  version: number
  created_at: string
  updated_at: string
  is_deleted?: boolean
  deleted_at?: string
}

export interface Folder {
  id: string
  name: string
  parent_id?: string
  description?: string
  created_at: string
  updated_at: string
  is_deleted?: boolean
  deleted_at?: string
  version_id?: string
}

export interface NoteVersion {
  id: string
  note_id: string
  title: string
  content: string
  version: number
  created_at: string
}

export interface CommunityVersion {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateCommunityVersionData {
  name: string
  description?: string
}

export interface UpdateCommunityVersionData {
  name?: string
  description?: string
}

export interface CreateNoteData {
  title: string
  content?: string
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
  description?: string
}

export const notesService = {
  // Notes
  async getNotes(folderId?: string, versionId?: string): Promise<Note[]> {
    const params: any = {}
    if (folderId) params.folderId = folderId
    if (versionId) params.versionId = versionId
    const response = await api.get('/notes', { params })
    return response.data || []
  },

  async getNote(id: string): Promise<Note> {
    // Handle demo notes locally without making backend requests
    if (id.startsWith('demo-note-')) {
      return {
        id: id,
        title: 'Demo Note',
        content: 'This is a demo note for testing purposes.',
        folder_id: null,
        user_id: 'demo-user',
        description: 'Demo note',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    const response = await api.get(`/notes/${id}`)
    return response.data
  },

  async createNote(data: CreateNoteData, versionId?: string): Promise<Note> {
    const params = versionId ? { versionId } : {}
    const response = await api.post('/notes', data, { params })
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
  async getFolders(versionId?: string): Promise<Folder[]> {
    const params = versionId ? { versionId } : {}
    const response = await api.get('/notes/folders', { params })
    return response.data || []
  },

  async getFolder(id: string): Promise<Folder> {
    const response = await api.get(`/notes/folders/${id}`)
    return response.data
  },

  async createFolder(data: CreateFolderData, versionId?: string): Promise<Folder> {
    const params = versionId ? { versionId } : {}
    const response = await api.post('/notes/folders', data, { params })
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

  // Rename operations
  async renameNote(id: string, title: string): Promise<Note> {
    const response = await api.patch(`/notes/${id}/rename`, { title })
    return response.data
  },

  async renameFolder(id: string, name: string): Promise<Folder> {
    const response = await api.patch(`/notes/folders/${id}/rename`, { name })
    return response.data
  },

  // All Notes functionality
  async getAllNotesWithFolders(): Promise<Note[]> {
    const response = await api.get('/notes/all-notes')
    return response.data
  },

  async getFolderTree(): Promise<{ folders: any[] }> {
    try {
      const response = await api.get('/notes/folder-tree')
      return response.data
    } catch (error) {
      // If authentication fails, return demo data
      return {
        folders: [
          {
            id: 'demo-folder-1',
            name: 'Personal',
            description: 'Personal notes and ideas',
            user_id: 'demo-user',
            parent_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            children: [],
            notes: [
              {
                id: 'demo-note-1',
                title: 'My Ideas',
                content: 'Random ideas and thoughts:\n- New feature for the app\n- Blog post about productivity\n- Weekend project ideas',
                folder_id: 'demo-folder-1',
                user_id: 'demo-user',
                description: 'Collection of random ideas',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          },
          {
            id: 'demo-folder-2',
            name: 'Work',
            description: 'Work-related notes and projects',
            user_id: 'demo-user',
            parent_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            children: [],
            notes: [
              {
                id: 'demo-note-2',
                title: 'Meeting Notes',
                content: 'Today we discussed the project timeline and upcoming deadlines. Key points:\n- Review design mockups\n- Prepare presentation\n- Schedule team meeting',
                folder_id: 'demo-folder-2',
                user_id: 'demo-user',
                description: 'Notes from today\'s team meeting',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          },
          {
            id: 'demo-folder-3',
            name: 'Projects',
            description: 'Project-related notes and documentation',
            user_id: 'demo-user',
            parent_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            children: [],
            notes: [
              {
                id: 'demo-note-3',
                title: 'Project Plan',
                content: 'Project planning and documentation:\n- Phase 1: Research and analysis\n- Phase 2: Design and prototyping\n- Phase 3: Development and testing\n- Phase 4: Launch and maintenance',
                folder_id: 'demo-folder-3',
                user_id: 'demo-user',
                description: 'Main project planning document',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          }
        ],
      }
    }
  },

  async getFolderContents(folderId: string): Promise<{ subfolders: Folder[], notes: Note[] }> {
    const response = await api.get(`/notes/folders/${folderId}/contents`)
    return response.data
  },

  // Trash functionality
  async getTrashNotes(versionId?: string): Promise<Note[]> {
    const params = versionId ? `?versionId=${versionId}` : ''
    const response = await api.get(`/notes/trash${params}`)
    return response.data || []
  },

  async moveToTrash(noteId: string): Promise<{ message: string }> {
    const response = await api.patch(`/notes/${noteId}/trash`)
    return response.data
  },

  async recoverNote(noteId: string): Promise<Note> {
    const response = await api.patch(`/notes/${noteId}/recover`)
    return response.data
  },

  async emptyTrash(versionId?: string): Promise<{ message: string }> {
    const params = versionId ? `?versionId=${versionId}` : ''
    const response = await api.delete(`/notes/trash${params}`)
    return response.data
  },

  // Folder trash functionality
  async getTrashFolders(versionId?: string): Promise<Folder[]> {
    const params = versionId ? `?versionId=${versionId}` : ''
    const response = await api.get(`/notes/trash/folders${params}`)
    return response.data || []
  },

  async recoverFolder(folderId: string): Promise<Folder> {
    const response = await api.patch(`/notes/folders/${folderId}/recover`)
    return response.data
  },

  async recoverAllFromTrash(versionId?: string): Promise<{ message: string; recoveredNotes: number; recoveredFolders: number }> {
    const params = versionId ? `?versionId=${versionId}` : ''
    const response = await api.patch(`/notes/trash/recover-all${params}`)
    return response.data
  },

  // Community Version Management
  async getAllCommunityVersions(): Promise<CommunityVersion[]> {
    const response = await api.get('/notes/versions')
    return response.data || []
  },


  async createCommunityVersion(data: CreateCommunityVersionData): Promise<CommunityVersion> {
    const response = await api.post('/notes/versions', data)
    return response.data
  },

  async updateCommunityVersion(id: string, data: UpdateCommunityVersionData): Promise<CommunityVersion> {
    const response = await api.patch(`/notes/versions/${id}`, data)
    return response.data
  },

  async deleteCommunityVersion(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/notes/versions/${id}`)
    return response.data
  },

  async getNotesByVersion(versionId: string): Promise<Note[]> {
    const response = await api.get(`/notes/versions/${versionId}/notes`)
    return response.data || []
  },

  async getFoldersByVersion(versionId: string): Promise<Folder[]> {
    const response = await api.get(`/notes/versions/${versionId}/folders`)
    return response.data || []
  },

  async migrateContentToVersion(sourceVersionId: string, targetVersionId: string): Promise<{ message: string }> {
    const response = await api.post('/notes/versions/migrate', {
      sourceVersionId,
      targetVersionId,
    })
    return response.data
  },
}
