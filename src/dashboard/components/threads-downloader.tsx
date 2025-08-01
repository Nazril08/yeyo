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
import { Badge } from "@/components/ui/badge"

interface ThreadsApiResponse {
  videos: string[]
  images: string[]
}

export function ThreadsDownloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [response, setResponse] = useState<ThreadsApiResponse | null>(null)
  const [error, setError] = useState("")

  const handleDownload = async () => {
    if (!url) {
      setError("Please enter a Threads URL")
      return
    }

    // Validate Threads URL
    if (!url.includes("threads.com")) {
      setError("Please enter a valid Threads URL")
      return
    }

    setIsLoading(true)
    setError("")
    setResponse(null)

    try {
      const encodedUrl = encodeURIComponent(url)
      const apiUrl = `https://api.nzr.web.id/api/download/threads?url=${encodedUrl}`
      
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
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileDownload = async (fileUrl: string, type: 'video' | 'image') => {
    setIsDownloading(true)
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Generate filename based on type and timestamp
      const timestamp = new Date().getTime()
      const extension = type === 'video' ? 'mp4' : 'jpg'
      link.download = `threads_${type}_${timestamp}.${extension}`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(`Failed to download ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">@</span>
            </div>
            Threads Downloader
          </CardTitle>
          <CardDescription>
            Download videos and images from Threads posts. Paste the Threads post URL below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threads-url">Threads Post URL</Label>
            <Input
              id="threads-url"
              placeholder="https://www.threads.com/@username/post/..."
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
            <CardTitle>Download Results</CardTitle>
            <CardDescription>
              Found {response.videos.length} video(s) and {response.images.length} image(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Videos Section */}
            {response.videos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Videos</h3>
                  <Badge variant="secondary">{response.videos.length}</Badge>
                </div>
                <div className="space-y-2">
                  {response.videos.map((videoUrl, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Video {index + 1}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {videoUrl.substring(0, 80)}...
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleFileDownload(videoUrl, 'video')}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images Section */}
            {response.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Images</h3>
                  <Badge variant="secondary">{response.images.length}</Badge>
                </div>
                <div className="space-y-2">
                  {response.images.map((imageUrl, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Image {index + 1}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {imageUrl.substring(0, 80)}...
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleFileDownload(imageUrl, 'image')}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.videos.length === 0 && response.images.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No media files found in this Threads post.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
