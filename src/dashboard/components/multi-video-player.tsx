import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Upload, ArrowLeft, Video, Maximize, Minimize } from 'lucide-react'
import { useMultiDirectoryBrowser, MediaFile } from '@/hooks/use-multi-directory-browser'
import { MultiDirectoryList } from '@/components/multi-directory-list'
import { useMultiDirectoryStore } from '@/stores/multi-directory-provider'
import { invoke } from '@tauri-apps/api/tauri'

interface MultiVideoPlayerProps {
  onBack: () => void
}

export function MultiVideoPlayer({ onBack }: MultiVideoPlayerProps) {
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(null)
  const [fileURL, setFileURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([100])
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState([1])
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Multi directory store
  const { videoDirectories, addVideoDirectory, removeVideoDirectory } = useMultiDirectoryStore()

  // Video file extensions
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ogv']
  
  const {
    files,
    isLoading,
    lastRefresh,
    refreshFiles,
    getFileUrl,
  } = useMultiDirectoryBrowser({
    fileTypes: videoExtensions,
    directories: videoDirectories
  })

  // Add directory function
  const handleAddDirectory = async () => {
    try {
      const selectedDirectory = await invoke<string>('select_directory')
      if (selectedDirectory) {
        addVideoDirectory(selectedDirectory)
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
        title: "Video loaded",
        description: `${file.name} loaded successfully`,
      })
    } catch (error) {
      console.error('Failed to load file:', error)
      toast({
        title: "Load Error",
        description: "Failed to load video file",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
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
          type: 'video'
        }
        setCurrentFile(mediaFile)
        setFileURL(newURL)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        
        toast({
          title: "Video loaded",
          description: `${file.name} loaded successfully`,
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        })
      }
    }
  }

  const togglePlayPause = async () => {
    if (!videoRef.current || !currentFile) return

    try {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        await videoRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Play/pause error:', error)
      toast({
        title: "Playback Error",
        description: "Failed to play video",
        variant: "destructive",
      })
    }
  }

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0] / 100
      videoRef.current.volume = newVolume
      setVolume(value)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume[0] / 100
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      toast({
        title: "Fullscreen Error",
        description: "Failed to toggle fullscreen mode",
        variant: "destructive",
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen()
      }
      if (e.key === ' ' && currentFile && isFullscreen) {
        e.preventDefault()
        togglePlayPause()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, currentFile])

  const handlePlaybackRateChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = value[0]
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

  const videoFiles = files.filter(file => file.type === 'video')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="w-6 h-6" />
          Multi-Directory Video Player
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Browser */}
        <div>
          <MultiDirectoryList
            title="Video Library"
            directories={videoDirectories}
            files={videoFiles}
            isLoading={isLoading}
            lastRefresh={lastRefresh}
            currentFile={currentFile}
            onAddDirectory={handleAddDirectory}
            onRemoveDirectory={removeVideoDirectory}
            onRefresh={refreshFiles}
            onFileSelect={handleDirectoryFileSelect}
          />
        </div>

        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Video Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload - Keep as fallback */}
              <div className="space-y-2">
                <Label>Or select video file manually</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
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

              {/* Video Display */}
              {currentFile && (
                <div className="space-y-4">
                  <div 
                    ref={videoContainerRef}
                    className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}
                  >
                    <video
                      ref={videoRef}
                      src={fileURL || undefined}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error('Video error:', e)
                        console.error('Current file URL:', fileURL)
                        console.error('Current file path:', currentFile?.path)
                        toast({
                          title: "Video Error",
                          description: `Failed to load video file. Check console for details.`,
                          variant: "destructive",
                        })
                      }}
                      onLoadStart={() => {
                        console.log('Video load started for:', fileURL)
                      }}
                      onCanPlay={() => {
                        console.log('Video can play')
                      }}
                      className={`w-full ${isFullscreen ? 'h-full object-contain' : 'max-h-96'} bg-black rounded-lg`}
                      controls={false}
                      preload="metadata"
                    />
                    
                    {/* Fullscreen Controls Overlay */}
                    {isFullscreen && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
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
                            <div className="flex justify-between text-sm text-white">
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
                              className="bg-black/50 border-white/20 text-white hover:bg-white/20"
                            >
                              <SkipBack className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="icon"
                              onClick={togglePlayPause}
                              disabled={!currentFile}
                              className="w-12 h-12 bg-white text-black hover:bg-white/90"
                            >
                              {isPlaying ? (
                                <Pause className="w-6 h-6" />
                              ) : (
                                <Play className="w-6 h-6" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => skipTime(10)}
                              disabled={!currentFile}
                              className="bg-black/50 border-white/20 text-white hover:bg-white/20"
                            >
                              <SkipForward className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={toggleFullscreen}
                              disabled={!currentFile}
                              className="bg-black/50 border-white/20 text-white hover:bg-white/20"
                            >
                              <Minimize className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Regular Controls (Non-fullscreen) */}
                  {!isFullscreen && (
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
                          className="w-12 h-12"
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6" />
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

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleFullscreen}
                          disabled={!currentFile}
                        >
                          <Maximize className="w-4 h-4" />
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
                  )}
                </div>
              )}

              {!currentFile && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-lg">No video file selected</p>
                  <p className="text-sm">Add directories or upload a video file to start playing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
