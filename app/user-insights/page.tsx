"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import UserAnalytics from "@/components/user-analytics"

export default function UserInsightsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">My Insights</h1>
        <UserAnalytics />
      </div>
    </DashboardLayout>
  )
}
