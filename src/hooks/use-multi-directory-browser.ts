import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

export interface MediaFile {
  name: string
  path: string
  size: number
  modified: number
  type: 'video' | 'audio'
}

interface UseMultiDirectoryBrowserProps {
  fileTypes: string[]
  directories: string[]
}

export function useMultiDirectoryBrowser({
  fileTypes,
  directories
}: UseMultiDirectoryBrowserProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const scanAllDirectories = useCallback(async () => {
    if (directories.length === 0) {
      setFiles([])
      return
    }

    setIsLoading(true)
    try {
      console.log('Scanning directories:', directories)
      
      // Scan all directories in parallel
      const allFilesPromises = directories.map(async (directory) => {
        try {
          const files = await invoke<MediaFile[]>('scan_media_files', {
            directory,
            extensions: fileTypes
          })
          return files.map(file => ({
            ...file,
            sourceDirectory: directory // Add source directory info
          }))
        } catch (error) {
          console.error(`Failed to scan directory ${directory}:`, error)
          return []
        }
      })

      const allFilesArrays = await Promise.all(allFilesPromises)
      
      // Flatten and sort by name
      const allFiles = allFilesArrays
        .flat()
        .sort((a, b) => a.name.localeCompare(b.name))

      console.log(`Found ${allFiles.length} files from ${directories.length} directories`)
      setFiles(allFiles)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to scan directories:', error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [directories, fileTypes])

  // Scan directories whenever they change
  useEffect(() => {
    scanAllDirectories()
  }, [scanAllDirectories])

  const getFileUrl = async (file: MediaFile): Promise<string> => {
    try {
      const url = await invoke<string>('get_file_url', { filePath: file.path })
      console.log('Got file URL:', url)
      return url
    } catch (error) {
      console.error('Failed to get file URL:', error)
      throw error
    }
  }

  const refreshFiles = () => {
    scanAllDirectories()
  }

  // Listen for file system changes
  useEffect(() => {
    const unlistenPromise = listen('file-changed', () => {
      console.log('File system change detected, refreshing...')
      refreshFiles()
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [])

  return {
    files,
    isLoading,
    lastRefresh,
    refreshFiles,
    getFileUrl,
    scanAllDirectories
  }
}
