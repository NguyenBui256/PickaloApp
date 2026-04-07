---
title: "Sprint 7: Newsfeed & Community"
description: "Social features for players to find opponents, organize matches, and interact with the community"
status: pending
priority: P2
effort: 10h
tags: [social, newsfeed, posts, comments]
created: 2026-04-06
---

# Sprint 7: Newsfeed & Community

## Overview

Implement community features allowing users to find opponents, organize matches, and interact through posts and comments.

**Priority:** P2 (Medium - enhances community engagement)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.4: Newsfeed features)
- Sprint 1: `./sprint-01-database-models.md` (Post/Comment models)

## Key Insights

1. **Post Types**: RECRUITING (looking for players), LOOKING_FOR_TEAM, SOCIAL
2. **Filters**: Sport type, district, date range
3. **Linked Venues**: Posts can reference specific venues
4. **Moderation**: Admin can hide inappropriate posts

## Requirements

### Functional Requirements

1. **Create Post**: User posts with title, content, type, sport, venue, date/time
2. **List Posts**: Paginated feed with filters
3. **Post Details**: Full post with venue info
4. **Edit Post**: Owner can edit their posts
5. **Delete Post**: Owner can delete, soft delete
6. **Add Comments**: Comment on posts
7. **Delete Comments**: Owner or post owner can delete
8. **Filter Posts**: By sport type, district, date
9. **Hide Post**: Admin can hide inappropriate posts

### Non-Functional Requirements

1. **Performance**: Feed loads in < 1s
2. **Real-time**: Optional: new post notifications
3. **Moderation**: Report/flag system

## Architecture

### Post Types

```python
class PostType(str, Enum):
    RECRUITING = "RECRUITING"           # "Tuyen doi" - looking for players
    LOOKING_FOR_TEAM = "LOOKING_FOR_TEAM"  # "Giao lu" - looking for team
    SOCIAL = "SOCIAL"                   # General discussion
```

### API Endpoints

```
PUBLIC ENDPOINTS
├── GET  /api/v1/posts                    # List posts (paginated)
├── GET  /api/v1/posts/:id                # Get post details
├── GET  /api/v1/posts/:id/comments       # Get post comments
└── GET  /api/v1/sports                   # List sport types

USER ENDPOINTS (Auth Required)
├── POST   /api/v1/posts                  # Create post
├── PUT    /api/v1/posts/:id              # Update own post
├── DELETE /api/v1/posts/:id              # Delete own post
├── POST   /api/v1/posts/:id/comments     # Add comment
├── DELETE /api/v1/posts/:id/comments/:comment_id  # Delete comment
└── POST   /api/v1/posts/:id/report       # Report post

ADMIN ENDPOINTS
├── POST /api/v1/admin/posts/:id/hide     # Hide post
├── POST /api/v1/admin/posts/:id/unhide   # Unhide post
└── DELETE /api/v1/admin/posts/:id        # Force delete
```

### Search Filters

```
GET /api/v1/posts?
    sport_type=Football&              # Filter by sport
    district=Hai+Ba+Trung&            # Filter by district
    post_type=RECRUITING&             # Filter by type
    event_date_from=2026-04-10&       # Event date range
    event_date_to=2026-04-20&
    page=1&                           # Pagination
    limit=20
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/post.py` | Post/Comment Pydantic schemas |
| `backend/app/services/post.py` | Post business logic |
| `backend/app/api/v1/posts.py` | Post endpoints |
| `backend/app/api/v1/admin/posts.py` | Admin post moderation |
| `backend/tests/test_posts.py` | Post tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/post.py` | Add methods |
| `backend/app/api/v1/api.py` | Register post router |

## Implementation Steps

### Step 1: Create Post Schemas (1.5h)

1. Create `backend/app/schemas/post.py`:

**Schemas:**
- `PostCreate`: title, content, post_type, sport_type, venue_id, event_date, event_time, player_count_needed, images
- `PostUpdate`: Partial update fields
- `PostResponse`: id, user, title, content, type, sport, venue, event info, created_at
- `PostListItem`: Simplified for feed
- `PostFilters`: sport_type, district, post_type, date range
- `PostListResponse`: posts + pagination
- `CommentCreate`: content
- `CommentResponse`: id, user, content, created_at
- `ReportRequest`: reason

### Step 2: Create Post Service (2.5h)

1. Create `backend/app/services/post.py`:

**Functions:**
- `create_post(user_id, post_data)`: Create with venue lookup
- `get_posts(filters, pagination)`: List with filters
- `get_post_by_id(post_id)`: Get single post
- `update_post(post_id, user_id, data)`: Update with ownership check
- `delete_post(post_id, user_id)`: Soft delete
- `add_comment(post_id, user_id, content)`: Create comment
- `delete_comment(comment_id, user_id)`: Delete with ownership
- `get_post_comments(post_id, pagination)`: List comments
- `hide_post(post_id, admin_id, reason)`: Admin hide
- `unhide_post(post_id, admin_id)`: Admin unhide
- `report_post(post_id, user_id, reason)`: Create report
- `get_sport_types()`: Return available sport types

**Filter Logic:**
```python
def get_posts(filters, pagination):
    query = db.query(Post).filter(Post.status == 'ACTIVE')

    if filters.sport_type:
        query = query.filter(Post.sport_type == filters.sport_type)

    if filters.district:
        query = query.filter(Post.district == filters.district)

    if filters.post_type:
        query = query.filter(Post.post_type == filters.post_type)

    if filters.event_date_from:
        query = query.filter(Post.event_date >= filters.event_date_from)

    if filters.event_date_to:
        query = query.filter(Post.event_date <= filters.event_date_to)

    return query.order_by(Post.created_at.desc()).offset(
        (pagination.page - 1) * pagination.limit
    ).limit(pagination.limit).all()
```

### Step 3: Create Public Post Endpoints (2h)

1. Create `backend/app/api/v1/posts.py`:

**GET /api/v1/posts**
- Query params: filters + pagination
- Return: Paginated active posts
- Auth: Optional (authenticated users see more)

**GET /api/v1/posts/:id**
- Return: Full post details with comments count
- Auth: Optional

**GET /api/v1/posts/:id/comments**
- Query params: page, limit
- Return: Paginated comments
- Auth: Optional

**GET /api/v1/sports**
- Return: List of sport types (static)
- Auth: Optional

### Step 4: Create User Post Endpoints (2h)

**POST /api/v1/posts**
- Auth: Required
- Input: Post data
- Logic: Create post, link venue if provided
- Return: Created post

**PUT /api/v1/posts/:id**
- Auth: Required
- Logic: Verify ownership, update
- Return: Updated post

**DELETE /api/v1/posts/:id**
- Auth: Required
- Logic: Verify ownership, soft delete
- Return: Success message

**POST /api/v1/posts/:id/comments**
- Auth: Required
- Input: content
- Return: Created comment

**DELETE /api/v1/posts/:id/comments/:comment_id**
- Auth: Required
- Logic: Verify ownership (comment owner or post owner)
- Return: Success message

**POST /api/v1/posts/:id/report**
- Auth: Required
- Input: reason
- Logic: Create report for admin review
- Return: Success message

### Step 5: Create Admin Endpoints (1h)

1. Create `backend/app/api/v1/admin/posts.py`:

**POST /api/v1/admin/posts/:id/hide**
- Auth: Required (ADMIN)
- Input: reason
- Logic: Set status=HIDDEN, log admin action
- Return: Updated post

**POST /api/v1/admin/posts/:id/unhide**
- Auth: Required (ADMIN)
- Logic: Set status=ACTIVE
- Return: Updated post

**DELETE /api/v1/admin/posts/:id**
- Auth: Required (ADMIN)
- Logic: Hard delete inappropriate post
- Return: Success message

**GET /api/v1/admin/posts/reports**
- Auth: Required (ADMIN)
- Return: List of reported posts

### Step 6: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include posts router
   - Include admin posts router

### Step 7: Write Tests (1.5h)

1. Create `tests/test_posts.py`:
   - Test post creation
   - Test post listing with filters
   - Test post update by owner
   - Test post update by non-owner (should fail)
   - Test comment creation
   - Test comment deletion
   - Test admin hide/unhide
   - Test sport types list

## Todo List

- [ ] Create post Pydantic schemas
- [ ] Create comment Pydantic schemas
- [ ] Implement post creation service
- [ ] Implement post listing with filters
- [ ] Implement post update/delete
- [ ] Implement comment CRUD
- [ ] Implement admin moderation
- [ ] Create public post endpoints
- [ ] Create user post endpoints
- [ ] Create admin post endpoints
- [ ] Add sport types enum
- [ ] Implement report system
- [ ] Write post tests

## Success Criteria

1. **Create Post**: Users can create posts with all fields
2. **List Posts**: Feed returns paginated posts
3. **Filters**: Sport type, district, type filters work
4. **Comments**: Users can comment on posts
5. **Moderation**: Admin can hide posts
6. **Ownership**: Non-owners cannot edit/delete
7. **Tests**: All post tests pass

## Test Scenarios

### Post Creation
```bash
# Test 1: Create recruiting post
POST /api/v1/posts
Authorization: Bearer <user_token>
{
  "title": "Tuyen doi bong da",
  "content": "Can them 2 nguoi choi san 5",
  "post_type": "RECRUITING",
  "sport_type": "Football",
  "venue_id": "{uuid}",
  "event_date": "2026-04-10",
  "event_time": "18:00",
  "player_count_needed": 2
}
# Expected: 201 Created

# Test 2: Create social post
POST /api/v1/posts
{
  "post_type": "SOCIAL",
  "title": "Ai choi cau long tai Ha Dong khong?",
  "content": "Tim doi choi cau long cuoi tuan",
  "sport_type": "Badminton",
  "district": "Ha Dong"
}
# Expected: 201 Created

# Test 3: List all posts
GET /api/v1/posts?page=1&limit=20
# Expected: 200 OK, paginated posts

# Test 4: Filter by sport
GET /api/v1/posts?sport_type=Football
# Expected: 200 OK, only football posts

# Test 5: Filter by district
GET /api/v1/posts?district=Hai+Ba+Trung
# Expected: 200 OK, only posts in district
```

### Comments
```bash
# Test 6: Add comment
POST /api/v1/posts/{id}/comments
Authorization: Bearer <user_token>
{
  "content": "Minh tham gia duoc khong?"
}
# Expected: 201 Created

# Test 7: Get comments
GET /api/v1/posts/{id}/comments
# Expected: 200 OK, list of comments

# Test 8: Delete own comment
DELETE /api/v1/posts/{id}/comments/{comment_id}
Authorization: Bearer <user_token>
# Expected: 200 OK

# Test 9: Delete other's comment (should fail)
DELETE /api/v1/posts/{id}/comments/{other_comment_id}
Authorization: Bearer <user_token>
# Expected: 403 Forbidden
```

### Moderation
```bash
# Test 10: Admin hide post
POST /api/v1/admin/posts/{id}/hide
Authorization: Bearer <admin_token>
{
  "reason": "Inappropriate content"
}
# Expected: 200 OK, post.status=HIDDEN

# Test 11: Hidden post not in feed
GET /api/v1/posts
# Expected: 200 OK, hidden posts excluded

# Test 12: User accessing admin endpoint
POST /api/v1/admin/posts/{id}/hide
Authorization: Bearer <user_token>
# Expected: 403 Forbidden
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Spam posts | Medium | Rate limiting, report system |
| Inappropriate content | High | Admin moderation, report flow |
| Orphaned comments | Low | Cascade delete or soft delete |
| Venue link errors | Low | Validate venue exists |

## Security Considerations

1. **Content Moderation**: Implement profanity filter (optional)
2. **XSS Prevention**: Sanitize HTML in post content
3. **Rate Limiting**: Prevent post/comment spam
4. **Ownership Check**: Always verify ownership for updates/deletes

## Next Steps

1. Sprint 8: Merchant dashboard
2. Sprint 12: Frontend newsfeed

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Blocks: Sprint 12 (RN Merchant Features)

## Sport Types (Enum)

```python
SPORT_TYPES = [
    "Football",      # Bong da
    "Tennis",        # Quan vot
    "Badminton",     # Cau long
    "Basketball",    # Bong ro
    "Volleyball",    # Bong chuy
    "Table Tennis",  # Bong ban
    "Swimming",      # Boi loi
    "Futsal",        # Futsal
]
```
