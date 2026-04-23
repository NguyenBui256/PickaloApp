# Phase 5: Content Moderation Page

**Status:** Pending
**Priority:** P1
**Estimated Time:** 3 hours
**Dependencies:** Phase 1 (Foundation Components), Phase 2 (User Management patterns)

## Overview

Build complete content moderation page for managing posts and comments with bulk actions.

## Features

| Feature | Description |
|---------|-------------|
| List Content | Paginated table with posts and comments |
| Search | By content text, author name |
| Content Type Filter | Posts only, Comments only, or All |
| Delete Post | Remove inappropriate posts |
| Delete Comment | Remove inappropriate comments |
| Content Preview | Modal with full content |
| Bulk Actions | Select multiple items for batch delete |
| Author Link | Navigate to user details |

---

## Files to Create

### 1. `src/lib/hooks/use-content.ts`

Custom hooks for content queries and mutations.

```typescript
// Queries
export function usePosts(params: ContentListParams)
export function useComments(params: ContentListParams)
export function useContent(params: ContentListParams) // Combined

// Mutations
export function useDeletePost()
export function useDeleteComment()
export function useBulkDeleteContent()
```

**Query Parameters:**
```typescript
interface ContentListParams {
  page?: number
  limit?: number
  search?: string      // search in content, author
  content_type?: 'post' | 'comment' | 'all'
}
```

---

### 2. `src/pages/Content.tsx`

Main content moderation page.

**Structure:**
```tsx
<PageHeader title="Content Moderation" subtitle="Manage posts and comments" />
{selectedCount > 0 && <BulkActionsBar selectedCount={selectedCount} onDelete={handleBulkDelete} />}
<FilterBar>
  <SearchInput value={search} onChange={setSearch} placeholder="Search content..." />
  <Select value={contentType} onChange={setContentType} options={typeOptions} />
</FilterBar>
<DataTable
  data={content}
  columns={contentColumns}
  loading={isLoading}
  selectable={true}
  onSelect={handleSelect}
/>
<Pagination ... />
```

---

### 3. `src/components/admin/content-table-columns.tsx`

Table column definitions for content.

**Columns:**
| Column | Description |
|--------|-------------|
| Select | Checkbox for bulk selection |
| Type | Post/Comment badge |
| Author | Author name with link |
| Content Preview | Truncated content (100 chars) |
| Status | Published/Deleted/Hidden badge |
| Comments | Count (for posts) |
| Created | Post/comment date |
| Actions | Preview, delete, view author |

---

### 4. `src/components/admin/content-actions.tsx`

Action buttons for content row.

**Actions:**
- Preview Content (opens modal)
- Delete (opens confirmation)
- View Author (navigates to user details)

---

### 5. `src/components/admin/content-preview-dialog.tsx`

Modal showing full content with context.

**For Posts:**
- Author info
- Full content text
- Images (if any)
- Comment count
- Created date
- Engagement stats (likes, shares)
- Link to original post

**For Comments:**
- Author info
- Full comment text
- Parent post info
- Created date
- Link to context

---

### 6. `src/components/admin/bulk-actions-bar.tsx`

Toolbar that appears when items are selected.

**Features:**
- Selected count display
- Clear selection button
- Bulk delete button
- Select all on page button

---

### 7. `src/components/admin/delete-content-dialog.tsx`

Confirmation dialog for content deletion.

**Fields:**
- Content type (Post/Comment)
- Content preview
- Warning message
- Reason textarea (optional)
- Confirmation checkbox

---

## Implementation Steps

### Step 1: Create Hooks (30min)
1. Create `use-content.ts` with list queries
2. Add delete post mutation
3. Add delete comment mutation
4. Add bulk delete mutation
5. Add query invalidation

### Step 2: Create Table Columns (30min)
1. Define column structure
2. Add checkbox selection
3. Add content type badges
4. Add truncated content preview
5. Add action buttons

### Step 3: Build Page Layout (45min)
1. Create Content.tsx
2. Add filter bar with search
3. Add content type filter
4. Implement bulk selection state
5. Integrate data table
6. Add pagination

### Step 4: Create Bulk Actions (30min)
1. Create bulk actions bar
2. Implement select all logic
3. Add bulk delete mutation
4. Add clear selection

### Step 5: Create Dialogs (45min)
1. Content preview dialog for posts
2. Content preview dialog for comments
3. Delete confirmation dialog
4. Wire up mutations

---

## API Integration

### GET /admin/posts
```typescript
interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

interface Post {
  id: string
  author_id: string
  author_name: string
  author_phone: string
  content: string
  post_type: 'looking_for_players' | 'looking_for_team' | 'general'
  status: 'published' | 'hidden' | 'deleted'
  images: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
}
```

### GET /admin/comments
```typescript
interface CommentListResponse {
  comments: Comment[]
  total: number
  page: number
  limit: number
}

interface Comment {
  id: string
  author_id: string
  author_name: string
  author_phone: string
  post_id: string
  post_content_preview: string
  content: string
  status: 'published' | 'hidden' | 'deleted'
  likes_count: number
  created_at: string
}
```

### DELETE /admin/posts/{id}
```typescript
interface DeletePostRequest {
  reason?: string
}
```

### DELETE /admin/comments/{id}
```typescript
interface DeleteCommentRequest {
  reason?: string
}
```

---

## Content Truncation

```typescript
function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

// Strip HTML for preview
function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
```

---

## Bulk Selection Pattern

```typescript
// Local state for selection
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

// Toggle selection
function toggleSelection(id: string) {
  const newSelection = new Set(selectedIds)
  if (newSelection.has(id)) {
    newSelection.delete(id)
  } else {
    newSelection.add(id)
  }
  setSelectedIds(newSelection)
}

// Select all on current page
function selectAllOnPage(ids: string[]) {
  setSelectedIds(new Set(ids))
}

// Clear selection
function clearSelection() {
  setSelectedIds(new Set())
}

// Bulk delete
const bulkDelete = useBulkDeleteContent()

function handleBulkDelete() {
  bulkDelete.mutate({
    ids: Array.from(selectedIds),
    reason: 'Bulk moderation action'
  })
}
```

---

## Content Type Badge

```typescript
const contentTypeConfig = {
  post: { variant: 'info', label: 'Post' },
  comment: { variant: 'neutral', label: 'Comment' },
}

const postTypeConfig = {
  looking_for_players: { label: 'Looking for Players' },
  looking_for_team: { label: 'Looking for Team' },
  general: { label: 'General' },
}
```

---

## Delete Mutation Pattern

```typescript
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.delete(`/admin/posts/${id}`),

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-content'] })
      const previous = queryClient.getQueryData(['admin-content'])

      queryClient.setQueryData(['admin-content'], (old: ContentListResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          posts: old.posts.filter(p => p.id !== id)
        }
      })

      return { previous }
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['admin-content'], context?.previous)
      toast.error('Failed to delete post')
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      toast.success('Post deleted successfully')
    }
  })
}
```

---

## Content Preview Modal

```typescript
interface ContentPreviewDialogProps {
  open: boolean
  onClose: () => void
  content: Post | Comment
}

export function ContentPreviewDialog({ open, onClose, content }: ContentPreviewDialogProps) {
  const isPost = 'post_type' in content

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isPost ? 'Post' : 'Comment'} Details
          </DialogTitle>
        </DialogHeader>

        {/* Author Info */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <UserAvatar />
          <div>
            <p className="font-medium">{content.author_name}</p>
            <p className="text-sm text-muted-foreground">{content.author_phone}</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/users/${content.author_id}`}>View Profile</Link>
          </Button>
        </div>

        {/* Content */}
        <div className="prose max-w-none">
          {isPost && (content as Post).images.length > 0 && (
            <ImageGallery images={(content as Post).images} />
          )}
          <p>{content.content}</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status:</span>
            <Badge>{content.status}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            {formatDate(content.created_at)}
          </div>
          {isPost && (
            <div>
              <span className="text-muted-foreground">Engagement:</span>
              {(content as Post).likes_count} likes, {(content as Post).comments_count} comments
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Success Criteria

- [ ] Content loads and displays in table
- [ ] Search filters by content/author
- [ ] Content type filter works (All/Posts/Comments)
- [ ] Delete post works with confirmation
- [ ] Delete comment works with confirmation
- [ ] Content preview modal shows full content
- [ ] Images display in preview for posts
- [ ] Bulk selection works (checkboxes)
- [ ] Select all on page works
- [ ] Bulk delete works
- [ ] Clear selection works
- [ ] Bulk actions bar shows/hides correctly
- [ ] Pagination works
- [ ] Loading and error states work

---

## Next Steps

After completing this phase:
1. Move to Phase 6: Audit Log Page
2. Final page before integration
