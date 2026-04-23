# Phase 1: Foundation Components

**Status:** Pending
**Priority:** P1
**Estimated Time:** 4 hours
**Dependencies:** None

## Overview

Build reusable UI components needed across all 5 management pages. These components form the foundation for the admin interface.

## Components to Build

### 1. Input Component (`src/components/ui/input.tsx`)

**Purpose:** Text input with label for forms and search

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
```

**Features:**
- Label with proper htmlFor association
- Error state styling
- Disabled state
- Full keyboard navigation
- Focus ring

---

### 2. Select Component (`src/components/ui/select.tsx`)

**Purpose:** Dropdown select for filters

**Props:**
```typescript
interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
}
```

**Features:**
- Custom dropdown (not native select)
- Keyboard navigation
- Clearable option
- Option groups support

---

### 3. Badge Component (`src/components/ui/badge.tsx`)

**Purpose:** Status indicators for table cells

**Props:**
```typescript
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}
```

**Color Mapping:**
- success: Green (verified, active, confirmed)
- warning: Yellow (pending, unverified)
- error: Red (banned, cancelled, rejected)
- info: Blue (info)
- neutral: Gray (default)

---

### 4. Dialog Component (`src/components/ui/dialog.tsx`)

**Purpose:** Modal dialog wrapper

**Props:**
```typescript
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
}

interface DialogFooterProps {
  children: React.ReactNode
}
```

**Features:**
- Portal to body
- Backdrop overlay
- Close on Escape key
- Close on backdrop click
- Focus trap
- Animation on open/close

---

### 5. Confirm Dialog (`src/components/ui/confirm-dialog.tsx`)

**Purpose:** Pre-built confirmation for destructive actions

**Props:**
```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}
```

**Usage Example:**
```tsx
<ConfirmDialog
  open={showBanDialog}
  onOpenChange={setShowBanDialog}
  title="Ban User"
  message="Are you sure you want to ban this user? This action can be undone."
  confirmLabel="Ban User"
  variant="destructive"
  onConfirm={handleBan}
/>
```

---

### 6. Search Input (`src/components/ui/search-input.tsx`)

**Purpose:** Debounced search input

**Props:**
```typescript
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}
```

**Features:**
- 300ms default debounce
- Clear button when has value
- Loading state support
- Search icon

---

### 7. Pagination Component (`src/components/ui/pagination.tsx`)

**Purpose:** Table pagination controls

**Props:**
```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  totalItems?: number
}
```

**Features:**
- Page numbers with ellipsis for large ranges
- Previous/Next buttons
- Page size selector
- "Showing X-Y of Z" text
- Disabled state for edges

---

### 8. Data Table (`src/components/ui/data-table.tsx`)

**Purpose:** TanStack Table wrapper with sorting

**Props:**
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  pageSize?: number
  onRowClick?: (row: T) => void
}
```

**Features:**
- TanStack Table v8 integration
- Sortable columns
- Row hover state
- Empty state
- Loading state

---

## Implementation Steps

### Step 1: Create Base Components (1h)
1. Create `input.tsx` - basic text input
2. Create `badge.tsx` - status badge
3. Test rendering and styling

### Step 2: Create Interactive Components (1h)
1. Create `select.tsx` - dropdown select
2. Create `dialog.tsx` - modal wrapper
3. Test keyboard navigation

### Step 3: Create Compound Components (1h)
1. Create `confirm-dialog.tsx` - using dialog
2. Create `search-input.tsx` - with debounce
3. Create `pagination.tsx` - full controls

### Step 4: Create Data Table (1h)
1. Install @tanstack/react-table if needed
2. Create `data-table.tsx` wrapper
3. Add column sorting
4. Test with sample data

---

## File Structure

```
src/components/ui/
├── button.tsx              # [EXISTS]
├── card.tsx                # [EXISTS]
├── input.tsx               # [NEW]
├── select.tsx              # [NEW]
├── badge.tsx               # [NEW]
├── dialog.tsx              # [NEW]
├── confirm-dialog.tsx      # [NEW]
├── search-input.tsx        # [NEW]
├── pagination.tsx          # [NEW]
└── data-table.tsx          # [NEW]
```

---

## Success Criteria

- [ ] All components render without errors
- [ ] TypeScript types are correct (no any types)
- [ ] Components match existing design system
- [ ] Keyboard navigation works for all interactive components
- [ ] Focus management is correct (especially in dialogs)
- [ ] Components are accessible (ARIA labels, roles)
- [ ] No console warnings

---

## Next Steps

After completing this phase:
1. Move to Phase 2: User Management Page
2. These components will be used as building blocks for all pages
