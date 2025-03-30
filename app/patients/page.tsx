"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Search, Calendar, MessageSquare, BarChart3, Clock, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import PatientAnalytics from "@/components/patient-analytics"
import { format } from "date-fns"

interface ConnectionRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  therapist: string;
  status: 'pending' | 'accepted' | 'rejected';
  concerns: string;
  createdAt: string;
}

interface Patient {
  id: string | number;
  name: string;
  email?: string;
  age?: number;
  since: string;
  lastSession?: string;
  nextSession?: string | null;
  status: string;
  image: string;
  connectionId?: string;
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestProcessing, setRequestProcessing] = useState<{[key: string]: boolean}>({})
  const [appointmentsData, setAppointmentsData] = useState<{[key: string]: {nextSession?: string, lastSession?: string}}>({})
  const router = useRouter()

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role !== 'therapist') {
          // If not a therapist, they shouldn't be on this page
          console.error('Non-therapist user accessing therapist page')
        }
        setCurrentUser(user)
        console.log("User data loaded:", user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Fetch connection requests for current therapist
  useEffect(() => {
    const fetchConnectionRequests = async () => {
      if (!currentUser || !currentUser.id) return
      
      try {
        const response = await fetch(`/api/connection-requests?therapistId=${currentUser.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch connection requests')
        }
        
        const data = await response.json()
        
        if (data && Array.isArray(data)) {
          setConnectionRequests(data)
        }
      } catch (err) {
        console.error('Error fetching connection requests:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser?.id) {
      fetchConnectionRequests()
    }
  }, [currentUser])

  // Process connection requests into active patients
  useEffect(() => {
    const acceptedRequests = connectionRequests.filter(req => req.status === 'accepted')
    
    if (acceptedRequests.length > 0) {
      const patientData = acceptedRequests.map(req => ({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        since: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        status: "Active",
        image: "/placeholder-user.jpg",
        connectionId: req._id
      }))
      
      setPatients(patientData)
    } else {
      // No sample data fallback anymore, just show empty state
      setPatients([])
    }
  }, [connectionRequests, loading])

  // Fetch appointment data for all patients
  useEffect(() => {
    if (!currentUser || !currentUser.id) return
    
    const fetchAppointments = async () => {
      try {
        // Fetch all appointments
        const response = await fetch('/api/appointments')
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments')
        }
        
        const data = await response.json()
        
        if (data.success && data.appointments && Array.isArray(data.appointments)) {
          // Process appointments into a map of patient ID -> appointment data
          const appointmentsByPatient: {[key: string]: {nextSession?: string, lastSession?: string}} = {}
          
          data.appointments.forEach((appointment: any) => {
            const appointmentDate = new Date(appointment.date)
            const patientId = appointment.patient?._id || appointment.patient?.id
            
            if (!patientId) return
            
            if (!appointmentsByPatient[patientId]) {
              appointmentsByPatient[patientId] = {}
            }
            
            // Format the appointment date and time for display
            const formattedDate = format(appointmentDate, "MMM d, yyyy")
            const formattedDateTime = `${formattedDate} at ${appointment.time}`
            
            // Get current date - using only date part for comparison (not time)
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            
            // Check if this is a future or past appointment
            if (appointmentDate >= now) {
              // This is an upcoming appointment
              // If we don't have a next session yet, or this one is sooner, use it
              if (!appointmentsByPatient[patientId].nextSession || 
                  new Date(appointment.date) < new Date(appointmentsByPatient[patientId].nextSession?.split(' at ')[0])) {
                appointmentsByPatient[patientId].nextSession = formattedDateTime
              }
            } else {
              // This is a past appointment
              // If we don't have a last session yet, or this one is more recent, use it
              if (!appointmentsByPatient[patientId].lastSession || 
                  new Date(appointment.date) > new Date(appointmentsByPatient[patientId].lastSession?.split(' at ')[0])) {
                appointmentsByPatient[patientId].lastSession = formattedDateTime
              }
            }
          })
          
          setAppointmentsData(appointmentsByPatient)
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
      }
    }
    
    fetchAppointments()
  }, [currentUser])

  const handleAcceptRequest = async (requestId: string) => {
    if (!currentUser || !currentUser.id) return
    
    setRequestProcessing(prev => ({ ...prev, [requestId]: true }))
    
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          status: 'accepted'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to accept connection request')
      }
      
      // Update the connection request in the state
      setConnectionRequests(prev => 
        prev.map(req => 
          req._id === requestId ? { ...req, status: 'accepted' } : req
        )
      )
      
      toast({
        title: "Connection accepted",
        description: "You've accepted the connection request."
      })
    } catch (error) {
      console.error('Error accepting request:', error)
      toast({
        title: "Failed to accept request",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setRequestProcessing(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    if (!currentUser || !currentUser.id) return
    
    setRequestProcessing(prev => ({ ...prev, [requestId]: true }))
    
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId,
          status: 'rejected'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to decline connection request')
      }
      
      // Remove the connection request from the state
      setConnectionRequests(prev => prev.filter(req => req._id !== requestId))
      
      toast({
        title: "Connection declined",
        description: "You've declined the connection request."
      })
    } catch (error) {
      console.error('Error declining request:', error)
      toast({
        title: "Failed to decline request",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setRequestProcessing(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const filteredPatients = patients.filter((patient) => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingRequests = connectionRequests.filter(request => request.status === 'pending')

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 max-w-screen-xl py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground">Manage your patients and track their progress</p>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="active">Active Patients</TabsTrigger>
              <TabsTrigger value="requests">
                Connection Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="active" className="space-y-4 mt-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Patients</h2>
              <Badge variant="secondary">Real Analytics Available</Badge>
            </div>
            {filteredPatients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={patient.image} alt={patient.name} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{patient.name}</CardTitle>
                          <CardDescription>
                              {patient.email || `Patient since ${patient.since}`}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={patient.status === "Active" ? "default" : "outline"}>{patient.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Last Session:</p>
                          <p className="font-medium">
                            {appointmentsData[patient.id]?.lastSession || 
                             patient.lastSession || 
                             "Not scheduled"}
                          </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Session:</p>
                          <p className="font-medium">
                            {appointmentsData[patient.id]?.nextSession || 
                             patient.nextSession || 
                             "Not scheduled"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/appointments?patientId=${patient.id}`)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/messages?userId=${patient.id}`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>
                    <Button
                      variant="outline"
                      size="sm"
                        className="w-[100px]"
                      onClick={() => {
                        setSelectedPatient(patient)
                        setIsDialogOpen(true)
                      }}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Analytics</span>
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center font-medium mb-2">No active patients yet</p>
                  <p className="text-center text-muted-foreground">
                    When patients connect with you and you accept their requests, they will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((request) => (
                  <Card key={request._id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="/placeholder-user.jpg" alt={request.user.name} />
                          <AvatarFallback>
                            {request.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{request.user.name}</CardTitle>
                          <CardDescription>{request.user.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Request Date:</p>
                          <p className="font-medium">
                            {new Date(request.createdAt).toLocaleDateString('en-US', {
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {request.concerns && (
                        <div>
                          <p className="text-muted-foreground">Primary Concerns:</p>
                          <p className="font-medium">{request.concerns}</p>
                        </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeclineRequest(request._id)}
                        disabled={requestProcessing[request._id]}
                      >
                        {requestProcessing[request._id] ? "Processing..." : "Decline"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptRequest(request._id)}
                        disabled={requestProcessing[request._id]}
                      >
                        {requestProcessing[request._id] ? "Processing..." : "Accept"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">You don't have any connection requests right now.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {selectedPatient && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedPatient?.image} alt={selectedPatient?.name} />
                    <AvatarFallback>{selectedPatient?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <DialogTitle>{selectedPatient?.name}</DialogTitle>
                    <DialogDescription>
                      Patient since {selectedPatient?.since}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                </TabsList>
                
                {/* Tab content for Overview */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedPatient.email || "Not available"}</p>
                    </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={selectedPatient.status === "Active" ? "default" : "secondary"}>
                              {selectedPatient.status}
                            </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                            <p className="text-sm text-muted-foreground">Patient Since</p>
                            <p className="font-medium">{selectedPatient.since}</p>
                    </div>
                    <div>
                            <p className="text-sm text-muted-foreground">Age</p>
                            <p className="font-medium">{selectedPatient.age || "Not available"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Session Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Last Session</p>
                          <p className="font-medium">
                            {appointmentsData[selectedPatient.id]?.lastSession || 
                             selectedPatient.lastSession || 
                             "No previous sessions"}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Next Session</p>
                          <p className="font-medium">
                            {appointmentsData[selectedPatient.id]?.nextSession || 
                             selectedPatient.nextSession || 
                             "Not scheduled"}
                          </p>
                    </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full mt-4" 
                          onClick={() => router.push(`/appointments?patientId=${selectedPatient.id}`)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Session
                        </Button>
                        
                        <Button 
                          variant="default" 
                          className="w-full" 
                          onClick={() => router.push(`/messages?userId=${selectedPatient.id}`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message Patient
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Tab content for Analytics - Replace mock data with real analytics */}
                <TabsContent value="analytics" className="space-y-4">
                  {selectedPatient && <PatientAnalytics patientId={selectedPatient.id.toString()} />}
                </TabsContent>
                
                {/* Tab content for Appointments */}
                <TabsContent value="appointments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Appointments</CardTitle>
                      <CardDescription>Scheduled sessions with this patient</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {appointmentsData[selectedPatient.id]?.nextSession ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <Calendar className="h-8 w-8 text-primary" />
                              <div>
                                <p className="font-medium">{appointmentsData[selectedPatient.id].nextSession}</p>
                                <p className="text-sm text-muted-foreground">50-minute session</p>
                  </div>
                </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/appointments?patientId=${selectedPatient.id}&action=reschedule`)}
                              >
                                Reschedule
                  </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => router.push(`/appointments?patientId=${selectedPatient.id}&action=cancel`)}
                              >
                                Cancel
                  </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground mb-4">No upcoming appointments scheduled.</p>
                          <Button onClick={() => router.push(`/appointments?patientId=${selectedPatient.id}`)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Session
                  </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Past Appointments</CardTitle>
                      <CardDescription>Previous sessions with this patient</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {appointmentsData[selectedPatient.id]?.lastSession ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <Calendar className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{appointmentsData[selectedPatient.id].lastSession}</p>
                                <p className="text-sm text-muted-foreground">50-minute session</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">View Notes</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground">No past appointments found.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

