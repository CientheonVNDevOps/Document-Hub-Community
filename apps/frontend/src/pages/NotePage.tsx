import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { notesService } from '@/services/notesService'
import { useTrashOptimisticUpdate } from '@/hooks/useTrashOptimisticUpdate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Save, Trash2, AlertTriangle, Eye, Edit3 } from 'lucide-react'

export const NotePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { addToTrashOptimistically } = useTrashOptimisticUpdate()

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
    },
    onError: (error) => {
      console.error('Failed to update note:', error)
    }
  })

  const moveToTrashMutation = useMutation({
    mutationFn: () => notesService.moveToTrash(id!),
    onSuccess: () => {
      // Optimistic update: Add note to trash immediately
      if (note) {
        addToTrashOptimistically(note)
      }

      // Invalidate all relevant caches for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['trash-notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['note', id] })

      // Navigate to dashboard after successful deletion
      navigate('/dashboard')
    }
  })

  const handleSave = () => {
    updateNoteMutation.mutate({ title, content })
  }

  const handleMoveToTrash = () => {
    moveToTrashMutation.mutate()
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setViewMode('preview')
                    }}
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
                <Button onClick={() => {
                  setIsEditing(true)
                  setViewMode('source')
                }}>
                  Edit
                </Button>
              )}

            </div>
          </div>

          <div className="text-sm text-gray-500">
            Last updated: {new Date(note.updated_at).toLocaleString()}
            {typeof note.version === 'number' && note.version >= 1 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Version {note.version}
              </span>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-4">
                {/* Markdown Editor Controls */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Markdown Editor</span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant={viewMode === 'source' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('source')}
                        className="h-8 px-3"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Source
                      </Button>
                      <Button
                        variant={viewMode === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                        className="h-8 px-3"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Supports GitHub Flavored Markdown
                  </div>
                </div>

                {/* Editor Content */}
                {viewMode === 'source' ? (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] border-none shadow-none resize-none font-mono text-sm"
                    placeholder="Start writing your note in Markdown...

# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2

```javascript
// Code block
const example = 'Hello World';
```

> This is a blockquote

[Link text](https://example.com)"
                  />
                ) : (
                  <div className="min-h-[400px] border rounded-md p-4 bg-gray-50">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        className="markdown-content"
                      >
                        {content || '*No content to preview*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  className="markdown-content"
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Note Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Move to Trash
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to move this note to trash? You can recover it later from the trash folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-3 bg-yellow-50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-700">
                Note: "{note?.title}" will be moved to trash
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMoveToTrash}
              disabled={moveToTrashMutation.isPending}
            >
              {moveToTrashMutation.isPending ? 'Moving...' : 'Move to Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
