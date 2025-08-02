import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MediaDirectoryContextType {
  selectedDirectory: string | null
  setSelectedDirectory: (directory: string | null) => void
  clearDirectory: () => void
}

const MediaDirectoryContext = createContext<MediaDirectoryContextType | undefined>(undefined)

const STORAGE_KEY = 'yeyo-media-directory'

export function MediaDirectoryProvider({ children }: { children: ReactNode }) {
  const [selectedDirectory, setSelectedDirectoryState] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log('Loading directory from localStorage:', stored)
      if (stored) {
        setSelectedDirectoryState(stored)
      }
    } catch (error) {
      console.error('Failed to load directory from localStorage:', error)
    }
  }, [])

  const setSelectedDirectory = (directory: string | null) => {
    console.log('Setting directory in store:', directory)
    setSelectedDirectoryState(directory)
    try {
      if (directory) {
        localStorage.setItem(STORAGE_KEY, directory)
        console.log('Saved directory to localStorage:', directory)
      } else {
        localStorage.removeItem(STORAGE_KEY)
        console.log('Removed directory from localStorage')
      }
    } catch (error) {
      console.error('Failed to save directory to localStorage:', error)
    }
  }

  const clearDirectory = () => {
    setSelectedDirectory(null)
  }

  return (
    <MediaDirectoryContext.Provider
      value={{
        selectedDirectory,
        setSelectedDirectory,
        clearDirectory,
      }}
    >
      {children}
    </MediaDirectoryContext.Provider>
  )
}

export function useMediaDirectoryStore() {
  const context = useContext(MediaDirectoryContext)
  if (context === undefined) {
    throw new Error('useMediaDirectoryStore must be used within a MediaDirectoryProvider')
  }
  return context
}
