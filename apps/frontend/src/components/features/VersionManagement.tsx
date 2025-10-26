import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { notesService, CommunityVersion } from '@/services/notesService'
import { useToast } from '@/hooks/use-toast'

export const VersionManagement = () => {
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false)
  const [isMigrateContentOpen, setIsMigrateContentOpen] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [newVersionDescription, setNewVersionDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [isLatest, setIsLatest] = useState(false)
  const [sourceVersionId, setSourceVersionId] = useState('')
  const [targetVersionId, setTargetVersionId] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch all versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['community-versions'],
    queryFn: () => notesService.getAllCommunityVersions(),
  })

  // Create version mutation
  const createVersionMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; is_active?: boolean; is_latest?: boolean }) =>
      notesService.createCommunityVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-versions'] })
      setIsCreateVersionOpen(false)
      setNewVersionName('')
      setNewVersionDescription('')
      setIsActive(false)
      setIsLatest(false)
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

  // Migrate content mutation
  const migrateContentMutation = useMutation({
    mutationFn: ({ sourceVersionId, targetVersionId }: { sourceVersionId: string; targetVersionId: string }) =>
      notesService.migrateContentToVersion(sourceVersionId, targetVersionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-versions'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setIsMigrateContentOpen(false)
      setSourceVersionId('')
      setTargetVersionId('')
      toast({
        title: 'Content migrated',
        description: 'Content migrated successfully between versions',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to migrate content',
        variant: 'destructive',
      })
    },
  })

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return

    createVersionMutation.mutate({
      name: newVersionName.trim(),
      description: newVersionDescription.trim() || undefined,
      is_active: isActive,
      is_latest: isLatest,
    })
  }

  const handleDeleteVersion = (version: CommunityVersion) => {
    if (window.confirm(`Are you sure you want to delete version "${version.name}"?`)) {
      deleteVersionMutation.mutate(version.id)
    }
  }

  const handleMigrateContent = () => {
    if (!sourceVersionId || !targetVersionId) return
    if (sourceVersionId === targetVersionId) {
      toast({
        title: 'Error',
        description: 'Source and target versions cannot be the same',
        variant: 'destructive',
      })
      return
    }

    migrateContentMutation.mutate({ sourceVersionId, targetVersionId })
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-8">Loading versions...</div>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {version.name}
                  
                    </CardTitle>
                    {version.description && (
                      <CardDescription>{version.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVersion(version)}
                      disabled={deleteVersionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <p>Created: {new Date(version.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(version.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active">Set as Active Version</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-latest"
                checked={isLatest}
                onCheckedChange={setIsLatest}
              />
              <Label htmlFor="is-latest">Set as Latest Version</Label>
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

      {/* Migrate Content Dialog */}
      <Dialog open={isMigrateContentOpen} onOpenChange={setIsMigrateContentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrate Content Between Versions</DialogTitle>
            <DialogDescription>
              Move all notes and folders from one version to another.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="source-version">Source Version</Label>
              <Select value={sourceVersionId} onValueChange={setSourceVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-version">Target Version</Label>
              <Select value={targetVersionId} onValueChange={setTargetVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMigrateContentOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMigrateContent}
              disabled={!sourceVersionId || !targetVersionId || migrateContentMutation.isPending}
            >
              {migrateContentMutation.isPending ? 'Migrating...' : 'Migrate Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
