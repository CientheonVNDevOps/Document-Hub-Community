import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { publicNotesService, Note, Folder, CommunityVersion } from '@/services/publicNotesService'
import { Search, ChevronDown, ChevronRight, FileText, Folder as FolderIcon } from 'lucide-react'
import { useSearchShortcut } from '@/hooks/useSearchShortcut'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface TocItem {
  id: string
  text: string
  level: number
}

export const DocsPage = () => {
  const [selectedVersion, setSelectedVersion] = useState<CommunityVersion | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { isLoading: versionsLoading, data: versions = [] } = useQuery({
    queryKey: ['public-versions'],
    queryFn: () => publicNotesService.getAllVersions(),
  })

  const { data: folderTree = { folders: [] } } = useQuery({
    queryKey: ['public-folder-tree', selectedVersion?.id],
    queryFn: () => publicNotesService.getFolderTree(selectedVersion?.id),
    enabled: !!selectedVersion?.id,
  })

  const { data: notes = [] } = useQuery({
    queryKey: ['public-notes', selectedVersion?.id],
    queryFn: () => publicNotesService.getNotesByVersion(selectedVersion!.id),
    enabled: !!selectedVersion?.id,
  })

  // Set first version as default
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0])
    }
  }, [versions, selectedVersion])

  // Search shortcut (Command+K or Ctrl+K)
  useSearchShortcut(() => setSearchOpen(true))

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    )
  }, [notes, searchQuery])

  // Generate TOC from markdown content
  const tocItems = useMemo(() => {
    if (!selectedNote?.content) return []
    
    const lines = selectedNote.content.split('\n')
    const items: TocItem[] = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        // Remove any asterisks or markdown formatting from text
        const cleanText = match[2].replace(/[*_~`]/g, '').trim()
        items.push({
          id: `heading-${index}`,
          text: cleanText,
          level: match[1].length,
        })
      }
    })
    
    return items
  }, [selectedNote])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const handleNoteSelect = async (noteId: string) => {
    try {
      const note = await publicNotesService.getNote(noteId)
      setSelectedNote(note)
    } catch (error) {
      console.error('Failed to load note:', error)
    }
  }

  const renderFolderTree = (folders: Folder[]) => {
    return folders.map(folder => (
      <div key={folder.id}>
        <Button
          variant="ghost"
          onClick={() => toggleFolder(folder.id)}
          className="flex items-center w-full px-3 py-2 text-sm justify-start hover:bg-accent"
          style={{ paddingLeft: '12px' }}
        >
          {folder.notes && folder.notes.length > 0 ? (
            expandedFolders.has(folder.id) ? (
              <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
            )
          ) : (
            <span className="h-4 w-4 mr-1 flex-shrink-0" />
          )}
          <FolderIcon className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{folder.name}</span>
        </Button>
        
        {expandedFolders.has(folder.id) && folder.notes && folder.notes.length > 0 && (
          <>
            {folder.notes.map(note => (
              <Button
                key={note.id}
                variant="ghost"
                onClick={() => handleNoteSelect(note.id)}
                className={`flex items-center w-full px-3 py-2 text-sm justify-start ${
                  selectedNote?.id === note.id ? 'bg-accent text-accent-foreground font-medium' : ''
                }`}
                style={{ paddingLeft: '28px' }}
              >
                <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{note.title}</span>
              </Button>
            ))}
          </>
        )}
      </div>
    ))
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-4">
            <img src="/vite.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Documentation Hub Cientheon</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="flex items-center w-64 justify-between"
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span className="text-gray-500">Search docs</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </span>
              K
            </kbd>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <Label htmlFor="version-select" className="mb-2">
              Version
            </Label>
            <Select
              value={selectedVersion?.id || ''}
              onValueChange={(value) => {
                const version = versions.find(v => v.id === value)
                if (version) setSelectedVersion(version)
              }}
              disabled={versionsLoading}
            >
              <SelectTrigger id="version-select" className="w-full">
                <SelectValue placeholder={versionsLoading ? 'Loading...' : 'Select version'} />
              </SelectTrigger>
              <SelectContent>
                {versions.map(version => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVersion?.description && (
              <p className="mt-2 text-xs text-gray-500">
                {selectedVersion.description}
              </p>
            )}
          </div>
          
          <div className="mt-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Documentation
            </div>
            <div className="mt-2">
              {renderFolderTree(folderTree.folders)}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {selectedNote ? (
            <div className="max-w-3xl mx-auto px-8 py-8">
              <h1 className="text-3xl font-bold mb-4 line-clamp-2 break-words">{selectedNote.title}</h1>
              <div className="prose prose-slate max-w-none markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({node, ...props}) => {
                      const children = props.children
                      const text = Array.isArray(children) ? children.join('') : String(children || '')
                      const cleanText = text.replace(/[*_~`]/g, '').trim()
                      const id = cleanText.toLowerCase().replace(/\s+/g, '-')
                      return <h1 id={id} className="scroll-mt-20" {...props} />
                    },
                    h2: ({node, ...props}) => {
                      const children = props.children
                      const text = Array.isArray(children) ? children.join('') : String(children || '')
                      const cleanText = text.replace(/[*_~`]/g, '').trim()
                      const id = cleanText.toLowerCase().replace(/\s+/g, '-')
                      return <h2 id={id} className="scroll-mt-20" {...props} />
                    },
                    h3: ({node, ...props}) => {
                      const children = props.children
                      const text = Array.isArray(children) ? children.join('') : String(children || '')
                      const cleanText = text.replace(/[*_~`]/g, '').trim()
                      const id = cleanText.toLowerCase().replace(/\s+/g, '-')
                      return <h3 id={id} className="scroll-mt-20" {...props} />
                    },
                  }}
                >
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a document to view</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Table of Contents */}
        {selectedNote && tocItems.length > 0 && (
          <aside className="w-72 border-l border-border overflow-y-auto bg-muted/30 px-2 py-6">
            <div className="sticky">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                On this page
              </h3>
              <nav className="space-y-1">
                {tocItems.map((item, index) => {
                  const indentation = (item.level - 1) * 12
                  return (
                    <Button
                      key={`${item.id}-${index}`}
                      variant="ghost"
                      className={`w-full text-left py-2 px-3 hover:bg-accent hover:text-accent-foreground ${
                        item.level === 1 
                          ? 'font-medium text-foreground' 
                          : item.level === 2
                          ? 'font-normal text-muted-foreground'
                          : 'font-normal text-muted-foreground text-xs'
                      }`}
                      style={{ 
                        paddingLeft: `${indentation}px`,
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        height: 'auto',
                        display: 'flex',
                        whiteSpace: 'normal'
                      }}
                      onClick={() => {
                        const text = item.text.toLowerCase().replace(/\s+/g, '-')
                        const element = document.getElementById(text)
                        if (element) {
                          // Find the main content container
                          const mainElement = document.querySelector('main')
                          if (mainElement) {
                            // Get the main container's position and the element's position
                            const mainTop = mainElement.scrollTop
                            const mainRect = mainElement.getBoundingClientRect()
                            const elementRect = element.getBoundingClientRect()
                            
                            // Calculate how much we need to scroll
                            const scrollPosition = elementRect.top - mainRect.top + mainTop - 100
                            
                            // Scroll the main container
                            mainElement.scrollTo({
                              top: scrollPosition,
                              behavior: 'smooth'
                            })
                          }
                        }
                      }}
                    >
                      <span style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word',
                        minWidth: 0
                      }}>
                        {item.text}
                      </span>
                    </Button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Search Documentation</DialogTitle>
          <DialogDescription>
            Search through all notes and documentation
          </DialogDescription>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="text-lg"
            />
            <div className="max-h-96 overflow-y-auto">
              {filteredNotes.map(note => (
                <Button
                  key={note.id}
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-accent"
                  onClick={() => {
                    handleNoteSelect(note.id)
                    setSearchOpen(false)
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
              {searchQuery && filteredNotes.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


