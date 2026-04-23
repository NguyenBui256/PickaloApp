---
title: "Phase 8: Audit Log Viewer"
description: "Implement audit log viewing with filtering and export"
status: pending
priority: P3
effort: 2h
tags: [audit-log, logging, export]
---

# Phase 8: Audit Log Viewer

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 7: [phase-07-content-moderation.md](./phase-07-content-moderation.md)
- Admin API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Admin Model: [D:/PTIT/PickaloApp/backend/app/models/admin.py](../../../backend/app/models/admin.py)

## Overview
**Priority:** P3
**Current Status:** Pending
**Estimated Effort:** 2 hours

Build audit log viewer for tracking all admin actions with filtering capabilities and export functionality.

## Key Insights
- Backend provides paginated audit log
- Can filter by action type
- Shows admin, action, target, and reason
- Important for compliance and security
- Export to CSV for reporting

## Requirements

### Functional Requirements
1. Audit log table with pagination
2. Filter by action type
3. Filter by date range
4. Filter by admin
5. Export to CSV
6. Action type badges
7. Search functionality

### Non-Functional Requirements
- Clear action visualization
- Efficient pagination for large logs
- Quick export functionality

## Architecture

### Audit Log Flow
```
Dashboard → Audit Log Tab
    ↓
Audit Log Table (paginated)
    ↓
[Action Type Filter] → Update query params
    ↓
[Date Range] → Filter by time
    ↓
[Export] → Download CSV
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/audit/screens/audit-log-screen.tsx` | Main audit log screen |
| `src/features/audit/components/audit-log-table.tsx` | Audit log table |
| `src/features/audit/components/audit-filters.tsx` | Filter controls |
| `src/features/audit/api/audit-api.ts` | Audit API calls |
| `src/features/audit/types/audit.types.ts` | Audit types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add audit route |
| `src/components/layout/sidebar.tsx` | Ensure audit link exists |

## Implementation Steps

### Step 1: Create Audit Types (15 min)
```typescript
// src/features/audit/types/audit.types.ts
export type ActionType =
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'CHANGE_ROLE'
  | 'VERIFY_VENUE'
  | 'UNVERIFY_VENUE'
  | 'CANCEL_BOOKING'
  | 'DELETE_POST'
  | 'DELETE_COMMENT'

export type TargetType = 'USER' | 'VENUE' | 'BOOKING' | 'POST' | 'COMMENT' | null

export interface AuditLogItem {
  id: string
  admin_id: string
  admin_name: string
  admin_phone: string
  action_type: ActionType
  target_type: TargetType
  target_id: string | null
  target_name: string | null
  reason: string | null
  created_at: string
}

export interface AuditLogResponse {
  actions: AuditLogItem[]
  total: number
  page: number
  limit: number
}

export interface AuditLogParams {
  page?: number
  limit?: number
  action_type?: ActionType
  start_date?: string
  end_date?: string
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  BAN_USER: 'Ban User',
  UNBAN_USER: 'Unban User',
  CHANGE_ROLE: 'Change Role',
  VERIFY_VENUE: 'Verify Venue',
  UNVERIFY_VENUE: 'Revoke Verification',
  CANCEL_BOOKING: 'Cancel Booking',
  DELETE_POST: 'Delete Post',
  DELETE_COMMENT: 'Delete Comment',
}

export const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  BAN_USER: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  UNBAN_USER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CHANGE_ROLE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  VERIFY_VENUE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  UNVERIFY_VENUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CANCEL_BOOKING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE_POST: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DELETE_COMMENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}
```

### Step 2: Create Audit API Service (15 min)
```typescript
// src/features/audit/api/audit-api.ts
import { api } from '@/lib/api'
import type {
  AuditLogResponse,
  AuditLogParams,
} from '../types/audit.types'

export const auditApi = {
  /**
   * Get audit log with pagination and filters
   */
  async getAuditLog(params: AuditLogParams): Promise<AuditLogResponse> {
    const { data } = await api.get<AuditLogResponse>('/admin/audit-log', {
      params,
    })
    return data
  },
}
```

### Step 3: Create Audit Filters Component (25 min)
```typescript
// src/features/audit/components/audit-filters.tsx
import { Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ActionType, ACTION_TYPE_LABELS } from '../types/audit.types'

interface AuditFiltersProps {
  actionType: ActionType | 'all'
  onActionTypeChange: (value: ActionType | 'all') => void
  onReset: () => void
  onExport: () => void
}

export function AuditFilters({
  actionType,
  onActionTypeChange,
  onReset,
  onExport,
}: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={actionType} onValueChange={onActionTypeChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onReset}>
        <Filter className="mr-2 h-4 w-4" />
        Reset Filters
      </Button>

      <Button variant="outline" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  )
}
```

### Step 4: Create Audit Log Table Component (40 min)
```typescript
// src/features/audit/components/audit-log-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Shield, User, Clock, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ACTION_TYPE_LABELS, ACTION_TYPE_COLORS } from '../types/audit.types'
import type { AuditLogItem } from '../types/audit.types'

interface AuditLogTableProps {
  data: AuditLogItem[]
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<AuditLogItem>[] = [
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        {formatDateTime(row.getValue('created_at'))}
      </div>
    ),
  },
  {
    accessorKey: 'admin_name',
    header: 'Admin',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{row.getValue('admin_name')}</span>
        </div>
        <div className="text-xs text-muted-foreground">{row.original.admin_phone}</div>
      </div>
    ),
  },
  {
    accessorKey: 'action_type',
    header: 'Action',
    cell: ({ row }) => {
      const actionType = row.getValue('action_type') as keyof typeof ACTION_TYPE_LABELS
      return (
        <Badge className={ACTION_TYPE_COLORS[actionType]}>
          {ACTION_TYPE_LABELS[actionType]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'target',
    header: 'Target',
    cell: ({ row }) => {
      const targetType = row.original.target_type
      const targetName = row.original.target_name

      if (!targetType || !targetName) {
        return <span className="text-muted-foreground">N/A</span>
      }

      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{targetName}</span>
          <Badge variant="outline" className="text-xs">
            {targetType}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => {
      const reason = row.getValue('reason')
      if (!reason) return <span className="text-muted-foreground">N/A</span>

      return (
        <div className="flex items-start gap-2 max-w-md">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm line-clamp-2">{reason}</p>
        </div>
      )
    },
  },
]

export function AuditLogTable({ data }: AuditLogTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
                No audit log entries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 5: Create Audit Log Screen (30 min)
```typescript
// src/features/audit/screens/audit-log-screen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { ActionType } from '@/types/admin.types'
import { queryKeys } from '@/lib/query-keys'
import { auditApi } from '../api/audit-api'
import type { AuditLogParams } from '../types/audit.types'
import { PageHeader } from '@/components/common/page-header'
import { AuditFilters } from '../components/audit-filters'
import { AuditLogTable } from '../components/audit-log-table'
import { Pagination } from '@/components/ui/pagination'

export function AuditLogScreen() {
  const [page, setPage] = useState(1)
  const [actionType, setActionType] = useState<ActionType | 'all'>('all')

  const params: AuditLogParams = {
    page,
    limit: 50,
    action_type: actionType === 'all' ? undefined : actionType,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['audit', 'log', params],
    queryFn: () => auditApi.getAuditLog(params),
  })

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  const handleResetFilters = () => {
    setActionType('all')
    setPage(1)
  }

  const handleExport = () => {
    if (!data) return

    // Create CSV content
    const headers = ['Time', 'Admin', 'Admin Phone', 'Action', 'Target Type', 'Target', 'Reason']
    const rows = data.actions.map((action) => [
      new Date(action.created_at).toLocaleString('vi-VN'),
      action.admin_name,
      action.admin_phone,
      ACTION_TYPE_LABELS[action.action_type],
      action.target_type || 'N/A',
      action.target_name || 'N/A',
      action.reason || 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Track all admin actions across the platform"
      />

      <AuditFilters
        actionType={actionType}
        onActionTypeChange={setActionType}
        onReset={handleResetFilters}
        onExport={handleExport}
      />

      <AuditLogTable data={data?.actions ?? []} />

      {data && data.total > data.limit && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <div className="text-sm text-muted-foreground">
        Showing {data?.actions.length ?? 0} of {data?.total ?? 0} total entries
      </div>
    </div>
  )
}
```

## Todo List
- [ ] Create audit TypeScript types
- [ ] Implement audit API service
- [ ] Build audit filters component
- [ ] Build audit log table component
- [ ] Create audit log screen
- [ ] Add export to CSV functionality
- [ ] Add pagination
- [ ] Test filtering by action type
- [ ] Test export functionality

## Success Criteria
- [ ] Audit log table displays with pagination
- [ ] Filter by action type works
- [ ] Export to CSV downloads file
- [ ] All action types display correctly
- [ ] Timestamps format correctly
- [ ] Target information displays
- [ ] Reason text displays (with truncation)
- [ ] Loading states display properly

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Large audit log size | Pagination, increase limit to 50 |
| Export performance | Client-side CSV generation |
| Sensitive data in logs | Mask where needed on backend |

## Security Considerations
- Audit log read-only (cannot delete)
- All actions logged server-side
- Export includes full context
- Cannot modify audit trail

## Next Steps
- All phases complete
- Integration testing
- Production deployment preparation
- Documentation updates

## Related Documentation
- [Backend Audit Implementation](../../../backend/app/api/v1/endpoints/admin.py)
- [Admin Model](../../../backend/app/models/admin.py)
