import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MetricCard } from '@/components/admin/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetrics } from '@/types/api'

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get<DashboardMetrics>('/admin/dashboard'),
  })

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  const data = metrics

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data?.total_users || 0}
          description="Registered users"
        />
        <MetricCard
          title="Merchants"
          value={data?.total_merchants || 0}
          description="Venue owners"
        />
        <MetricCard
          title="Venues"
          value={data?.total_venues || 0}
          description="Sports facilities"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Bookings"
          value={data?.total_bookings || 0}
          description="Total reservations"
        />
        <MetricCard
          title="Active Users"
          value={data?.active_users || 0}
          description="Recently active"
        />
        <MetricCard
          title="Verified Venues"
          value={data?.verified_venues || 0}
          description="Approved venues"
        />
        <MetricCard
          title="Pending"
          value={data?.pending_verifications || 0}
          description="Awaiting verification"
        />
        <MetricCard
          title="Revenue"
          value={`₫${data?.total_revenue?.toLocaleString() || 0}`}
          description="Total revenue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <a href="/users" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <h3 className="font-semibold">Manage Users</h3>
            <p className="text-sm text-muted-foreground">View, ban, or change user roles</p>
          </a>
          <a href="/venues" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <h3 className="font-semibold">Verify Venues</h3>
            <p className="text-sm text-muted-foreground">Review pending venue applications</p>
          </a>
          <a href="/bookings" className="p-4 border rounded-lg hover:bg-accent transition-colors">
            <h3 className="font-semibold">Oversight Bookings</h3>
            <p className="text-sm text-muted-foreground">View and manage all bookings</p>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
