import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Upload, ArrowLeft, Video } from 'lucide-react'

interface VideoPlayerProps {
  onBack: () => void
}

export function VideoPlayer({ onBack }: VideoPlayerProps) {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [fileURL, setFileURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([100])
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState([1])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Cleanup URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL)
      }
    }
  }, [fileURL])

  // Initialize video when file is loaded
  useEffect(() => {
    if (videoRef.current && fileURL) {
      videoRef.current.load()
    }
  }, [fileURL])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        // Clean up previous URL
        if (fileURL) {
          URL.revokeObjectURL(fileURL)
        }
        
        const newURL = URL.createObjectURL(file)
        setCurrentFile(file)
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
      console.error('Playback failed:', error)
      toast({
        title: "Playback Error",
        description: "Failed to play video. Please try again.",
        variant: "destructive",
      })
      setIsPlaying(false)
    }
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

  const handlePlaybackRateChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = value[0]
      setPlaybackRate(value)
    }
  }

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Video className="h-6 w-6 text-red-500" />
        <h2 className="text-2xl font-bold">Video Player</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Player</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select Video File</Label>
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
                  toast({
                    title: "Video Error",
                    description: "Failed to load video file",
                    variant: "destructive",
                  })
                }}
                className="w-full max-h-96 bg-black rounded-lg"
                controls={false}
                preload="metadata"
              />

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
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg">No video file selected</p>
              <p className="text-sm">Upload a video file to start playing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
