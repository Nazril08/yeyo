import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { convertFileSrc } from '@tauri-apps/api/tauri'

export interface MediaFile {
  name: string
  path: string
  size: number
  modified: number
  type: 'audio' | 'video'
}

interface UseDirectoryBrowserProps {
  fileTypes: string[]
  initialDirectory?: string | null
}

export function useDirectoryBrowser({ 
  fileTypes, 
  initialDirectory = null
}: UseDirectoryBrowserProps) {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(initialDirectory)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Initialize with the provided directory
  useEffect(() => {
    console.log('useDirectoryBrowser: initialDirectory changed:', initialDirectory, 'current selectedDirectory:', selectedDirectory)
    if (initialDirectory && initialDirectory !== selectedDirectory) {
      console.log('Setting directory and refreshing files for:', initialDirectory)
      setSelectedDirectory(initialDirectory)
      refreshFiles(initialDirectory)
    } else if (initialDirectory && files.length === 0) {
      // If we have a directory but no files loaded, refresh
      console.log('Refreshing files for existing directory:', initialDirectory)
      refreshFiles(initialDirectory)
    }
  }, [initialDirectory, selectedDirectory])

  const selectDirectory = useCallback(async () => {
    try {
      const selected = await invoke<string>('select_directory')
      if (selected) {
        setSelectedDirectory(selected)
        await refreshFiles(selected)
        return selected // Return the selected directory
      }
    } catch (error) {
      console.error('Failed to select directory:', error)
    }
    return null
  }, [])

  const refreshFiles = useCallback(async (directory?: string) => {
    const targetDir = directory || selectedDirectory
    if (!targetDir) return

    setIsLoading(true)
    try {
      const result = await invoke<MediaFile[]>('scan_media_files', {
        directory: targetDir,
        extensions: fileTypes
      })
      setFiles(result)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to scan files:', error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedDirectory, fileTypes])

  // Auto-load files when selectedDirectory changes
  useEffect(() => {
    if (selectedDirectory) {
      refreshFiles(selectedDirectory)
    }
  }, [selectedDirectory])

  const getFileUrl = useCallback(async (filePath: string): Promise<string> => {
    try {
      console.log('Converting file path to URL:', filePath)
      
      if (!filePath || filePath.trim().length === 0) {
        console.error('Invalid file path provided:', filePath)
        return ''
      }
      
      // Use Tauri's convertFileSrc to properly convert file path to URL
      const url = convertFileSrc(filePath)
      console.log('Converted URL:', url)
      
      if (!url || url.length === 0) {
        console.error('convertFileSrc returned empty URL for path:', filePath)
        return ''
      }
      
      return url
    } catch (error) {
      console.error('Failed to convert file path:', filePath, 'Error:', error)
      return ''
    }
  }, [])

  // Listen for file system changes (if supported by Tauri)
  useEffect(() => {
    if (!selectedDirectory) return

    const unlisten = listen('file-changed', () => {
      refreshFiles()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [selectedDirectory, refreshFiles])

  return {
    selectedDirectory,
    files,
    isLoading,
    lastRefresh,
    selectDirectory,
    refreshFiles: () => refreshFiles(),
    getFileUrl,
    setSelectedDirectory // Export this so parent can update it
  }
}
