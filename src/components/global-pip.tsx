import React from 'react'
import { usePiPStore } from '@/stores/pip-store'
import { PictureInPicture } from '@/dashboard/components/picture-in-picture'

export function GlobalPiP() {
  const {
    pipState,
    hidePiP,
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onVolumeChange
  } = usePiPStore()

  const handleToggleFullPlayer = () => {
    // Could implement navigation back to music player if needed
    hidePiP()
  }

  return (
    <PictureInPicture
      isVisible={pipState.isVisible}
      onClose={hidePiP}
      onToggleFullPlayer={handleToggleFullPlayer}
      currentSong={pipState.currentSong || undefined}
      isPlaying={pipState.isPlaying}
      onPlayPause={onPlayPause || (() => {})}
      onNext={onNext || (() => {})}
      onPrevious={onPrevious || (() => {})}
      currentTime={pipState.currentTime}
      duration={pipState.duration}
      onSeek={onSeek || (() => {})}
      volume={pipState.volume}
      onVolumeChange={onVolumeChange || (() => {})}
      isVideo={false}
    />
  )
}
