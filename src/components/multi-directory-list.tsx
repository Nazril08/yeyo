import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, X, Plus, RefreshCw } from 'lucide-react'
import { MediaFile } from '@/hooks/use-multi-directory-browser'

interface MultiDirectoryListProps {
  title: string
  directories: string[]
  files: MediaFile[]
  isLoading: boolean
  lastRefresh: Date | null
  currentFile: MediaFile | null
  onAddDirectory: () => void
  onRemoveDirectory: (directory: string) => void
  onRefresh: () => void
  onFileSelect: (file: MediaFile) => void
}

export function MultiDirectoryList({
  title,
  directories,
  files,
  isLoading,
  lastRefresh,
  currentFile,
  onAddDirectory,
  onRemoveDirectory,
  onRefresh,
  onFileSelect
}: MultiDirectoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Directory Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Directories ({directories.length})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddDirectory}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Directory
              </Button>
            </div>
          </div>

          {/* Directory List */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {directories.length > 0 ? (
              directories.map((directory, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 p-2 rounded text-xs"
                >
                  <span className="truncate flex-1" title={directory}>
                    {directory}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveDirectory(directory)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No directories added yet
              </div>
            )}
          </div>
        </div>

        {/* File Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{files.length} files found</span>
          {lastRefresh && (
            <span>Last: {lastRefresh.toLocaleTimeString()}</span>
          )}
        </div>

        {/* File List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Scanning directories...
            </div>
          ) : files.length > 0 ? (
            files.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentFile?.path === file.path
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(file.modified * 1000).toLocaleDateString()}</span>
                    </div>
                    {(file as any).sourceDirectory && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        📁 {(file as any).sourceDirectory}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {file.type}
                  </Badge>
                </div>
              </div>
            ))
          ) : directories.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No media files found</p>
              <p className="text-xs">Try refreshing or adding more directories</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Add directories to get started</p>
              <p className="text-xs">Click "Add Directory" to browse for media files</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
