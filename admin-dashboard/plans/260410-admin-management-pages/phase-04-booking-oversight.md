# Phase 4: Booking Oversight Page

**Status:** Pending
**Priority:** P1
**Estimated Time:** 3 hours
**Dependencies:** Phase 1 (Foundation Components), Phase 2 (User Management patterns)

## Overview

Build complete booking oversight page with search, date range filtering, and cancellation capability.

## Features

| Feature | Description |
|---------|-------------|
| List Bookings | Paginated table with booking data |
| Search | By user name, venue name, booking ID |
| Status Filter | By status (confirmed, cancelled, completed) |
| Date Range | Filter by booking date |
| Cancel Booking | With reason input |
| View Details | Modal with full booking info |
| Status Indicators | Color-coded status badges |

---

## Files to Create

### 1. `src/lib/hooks/use-bookings.ts`

Custom hooks for booking queries and mutations.

```typescript
// Queries
export function useBookings(params: BookingListParams)
export function useBookingDetails(id: string)

// Mutations
export function useCancelBooking()
```

**Query Parameters:**
```typescript
interface BookingListParams {
  page?: number
  limit?: number
  search?: string      // search in user, venue, booking ID
  status?: 'confirmed' | 'cancelled' | 'completed' | 'pending'
  date_from?: string   // ISO date string
  date_to?: string     // ISO date string
}
```

---

### 2. `src/pages/Bookings.tsx`

Main booking oversight page.

**Structure:**
```tsx
<PageHeader title="Bookings" subtitle="View and manage all platform bookings" />
<FilterBar>
  <SearchInput value={search} onChange={setSearch} placeholder="Search bookings..." />
  <Select value={status} onChange={setStatus} options={statusOptions} />
  <DateRange value={dateRange} onChange={setDateRange} />
</FilterBar>
<DataTable data={bookings} columns={bookingColumns} loading={isLoading} />
<Pagination ... />
```

---

### 3. `src/components/admin/booking-table-columns.tsx`

Table column definitions for bookings.

**Columns:**
| Column | Description |
|--------|-------------|
| Booking ID | ID with copy button |
| User | User name with link |
| Venue | Venue name with link |
| Date | Booking date |
| Time | Start - End time |
| Duration | Hours count |
| Price | Total price (VND) |
| Status | Status badge (confirmed/cancelled/completed) |
| Created | Booking creation date |
| Actions | Cancel, view details |

---

### 4. `src/components/admin/booking-actions.tsx`

Action buttons for booking row.

**Actions:**
- View Details (opens modal)
- Cancel Booking (if confirmed/pending - opens dialog)

---

### 5. `src/components/admin/booking-details-dialog.tsx`

Modal showing full booking information.

**Display:**
- Booking ID (with copy)
- User info (name, phone, email)
- Venue info (name, address)
- Booking date and time
- Duration
- Total price
- Payment status
- Current status
- Created date
- Special requests (if any)
- Cancellation reason (if cancelled)

---

### 6. `src/components/ui/date-range-picker.tsx`

Date range selection component.

**Features:**
- Start date input
- End date input
- Quick select options (Today, Last 7 days, Last 30 days, This month)
- Clear button
- Date validation (end >= start)

---

### 7. `src/components/admin/cancel-booking-dialog.tsx`

Dialog for cancelling a booking.

**Fields:**
- Booking info preview (dates, venue, price)
- Cancellation reason textarea (required)
- Impact warning (refund info)
- Confirmation checkbox

---

## Implementation Steps

### Step 1: Create Date Range Picker (30min)
1. Create `date-range-picker.tsx`
2. Add date inputs with validation
3. Add quick select buttons
4. Test date range logic

### Step 2: Create Hooks (30min)
1. Create `use-bookings.ts` with list query
2. Add cancel mutation
3. Add query invalidation

### Step 3: Create Table Columns (30min)
1. Define column structure
2. Add status badges with colors
3. Format price as VND
4. Format dates and times
5. Add action buttons

### Step 4: Build Page Layout (45min)
1. Create Bookings.tsx
2. Add filter bar with search
3. Add date range picker
4. Add status filter
5. Integrate data table
6. Add pagination

### Step 5: Create Dialogs (45min)
1. Booking details dialog
2. Cancel booking dialog with form
3. Wire up mutations

---

## API Integration

### GET /admin/bookings
```typescript
interface BookingListResponse {
  bookings: Booking[]
  total: number
  page: number
  limit: number
}

interface Booking {
  id: string
  user_id: string
  user_name: string
  user_phone: string
  venue_id: string
  venue_name: string
  venue_address: string
  booking_date: string      // ISO date
  start_time: string        // HH:MM format
  end_time: string          // HH:MM format
  duration_hours: number
  total_price: number
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending'
  payment_status: string
  special_requests: string | null
  cancellation_reason: string | null
  created_at: string
}
```

### PATCH /admin/bookings/{id}/cancel
```typescript
interface CancelBookingRequest {
  reason: string
}
```

---

## Status Badge Colors

```typescript
const statusConfig = {
  confirmed: { variant: 'success', label: 'Confirmed' },
  completed: { variant: 'info', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
  pending: { variant: 'warning', label: 'Pending' },
}
```

---

## Date Range Quick Select

```typescript
const quickSelectOptions = [
  { label: 'Today', range: getTodayRange() },
  { label: 'Last 7 days', range: getLastNDays(7) },
  { label: 'Last 30 days', range: getLastNDays(30) },
  { label: 'This month', range: getThisMonthRange() },
  { label: 'Last month', range: getLastMonthRange() },
]

function getTodayRange() {
  const today = new Date()
  return {
    from: format(today, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  }
}

function getLastNDays(n: number) {
  const to = new Date()
  const from = addDays(to, -n + 1)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}
```

---

## Price Formatting

```typescript
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

// Example: 150000 -> "150.000 d"
```

---

## Cancellation Flow

```typescript
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/bookings/${id}/cancel`, { reason }),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-bookings'] })
      const previous = queryClient.getQueryData(['admin-bookings'])

      queryClient.setQueryData(['admin-bookings'], (old: BookingListResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          bookings: old.bookings.map(b =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          )
        }
      })

      return { previous }
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-bookings'], context?.previous)
      toast.error('Failed to cancel booking')
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('Booking cancelled successfully')
    }
  })
}
```

---

## Success Criteria

- [ ] Bookings load and display in table
- [ ] Search filters by user/venue/ID
- [ ] Status filter works correctly
- [ ] Date range picker works
- [ ] Quick select buttons work
- [ ] Cancel booking works with confirmation
- [ ] Booking details modal shows all info
- [ ] Status badges have correct colors
- [ ] Price formats as VND
- [ ] Dates and times format correctly
- [ ] Pagination works
- [ ] Loading and error states work

---

## Next Steps

After completing this phase:
1. Move to Phase 5: Content Moderation Page
2. Reuse established patterns
