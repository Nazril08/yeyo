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
        Dashboard
      </button>
    </nav>
  )
}
