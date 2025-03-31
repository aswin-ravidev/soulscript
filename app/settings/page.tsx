"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function SettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    specialization: '',
    contactEmail: '',
    phoneNumber: '',
    emergencyContacts: [
      { name: '', phone: '', email: '' },
      { name: '', phone: '', email: '' }
    ]
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          specialization: user.specialization || '',
          contactEmail: user.contactEmail || user.email || '',
          phoneNumber: user.phoneNumber || '',
          emergencyContacts: user.emergencyContacts || [
            { name: '', phone: '', email: '' },
            { name: '', phone: '', email: '' }
          ]
        })
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the user data in localStorage with the data returned from the server
        // This ensures all fields, including emergencyContacts, are properly formatted
        localStorage.setItem('user', JSON.stringify(data.user))
        setCurrentUser(data.user)
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated."
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      const data = await response.json()
      
      if (data.success) {
        // Clear local storage and redirect to login
        localStorage.removeItem('user')
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted."
        })
        router.push('/login')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Reset file preview when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  // Handle file selection for preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    
    // Create a preview URL for the selected image
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // Handle the actual upload when button is clicked
  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image file to upload.",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      // Send the file to the backend API
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload profile picture')
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update the user data in localStorage with the data returned from the server
        localStorage.setItem('user', JSON.stringify(data.user))
        setCurrentUser(data.user)
        
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully."
        })
        
        // Close the dialog
        setPreviewUrl(null)
        setSelectedFile(null)
        return true // Return true to indicate successful upload (for the dialog to close)
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      })
      return false // Return false to keep dialog open
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    // Reset error state
    setPasswordError('')
    
    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }
      
      if (data.success) {
        // Clear localStorage and show success message
        localStorage.removeItem('user');
        
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated. Please log in again with your new password."
        })
        
        // Reset form and close dialog
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordDialog(false)
        
        // Redirect to login page
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error updating password:', error)
      setPasswordError(error.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 max-w-screen-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and account settings</p>
      </div>

          <Card>
            <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information and manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser?.profileImage || "/placeholder-user.jpg"} alt={currentUser?.name || "User"} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <Dialog onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Change Picture</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                      <DialogDescription>
                        Upload a new profile picture. JPG, PNG or GIF, max 5MB.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {previewUrl && (
                        <div className="mb-4 flex justify-center">
                          <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-gray-200">
                            <img 
                              src={previewUrl}
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid gap-2">
                        <Label htmlFor="picture">Profile Picture</Label>
                        <Input 
                          id="picture" 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        disabled={isLoading || !selectedFile}
                        onClick={async () => {
                          const success = await handleUploadClick();
                          if (success) {
                            document.querySelector('[data-dialog-close]')?.dispatchEvent(
                              new MouseEvent('click', { bubbles: true })
                            );
                          }
                        }}
                      >
                        {isLoading ? "Uploading..." : "Upload Picture"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4 flex-1">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your full name" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Your email address" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Your email is used for login and cannot be changed</p>
                </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              
              {currentUser?.role === "therapist" && (
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input 
                    id="specialization" 
                    placeholder="Your specialization" 
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself" 
                  className="min-h-[100px]"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input 
                    id="contact-email" 
                    type="email" 
                    placeholder="Email for contact purposes" 
                    value={profileData.contactEmail}
                    onChange={(e) => setProfileData({...profileData, contactEmail: e.target.value})}
                  />
                    </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="Your phone number" 
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                  />
                </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contacts</h3>
              <p className="text-sm text-muted-foreground">These contacts may be reached in case of emergency</p>
              
              {/* First Emergency Contact */}
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium">Emergency Contact 1</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="emergency1-name">Name</Label>
                    <Input 
                      id="emergency1-name" 
                      placeholder="Full name" 
                      value={profileData.emergencyContacts?.[0]?.name || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[0]) updatedContacts[0] = { name: '', phone: '', email: '' };
                        updatedContacts[0].name = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emergency1-phone">Phone Number</Label>
                    <Input 
                      id="emergency1-phone" 
                      type="tel" 
                      placeholder="Phone number" 
                      value={profileData.emergencyContacts?.[0]?.phone || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[0]) updatedContacts[0] = { name: '', phone: '', email: '' };
                        updatedContacts[0].phone = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="emergency1-email">Email Address</Label>
                    <Input 
                      id="emergency1-email" 
                      type="email" 
                      placeholder="Email address" 
                      value={profileData.emergencyContacts?.[0]?.email || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[0]) updatedContacts[0] = { name: '', phone: '', email: '' };
                        updatedContacts[0].email = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Second Emergency Contact */}
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium">Emergency Contact 2</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="emergency2-name">Name</Label>
                    <Input 
                      id="emergency2-name" 
                      placeholder="Full name" 
                      value={profileData.emergencyContacts?.[1]?.name || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[1]) updatedContacts[1] = { name: '', phone: '', email: '' };
                        updatedContacts[1].name = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emergency2-phone">Phone Number</Label>
                    <Input 
                      id="emergency2-phone" 
                      type="tel" 
                      placeholder="Phone number" 
                      value={profileData.emergencyContacts?.[1]?.phone || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[1]) updatedContacts[1] = { name: '', phone: '', email: '' };
                        updatedContacts[1].phone = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="emergency2-email">Email Address</Label>
                    <Input 
                      id="emergency2-email" 
                      type="email" 
                      placeholder="Email address" 
                      value={profileData.emergencyContacts?.[1]?.email || ''}
                      onChange={(e) => {
                        const updatedContacts = [...(profileData.emergencyContacts || [{ name: '', phone: '', email: '' }, { name: '', phone: '', email: '' }])];
                        if (!updatedContacts[1]) updatedContacts[1] = { name: '', phone: '', email: '' };
                        updatedContacts[1].email = e.target.value;
                        setProfileData({...profileData, emergencyContacts: updatedContacts});
                      }}
                    />
                  </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Management</h3>
                <div className="space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <Input id="password" type="password" value="••••••••" disabled />
                    <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>Change Password</Button>
                  </div>
                </div>
                
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and a new password to update your credentials.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      {passwordError && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                          {passwordError}
                        </div>
                      )}
                      
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        />
              </div>

                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        />
                  </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowPasswordDialog(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                        setPasswordError('')
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleChangePassword}
                        disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isLoading ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              </div>
            </CardContent>
            <CardFooter>
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
            </CardFooter>
          </Card>
    </div>
    </DashboardLayout>
  )
}

