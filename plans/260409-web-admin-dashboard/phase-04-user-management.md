---
title: "Phase 4: User Management"
description: "Implement user listing, filtering, ban/unban, and role management"
status: pending
priority: P1
effort: 5h
tags: [user-management, table, admin-actions]
---

# Phase 4: User Management

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 3: [phase-03-dashboard-screen.md](./phase-03-dashboard-screen.md)
- User API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Admin Schemas: [D:/PTIT/PickaloApp/backend/app/schemas/admin.py](../../../backend/app/schemas/admin.py)
- User Model: [D:/PTIT/PickaloApp/backend/app/models/user.py](../../../backend/app/models/user.py)

## Overview
**Priority:** P1
**Current Status:** Pending
**Estimated Effort:** 5 hours

Build comprehensive user management interface with listing, filtering, search, ban/unban functionality, and role management.

## Key Insights
- Backend provides paginated user list with filters
- Ban/unban requires reason (min 10 characters)
- Role changes require audit logging
- Search works across phone, name, email
- TanStack Table provides powerful table features

## Requirements

### Functional Requirements
1. User data table with pagination (20 per page)
2. Search by phone, name, email
3. Filter by role (USER, MERCHANT, ADMIN)
4. Filter by active status
5. Ban user with reason
6. Unban user with reason
7. Change user role with reason
8. User detail modal

### Non-Functional Requirements
- Optimistic updates for better UX
- Clear confirmation dialogs for destructive actions
- Loading states for mutations
- Error handling with rollback on failure

## Architecture

### User Management Flow
```
Dashboard → Users Tab
    ↓
User Table (paginated, filtered)
    ↓
[Search/Filter] → Update query params
    ↓
[Row Actions] → User Detail Modal
    ↓
[Ban/Unban] → Confirmation Dialog → API Call → Update Table
    ↓
[Change Role] → Role Selector → Reason Input → API Call → Update Table
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/users/screens/users-screen.tsx` | Main user management screen |
| `src/features/users/components/user-table.tsx` | User data table |
| `src/features/users/components/user-filters.tsx` | Search and filter controls |
| `src/features/users/components/user-detail-modal.tsx` | User detail view |
| `src/features/users/components/ban-user-dialog.tsx` | Ban/unban confirmation |
| `src/features/users/components/change-role-dialog.tsx` | Role change dialog |
| `src/features/users/api/users-api.ts` | User API calls |
| `src/features/users/types/users.types.ts` | User types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add users route |
| `src/components/layout/sidebar.tsx` | Ensure users link exists |

## Implementation Steps

### Step 1: Create User Types (20 min)
```typescript
// src/features/users/types/users.types.ts
import { UserRole } from '@/types/user.types'

export interface UserListItem {
  id: string
  phone: string
  full_name: string
  email: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  venues_count: number
  bookings_count: number
}

export interface UserListResponse {
  users: UserListItem[]
  total: number
  page: number
  limit: number
}

export interface UserListParams {
  page?: number
  limit?: number
  role?: UserRole
  is_active?: boolean
  search?: string
}

export interface BanUserRequest {
  reason: string
}

export interface UnbanUserRequest {
  reason: string
}

export interface ChangeRoleRequest {
  role: UserRole
  reason: string
}
```

### Step 2: Create User API Service (30 min)
```typescript
// src/features/users/api/users-api.ts
import { api } from '@/lib/api'
import type {
  UserListResponse,
  UserListParams,
  UserListItem,
  BanUserRequest,
  UnbanUserRequest,
  ChangeRoleRequest,
} from '../types/users.types'

export const usersApi = {
  /**
   * List users with pagination and filters
   */
  async listUsers(params: UserListParams): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>('/admin/users', {
      params,
    })
    return data
  },

  /**
   * Ban a user
   */
  async banUser(userId: string, request: BanUserRequest): Promise<UserListItem> {
    const { data } = await api.patch<UserListItem>(
      `/admin/users/${userId}/ban`,
      request
    )
    return data
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string, request: UnbanUserRequest): Promise<UserListItem> {
    const { data } = await api.patch<UserListItem>(
      `/admin/users/${userId}/unban`,
      request
    )
    return data
  },

  /**
   * Change user role
   */
  async changeRole(
    userId: string,
    request: ChangeRoleRequest
  ): Promise<UserListItem> {
    const { data } = await api.patch<UserListItem>(
      `/admin/users/${userId}/role`,
      request
    )
    return data
  },
}
```

### Step 3: Create User Filters Component (30 min)
```typescript
// src/features/users/components/user-filters.tsx
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
import { UserRole } from '@/types/user.types'

interface UserFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  role: UserRole | 'all'
  onRoleChange: (value: UserRole | 'all') => void
  isActive: boolean | 'all'
  onIsActiveChange: (value: boolean | 'all') => void
  onReset: () => void
}

export function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  isActive,
  onIsActiveChange,
  onReset,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by phone, name, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value={UserRole.USER}>User</SelectItem>
          <SelectItem value={UserRole.MERCHANT}>Merchant</SelectItem>
          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
        </SelectContent>
      </Select>

      <Select value={String(isActive)} onValueChange={(v) => onIsActiveChange(v === 'all' ? 'all' : v === 'true')}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
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

### Step 4: Create User Table Component (60 min)
```typescript
// src/features/users/components/user-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
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
import type { UserListItem } from '../types/users.types'
import { UserRole } from '@/types/user.types'

interface UserTableProps {
  data: UserListItem[]
  onBanUser: (user: UserListItem) => void
  onUnbanUser: (user: UserListItem) => void
  onChangeRole: (user: UserListItem) => void
  onViewDetails: (user: UserListItem) => void
}

const roleColors: Record<UserRole, string> = {
  [UserRole.USER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [UserRole.MERCHANT]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [UserRole.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const columns: ColumnDef<UserListItem>[] = [
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Phone
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('phone')}</div>,
  },
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => row.getValue('full_name'),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.getValue('email') || <span className="text-muted-foreground">N/A</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as UserRole
      return (
        <Badge className={roleColors[role]}>
          {role.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Banned'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'venues_count',
    header: 'Venues',
    cell: ({ row }) => row.getValue('venues_count'),
  },
  {
    accessorKey: 'bookings_count',
    header: 'Bookings',
    cell: ({ row }) => row.getValue('bookings_count'),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const user = row.original

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
            <DropdownMenuItem onClick={() => table.options.meta?.onViewDetails?.(user)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.options.meta?.onChangeRole?.(user)}>
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.is_active ? (
              <DropdownMenuItem
                onClick={() => table.options.meta?.onBanUser?.(user)}
                className="text-destructive"
              >
                Ban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => table.options.meta?.onUnbanUser?.(user)}>
                Unban User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function UserTable({
  data,
  onBanUser,
  onUnbanUser,
  onChangeRole,
  onViewDetails,
}: UserTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onBanUser,
      onUnbanUser,
      onChangeRole,
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
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 5: Create Ban User Dialog (45 min)
```typescript
// src/features/users/components/ban-user-dialog.tsx
import { useState } from 'react'
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
import { AlertTriangle } from 'lucide-react'
import { usersApi } from '../api/users-api'
import { queryKeys } from '@/lib/query-keys'
import type { UserListItem } from '../types/users.types'

const banSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type BanFormData = z.infer<typeof banSchema>

interface BanUserDialogProps {
  user: UserListItem | null
  open: boolean
  onClose: () => void
}

export function BanUserDialog({ user, open, onClose }: BanUserDialogProps) {
  const queryClient = useQueryClient()
  const [isUnbanning, setIsUnbanning] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BanFormData>({
    resolver: zodResolver(banSchema),
  })

  const banMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string }) =>
      usersApi.banUser(data.userId, { reason: data.reason }),
    onSuccess: () => {
      toast.success('User banned successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all({}) })
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to ban user')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (data: { userId: string; reason: string }) =>
      usersApi.unbanUser(data.userId, { reason: data.reason }),
    onSuccess: () => {
      toast.success('User unbanned successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all({}) })
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unban user')
    },
  })

  const onSubmit = (data: BanFormData) => {
    if (!user) return

    if (isUnbanning) {
      unbanMutation.mutate({ userId: user.id, reason: data.reason })
    } else {
      banMutation.mutate({ userId: user.id, reason: data.reason })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset()
      setIsUnbanning(false)
    }
    onClose()
  }

  if (!user) return null

  const isBanning = !user.is_active && !isUnbanning

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {user.is_active ? 'Ban User' : 'Unban User'}
          </DialogTitle>
          <DialogDescription>
            {user.is_active
              ? `Are you sure you want to ban ${user.full_name}? This action will be logged.`
              : `Unban ${user.full_name}? They will regain access to their account.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {user.is_active ? 'for banning' : 'for unbanning'}
              </Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason (min. 10 characters)..."
                rows={4}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            {user.is_active && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <strong>Warning:</strong> This user will lose access to their account
                immediately. This action will be logged in the audit trail.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={banMutation.isPending || unbanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={user.is_active ? 'destructive' : 'default'}
              disabled={banMutation.isPending || unbanMutation.isPending}
            >
              {banMutation.isPending || unbanMutation.isPending
                ? 'Processing...'
                : user.is_active
                ? 'Ban User'
                : 'Unban User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Create Change Role Dialog (45 min)
```typescript
// src/features/users/components/change-role-dialog.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldAlert } from 'lucide-react'
import { usersApi } from '../api/users-api'
import { queryKeys } from '@/lib/query-keys'
import { UserRole } from '@/types/user.types'
import type { UserListItem } from '../types/users.types'

const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type ChangeRoleFormData = z.infer<typeof changeRoleSchema>

interface ChangeRoleDialogProps {
  user: UserListItem | null
  open: boolean
  onClose: () => void
}

export function ChangeRoleDialog({ user, open, onClose }: ChangeRoleDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChangeRoleFormData>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      role: user?.role || UserRole.USER,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { userId: string; role: UserRole; reason: string }) =>
      usersApi.changeRole(data.userId, { role: data.role, reason: data.reason }),
    onSuccess: () => {
      toast.success('User role changed successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all({}) })
      reset()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change user role')
    },
  })

  const onSubmit = (data: ChangeRoleFormData) => {
    if (!user) return
    mutation.mutate({ userId: user.id, role: data.role, reason: data.reason })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
    }
    onClose()
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Change the role for <strong>{user.full_name}</strong>. This action will be logged.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select
                defaultValue={user.role}
                onValueChange={(value) => setValue('role', value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                  <SelectItem value={UserRole.MERCHANT}>Merchant</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for role change</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason (min. 10 characters)..."
                rows={4}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-500">
              <strong>Warning:</strong> Changing a user to Admin grants full platform
              access. This action will be logged in the audit trail.
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 7: Create User Management Screen (60 min)
```typescript
// src/features/users/screens/users-screen.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserRole } from '@/types/user.types'
import { queryKeys } from '@/lib/query-keys'
import { usersApi } from '../api/users-api'
import type { UserListParams } from '../types/users.types'
import type { UserListItem } from '../types/users.types'
import { PageHeader } from '@/components/common/page-header'
import { UserFilters } from '../components/user-filters'
import { UserTable } from '../components/user-table'
import { BanUserDialog } from '../components/ban-user-dialog'
import { ChangeRoleDialog } from '../components/change-role-dialog'
import { UserDetailModal } from '../components/user-detail-modal'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function UsersScreen() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState<UserRole | 'all'>('all')
  const [isActive, setIsActive] = useState<boolean | 'all'>('all')

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const params: UserListParams = {
    page,
    limit: 20,
    role: role === 'all' ? undefined : role,
    is_active: isActive === 'all' ? undefined : isActive,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.all(params),
    queryFn: () => usersApi.listUsers(params),
  })

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  const handleSearchChange = (value: string) => {
    setSearch(value)
    // Debounce search
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setRole('all')
    setIsActive('all')
    setPage(1)
  }

  const handleBanUser = (user: UserListItem) => {
    setSelectedUser(user)
    setBanDialogOpen(true)
  }

  const handleChangeRole = (user: UserListItem) => {
    setSelectedUser(user)
    setRoleDialogOpen(true)
  }

  const handleViewDetails = (user: UserListItem) => {
    setSelectedUser(user)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access"
      />

      <UserFilters
        search={search}
        onSearchChange={handleSearchChange}
        role={role}
        onRoleChange={setRole}
        isActive={isActive}
        onIsActiveChange={setIsActive}
        onReset={handleResetFilters}
      />

      <div className="rounded-md border">
        <UserTable
          data={data?.users ?? []}
          onBanUser={handleBanUser}
          onUnbanUser={handleBanUser}
          onChangeRole={handleChangeRole}
          onViewDetails={handleViewDetails}
        />
      </div>

      {data && data.total > data.limit && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <BanUserDialog
        user={selectedUser}
        open={banDialogOpen}
        onClose={() => {
          setBanDialogOpen(false)
          setSelectedUser(null)
        }}
      />

      <ChangeRoleDialog
        user={selectedUser}
        open={roleDialogOpen}
        onClose={() => {
          setRoleDialogOpen(false)
          setSelectedUser(null)
        }}
      />

      <UserDetailModal
        user={selectedUser}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
```

### Step 8: Add Required Components (15 min)
```bash
# Install shadcn components
npx shadcn@latest add dropdown-menu textarea badge pagination
```

## Todo List
- [ ] Create user TypeScript types
- [ ] Implement users API service
- [ ] Build user filters component
- [ ] Build user table with TanStack Table
- [ ] Build ban user dialog
- [ ] Build change role dialog
- [ ] Build user detail modal
- [ ] Create user management screen
- [ ] Add pagination component
- [ ] Test all user actions
- [ ] Test filters and search
- [ ] Verify optimistic updates

## Success Criteria
- [ ] User table displays with pagination
- [ ] Search filters users correctly
- [ ] Role filter works
- [ ] Active status filter works
- [ ] Ban user works with reason
- [ ] Unban user works with reason
- [ ] Role change works with reason
- [ ] User detail modal shows info
- [ ] All actions invalidate queries
- [ ] Loading states display properly

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Accidental admin promotion | Clear warning dialog, requires confirmation |
| Bulk banning abuse | Rate limiting on backend |
| Search performance | Debounce search input |

## Security Considerations
- All actions require admin role
- Audit logging on backend
- Minimum reason length prevents spam actions
- Confirmation dialogs prevent accidents

## Next Steps
- Proceed to Phase 5: Venue Management
- Add user activity timeline
- Implement bulk actions if needed

## Related Documentation
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [Backend User Management](../../../backend/app/api/v1/endpoints/admin.py)
