import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
import { X } from 'lucide-react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => notesService.searchNotes(searchQuery),
    enabled: searchQuery.length > 0,
  })

  // Filter results to match search query
  const filteredResults = searchQuery.trim() 
    ? searchResults.filter(
        note => 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

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
    navigate(`/note/${note.id}`)
    onClose()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Notes</DialogTitle>
          <DialogDescription>
            Search through all notes and documentation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="search-input"
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="text-lg pr-10"
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

          <div className="max-h-96 overflow-y-auto">
            {filteredResults.map((note) => (
              <Button
                key={note.id}
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-accent"
                onClick={() => {
                  handleNoteClick(note)
                }}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium text-sm">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-md">
                    {note.content.substring(0, 100)}...
                  </div>
                </div>
              </Button>
            ))}
            {searchQuery && filteredResults.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
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
