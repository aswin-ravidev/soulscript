"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    phoneNumber: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordError, setPasswordError] = useState('')

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
          phoneNumber: user.phoneNumber || ''
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
        // Update the user data in localStorage
        const updatedUser = { ...currentUser, ...profileData }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
        
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

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In a real app, you would upload the file to a server or cloud storage
    // For now, we'll simulate this with a timeout
    setIsLoading(true)
    
    setTimeout(() => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully."
      })
      setIsLoading(false)
    }, 1500)
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
    <div className="container mx-auto px-4 md:px-6 py-6 max-w-screen-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your profile information and manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder-user.jpg" alt={currentUser?.name || "User"} />
                    <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <Dialog>
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
                        <div className="grid gap-2">
                          <Label htmlFor="picture">Profile Picture</Label>
                          <Input 
                            id="picture" 
                            type="file" 
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button disabled={isLoading}>
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
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Language</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="english" name="language" className="rounded-full" defaultChecked />
                    <Label htmlFor="english">English</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="spanish" name="language" className="rounded-full" />
                    <Label htmlFor="spanish">Spanish</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="french" name="language" className="rounded-full" />
                    <Label htmlFor="french">French</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="german" name="language" className="rounded-full" />
                    <Label htmlFor="german">German</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Time Zone</h3>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="auto-timezone" name="timezone" className="rounded-full" defaultChecked />
                  <Label htmlFor="auto-timezone">Automatic (System)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="manual-timezone" name="timezone" className="rounded-full" />
                  <Label htmlFor="manual-timezone">Manual Selection</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Synchronization</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-sync" className="block">
                      Auto-Sync
                    </Label>
                    <p className="text-sm text-muted-foreground">Automatically sync your data across devices</p>
                  </div>
                  <Switch id="auto-sync" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="offline-mode" className="block">
                      Offline Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the app to work without an internet connection
                    </p>
                  </div>
                  <Switch id="offline-mode" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of SoulScript</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                    <div className="h-20 bg-background rounded-md border mb-2"></div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="light-theme" name="theme" className="rounded-full" defaultChecked />
                      <Label htmlFor="light-theme">Light</Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                    <div className="h-20 bg-black rounded-md border mb-2"></div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dark-theme" name="theme" className="rounded-full" />
                      <Label htmlFor="dark-theme">Dark</Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-4 cursor-pointer hover:border-primary">
                    <div className="h-20 bg-gradient-to-r from-background to-black rounded-md border mb-2"></div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="system-theme" name="theme" className="rounded-full" />
                      <Label htmlFor="system-theme">System</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-md p-2 cursor-pointer hover:border-primary">
                    <div className="h-10 bg-indigo-500 rounded-md mb-2"></div>
                    <div className="flex items-center justify-center">
                      <input
                        type="radio"
                        id="indigo-scheme"
                        name="color-scheme"
                        className="rounded-full"
                        defaultChecked
                      />
                      <Label htmlFor="indigo-scheme" className="ml-2">
                        Indigo
                      </Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-2 cursor-pointer hover:border-primary">
                    <div className="h-10 bg-teal-500 rounded-md mb-2"></div>
                    <div className="flex items-center justify-center">
                      <input type="radio" id="teal-scheme" name="color-scheme" className="rounded-full" />
                      <Label htmlFor="teal-scheme" className="ml-2">
                        Teal
                      </Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-2 cursor-pointer hover:border-primary">
                    <div className="h-10 bg-rose-500 rounded-md mb-2"></div>
                    <div className="flex items-center justify-center">
                      <input type="radio" id="rose-scheme" name="color-scheme" className="rounded-full" />
                      <Label htmlFor="rose-scheme" className="ml-2">
                        Rose
                      </Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-2 cursor-pointer hover:border-primary">
                    <div className="h-10 bg-amber-500 rounded-md mb-2"></div>
                    <div className="flex items-center justify-center">
                      <input type="radio" id="amber-scheme" name="color-scheme" className="rounded-full" />
                      <Label htmlFor="amber-scheme" className="ml-2">
                        Amber
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Font Size</h3>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="font-size" className="min-w-24">
                    Text Size
                  </Label>
                  <input type="range" id="font-size" min="80" max="120" defaultValue="100" className="w-full" />
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Appearance</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Customize accessibility settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Reading & Visual</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast" className="block">
                        High Contrast
                      </Label>
                      <p className="text-sm text-muted-foreground">Increase contrast for better readability</p>
                    </div>
                    <Switch id="high-contrast" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reduce-motion" className="block">
                        Reduce Motion
                      </Label>
                      <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch id="reduce-motion" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="screen-reader" className="block">
                        Screen Reader Optimization
                      </Label>
                      <p className="text-sm text-muted-foreground">Optimize content for screen readers</p>
                    </div>
                    <Switch id="screen-reader" defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Input & Interaction</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="keyboard-navigation" className="block">
                        Enhanced Keyboard Navigation
                      </Label>
                      <p className="text-sm text-muted-foreground">Improve navigation with keyboard shortcuts</p>
                    </div>
                    <Switch id="keyboard-navigation" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="longer-timeouts" className="block">
                        Extended Timeouts
                      </Label>
                      <p className="text-sm text-muted-foreground">Increase time limits for interactions</p>
                    </div>
                    <Switch id="longer-timeouts" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Accessibility Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced options for SoulScript</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Management</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-backup" className="block">
                        Automatic Backups
                      </Label>
                      <p className="text-sm text-muted-foreground">Create regular backups of your journal data</p>
                    </div>
                    <Switch id="auto-backup" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-export" className="block">
                        Data Export Format
                      </Label>
                      <p className="text-sm text-muted-foreground">Choose the format for exporting your data</p>
                    </div>
                    <select id="data-export" className="rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ai-processing" className="block">
                        AI Processing
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable AI analysis of your journal entries</p>
                    </div>
                    <Switch id="ai-processing" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ai-model" className="block">
                        AI Model
                      </Label>
                      <p className="text-sm text-muted-foreground">Select the AI model for analysis</p>
                    </div>
                    <select id="ai-model" className="rounded-md border border-input bg-background px-3 py-1 text-sm">
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-3.5">GPT-3.5 (Faster)</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Developer Options</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="debug-mode" className="block">
                        Debug Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable detailed logging for troubleshooting</p>
                    </div>
                    <Switch id="debug-mode" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="api-access" className="block">
                        API Access
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable access to the SoulScript API</p>
                    </div>
                    <Switch id="api-access" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Link href="/settings/developer">Developer Settings</Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Advanced Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

