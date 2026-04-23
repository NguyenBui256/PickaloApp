# Admin Management Pages - Implementation Plan

## Summary

This plan provides a comprehensive implementation guide for building 5 admin management pages for the PickAlo admin dashboard.

**Total Estimated Time:** 20 hours
**Priority:** P1
**Status:** Pending

## Pages to Implement

| Page | Route | Description | Time |
|------|-------|-------------|------|
| User Management | `/users` | Manage users, ban/unban, change roles | 3h |
| Venue Management | `/venues` | Verify venues, view details, images | 3h |
| Booking Oversight | `/bookings` | View/cancel bookings, date filters | 3h |
| Content Moderation | `/content` | Delete posts/comments, bulk actions | 3h |
| Audit Log | `/audit-log` | View admin actions, export CSV | 2h |

## Implementation Phases

1. **Phase 1: Foundation Components** (4h)
   - Input, Select, Badge, Dialog, Confirm Dialog
   - Search Input, Pagination, Data Table

2. **Phase 2: User Management** (3h)
   - List, search, filter users
   - Ban/unban, role change actions
   - User details modal

3. **Phase 3: Venue Management** (3h)
   - List, search, filter venues
   - Verify/unverify actions
   - Venue details with image gallery

4. **Phase 4: Booking Oversight** (3h)
   - List, search, filter bookings
   - Date range picker
   - Cancel booking action

5. **Phase 5: Content Moderation** (3h)
   - List, search, filter content
   - Delete posts/comments
   - Bulk actions

6. **Phase 6: Audit Log** (2h)
   - List, search, filter actions
   - Details modal
   - CSV export

7. **Phase 7: Integration & Polish** (2h)
   - Router integration
   - Shared components
   - Testing and fixes

## Files in This Plan

```
plans/260410-admin-management-pages/
├── plan.md                           # Overview and summary
├── phase-01-foundation-components.md  # UI components
├── phase-02-user-management.md        # Users page
├── phase-03-venue-management.md       # Venues page
├── phase-04-booking-oversight.md      # Bookings page
├── phase-05-content-moderation.md     # Content page
├── phase-06-audit-log.md              # Audit log page
├── phase-07-integration-polish.md     # Final integration
└── README.md                          # This file
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **State:** TanStack Query v5
- **Routing:** React Router v7
- **Styling:** TailwindCSS
- **Tables:** TanStack Table v8
- **Icons:** Lucide React
- **Backend:** FastAPI (17 endpoints ready)

## API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/users` | List users |
| PATCH | `/admin/users/{id}/ban` | Ban user |
| PATCH | `/admin/users/{id}/unban` | Unban user |
| PATCH | `/admin/users/{id}/role` | Change role |
| GET | `/admin/venues` | List venues |
| PATCH | `/admin/venues/{id}/verify` | Verify venue |
| GET | `/admin/bookings` | List bookings |
| PATCH | `/admin/bookings/{id}/cancel` | Cancel booking |
| GET | `/admin/posts` | List posts |
| DELETE | `/admin/posts/{id}` | Delete post |
| DELETE | `/admin/comments/{id}` | Delete comment |
| GET | `/admin/audit-log` | View audit log |

## Quick Start

1. Review the main `plan.md` for architecture overview
2. Start with Phase 1 to build foundation components
3. Follow each phase in sequence
4. Use the success criteria in each phase to verify completion
5. Complete Phase 7 for final integration

## Component Architecture

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   └── admin/           # Admin-specific components
├── pages/               # Page components
├── lib/
│   └── hooks/           # Custom React hooks
└── types/               # TypeScript definitions
```

## Key Patterns

### Query Pattern
```typescript
export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get<UserListResponse>('/admin/users', params),
  })
}
```

### Mutation Pattern
```typescript
export function useBanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  })
}
```

## Naming Convention

All new files must use **kebab-case** with descriptive names:

- `user-details-dialog.tsx` (not `UserDetailsDialog.tsx`)
- `ban-user-dialog.tsx` (not `BanUserDialog.tsx`)
- `csv-export.ts` (not `csvExport.ts`)

## Dependencies

- Phase 1 has no dependencies
- Phases 2-6 depend on Phase 1 (foundation components)
- Phase 7 depends on all previous phases
