# Phase 7: Integration & Polish

**Status:** Pending
**Priority:** P1
**Estimated Time:** 2 hours
**Dependencies:** All previous phases

## Overview

Final integration, testing, and polish of all 5 admin management pages. Ensure consistency, fix issues, and prepare for deployment.

---

## Tasks

### 1. Update Router Integration (15min)

**File:** `src/Router.tsx`

Replace placeholder routes with actual page components:

```tsx
import UsersPage from './pages/Users'
import VenuesPage from './pages/Venues'
import BookingsPage from './pages/Bookings'
import ContentPage from './pages/Content'
import AuditLogPage from './pages/AuditLog'

// In routes:
<Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
<Route path="/venues" element={<ProtectedRoute><VenuesPage /></ProtectedRoute>} />
<Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
<Route path="/content" element={<ProtectedRoute><ContentPage /></ProtectedRoute>} />
<Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
```

---

### 2. Create Shared Layout Components (30min)

#### Page Header Component

**File:** `src/components/admin/page-header.tsx`

```typescript
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

#### Filter Bar Component

**File:** `src/components/admin/filter-bar.tsx`

```typescript
interface FilterBarProps {
  children: React.ReactNode
  actions?: React.ReactNode
}

export function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
```

#### Loading State Component

**File:** `src/components/admin/loading-state.tsx`

```typescript
interface LoadingStateProps {
  type?: 'skeleton' | 'spinner' | 'dots'
  count?: number
}

export function LoadingState({ type = 'skeleton', count = 5 }: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
```

---

### 3. Add Toast Notifications (15min)

**File:** `src/components/ui/toast.tsx`

Create a simple toast notification system for feedback:

```typescript
// Use browser's toast or create simple custom implementation
// For MVP, can use simple console.log + custom banner

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Implementation
}
```

---

### 4. Error Boundary (15min)

**File:** `src/components/admin/error-boundary.tsx`

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component {
  // Catch errors in pages and show fallback UI
}
```

---

### 5. Consistent Error Handling (20min)

Apply consistent error handling pattern across all pages:

```typescript
// In hooks
const { data, isLoading, error } = useQuery({
  queryKey: ['admin-users', params],
  queryFn: () => api.get<UserListResponse>('/admin/users', params),
  retry: 1,
})

// In components
if (error) {
  return (
    <div className="p-8">
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p className="font-semibold">Failed to load data</p>
        <p className="text-sm">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    </div>
  )
}
```

---

### 6. Loading States (20min)

Ensure all pages have proper loading states:

- [ ] Users page loading state
- [ ] Venues page loading state
- [ ] Bookings page loading state
- [ ] Content page loading state
- [ ] Audit log loading state

---

### 7. Responsive Design Testing (15min)

Test and fix responsive issues:

- Table horizontal scroll on mobile
- Filter bar stacking on mobile
- Dialog sizing on mobile
- Button sizing on touch devices

---

### 8. Accessibility Audit (20min)

Verify accessibility:

- [ ] All buttons have accessible names
- [ ] Form inputs have labels
- [ ] Tables have captions
- [ ] Dialogs trap focus
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels on icon-only buttons

---

### 9. Performance Optimization (10min)

- Verify pagination is working (not loading all data)
- Check for unnecessary re-renders
- Ensure queries are cached properly
- Add loading skeletons for better perceived performance

---

## Testing Checklist

### Manual Testing

#### User Management
- [ ] Page loads without errors
- [ ] Search works (phone, name, email)
- [ ] Role filter works
- [ ] Status filter works
- [ ] Ban user works with confirmation
- [ ] Unban user works
- [ ] Role change works
- [ ] User details modal shows correct info
- [ ] Pagination works

#### Venue Management
- [ ] Page loads without errors
- [ ] Search works (name, location)
- [ ] Verification filter works
- [ ] Verify venue works
- [ ] Unverify venue works
- [ ] Venue details modal shows info
- [ ] Image gallery works
- [ ] Pagination works

#### Booking Oversight
- [ ] Page loads without errors
- [ ] Search works (user, venue, ID)
- [ ] Status filter works
- [ ] Date range picker works
- [ ] Quick select buttons work
- [ ] Cancel booking works
- [ ] Booking details modal shows info
- [ ] Pagination works

#### Content Moderation
- [ ] Page loads without errors
- [ ] Search works (content, author)
- [ ] Content type filter works
- [ ] Delete post works
- [ ] Delete comment works
- [ ] Content preview modal works
- [ ] Bulk selection works
- [ ] Bulk delete works
- [ ] Pagination works

#### Audit Log
- [ ] Page loads without errors
- [ ] Search works (action, admin)
- [ ] Action type filter works
- [ ] Date range filter works
- [ ] Details modal works
- [ ] Export to CSV works
- [ ] Pagination works

---

## Cross-Page Consistency

### Visual Consistency
- All tables use same styling
- All badges use same variants
- All dialogs use same structure
- All filters use same layout

### Behavior Consistency
- All confirmations require explicit action
- All mutations show feedback (toast)
- All errors display consistently
- All loading states use same pattern

### Code Consistency
- All hooks follow same pattern
- All components use same prop naming
- All files use kebab-case naming
- All exports are named (not default)

---

## File Structure Review

Final structure should be:

```
src/
├── components/
│   ├── admin/
│   │   ├── metric-card.tsx           # [EXISTS]
│   │   ├── page-header.tsx           # [NEW]
│   │   ├── filter-bar.tsx            # [NEW]
│   │   ├── loading-state.tsx         # [NEW]
│   │   ├── error-boundary.tsx        # [NEW]
│   │   ├── user-table-columns.tsx    # [NEW]
│   │   ├── user-actions.tsx          # [NEW]
│   │   ├── user-details-dialog.tsx   # [NEW]
│   │   ├── ban-user-dialog.tsx       # [NEW]
│   │   ├── change-role-dialog.tsx    # [NEW]
│   │   ├── venue-table-columns.tsx   # [NEW]
│   │   ├── venue-actions.tsx         # [NEW]
│   │   ├── venue-details-dialog.tsx  # [NEW]
│   │   ├── venue-image-gallery.tsx   # [NEW]
│   │   ├── verify-venue-dialog.tsx   # [NEW]
│   │   ├── booking-table-columns.tsx # [NEW]
│   │   ├── booking-actions.tsx       # [NEW]
│   │   ├── booking-details-dialog.tsx # [NEW]
│   │   ├── cancel-booking-dialog.tsx # [NEW]
│   │   ├── content-table-columns.tsx # [NEW]
│   │   ├── content-actions.tsx       # [NEW]
│   │   ├── content-preview-dialog.tsx # [NEW]
│   │   ├── bulk-actions-bar.tsx      # [NEW]
│   │   ├── delete-content-dialog.tsx # [NEW]
│   │   ├── audit-log-table-columns.tsx # [NEW]
│   │   ├── audit-log-details-dialog.tsx # [NEW]
│   │   └── export-button.tsx         # [NEW]
│   ├── layout/                       # [EXISTS]
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ProtectedRoute.tsx
│   └── ui/
│       ├── button.tsx                # [EXISTS]
│       ├── card.tsx                  # [EXISTS]
│       ├── input.tsx                 # [NEW]
│       ├── select.tsx                # [NEW]
│       ├── badge.tsx                 # [NEW]
│       ├── dialog.tsx                # [NEW]
│       ├── confirm-dialog.tsx        # [NEW]
│       ├── search-input.tsx          # [NEW]
│       ├── pagination.tsx            # [NEW]
│       ├── data-table.tsx            # [NEW]
│       ├── date-range-picker.tsx     # [NEW]
│       └── toast.tsx                 # [NEW]
├── lib/
│   ├── hooks/
│   │   ├── use-users.ts              # [NEW]
│   │   ├── use-venues.ts             # [NEW]
│   │   ├── use-bookings.ts           # [NEW]
│   │   ├── use-content.ts            # [NEW]
│   │   └── use-audit-log.ts          # [NEW]
│   ├── api.ts                        # [EXISTS]
│   ├── auth.ts                       # [EXISTS]
│   ├── query.ts                      # [EXISTS]
│   ├── utils.ts                      # [EXISTS]
│   └── utils/
│       └── csv-export.ts             # [NEW]
├── pages/
│   ├── Dashboard.tsx                 # [EXISTS]
│   ├── Login.tsx                     # [EXISTS]
│   ├── Users.tsx                     # [NEW]
│   ├── Venues.tsx                    # [NEW]
│   ├── Bookings.tsx                  # [NEW]
│   ├── Content.tsx                   # [NEW]
│   └── AuditLog.tsx                  # [NEW]
└── types/
    └── api.ts                        # [UPDATE - add new types]
```

---

## Success Criteria

- [ ] All 5 pages load and function correctly
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All filters work
- [ ] All actions work
- [ ] Responsive on mobile devices
- [ ] Keyboard navigation works
- [ ] Loading states display
- [ ] Error states display
- [ ] Consistent styling across pages
- [ ] Export to CSV works
- [ ] All mutations show feedback

---

## Post-Completion

After completing all phases:

1. **Run build** - Verify production build works
2. **Run lint** - Fix any linting issues
3. **Update documentation** - Document any new patterns
4. **Create pull request** - For code review
5. **Deploy to staging** - For final testing

---

## Next Steps

After completing this phase:
- All 5 admin management pages are complete
- Ready for testing and deployment
- Can proceed to additional features or bugs
