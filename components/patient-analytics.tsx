"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalyticsData {
  totalEntries: number;
  recentEntries: any[];
  moodDistribution: { name: string; value: number; color: string }[];
  mentalHealthDistribution: { name: string; value: number; color: string }[];
  moodTrend: { date: string; mood: string; mentalHealthClass: string }[];
  yearlyActivity: { year: number; months: number[] };
}

interface PatientAnalyticsProps {
  patientId: string;
}

export default function PatientAnalytics({ patientId }: PatientAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!patientId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Add a cache-busting query parameter to ensure fresh data
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/patients/analytics?patientId=${patientId}&_=${timestamp}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient analytics')
        }
        
        const data = await response.json()
        
        if (data.success && data.analytics) {
          setAnalytics(data.analytics)
        } else {
          throw new Error(data.message || 'Failed to get analytics data')
        }
      } catch (err) {
        console.error('Error fetching patient analytics:', err)
        setError('Failed to load analytics. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
    
    // Set up a refresh interval to keep analytics up to date
    const refreshInterval = setInterval(() => {
      fetchAnalytics()
    }, 30000) // Refresh every 30 seconds for more up-to-date information
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [patientId])
  
  // Add visibility change handler for tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // This is a way to trigger a re-fetch of analytics when the tab becomes visible again
        const fetchAnalyticsOnFocus = async () => {
          if (!patientId) return
          
          try {
            const timestamp = new Date().getTime()
            const response = await fetch(`/api/patients/analytics?patientId=${patientId}&_=${timestamp}`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch patient analytics')
            }
            
            const data = await response.json()
            
            if (data.success && data.analytics) {
              setAnalytics(data.analytics)
            }
          } catch (err) {
            console.error('Error refreshing analytics:', err)
          }
        }
        
        fetchAnalyticsOnFocus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [patientId])

  // Helper to format month name from index
  const getMonthName = (index: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months[index]
  }

  // Format yearly activity data for bar chart
  const formatYearlyActivity = () => {
    if (!analytics?.yearlyActivity) return []
    
    return analytics.yearlyActivity.months.map((count, index) => ({
      month: getMonthName(index),
      entries: count
    }))
  }

  // Add this new function after the formatYearlyActivity function
  const formatTrendsForChart = (trendData: Array<{ date: string; mood: string; mentalHealthClass: string }>) => {
    if (!trendData || trendData.length === 0) return [];
    
    // Reverse the array to get chronological order (oldest to newest)
    return [...trendData].reverse().map((entry, index) => ({
      date: entry.date,
      mood: entry.mood,
      mentalHealthClass: entry.mentalHealthClass,
      // Add an index for the X-axis positioning
      index: index + 1
    }));
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Patient mood and mental health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!analytics || analytics.totalEntries === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Patient mood and mental health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-muted-foreground mb-2">No journal entries found for this patient.</p>
            <p className="text-sm text-muted-foreground">Analytics will be available once the patient starts journaling.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mood">Mood Analysis</TabsTrigger>
          <TabsTrigger value="mental-health">Mental Health</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Entries</CardTitle>
                <CardDescription>All-time journal entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics.totalEntries}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Primary Mood</CardTitle>
                <CardDescription>Most frequent mood</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.moodDistribution.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{analytics.moodDistribution[0].name}</div>
                    <Badge 
                      style={{ backgroundColor: analytics.moodDistribution[0].color }}
                      className="text-white"
                    >
                      {Math.round((analytics.moodDistribution[0].value / analytics.totalEntries) * 100)}%
                    </Badge>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No mood data available</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Mental Health Status</CardTitle>
                <CardDescription>Most frequent classification</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.mentalHealthDistribution.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{analytics.mentalHealthDistribution[0].name}</div>
                    <Badge 
                      style={{ backgroundColor: analytics.mentalHealthDistribution[0].color }}
                      className="text-white"
                    >
                      {Math.round((analytics.mentalHealthDistribution[0].value / analytics.totalEntries) * 100)}%
                    </Badge>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No classification data available</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mood Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>Emotional state analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.moodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Mental Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Mental Health Classification</CardTitle>
                <CardDescription>Mental health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.mentalHealthDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.mentalHealthDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
              <CardDescription>Latest 5 entries from the patient</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentEntries.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentEntries.map((entry) => (
                    <div key={entry._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{entry.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline">{entry.mood}</Badge>
                          <Badge 
                            className="text-white"
                            style={{ backgroundColor: getSentimentColor(entry.mentalHealthClass) }}
                          >
                            {entry.mentalHealthClass}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{new Date(entry.date).toLocaleDateString()}</p>
                      <p className="text-sm line-clamp-2">{entry.content}</p>
                      <div className="mt-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsEntryDialogOpen(true);
                          }}
                        >
                          Read
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Journal Entry Dialog */}
                  <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
                    <DialogContent className="sm:max-w-md md:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{selectedEntry?.title}</DialogTitle>
                        <DialogDescription>
                          <div className="flex flex-wrap gap-2 mt-1 mb-2">
                            <Badge variant="outline">{selectedEntry?.mood}</Badge>
                            <Badge 
                              className="text-white"
                              style={{ backgroundColor: getSentimentColor(selectedEntry?.mentalHealthClass) }}
                            >
                              {selectedEntry?.mentalHealthClass}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {selectedEntry && new Date(selectedEntry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="p-4">
                          <p>{selectedEntry?.content}</p>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent entries available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mood Analysis Tab */}
        <TabsContent value="mood" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>Emotional state breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.moodDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      paddingAngle={1}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} entries`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Add the new Mood Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Trend Timeline</CardTitle>
              <CardDescription>Mood changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {analytics.moodTrend.length > 5 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatTrendsForChart(analytics.moodTrend)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="mood" 
                        type="category"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'mood' ? 'Mood' : name]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Need at least 6 entries to show trend timeline</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mood Trend</CardTitle>
              <CardDescription>Recent mood patterns (last 10 entries)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px] h-[300px]">
                  {analytics.moodTrend.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.moodTrend.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-24 text-sm text-muted-foreground">{entry.date}</div>
                          <div 
                            className="flex-1 h-8 rounded-md flex items-center px-3 text-white"
                            style={{ backgroundColor: getMoodColor(entry.mood) }}
                          >
                            {entry.mood}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Not enough entries to show mood trends</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mental Health Tab */}
        <TabsContent value="mental-health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Classification</CardTitle>
              <CardDescription>AI-based mental health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.mentalHealthDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      paddingAngle={1}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.mentalHealthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} entries`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Add the new Mental Health Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Timeline</CardTitle>
              <CardDescription>Mental health changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {analytics.moodTrend.length > 5 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatTrendsForChart(analytics.moodTrend)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="mentalHealthClass" 
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'mentalHealthClass' ? 'Mental Health Class' : name]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mentalHealthClass"
                        stroke="#e91e63"
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Need at least 6 entries to show trend timeline</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Trend</CardTitle>
              <CardDescription>Recent classification patterns (last 10 entries)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px] h-[300px]">
                  {analytics.moodTrend.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.moodTrend.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-24 text-sm text-muted-foreground">{entry.date}</div>
                          <div 
                            className="flex-1 h-8 rounded-md flex items-center px-3 text-white"
                            style={{ backgroundColor: getSentimentColor(entry.mentalHealthClass) }}
                          >
                            {entry.mentalHealthClass}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Not enough entries to show mental health trends</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Activity</CardTitle>
              <CardDescription>Journal entries by month ({analytics.yearlyActivity.year})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatYearlyActivity()}>
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entries" fill="#8884d8" name="Journal Entries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get mood color
function getMoodColor(mood: string) {
  const colors: Record<string, string> = {
    "Happy": "#4caf50",
    "Sad": "#2196f3",
    "Angry": "#f44336",
    "Anxious": "#ff9800",
    "Calm": "#00bcd4",
    "Tired": "#9e9e9e",
    "Excited": "#ffeb3b",
    "Depressed": "#9c27b0",
    "Neutral": "#607d8b"
  };
  
  return colors[mood] || "#607d8b";
}

// Helper function to get sentiment color
function getSentimentColor(sentiment: string) {
  const colors: Record<string, string> = {
    "Anxiety": "#ff9800",
    "Bipolar": "#e91e63",
    "Depression": "#9c27b0",
    "Normal": "#4caf50",
    "Personality disorder": "#2196f3",
    "Stress": "#f44336",
    "Suicidal": "#6a1b9a"
  };
  
  return colors[sentiment] || "#9e9e9e";
} 