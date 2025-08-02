import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, Music, Video } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { MusicPlayer } from './music-player'

export function MediaPlayer() {
  const [selectedPlayer, setSelectedPlayer] = useState<'video' | 'music' | null>(null)

  if (selectedPlayer === 'video') {
    return <VideoPlayer onBack={() => setSelectedPlayer(null)} />
  }

  if (selectedPlayer === 'music') {
    return <MusicPlayer onBack={() => setSelectedPlayer(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <PlayCircle className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Media Player</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Player Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Video className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Video Player</CardTitle>
                <CardDescription>Play and control video files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Support for MP4, AVI, MKV, WebM and other popular video formats with full playback controls.
            </p>
            <Button 
              onClick={() => setSelectedPlayer('video')}
              className="w-full"
            >
              Open Video Player
            </Button>
          </CardContent>
        </Card>

        {/* Music Player Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Music className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Music Player</CardTitle>
                <CardDescription>Play and enjoy your music files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Support for MP3, WAV, FLAC, OGG and other audio formats with advanced audio controls.
            </p>
            <Button 
              onClick={() => setSelectedPlayer('music')}
              className="w-full"
            >
              Open Music Player
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
