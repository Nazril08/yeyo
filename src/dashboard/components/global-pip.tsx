import React, { useEffect } from 'react'
import { PictureInPicture } from './picture-in-picture'
import { usePiPStore } from '@/stores/pip-store'

export function GlobalPiP() {
  const { 
    pipState, 
    audioRef,
    hidePiP,
    updatePlayState,
    updateTime,
    updateVolume,
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onVolumeChange
  } = usePiPStore()

  // Handle play/pause from PiP
  const handlePlayPause = () => {
    if (onPlayPause) {
      onPlayPause()
    } else if (audioRef.current) {
      if (pipState.isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  // Handle seek from PiP
  const handleSeek = (time: number) => {
    if (onSeek) {
      onSeek(time)
    } else if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  // Handle volume change from PiP
  const handleVolumeChange = (volume: number[]) => {
    if (onVolumeChange) {
      onVolumeChange(volume)
    } else if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
      updateVolume(volume)
    }
  }

  // Handle next song from PiP
  const handleNext = () => {
    if (onNext) {
      onNext()
    }
  }

  // Handle previous song from PiP
  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
    }
  }

  // Setup audio element event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      updateTime(audio.currentTime, audio.duration || 0)
    }

    const handleLoadedMetadata = () => {
      updateTime(audio.currentTime, audio.duration || 0)
    }

    const handlePlay = () => {
      updatePlayState(true)
    }

    const handlePause = () => {
      updatePlayState(false)
    }

    const handleVolumeChangeAudio = () => {
      updateVolume([audio.volume * 100])
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('volumechange', handleVolumeChangeAudio)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('volumechange', handleVolumeChangeAudio)
    }
  }, [audioRef, updateTime, updatePlayState, updateVolume])

  // Update audio src when fileURL changes
  useEffect(() => {
    if (audioRef.current && pipState.fileURL) {
      audioRef.current.src = pipState.fileURL
      audioRef.current.load()
    }
  }, [pipState.fileURL, audioRef])

  return (
    <>
      {/* Global Audio Element */}
      <audio
        ref={audioRef}
        className="hidden"
      />
      
      {/* PiP Component */}
      <PictureInPicture
        isVisible={pipState.isVisible}
        onClose={hidePiP}
        onToggleFullPlayer={hidePiP}
        currentSong={pipState.currentSong || undefined}
        isPlaying={pipState.isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentTime={pipState.currentTime}
        duration={pipState.duration}
        onSeek={handleSeek}
        volume={pipState.volume}
        onVolumeChange={handleVolumeChange}
        isVideo={false}
      />
    </>
  )
}
