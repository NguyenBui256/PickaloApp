---
title: "Phase 5: Venue & Merchant Management"
description: "Implement venue listing, verification workflow, and merchant oversight"
status: pending
priority: P2
effort: 4h
tags: [venue-management, verification, merchants]
---

# Phase 5: Venue & Merchant Management

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 4: [phase-04-user-management.md](./phase-04-user-management.md)
- Admin API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Venue Model: [D:/PTIT/PickaloApp/backend/app/models/venue.py](../../../backend/app/models/venue.py)

## Overview
**Priority:** P2
**Current Status:** Pending
**Estimated Effort:** 4 hours

Build venue management interface with listing, verification workflow, and merchant oversight capabilities.

## Key Insights
- Backend provides paginated venue list with filters
- Verification requires reason (min 10 characters)
- Can filter by verification status
- Search works across name, address
- Pending verification queue important for operations

## Requirements

### Functional Requirements
1. Venue data table with pagination
2. Filter by verification status
3. Search by name, address
4. Verify/unverify venue with reason
5. Merchant list view
6. Pending verification queue
7. Venue detail modal

### Non-Functional Requirements
- Clear visual indication of verification status
- Priority display for pending verifications
- Optimistic updates for better UX

## Architecture

### Venue Management Flow
```
Dashboard → Venues Tab
    ↓
Venue Table (paginated, filtered)
    ↓
[Pending Queue Badge] → Show count
    ↓
[Search/Filter] → Update query params
    ↓
[Row Actions] → Venue Detail Modal
    ↓
[Verify/Unverify] → Reason Dialog → API Call → Update Table
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/venues/screens/venues-screen.tsx` | Main venue management screen |
| `src/features/venues/components/venue-table.tsx` | Venue data table |
| `src/features/venues/components/venue-filters.tsx` | Search and filter controls |
| `src/features/venues/components/verify-venue-dialog.tsx` | Verification confirmation |
| `src/features/venues/components/venue-detail-modal.tsx` | Venue detail view |
| `src/features/venues/components/merchant-table.tsx` | Merchant listing |
| `src/features/venues/api/venues-api.ts` | Venue API calls |
| `src/features/venues/types/venues.types.ts` | Venue types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add venues route |
| `src/components/layout/sidebar.tsx` | Ensure venues link exists |

## Implementation Steps

### Step 1: Create Venue Types (15 min)
```typescript
// src/features/venues/types/venues.types.ts
export interface VenueAdminListItem {
  id: string
  name: string
  merchant_id: string
  merchant_name: string
  address: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  bookings_count: number
}

export interface VenueListResponse {
  venues: VenueAdminListItem[]
  total: number
  page: number
  limit: number
}

export interface VenueListParams {
  page?: number
  limit?: number
  is_verified?: boolean
  search?: string
}

export interface VerifyVenueRequest {
  verified: boolean
  reason: string
}
```

### Step 2: Create Venue API Service (20 min)
```typescript
// src/features/venues/api/venues-api.ts
import { api } from '@/lib/api'
import type {
  VenueListResponse,
  VenueListParams,
  VenueAdminListItem,
  VerifyVenueRequest,
  UserListResponse,
} from '../types/venues.types'

export const venuesApi = {
  /**
   * List venues with pagination and filters
   */
  async listVenues(params: VenueListParams): Promise<VenueListResponse> {
    const { data } = await api.get<VenueListResponse>('/admin/venues', {
      params,
    })
    return data
  },

  /**
   * List all merchants
   */
  async listMerchants(params?: { search?: string }): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>('/admin/merchants', {
      params,
    })
    return data
  },

  /**
   * Verify or unverify a venue
   */
  async verifyVenue(
    venueId: string,
    request: VerifyVenueRequest
  ): Promise<VenueAdminListItem> {
    const { data } = await api.patch<VenueAdminListItem>(
      `/admin/venues/${venueId}/verify`,
      request
    )
    return data
  },
}
```

### Step 3: Create Venue Filters Component (20 min)
```typescript
// src/features/venues/components/venue-filters.tsx
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface VenueFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  isVerified: boolean | 'all'
  onIsVerifiedChange: (value: boolean | 'all') => void
  onReset: () => void
  pendingCount?: number
}

export function VenueFilters({
  search,
  onSearchChange,
  isVerified,
  onIsVerifiedChange,
  onReset,
  pendingCount,
}: VenueFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, address..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={String(isVerified)} onValueChange={(v) => onIsVerifiedChange(v === 'all' ? 'all' : v === 'true')}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Verification Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          <SelectItem value="true">Verified</SelectItem>
          <SelectItem value="false">
            Pending {pendingCount !== undefined && `(${pendingCount})`}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onReset}>
        <Filter className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  )
}
```

### Step 4: Create Venue Table Component (45 min)
```typescript
// src/features/venues/components/venue-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MapPin, Building2, Calendar, MoreHorizontal, ShieldCheck, ShieldX } from 'lucide-react'
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
import type { VenueAdminListItem } from '../types/venues.types'

interface VenueTableProps {
  data: VenueAdminListItem[]
  onVerifyVenue: (venue: VenueAdminListItem) => void
  onViewDetails: (venue: VenueAdminListItem) => void
}

const columns: ColumnDef<VenueAdminListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Venue Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'merchant_name',
    header: 'Merchant',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {row.getValue('merchant_name')}
      </div>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-[250px]">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{row.getValue('address')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'is_verified',
    header: 'Status',
    cell: ({ row }) => {
      const isVerified = row.getValue('is_verified') as boolean
      return (
        <Badge variant={isVerified ? 'default' : 'secondary'} className="gap-1">
          {isVerified ? (
            <>
              <ShieldCheck className="h-3 w-3" />
              Verified
            </>
          ) : (
            <>
              <ShieldX className="h-3 w-3" />
              Pending
            </>
          )}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Active',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return <Badge variant={isActive ? 'outline' : 'secondary'}>{isActive ? 'Yes' : 'No'}</Badge>
    },
  },
  {
    accessorKey: 'bookings_count',
    header: 'Bookings',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {row.getValue('bookings_count')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const venue = row.original
      const isVerified = venue.is_verified

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
            <DropdownMenuItem onClick={() => table.options.meta?.onViewDetails?.(venue)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => table.options.meta?.onVerifyVenue?.(venue)}
              className={isVerified ? 'text-destructive' : 'text-green-600'}
            >
              {isVerified ? 'Revoke Verification' : 'Verify Venue'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function VenueTable({
  data,
  onVerifyVenue,
  onViewDetails,
}: VenueTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onVerifyVenue,
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
                No venues found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 5: Create Verify Venue Dialog (40 min)
```typescript
// src/features/venues/components/verify-venue-dialog.tsx
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
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { venuesApi } from '../api/venues-api'
import { queryKeys } from '@/lib/query-keys'
import type { VenueAdminListItem } from '../types/venues.types'

const verifySchema = z.object({
  verified: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type VerifyFormData = z.infer<typeof verifySchema>

interface VerifyVenueDialogProps {
  venue: VenueAdminListItem | null
  open: boolean
  onClose: () => void
}

export function VerifyVenueDialog({ venue, open, onClose }: VerifyVenueDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      verified: true,
    },
  })

  const isVerifying = watch('verified')

  const mutation = useMutation({
    mutationFn: (data: { venueId: string; verified: boolean; reason: string }) =>
      venuesApi.verifyVenue(data.venueId, { verified: data.verified, reason: data.reason }),
    onSuccess: () => {
      toast.success(isVerifying ? 'Venue verified successfully' : 'Verification revoked')
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all({}) })
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update venue verification')
    },
  })

  const onSubmit = (data: VerifyFormData) => {
    if (!venue) return
    mutation.mutate({ venueId: venue.id, verified: data.verified, reason: data.reason })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset()
    onClose()
  }

  if (!venue) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {venue.is_verified ? (
              <ShieldX className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            )}
            {venue.is_verified ? 'Revoke Verification' : 'Verify Venue'}
          </DialogTitle>
          <DialogDescription>
            {venue.is_verified
              ? `Revoke verification for ${venue.name}? This will affect the venue's visibility.`
              : `Verify ${venue.name}? This will make the venue visible to all users.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {!venue.is_verified && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={isVerifying}
                    onCheckedChange={(checked) => {
                      // @ts-expect-error - Checkbox onChange type
                      register('verified').onChange({ target: { value: checked } })
                    }}
                  />
                  <Label htmlFor="verified" className="cursor-pointer">
                    Confirm this venue meets all verification requirements
                  </Label>
                </div>
                <ul className="ml-6 text-sm text-muted-foreground list-disc space-y-1">
                  <li>Valid business license</li>
                  <li>Accurate location information</li>
                  <li>Complete venue details</li>
                  <li>Genuine photos</li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {venue.is_verified ? 'for revoking' : 'for verification'}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  venue.is_verified
                    ? 'Please explain why verification is being revoked...'
                    : 'Please confirm what was verified...'
                }
                rows={4}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400">
              <strong>Info:</strong> This action will be logged in the audit trail. The venue
              owner will be notified of the verification status change.
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={venue.is_verified ? 'destructive' : 'default'}
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? 'Processing...'
                : venue.is_verified
                ? 'Revoke Verification'
                : 'Verify Venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Create Venue Management Screen (50 min)
```typescript
// src/features/venues/screens/venues-screen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys'
import { venuesApi } from '../api/venues-api'
import type { VenueListParams } from '../types/venues.types'
import type { VenueAdminListItem } from '../types/venues.types'
import { PageHeader } from '@/components/common/page-header'
import { VenueFilters } from '../components/venue-filters'
import { VenueTable } from '../components/venue-table'
import { VerifyVenueDialog } from '../components/verify-venue-dialog'
import { VenueDetailModal } from '../components/venue-detail-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/pagination'
import { MerchantTable } from '../components/merchant-table'

export function VenuesScreen() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | 'all'>('all')

  const [selectedVenue, setSelectedVenue] = useState<VenueAdminListItem | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const params: VenueListParams = {
    page,
    limit: 20,
    is_verified: isVerified === 'all' ? undefined : isVerified,
    search: debouncedSearch || undefined,
  }

  // Fetch venues
  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: queryKeys.venues.all(params),
    queryFn: () => venuesApi.listVenues(params),
  })

  // Fetch pending count
  const { data: pendingData } = useQuery({
    queryKey: queryKeys.venues.all({ is_verified: false, limit: 1 }),
    queryFn: () => venuesApi.listVenues({ is_verified: false, limit: 1 }),
  })

  // Fetch merchants
  const { data: merchantsData, isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants', 'all'],
    queryFn: () => venuesApi.listMerchants(),
  })

  const totalPages = venuesData ? Math.ceil(venuesData.total / venuesData.limit) : 1
  const pendingCount = pendingData?.total ?? 0

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
    setIsVerified('all')
    setPage(1)
  }

  const handleVerifyVenue = (venue: VenueAdminListItem) => {
    setSelectedVenue(venue)
    setVerifyDialogOpen(true)
  }

  const handleViewDetails = (venue: VenueAdminListItem) => {
    setSelectedVenue(venue)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venue & Merchant Management"
        description="Verify venues and manage merchant accounts"
      />

      <Tabs defaultValue="venues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="venues" className="gap-2">
            <Building2 className="h-4 w-4" />
            Venues
          </TabsTrigger>
          <TabsTrigger value="merchants" className="gap-2">
            <Users className="h-4 w-4" />
            Merchants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-4">
          <VenueFilters
            search={search}
            onSearchChange={handleSearchChange}
            isVerified={isVerified}
            onIsVerifiedChange={setIsVerified}
            onReset={handleResetFilters}
            pendingCount={pendingCount}
          />

          <VenueTable
            data={venuesData?.venues ?? []}
            onVerifyVenue={handleVerifyVenue}
            onViewDetails={handleViewDetails}
          />

          {venuesData && venuesData.total > venuesData.limit && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </TabsContent>

        <TabsContent value="merchants" className="space-y-4">
          <MerchantTable data={merchantsData?.users ?? []} loading={merchantsLoading} />
        </TabsContent>
      </Tabs>

      <VerifyVenueDialog
        venue={selectedVenue}
        open={verifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false)
          setSelectedVenue(null)
        }}
      />

      <VenueDetailModal
        venue={selectedVenue}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedVenue(null)
        }}
      />
    </div>
  )
}
```

### Step 7: Add Required Components (10 min)
```bash
# Install shadcn components
npx shadcn@latest add tabs checkbox
```

## Todo List
- [ ] Create venue TypeScript types
- [ ] Implement venues API service
- [ ] Build venue filters component
- [ ] Build venue table component
- [ ] Build verify venue dialog
- [ ] Build venue detail modal
- [ ] Build merchant table component
- [ ] Create venue management screen with tabs
- [ ] Add pagination
- [ ] Test verification workflow
- [ ] Test filters and search

## Success Criteria
- [ ] Venue table displays with pagination
- [ ] Filter by verification status works
- [ ] Pending count badge displays
- [ ] Verify venue works with reason
- [ ] Revoke verification works with reason
- [ ] Merchant table displays
- [ ] All actions invalidate queries
- [ ] Loading states display properly

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Incorrect verification | Confirmation dialog, requires reason |
| Pending queue overflow | Pagination, filters |
| Merchant data privacy | Limit displayed information |

## Next Steps
- Proceed to Phase 6: Booking Oversight
- Add venue analytics view
- Implement bulk verification

## Related Documentation
- [Backend Venue Management](../../../backend/app/api/v1/endpoints/admin.py)
- [Venue Model](../../../backend/app/models/venue.py)
