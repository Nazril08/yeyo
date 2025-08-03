import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePlaylistStore, Playlist } from '@/stores/playlist-store'
import { MediaFile } from '@/hooks/use-directory-browser'
import { CreatePlaylistDialog } from './create-playlist-dialog'
import { Music, Play, MoreVertical, Trash2, Edit, Plus } from 'lucide-react'

interface PlaylistManagerProps {
  currentFile: MediaFile | null
  onSongSelect: (song: MediaFile) => void
}

export function PlaylistManager({ currentFile, onSongSelect }: PlaylistManagerProps) {
  const { 
    playlists, 
    currentPlaylist, 
    setCurrentPlaylist, 
    setCurrentSongIndex,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist 
  } = usePlaylistStore()
  
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(currentPlaylist)

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.songs.length > 0) {
      setCurrentPlaylist(playlist)
      setCurrentSongIndex(0)
      setSelectedPlaylist(playlist)
      onSongSelect(playlist.songs[0])
    }
  }

  const handlePlaySong = (playlist: Playlist, songIndex: number) => {
    setCurrentPlaylist(playlist)
    setCurrentSongIndex(songIndex)
    setSelectedPlaylist(playlist)
    onSongSelect(playlist.songs[songIndex])
  }

  const handleAddCurrentSong = (playlistId: string) => {
    if (currentFile) {
      addSongToPlaylist(playlistId, currentFile)
    }
  }

  const formatDuration = (songs: MediaFile[]): string => {
    const totalSize = songs.reduce((acc, song) => acc + (song.size || 0), 0)
    const mb = (totalSize / 1024 / 1024).toFixed(1)
    return `${songs.length} songs • ${mb} MB`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Playlists</h3>
        <CreatePlaylistDialog />
      </div>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Music className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No playlists yet</p>
            <CreatePlaylistDialog />
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className={`cursor-pointer transition-colors ${
                selectedPlaylist?.id === playlist.id ? 'ring-2 ring-primary' : ''
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{playlist.name}</CardTitle>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {playlist.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDuration(playlist.songs)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCurrentSong(playlist.id)}
                          disabled={playlist.songs.some(song => song.path === currentFile.path)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlayPlaylist(playlist)}
                        disabled={playlist.songs.length === 0}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => deletePlaylist(playlist.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                {playlist.songs.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {playlist.songs.slice(0, 3).map((song, index) => (
                        <div
                          key={`${song.path}-${index}`}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => handlePlaySong(playlist, index)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Music className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{song.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSongFromPlaylist(playlist.id, index)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {playlist.songs.length > 3 && (
                        <p className="text-xs text-muted-foreground px-2">
                          +{playlist.songs.length - 3} more songs
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
