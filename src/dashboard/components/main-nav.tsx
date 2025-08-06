import { cn } from "@/lib/utils"

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export function MainNav({
  className,
  currentPage,
  setCurrentPage,
  ...props
}: MainNavProps) {

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <button
        onClick={() => setCurrentPage("overview")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "overview" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Overview
      </button>
      <button
        onClick={() => setCurrentPage("tools")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "tools" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Tools
      </button>
      <button
        onClick={() => setCurrentPage("media-player")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "media-player" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Media Player
      </button>
      <button
        onClick={() => setCurrentPage("ffmpeg")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "ffmpeg" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        FFmpeg
      </button>
    </nav>
  )
}
