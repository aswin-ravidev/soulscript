"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BookOpen, Calendar, Home, LineChart, Settings, User, Users, PenSquare } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/logout-button"

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const mainNavItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "New Entry", href: "/journal/new", icon: PenSquare },
    { name: "Insights", href: "/insights", icon: LineChart },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Community", href: "/community", icon: Users },
  ]

  const accountNavItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">SoulScript</span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-6">
          <div className="px-3 text-xs font-semibold text-muted-foreground">Account</div>
          <SidebarMenu>
            {accountNavItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.name}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <LogoutButton variant="outline" className="w-full justify-start">
          Log Out
        </LogoutButton>
      </SidebarFooter>
    </Sidebar>
  )
}

