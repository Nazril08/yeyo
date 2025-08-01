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

interface SpotifyApiResponse {
  url: string
  source: string
  author: string
  title: string
  thumbnail: string
  duration: string
  medias: Array<{
    url: string
    quality: string
    extension: string
    type: string
  }>
  type: string
  error: boolean
  time_end: number
}

export function SpotifyDownloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<SpotifyApiResponse | null>(null)
  const [error, setError] = useState("")

  const handleDownload = async () => {
    if (!url) {
      setError("Please enter a Spotify URL")
      return
    }

    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const encodedUrl = encodeURIComponent(url)
      const apiUrl = `https://api.nzr.web.id/api/download/aio?url=${encodedUrl}`
      
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
      console.log('Spotify API Response:', data)
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
    if (response?.medias && response.medias.length > 0) {
      const downloadUrl = response.medias[0].url
      setIsDownloading(true)
      try {
        // Fetch the file
        const fileResponse = await fetch(downloadUrl)
        const blob = await fileResponse.blob()
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${response.title}.${response.medias[0].extension}` || 'audio.mp3'
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to opening in new tab if direct download fails
        window.open(downloadUrl, '_blank')
      } finally {
        setIsDownloading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Spotify Downloader</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Enter the Spotify track URL to download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              placeholder="https://open.spotify.com/track/4hZUa0IFUOHhvZhK1YwXHu?si=ecf461d6c3b84c01"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              The URL of the content to download.
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
            <CardDescription>{response.title} - {response.author}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {response.thumbnail && (
                <img 
                  src={response.thumbnail} 
                  alt={response.title}
                  className="w-16 h-16 rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{response.title}</p>
                <p className="text-sm text-muted-foreground">{response.author}</p>
                <p className="text-sm text-muted-foreground">Duration: {response.duration}</p>
              </div>
            </div>
            <Button 
              onClick={handleDownloadFile}
              disabled={isDownloading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isDownloading ? "Mengunduh..." : `Unduh ${response.medias?.[0]?.extension?.toUpperCase() || 'Audio'}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
