# Phase 2: User Management Page

**Status:** Pending
**Priority:** P1
**Estimated Time:** 3 hours
**Dependencies:** Phase 1 (Foundation Components)

## Overview

Build complete user management page with search, filters, pagination, and user actions (ban/unban, role change).

## Features

| Feature | Description |
|---------|-------------|
| List Users | Paginated table with user data |
| Search | By phone number, name, email |
| Filter | By role (USER, MERCHANT, ADMIN) |
| Ban/Unban | With reason input and confirmation |
| Change Role | Promote/demote users |
| View Details | Modal with full user info |
| Status Toggle | Active/inactive indicator |

---

## Files to Create

### 1. `src/lib/hooks/use-users.ts`

Custom hooks for user queries and mutations.

```typescript
// Queries
export function useUsers(params: UserListParams)
export function useUserDetails(id: string)

// Mutations
export function useBanUser()
export function useUnbanUser()
export function useChangeUserRole()
```

**Query Parameters:**
```typescript
interface UserListParams {
  page?: number        // default: 1
  limit?: number       // default: 20
  search?: string      // search in phone, name, email
  role?: 'USER' | 'MERCHANT' | 'ADMIN'
  is_active?: boolean
}
```

---

### 2. `src/pages/Users.tsx`

Main user management page component.

**Structure:**
```tsx
<PageHeader title="Users" subtitle="Manage user accounts and permissions" />
<FilterBar>
  <SearchInput value={search} onChange={setSearch} />
  <Select value={role} onChange={setRole} options={roleOptions} />
</FilterBar>
<DataTable
  data={users}
  columns={userColumns}
  loading={isLoading}
/>
<Pagination ... />
```

---

### 3. `src/components/admin/user-table-columns.tsx`

Table column definitions for users.

**Columns:**
| Column | Description |
|--------|-------------|
| Avatar | User avatar placeholder |
| Name | Full name with link |
| Phone | Phone number |
| Email | Email address |
| Role | Badge (USER/MERCHANT/ADMIN) |
| Status | Badge (Active/Inactive) |
| Venues | Count of venues (for merchants) |
| Bookings | Count of bookings |
| Created | Join date |
| Actions | Ban/unban, role change, view buttons |

---

### 4. `src/components/admin/user-actions.tsx`

Action buttons for user row.

**Actions:**
- View Details (opens modal)
- Ban User (if active)
- Unban User (if banned)
- Change Role (dropdown)

---

### 5. `src/components/admin/user-details-dialog.tsx`

Modal showing full user information.

**Display:**
- Profile picture
- Full name
- Phone number
- Email
- Role (with badge)
- Status (active/inactive)
- Verification status
- Join date
- Venue count (if merchant)
- Booking count
- Recent activity summary

---

### 6. `src/components/admin/ban-user-dialog.tsx`

Dialog for banning a user.

**Fields:**
- User info preview
- Reason textarea (required)
- Confirmation checkbox

**Validation:**
- Reason is required (min 10 chars)
- User must confirm understanding

---

### 7. `src/components/admin/change-role-dialog.tsx`

Dialog for changing user role.

**Fields:**
- Current role display
- New role selector
- Reason textarea (optional)

---

## Implementation Steps

### Step 1: Create Hooks (30min)
1. Create `use-users.ts` with list query
2. Add ban/unban mutations
3. Add change role mutation
4. Add query invalidation on mutations

### Step 2: Create Table Columns (30min)
1. Define column structure
2. Add status badges
3. Add action buttons
4. Format dates properly

### Step 3: Build Page Layout (45min)
1. Create Users.tsx with page header
2. Add filter bar with search
3. Integrate data table
4. Add pagination

### Step 4: Create Dialogs (45min)
1. User details dialog
2. Ban user dialog with form
3. Change role dialog
4. Wire up mutations

### Step 5: Integrate and Test (30min)
1. Connect all components
2. Test search functionality
3. Test filters
4. Test all actions
5. Verify optimistic updates

---

## API Integration

### GET /admin/users
```typescript
interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
}
```

### PATCH /admin/users/{id}/ban
```typescript
interface BanUserRequest {
  reason: string
}
```

### PATCH /admin/users/{id}/unban
```typescript
interface UnbanUserRequest {
  reason: string
}
```

### PATCH /admin/users/{id}/role
```typescript
interface ChangeRoleRequest {
  role: 'USER' | 'MERCHANT' | 'ADMIN'
  reason?: string
}
```

---

## State Management

```typescript
// Local state for filters
const [search, setSearch] = useState('')
const [role, setRole] = useState<string>('all')
const [isActive, setIsActive] = useState<string>('all')
const [page, setPage] = useState(1)

// Derived params for API
const params = useMemo(() => ({
  page,
  limit: 20,
  search: search || undefined,
  role: role !== 'all' ? role : undefined,
  is_active: isActive !== 'all' ? isActive === 'true' : undefined,
}), [page, search, role, isActive])

// Query
const { data, isLoading } = useUsers(params)
```

---

## Optimistic Updates

```typescript
export function useBanUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/users/${id}/ban`, { reason }),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })
      const previous = queryClient.getQueryData(['admin-users'])

      queryClient.setQueryData(['admin-users'], (old: UserListResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          users: old.users.map(u =>
            u.id === id ? { ...u, is_active: false } : u
          )
        }
      })

      return { previous }
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-users'], context?.previous)
      toast.error('Failed to ban user')
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User banned successfully')
    }
  })
}
```

---

## Success Criteria

- [ ] Users load and display in table
- [ ] Search filters users by phone/name/email
- [ ] Role filter works
- [ ] Active/inactive filter works
- [ ] Pagination works correctly
- [ ] Ban user works with confirmation
- [ ] Unban user works
- [ ] Role change works
- [ ] User details modal shows correct info
- [ ] Loading states display
- [ ] Error states display properly
- [ ] Optimistic updates work

---

## Next Steps

After completing this phase:
1. Move to Phase 3: Venue Management Page
2. Reuse patterns from user management for consistency
