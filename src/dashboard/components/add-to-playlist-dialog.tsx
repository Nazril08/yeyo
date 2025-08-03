import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePlaylistStore } from '@/stores/playlist-store'
import { MediaFile } from '@/hooks/use-directory-browser'
import { CreatePlaylistDialog } from './create-playlist-dialog'
import { Music, Plus, Check } from 'lucide-react'

interface AddToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: MediaFile[]
  onSuccess: () => void
}

export function AddToPlaylistDialog({ 
  open, 
  onOpenChange, 
  files, 
  onSuccess 
}: AddToPlaylistDialogProps) {
  const { playlists, addSongToPlaylist } = usePlaylistStore()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) return
    
    setIsAdding(true)
    try {
      // Add all selected files to the playlist
      for (const file of files) {
        addSongToPlaylist(selectedPlaylistId, file)
      }
      
      onSuccess()
      onOpenChange(false)
      setSelectedPlaylistId(null)
    } catch (error) {
      console.error('Error adding songs to playlist:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleCreatePlaylist = () => {
    setShowCreateDialog(true)
  }

  const handlePlaylistCreated = (playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    setShowCreateDialog(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              Add {files.length} song{files.length > 1 ? 's' : ''} to a playlist
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selected files preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Selected Files:</h4>
              <ScrollArea className="h-40 rounded-md border bg-muted/50">
                <div className="p-3 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm bg-background rounded p-3">
                      <Music className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Playlist selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Choose Playlist:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePlaylist}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Playlist
                </Button>
              </div>

              {playlists.length === 0 ? (
                <div className="text-center py-8 px-4 border rounded-lg bg-muted/50">
                  <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">No playlists available</p>
                  <p className="text-xs text-muted-foreground">Create a new playlist to continue</p>
                </div>
              ) : (
                <ScrollArea className="h-40 rounded-md border bg-muted/50">
                  <div className="p-3 space-y-2">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedPlaylistId === playlist.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-medium truncate" title={playlist.name}>
                              {playlist.name}
                            </p>
                            <p className={`text-xs mt-1 truncate ${
                              selectedPlaylistId === playlist.id 
                                ? 'text-primary-foreground/80' 
                                : 'text-muted-foreground'
                            }`} title={playlist.description}>
                              {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}
                              {playlist.description && ` • ${playlist.description}`}
                            </p>
                          </div>
                          {selectedPlaylistId === playlist.id && (
                            <Check className="w-5 h-5 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToPlaylist}
              disabled={!selectedPlaylistId || isAdding}
              className="min-w-[120px]"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                `Add ${files.length} Song${files.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  )
}
