import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Upload, ArrowLeft, Music, Shuffle, Repeat, List } from 'lucide-react'
import { useDirectoryBrowser, MediaFile } from '@/hooks/use-directory-browser'
import { FileList } from '@/components/file-list'
import { useMediaDirectoryStore } from '@/stores/media-directory-provider'
import { usePlaylistStore } from '@/stores/playlist-store'
import { PlaylistManager } from './playlist-manager'
import { AddToPlaylistDialog } from './add-to-playlist-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MusicPlayerProps {
  onBack: () => void
}

export function MusicPlayer({ onBack }: MusicPlayerProps) {
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null)
  const [fileURL, setFileURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([100])
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState([1])
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false)
  const [selectedFilesForPlaylist, setSelectedFilesForPlaylist] = useState<MediaFile[]>([])
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Global directory store
  const { selectedDirectory: globalDirectory, setSelectedDirectory: setGlobalDirectory } = useMediaDirectoryStore()
  
  // Playlist store
  const { 
    currentPlaylist, 
    currentSongIndex, 
    isShuffleEnabled, 
    isRepeatEnabled,
    nextSong, 
    previousSong, 
    toggleShuffle, 
    toggleRepeat 
  } = usePlaylistStore()

  // Audio file extensions
  const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma', 'opus', 'webm']
  
  const {
    selectedDirectory,
    files,
    isLoading,
    lastRefresh,
    selectDirectory: selectDirectoryHook,
    refreshFiles,
    getFileUrl,
    setSelectedDirectory
  } = useDirectoryBrowser({
    fileTypes: audioExtensions,
    initialDirectory: globalDirectory
  })

  // Custom selectDirectory that updates global store
  const selectDirectory = async () => {
    const newDirectory = await selectDirectoryHook()
    if (newDirectory) {
      setGlobalDirectory(newDirectory)
    }
  }

  // Sync global directory changes with local hook
  useEffect(() => {
    if (globalDirectory && globalDirectory !== selectedDirectory) {
      setSelectedDirectory(globalDirectory)
    }
  }, [globalDirectory, selectedDirectory, setSelectedDirectory])

  // Filter only audio files
  const audioFiles = files.filter(file => file.type === 'audio')

  // Cleanup URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (fileURL && currentFile && !currentFile.path) {
        URL.revokeObjectURL(fileURL)
      }
    }
  }, [fileURL, currentFile])

  // Initialize audio when file is loaded
  useEffect(() => {
    if (audioRef.current && fileURL) {
      audioRef.current.load()
    }
  }, [fileURL])

  // Handle auto-play when audio is ready
  useEffect(() => {
    if (shouldAutoPlay && audioRef.current && fileURL) {
      const handleCanPlay = () => {
        if (audioRef.current && shouldAutoPlay) {
          audioRef.current.play().then(() => {
            setIsPlaying(true)
            setShouldAutoPlay(false) // Reset auto-play flag
          }).catch((error) => {
            console.error('Auto-play failed:', error)
            setShouldAutoPlay(false)
          })
        }
      }

      const audio = audioRef.current
      audio.addEventListener('canplay', handleCanPlay)
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [shouldAutoPlay, fileURL])

  // Handle file selection from directory or playlist
  const handleSongSelect = async (file: MediaFile, autoPlay: boolean = false) => {
    try {
      // Clean up previous URL - only if it was created by createObjectURL
      if (fileURL && currentFile && !currentFile.path) {
        URL.revokeObjectURL(fileURL)
      }
      
      console.log('Loading audio file:', file.path || 'manual upload')
      console.log('File object:', file)
      
      // Reset audio element state first
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        console.log('Audio element reset')
      }
      
      const newURL = file.path ? await getFileUrl(file.path) : fileURL
      console.log('Converted audio URL:', newURL)
      console.log('New URL length:', newURL?.length)
      
      // Validate URL before setting
      if (!newURL || newURL.length === 0) {
        throw new Error('Failed to get valid audio URL')
      }
      
      setCurrentFile(file)
      setFileURL(newURL)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(false) // Always start with stopped state
      setShouldAutoPlay(autoPlay)
      
      console.log('State updated, autoPlay:', autoPlay)
      
      toast({
        title: "Audio loaded",
        description: `${file.name} loaded successfully`,
      })
    } catch (error) {
      console.error('Failed to load file:', error)
      console.error('Error details:', error)
      toast({
        title: "Load Error",
        description: "Failed to load audio file",
        variant: "destructive",
      })
    }
  }

  // Handle file selection from directory
  const handleDirectoryFileSelect = async (file: MediaFile) => {
    await handleSongSelect(file)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        // Clean up previous URL - only if it was created by createObjectURL
        if (fileURL && currentFile && !currentFile.path) {
          URL.revokeObjectURL(fileURL)
        }
        
        const newURL = URL.createObjectURL(file)
        // Convert File to MediaFile format for consistency
        const mediaFile: MediaFile = {
          name: file.name,
          path: '', // Empty path indicates this is from manual upload
          size: file.size,
          modified: Date.now() / 1000,
          type: 'audio'
        }
        setCurrentFile(mediaFile)
        setFileURL(newURL)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        
        toast({
          title: "Audio loaded",
          description: `${file.name} loaded successfully`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        })
      }
    }
  }

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentFile) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('Playback failed:', error)
      toast({
        title: "Playback Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
    if (value[0] > 0) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume[0] / 100
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handlePlaybackRateChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = value[0]
      setPlaybackRate(value)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const seekTime = (value[0] / 100) * duration
      audioRef.current.currentTime = seekTime
    }
  }

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    }
  }

  // Handle next song (manual or auto-play)
  const handleNextSong = async (autoPlay: boolean = false) => {
    // First try playlist next song
    const nextSongFile = nextSong()
    if (nextSongFile) {
      const shouldAutoPlay = autoPlay || isPlaying
      await handleSongSelect(nextSongFile, shouldAutoPlay)
    } else if (currentFile && files.length > 0) {
      // If no playlist, try next file in media library
      const currentIndex = files.findIndex(file => file.path === currentFile.path)
      if (currentIndex !== -1 && currentIndex < files.length - 1) {
        const nextFile = files[currentIndex + 1]
        if (audioExtensions.some(ext => nextFile.name.toLowerCase().endsWith(ext))) {
          const shouldAutoPlay = autoPlay || isPlaying
          await handleSongSelect(nextFile, shouldAutoPlay)
        } else {
          // Find next audio file
          for (let i = currentIndex + 1; i < files.length; i++) {
            const file = files[i]
            if (audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
              const shouldAutoPlay = autoPlay || isPlaying
              await handleSongSelect(file, shouldAutoPlay)
              return
            }
          }
          // No more audio files
          setIsPlaying(false)
          toast({
            title: "End of media",
            description: "No more audio files to play",
          })
        }
      } else {
        // End of file list
        setIsPlaying(false)
        toast({
          title: "End of media",
          description: "No more audio files to play",
        })
      }
    } else {
      // No next song available
      setIsPlaying(false)
      toast({
        title: "End of playlist",
        description: "No more songs to play",
      })
    }
  }

  // Wrapper for manual next song button click
  const handleNextSongClick = () => {
    handleNextSong(false) // Manual click, use current playing state
  }

  // Handle previous song (manual or auto-play)
  const handlePreviousSong = async (autoPlay: boolean = false) => {
    // First try playlist previous song
    const prevSongFile = previousSong()
    if (prevSongFile) {
      const shouldAutoPlay = autoPlay || isPlaying
      await handleSongSelect(prevSongFile, shouldAutoPlay)
    } else if (currentFile && files.length > 0) {
      // If no playlist, try previous file in media library
      const currentIndex = files.findIndex(file => file.path === currentFile.path)
      if (currentIndex > 0) {
        const prevFile = files[currentIndex - 1]
        if (audioExtensions.some(ext => prevFile.name.toLowerCase().endsWith(ext))) {
          const shouldAutoPlay = autoPlay || isPlaying
          await handleSongSelect(prevFile, shouldAutoPlay)
        } else {
          // Find previous audio file
          for (let i = currentIndex - 1; i >= 0; i--) {
            const file = files[i]
            if (audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
              const shouldAutoPlay = autoPlay || isPlaying
              await handleSongSelect(file, shouldAutoPlay)
              return
            }
          }
          // No previous audio files, restart current song
          if (audioRef.current) {
            audioRef.current.currentTime = 0
          }
        }
      } else {
        // No previous song, restart current song
        if (audioRef.current) {
          audioRef.current.currentTime = 0
        }
      }
    } else {
      // No previous song, restart current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    }
  }

  // Wrapper for manual previous song button click
  const handlePreviousSongClick = () => {
    handlePreviousSong(false) // Manual click, use current playing state
  }

  // Handle song ended - auto-play next song if in playlist
  const handleSongEnded = () => {
    console.log('Song ended, auto-playing next song...')
    
    // If we have a current playlist, use playlist next song logic with auto-play
    if (currentPlaylist && currentPlaylist.songs.length > 0) {
      handleNextSong(true) // Force auto-play for next song
    } else if (currentFile && files.length > 0) {
      // If no playlist but we have files in media library, play next file
      const currentIndex = files.findIndex(file => file.path === currentFile.path)
      if (currentIndex !== -1 && currentIndex < files.length - 1) {
        const nextFile = files[currentIndex + 1]
        if (audioExtensions.some(ext => nextFile.name.toLowerCase().endsWith(ext))) {
          handleSongSelect(nextFile, true) // Auto-play next file
        }
      } else {
        // End of file list
        setIsPlaying(false)
        toast({
          title: "End of media",
          description: "No more audio files to play",
        })
      }
    } else {
      // No more songs to play
      setIsPlaying(false)
      toast({
        title: "Playback finished",
        description: "End of playlist",
      })
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Sync with global audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      const duration = audio.duration || 0
      console.log('Audio metadata loaded, duration:', duration, 'for file:', currentFile?.name)
      setDuration(duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      handleSongEnded()
    }

    const handleError = (e: any) => {
      console.error('Audio error:', e)
      toast({
        title: "Audio Error",
        description: `Failed to load audio file.`,
        variant: "destructive",
      })
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioRef, handleSongEnded, toast])

  // Auto-play when audio is ready
  useEffect(() => {
    if (shouldAutoPlay && audioRef.current && fileURL) {
      const handleCanPlay = () => {
        const audio = audioRef.current
        if (audio && shouldAutoPlay) {
          audio.play().then(() => {
            setIsPlaying(true)
            setShouldAutoPlay(false)
          }).catch((error) => {
            console.error('Auto-play failed:', error)
            setShouldAutoPlay(false)
          })
        }
      }

      const audio = audioRef.current
      if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
        handleCanPlay()
      } else {
        audio.addEventListener('canplay', handleCanPlay)
        return () => {
          audio.removeEventListener('canplay', handleCanPlay)
        }
      }
    }
  }, [shouldAutoPlay, fileURL, audioRef])

  const handleMultipleAdd = (files: MediaFile[]) => {
    setSelectedFilesForPlaylist(files)
    setShowAddToPlaylistDialog(true)
  }

  const handleAddToPlaylistSuccess = () => {
    toast({
      title: "Songs Added",
      description: `Successfully added ${selectedFilesForPlaylist.length} song${selectedFilesForPlaylist.length > 1 ? 's' : ''} to playlist`,
    })
    setSelectedFilesForPlaylist([])
  }

  // Handle song selection from playlist (with auto-play if currently playing)
  const handlePlaylistSongSelect = async (file: MediaFile) => {
    try {
      console.log('Playlist song selected:', file)
      console.log('File path:', file.path)
      console.log('Current playing state:', isPlaying)
      
      // Force reload the audio to ensure proper initialization
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
      const wasPlaying = isPlaying
      setIsPlaying(false) // Stop current playback immediately
      
      // Wait a bit to ensure audio element is properly reset
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await handleSongSelect(file, wasPlaying)
    } catch (error) {
      console.error('Error selecting playlist song:', error)
      toast({
        title: "Playback Error",
        description: "Failed to load song from playlist",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Music className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold">Music Player</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Browser & Playlists */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="files" className="mt-4">
              <FileList
                selectedDirectory={selectedDirectory}
                files={audioFiles}
                isLoading={isLoading}
                lastRefresh={lastRefresh}
                currentFile={currentFile}
                onSelectDirectory={selectDirectory}
                onRefresh={refreshFiles}
                onFileSelect={handleDirectoryFileSelect}
                onMultipleAdd={handleMultipleAdd}
                showMultiSelect={true}
              />
            </TabsContent>
            <TabsContent value="playlists" className="mt-4">
              <PlaylistManager 
                currentFile={currentFile}
                onSongSelect={handlePlaylistSongSelect}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Music Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Music Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload - Keep as fallback */}
              <div className="space-y-2">
                <Label>Or select audio file manually</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
                {currentFile && (
                  <p className="text-sm text-muted-foreground">
                    Loaded: {currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Audio Display */}
              {currentFile && (
                <div className="space-y-4">
                  {/* Audio Info */}
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-xl font-semibold">{currentFile.name}</h3>
                    <p className="text-muted-foreground">
                      {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {currentPlaylist && (
                      <p className="text-sm text-muted-foreground mt-2">
                        From playlist: {currentPlaylist.name} • Song {currentSongIndex + 1} of {currentPlaylist.songs.length}
                      </p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Slider
                        value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                        onValueChange={handleSeek}
                        max={100}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Shuffle */}
                      <Button
                        variant={isShuffleEnabled ? "default" : "outline"}
                        size="icon"
                        onClick={toggleShuffle}
                        disabled={!currentPlaylist}
                      >
                        <Shuffle className="w-4 h-4" />
                      </Button>
                      
                      {/* Previous Song */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousSongClick}
                        disabled={!currentPlaylist}
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        onClick={togglePlayPause}
                        disabled={!currentFile}
                        className="w-12 h-12"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                      
                      {/* Next Song */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextSongClick}
                        disabled={!currentPlaylist}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      
                      {/* Repeat */}
                      <Button
                        variant={isRepeatEnabled ? "default" : "outline"}
                        size="icon"
                        onClick={toggleRepeat}
                        disabled={!currentPlaylist}
                      >
                        <Repeat className="w-4 h-4" />
                      </Button>
                      
                    </div>

                    {/* Volume and Speed Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Volume Control */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            className="w-6 h-6 p-0"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                          Volume: {isMuted ? 0 : volume[0]}%
                        </Label>
                        <Slider
                          value={isMuted ? [0] : volume}
                          onValueChange={handleVolumeChange}
                          max={100}
                          step={1}
                          disabled={!currentFile}
                        />
                      </div>

                      {/* Speed Control */}
                      <div className="space-y-2">
                        <Label>Playback Speed: {playbackRate[0]}x</Label>
                        <Slider
                          value={playbackRate}
                          onValueChange={handlePlaybackRateChange}
                          min={0.25}
                          max={2}
                          step={0.25}
                          disabled={!currentFile}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!currentFile && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-lg">No audio file selected</p>
                  <p className="text-sm">Select a directory or upload an audio file to start playing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        open={showAddToPlaylistDialog}
        onOpenChange={setShowAddToPlaylistDialog}
        files={selectedFilesForPlaylist}
        onSuccess={handleAddToPlaylistSuccess}
      />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={fileURL || undefined}
        preload="metadata"
      />
    </div>
  )
}
