import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface InsightCardProps {
  title: string
  value: string
  description: string
  trend: string
  icon: LucideIcon
}

export function InsightCard({ title, value, description, trend, icon: Icon }: InsightCardProps) {
  const isPositive = trend.startsWith("+")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className={`mt-4 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>{trend}</div>
      </CardContent>
    </Card>
  )
}

