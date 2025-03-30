import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Edit2 } from "lucide-react"
import { JournalEntryType, MentalHealthClass } from "@/lib/models/JournalEntry"
import { format } from "date-fns"

interface RecentJournalsProps {
  entries: JournalEntryType[];
}

const getMoodColor = (mentalHealthClass: MentalHealthClass) => {
  const colors = {
    'Anxiety': 'bg-yellow-100 text-yellow-800',
    'Bipolar': 'bg-purple-100 text-purple-800',
    'Depression': 'bg-blue-100 text-blue-800',
    'Normal': 'bg-green-100 text-green-800',
    'Personality disorder': 'bg-pink-100 text-pink-800',
    'Stress': 'bg-orange-100 text-orange-800',
    'Suicidal': 'bg-red-100 text-red-800',
  } as const;
  return colors[mentalHealthClass] || 'bg-gray-100 text-gray-800';
};

export function RecentJournals({ entries }: RecentJournalsProps) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry._id} className="flex flex-col md:flex-row justify-between p-4 rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{entry.title}</h3>
              <Badge variant="outline" className={getMoodColor(entry.mentalHealthClass)}>
                {entry.mood}
              </Badge>
              <Badge variant="outline" className="bg-slate-100">
                {entry.mentalHealthClass}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{entry.content.substring(0, 200)}...</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.date), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center mt-4 md:mt-0 space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/journal/${entry._id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/journal/${entry._id}`}>
                Read <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

