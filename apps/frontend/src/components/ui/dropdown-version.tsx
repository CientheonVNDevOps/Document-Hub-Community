import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Plus, Settings, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'     
import { useAuth } from '@/components/auth/AuthProvider'
import { notesService } from '@/services/notesService'
import { useToast } from '@/hooks/use-toast'

interface CommunityVersion {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

interface VersionDropdownProps {
  currentVersion?: CommunityVersion
  onVersionChange: (version: CommunityVersion) => void
}

export const VersionDropdown = ({ currentVersion, onVersionChange }: VersionDropdownProps) => {
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false)
  const [isManageVersionsOpen, setIsManageVersionsOpen] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [newVersionDescription, setNewVersionDescription] = useState('')
  
  // Edit version states
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)
  const [editVersionName, setEditVersionName] = useState('')
  const [editVersionDescription, setEditVersionDescription] = useState('')
  
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['community-versions'],
    queryFn: () => notesService.getAllCommunityVersions(),
  })

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      notesService.createCommunityVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-versions'] })
      setIsCreateVersionOpen(false)
      setNewVersionName('')
      setNewVersionDescription('')
      toast({
        title: 'Version created',
        description: 'Community version created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create version',
        variant: 'destructive',
      })
    },
  })

  // Update version mutation
  const updateVersionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      notesService.updateCommunityVersion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-versions'] })
      toast({
        title: 'Version updated',
        description: 'Community version updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update version',
        variant: 'destructive',
      })
    },
  })

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: (id: string) => notesService.deleteCommunityVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-versions'] })
      toast({
        title: 'Version deleted',
        description: 'Community version deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete version',
        variant: 'destructive',
      })
    },
  })

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return

    createVersionMutation.mutate({
      name: newVersionName.trim(),
      description: newVersionDescription.trim() || undefined,
    })
  }

  const handleVersionSelect = (version: CommunityVersion) => {
    onVersionChange(version)
  }


  const handleDeleteVersion = (version: CommunityVersion) => {
    if (window.confirm(`Are you sure you want to delete version "${version.name}"?`)) {
      deleteVersionMutation.mutate(version.id)
    }
  }

  const handleStartEdit = (version: CommunityVersion) => {
    setEditingVersionId(version.id)
    setEditVersionName(version.name)
    setEditVersionDescription(version.description || '')
  }

  const handleSaveEdit = () => {
    if (!editingVersionId || !editVersionName.trim()) return

    updateVersionMutation.mutate({
      id: editingVersionId,
      data: {
        name: editVersionName.trim(),
        description: editVersionDescription.trim() || undefined,
      }
    })
    
    setEditingVersionId(null)
    setEditVersionName('')
    setEditVersionDescription('')
  }

  const handleCancelEdit = () => {
    setEditingVersionId(null)
    setEditVersionName('')
    setEditVersionDescription('')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              {currentVersion ? (
                <span>{currentVersion.name}</span>
              ) : (
                'Select Version'
              )}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Community Versions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <DropdownMenuItem disabled>Loading versions...</DropdownMenuItem>
          ) : (
            versions.map((version) => (
              <DropdownMenuItem
                key={version.id}
                onClick={() => handleVersionSelect(version)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{version.name}</span>
                  {version.description && (
                    <span className="text-xs text-muted-foreground">
                      {version.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
          
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateVersionOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Version
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsManageVersionsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Versions
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Version Dialog */}
      <Dialog open={isCreateVersionOpen} onOpenChange={setIsCreateVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new community version for organizing notes and folders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="e.g., v2.0, v1.5"
              />
            </div>
            <div>
              <Label htmlFor="version-description">Description (Optional)</Label>
              <Textarea
                id="version-description"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Describe what's new in this version..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateVersionOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateVersion}
              disabled={!newVersionName.trim() || createVersionMutation.isPending}
            >
              {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Versions Dialog */}
      <Dialog open={isManageVersionsOpen} onOpenChange={setIsManageVersionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Community Versions</DialogTitle>
            <DialogDescription>
              Manage existing community versions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  {editingVersionId === version.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editVersionName}
                        onChange={(e) => setEditVersionName(e.target.value)}
                        placeholder="Version name"
                        className="h-8"
                        autoFocus
                      />
                      <Textarea
                        value={editVersionDescription}
                        onChange={(e) => setEditVersionDescription(e.target.value)}
                        placeholder="Version description (optional)"
                        className="h-16 resize-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.name}</span>
                      </div>
                      {version.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {version.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingVersionId === version.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveEdit}
                        disabled={!editVersionName.trim() || updateVersionMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updateVersionMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(version)}
                        disabled={updateVersionMutation.isPending}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVersion(version)}
                        disabled={deleteVersionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageVersionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
