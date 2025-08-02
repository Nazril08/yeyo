import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Folder, 
  RefreshCw, 
  Play, 
  Music, 
  Video, 
  Clock,
  HardDrive
} from 'lucide-react'
import { MediaFile } from '@/hooks/use-directory-browser'

interface FileListProps {
  selectedDirectory: string | null
  files: MediaFile[]
  isLoading: boolean
  lastRefresh: Date | null
  currentFile: MediaFile | null
  onSelectDirectory: () => void
  onRefresh: () => void
  onFileSelect: (file: MediaFile) => void
}

export function FileList({
  selectedDirectory,
  files,
  isLoading,
  lastRefresh,
  currentFile,
  onSelectDirectory,
  onRefresh,
  onFileSelect
}: FileListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Media Library
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {!selectedDirectory ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No directory selected</p>
            <Button onClick={onSelectDirectory} className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Select Media Directory
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span className="truncate flex-1">{selectedDirectory}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{files.length} files found</span>
              {lastRefresh && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectDirectory}
              className="w-full"
            >
              Change Directory
            </Button>
          </div>
        )}
      </CardHeader>

      {selectedDirectory && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[400px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Scanning files...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-8 w-8 mx-auto mb-2" />
                <p>No media files found in this directory</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.path}-${index}`}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                      currentFile?.path === file.path ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => onFileSelect(file)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {file.type === 'video' ? (
                          <Video className="h-5 w-5 text-red-500" />
                        ) : (
                          <Music className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                          {currentFile?.path === file.path && (
                            <Badge variant="secondary" className="text-xs">
                              <Play className="h-3 w-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{formatDate(file.modified)}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
