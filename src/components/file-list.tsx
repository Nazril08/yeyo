import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Folder, 
  RefreshCw, 
  Play, 
  Music, 
  Video, 
  Clock,
  HardDrive,
  Plus,
  Check,
  X
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
  onMultipleAdd?: (files: MediaFile[]) => void
  showMultiSelect?: boolean
}

export function FileList({
  selectedDirectory,
  files,
  isLoading,
  lastRefresh,
  currentFile,
  onSelectDirectory,
  onRefresh,
  onFileSelect,
  onMultipleAdd,
  showMultiSelect = false
}: FileListProps) {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([])
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
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

  const toggleFileSelection = (file: MediaFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path)
      if (isSelected) {
        return prev.filter(f => f.path !== file.path)
      } else {
        return [...prev, file]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles([...files])
    }
  }

  const handleMultiAdd = () => {
    if (onMultipleAdd && selectedFiles.length > 0) {
      onMultipleAdd(selectedFiles)
      setSelectedFiles([])
      setIsMultiSelectMode(false)
    }
  }

  const cancelMultiSelect = () => {
    setSelectedFiles([])
    setIsMultiSelectMode(false)
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
            {showMultiSelect && !isMultiSelectMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMultiSelectMode(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Playlist
              </Button>
            )}
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
            {isMultiSelectMode && (
              <div className="flex items-center justify-between gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={selectedFiles.length === files.length && files.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="font-medium">
                    {selectedFiles.length} of {files.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleMultiAdd}
                    disabled={selectedFiles.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Add ({selectedFiles.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelMultiSelect}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
                {files.map((file, index) => {
                  const isSelected = selectedFiles.some(f => f.path === file.path)
                  const isCurrent = currentFile?.path === file.path
                  
                  return (
                    <div
                      key={`${file.path}-${index}`}
                      className={`p-3 rounded-lg border transition-all ${
                        isCurrent ? 'bg-primary/10 border-primary shadow-sm' : 
                        isSelected ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 
                        'hover:bg-accent border-border'
                      }`}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          toggleFileSelection(file)
                        } else {
                          onFileSelect(file)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {isMultiSelectMode && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleFileSelection(file)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        )}
                        <div className="flex-shrink-0">
                          {file.type === 'video' ? (
                            <Video className="h-5 w-5 text-red-500" />
                          ) : (
                            <Music className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate max-w-full" title={file.name}>
                              {file.name}
                            </span>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                <Play className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                            {isSelected && isMultiSelectMode && (
                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex-shrink-0">
                                ✓ Selected
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
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
