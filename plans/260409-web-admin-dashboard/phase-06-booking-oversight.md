---
title: "Phase 6: Booking Oversight"
description: "Implement booking listing, admin cancellation, and detailed booking view"
status: pending
priority: P2
effort: 4h
tags: [booking-oversight, admin-cancel, bookings]
---

# Phase 6: Booking Oversight

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 5: [phase-05-venue-management.md](./phase-05-venue-management.md)
- Admin API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Booking Model: [D:/PTIT/PickaloApp/backend/app/models/booking.py](../../../backend/app/models/booking.py)

## Overview
**Priority:** P2
**Current Status:** Pending
**Estimated Effort:** 4 hours

Build booking oversight interface with listing, status filtering, admin cancellation, and detailed booking information view.

## Key Insights
- Backend provides paginated booking list with filters
- Admin cancel requires reason (min 10 characters)
- Can filter by booking status
- Search works across user name, venue name
- Status indicators for quick visual identification

## Requirements

### Functional Requirements
1. Booking data table with pagination
2. Filter by booking status
3. Search by user name, venue name
4. Admin cancel booking with reason
5. Booking detail modal with full information
6. Status badge indicators
7. Date range filtering

### Non-Functional Requirements
- Clear status visualization
- Confirmation for destructive actions
- Loading states for operations

## Architecture

### Booking Oversight Flow
```
Dashboard → Bookings Tab
    ↓
Booking Table (paginated, filtered)
    ↓
[Status Filters] → Update query params
    ↓
[Search] → Filter by user/venue
    ↓
[Row Actions] → Booking Detail Modal
    ↓
[Cancel Booking] → Reason Dialog → API Call → Update Table
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/bookings/screens/bookings-screen.tsx` | Main booking oversight screen |
| `src/features/bookings/components/booking-table.tsx` | Booking data table |
| `src/features/bookings/components/booking-filters.tsx` | Search and filter controls |
| `src/features/bookings/components/cancel-booking-dialog.tsx` | Cancel confirmation |
| `src/features/bookings/components/booking-detail-modal.tsx` | Booking detail view |
| `src/features/bookings/api/bookings-api.ts` | Booking API calls |
| `src/features/bookings/types/bookings.types.ts` | Booking types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add bookings route |
| `src/components/layout/sidebar.tsx` | Ensure bookings link exists |

## Implementation Steps

### Step 1: Create Booking Types (15 min)
```typescript
// src/features/bookings/types/bookings.types.ts
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface BookingAdminListItem {
  id: string
  user_id: string
  user_name: string
  user_phone: string
  venue_id: string
  venue_name: string
  venue_address: string
  booking_date: string
  start_time: string
  end_time: string
  total_price: number
  status: BookingStatus
  created_at: string
  cancelled_at?: string
  cancel_reason?: string
}

export interface BookingListResponse {
  bookings: BookingAdminListItem[]
  total: number
  page: number
  limit: number
}

export interface BookingListParams {
  page?: number
  limit?: number
  status?: BookingStatus
  search?: string
  start_date?: string
  end_date?: string
}

export interface CancelBookingRequest {
  reason: string
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}
```

### Step 2: Create Booking API Service (20 min)
```typescript
// src/features/bookings/api/bookings-api.ts
import { api } from '@/lib/api'
import type {
  BookingListResponse,
  BookingListParams,
  BookingAdminListItem,
  CancelBookingRequest,
} from '../types/bookings.types'

export const bookingsApi = {
  /**
   * List all bookings with pagination and filters
   */
  async listBookings(params: BookingListParams): Promise<BookingListResponse> {
    const { data } = await api.get<BookingListResponse>('/admin/bookings', {
      params,
    })
    return data
  },

  /**
   * Cancel a booking (admin override)
   */
  async cancelBooking(
    bookingId: string,
    request: CancelBookingRequest
  ): Promise<BookingAdminListItem> {
    const { data } = await api.patch<BookingAdminListItem>(
      `/admin/bookings/${bookingId}/cancel`,
      request
    )
    return data
  },
}
```

### Step 3: Create Booking Filters Component (25 min)
```typescript
// src/features/bookings/components/booking-filters.tsx
import { Search, Filter, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookingStatus, BOOKING_STATUS_LABELS } from '../types/bookings.types'

interface BookingFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: BookingStatus | 'all'
  onStatusChange: (value: BookingStatus | 'all') => void
  onReset: () => void
}

export function BookingFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onReset,
}: BookingFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by user, venue..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range picker can be added here */}

      <Button variant="outline" onClick={onReset}>
        <Filter className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  )
}
```

### Step 4: Create Booking Table Component (50 min)
```typescript
// src/features/bookings/components/booking-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { User, MapPin, Calendar, Clock, DollarSign, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../types/bookings.types'
import type { BookingAdminListItem, BookingStatus } from '../types/bookings.types'

interface BookingTableProps {
  data: BookingAdminListItem[]
  onCancelBooking: (booking: BookingAdminListItem) => void
  onViewDetails: (booking: BookingAdminListItem) => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<BookingAdminListItem>[] = [
  {
    accessorKey: 'booking_date',
    header: 'Date',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.getValue('booking_date'))}
      </div>
    ),
  },
  {
    accessorKey: 'start_time',
    header: 'Time',
    cell: ({ row }) => {
      const start = formatTime(row.getValue('start_time'))
      const end = formatTime(row.original.end_time)
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {start} - {end}
        </div>
      )
    },
  },
  {
    accessorKey: 'user_name',
    header: 'User',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{row.getValue('user_name')}</span>
        </div>
        <div className="text-xs text-muted-foreground">{row.original.user_phone}</div>
      </div>
    ),
  },
  {
    accessorKey: 'venue_name',
    header: 'Venue',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{row.getValue('venue_name')}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
          {row.original.venue_address}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'total_price',
    header: 'Price',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        {formatCurrency(row.getValue('total_price'))}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BookingStatus
      return (
        <Badge className={BOOKING_STATUS_COLORS[status]}>
          {BOOKING_STATUS_LABELS[status]}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const booking = row.original
      const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => table.options.meta?.onViewDetails?.(booking)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canCancel ? (
              <DropdownMenuItem
                onClick={() => table.options.meta?.onCancelBooking?.(booking)}
                className="text-destructive"
              >
                Cancel Booking
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground">
                Cannot cancel {booking.status} bookings
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function BookingTable({
  data,
  onCancelBooking,
  onViewDetails,
}: BookingTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onCancelBooking,
      onViewDetails,
    },
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No bookings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 5: Create Cancel Booking Dialog (40 min)
```typescript
// src/features/bookings/components/cancel-booking-dialog.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react'
import { bookingsApi } from '../api/bookings-api'
import { queryKeys } from '@/lib/query-keys'
import type { BookingAdminListItem } from '../types/bookings.types'

const cancelSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type CancelFormData = z.infer<typeof cancelSchema>

interface CancelBookingDialogProps {
  booking: BookingAdminListItem | null
  open: boolean
  onClose: () => void
}

export function CancelBookingDialog({ booking, open, onClose }: CancelBookingDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: { bookingId: string; reason: string }) =>
      bookingsApi.cancelBooking(data.bookingId, { reason: data.reason }),
    onSuccess: () => {
      toast.success('Booking cancelled successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all({}) })
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking')
    },
  })

  const onSubmit = (data: CancelFormData) => {
    if (!booking) return
    mutation.mutate({ bookingId: booking.id, reason: data.reason })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset()
    onClose()
  }

  if (!booking) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Venue</span>
              <span className="font-medium">{booking.venue_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(booking.booking_date).toLocaleDateString('vi-VN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {new Date(booking.start_time).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(booking.total_price)}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for cancelling this booking..."
                rows={4}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
              >
                Go Back
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Create Booking Management Screen (45 min)
```typescript
// src/features/bookings/screens/bookings-screen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookingStatus } from '@/types/booking.types'
import { queryKeys } from '@/lib/query-keys'
import { bookingsApi } from '../api/bookings-api'
import type { BookingListParams } from '../types/bookings.types'
import type { BookingAdminListItem } from '../types/bookings.types'
import { PageHeader } from '@/components/common/page-header'
import { BookingFilters } from '../components/booking-filters'
import { BookingTable } from '../components/booking-table'
import { CancelBookingDialog } from '../components/cancel-booking-dialog'
import { BookingDetailModal } from '../components/booking-detail-modal'
import { Pagination } from '@/components/ui/pagination'

export function BookingsScreen() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')

  const [selectedBooking, setSelectedBooking] = useState<BookingAdminListItem | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const params: BookingListParams = {
    page,
    limit: 20,
    status: status === 'all' ? undefined : status,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'admin', params],
    queryFn: () => bookingsApi.listBookings(params),
  })

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  const handleSearchChange = (value: string) => {
    setSearch(value)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatus('all')
    setPage(1)
  }

  const handleCancelBooking = (booking: BookingAdminListItem) => {
    setSelectedBooking(booking)
    setCancelDialogOpen(true)
  }

  const handleViewDetails = (booking: BookingAdminListItem) => {
    setSelectedBooking(booking)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Oversight"
        description="View and manage all platform bookings"
      />

      <BookingFilters
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={setStatus}
        onReset={handleResetFilters}
      />

      <BookingTable
        data={data?.bookings ?? []}
        onCancelBooking={handleCancelBooking}
        onViewDetails={handleViewDetails}
      />

      {data && data.total > data.limit && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <CancelBookingDialog
        booking={selectedBooking}
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false)
          setSelectedBooking(null)
        }}
      />

      <BookingDetailModal
        booking={selectedBooking}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedBooking(null)
        }}
      />
    </div>
  )
}
```

## Todo List
- [ ] Create booking TypeScript types
- [ ] Implement bookings API service
- [ ] Build booking filters component
- [ ] Build booking table component
- [ ] Build cancel booking dialog
- [ ] Build booking detail modal
- [ ] Create booking management screen
- [ ] Add pagination
- [ ] Test cancellation flow
- [ ] Test filters and search

## Success Criteria
- [ ] Booking table displays with pagination
- [ ] Filter by status works correctly
- [ ] Search filters bookings
- [ ] Cancel booking works with reason
- [ ] Cannot cancel completed bookings
- [ ] Detail modal shows full booking info
- [ ] Status badges display correctly
- [ ] All actions invalidate queries

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Accidental cancellation | Confirmation dialog, requires reason |
| Lost revenue from cancellations | Warning about refund impact |
| Conflicting cancellations | Backend checks booking status |

## Security Considerations
- All actions require admin role
- Audit logging on backend
- Cannot modify past bookings
- Reason required for all cancellations

## Next Steps
- Proceed to Phase 7: Content Moderation
- Add booking export functionality
- Implement dispute resolution

## Related Documentation
- [Backend Booking Management](../../../backend/app/api/v1/endpoints/admin.py)
- [Booking Model](../../../backend/app/models/booking.py)
