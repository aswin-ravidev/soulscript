import type { LucideIcon } from "lucide-react"

interface RecommendationCardProps {
  title: string
  description: string
  icon: LucideIcon
}

export function RecommendationCard({ title, description, icon: Icon }: RecommendationCardProps) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-md border">
      <div className="rounded-full bg-primary/10 p-2 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

