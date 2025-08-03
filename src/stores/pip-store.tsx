import React, { createContext, useContext, useState, ReactNode, useRef } from 'react'
import { MediaFile } from '@/hooks/use-directory-browser'

interface PiPState {
  isVisible: boolean
  currentSong: {
    name: string
    artist?: string
    albumArt?: string
  } | null
  currentFile: MediaFile | null
  fileURL: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number[]
  playbackRate: number[]
}

interface PiPContextType {
  pipState: PiPState
  audioRef: React.RefObject<HTMLAudioElement>
  showPiP: (song: { name: string; artist?: string; albumArt?: string }) => void
  hidePiP: () => void
  updateCurrentFile: (file: MediaFile | null, fileURL: string | null) => void
  updatePlayState: (isPlaying: boolean) => void
  updateTime: (currentTime: number, duration: number) => void
  updateVolume: (volume: number[]) => void
  updatePlaybackRate: (playbackRate: number[]) => void
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onSeek?: (time: number) => void
  onVolumeChange?: (volume: number[]) => void
  onPlaybackRateChange?: (playbackRate: number[]) => void
  setCallbacks: (callbacks: {
    onPlayPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (time: number) => void
    onVolumeChange: (volume: number[]) => void
    onPlaybackRateChange: (playbackRate: number[]) => void
  }) => void
}

const PiPContext = createContext<PiPContextType | undefined>(undefined)

export function usePiPStore() {
  const context = useContext(PiPContext)
  if (!context) {
    throw new Error('usePiPStore must be used within a PiPProvider')
  }
  return context
}

export function PiPProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [pipState, setPiPState] = useState<PiPState>({
    isVisible: false,
    currentSong: null,
    currentFile: null,
    fileURL: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: [100],
    playbackRate: [1]
  })

  const [callbacks, setCallbacks] = useState<{
    onPlayPause?: () => void
    onNext?: () => void
    onPrevious?: () => void
    onSeek?: (time: number) => void
    onVolumeChange?: (volume: number[]) => void
    onPlaybackRateChange?: (playbackRate: number[]) => void
  }>({})

  const showPiP = (song: { name: string; artist?: string; albumArt?: string }) => {
    setPiPState(prev => ({
      ...prev,
      isVisible: true,
      currentSong: song
    }))
  }

  const hidePiP = () => {
    setPiPState(prev => ({
      ...prev,
      isVisible: false
    }))
  }

  const updateCurrentFile = (file: MediaFile | null, fileURL: string | null) => {
    setPiPState(prev => ({
      ...prev,
      currentFile: file,
      fileURL
    }))
  }

  const updatePlayState = (isPlaying: boolean) => {
    setPiPState(prev => ({
      ...prev,
      isPlaying
    }))
  }

  const updateTime = (currentTime: number, duration: number) => {
    setPiPState(prev => ({
      ...prev,
      currentTime,
      duration
    }))
  }

  const updateVolume = (volume: number[]) => {
    setPiPState(prev => ({
      ...prev,
      volume
    }))
  }

  const updatePlaybackRate = (playbackRate: number[]) => {
    setPiPState(prev => ({
      ...prev,
      playbackRate
    }))
  }

  const setCallbacksHandler = (newCallbacks: {
    onPlayPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (time: number) => void
    onVolumeChange: (volume: number[]) => void
    onPlaybackRateChange: (playbackRate: number[]) => void
  }) => {
    setCallbacks(newCallbacks)
  }

  return (
    <PiPContext.Provider
      value={{
        pipState,
        audioRef,
        showPiP,
        hidePiP,
        updateCurrentFile,
        updatePlayState,
        updateTime,
        updateVolume,
        updatePlaybackRate,
        onPlayPause: callbacks.onPlayPause,
        onNext: callbacks.onNext,
        onPrevious: callbacks.onPrevious,
        onSeek: callbacks.onSeek,
        onVolumeChange: callbacks.onVolumeChange,
        onPlaybackRateChange: callbacks.onPlaybackRateChange,
        setCallbacks: setCallbacksHandler
      }}
    >
      {children}
    </PiPContext.Provider>
  )
}
