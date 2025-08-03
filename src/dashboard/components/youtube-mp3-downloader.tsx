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
import { useToast } from "@/components/ui/use-toast"

interface YouTubeMP3Data {
  title: string
  download_url: string
}

export function YouTubeMP3Downloader() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [data, setData] = useState<YouTubeMP3Data | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const validateYouTubeURL = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  const handleDownload = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL")
      return
    }

    if (!validateYouTubeURL(url)) {
      setError("Please enter a valid YouTube URL")
      return
    }

    setIsLoading(true)
    setError("")
    setData(null)

    try {
      const encodedUrl = encodeURIComponent(url)
      const apiUrl = `https://api.nzr.web.id/api/download/ytmp3-advanced?url=${encodedUrl}`
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: YouTubeMP3Data = await response.json()
      
      if (result.title && result.download_url) {
        setData({
          title: result.title,
          download_url: result.download_url
        })
        
        toast({
          title: "Success!",
          description: "YouTube MP3 data fetched successfully",
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching YouTube MP3 data:", err)
      setError("Failed to fetch YouTube MP3 data. Please try again.")
      toast({
        title: "Error",
        description: "Failed to fetch YouTube MP3 data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectDownload = async () => {
    if (!data?.download_url) return
    
    setIsDownloading(true)
    try {
      // Fetch the file
      const fileResponse = await fetch(data.download_url)
      const blob = await fileResponse.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${data.title}.mp3` || "audio.mp3"
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download Started",
        description: "Your MP3 download has started",
      })
    } catch (error) {
      console.error("Download failed:", error)
      // Fallback to opening in new tab if direct download fails
      window.open(data.download_url, "_blank")
      toast({
        title: "Download Error",
        description: "Failed to download, opened in new tab instead",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const clearData = () => {
    setUrl("")
    setData(null)
    setError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">YouTube MP3 Downloader</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Enter the YouTube video URL to download as MP3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              placeholder="https://youtu.be/ewU4mcWplxQ?si=J3X-ubOIAH5hjSen"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The URL of the YouTube video to download as MP3.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleDownload} 
              disabled={isLoading || !url.trim()}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Execute"}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearData}
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

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Unduhan Siap</CardTitle>
            <CardDescription>{data.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDirectDownload}
              disabled={isDownloading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {isDownloading ? "Mengunduh..." : "Unduh MP3"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Paste any YouTube video URL</li>
              <li>• Click "Execute" to fetch download link</li>
              <li>• Download the MP3 file directly</li>
              <li>• Supports all YouTube video formats</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default YouTubeMP3Downloader
