import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Music, ArrowLeft, FolderOpen, Play } from "lucide-react"
import { MultiVideoPlayer } from "./multi-video-player"
import { MultiMusicPlayer } from "./multi-music-player"

type CurrentView = 'main' | 'video' | 'music'

export function MultiMediaLayout() {
  const [currentView, setCurrentView] = useState<CurrentView>('main')

  if (currentView === 'video') {
    return <MultiVideoPlayer onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'music') {
    return <MultiMusicPlayer onBack={() => setCurrentView('main')} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FolderOpen className="w-8 h-8" />
          Multi-Directory Media Players
        </h1>
      </div>

      <div className="text-muted-foreground">
        <p>Enhanced media players that support multiple directories. Add multiple folders and browse all your media files in one place.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Multi Video Player Card */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              Multi-Directory Video Player
            </CardTitle>
            <CardDescription>
              Play videos from multiple directories with advanced controls and fullscreen support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Multiple directory support</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Advanced playback controls</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>Fullscreen mode with keyboard shortcuts</span>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentView('video')} 
              className="w-full"
            >
              <Video className="w-4 h-4 mr-2" />
              Open Video Player
            </Button>
          </CardContent>
        </Card>

        {/* Multi Music Player Card */}
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Music className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              Multi-Directory Music Player
            </CardTitle>
            <CardDescription>
              Play music from multiple directories with rich audio controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Multiple directory support</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Rich audio playback controls</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>Beautiful music player interface</span>
              </div>
            </div>
            <Button 
              onClick={() => setCurrentView('music')} 
              className="w-full"
            >
              <Music className="w-4 h-4 mr-2" />
              Open Music Player
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">How to use Multi-Directory Players</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium">Getting Started</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Click "Add Directory" to browse and select folders</li>
              <li>Add multiple directories to create a unified library</li>
              <li>All files from all directories will be listed together</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Persistent directory storage across sessions</li>
              <li>Remove directories individually when not needed</li>
              <li>Manual refresh to scan for new files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
