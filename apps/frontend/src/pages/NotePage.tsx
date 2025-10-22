import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesService } from '@/services/notesService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Save, History, MoreVertical } from 'lucide-react'

export const NotePage = () => {
  const { id } = useParams<{ id: string }>()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  
  const queryClient = useQueryClient()

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesService.getNote(id!),
    enabled: !!id,
  })

  // Update local state when note data changes
  React.useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  const updateNoteMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => 
      notesService.updateNote(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setIsEditing(false)
    }
  })

  const handleSave = () => {
    updateNoteMutation.mutate({ title, content })
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!note) {
    return <div className="p-6">Note not found</div>
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none shadow-none p-0"
                  placeholder="Note title..."
                />
              ) : (
                <h1 className="text-2xl font-bold">{note.title}</h1>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(note.updated_at).toLocaleString()}
              {note.version > 1 && (
                <span className="ml-2">• Version {note.version}</span>
              )}
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateNoteMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] border-none shadow-none resize-none"
                placeholder="Start writing your note..."
              />
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {note.content}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
