"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CalendarIcon, 
  Filter, 
  X 
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

// Type for journal entries
type JournalEntry = {
  _id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  mentalHealthClass: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get sentiment color
const getSentimentColor = (sentiment: string) => {
  const colors: Record<string, string> = {
    "Anxiety": "bg-orange-500",
    "Bipolar": "bg-pink-500",
    "Depression": "bg-purple-700",
    "Normal": "bg-green-500",
    "Personality disorder": "bg-blue-500",
    "Stress": "bg-red-500",
    "Suicidal": "bg-purple-900",
  }
  return colors[sentiment] || "bg-gray-500"
}

// Helper function to get mood color
const getMoodColor = (mood: string) => {
  const colors: Record<string, string> = {
    "Happy": "bg-green-400 hover:bg-green-500",
    "Sad": "bg-blue-400 hover:bg-blue-500",
    "Angry": "bg-red-400 hover:bg-red-500",
    "Anxious": "bg-orange-400 hover:bg-orange-500",
    "Calm": "bg-sky-400 hover:bg-sky-500",
    "Tired": "bg-slate-400 hover:bg-slate-500",
    "Excited": "bg-yellow-400 hover:bg-yellow-500",
    "Depressed": "bg-purple-400 hover:bg-purple-500",
    "Neutral": "bg-gray-400 hover:bg-gray-500",
  }
  return colors[mood] || "bg-gray-400 hover:bg-gray-500"
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState({ title: "", content: "" })
  const [editingEntry, setEditingEntry] = useState<null | { id: string; title: string; content: string }>(null)
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [selectedMood, setSelectedMood] = useState("all")
  const [selectedClass, setSelectedClass] = useState("all")
  // Get unique moods and classes for filters
  const [uniqueMoods, setUniqueMoods] = useState<string[]>([])
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([])
  // Filter dialog state
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  // Load user from localStorage and fetch journal entries
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      fetchJournalEntries()
    } else {
      // Redirect to login if not authenticated
      toast({
        title: "Authentication required",
        description: "Please log in to view your journal entries",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [router, toast])

  // Effect to apply filters whenever entries or filter conditions change
  useEffect(() => {
    applyFilters()
  }, [entries, searchTerm, dateRange, selectedMood, selectedClass])

  // Fetch journal entries from the API
  const fetchJournalEntries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/journal')
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries')
      }
      
      const data = await response.json()
      if (data.success && data.entries) {
        setEntries(data.entries)
        setFilteredEntries(data.entries)
        
        // Extract unique moods and classes for filter options
        const moods = Array.from(new Set(data.entries.map((entry: JournalEntry) => entry.mood)))
        const classes = Array.from(new Set(data.entries.map((entry: JournalEntry) => entry.mentalHealthClass)))
        
        setUniqueMoods(moods as string[])
        setUniqueClasses(classes as string[])
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error)
      toast({
        title: "Error",
        description: "Failed to load journal entries. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Apply all filters to entries
  const applyFilters = () => {
    let result = [...entries]
    
    // Apply search term filter (search in title and content)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        entry => 
          entry.title.toLowerCase().includes(term) || 
          entry.content.toLowerCase().includes(term)
      )
    }
    
    // Apply date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from)
      result = result.filter(entry => new Date(entry.date) >= fromDate)
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to)
      // Set to end of day
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(entry => new Date(entry.date) <= toDate)
    }
    
    // Apply mood filter
    if (selectedMood && selectedMood !== "all") {
      result = result.filter(entry => entry.mood === selectedMood)
    }
    
    // Apply mental health class filter
    if (selectedClass && selectedClass !== "all") {
      result = result.filter(entry => entry.mentalHealthClass === selectedClass)
    }
    
    setFilteredEntries(result)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateRange({ from: "", to: "" })
    setSelectedMood("all")
    setSelectedClass("all")
    setFilteredEntries(entries)
    setIsFilterDialogOpen(false)
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || editingEntry.title.trim() === "" || editingEntry.content.trim() === "") return

    try {
      const response = await fetch(`/api/journal/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: editingEntry.title, 
          content: editingEntry.content 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update journal entry')
      }

      // Refresh the entries list
      fetchJournalEntries()
      
      toast({
        title: "Entry updated",
        description: "Your journal entry has been updated successfully.",
      })
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEditingEntry(null)
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete journal entry')
      }

      // Update the local state
      setEntries(entries.filter(entry => entry._id !== id))
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted successfully.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete journal entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-screen-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Journal</h1>
            <p className="text-muted-foreground">Document your thoughts and feelings</p>
          </div>
          <Button onClick={() => router.push('/journal/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </div>

        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {(selectedMood !== "all" || selectedClass !== "all" || dateRange.from || dateRange.to) && (
                  <Badge variant="secondary" className="ml-1">
                    {(selectedMood !== "all" ? 1 : 0) + 
                     (selectedClass !== "all" ? 1 : 0) + 
                     (dateRange.from || dateRange.to ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Journal Entries</DialogTitle>
                <DialogDescription>
                  Use the options below to filter your journal entries.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(new Date(dateRange.from), "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from ? new Date(dateRange.from) : undefined}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date ? date.toISOString() : "" })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span>to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(new Date(dateRange.to), "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to ? new Date(dateRange.to) : undefined}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date ? date.toISOString() : "" })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mood</label>
                  <Select value={selectedMood} onValueChange={setSelectedMood}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All moods</SelectItem>
                      {uniqueMoods.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mental Health Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {uniqueClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={() => setIsFilterDialogOpen(false)}>
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredEntries.length === entries.length 
            ? `Showing all ${entries.length} entries` 
            : `Showing ${filteredEntries.length} of ${entries.length} entries`}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <p>Loading your journal entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-10">
            {entries.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-2">No entries match your filters</h2>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">No journal entries yet</h2>
                <p className="text-muted-foreground mb-4">Start journaling to track your mental health journey</p>
                <Button onClick={() => router.push('/journal/new')}>Create Your First Entry</Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <Card key={entry._id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{entry.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={`${getMoodColor(entry.mood)} text-white`}>{entry.mood}</Badge>
                      <Badge className={`${getSentimentColor(entry.mentalHealthClass)} text-white`}>{entry.mentalHealthClass}</Badge>
                    </div>
                  </div>
                  <CardDescription>{format(new Date(entry.date), "MMMM d, yyyy")}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm">
                    {entry.content.length > 150 
                      ? `${entry.content.substring(0, 150)}...` 
                      : entry.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingEntry({
                            id: entry._id,
                            title: entry.title,
                            content: entry.content,
                          })
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Journal Entry</DialogTitle>
                        <DialogDescription>Make changes to your journal entry.</DialogDescription>
                      </DialogHeader>
                      {editingEntry && (
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label htmlFor="edit-title">Title</label>
                            <Input
                              id="edit-title"
                              value={editingEntry.title}
                              onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="edit-content">Content</label>
                            <Textarea
                              id="edit-content"
                              value={editingEntry.content}
                              onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                              className="min-h-[200px]"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateEntry}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteEntry(entry._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}