import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "@/dashboard/components/date-range-picker"
import { MainNav } from "@/dashboard/components/main-nav"
import { Search } from "@/dashboard/components/search"
import TeamSwitcher from "@/dashboard/components/team-switcher"
import { UserNav } from "@/dashboard/components/user-nav"
import { ToolsLayout } from "@/dashboard/components/tools"
import { MediaPlayer } from "@/dashboard/components/media-player"
import { FFmpegLayout } from "@/dashboard/components/ffmpeg/ffmpeg-layout"
import { DashboardCards } from "@/dashboard/components/dashboard-cards"
import AnimeLayout from "@/dashboard/components/anime/anime-layout"
import { ArrowLeft } from "lucide-react"

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState("overview")

  const handleBackToDashboard = () => {
    setCurrentPage("overview")
  }

  const renderPageHeader = () => {
    if (currentPage === "overview") {
      return (
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Button>Download</Button>
          </div>
        </div>
      )
    }

    const pageTitle = {
      "tools": "Tools & Utilities",
      "media-player": "Media Player", 
      "ffmpeg": "Video Processing"
    }[currentPage] || "Dashboard"

    return (
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleBackToDashboard}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
      </div>
    )
  }

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
            />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6 p-8 pt-6">
          {renderPageHeader()}
          
          {currentPage === "overview" && (
            <div className="space-y-6">
              {/* Main Feature Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <DashboardCards onNavigate={setCurrentPage} />
              </div>
            </div>
          )}

          {currentPage === "tools" && (
            <ToolsLayout />
          )}

          {currentPage === "anime-streaming" && (
            <AnimeLayout onBack={handleBackToDashboard} />
          )}

          {currentPage === "media-player" && (
            <MediaPlayer />
          )}

          {currentPage === "ffmpeg" && (
            <FFmpegLayout />
          )}
        </div>
      </div>
    </>
  )
}
