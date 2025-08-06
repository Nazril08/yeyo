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

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState("overview")

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
                {/* Add overview cards here in the future */}
              </div>
            </div>
          )}

          {currentPage === "tools" && (
            <ToolsLayout />
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
