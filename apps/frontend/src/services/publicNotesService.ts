import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api'

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
}


