---
title: "Admin Management Pages Implementation"
description: "Build 5 admin management pages (Users, Venues, Bookings, Content, Audit Log) with full CRUD operations"
status: pending
priority: P1
effort: 20h
branch: main
tags: [admin, frontend, management-pages]
created: 2026-04-10
---

# Admin Management Pages Implementation Plan

## Overview

Implement 5 comprehensive admin management pages for the PickAlo admin dashboard using React 19, TypeScript, Vite, TanStack Query v5, and TailwindCSS.

**Current State:**
- Routes exist but pages only show placeholder headings
- 17 backend admin endpoints already implemented
- JWT authentication working perfectly
- TanStack Query configured
- Basic UI components (Button, Card, MetricCard) available

**Target State:**
- 5 fully functional management pages with search, filters, pagination
- Reusable UI component library (DataTable, Search, Filter, Modal, etc.)
- Optimistic updates and proper error handling
- Responsive design with accessibility

## Component Architecture

```
src/
├── components/
│   ├── ui/                          # Reusable UI primitives
│   │   ├── button.tsx               # [EXISTS]
│   │   ├── card.tsx                 # [EXISTS]
│   │   ├── input.tsx                # [NEW] Text input with label
│   │   ├── select.tsx               # [NEW] Dropdown select
│   │   ├── dialog.tsx               # [NEW] Modal dialog
│   │   ├── badge.tsx                # [NEW] Status badge
│   │   ├── table.tsx                # [NEW] Data table wrapper
│   │   ├── data-table.tsx           # [NEW] TanStack Table component
│   │   ├── pagination.tsx           # [NEW] Pagination controls
│   │   ├── search-input.tsx         # [NEW] Search with debounce
│   │   ├── confirm-dialog.tsx       # [NEW] Confirmation modal
│   │   └── date-range-picker.tsx    # [NEW] Date range selection
│   ├── admin/
│   │   ├── metric-card.tsx          # [EXISTS]
│   │   ├── page-header.tsx          # [NEW] Page title + actions
│   │   ├── filter-bar.tsx           # [NEW] Search + filters container
│   │   └── loading-state.tsx        # [NEW] Skeleton loaders
├── pages/
│   ├── Dashboard.tsx                # [EXISTS]
│   ├── Login.tsx                    # [EXISTS]
│   ├── Users.tsx                    # [NEW] User management
│   ├── Venues.tsx                   # [NEW] Venue management
│   ├── Bookings.tsx                 # [NEW] Booking oversight
│   ├── Content.tsx                  # [NEW] Content moderation
│   └── AuditLog.tsx                 # [NEW] Audit log viewer
├── lib/
│   ├── api.ts                       # [EXISTS] API client
│   ├── hooks/
│   │   ├── use-users.ts             # [NEW] User queries/mutations
│   │   ├── use-venues.ts            # [NEW] Venue queries/mutations
│   │   ├── use-bookings.ts          # [NEW] Booking queries/mutations
│   │   ├── use-content.ts           # [NEW] Content queries/mutations
│   │   └── use-audit-log.ts         # [NEW] Audit log queries
│   └── utils.ts                     # [EXISTS]
└── types/
    └── api.ts                       # [EXISTS] Add new types as needed
```

## Backend API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/users` | List users (paginated, searchable) |
| PATCH | `/admin/users/{id}/ban` | Ban user with reason |
| PATCH | `/admin/users/{id}/unban` | Unban user |
| PATCH | `/admin/users/{id}/role` | Change user role |
| GET | `/admin/venues` | List venues (paginated, searchable) |
| PATCH | `/admin/venues/{id}/verify` | Verify venue |
| GET | `/admin/bookings` | List bookings (paginated, searchable) |
| PATCH | `/admin/bookings/{id}/cancel` | Cancel booking |
| GET | `/admin/posts` | List posts (paginated) |
| DELETE | `/admin/posts/{id}` | Delete post |
| DELETE | `/admin/comments/{id}` | Delete comment |
| GET | `/admin/audit-log` | View audit log |

## Phases

### Phase 1: Foundation Components (4h)

**Goal:** Build reusable UI components needed across all management pages.

**Components to Build:**

1. **Input Component** (`src/components/ui/input.tsx`)
   - Text input with label
   - Error state support
   - Disabled state

2. **Select Component** (`src/components/ui/select.tsx`)
   - Dropdown with options
   - Placeholder support
   - Clearable option

3. **Badge Component** (`src/components/ui/badge.tsx`)
   - Status indicators (success, warning, error, info)
   - Variants for different states

4. **Dialog Component** (`src/components/ui/dialog.tsx`)
   - Modal with overlay
   - Close on backdrop click
   - Close button

5. **Confirm Dialog** (`src/components/ui/confirm-dialog.tsx`)
   - Pre-built confirmation modal
   - Title, message, confirm/cancel buttons
   - Destructive variant

6. **Search Input** (`src/components/ui/search-input.tsx`)
   - Debounced search (300ms)
   - Clear button
   - Loading state

7. **Pagination Component** (`src/components/ui/pagination.tsx`)
   - Page numbers
   - Previous/Next buttons
   - Page size selector

8. **Data Table** (`src/components/ui/data-table.tsx`)
   - TanStack Table wrapper
   - Sortable columns
   - Row actions

**Success Criteria:**
- All components render without errors
- TypeScript types are correct
- Components follow existing design system
- Storybook/docs for each component

---

### Phase 2: User Management Page (3h)

**Goal:** Complete user management with search, filters, and actions.

**Features:**
- List users with pagination
- Search by phone, name, email
- Filter by role (USER, MERCHANT, ADMIN)
- Ban/unban users with reason
- Change user roles
- View user details
- Active/inactive status toggle

**Files to Create:**
- `src/pages/Users.tsx`
- `src/lib/hooks/use-users.ts`
- `src/components/admin/user-actions.tsx`
- `src/components/admin/user-details-dialog.tsx`

**Implementation Steps:**
1. Create `use-users.ts` hook with TanStack Query
2. Build user table columns definition
3. Implement search and filter logic
4. Add ban/unban mutations with optimistic updates
5. Add role change mutation
6. Create user details modal
7. Add loading and error states

**Success Criteria:**
- Users load and display correctly
- Search filters work
- Ban/unban works with confirmation
- Role changes work
- Pagination works

---

### Phase 3: Venue Management Page (3h)

**Goal:** Complete venue management with verification workflow.

**Features:**
- List venues with pagination
- Search by name, location
- Filter by verification status
- Verify/unverify venues with reason
- View venue details
- Show merchant information
- Display venue images

**Files to Create:**
- `src/pages/Venues.tsx`
- `src/lib/hooks/use-venues.ts`
- `src/components/admin/venue-actions.tsx`
- `src/components/admin/venue-details-dialog.tsx`
- `src/components/admin/venue-image-gallery.tsx`

**Implementation Steps:**
1. Create `use-venues.ts` hook
2. Build venue table columns
3. Add verification status filter
4. Implement verify/unverify mutations
5. Create venue details modal with image gallery
6. Add merchant info display

**Success Criteria:**
- Venues load and display correctly
- Verification workflow works
- Images display properly
- Merchant info shows correctly

---

### Phase 4: Booking Oversight Page (3h)

**Goal:** Complete booking oversight with cancellation capability.

**Features:**
- List all bookings with pagination
- Search by user, venue, date
- Filter by status (confirmed, cancelled, completed)
- Cancel bookings with reason
- View booking details
- Date range picker
- Status indicators

**Files to Create:**
- `src/pages/Bookings.tsx`
- `src/lib/hooks/use-bookings.ts`
- `src/components/admin/booking-actions.tsx`
- `src/components/admin/booking-details-dialog.tsx`
- `src/components/ui/date-range-picker.tsx`

**Implementation Steps:**
1. Create `use-bookings.ts` hook
2. Build booking table columns
3. Add status filter
4. Implement date range filter
5. Add cancel booking mutation
6. Create booking details modal

**Success Criteria:**
- Bookings load correctly
- Date range filter works
- Status filters work
- Cancellation works with confirmation

---

### Phase 5: Content Moderation Page (3h)

**Goal:** Complete content moderation with bulk actions.

**Features:**
- List posts and comments
- Search by content, author
- Filter by content type
- Delete inappropriate posts
- Delete inappropriate comments
- Content preview
- Bulk moderation actions

**Files to Create:**
- `src/pages/Content.tsx`
- `src/lib/hooks/use-content.ts`
- `src/components/admin/content-actions.tsx`
- `src/components/admin/content-preview-dialog.tsx`
- `src/components/admin/bulk-actions-bar.tsx`

**Implementation Steps:**
1. Create `use-content.ts` hook
2. Build content table columns
3. Add content type filter
4. Implement delete mutations for posts/comments
5. Add bulk selection
6. Create content preview modal
7. Implement bulk delete

**Success Criteria:**
- Content loads correctly
- Delete actions work
- Bulk selection works
- Preview modal shows content

---

### Phase 6: Audit Log Page (2h)

**Goal:** Complete audit log viewer with export capability.

**Features:**
- List all admin actions
- Search by action type, admin
- Filter by date range
- View action details
- Export to CSV
- Pagination
- Timestamp display

**Files to Create:**
- `src/pages/AuditLog.tsx`
- `src/lib/hooks/use-audit-log.ts`
- `src/components/admin/audit-log-details.tsx`
- `src/lib/utils/csv-export.ts`

**Implementation Steps:**
1. Create `use-audit-log.ts` hook
2. Build audit log table columns
3. Add action type filter
4. Implement date range filter
5. Create CSV export utility
6. Add action details modal

**Success Criteria:**
- Audit logs load correctly
- Filters work
- CSV export works
- Timestamps format correctly

---

### Phase 7: Integration & Polish (2h)

**Goal:** Final integration, testing, and polish.

**Tasks:**
1. Update `src/Router.tsx` to use new page components
2. Add shared layout components (PageHeader, FilterBar)
3. Implement consistent error handling
4. Add loading states across all pages
5. Test responsive design
6. Accessibility audit
7. Performance optimization

**Success Criteria:**
- All routes work correctly
- Consistent UI/UX across pages
- No console errors
- Responsive on mobile
- WCAG AA compliant

---

## API Integration Strategy

### Query Pattern (TanStack Query v5)

```typescript
// Example: use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get<UserListResponse>('/admin/users', params),
  })
}

export function useBanUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}
```

### Error Handling Pattern

```typescript
// Wrap API calls with try-catch
// Show toast notifications for errors
// Display inline validation for form errors
```

### Optimistic Updates Pattern

```typescript
// Update UI immediately, rollback on error
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: ['admin-users'] })
  const previous = queryClient.getQueryData(['admin-users'])
  queryClient.setQueryData(['admin-users'], (old) => optimisticUpdate(old, variables))
  return { previous }
},
onError: (err, variables, context) => {
  queryClient.setQueryData(['admin-users'], context?.previous)
}
```

---

## Type Definitions

### Additional Types Needed

```typescript
// Add to src/types/api.ts

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: 'USER' | 'MERCHANT' | 'ADMIN'
  is_active?: boolean
}

export interface BanUserRequest {
  reason: string
}

export interface ChangeRoleRequest {
  role: 'USER' | 'MERCHANT' | 'ADMIN'
}

export interface VenueListParams {
  page?: number
  limit?: number
  search?: string
  is_verified?: boolean
}

export interface BookingListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  date_from?: string
  date_to?: string
}

export interface ContentListParams {
  page?: number
  limit?: number
  search?: string
  content_type?: 'post' | 'comment'
}

export interface AuditLogParams {
  page?: number
  limit?: number
  action_type?: string
  date_from?: string
  date_to?: string
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Utility functions

### Integration Tests
- API integration
- Form submissions
- Navigation flows

### E2E Tests (Playwright)
- Full user flows
- Critical paths (ban user, verify venue, etc.)

### Manual Testing Checklist
- [ ] All pages load without errors
- [ ] Search works on all pages
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Mutations (ban, verify, delete) work
- [ ] Optimistic updates work
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Responsive design works
- [ ] Keyboard navigation works

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend API changes | High | Use TypeScript types to catch mismatches early |
| Performance issues with large datasets | Medium | Implement proper pagination and caching |
| State synchronization issues | Medium | Use TanStack Query's invalidation strategy |
| Accessibility gaps | Low | Follow WCAG guidelines, test with screen reader |

---

## Next Steps

1. Review and approve this plan
2. Begin Phase 1: Foundation Components
3. Build incrementally, testing each phase
4. Deploy to staging for final review
