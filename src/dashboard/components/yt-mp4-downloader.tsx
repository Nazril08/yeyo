import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ApiResponse {
  title: string
  download_url: string
  description: string
}

export function YtMp4Downloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState("")

  const handleDownload = async () => {
    if (!url) {
      setError("Please enter a YouTube URL")
      return
    }

    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const encodedUrl = encodeURIComponent(url)
      const apiUrl = `https://api.nzr.web.id/api/download/ytmp4-advanced?url=${encodedUrl}`
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setUrl("")
    setResponse(null)
    setError("")
  }

  const handleDownloadFile = async () => {
    if (response?.download_url) {
      setIsDownloading(true)
      try {
        // Fetch the file
        const fileResponse = await fetch(response.download_url)
        const blob = await fileResponse.blob()
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${response.title}.mp4` || 'video.mp4'
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to opening in new tab if direct download fails
        window.open(response.download_url, '_blank')
      } finally {
        setIsDownloading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">YouTube MP4 Downloader</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Enter the YouTube video URL to download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              placeholder="https://youtu.be/P_gxkH7wyIc?si=ygjFN7sXLinapYUh"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              The URL of the YouTube video to download.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleDownload} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Execute"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Unduhan Siap</CardTitle>
            <CardDescription>{response.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDownloadFile}
              disabled={isDownloading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isDownloading ? "Mengunduh..." : "Unduh MP4"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
