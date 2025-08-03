import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { usePlaylistStore, Playlist } from '@/stores/playlist-store'
import { MediaFile } from '@/hooks/use-directory-browser'
import { CreatePlaylistDialog } from './create-playlist-dialog'
import { Music, Play, MoreVertical, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'

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
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set())

  const togglePlaylistExpanded = (playlistId: string) => {
    const newExpanded = new Set(expandedPlaylists)
    if (newExpanded.has(playlistId)) {
      newExpanded.delete(playlistId)
    } else {
      newExpanded.add(playlistId)
    }
    setExpandedPlaylists(newExpanded)
  }

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
        <ScrollArea className="h-[450px]">
          <div className="space-y-2">
            {playlists.map((playlist) => {
              const isExpanded = expandedPlaylists.has(playlist.id)
              return (
                <Card key={playlist.id} className={`group hover:bg-muted/50 transition-colors ${
                  selectedPlaylist?.id === playlist.id 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'hover:border-muted-foreground/20'
                }`}>
                  <Collapsible 
                    open={isExpanded} 
                    onOpenChange={() => togglePlaylistExpanded(playlist.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Music className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                              {selectedPlaylist?.id === playlist.id && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatDuration(playlist.songs)}
                              {playlist.description && ` • ${playlist.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          {playlist.songs.length > 0 && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-muted"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                          {currentFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddCurrentSong(playlist.id)
                              }}
                              disabled={playlist.songs.some(song => song.path === currentFile.path)}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayPlaylist(playlist)
                            }}
                            disabled={playlist.songs.length === 0}
                            className="h-7 px-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-3 h-3" />
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
                    </CardContent>
                    
                    <CollapsibleContent>
                      {playlist.songs.length > 0 && (
                        <CardContent className="pt-0 pb-3 px-3">
                          <div className="border-t pt-3">
                            <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                              Songs ({playlist.songs.length})
                            </h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {playlist.songs.map((song, index) => (
                                <div
                                  key={`${song.path}-${index}`}
                                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/70 cursor-pointer group/song transition-colors text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePlaySong(playlist, index)
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                      {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate" title={song.name}>
                                        {song.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {(song.size / 1024 / 1024).toFixed(1)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeSongFromPlaylist(playlist.id, index)
                                    }}
                                    className="h-6 w-6 p-0 opacity-0 group-hover/song:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
