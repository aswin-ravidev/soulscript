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
import { fetchWithAuth } from "@/lib/client-auth"

interface AnalyticsData {
  totalEntries: number;
  recentEntries: Array<{
    id: string;
    title: string;
    content: string;
    mood: string;
    mentalHealthClass: string;
    createdAt: string;
  }>;
  moodDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  mentalHealthDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  moodTrend: Array<{
    date: string;
    mood: string;
    mentalHealthClass: string;
  }>;
  yearlyActivity: {
    year: number;
    months: number[];
  };
}

export default function UserAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<AnalyticsData['recentEntries'][number] | null>(null)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Add a cache-busting query parameter to ensure fresh data
      const timestamp = Date.now()
      const response = await fetchWithAuth(`/api/user/analytics?_=${timestamp}`) as Response
      
      if (!response.ok) {
        throw new Error('Failed to fetch user analytics')
      }
      
      const data = await response.json()
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics)
      } else {
        throw new Error(data.message || 'Failed to get analytics data')
      }
    } catch (err) {
      console.error('Error fetching user analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Add visibility change handler for tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchAnalytics])

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

  // Define all possible classes
  const allMoods = [
    'Angry',
    'Sad',
    'Confused',
    'Anxious',
    'Grateful',
    'Hopeful',
    'Calm',
    'Happy'
  ];

  const allHealthClasses = [
    'Suicidal',
    'Depression',
    'Personality disorder',
    'Bipolar',
    'Anxiety',
    'Stress',
    'Normal'
  ];

  // Add this new function after the formatYearlyActivity function
  const formatTrendsForChart = (trendData: Array<{ date: string; mood: string; mentalHealthClass: string }>, type: 'mood' | 'mentalHealth') => {
    if (!trendData || trendData.length === 0) return [];
    
    // Get the unique classes from the data
    const uniqueMoods = Array.from(new Set(trendData.map(d => d.mood)));
    const uniqueHealthClasses = Array.from(new Set(trendData.map(d => d.mentalHealthClass)));
    
    // Sort classes alphabetically to maintain consistent order
    uniqueMoods.sort();
    uniqueHealthClasses.sort();
    
    // Create mapping from class to index
    const moodMap: Record<string, number> = {};
    allMoods.forEach((mood, index) => {
      moodMap[mood] = index + 1;
    });
    
    const healthMap: Record<string, number> = {};
    allHealthClasses.forEach((cls, index) => {
      healthMap[cls] = index + 1;
    });
    
    // Keep chronological order (newest to oldest)
    return trendData.map((entry, index) => ({
      date: entry.date,
      value: type === 'mood' ? 
        moodMap[entry.mood] || (allMoods.length / 2) : // Default to middle if mood is undefined
        healthMap[entry.mentalHealthClass] || (allHealthClasses.length / 2), // Default to middle if health class is undefined
      text: type === 'mood' ? entry.mood : entry.mentalHealthClass,
      index: index + 1
    }));
  }

  // Add this function to format the trend data for a specific type
  const formatTrendData = (type: 'mood' | 'mentalHealth') => {
    if (!analytics || !analytics.moodTrend) return [];
    return formatTrendsForChart(analytics.moodTrend, type);
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
          <CardDescription>Your mood and mental health data</CardDescription>
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
          <CardDescription>Your mood and mental health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-muted-foreground mb-2">No journal entries found.</p>
            <p className="text-sm text-muted-foreground">Analytics will be available once you start journaling.</p>
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
                    <div className="text-2xl font-bold">{analytics.moodDistribution.sort((a, b) => b.value - a.value)[0].name}</div>
                    <Badge 
                      style={{ backgroundColor: analytics.moodDistribution.sort((a, b) => b.value - a.value)[0].color }}
                      className="text-white"
                    >
                      {Math.round((Number(analytics.moodDistribution.sort((a, b) => b.value - a.value)[0].value) / Number(analytics.totalEntries)) * 100)}%
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
                      {Math.round((Number(analytics.mentalHealthDistribution[0].value) / Number(analytics.totalEntries)) * 100)}%
                    </Badge>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No classification data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                        formatter={(value, name) => [`${value} entries (${((Number(value) / Number(analytics.totalEntries)) * 100).toFixed(0)}%)`, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

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
                        formatter={(value, name) => [`${value} entries (${((Number(value) / Number(analytics.totalEntries)) * 100).toFixed(0)}%)`, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Mood Analysis Tab */}
        <TabsContent value="mood" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>Breakdown of your emotional states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.moodDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} entries (${((Number(value) / Number(analytics.totalEntries)) * 100).toFixed(0)}%)`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Mood Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analytics.moodDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
              <CardDescription>How your mood has changed over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.moodTrend.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatTrendData('mood')}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={true}
                        domain={[1, allMoods.length]}
                        ticks={Array.from({ length: allMoods.length }, (_, i) => i + 1)}
                        tickFormatter={(value) => {
                          return allMoods[value - 1];
                        }}
                        tickSize={10}
                        tickLine={{ stroke: '#64748b', strokeWidth: 1 }}
                        tickMargin={10}
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'Mood') {
                            const mood = allMoods[value - 1];
                            return [value, mood || 'Unknown'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label?: string) => {
                          return label ? `Date: ${label}` : 'Date: Unknown';
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                        name="Mood"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Not enough data to show trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Mental Health Tab */}
        <TabsContent value="mental-health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Distribution</CardTitle>
              <CardDescription>Breakdown of your mental health states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.mentalHealthDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.mentalHealthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} entries (${((Number(value) / Number(analytics.totalEntries)) * 100).toFixed(0)}%)`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Mental Health Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analytics.mentalHealthDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mental Health Trends</CardTitle>
              <CardDescription>How your mental health has changed over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.moodTrend.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatTrendData('mentalHealth')}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={true}
                        domain={[1, allHealthClasses.length]}
                        ticks={Array.from({ length: allHealthClasses.length }, (_, i) => i + 1)}
                        tickFormatter={(value) => {
                          return allHealthClasses[value - 1];
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'Mental Health') {
                            const healthClass = allHealthClasses[value - 1];
                            return [value, healthClass];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label?: string) => {
                          return label ? `Date: ${label}` : 'Date: Unknown';
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={{ fill: '#82ca9d' }}
                        name="Mental Health"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Not enough data to show trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Journaling Activity</CardTitle>
              <CardDescription>Your journaling frequency throughout {analytics.yearlyActivity.year}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formatYearlyActivity()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} entries`, 'Journal Entries']} />
                    <Bar dataKey="entries" fill="#8884d8" name="Journal Entries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Activity Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">Most Active Month</p>
                    <p className="text-xl font-bold">
                      {getMonthName(analytics.yearlyActivity.months.indexOf(Math.max(...analytics.yearlyActivity.months)))}
                    </p>
                    <p className="text-sm">
                      {Math.max(...analytics.yearlyActivity.months)} entries
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">Average Monthly</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const totalEntries = analytics.yearlyActivity.months.reduce((a, b) => a + b, 0);
                        const monthsWithEntries = analytics.yearlyActivity.months.filter(month => month > 0).length;
                        return monthsWithEntries > 0 ? (totalEntries / monthsWithEntries).toFixed(1) : '0.0';
                      })()}
                    </p>
                    <p className="text-sm">
                      entries per active month
                    </p>
                  </div>
                </div>
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
