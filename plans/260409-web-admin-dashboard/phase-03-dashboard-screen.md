---
title: "Phase 3: Dashboard Screen"
description: "Build comprehensive admin dashboard with metrics, charts, and analytics"
status: pending
priority: P1
effort: 6h
tags: [dashboard, metrics, charts, analytics]
---

# Phase 3: Dashboard Screen

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 2: [phase-02-authentication-flow.md](./phase-02-authentication-flow.md)
- Dashboard API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Analytics API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/analytics.py](../../../backend/app/api/v1/endpoints/analytics.py)
- Admin Schemas: [D:/PTIT/PickaloApp/backend/app/schemas/admin.py](../../../backend/app/schemas/admin.py)
- Analytics Schemas: [D:/PTIT/PickaloApp/backend/app/schemas/analytics.py](../../../backend/app/schemas/analytics.py)

## Overview
**Priority:** P1
**Current Status:** Pending
**Estimated Effort:** 6 hours

Build the main admin dashboard with platform metrics, revenue charts, booking statistics, and venue performance rankings.

## Key Insights
- Backend provides 5 analytics endpoints with date filtering
- Dashboard metrics endpoint returns all key platform stats
- Recharts provides composable chart components
- TanStack Query handles data caching and refetching

## Requirements

### Functional Requirements
1. Display 8 key platform metrics (users, merchants, venues, bookings)
2. Revenue trend chart with date filtering
3. Booking statistics chart
4. User growth metrics
5. Top venues performance table
6. Date range picker for analytics
7. Real-time data refresh button

### Non-Functional Requirements
- Charts render quickly (< 1s)
- Responsive layout for desktop/tablet
- Loading states for all data
- Error handling with retry option

## Architecture

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Page Header: Dashboard + Date Picker + Refresh         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │ Users   │ │Venues   │ │Bookings │ │Revenue  │       │
│ │  1,250  │ │   85    │ │  3,420  │ │ 125M    │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │Active   │ │Verified │ │Pending  │ │Growth   │       │
│ │  980    │ │   72    │ │   13    │ │  +12%   │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────┬───────────────────┐ │
│ │     Revenue Trend Chart        │ Booking Stats     │ │
│ │     (Line Chart)               │ (Bar Chart)       │ │
│ └────────────────────────────────┴───────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Top Venues Performance Table                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Venue │ Merchant │ Bookings │ Revenue │ Rating     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/dashboard/screens/dashboard-screen.tsx` | Main dashboard screen |
| `src/features/dashboard/components/metric-card.tsx` | Metric display card |
| `src/features/dashboard/components/revenue-chart.tsx` | Revenue trend chart |
| `src/features/dashboard/components/booking-stats-chart.tsx` | Booking stats chart |
| `src/features/dashboard/components/top-venues-table.tsx` | Top venues table |
| `src/features/dashboard/components/date-range-picker.tsx` | Date filter component |
| `src/features/dashboard/api/dashboard-api.ts` | Dashboard API calls |
| `src/features/dashboard/types/dashboard.types.ts` | Dashboard types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add dashboard route |
| `src/lib/query-keys.ts` | Add dashboard query keys |

## Implementation Steps

### Step 1: Create Dashboard Types (20 min)
```typescript
// src/features/dashboard/types/dashboard.types.ts
export interface DashboardMetrics {
  total_users: number
  total_merchants: number
  total_venues: number
  total_bookings: number
  active_users: number
  verified_venues: number
  pending_verifications: number
  total_revenue: number | null
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  booking_count: number
}

export interface RevenueTrendResponse {
  period: string
  start_date: string
  end_date: string
  total_revenue: number
  data_points: RevenueDataPoint[]
}

export interface BookingStatsResponse {
  total_bookings: number
  confirmed_bookings: number
  cancelled_bookings: number
  completion_rate: number
  average_booking_value: number
  popular_time_slots: TimeSlotStats[]
  daily_breakdown: DailyBookingStats[]
}

export interface TimeSlotStats {
  hour: number
  booking_count: number
  utilization_rate: number
}

export interface DailyBookingStats {
  date: string
  total_bookings: number
  confirmed_bookings: number
  cancelled_bookings: number
  revenue: number
}

export interface VenuePerformanceItem {
  venue_id: string
  venue_name: string
  merchant_name: string
  total_bookings: number
  total_revenue: number
  average_rating: number | null
  verification_status: boolean
}

export interface VenuePerformanceResponse {
  total_venues: number
  active_venues: number
  verified_venues: number
  top_performing_venues: VenuePerformanceItem[]
  venue_type_breakdown: Record<string, number>
}
```

### Step 2: Create Dashboard API Service (30 min)
```typescript
// src/features/dashboard/api/dashboard-api.ts
import { api } from '@/lib/api'
import type {
  DashboardMetrics,
  RevenueTrendResponse,
  BookingStatsResponse,
  VenuePerformanceResponse,
} from '../types/dashboard.types'

export const dashboardApi = {
  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>('/admin/dashboard')
    return data
  },

  /**
   * Get revenue trends
   */
  async getRevenueTrends(params: {
    start_date: string
    end_date: string
    period_type?: 'daily' | 'weekly' | 'monthly'
  }): Promise<RevenueTrendResponse> {
    const { data } = await api.get<RevenueTrendResponse>('/admin/analytics/revenue', {
      params,
    })
    return data
  },

  /**
   * Get booking statistics
   */
  async getBookingStats(params: {
    start_date: string
    end_date: string
  }): Promise<BookingStatsResponse> {
    const { data } = await api.get<BookingStatsResponse>('/admin/analytics/bookings', {
      params,
    })
    return data
  },

  /**
   * Get venue performance
   */
  async getVenuePerformance(params: {
    start_date: string
    end_date: string
    limit?: number
  }): Promise<VenuePerformanceResponse> {
    const { data } = await api.get<VenuePerformanceResponse>('/admin/analytics/venues', {
      params,
    })
    return data
  },
}
```

### Step 3: Create Metric Card Component (45 min)
```typescript
// src/features/dashboard/components/metric-card.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  loading?: boolean
  format?: 'number' | 'currency' | 'percentage'
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  loading,
  format = 'number',
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(val)
      case 'percentage':
        return `${val}%`
      default:
        return new Intl.NumberFormat('vi-VN').format(val)
    }
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-muted-foreground'
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-muted-foreground'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn('text-xs font-medium', getTrendColor())}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 4: Create Revenue Chart Component (60 min)
```typescript
// src/features/dashboard/components/revenue-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { RevenueDataPoint } from '../types/dashboard.types'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading?: boolean
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Format data for chart
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    revenue: point.revenue / 1_000_000, // Convert to millions VND
    bookings: point.booking_count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}M`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [`${value.toFixed(1)}M VND`, 'Revenue']
                }
                return [value, 'Bookings']
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Revenue (M VND)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bookings"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="Bookings"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Step 5: Create Booking Stats Chart Component (45 min)
```typescript
// src/features/dashboard/components/booking-stats-chart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DailyBookingStats } from '../types/dashboard.types'

interface BookingStatsChartProps {
  data: DailyBookingStats[]
  loading?: boolean
}

export function BookingStatsChart({ data, loading }: BookingStatsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    confirmed: point.confirmed_bookings,
    cancelled: point.cancelled_bookings,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="confirmed"
              fill="hsl(var(--primary))"
              name="Confirmed"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="cancelled"
              fill="hsl(var(--destructive))"
              name="Cancelled"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Step 6: Create Top Venues Table Component (45 min)
```typescript
// src/features/dashboard/components/top-venues-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, TrendingUp } from 'lucide-react'
import type { VenuePerformanceItem } from '../types/dashboard.types'

interface TopVenuesTableProps {
  data: VenuePerformanceItem[]
  loading?: boolean
}

export function TopVenuesTable({ data, loading }: TopVenuesTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performing Venues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((venue) => (
              <TableRow key={venue.venue_id}>
                <TableCell className="font-medium">{venue.venue_name}</TableCell>
                <TableCell className="text-muted-foreground">{venue.merchant_name}</TableCell>
                <TableCell className="text-right">{venue.total_bookings}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  }).format(venue.total_revenue)}
                </TableCell>
                <TableCell className="text-right">
                  {venue.average_rating ? (
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{venue.average_rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Step 7: Create Date Range Picker (30 min)
```typescript
// src/features/dashboard/components/date-range-picker.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DateRangePicker({
  value,
  onChange,
}: {
  value: { start: Date; end: Date }
  onChange: (value: { start: Date; end: Date }) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value.start, 'MMM dd, yyyy')} - {format(value.end, 'MMM dd, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="space-y-3 p-3">
          <div className="space-y-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onChange({
                    start: subDays(new Date(), preset.days),
                    end: new Date(),
                  })
                  setIsOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="border-t" />
          <Calendar
            mode="range"
            selected={{
              from: value.start,
              to: value.end,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange({ start: range.from, end: range.to })
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Step 8: Create Dashboard Screen (60 min)
```typescript
// src/features/dashboard/screens/dashboard-screen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/page-header'
import { queryKeys } from '@/lib/query-keys'
import { dashboardApi } from '../api/dashboard-api'
import { MetricCard } from '../components/metric-card'
import { RevenueChart } from '../components/revenue-chart'
import { BookingStatsChart } from '../components/booking-stats-chart'
import { TopVenuesTable } from '../components/top-venues-table'
import { DateRangePicker } from '../components/date-range-picker'
import { subDays } from 'date-fns'

export function DashboardScreen() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  })

  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: () => dashboardApi.getMetrics(),
  })

  // Fetch revenue trends
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: queryKeys.dashboard.revenue(
      formatDate(dateRange.start),
      formatDate(dateRange.end)
    ),
    queryFn: () => dashboardApi.getRevenueTrends({
      start_date: formatDate(dateRange.start),
      end_date: formatDate(dateRange.end),
      period_type: 'daily',
    }),
  })

  // Fetch booking stats
  const { data: bookingStats, isLoading: bookingLoading } = useQuery({
    queryKey: queryKeys.dashboard.bookings(
      formatDate(dateRange.start),
      formatDate(dateRange.end)
    ),
    queryFn: () => dashboardApi.getBookingStats({
      start_date: formatDate(dateRange.start),
      end_date: formatDate(dateRange.end),
    }),
  })

  // Fetch venue performance
  const { data: venuePerformance, isLoading: venuesLoading } = useQuery({
    queryKey: queryKeys.dashboard.venues(
      formatDate(dateRange.start),
      formatDate(dateRange.end),
      10
    ),
    queryFn: () => dashboardApi.getVenuePerformance({
      start_date: formatDate(dateRange.start),
      end_date: formatDate(dateRange.end),
      limit: 10,
    }),
  })

  const isLoading = metricsLoading || revenueLoading || bookingLoading || venuesLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview and analytics"
        action={
          <div className="flex items-center gap-4">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics?.total_users ?? 0}
          icon={<Users className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Merchants"
          value={metrics?.total_merchants ?? 0}
          icon={<Building className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Venues"
          value={metrics?.total_venues ?? 0}
          icon={<MapPin className="h-5 w-5" />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Bookings"
          value={metrics?.total_bookings ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          loading={metricsLoading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Users"
          value={metrics?.active_users ?? 0}
          loading={metricsLoading}
        />
        <MetricCard
          title="Verified Venues"
          value={metrics?.verified_venues ?? 0}
          loading={metricsLoading}
        />
        <MetricCard
          title="Pending Verifications"
          value={metrics?.pending_verifications ?? 0}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics?.total_revenue ?? 0}
          format="currency"
          loading={metricsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueData?.data_points ?? []} loading={revenueLoading} />
        <BookingStatsChart
          data={bookingStats?.daily_breakdown ?? []}
          loading={bookingLoading}
        />
      </div>

      {/* Top Venues */}
      <TopVenuesTable data={venuePerformance?.top_performing_venues ?? []} loading={venuesLoading} />
    </div>
  )
}
```

### Step 9: Add Required Dependencies (15 min)
```bash
# Install additional dependencies
npm install recharts date-fns
npm install -D @types/recharts

# Add shadcn components
npx shadcn@latest add table calendar popover
npx shadcn@latest add skeleton
```

## Todo List
- [ ] Create dashboard TypeScript types
- [ ] Implement dashboard API service
- [ ] Build metric card component
- [ ] Build revenue chart component
- [ ] Build booking stats chart component
- [ ] Build top venues table component
- [ ] Build date range picker
- [ ] Create main dashboard screen
- [ ] Install chart dependencies
- [ ] Test all data fetching
- [ ] Test date filtering
- [ ] Test refresh functionality

## Success Criteria
- [ ] All 8 metrics display correctly
- [ ] Revenue chart renders with data
- [ ] Booking stats chart renders with data
- [ ] Top venues table shows correct data
- [ ] Date range picker updates all charts
- [ ] Refresh button refetches data
- [ ] Loading states display properly
- [ ] Error handling with retry option

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Chart performance issues | Limit data points, use responsive container |
| Date format inconsistencies | Use date-fns consistently |
| API errors | Proper error handling with retry |

## Next Steps
- Proceed to Phase 4: User Management
- Add more chart types if needed
- Implement real-time updates

## Related Documentation
- [Recharts Documentation](https://recharts.org/)
- [date-fns Documentation](https://date-fns.org/)
- [Backend Analytics Implementation](../../../backend/app/services/analytics.py)
