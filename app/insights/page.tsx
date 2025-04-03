"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoodChart } from "@/components/mood-chart"
import { EmotionPieChart } from "@/components/emotion-pie-chart"
import { InsightCard } from "@/components/insight-card"
import { Brain, Calendar, Clock, Heart, TrendingUp } from "lucide-react"

export default function InsightsPage() {
  const router = useRouter()
  const [isTherapist, setIsTherapist] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is a therapist
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          // Not logged in, redirect to login
          router.push('/login')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.role === 'therapist') {
            setIsTherapist(true)
          } else {
            // Regular user, stay on insights page
            setIsTherapist(false)
          }
        } else {
          // Error fetching user data, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [router])

  // Show nothing while checking user role
  if (isLoading) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">Monitor your emotional patterns and growth</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mood">Mood Tracking</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard
              title="Mood Score"
              value="4.2/5"
              description="Average over 30 days"
              trend="+0.3"
              icon={Heart}
            />
            <InsightCard
              title="Journal Entries"
              value="18"
              description="Written this month"
              trend="+5"
              icon={Calendar}
            />
            <InsightCard title="Mindfulness" value="85%" description="Completion rate" trend="+12%" icon={Brain} />
            <InsightCard
              title="Avg. Session"
              value="12 min"
              description="Time journaling"
              trend="+2 min"
              icon={Clock}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mood Trends</CardTitle>
              <CardDescription>Your emotional patterns over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <MoodChart />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>Breakdown of your recorded emotions</CardDescription>
              </CardHeader>
              <CardContent>
                <EmotionPieChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-generated observations about your patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                    Positive Trend in Mood
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your overall mood has been improving steadily over the past two weeks, with fewer anxiety spikes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    Weekly Pattern
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You tend to experience higher stress levels on Mondays and Tuesdays, with improvement toward the
                    weekend.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <Brain className="mr-2 h-4 w-4 text-primary" />
                    Mindfulness Impact
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Days when you practice mindfulness show a 30% improvement in reported mood and emotional stability.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Mood Analysis</CardTitle>
              <CardDescription>Comprehensive view of your emotional states</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This section would contain more detailed mood tracking visualizations and analysis.
              </p>
              <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Detailed mood tracking charts would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Patterns</CardTitle>
              <CardDescription>Identified patterns in your journaling and emotions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This section would contain pattern recognition and correlation analysis.
              </p>
              <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Pattern analysis visualizations would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle>Personal Growth Metrics</CardTitle>
              <CardDescription>Tracking your progress and development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                This section would contain growth metrics and progress indicators.
              </p>
              <div className="h-[400px] flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Growth tracking visualizations would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
