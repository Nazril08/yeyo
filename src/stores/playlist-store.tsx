import React, { createContext, useContext, useState, useEffect } from 'react'
import { MediaFile } from '@/hooks/use-directory-browser'

export interface Playlist {
  id: string
  name: string
  description?: string
  songs: MediaFile[]
  createdAt: number
  updatedAt: number
}

interface PlaylistContextType {
  playlists: Playlist[]
  currentPlaylist: Playlist | null
  currentSongIndex: number
  isShuffleEnabled: boolean
  isRepeatEnabled: boolean
  
  // Playlist management
  createPlaylist: (name: string, description?: string) => Playlist
  deletePlaylist: (id: string) => void
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void
  
  // Song management
  addSongToPlaylist: (playlistId: string, song: MediaFile) => void
  removeSongFromPlaylist: (playlistId: string, songIndex: number) => void
  
  // Playback control
  setCurrentPlaylist: (playlist: Playlist | null) => void
  setCurrentSongIndex: (index: number) => void
  nextSong: () => MediaFile | null
  previousSong: () => MediaFile | null
  
  // Playback modes
  toggleShuffle: () => void
  toggleRepeat: () => void
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined)

export function usePlaylistStore() {
  const context = useContext(PlaylistContext)
  if (!context) {
    throw new Error('usePlaylistStore must be used within a PlaylistProvider')
  }
  return context
}

const STORAGE_KEY = 'yeyo-playlists'

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false)
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false)

  // Load playlists from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedPlaylists = JSON.parse(stored)
        setPlaylists(parsedPlaylists)
      }
    } catch (error) {
      console.error('Failed to load playlists:', error)
    }
  }, [])

  // Save playlists to localStorage whenever playlists change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
    } catch (error) {
      console.error('Failed to save playlists:', error)
    }
  }, [playlists])

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description,
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    setPlaylists(prev => [...prev, newPlaylist])
    return newPlaylist
  }

  const deletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id))
    if (currentPlaylist?.id === id) {
      setCurrentPlaylist(null)
      setCurrentSongIndex(0)
    }
  }

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: Date.now() }
        : p
    ))
    
    if (currentPlaylist?.id === id) {
      setCurrentPlaylist(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null)
    }
  }

  const addSongToPlaylist = (playlistId: string, song: MediaFile) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId 
        ? { 
            ...p, 
            songs: [...p.songs, song], 
            updatedAt: Date.now() 
          }
        : p
    ))
    
    if (currentPlaylist?.id === playlistId) {
      setCurrentPlaylist(prev => prev ? {
        ...prev,
        songs: [...prev.songs, song],
        updatedAt: Date.now()
      } : null)
    }
  }

  const removeSongFromPlaylist = (playlistId: string, songIndex: number) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId 
        ? { 
            ...p, 
            songs: p.songs.filter((_, index) => index !== songIndex), 
            updatedAt: Date.now() 
          }
        : p
    ))
    
    if (currentPlaylist?.id === playlistId) {
      const newSongs = currentPlaylist.songs.filter((_, index) => index !== songIndex)
      setCurrentPlaylist(prev => prev ? {
        ...prev,
        songs: newSongs,
        updatedAt: Date.now()
      } : null)
      
      // Adjust current song index if necessary
      if (currentSongIndex >= songIndex && currentSongIndex > 0) {
        setCurrentSongIndex(prev => prev - 1)
      } else if (currentSongIndex >= newSongs.length && newSongs.length > 0) {
        setCurrentSongIndex(newSongs.length - 1)
      }
    }
  }

  const nextSong = (): MediaFile | null => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return null
    
    let nextIndex: number
    
    if (isShuffleEnabled) {
      // Random song
      nextIndex = Math.floor(Math.random() * currentPlaylist.songs.length)
    } else if (currentSongIndex < currentPlaylist.songs.length - 1) {
      // Next song in order
      nextIndex = currentSongIndex + 1
    } else if (isRepeatEnabled) {
      // Repeat playlist - go to first song
      nextIndex = 0
    } else {
      // End of playlist
      return null
    }
    
    setCurrentSongIndex(nextIndex)
    return currentPlaylist.songs[nextIndex]
  }

  const previousSong = (): MediaFile | null => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return null
    
    let prevIndex: number
    
    if (isShuffleEnabled) {
      // Random song
      prevIndex = Math.floor(Math.random() * currentPlaylist.songs.length)
    } else if (currentSongIndex > 0) {
      // Previous song in order
      prevIndex = currentSongIndex - 1
    } else if (isRepeatEnabled) {
      // Repeat playlist - go to last song
      prevIndex = currentPlaylist.songs.length - 1
    } else {
      // Beginning of playlist
      return null
    }
    
    setCurrentSongIndex(prevIndex)
    return currentPlaylist.songs[prevIndex]
  }

  const toggleShuffle = () => {
    setIsShuffleEnabled(prev => !prev)
  }

  const toggleRepeat = () => {
    setIsRepeatEnabled(prev => !prev)
  }

  const value: PlaylistContextType = {
    playlists,
    currentPlaylist,
    currentSongIndex,
    isShuffleEnabled,
    isRepeatEnabled,
    
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    
    addSongToPlaylist,
    removeSongFromPlaylist,
    
    setCurrentPlaylist,
    setCurrentSongIndex,
    nextSong,
    previousSong,
    
    toggleShuffle,
    toggleRepeat
  }

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  )
}
