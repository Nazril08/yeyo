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
import { Badge } from "@/components/ui/badge"

interface TikTokApiResponse {
  url: string
  source: string
  id: string
  unique_id: string
  author: string
  title: string
  thumbnail: string
  duration: number
  medias: Array<{
    url: string
    data_size?: number
    quality: string
    extension: string
    type: string
    duration?: number
  }>
  type: string
  error: boolean
  time_end: number
}

export function TikTokDownloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<TikTokApiResponse | null>(null)
  const [error, setError] = useState("")

  const handleDownload = async () => {
    if (!url) {
      setError("Please enter a TikTok URL")
      return
    }

    // Validate TikTok URL
    if (!url.includes("tiktok.com") && !url.includes("vt.tiktok.com")) {
      setError("Please enter a valid TikTok URL")
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
      
      if (data.error) {
        throw new Error("Failed to process TikTok URL")
      }

      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileDownload = async (media: TikTokApiResponse['medias'][0]) => {
    setIsDownloading(true)
    try {
      const response = await fetch(media.url)
      const blob = await response.blob()
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Generate filename based on quality and type
      const timestamp = new Date().getTime()
      const filename = `tiktok_${media.type}_${media.quality}_${timestamp}.${media.extension}`
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(`Failed to download: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'hd_no_watermark':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'no_watermark':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'watermark':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'audio':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            TikTok Downloader
          </CardTitle>
          <CardDescription>
            Download videos and audio from TikTok. Paste the TikTok URL below to get download options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tiktok-url">TikTok URL</Label>
            <Input
              id="tiktok-url"
              placeholder="https://www.tiktok.com/@username/video/... or https://vt.tiktok.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button 
            onClick={handleDownload} 
            disabled={isLoading || !url}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Get Download Links"}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Download Options</CardTitle>
            <CardDescription>
              Video by @{response.unique_id} • Duration: {formatDuration(response.duration)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Info */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <img 
                src={response.thumbnail} 
                alt="Video thumbnail"
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2">{response.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  By {response.author} (@{response.unique_id})
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {response.id}
                </p>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Available Downloads:</h3>
              <div className="space-y-2">
                {response.medias.map((media, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={getQualityColor(media.quality)}
                        >
                          {media.quality.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">
                          {media.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {media.extension.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(media.data_size)}
                        {media.duration && ` • ${Math.floor(media.duration)}s`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleFileDownload(media)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? "Downloading..." : "Download"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {response.medias.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No download options available for this TikTok video.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
