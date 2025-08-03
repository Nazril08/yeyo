import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePlaylistStore } from '@/stores/playlist-store'
import { Plus } from 'lucide-react'

interface CreatePlaylistDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onPlaylistCreated?: (playlistId: string) => void
}

export function CreatePlaylistDialog({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange, 
  onPlaylistCreated 
}: CreatePlaylistDialogProps = {}) {
  const { createPlaylist } = usePlaylistStore()
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const playlist = createPlaylist(name.trim(), description.trim() || undefined)
      setName('')
      setDescription('')
      setOpen(false)
      onPlaylistCreated?.(playlist.id)
    }
  }

  const isExternallyControlled = externalOpen !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isExternallyControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Playlist
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Create a new playlist to organize your music.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Playlist"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A collection of my favorite songs..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Playlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
