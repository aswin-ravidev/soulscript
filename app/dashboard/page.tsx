"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MessageSquare, BookOpen, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

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

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [latestMood, setLatestMood] = useState<string | null>(null)
  const [activePatients, setActivePatients] = useState(0)
  const [upcomingSessions, setUpcomingSessions] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is authenticated
    const storedUserData = localStorage.getItem('user')
    
    if (!storedUserData) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    try {
      // Parse user data to verify it's valid
      const user = JSON.parse(storedUserData)
      if (!user || !user.email) {
        // Invalid user data, redirect to login
        router.push('/login')
        return
      }
      
      // If createdAt is missing, add current date as fallback
      if (!user.createdAt) {
        user.createdAt = new Date().toISOString()
        // Save updated user data
        localStorage.setItem('user', JSON.stringify(user))
        console.log("Added missing createdAt date to user data")
      }
      
      // User is authenticated
      setUserData(user)
      console.log("Dashboard loaded user data:", user) // Log full user data
      setIsAuthenticated(true)
      
      // Fetch journal entries only for regular users
      if (user.role !== "therapist") {
        fetchJournalEntries()
      } else {
        // For therapists, fetch patient counts and upcoming sessions
        fetchPatientData(user.id)
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      // Invalid JSON, redirect to login
      router.push('/login')
    }
  }, [router])
  
  // Fetch journal entries
  const fetchJournalEntries = async () => {
    try {
      const response = await fetch('/api/journal')
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries')
      }
      
      const data = await response.json()
      
      if (data.success && data.entries) {
        // Sort entries by date (newest first)
        const sortedEntries = [...data.entries].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setJournalEntries(sortedEntries)
        
        // Set latest mood if there are any entries
        if (sortedEntries.length > 0) {
          setLatestMood(sortedEntries[0].mood)
        }
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

  // Fetch patient data for therapists
  const fetchPatientData = async (therapistId: string) => {
    try {
      // Fetch connection requests to count active patients
      const connectionResponse = await fetch(`/api/connection-requests?therapistId=${therapistId}`)
      
      if (!connectionResponse.ok) {
        throw new Error('Failed to fetch connection data')
      }
      
      const connectionData = await connectionResponse.json()
      
      if (connectionData && Array.isArray(connectionData)) {
        // Count accepted connection requests
        const acceptedConnections = connectionData.filter(req => req.status === 'accepted')
        setActivePatients(acceptedConnections.length)
      }
      
      // Fetch appointments to count upcoming sessions
      // Use the status=upcoming parameter to let the API handle filtering
      const appointmentsResponse = await fetch('/api/appointments?status=upcoming&role=therapist')
      
      if (!appointmentsResponse.ok) {
        console.error('Failed to fetch appointments:', await appointmentsResponse.text())
        throw new Error('Failed to fetch appointments')
      }
      
      const appointmentsData = await appointmentsResponse.json()
      console.log('Upcoming appointments data:', appointmentsData)
      
      if (appointmentsData.success && appointmentsData.appointments) {
        // Appointments should already be filtered by time and non-cancelled status in the API
        const upcomingCount = appointmentsData.appointments.length
        console.log(`Found ${upcomingCount} active upcoming appointments for therapist ${therapistId}`)
        // Log each appointment for verification
        if (upcomingCount > 0) {
          appointmentsData.appointments.forEach((appt: any, index: number) => {
            const apptDate = new Date(appt.date);
            const apptTime = appt.time;
            console.log(`Upcoming appointment ${index + 1}: Date=${apptDate.toISOString()}, Time=${apptTime}, Status=${appt.status}`);
          });
        }
        
        setUpcomingSessions(upcomingCount)
      } else {
        console.error('Invalid appointments data structure:', appointmentsData)
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Dashboard...</h2>
          <p>Please wait while we load your data.</p>
        </div>
      </div>
    )
  }

  // Only render dashboard content when authenticated
  if (!isAuthenticated) {
    return null
  }

  const isTherapist = userData?.role === "therapist"
  
  // Helper function to format account date
  const formatAccountDate = () => {
    if (!userData) return 'N/A'
    
    // Try different formats of the date field
    const dateValue = userData.createdAt || userData.created_at || userData.registeredAt
    if (!dateValue) {
      console.log("No date found in user data:", userData)
      return 'N/A'
    }
    
    try {
      return new Date(dateValue).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } catch (error) {
      console.error("Error formatting date:", error)
      return 'N/A'
    }
  }

  // Render different dashboard based on user role
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-screen-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userData?.name || 'User'}</p>
        </div>

        {isTherapist ? (
          // Therapist Dashboard
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activePatients}</div>
                    <p className="text-xs text-muted-foreground">
                      {activePatients === 0 
                        ? "No active patients connected" 
                        : activePatients === 1
                          ? "1 active patient connected"
                          : `${activePatients} active patients connected`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      {upcomingSessions === 0 
                        ? "No upcoming sessions scheduled" 
                        : upcomingSessions === 1
                          ? "1 upcoming session scheduled"
                          : `${upcomingSessions} upcoming sessions scheduled`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Active</div>
                    <p className="text-xs text-muted-foreground">
                      Therapist account since {formatAccountDate()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your practice with SoulScript</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/patients')}>
                      <Users className="h-5 w-5" />
                      <span>View Patients</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/appointments')}>
                      <Calendar className="h-5 w-5" />
                      <span>Manage Appointments</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/messages')}>
                      <MessageSquare className="h-5 w-5" />
                      <span>Messages</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex-col gap-2 justify-center" 
                      onClick={() => {
                        if (activePatients > 0) {
                          router.push('/patients?tab=active')
                        } else {
                          toast({
                            title: "No patients connected",
                            description: "Connect with patients to view their analytics.",
                            variant: "default"
                          })
                        }
                      }}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Patient Analytics</span>
                      {/* {activePatients > 0 && (
                        <span className="text-xs text-muted-foreground">Real data available</span>
                      )} */}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Overview</CardTitle>
                  <CardDescription>View and manage your patient relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="mb-2">
                      You currently have {activePatients} active {activePatients === 1 ? 'patient' : 'patients'}.
                      {activePatients > 0 ? ' View detailed analytics for each patient on the patients page.' : ''}
                    </p>
                    {activePatients === 0 && (
                      <p className="text-muted-foreground text-sm mb-4">
                        You don't have any connected patients yet. Wait for connection requests or update your profile 
                        to attract new patients.
                      </p>
                    )}
                  </div>
                  <Button onClick={() => router.push('/patients')}>
                    View All Patients
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Name:</strong> {userData?.name || 'Not set'}
                    </div>
                    <div>
                      <strong>Email:</strong> {userData?.email || 'Not set'}
                    </div>
                    <div>
                      <strong>Role:</strong> Therapist
                    </div>
                    <div>
                      <strong>Specialization:</strong> {userData?.specialization || 'Not set'}
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => router.push('/settings')}>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Regular User Dashboard
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{journalEntries.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {journalEntries.length > 0 
                        ? `${journalEntries.length} journal ${journalEntries.length === 1 ? 'entry' : 'entries'} recorded` 
                        : 'Start journaling today!'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mood Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{latestMood || 'Not recorded'}</div>
                    <p className="text-xs text-muted-foreground">
                      {latestMood 
                        ? `Last recorded on ${journalEntries[0] ? format(new Date(journalEntries[0].date), 'MMMM d, yyyy') : ''}` 
                        : 'Record your first entry'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Active</div>
                    <p className="text-xs text-muted-foreground">Member since {formatAccountDate()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>Get started with SoulScript</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/journal/new')}>
                      <BookOpen className="h-5 w-5" />
                      <span>Create Journal Entry</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/therapists')}>
                      <Users className="h-5 w-5" />
                      <span>Find a Therapist</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/appointments')}>
                      <Calendar className="h-5 w-5" />
                      <span>Schedule a Session</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2 justify-center" onClick={() => router.push('/settings')}>
                      <Users className="h-5 w-5" />
                      <span>Update Profile</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Journal Entries</CardTitle>
                  <CardDescription>Your recent entries</CardDescription>
                </CardHeader>
                <CardContent>
                  {journalEntries.length > 0 ? (
                    <div className="space-y-4">
                      {journalEntries.slice(0, 3).map((entry) => (
                        <div key={entry._id} className="border-b pb-4 last:border-0">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{entry.title}</h3>
                            <div className="flex items-center">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(entry.date), 'MMMM d, yyyy')}
                              </span>
                              <span className="ml-3 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {entry.mentalHealthClass}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                        </div>
                      ))}
                      <Button onClick={() => router.push('/journal')}>
                        View All Entries
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground">No entries yet. Start journaling to see your entries here.</p>
                      <Button className="mt-4" onClick={() => router.push('/journal/new')}>
                        Create New Entry
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Name:</strong> {userData?.name || 'Not set'}
                    </div>
                    <div>
                      <strong>Email:</strong> {userData?.email || 'Not set'}
                    </div>
                    <div>
                      <strong>Role:</strong> {userData?.role || 'User'}
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => router.push('/settings')}>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}

