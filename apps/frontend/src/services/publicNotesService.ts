import axios from 'axios'

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://dc0kc00ko8cgo84k4ok4w0kw.72.60.41.15.sslip.io'
const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface CommunityVersion {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  folder_id?: string | null
  version_id?: string
  description?: string
  version: number
  created_at: string
  updated_at: string
  folders?: {
    id: string
    name: string
    description?: string
  }
  community_versions?: {
    id: string
    name: string
    description?: string
  }
}

export interface Folder {
  id: string
  name: string
  parent_id?: string
  description?: string
  created_at: string
  updated_at: string
  version_id?: string
  children?: Folder[]
  notes?: Note[]
}

export const publicNotesService = {
  async getAllVersions(): Promise<CommunityVersion[]> {
    const response = await publicApi.get('/notes/public/versions')
    return response.data || []
  },

  async getNotesByVersion(versionId: string): Promise<Note[]> {
    const response = await publicApi.get(`/notes/public/versions/${versionId}/notes`)
    return response.data || []
  },

  async getFoldersByVersion(versionId: string): Promise<Folder[]> {
    const response = await publicApi.get(`/notes/public/versions/${versionId}/folders`)
    return response.data || []
  },

  async getNote(id: string): Promise<Note> {
    const response = await publicApi.get(`/notes/public/${id}`)
    return response.data
  },

  async getFolderTree(versionId?: string): Promise<{ folders: Folder[] }> {
    const params = versionId ? { versionId } : {}
    const response = await publicApi.get('/notes/public/folder-tree', { params })
    return response.data
  },

  async searchNotes(query: string, versionId?: string): Promise<Note[]> {
    const params: any = { q: query }
    if (versionId && versionId.trim() !== '') {
      params.versionId = versionId
    }
    const response = await publicApi.get('/notes/public/search', { params })
    return response.data || []
  },
}


