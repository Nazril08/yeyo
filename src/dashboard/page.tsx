
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarDateRangePicker } from "@/dashboard/components/date-range-picker"
import { MainNav } from "@/dashboard/components/main-nav"
import { Search } from "@/dashboard/components/search"
import TeamSwitcher from "@/dashboard/components/team-switcher"
import { UserNav } from "@/dashboard/components/user-nav"
import { YtMp4Downloader } from "@/dashboard/components/yt-mp4-downloader"
import { SpotifyDownloader } from "@/dashboard/components/spotify-downloader"
import { ThreadsDownloader } from "@/dashboard/components/threads-downloader"
import { TikTokDownloader } from "@/dashboard/components/tiktok-downloader"
import YouTubeDownloader from "@/dashboard/components/youtube-downloader"
import { cn } from "@/lib/utils"


export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState("overview")
  const [toolsSubPage, setToolsSubPage] = useState("overview")
  const [currentTool, setCurrentTool] = useState<string | null>(null)

  return (
    <>
      <div className="flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <TeamSwitcher />
            <MainNav 
              className="mx-6" 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage}
              setCurrentTool={setCurrentTool}
            />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <CalendarDateRangePicker />
              <Button>Download</Button>
            </div>
          </div>
          
          {currentPage === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              </div>
            </div>
          )}

          {currentPage === "tools" && !currentTool && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 lg:space-x-6 border-b pb-4">
                <button
                  onClick={() => setToolsSubPage("overview")}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    toolsSubPage === "overview" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setToolsSubPage("download")}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    toolsSubPage === "download" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Download
                </button>
              </div>
              
              {toolsSubPage === "overview" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("yt-mp4")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        YT MP4 Downloader
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">YouTube to MP4</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos from YouTube
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("spotify")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Spotify Downloader
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 9l6 6m0-6l-6 6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Spotify to MP3</div>
                      <p className="text-xs text-muted-foreground">
                        Download music from Spotify
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("threads")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Threads Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">@</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Threads Media</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and images from Threads
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("tiktok")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        TikTok Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">TikTok Videos</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and audio from TikTok
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("youtube")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        YouTube Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="white"
                          className="w-3 h-3"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">YouTube Videos</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and audio from YouTube
                      </p>
                    </CardContent>
                  </Card>
                 
                 
                </div>
              )}

              {toolsSubPage === "download" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("yt-mp4")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        YT MP4 Downloader
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">YouTube to MP4</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos from YouTube
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("spotify")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Spotify Downloader
                      </CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 9l6 6m0-6l-6 6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Spotify to MP3</div>
                      <p className="text-xs text-muted-foreground">
                        Download music from Spotify
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("threads")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Threads Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">@</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">Threads Media</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and images from Threads
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("tiktok")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        TikTok Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">TikTok Videos</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and audio from TikTok
                      </p>
                    </CardContent>
                  </Card>
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentTool("youtube")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        YouTube Downloader
                      </CardTitle>
                      <div className="w-4 h-4 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="white"
                          className="w-3 h-3"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">YouTube Videos</div>
                      <p className="text-xs text-muted-foreground">
                        Download videos and audio from YouTube
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {currentTool === "yt-mp4" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTool(null)}
                >
                  ← Back
                </Button>
              </div>
              <YtMp4Downloader />
            </div>
          )}

          {currentTool === "spotify" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTool(null)}
                >
                  ← Back
                </Button>
              </div>
              <SpotifyDownloader />
            </div>
          )}

          {currentTool === "threads" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTool(null)}
                >
                  ← Back
                </Button>
              </div>
              <ThreadsDownloader />
            </div>
          )}

          {currentTool === "tiktok" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTool(null)}
                >
                  ← Back
                </Button>
              </div>
              <TikTokDownloader />
            </div>
          )}

          {currentTool === "youtube" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTool(null)}
                >
                  ← Back
                </Button>
              </div>
              <YouTubeDownloader />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
