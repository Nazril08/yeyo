import { cn } from "@/lib/utils"

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: string
  setCurrentPage: (page: string) => void
  setCurrentTool?: (tool: string | null) => void
}

export function MainNav({
  className,
  currentPage,
  setCurrentPage,
  setCurrentTool,
  ...props
}: MainNavProps) {
  const handlePageChange = (page: string) => {
    setCurrentPage(page)
    if (setCurrentTool) {
      setCurrentTool(null)
    }
  }

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <button
        onClick={() => handlePageChange("overview")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "overview" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Overview
      </button>
      <button
        onClick={() => handlePageChange("tools")}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          currentPage === "tools" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Tools
      </button>
    </nav>
  )
}
