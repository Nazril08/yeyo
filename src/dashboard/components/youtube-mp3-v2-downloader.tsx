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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Download, Music, Play, Copy, ExternalLink, Eye } from "lucide-react"

interface YouTubeMP3V2Data {
  metadata: {
    title: string
    type: string
    format: string
    duration: string
    quality: string
    uploader: string
  }
  thumbnail: string
  download: string
}

export function YouTubeMP3V2Downloader() {
  const [url, setUrl] = useState("")
  const [quality, setQuality] = useState("64k")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [data, setData] = useState<YouTubeMP3V2Data | null>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<'download' | 'preview'>('download')
  const { toast } = useToast()

  const qualityOptions = [
    { value: "64k", label: "64k" },
    { value: "128k", label: "128k" },
    { value: "192k", label: "192k" },
    { value: "256k", label: "256k" },
    { value: "320k", label: "320k" },
  ]

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
      const apiUrl = `https://api.nzr.web.id/api/download/yt-mp3-v2?url=${encodedUrl}&quality=${quality}`
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: YouTubeMP3V2Data = await response.json()
      
      if (result.metadata?.title && result.download) {
        setData(result)
        
        toast({
          title: "Success!",
          description: "YouTube MP3 v2 data fetched successfully",
        })
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching YouTube MP3 v2 data:", err)
      setError("Failed to fetch YouTube MP3 v2 data. Please try again.")
      toast({
        title: "Error",
        description: "Failed to fetch YouTube MP3 v2 data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectDownload = async () => {
    if (!data?.download) return
    
    setIsDownloading(true)
    try {
      // Fetch the file
      const fileResponse = await fetch(data.download)
      const blob = await fileResponse.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${data.metadata.title}.mp3` || "audio.mp3"
      
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
      window.open(data.download, "_blank")
      toast({
        title: "Download Error",
        description: "Failed to download, opened in new tab instead",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreview = () => {
    setActiveTab('preview')
  }

  const handleCopyUrl = () => {
    if (data?.download) {
      navigator.clipboard.writeText(data.download)
      toast({
        title: "Copied!",
        description: "Download URL copied to clipboard",
      })
    }
  }

  const handleOpenUrl = () => {
    if (data?.download) {
      window.open(data.download, '_blank', 'noopener,noreferrer')
    }
  }

  const formatDuration = (duration: string) => {
    return duration // Already formatted from API
  }

  const clearData = () => {
    setUrl("")
    setQuality("64k")
    setData(null)
    setError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">YouTube MP3 v2 Downloader</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Enter the YouTube video URL and select quality to download as MP3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              placeholder="https://youtu.be/n53dV2hEhVA?si=p7Mv3DURW-TC6lS_"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The YouTube video URL.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality">Quality *</Label>
            <Select value={quality} onValueChange={setQuality} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              MP3 quality.
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
            <CardTitle>Download Ready</CardTitle>
            <CardDescription>{data.metadata.title}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tabs for Download and Preview */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'download' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="download" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Download Tab */}
              <TabsContent value="download" className="space-y-4">
                {/* Metadata Display */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <p>{data.metadata.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Format:</span>
                    <p>{data.metadata.format}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Duration:</span>
                    <p>{data.metadata.duration}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Quality:</span>
                    <p>{data.metadata.quality}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-muted-foreground">Uploader:</span>
                    <p>{data.metadata.uploader}</p>
                  </div>
                </div>

                {/* Thumbnail */}
                {data.thumbnail && (
                  <div className="flex justify-center">
                    <img 
                      src={data.thumbnail} 
                      alt="Video thumbnail" 
                      className="max-w-sm rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Download Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleDirectDownload}
                    disabled={isDownloading}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    {isDownloading ? "Mengunduh..." : "Unduh MP3"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handlePreview}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Preview Audio
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleCopyUrl}
                      className="flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleOpenUrl}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Music className="h-4 w-4" />
                      Audio Preview
                      <Badge variant="outline">{data.metadata.quality}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Audio Player */}
                      <div className="w-full">
                        <audio
                          className="w-full"
                          controls
                          preload="metadata"
                        >
                          <source src={data.download} type="audio/mpeg" />
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                      
                      {/* Audio Visualization/Artwork */}
                      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                        <img 
                          src={data.thumbnail} 
                          alt="Audio artwork"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold line-clamp-2">{data.metadata.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Music className="h-4 w-4" />
                            {data.metadata.uploader} • {data.metadata.duration}
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Info */}
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{data.metadata.quality}</Badge>
                            <Badge variant="secondary">{data.metadata.format.toUpperCase()}</Badge>
                            <Badge variant="outline">{data.metadata.type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Audio Only • {data.metadata.duration}
                          </div>
                        </div>
                      </div>

                      {/* Download Button in Preview */}
                      <Button 
                        onClick={handleDirectDownload}
                        disabled={isDownloading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {isDownloading ? "Mengunduh..." : "Download This MP3"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
              <li>• Select your preferred MP3 quality (64k - 320k)</li>
              <li>• Click "Execute" to fetch download link</li>
              <li>• Download the MP3 file directly</li>
              <li>• Higher quality = better sound but larger file size</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default YouTubeMP3V2Downloader
