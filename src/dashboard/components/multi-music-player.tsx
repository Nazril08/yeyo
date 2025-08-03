import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Upload, ArrowLeft, Music } from 'lucide-react'
import { useMultiDirectoryBrowser, MediaFile } from '@/hooks/use-multi-directory-browser'
import { MultiDirectoryList } from '@/components/multi-directory-list'
import { useMultiDirectoryStore } from '@/stores/multi-directory-provider'
import { invoke } from '@tauri-apps/api/tauri'

interface MultiMusicPlayerProps {
  onBack: () => void
}

export function MultiMusicPlayer({ onBack }: MultiMusicPlayerProps) {
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null)
  const [fileURL, setFileURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([100])
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState([1])
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Multi directory store
  const { musicDirectories, addMusicDirectory, removeMusicDirectory } = useMultiDirectoryStore()

  // Audio file extensions
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']
  
  const {
    files,
    isLoading,
    lastRefresh,
    refreshFiles,
    getFileUrl,
  } = useMultiDirectoryBrowser({
    fileTypes: audioExtensions,
    directories: musicDirectories
  })

  // Add directory function
  const handleAddDirectory = async () => {
    try {
      const selectedDirectory = await invoke<string>('select_directory')
      if (selectedDirectory) {
        addMusicDirectory(selectedDirectory)
        toast({
          title: "Directory Added",
          description: `Added: ${selectedDirectory}`,
        })
      }
    } catch (error) {
      console.error('Failed to select directory:', error)
      toast({
        title: "Directory Selection Failed",
        description: "Failed to select directory",
        variant: "destructive",
      })
    }
  }

  // Handle file selection from directory
  const handleDirectoryFileSelect = async (file: MediaFile) => {
    try {
      console.log('Loading file from directory:', file)
      
      // Clean up previous URL - only if it was created by createObjectURL
      if (fileURL && currentFile && !currentFile.path) {
        URL.revokeObjectURL(fileURL)
      }
      
      const url = await getFileUrl(file)
      setCurrentFile(file)
      setFileURL(url)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      
      toast({
        title: "Audio loaded",
        description: `${file.name} loaded successfully`,
      })
    } catch (error) {
      console.error('Failed to load file:', error)
      toast({
        title: "Load Error",
        description: "Failed to load audio file",
        variant: "destructive",
      })
    }
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
          path: '',
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
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Play/pause error:', error)
      toast({
        title: "Playback Error",
        description: "Failed to play audio",
        variant: "destructive",
      })
    }
  }

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0] / 100
      audioRef.current.volume = newVolume
      setVolume(value)
      setIsMuted(newVolume === 0)
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

  // Cleanup function
  useEffect(() => {
    return () => {
      if (fileURL && currentFile && !currentFile.path) {
        URL.revokeObjectURL(fileURL)
      }
    }
  }, [fileURL, currentFile])

  const audioFiles = files.filter(file => file.type === 'audio')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Music className="w-6 h-6" />
          Multi-Directory Music Player
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Browser */}
        <div>
          <MultiDirectoryList
            title="Music Library"
            directories={musicDirectories}
            files={audioFiles}
            isLoading={isLoading}
            lastRefresh={lastRefresh}
            currentFile={currentFile}
            onAddDirectory={handleAddDirectory}
            onRemoveDirectory={removeMusicDirectory}
            onRefresh={refreshFiles}
            onFileSelect={handleDirectoryFileSelect}
          />
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

              {/* Audio Player */}
              {currentFile && (
                <div className="space-y-6">
                  {/* Audio Element (hidden) */}
                  <audio
                    ref={audioRef}
                    src={fileURL || undefined}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => {
                      console.error('Audio error:', e)
                      toast({
                        title: "Audio Error",
                        description: "Failed to load audio file",
                        variant: "destructive",
                      })
                    }}
                    preload="metadata"
                  />

                  {/* Album Art Placeholder */}
                  <div className="flex justify-center">
                    <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">{currentFile.name}</h3>
                    <p className="text-muted-foreground">
                      {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => skipTime(-10)}
                      disabled={!currentFile}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="icon"
                      onClick={togglePlayPause}
                      disabled={!currentFile}
                      className="w-16 h-16"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => skipTime(10)}
                      disabled={!currentFile}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Volume and Speed Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              )}

              {!currentFile && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-lg">No audio file selected</p>
                  <p className="text-sm">Add directories or upload an audio file to start playing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
