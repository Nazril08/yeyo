import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MultiDirectoryContextType {
  videoDirectories: string[]
  musicDirectories: string[]
  addVideoDirectory: (directory: string) => void
  addMusicDirectory: (directory: string) => void
  removeVideoDirectory: (directory: string) => void
  removeMusicDirectory: (directory: string) => void
  clearVideoDirectories: () => void
  clearMusicDirectories: () => void
  clearAllDirectories: () => void
}

const MultiDirectoryContext = createContext<MultiDirectoryContextType | undefined>(undefined)

const VIDEO_DIRECTORIES_KEY = 'yeyo-video-directories'
const MUSIC_DIRECTORIES_KEY = 'yeyo-music-directories'

export function MultiDirectoryProvider({ children }: { children: ReactNode }) {
  const [videoDirectories, setVideoDirectories] = useState<string[]>([])
  const [musicDirectories, setMusicDirectories] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedVideoDirs = localStorage.getItem(VIDEO_DIRECTORIES_KEY)
      const storedMusicDirs = localStorage.getItem(MUSIC_DIRECTORIES_KEY)
      
      if (storedVideoDirs) {
        setVideoDirectories(JSON.parse(storedVideoDirs))
      }
      if (storedMusicDirs) {
        setMusicDirectories(JSON.parse(storedMusicDirs))
      }
    } catch (error) {
      console.error('Failed to load directories from localStorage:', error)
    }
  }, [])

  const addVideoDirectory = (directory: string) => {
    setVideoDirectories(prev => {
      if (prev.includes(directory)) return prev
      const newDirs = [...prev, directory]
      try {
        localStorage.setItem(VIDEO_DIRECTORIES_KEY, JSON.stringify(newDirs))
      } catch (error) {
        console.error('Failed to save video directories:', error)
      }
      return newDirs
    })
  }

  const addMusicDirectory = (directory: string) => {
    setMusicDirectories(prev => {
      if (prev.includes(directory)) return prev
      const newDirs = [...prev, directory]
      try {
        localStorage.setItem(MUSIC_DIRECTORIES_KEY, JSON.stringify(newDirs))
      } catch (error) {
        console.error('Failed to save music directories:', error)
      }
      return newDirs
    })
  }

  const removeVideoDirectory = (directory: string) => {
    setVideoDirectories(prev => {
      const newDirs = prev.filter(dir => dir !== directory)
      try {
        localStorage.setItem(VIDEO_DIRECTORIES_KEY, JSON.stringify(newDirs))
      } catch (error) {
        console.error('Failed to save video directories:', error)
      }
      return newDirs
    })
  }

  const removeMusicDirectory = (directory: string) => {
    setMusicDirectories(prev => {
      const newDirs = prev.filter(dir => dir !== directory)
      try {
        localStorage.setItem(MUSIC_DIRECTORIES_KEY, JSON.stringify(newDirs))
      } catch (error) {
        console.error('Failed to save music directories:', error)
      }
      return newDirs
    })
  }

  const clearVideoDirectories = () => {
    setVideoDirectories([])
    try {
      localStorage.removeItem(VIDEO_DIRECTORIES_KEY)
    } catch (error) {
      console.error('Failed to clear video directories:', error)
    }
  }

  const clearMusicDirectories = () => {
    setMusicDirectories([])
    try {
      localStorage.removeItem(MUSIC_DIRECTORIES_KEY)
    } catch (error) {
      console.error('Failed to clear music directories:', error)
    }
  }

  const clearAllDirectories = () => {
    clearVideoDirectories()
    clearMusicDirectories()
  }

  return (
    <MultiDirectoryContext.Provider
      value={{
        videoDirectories,
        musicDirectories,
        addVideoDirectory,
        addMusicDirectory,
        removeVideoDirectory,
        removeMusicDirectory,
        clearVideoDirectories,
        clearMusicDirectories,
        clearAllDirectories,
      }}
    >
      {children}
    </MultiDirectoryContext.Provider>
  )
}

export function useMultiDirectoryStore() {
  const context = useContext(MultiDirectoryContext)
  if (context === undefined) {
    throw new Error('useMultiDirectoryStore must be used within a MultiDirectoryProvider')
  }
  return context
}
