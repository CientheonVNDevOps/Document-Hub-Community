import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notesService, CommunityVersion } from '@/services/notesService'

interface VersionContextType {
  currentVersion: CommunityVersion | undefined
  setCurrentVersion: (version: CommunityVersion | undefined) => void
  versions: CommunityVersion[]
  isLoading: boolean
}

const VersionContext = createContext<VersionContextType | undefined>(undefined)

export const useVersion = () => {
  const context = useContext(VersionContext)
  if (context === undefined) {
    throw new Error('useVersion must be used within a VersionProvider')
  }
  return context
}

interface VersionProviderProps {
  children: ReactNode
}

export const VersionProvider = ({ children }: VersionProviderProps) => {
  const [currentVersion, setCurrentVersion] = useState<CommunityVersion | undefined>(undefined)
  
  // Load versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['community-versions'],
    queryFn: () => notesService.getAllCommunityVersions(),
  })

  // Set first version as current when versions load or update
  useEffect(() => {
    if (versions && versions.length > 0) {
      // If no current version is set, or if the current version is not in the updated list, update it
      if (!currentVersion || !versions.find(v => v.id === currentVersion.id)) {
        setCurrentVersion(versions[0])
      } else {
        // Update the current version with the latest data
        const updatedCurrentVersion = versions.find(v => v.id === currentVersion.id)
        if (updatedCurrentVersion) {
          setCurrentVersion(updatedCurrentVersion)
        }
      }
    }
  }, [versions, currentVersion])

  const value = {
    currentVersion,
    setCurrentVersion,
    versions,
    isLoading
  }

  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  )
}
