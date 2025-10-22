import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notesService } from '@/services/notesService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, FileText, Folder, Clock } from 'lucide-react'

export const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesService.getNotes(),
  })

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => notesService.getFolders(),
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => notesService.searchNotes(searchQuery),
    enabled: searchQuery.length > 2,
  })

  const recentNotes = notes.slice(0, 5)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your notes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Notes
              </CardTitle>
              <CardDescription>
                Find your notes quickly with our powerful search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Search Results</h4>
                    {searchResults.map((note) => (
                      <div key={note.id} className="p-2 border rounded hover:bg-gray-50">
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {note.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Notes
            </CardTitle>
            <CardDescription>
              Your most recently updated notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">{note.title}</div>
                        <div className="text-sm text-gray-500">
                          Updated {new Date(note.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notes yet. Create your first note!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>
                Organize your notes with folders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div key={folder.id} className="p-4 border rounded hover:bg-gray-50">
                    <div className="flex items-center">
                      <Folder className="h-5 w-5 mr-3 text-blue-500" />
                      <div>
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-gray-500">
                          {notes.filter(note => note.folder_id === folder.id).length} notes
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
