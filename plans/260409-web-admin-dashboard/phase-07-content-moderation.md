---
title: "Phase 7: Content Moderation"
description: "Implement post and comment moderation with deletion capabilities"
status: pending
priority: P2
effort: 3h
tags: [content-moderation, posts, comments]
---

# Phase 7: Content Moderation

## Context Links
- Main Plan: [plan.md](./plan.md)
- Phase 6: [phase-06-booking-oversight.md](./phase-06-booking-oversight.md)
- Admin API: [D:/PTIT/PickaloApp/backend/app/api/v1/endpoints/admin.py](../../../backend/app/api/v1/endpoints/admin.py)
- Post Model: [D:/PTIT/PickaloApp/backend/app/models/post.py](../../../backend/app/models/post.py)

## Overview
**Priority:** P2
**Current Status:** Pending
**Estimated Effort:** 3 hours

Build content moderation interface for managing posts and comments with deletion capabilities and content preview.

## Key Insights
- Backend provides paginated post/comment lists
- DELETE endpoints for both posts and comments
- Search works across content and author name
- Need content preview before deletion
- Audit logging for all moderation actions

## Requirements

### Functional Requirements
1. Post listing table with pagination
2. Comment listing table with pagination
3. Content preview before deletion
4. Delete post confirmation
5. Delete comment confirmation
6. Search by content, author name
7. Filter by post type/status

### Non-Functional Requirements
- Clear content preview
- Confirmation for destructive actions
- Loading states for operations

## Architecture

### Content Moderation Flow
```
Dashboard → Content Tab
    ↓
Tabs: Posts | Comments
    ↓
Content Table (paginated)
    ↓
[Search] → Filter content
    ↓
[Row Actions] → Content Preview Modal
    ↓
[Delete] → Confirmation Dialog → API Call → Update Table
```

## Related Code Files

### Files to Create
| File Path | Purpose |
|-----------|---------|
| `src/features/content/screens/content-screen.tsx` | Main content moderation screen |
| `src/features/content/components/post-table.tsx` | Post listing table |
| `src/features/content/components/comment-table.tsx` | Comment listing table |
| `src/features/content/components/content-preview-modal.tsx` | Content preview dialog |
| `src/features/content/components/delete-content-dialog.tsx` | Delete confirmation |
| `src/features/content/api/content-api.ts` | Content API calls |
| `src/features/content/types/content.types.ts` | Content types |

### Files to Modify
| File Path | Changes |
|-----------|---------|
| `src/routes/auth.routes.tsx` | Add content route |
| `src/components/layout/sidebar.tsx` | Ensure content link exists |

## Implementation Steps

### Step 1: Create Content Types (15 min)
```typescript
// src/features/content/types/content.types.ts
export type PostType = 'opponent_search' | 'team_formation' | 'match_discussion' | 'other'

export interface PostAdminListItem {
  id: string
  author_id: string
  author_name: string
  author_phone: string
  content: string
  post_type: PostType
  status: 'active' | 'hidden' | 'deleted'
  created_at: string
  comments_count: number
  likes_count: number
}

export interface CommentAdminListItem {
  id: string
  post_id: string
  post_title: string
  author_id: string
  author_name: string
  author_phone: string
  content: string
  created_at: string
}

export interface PostListResponse {
  posts: PostAdminListItem[]
  total: number
  page: number
  limit: number
}

export interface CommentListResponse {
  comments: CommentAdminListItem[]
  total: number
  page: number
  limit: number
}

export interface PostListParams {
  page?: number
  limit?: number
  search?: string
}

export interface CommentListParams {
  page?: number
  limit?: number
  search?: string
}
```

### Step 2: Create Content API Service (20 min)
```typescript
// src/features/content/api/content-api.ts
import { api } from '@/lib/api'
import type {
  PostListResponse,
  CommentListResponse,
  PostListParams,
  CommentListParams,
} from '../types/content.types'

export const contentApi = {
  /**
   * List posts for moderation
   */
  async listPosts(params: PostListParams): Promise<PostListResponse> {
    const { data } = await api.get<PostListResponse>('/admin/posts', {
      params,
    })
    return data
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/admin/posts/${postId}`)
    return data
  },

  /**
   * List comments for moderation
   */
  async listComments(params: CommentListParams): Promise<CommentListResponse> {
    const { data } = await api.get<CommentListResponse>('/admin/comments', {
      params,
    })
    return data
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(
      `/admin/comments/${commentId}`
    )
    return data
  },
}
```

### Step 3: Create Post Table Component (40 min)
```typescript
// src/features/content/components/post-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MessageSquare, Eye, Trash2, MoreHorizontal } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { POST_TYPE_LABELS } from '@/lib/constants'
import type { PostAdminListItem } from '../types/content.types'

interface PostTableProps {
  data: PostAdminListItem[]
  onPreview: (post: PostAdminListItem) => void
  onDelete: (post: PostAdminListItem) => void
}

const truncateContent = (content: string, maxLength = 100) => {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<PostAdminListItem>[] = [
  {
    accessorKey: 'author_name',
    header: 'Author',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="font-medium">{row.getValue('author_name')}</div>
        <div className="text-xs text-muted-foreground">{row.original.author_phone}</div>
      </div>
    ),
  },
  {
    accessorKey: 'content',
    header: 'Content',
    cell: ({ row }) => (
      <div className="max-w-md">
        <p className="text-sm line-clamp-2">{truncateContent(row.getValue('content'))}</p>
      </div>
    ),
  },
  {
    accessorKey: 'post_type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('post_type') as string
      return (
        <Badge variant="outline" className="capitalize">
          {POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS] || type}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'comments_count',
    header: 'Comments',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        {row.getValue('comments_count')}
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Posted',
    cell: ({ row }) => formatDate(row.getValue('created_at')),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const post = row.original

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
            <DropdownMenuItem onClick={() => table.options.meta?.onPreview?.(post)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview Content
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.options.meta?.onDelete?.(post)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function PostTable({ data, onPreview, onDelete }: PostTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onPreview, onDelete },
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
                No posts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 4: Create Comment Table Component (35 min)
```typescript
// src/features/content/components/comment-table.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MessageSquare, FileText, Trash2, MoreHorizontal } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CommentAdminListItem } from '../types/content.types'

interface CommentTableProps {
  data: CommentAdminListItem[]
  onPreview: (comment: CommentAdminListItem) => void
  onDelete: (comment: CommentAdminListItem) => void
}

const truncateContent = (content: string, maxLength = 80) => {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: ColumnDef<CommentAdminListItem>[] = [
  {
    accessorKey: 'author_name',
    header: 'Author',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="font-medium">{row.getValue('author_name')}</div>
        <div className="text-xs text-muted-foreground">{row.original.author_phone}</div>
      </div>
    ),
  },
  {
    accessorKey: 'content',
    header: 'Comment',
    cell: ({ row }) => (
      <div className="max-w-md">
        <p className="text-sm">{truncateContent(row.getValue('content'))}</p>
      </div>
    ),
  },
  {
    accessorKey: 'post_title',
    header: 'On Post',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-xs">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate text-sm">{row.getValue('post_title')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Posted',
    cell: ({ row }) => formatDate(row.getValue('created_at')),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const comment = row.original

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
            <DropdownMenuItem onClick={() => table.options.meta?.onPreview?.(comment)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              View Full Comment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => table.options.meta?.onDelete?.(comment)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Comment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function CommentTable({ data, onPreview, onDelete }: CommentTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onPreview, onDelete },
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
                No comments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 5: Create Content Preview Modal (30 min)
```typescript
// src/features/content/components/content-preview-modal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, User, Calendar, MessageSquareQuote } from 'lucide-react'
import type { PostAdminListItem, CommentAdminListItem } from '../types/content.types'
import { POST_TYPE_LABELS } from '@/lib/constants'

interface ContentPreviewModalProps {
  post: PostAdminListItem | null
  comment: CommentAdminListItem | null
  open: boolean
  onClose: () => void
}

export function ContentPreviewModal({
  post,
  comment,
  open,
  onClose,
}: ContentPreviewModalProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Content Preview</DialogTitle>
          <DialogDescription>
            Review the content before taking moderation action
          </DialogDescription>
        </DialogHeader>

        {post && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author_name} ({post.author_phone})
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.created_at)}
              </div>
              <Badge variant="outline" className="capitalize">
                {POST_TYPE_LABELS[post.post_type] || post.post_type}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Post Content
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4" />
                {post.comments_count} comments
              </div>
            </div>
          </div>
        )}

        {comment && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {comment.author_name} ({comment.author_phone})
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(comment.created_at)}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Comment
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                On Post
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm line-clamp-2">{comment.post_title}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

### Step 6: Create Delete Content Dialog (25 min)
```typescript
// src/features/content/components/delete-content-dialog.tsx
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
import { AlertTriangle } from 'lucide-react'
import { contentApi } from '../api/content-api'
import type { PostAdminListItem, CommentAdminListItem } from '../types/content.types'

interface DeleteContentDialogProps {
  post: PostAdminListItem | null
  comment: CommentAdminListItem | null
  open: boolean
  onClose: () => void
}

export function DeleteContentDialog({
  post,
  comment,
  open,
  onClose,
}: DeleteContentDialogProps) {
  const queryClient = useQueryClient()

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => contentApi.deletePost(postId),
    onSuccess: () => {
      toast.success('Post deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin'] })
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete post')
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => contentApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success('Comment deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['comments', 'admin'] })
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment')
    },
  })

  const handleDelete = () => {
    if (post) {
      deletePostMutation.mutate(post.id)
    } else if (comment) {
      deleteCommentMutation.mutate(comment.id)
    }
  }

  const isLoading = deletePostMutation.isPending || deleteCommentMutation.isPending
  const contentName = post ? 'post' : 'comment'
  const contentAuthor = post ? post.author_name : comment?.author_name

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {contentName === 'post' ? 'Post' : 'Comment'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {contentName} by {contentAuthor}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <strong>Warning:</strong> This will permanently remove the {contentName} and all
          associated data. The action will be logged in the audit trail.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : `Delete ${contentName === 'post' ? 'Post' : 'Comment'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 7: Create Content Moderation Screen (40 min)
```typescript
// src/features/content/screens/content-screen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, MessageCircle } from 'lucide-react'
import { queryKeys } from '@/lib/query-keys'
import { contentApi } from '../api/content-api'
import type { PostAdminListItem, CommentAdminListItem } from '../types/content.types'
import { PageHeader } from '@/components/common/page-header'
import { PostTable } from '../components/post-table'
import { CommentTable } from '../components/comment-table'
import { ContentPreviewModal } from '../components/content-preview-modal'
import { DeleteContentDialog } from '../components/delete-content-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function ContentScreen() {
  const [page, setPage] = useState(1)
  const [postSearch, setPostSearch] = useState('')
  const [commentSearch, setCommentSearch] = useState('')

  const [selectedPost, setSelectedPost] = useState<PostAdminListItem | null>(null)
  const [selectedComment, setSelectedComment] = useState<CommentAdminListItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'admin', page, postSearch],
    queryFn: () =>
      contentApi.listPosts({
        page,
        limit: 20,
        search: postSearch || undefined,
      }),
  })

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', 'admin', page, commentSearch],
    queryFn: () =>
      contentApi.listComments({
        page,
        limit: 20,
        search: commentSearch || undefined,
      }),
  })

  const totalPages = postsData ? Math.ceil(postsData.total / postsData.limit) : 1

  const handlePreviewPost = (post: PostAdminListItem) => {
    setSelectedPost(post)
    setSelectedComment(null)
    setPreviewOpen(true)
  }

  const handlePreviewComment = (comment: CommentAdminListItem) => {
    setSelectedComment(comment)
    setSelectedPost(null)
    setPreviewOpen(true)
  }

  const handleDeletePost = (post: PostAdminListItem) => {
    setSelectedPost(post)
    setSelectedComment(null)
    setDeleteOpen(true)
  }

  const handleDeleteComment = (comment: CommentAdminListItem) => {
    setSelectedComment(comment)
    setSelectedPost(null)
    setDeleteOpen(true)
  }

  const handleCloseModals = () => {
    setPreviewOpen(false)
    setDeleteOpen(false)
    setSelectedPost(null)
    setSelectedComment(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Moderation"
        description="Manage posts and comments across the platform"
      />

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts by content, author..."
              value={postSearch}
              onChange={(e) => {
                setPostSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <PostTable
            data={postsData?.posts ?? []}
            onPreview={handlePreviewPost}
            onDelete={handleDeletePost}
          />

          {postsData && postsData.total > postsData.limit && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search comments by content, author..."
              value={commentSearch}
              onChange={(e) => {
                setCommentSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <CommentTable
            data={commentsData?.comments ?? []}
            onPreview={handlePreviewComment}
            onDelete={handleDeleteComment}
          />

          {commentsData && commentsData.total > commentsData.limit && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </TabsContent>
      </Tabs>

      <ContentPreviewModal
        post={selectedPost}
        comment={selectedComment}
        open={previewOpen}
        onClose={handleCloseModals}
      />

      <DeleteContentDialog
        post={selectedPost}
        comment={selectedComment}
        open={deleteOpen}
        onClose={handleCloseModals}
      />
    </div>
  )
}
```

## Todo List
- [ ] Create content TypeScript types
- [ ] Implement content API service
- [ ] Build post table component
- [ ] Build comment table component
- [ ] Build content preview modal
- [ ] Build delete content dialog
- [ ] Create content moderation screen with tabs
- [ ] Add search functionality
- [ ] Test deletion flows
- [ ] Verify audit logging

## Success Criteria
- [ ] Posts tab displays with pagination
- [ ] Comments tab displays with pagination
- [ ] Search filters content correctly
- [ ] Content preview shows full content
- [ ] Delete post works with confirmation
- [ ] Delete comment works with confirmation
- [ ] All actions invalidate queries
- [ ] Loading states display properly

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Accidental deletion | Confirmation dialog, preview before delete |
| Mass deletion abuse | Rate limiting on backend |
| Lost content | Backend soft delete |

## Security Considerations
- All actions require admin role
- Audit logging on backend
- Cannot delete own content as safety check
- Content preview prevents accidental deletion

## Next Steps
- Proceed to Phase 8: Audit Log Viewer
- Add content report queue
- Implement content filtering

## Related Documentation
- [Backend Content Moderation](../../../backend/app/api/v1/endpoints/admin.py)
- [Post Model](../../../backend/app/models/post.py)
