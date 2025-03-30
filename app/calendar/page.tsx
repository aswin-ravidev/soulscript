"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, PenSquare } from "lucide-react"
import Link from "next/link"

// Mock data for journal entries by date
const journalEntries = {
  "2024-03-01": { mood: "Happy", color: "bg-green-100 text-green-800" },
  "2024-03-05": { mood: "Anxious", color: "bg-amber-100 text-amber-800" },
  "2024-03-08": { mood: "Calm", color: "bg-blue-100 text-blue-800" },
  "2024-03-10": { mood: "Sad", color: "bg-blue-100 text-blue-800" },
  "2024-03-12": { mood: "Anxious", color: "bg-amber-100 text-amber-800" },
  "2024-03-14": { mood: "Hopeful", color: "bg-green-100 text-green-800" },
  "2024-03-15": { mood: "Calm", color: "bg-blue-100 text-blue-800" },
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())

  // Format date as YYYY-MM-DD for lookup in journalEntries
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // Get selected date's entry if it exists
  const selectedDateEntry = date ? journalEntries[formatDate(date)] : null

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Track your journaling and emotional patterns</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/journal/new">
            <PenSquare className="mr-2 h-4 w-4" /> New Entry
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Journal Calendar</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const prevMonth = new Date(month)
                    prevMonth.setMonth(prevMonth.getMonth() - 1)
                    setMonth(prevMonth)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const nextMonth = new Date(month)
                    nextMonth.setMonth(nextMonth.getMonth() + 1)
                    setMonth(nextMonth)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>Select a date to view your journal entry</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border"
              modifiers={{
                booked: (date) => {
                  const dateStr = formatDate(date)
                  return dateStr in journalEntries
                },
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold",
                  backgroundColor: "rgba(var(--primary), 0.1)",
                  color: "hsl(var(--primary))",
                },
              }}
            />
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-primary/20 mr-2"></div>
                <span className="text-sm">Journal Entry</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-100 mr-2"></div>
                <span className="text-sm">Positive Mood</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-amber-100 mr-2"></div>
                <span className="text-sm">Anxious Mood</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-blue-100 mr-2"></div>
                <span className="text-sm">Calm/Sad Mood</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {date
                ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "Select a Date"}
            </CardTitle>
            <CardDescription>{selectedDateEntry ? "Journal entry details" : "No entry for this date"}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateEntry ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Badge className={selectedDateEntry.color}>{selectedDateEntry.mood}</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Journal Entry</h3>
                  <Link href={`/journal/${formatDate(date!)}`} className="text-primary hover:underline">
                    View full entry
                  </Link>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Mood Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDateEntry.mood === "Happy" || selectedDateEntry.mood === "Hopeful"
                      ? "You were feeling positive on this day. What contributed to your good mood?"
                      : selectedDateEntry.mood === "Anxious"
                        ? "You experienced anxiety on this day. Consider reviewing potential triggers."
                        : "You were in a calm or reflective state on this day."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <PenSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Entry Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't created a journal entry for this date yet.
                </p>
                <Button asChild>
                  <Link href="/journal/new">Create Entry</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

