"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Brain, BookOpen, BarChart3, MessageSquare, Calendar, Settings, LogOut, User, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  initialUserRole?: "user" | "therapist"
}

const userNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Brain },
  { title: 'Journal', href: '/journal', icon: BookOpen },
  { title: 'Insights', href: '/insights', icon: BarChart3 },
  { title: 'Therapists', href: '/therapists', icon: User },
  { title: 'Messages', href: '/messages', icon: MessageSquare },
  { title: 'Appointments', href: '/appointments', icon: Calendar },
  { title: 'Settings', href: '/settings', icon: Settings },
]

const therapistNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Brain },
  { title: 'Patients', href: '/patients', icon: User },
  { title: 'Messages', href: '/messages', icon: MessageSquare },
  { title: 'Appointments', href: '/appointments', icon: Calendar },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardLayout({ children, initialUserRole = "user" }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "therapist">(initialUserRole)
  const [userName, setUserName] = useState<string>("")
  const [userInitials, setUserInitials] = useState<string>("JD")
  const [profileImage, setProfileImage] = useState<string>("/placeholder-user.jpg")

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        // Set user type based on role in user data
        setUserRole(user.role || "user")
        setUserName(user.name || "")
        setProfileImage(user.profileImage || "/placeholder-user.jpg")
        
        // Set user initials
        if (user.name) {
          const initials = user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
          setUserInitials(initials)
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Listen for storage events to update profile image when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setProfileImage(user.profileImage || "/placeholder-user.jpg")
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange)
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const navItems = userRole === "therapist" ? therapistNavItems : userNavItems;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 max-w-screen-xl flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">SoulScript</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname === item.href ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 sm:max-w-xs">
              <div className="flex items-center gap-2 px-7">
                <Brain className="h-6 w-6" />
                <span className="font-bold">SoulScript</span>
              </div>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10">
                <div className="flex flex-col gap-2 py-2">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-7 py-2 text-base font-medium transition-all hover:text-primary",
                        pathname === item.href ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
                <Brain className="h-6 w-6" />
                <span className="font-bold">SoulScript</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={profileImage} alt={userName || "User"} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  try {
                    // Call logout API
                    await fetch('/api/auth/logout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    // Clear local storage
                    localStorage.removeItem('user');
                    
                    // Redirect to login
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout error:', error);
                    // Still try to redirect
                    localStorage.removeItem('user');
                    router.push('/login');
                  }
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
