"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Star, MessageSquare, Calendar, User, AlertCircle, UserPlus, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Empty fallback array instead of sample data
const fallbackTherapists: any[] = []

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
  availability: string;
  status: string;
  bio: string;
  image: string;
  email?: string;
  member_since?: string;
}

interface ConnectionRequestStatus {
  [therapistId: string]: {
    status: string;
    requestId?: string;
  };
}

export default function TherapistsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [specialty, setSpecialty] = useState("all")
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionRequestStatus>({})
  const [concerns, setConcerns] = useState("")
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const router = useRouter()

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        console.log("User data loaded:", user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Handle profile image display
  const getProfileImage = (user: any) => {
    if (!user) return "/placeholder-user.jpg"
    return user.profileImage || "/placeholder-user.jpg"
  }

  // Fetch therapists from API
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/therapists')
        
        if (!response.ok) {
          throw new Error('Failed to fetch therapists')
        }
        
        const data = await response.json()
        
        if (data && Array.isArray(data) && data.length > 0) {
          setTherapists(data)
          
          // Extract unique specialties for the filter dropdown
          const uniqueSpecialties = Array.from(new Set(data.map((t: Therapist) => t.specialty)))
          setSpecialties(uniqueSpecialties)
        } else {
          // Use fallback data if no therapists found
          setTherapists(fallbackTherapists)
          setError('No therapists found. Using sample data.')
        }
      } catch (err) {
        console.error('Error fetching therapists:', err)
        setError('Error loading therapists. Using sample data.')
        setTherapists(fallbackTherapists)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTherapists()
  }, [])

  // Fetch existing connection requests for current user
  useEffect(() => {
    const fetchConnectionRequests = async () => {
      if (!currentUser || !currentUser.id) return
      
      try {
        const response = await fetch(`/api/connection-requests?userId=${currentUser.id}`)
        
        if (!response.ok) {
          console.error('Failed to fetch connection requests')
          return
        }
        
        const data = await response.json()
        
        if (data && Array.isArray(data)) {
          // Update connection status for each therapist
          const statusMap: ConnectionRequestStatus = {}
          
          data.forEach((request: any) => {
            if (request.therapist && request.therapist._id) {
              statusMap[request.therapist._id] = {
                status: request.status,
                requestId: request._id
              }
            }
          })
          
          setConnectionStatus(statusMap)
        }
      } catch (err) {
        console.error('Error fetching connection requests:', err)
      }
    }
    
    fetchConnectionRequests()
  }, [currentUser])

  const filteredTherapists = therapists.filter((therapist) => {
    const matchesSearch =
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = specialty === "all" || therapist.specialty.toLowerCase().includes(specialty.toLowerCase())

    return matchesSearch && matchesSpecialty
  })

  const handleConnect = (therapist: Therapist) => {
    console.log("Connect button clicked for:", therapist.name)
    console.log("Current user:", currentUser)
    
    if (!currentUser || !currentUser.id) {
      console.log("No current user or missing id")
      toast({
        title: "Please log in",
        description: "You need to be logged in to connect with a therapist.",
        variant: "destructive"
      })
      return
    }
    
    // If the user already sent a request, don't show the dialog again
    console.log("Connection status for this therapist:", connectionStatus[therapist.id])
    
    if (connectionStatus[therapist.id] && connectionStatus[therapist.id].status === 'pending') {
      toast({
        title: "Request already sent",
        description: "You've already sent a connection request to this therapist."
      })
      return
    }
    
    if (connectionStatus[therapist.id] && connectionStatus[therapist.id].status === 'accepted') {
      toast({
        title: "Already connected",
        description: "You're already connected with this therapist."
      })
      return
    }

    // Otherwise, show the connect dialog
    console.log("Opening connect dialog for therapist:", therapist.id)
    setSelectedTherapist(therapist)
    setConcerns("")
    setIsConnectDialogOpen(true)
  }

  const sendConnectionRequest = async () => {
    console.log("Sending connection request...")
    console.log("Current user:", currentUser)
    console.log("Selected therapist:", selectedTherapist)
    
    if (!currentUser || !currentUser.id || !selectedTherapist) {
      console.log("Missing data for connection request")
      return
    }
    
    setConnectLoading(true)
    
    try {
      console.log("Request payload:", {
        userId: currentUser.id,
        therapistId: selectedTherapist.id,
        concerns: concerns
      })
      
      const response = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          therapistId: selectedTherapist.id,
          concerns: concerns
        })
      })
      
      console.log("API response status:", response.status)
      const data = await response.json()
      console.log("API response data:", data)
      
      if (response.ok) {
        // Update the connection status for this therapist
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedTherapist.id]: {
            status: 'pending',
            requestId: data.requestId
          }
        }))
        
        toast({
          title: "Connection request sent",
          description: "Your request has been sent to the therapist."
        })
        
        setIsConnectDialogOpen(false)
      } else {
        if (response.status === 409) {
          // Request already exists
    setConnectionStatus((prev) => ({
      ...prev,
            [selectedTherapist.id]: {
              status: data.status,
              requestId: data.requestId
            }
          }))
          
          toast({
            title: "Already requested",
            description: data.message
          })
          
          setIsConnectDialogOpen(false)
        } else {
          throw new Error(data.message || 'Failed to send request')
        }
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast({
        title: "Failed to send request",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setConnectLoading(false)
    }
  }

  const getConnectionButtonText = (therapistId: string) => {
    if (!connectionStatus[therapistId]) {
      return "Connect";
    }
    
    switch(connectionStatus[therapistId].status) {
      case 'pending':
        return "Request Sent";
      case 'accepted':
        return "Connected";
      case 'rejected':
        return "Request Again";
      default:
        return "Connect";
    }
  }

  const renderTherapistCard = (therapist: Therapist) => {
    return (
      <Card key={therapist.id} className="flex flex-col">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getProfileImage(therapist)} alt={therapist.name} />
              <AvatarFallback>
                {therapist.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <CardTitle>{therapist.name}</CardTitle>
              <CardDescription>{therapist.specialty}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{therapist.specialty}</div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-muted-foreground">Availability:</span>
            <span>{therapist.availability}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 border-t p-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedTherapist(therapist)
              setIsDialogOpen(true)
            }}
          >
            View Profile
          </Button>
          {connectionStatus[therapist.id]?.status === 'pending' ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled
            >
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Request Sent
            </Button>
          ) : (
            <Button
              variant={
                connectionStatus[therapist.id]?.status === 'rejected' ? "outline" : "default"
              }
              size="sm"
              className="flex-1"
              onClick={() => handleConnect(therapist)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {getConnectionButtonText(therapist.id)}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-screen-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Find a Therapist</h1>
          <p className="text-muted-foreground">Connect with mental health professionals</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or specialty..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec.toLowerCase()}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading therapists...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Therapists Available</h3>
            <p className="text-muted-foreground">
              There are currently no therapists registered in the system.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Therapists</TabsTrigger>
              <TabsTrigger value="connected">Connected</TabsTrigger>
            </TabsList>
            
            {/* All Therapists Tab */}
            <TabsContent value="all" className="space-y-4">
              {filteredTherapists.length === 0 ? (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Therapists Found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any therapists matching your criteria.
                  </p>
                </div>
              ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTherapists
                    .filter(therapist => connectionStatus[therapist.id]?.status !== 'accepted')
                    .map((therapist) => (
            renderTherapistCard(therapist)
          ))}
        </div>
              )}
            </TabsContent>
            
            {/* Connected Therapists Tab */}
            <TabsContent value="connected" className="space-y-4">
              {filteredTherapists.some(therapist => connectionStatus[therapist.id]?.status === 'accepted') ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTherapists
                    .filter(therapist => connectionStatus[therapist.id]?.status === 'accepted')
                    .map((therapist) => (
                      <Card key={therapist.id} className="flex flex-col">
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={getProfileImage(therapist)} alt={therapist.name} />
                              <AvatarFallback>
                                {therapist.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <CardTitle>{therapist.name}</CardTitle>
                              <CardDescription>{therapist.specialty}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{therapist.specialty}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-muted-foreground">Availability:</span>
                            <span>{therapist.availability}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedTherapist(therapist)
                              setIsDialogOpen(true)
                            }}
                          >
                            View Profile
                          </Button>
                          <div className="flex gap-2 flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                console.log("Message button clicked, navigating to messages with therapist:", {
                                  therapist: therapist.name,
                                  id: therapist.id
                                });
                                router.push(`/messages?therapistId=${therapist.id}`);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/appointments?therapistId=${therapist.id}`)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Connected Therapists</h3>
                  <p className="text-muted-foreground">
                    You don't have any connected therapists yet. Connect with therapists to see them here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Therapist Profile Dialog */}
        {selectedTherapist && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Therapist Profile</DialogTitle>
              </DialogHeader>
              <div className="flex items-start gap-4 py-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getProfileImage(selectedTherapist)} alt={selectedTherapist.name} />
                  <AvatarFallback>
                    {selectedTherapist.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold">{selectedTherapist.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTherapist.specialty}</p>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2">{selectedTherapist.experience}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className="ml-2">{selectedTherapist.availability}</span>
                  </div>
                  {selectedTherapist.member_since && (
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground">Member since:</span>
                      <span className="ml-2">{selectedTherapist.member_since}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">About</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedTherapist.bio}</p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 sm:flex-1"
                  onClick={() => {
                    router.push(`/messages?therapistId=${selectedTherapist.id}`)
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
                <Button
                  className="flex items-center gap-2 sm:flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    handleConnect(selectedTherapist)
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {connectionStatus[selectedTherapist.id]?.status === 'accepted' 
                      ? "Schedule Session" 
                      : "Request Connection"}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Connect with Therapist Dialog */}
        {selectedTherapist && (
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect with {selectedTherapist.name}</DialogTitle>
                <DialogDescription>
                  Tell the therapist about your concerns to help them understand how they can assist you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p>Your information will be shared with the therapist when you send a connection request.</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="concerns" className="text-sm font-medium">
                    What would you like help with? (Optional)
                  </label>
                  <Textarea
                    id="concerns"
                    placeholder="Briefly describe your concerns, such as anxiety, depression, stress, etc."
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)} disabled={connectLoading}>
                  Cancel
                </Button>
                <Button 
                  onClick={sendConnectionRequest}
                  disabled={connectLoading}
                >
                  {connectLoading ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
