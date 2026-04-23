# Phase 6: Audit Log Page

**Status:** Pending
**Priority:** P1
**Estimated Time:** 2 hours
**Dependencies:** Phase 1 (Foundation Components), Phase 2 (User Management patterns)

## Overview

Build complete audit log viewer page for tracking all admin actions with export capability.

## Features

| Feature | Description |
|---------|-------------|
| List Audit Logs | Paginated table with action history |
| Search | By action type, admin name, target |
| Action Type Filter | Filter by specific actions |
| Date Range | Filter by action date |
| View Details | Modal with full action context |
| Export to CSV | Download filtered results |
| Timestamp Display | Formatted with timezone |

---

## Files to Create

### 1. `src/lib/hooks/use-audit-log.ts`

Custom hooks for audit log queries.

```typescript
// Queries
export function useAuditLog(params: AuditLogParams)
export function useAuditLogDetails(id: string)
```

**Query Parameters:**
```typescript
interface AuditLogParams {
  page?: number
  limit?: number
  search?: string      // search in action_type, admin_name
  action_type?: string
  date_from?: string   // ISO date string
  date_to?: string     // ISO date string
}
```

---

### 2. `src/pages/AuditLog.tsx`

Main audit log viewer page.

**Structure:**
```tsx
<PageHeader
  title="Audit Log"
  subtitle="Track all admin actions"
  action={<ExportButton onExport={handleExport} />}
/>
<FilterBar>
  <SearchInput value={search} onChange={setSearch} placeholder="Search actions..." />
  <Select value={actionType} onChange={setActionType} options={actionTypeOptions} />
  <DateRange value={dateRange} onChange={setDateRange} />
</FilterBar>
<DataTable data={auditLogs} columns={auditLogColumns} loading={isLoading} />
<Pagination ... />
```

---

### 3. `src/components/admin/audit-log-table-columns.tsx`

Table column definitions for audit logs.

**Columns:**
| Column | Description |
|--------|-------------|
| Timestamp | Formatted date/time with timezone |
| Admin | Admin name with avatar |
| Action | Action type badge |
| Target | Target type and ID (if applicable) |
| Reason | Reason text (truncated) |
| Details | View details button |

---

### 4. `src/components/admin/audit-log-details-dialog.tsx`

Modal showing full audit log entry.

**Display:**
- Action ID
- Timestamp (full with timezone)
- Admin info (name, ID)
- Action type
- Target info (type, ID, name if available)
- Reason (full text)
- IP address (if available)
- User agent (if available)
- Changes made (before/after for updates)

---

### 5. `src/lib/utils/csv-export.ts`

Utility for exporting data to CSV.

**Features:**
- Convert array of objects to CSV
- Handle special characters and commas
- Add BOM for Excel compatibility
- Trigger download

---

### 6. `src/components/admin/export-button.tsx`

Button component for exporting data.

**Features:**
- Loading state during export
- Disabled when no data
- Icon + text label
- Filename with timestamp

---

## Implementation Steps

### Step 1: Create CSV Export Utility (20min)
1. Create `csv-export.ts`
2. Implement object to CSV conversion
3. Add download trigger
4. Test with sample data

### Step 2: Create Hooks (20min)
1. Create `use-audit-log.ts` with list query
2. Add details query if needed

### Step 3: Create Table Columns (20min)
1. Define column structure
2. Add action type badges with colors
3. Format timestamps correctly
4. Add details button

### Step 4: Build Page Layout (40min)
1. Create AuditLog.tsx
2. Add filter bar with search
3. Add action type filter
4. Add date range picker
5. Integrate data table
6. Add export button
7. Add pagination

### Step 5: Create Dialogs (20min)
1. Audit log details modal
2. Format all data properly
3. Add copy to clipboard for IDs

---

## API Integration

### GET /admin/audit-log
```typescript
interface AuditLogResponse {
  actions: AuditLogItem[]
  total: number
  page: number
  limit: number
}

interface AuditLogItem {
  id: string
  admin_id: string
  admin_name: string
  admin_phone: string
  action_type: string
  target_type: 'user' | 'venue' | 'booking' | 'post' | 'comment' | null
  target_id: string | null
  target_name: string | null
  reason: string | null
  changes: Record<string, { before: unknown; after: unknown }> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
```

---

## Action Types

```typescript
const actionTypes = {
  // User actions
  USER_BANNED: { label: 'User Banned', color: 'error' },
  USER_UNBANNED: { label: 'User Unbanned', color: 'success' },
  USER_ROLE_CHANGED: { label: 'Role Changed', color: 'info' },

  // Venue actions
  VENUE_VERIFIED: { label: 'Venue Verified', color: 'success' },
  VENUE_UNVERIFIED: { label: 'Venue Unverified', color: 'warning' },

  // Booking actions
  BOOKING_CANCELLED: { label: 'Booking Cancelled', color: 'error' },

  // Content actions
  POST_DELETED: { label: 'Post Deleted', color: 'error' },
  COMMENT_DELETED: { label: 'Comment Deleted', color: 'error' },

  // Other
  LOGIN: { label: 'Admin Login', color: 'neutral' },
  LOGOUT: { label: 'Admin Logout', color: 'neutral' },
} as const
```

---

## Timestamp Formatting

```typescript
function formatAuditTimestamp(isoString: string): string {
  const date = new Date(isoString)

  // Format: "2024-01-15 14:30:45 ICT"
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    timeZoneName: 'short',
  }).format(date)
}

// Example: "15/01/2024 14:30:45 GMT+7"
```

---

## CSV Export Implementation

```typescript
// src/lib/utils/csv-export.ts

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    toast.error('No data to export')
    return
  }

  // Use provided columns or extract all keys from first item
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }))

  // Create CSV header
  const header = cols.map(c => c.label).join(',')

  // Create CSV rows
  const rows = data.map(item =>
    cols.map(c => {
      const value = item[c.key]
      // Handle values that contain commas or quotes
      if (value === null || value === undefined) return ''
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  )

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })

  // Trigger download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
```

---

## Export Button Component

```typescript
// src/components/admin/export-button.tsx

interface ExportButtonProps {
  onExport: () => void | Promise<void>
  isExporting?: boolean
  disabled?: boolean
  count?: number
}

export function ExportButton({ onExport, isExporting, disabled, count }: ExportButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleExport = async () => {
    setIsPending(true)
    try {
      await onExport()
      toast.success('Export completed')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isPending || isExporting || count === 0}
      variant="outline"
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  )
}
```

---

## Audit Log Details Modal

```typescript
interface AuditLogDetailsDialogProps {
  open: boolean
  onClose: () => void
  log: AuditLogItem
}

export function AuditLogDetailsDialog({ open, onClose, log }: AuditLogDetailsDialogProps) {
  const actionConfig = actionTypes[log.action_type] || { label: log.action_type, color: 'neutral' }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Action Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Info */}
          <div className="flex items-center gap-2">
            <Badge variant={actionConfig.color}>{actionConfig.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatAuditTimestamp(log.created_at)}
            </span>
          </div>

          {/* Admin Info */}
          <div>
            <Label>Admin</Label>
            <p>{log.admin_name}</p>
            <p className="text-sm text-muted-foreground">{log.admin_phone}</p>
          </div>

          {/* Target Info */}
          {log.target_type && (
            <div>
              <Label>Target</Label>
              <p>
                {log.target_type}: {log.target_name || log.target_id}
              </p>
            </div>
          )}

          {/* Reason */}
          {log.reason && (
            <div>
              <Label>Reason</Label>
              <p className="text-sm">{log.reason}</p>
            </div>
          )}

          {/* Changes */}
          {log.changes && (
            <div>
              <Label>Changes</Label>
              <pre className="text-xs bg-muted p-2 rounded">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Action ID: <code>{log.id}</code></p>
            {log.ip_address && <p>IP: {log.ip_address}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Action Type Filter Options

```typescript
const actionTypeOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'user', label: 'User Actions', group: [
    'USER_BANNED',
    'USER_UNBANNED',
    'USER_ROLE_CHANGED',
  ]},
  { value: 'venue', label: 'Venue Actions', group: [
    'VENUE_VERIFIED',
    'VENUE_UNVERIFIED',
  ]},
  { value: 'booking', label: 'Booking Actions', group: [
    'BOOKING_CANCELLED',
  ]},
  { value: 'content', label: 'Content Actions', group: [
    'POST_DELETED',
    'COMMENT_DELETED',
  ]},
]
```

---

## Success Criteria

- [ ] Audit logs load and display in table
- [ ] Search filters by action type/admin/target
- [ ] Action type filter works
- [ ] Date range filter works
- [ ] Timestamps format correctly with timezone
- [ ] Action badges have correct colors
- [ ] Details modal shows all information
- [ ] Export to CSV works
- [ ] CSV file opens correctly in Excel
- [ ] Export filename includes timestamp
- [ ] Pagination works
- [ ] Loading and error states work

---

## Next Steps

After completing this phase:
1. Move to Phase 7: Integration & Polish
2. Final integration of all pages
