"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarPlus, Video, Clock, MapPin } from "lucide-react"
import { format, addDays } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

// Sample available time slots
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

// Types
interface ConnectedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  specialization?: string;
  profileImage?: string;
}

interface Appointment {
  _id: string;
  patient: ConnectedUser;
  therapist: ConnectedUser;
  date: string;
  time: string;
  duration: string;
  type: 'video' | 'in-person';
  location?: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedTherapist, setSelectedTherapist] = useState<string>("")
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("video")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "therapist">("user")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [connectedTherapists, setConnectedTherapists] = useState<ConnectedUser[]>([])
  const [connectedPatients, setConnectedPatients] = useState<ConnectedUser[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        setUserRole(user.role || "user")
        
        // Check for URL parameters for direct scheduling
        const url = new URL(window.location.href)
        const patientId = url.searchParams.get('patientId')
        const action = url.searchParams.get('action')
        
        if (patientId && user.role === 'therapist') {
          setSelectedPatient(patientId)
          setIsDialogOpen(true)
          
          // If action is reschedule or cancel, we need to handle it differently
          if (action === 'reschedule') {
            // TODO: In a real app, we would fetch the specific appointment to reschedule
            toast({
              title: "Reschedule Appointment",
              description: "Select a new date and time for this patient's appointment.",
              variant: "default",
            })
          } else if (action === 'cancel') {
            // TODO: In a real app, we would show a cancel confirmation dialog
            toast({
              title: "Cancel Appointment",
              description: "Select Cancel to confirm or Schedule to pick a new time.",
              variant: "default",
            })
          } else {
            toast({
              title: "Schedule Appointment",
              description: "Select a date and time to schedule an appointment with this patient.",
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Fetch connected therapists or patients based on user role
  useEffect(() => {
    if (!currentUser) return
    
    const fetchConnections = async () => {
      try {
        if (userRole === "therapist") {
          // Fetch patients who have connected with this therapist
          const response = await fetch(`/api/connection-requests?therapistId=${currentUser.id}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch connected patients')
          }
          
          const data = await response.json()
          
          // Filter to only accepted connections
          const acceptedConnections = data.filter((req: any) => req.status === 'accepted')
          
          // Extract patient data
          const patients = acceptedConnections.map((connection: any) => ({
            _id: connection.user._id,
            id: connection.user._id, // For consistency
            name: connection.user.name,
            email: connection.user.email,
            profileImage: connection.user.profileImage
          }))
          
          setConnectedPatients(patients)
        } else {
          // Fetch therapists this patient has connected with
          const response = await fetch(`/api/connection-requests?userId=${currentUser.id}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch connected therapists')
          }
          
          const data = await response.json()
          
          // Filter to only accepted connections
          const acceptedConnections = data.filter((req: any) => req.status === 'accepted')
          
          // Extract therapist data
          const therapists = acceptedConnections.map((connection: any) => ({
            _id: connection.therapist._id,
            id: connection.therapist._id, // For consistency
            name: connection.therapist.name,
            email: connection.therapist.email,
            specialization: connection.therapist.specialization || "General",
            profileImage: connection.therapist.profileImage
          }))
          
          setConnectedTherapists(therapists)
        }
      } catch (error) {
        console.error('Error fetching connections:', error)
        toast({
          title: "Error",
          description: "Failed to load your connections. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    fetchConnections()
  }, [currentUser, userRole, toast])

  // Fetch appointments function that can be called when needed
  const fetchAppointments = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    
    try {
      // Fetch upcoming and past appointments separately to use the API's filtering
      const upcomingResponse = await fetch('/api/appointments?status=upcoming');
      const pastResponse = await fetch('/api/appointments?status=past');
      
      if (!upcomingResponse.ok || !pastResponse.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const upcomingData = await upcomingResponse.json();
      const pastData = await pastResponse.json();
      
      if (upcomingData.success && pastData.success) {
        console.log(`Received ${upcomingData.appointments.length} upcoming appointments`);
        console.log(`Received ${pastData.appointments.length} past appointments`);
        
        // Format appointments to include duration if missing
        const upcoming = upcomingData.appointments
          .map((appt: any) => ({ 
            ...appt, 
            duration: appt.duration || '50 min',
            dateObj: new Date(appt.date) 
          }))
          .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
        
        const past = pastData.appointments
          .map((appt: any) => ({ 
            ...appt, 
            duration: appt.duration || '50 min',
            dateObj: new Date(appt.date) 
          }))
          .sort((a: any, b: any) => b.dateObj.getTime() - a.dateObj.getTime());
        
        console.log(`Displaying ${upcoming.length} upcoming and ${past.length} past appointments`);
        
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to load your appointments. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch appointments on component mount
  useEffect(() => {
    if (currentUser) {
      fetchAppointments()
    }
  }, [currentUser, toast])

  const handleScheduleAppointment = async () => {
    if (!date || !selectedTime) return
    
    try {
      // Format date as ISO string to ensure proper serialization
      const formattedDate = date.toISOString();
      console.log(`Scheduling appointment for date: ${formattedDate}`);
      
      const appointmentData = {
        date: formattedDate,
      time: selectedTime,
      type: selectedType,
      }
      
      // Add therapist or patient ID based on user role
      if (userRole === "therapist") {
        if (!selectedPatient) return
        Object.assign(appointmentData, { patientId: selectedPatient })
      } else {
        if (!selectedTherapist) return
        Object.assign(appointmentData, { therapistId: selectedTherapist })
      }
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to schedule appointment')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Appointment Scheduled",
          description: "Your appointment has been scheduled successfully."
        })
        
        // Refresh all appointment data
        fetchAppointments()
        
        // Dispatch a custom event to notify other components that an appointment was added
        const event = new CustomEvent('appointmentChanged', { 
          detail: { type: 'added', appointment: data.appointment } 
        })
        window.dispatchEvent(event)
      } else {
        throw new Error(data.message || 'Failed to schedule appointment')
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error)
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive"
      })
    } finally {
    setIsDialogOpen(false)
    // Reset form
    setSelectedTherapist("")
      setSelectedPatient("")
    setSelectedTime("")
    setSelectedType("video")
  }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          status: 'cancelled'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel appointment')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Appointment Cancelled",
          description: "The appointment has been cancelled successfully."
        })
        
        // Immediately update the UI by removing from upcoming and adding to cancelled
        const cancelledAppointment = upcomingAppointments.find(a => a._id === appointmentId);
        if (cancelledAppointment) {
          // Update status in our local state
          cancelledAppointment.status = 'cancelled';
          
          // Remove from upcoming list
          setUpcomingAppointments(prev => prev.filter(a => a._id !== appointmentId));
          
          // Add to the beginning of past appointments if it's already past current time
          const appointmentDate = new Date(cancelledAppointment.date);
          const now = new Date();
          if (appointmentDate <= now) {
            setPastAppointments(prev => [cancelledAppointment, ...prev]);
          }
        }
        
        // Still refresh data from server to ensure everything is in sync
        fetchAppointments()
        
        // Dispatch a custom event to notify other components that an appointment was cancelled
        const appointment = upcomingAppointments.find(appt => appt._id === appointmentId)
        if (appointment) {
          const event = new CustomEvent('appointmentChanged', { 
            detail: { type: 'cancelled', appointment } 
          })
          window.dispatchEvent(event)
        }
      } else {
        throw new Error(data.message || 'Failed to cancel appointment')
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Helper function to check if an appointment is in the future
  const isUpcomingAppointment = (appointment: Appointment) => {
    // Skip cancelled appointments
    if (appointment.status === 'cancelled') {
      return false;
    }
    
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Parse the time string (e.g., "1:00 PM") to set the hours and minutes
    const timeMatch = appointment.time.match(/(\d+):(\d+)\s+([AP]M)/);
    if (timeMatch) {
      const [_, hours, minutes, ampm] = timeMatch;
      let hour = parseInt(hours);
      
      // Convert from 12-hour to 24-hour format
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      
      // Set the appointment date's time components
      appointmentDate.setHours(hour, parseInt(minutes), 0, 0);
    }
    
    // For debugging purposes
    if (appointmentDate.toDateString().includes("Mar 29 2025")) {
      console.log("Checking Mar 29 2025 appointment:", {
        date: appointmentDate.toISOString(),
        now: now.toISOString(),
        isUpcoming: appointmentDate > now,
        status: appointment.status
      });
    }
    
    return appointmentDate > now;
  }

  // Render different views based on user role
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 max-w-screen-xl py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">
              {userRole === "therapist" 
                ? "Manage your upcoming patient sessions" 
                : "Schedule and manage your therapy sessions"}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <CalendarPlus className="mr-2 h-4 w-4" /> 
                {userRole === "therapist" ? "Schedule Patient Session" : "Schedule Session"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>
                  {userRole === "therapist" 
                    ? "Select a patient, date, and time for the session." 
                    : "Select a therapist, date, and time for your session."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {userRole === "therapist" ? (
                  <div className="grid gap-2">
                    <label htmlFor="patient">Patient</label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedPatients.length > 0 ? (
                          connectedPatients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.name} - {patient.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-patients" disabled>
                            No connected patients
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {connectedPatients.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        You don't have any connected patients yet. Patients will appear here after they connect with you.
                      </p>
                    )}
                  </div>
                ) : (
                <div className="grid gap-2">
                  <label htmlFor="therapist">Therapist</label>
                  <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a therapist" />
                    </SelectTrigger>
                    <SelectContent>
                        {connectedTherapists.length > 0 ? (
                          connectedTherapists.map((therapist) => (
                            <SelectItem key={therapist._id} value={therapist._id}>
                              {therapist.name} - {therapist.specialization || "General"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-therapists" disabled>
                            No connected therapists
                        </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                    {connectedTherapists.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        You don't have any connected therapists yet. Connect with therapists first to schedule appointments.
                      </p>
                    )}
                </div>
                )}
                <div className="grid gap-2">
                  <label>Date</label>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date() || date < addDays(new Date(), 1)}
                    className="rounded-md border"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="time">Time</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="type">Session Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleScheduleAppointment} 
                  disabled={
                    userRole === "therapist"
                      ? !selectedPatient || !date || !selectedTime || connectedPatients.length === 0
                      : !selectedTherapist || !date || !selectedTime || connectedTherapists.length === 0
                  }
                >
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <div className="flex justify-between mb-2">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex justify-center py-10">
                  <p>Loading appointments...</p>
                </CardContent>
              </Card>
            ) : upcomingAppointments.filter(appt => appt.status !== 'cancelled').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CalendarPlus className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center font-medium mb-2">No upcoming appointments</p>
                  <p className="text-center text-muted-foreground mb-4">
                    {userRole === "therapist" 
                      ? "You don't have any upcoming sessions with patients." 
                      : "You don't have any upcoming therapy sessions."}
                  </p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)} 
                    disabled={
                      userRole === "therapist" 
                        ? connectedPatients.length === 0 
                        : connectedTherapists.length === 0
                    }
                  >
                    Schedule Your First Session
                  </Button>
                  {((userRole === "therapist" && connectedPatients.length === 0) || 
                    (userRole === "user" && connectedTherapists.length === 0)) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {userRole === "therapist"
                        ? "You need connected patients before you can schedule appointments."
                        : "You need to connect with a therapist before you can schedule appointments."}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingAppointments
                  .filter(appointment => appointment.status !== 'cancelled')
                  .map((appointment) => (
                  <Card key={appointment._id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                        <Badge>{appointment.status}</Badge>
                      </div>
                      <CardDescription>
                        {appointment.time} • {appointment.duration}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage 
                            src={userRole === "therapist" 
                              ? (appointment.patient.profileImage || "/placeholder-user.jpg")
                              : (appointment.therapist.profileImage || "/placeholder-user.jpg")} 
                            alt={userRole === "therapist" ? appointment.patient.name : appointment.therapist.name} 
                          />
                          <AvatarFallback>
                            {(userRole === "therapist" ? appointment.patient.name : appointment.therapist.name)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {userRole === "therapist" ? appointment.patient.name : appointment.therapist.name}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {appointment.type === "video" ? (
                              <>
                                <Video className="mr-1 h-3 w-3" />
                                <span>Video Session</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-1 h-3 w-3" />
                                <span>{appointment.location || "In-person Session"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelAppointment(appointment._id)}
                      >
                        Cancel
                      </Button>
                      {appointment.type === "video" && (
                        <Button size="sm">
                          {userRole === "therapist" ? "Start Session" : "Join Session"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex justify-center py-10">
                  <p>Loading appointments...</p>
                </CardContent>
              </Card>
            ) : pastAppointments.filter(appt => appt.status !== 'cancelled').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">You don't have any past appointments.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pastAppointments
                  .filter(appointment => appointment.status !== 'cancelled')
                  .map((appointment) => (
                  <Card key={appointment._id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                      <CardDescription>
                        {appointment.time} • {appointment.duration}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage 
                            src={userRole === "therapist" 
                              ? (appointment.patient.profileImage || "/placeholder-user.jpg")
                              : (appointment.therapist.profileImage || "/placeholder-user.jpg")} 
                            alt={userRole === "therapist" ? appointment.patient.name : appointment.therapist.name} 
                          />
                          <AvatarFallback>
                            {(userRole === "therapist" ? appointment.patient.name : appointment.therapist.name)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {userRole === "therapist" ? appointment.patient.name : appointment.therapist.name}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {appointment.type === "video" ? (
                              <>
                            <Video className="mr-1 h-3 w-3" />
                            <span>Video Session</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-1 h-3 w-3" />
                                <span>{appointment.location || "In-person Session"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="border-t pt-3">
                          <p className="text-sm text-muted-foreground mb-1">Session Notes:</p>
                          <p className="text-sm">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Book Follow-up
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex justify-center py-10">
                  <p>Loading appointments...</p>
                </CardContent>
              </Card>
            ) : [...upcomingAppointments, ...pastAppointments].filter(appt => appt.status === 'cancelled').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">You don't have any cancelled appointments.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[...upcomingAppointments, ...pastAppointments]
                  .filter(appointment => appointment.status === 'cancelled')
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((appointment) => (
                  <Card key={appointment._id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</CardTitle>
                        <Badge variant="destructive">{appointment.status}</Badge>
                      </div>
                      <CardDescription>
                        {appointment.time} • {appointment.duration}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage 
                            src={userRole === "therapist" 
                              ? (appointment.patient.profileImage || "/placeholder-user.jpg")
                              : (appointment.therapist.profileImage || "/placeholder-user.jpg")} 
                            alt={userRole === "therapist" ? appointment.patient.name : appointment.therapist.name} 
                          />
                          <AvatarFallback>
                            {(userRole === "therapist" ? appointment.patient.name : appointment.therapist.name)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {userRole === "therapist" ? appointment.patient.name : appointment.therapist.name}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {appointment.type === "video" ? (
                              <>
                                <Video className="mr-1 h-3 w-3" />
                                <span>Video Session</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-1 h-3 w-3" />
                                <span>{appointment.location || "In-person Session"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

