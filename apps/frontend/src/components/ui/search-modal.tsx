import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { notesService, Note } from '@/services/notesService'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, X, Tag } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  // Optional props for custom behavior
  searchService?: {
    searchNotes: (query: string, versionId?: string) => Promise<Note[]>
  }
  onNoteSelect?: (note: Note) => void
  versionId?: string
  title?: string
  description?: string
  placeholder?: string
}

export const SearchModal = ({ 
  isOpen, 
  onClose, 
  searchService = notesService,
  onNoteSelect,
  versionId,
  title = "Search Notes",
  description = "Search through all your notes. Type to find what you're looking for.",
  placeholder = "Search notes..."
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', searchQuery, versionId],
    queryFn: () => searchService.searchNotes(searchQuery, versionId),
    enabled: searchQuery.length > 0,
  })

  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('search-input')
      if (input) {
        input.focus()
      }
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleNoteClick = (note: Note) => {
    if (onNoteSelect) {
      onNoteSelect(note)
    } else {
      navigate(`/note/${note.id}`)
    }
    onClose()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="search-input"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {searchQuery.length > 0 && isLoading && (
            <div className="text-sm text-gray-500 text-center py-8">
              Searching...
            </div>
          )}

          {searchQuery.length > 0 && !isLoading && searchResults.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notes found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
              {searchResults.map((note) => (
                <div 
                  key={note.id} 
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleNoteClick(note)}
                >
                  <div className="flex items-start space-x-3">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-900 truncate">
                          {note.title}
                        </div>
                        {note.community_versions && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {note.community_versions.name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2 prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[]}
                          rehypePlugins={[]}
                          components={{
                            p: ({children}: any) => <span>{children}</span>,
                            strong: ({children}: any) => <strong className="font-semibold">{children}</strong>,
                            em: ({children}: any) => <em className="italic">{children}</em>,
                          }}
                        >
                          {note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '')}
                        </ReactMarkdown>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd> to open search
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
