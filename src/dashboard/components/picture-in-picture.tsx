import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'

interface PictureInPictureProps {
  isVisible: boolean
  onClose: () => void
  onToggleFullPlayer: () => void
  // Music player props
  currentSong?: {
    name: string
    artist?: string
    albumArt?: string
  }
  isPlaying: boolean
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  volume: number[]
  onVolumeChange: (volume: number[]) => void
  // Video player props
  videoElement?: HTMLVideoElement | null
  isVideo?: boolean
}

export function PictureInPicture({
  isVisible,
  onClose,
  onToggleFullPlayer,
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  videoElement,
  isVideo = false
}: PictureInPictureProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const pipRef = useRef<HTMLDivElement>(null)

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === pipRef.current || (e.target as HTMLElement).closest('.pip-header')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragStart.y))
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Handle native video PiP for video elements
  const handleVideoPiP = async () => {
    if (isVideo && videoElement && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else {
          await videoElement.requestPictureInPicture()
        }
      } catch (error) {
        console.error('Error toggling video PiP:', error)
      }
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div
      ref={pipRef}
      className={cn(
        "fixed z-50 bg-background border rounded-lg shadow-2xl transition-all duration-200",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isMinimized ? "w-12 h-12" : "w-80 h-48"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="w-full h-full p-0 border-0">
        {/* Header */}
        <div className="pip-header flex items-center justify-between p-2 bg-muted/50 rounded-t-lg border-b">
          <div className="flex items-center gap-2">
            <Icons.music className="h-4 w-4" />
            <span className="text-xs font-medium truncate max-w-32">
              {isVideo ? 'Video Player' : (currentSong?.name || 'Music Player')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Icons.minus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onToggleFullPlayer}
            >
              <Icons.maximize className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <Icons.close className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3 space-y-3">
            {isVideo ? (
              // Video PiP content
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Video is playing</p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleVideoPiP}>
                    <Icons.pictureInPicture className="h-4 w-4 mr-1" />
                    Native PiP
                  </Button>
                </div>
              </div>
            ) : (
              // Music PiP content
              <>
                {/* Song info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    {currentSong?.albumArt ? (
                      <img 
                        src={currentSong.albumArt} 
                        alt="Album art" 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Icons.music className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentSong?.name || 'No song selected'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentSong?.artist || 'Unknown artist'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => onSeek(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="ghost" onClick={onPrevious}>
                    <Icons.skipBack className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={onPlayPause}>
                    {isPlaying ? (
                      <Icons.pause className="h-4 w-4" />
                    ) : (
                      <Icons.play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onNext}>
                    <Icons.skipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Icons.volume2 className="h-3 w-3" />
                  <Slider
                    value={volume}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={onVolumeChange}
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {volume[0]}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
