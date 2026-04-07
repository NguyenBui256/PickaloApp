---
title: "Sprint 9: Admin Dashboard APIs"
description: "Platform administration, user management, content moderation, and system analytics"
status: pending
priority: P1
effort: 8h
tags: [admin, dashboard, moderation, analytics]
created: 2026-04-06
---

# Sprint 9: Admin Dashboard APIs

## Overview

Implement admin dashboard for platform-wide management including user moderation, content control, venue verification, and system analytics.

**Priority:** P1 (High - essential for platform governance)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.5: Admin features)
- Sprint 2: `./sprint-02-authentication.md` (Admin role)
- Previous sprints: All entity management

## Key Insights

1. **Platform Level**: Admin sees all users, venues, bookings, posts
2. **Moderation Actions**: Ban users, hide posts, verify venues
3. **Audit Trail**: All admin actions logged
4. **System Health**: Platform-wide metrics

## Requirements

### Functional Requirements

1. **Platform Stats**: Total users, venues, bookings, revenue
2. **User Management**: View, ban/unban, verify users
3. **Venue Verification**: Approve/reject new venues
4. **Content Moderation**: Hide/remove posts, comments
5. **Booking Management**: View all bookings, resolve disputes
6. **Admin Actions Log**: Audit trail of admin actions
7. **Reports**: View user-reported content
8. **System Health**: Active users, recent activity

### Non-Functional Requirements

1. **Performance**: Dashboard loads < 2s
2. **Audit**: Every admin action logged
3. **Security**: Strict access control (ADMIN only)

## Architecture

### API Endpoints

```
ADMIN DASHBOARD ENDPOINTS
├── GET  /api/v1/admin/dashboard                 # Platform overview
├── GET  /api/v1/admin/stats                     # Platform statistics
├── GET  /api/v1/admin/users                     # List all users
├── GET  /api/v1/admin/users/:id                 # User details
├── POST /api/v1/admin/users/:id/ban             # Ban user
├── POST /api/v1/admin/users/:id/unban           # Unban user
├── GET  /api/v1/admin/venues/pending            # Pending venues
├── POST /api/v1/admin/venues/:id/verify         # Verify venue
├── POST /api/v1/admin/venues/:id/reject         # Reject venue
├── DELETE /api/v1/admin/venues/:id              # Delete venue
├── GET  /api/v1/admin/posts/reported            # Reported posts
├── POST /api/v1/admin/posts/:id/hide            # Hide post
├── DELETE /api/v1/admin/posts/:id               # Delete post
├── GET  /api/v1/admin/bookings                  # All bookings
├── GET  /api/v1/admin/bookings/:id              # Booking details
├── GET  /api/v1/admin/analytics                 # Platform analytics
├── GET  /api/v1/admin/actions/log               # Admin action log
└── GET  /api/v1/admin/reports                   # All reports
```

### Platform Stats Model

```python
{
    "platform": {
        "total_users": 5420,
        "total_merchants": 125,
        "total_venues": 180,
        "total_bookings": 8450,
        "total_revenue": 1250000000,  # Platform revenue (commission)
        "active_today": {
            "users": 320,
            "bookings": 85
        }
    },
    "recent": {
        "new_users_today": 15,
        "new_venues_pending": 5,
        "reported_posts": 3
    },
    "growth": {
        "users_growth": 0.12,  # 12% this month
        "revenue_growth": 0.18
    }
}
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/admin.py` | Admin dashboard schemas |
| `backend/app/services/admin.py` | Admin business logic |
| `backend/app/api/v1/admin/dashboard.py` | Admin endpoints |
| `backend/tests/test_admin.py` | Admin tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/admin.py` | Add helper methods |
| `backend/app/api/v1/api.py` | Register admin router |

## Implementation Steps

### Step 1: Create Admin Schemas (1h)

1. Create `backend/app/schemas/admin.py`:

**Schemas:**
- `PlatformStats`: platform totals, recent activity, growth
- `AdminUserListItem`: id, name, role, status, created_at
- `AdminUserDetails`: Full user with related data
- `BanUserRequest`: reason, duration
- `PendingVenueListItem`: venue with merchant info
- `ReportedPostListItem`: post with report count
- `PlatformAnalytics`: user trends, venue trends, booking trends
- `AdminActionLogItem`: admin, action, target, timestamp

### Step 2: Create Admin Service (2.5h)

1. Create `backend/app/services/admin.py`:

**Functions:**
- `get_platform_stats()`: Aggregate platform metrics
- `get_platform_analytics(date_range)`: Trends over time
- `list_users(filters, pagination)`: All users with filters
- `ban_user(user_id, admin_id, reason, duration)`: Ban user
- `unban_user(user_id, admin_id)`: Remove ban
- `get_pending_venues()`: Unverified venues
- `verify_venue(venue_id, admin_id)`: Approve venue
- `reject_venue(venue_id, admin_id, reason)`: Reject venue
- `get_reported_posts()`: Posts with reports
- `hide_post(post_id, admin_id, reason)`: Hide post
- `delete_post(post_id, admin_id)`: Delete post
- `get_all_bookings(filters, pagination)`: All bookings
- `get_admin_actions_log(pagination)`: Audit trail
- `resolve_report(report_id, admin_id, action)`: Handle report
- `get_disputed_bookings()`: Bookings with disputes

**Ban Logic:**
```python
def ban_user(user_id, admin_id, reason, duration_days=None):
    user = db.query(User).get(user_id)
    user.is_active = False
    user.banned_at = datetime.utcnow()
    user.ban_reason = reason

    if duration_days:
        user.ban_until = datetime.utcnow() + timedelta(days=duration_days)

    # Log action
    log_admin_action(
        admin_id=admin_id,
        action_type="BAN_USER",
        target_type="USER",
        target_id=user_id,
        reason=reason
    )

    return user
```

### Step 3: Create Admin Dashboard Endpoints (3h)

1. Create `backend/app/api/v1/admin/dashboard.py`:

**GET /api/v1/admin/dashboard**
- Auth: Required (ADMIN)
- Return: Complete platform overview

**GET /api/v1/admin/stats**
- Auth: Required (ADMIN)
- Query params: period (today, week, month)
- Return: Platform statistics

**GET /api/v1/admin/users**
- Auth: Required (ADMIN)
- Query params: role, status, search, page, limit
- Return: Paginated user list

**GET /api/v1/admin/users/:id**
- Auth: Required (ADMIN)
- Return: Full user details with activity

**POST /api/v1/admin/users/:id/ban**
- Auth: Required (ADMIN)
- Input: reason, duration_days
- Return: Updated user

**POST /api/v1/admin/users/:id/unban**
- Auth: Required (ADMIN)
- Return: Updated user

**GET /api/v1/admin/venues/pending**
- Auth: Required (ADMIN)
- Return: Unverified venues queue

**POST /api/v1/admin/venues/:id/verify**
- Auth: Required (ADMIN)
- Return: Verified venue

**POST /api/v1/admin/venues/:id/reject**
- Auth: Required (ADMIN)
- Input: reason
- Return: Rejected venue

**DELETE /api/v1/admin/venues/:id**
- Auth: Required (ADMIN)
- Input: reason
- Return: Success

**GET /api/v1/admin/posts/reported**
- Auth: Required (ADMIN)
- Return: Reported posts sorted by report count

**POST /api/v1/admin/posts/:id/hide**
- Auth: Required (ADMIN)
- Input: reason
- Return: Hidden post

**DELETE /api/v1/admin/posts/:id**
- Auth: Required (ADMIN)
- Input: reason
- Return: Success

**GET /api/v1/admin/bookings**
- Auth: Required (ADMIN)
- Query params: status, date_from, date_to, venue_id, user_id
- Return: All bookings with filters

**GET /api/v1/admin/analytics**
- Auth: Required (ADMIN)
- Query params: date_from, date_to, metric
- Return: Platform analytics

**GET /api/v1/admin/actions/log**
- Auth: Required (ADMIN)
- Query params: admin_id, action_type, page, limit
- Return: Admin action log

**GET /api/v1/admin/reports**
- Auth: Required (ADMIN)
- Query params: status, type
- Return: All user reports

**POST /api/v1/admin/reports/:id/resolve**
- Auth: Required (ADMIN)
- Input: action_taken
- Return: Resolved report

### Step 4: Update Admin Action Model (30m)

1. Update `backend/app/models/admin.py`:
   - Ensure AdminAction model has all fields
   - Add convenience methods

### Step 5: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include admin dashboard router

### Step 6: Write Tests (1.5h)

1. Create `tests/test_admin.py`:
   - Test platform stats calculation
   - Test user ban/unban
   - Test venue verification
   - Test post moderation
   - Test admin action logging
   - Test access control (non-admin rejected)

## Todo List

- [ ] Create admin dashboard Pydantic schemas
- [ ] Implement platform stats calculation
- [ ] Implement user management service
- [ ] Implement venue verification service
- [ ] Implement post moderation service
- [ ] Create admin dashboard endpoints
- [ ] Create user management endpoints
- [ ] Create venue moderation endpoints
- [ ] Create post moderation endpoints
- [ ] Create admin action log endpoint
- [ ] Ensure all admin actions are logged
- [ ] Write admin tests

## Success Criteria

1. **Dashboard**: Platform stats load correctly
2. **User Management**: Can ban/unban users
3. **Venue Verification**: Can approve/reject venues
4. **Post Moderation**: Can hide/delete posts
5. **Audit Trail**: All admin actions logged
6. **Access Control**: Non-admins blocked
7. **Tests**: All admin tests pass

## Test Scenarios

### Platform Stats
```bash
# Test 1: Get platform overview
GET /api/v1/admin/dashboard
Authorization: Bearer <admin_token>
# Expected: 200 OK, complete platform data

# Test 2: Get platform stats
GET /api/v1/admin/stats?period=month
# Expected: 200 OK, monthly stats

# Test 3: Get analytics
GET /api/v1/admin/analytics?date_from=2026-04-01&date_to=2026-04-07
# Expected: 200 OK, trends data
```

### User Management
```bash
# Test 4: List all users
GET /api/v1/admin/users?role=USER&page=1&limit=20
# Expected: 200 OK, user list

# Test 5: Ban user
POST /api/v1/admin/users/{id}/ban
Authorization: Bearer <admin_token>
{
  "reason": "Spamming",
  "duration_days": 7
}
# Expected: 200 OK, user.is_active=false

# Test 6: Ban user (cannot login)
POST /api/v1/auth/login
{ "phone": "+84901234567", "password": "password" }
# Expected: 401 Unauthorized, account banned

# Test 7: Unban user
POST /api/v1/admin/users/{id}/unban
# Expected: 200 OK, user.is_active=true
```

### Venue Moderation
```bash
# Test 8: Get pending venues
GET /api/v1/admin/venues/pending
# Expected: 200 OK, unverified venues

# Test 9: Verify venue
POST /api/v1/admin/venues/{id}/verify
# Expected: 200 OK, venue.is_verified=true

# Test 10: Reject venue
POST /api/v1/admin/venues/{id}/reject
{
  "reason": "Fake location"
}
# Expected: 200 OK, venue.is_active=false
```

### Post Moderation
```bash
# Test 11: Get reported posts
GET /api/v1/admin/posts/reported
# Expected: 200 OK, posts sorted by reports

# Test 12: Hide post
POST /api/v1/admin/posts/{id}/hide
{
  "reason": "Inappropriate content"
}
# Expected: 200 OK, post.status=HIDDEN

# Test 13: Delete post
DELETE /api/v1/admin/posts/{id}
{
  "reason": "Spam"
}
# Expected: 200 OK, post deleted
```

### Access Control
```bash
# Test 14: User accessing admin endpoint
GET /api/v1/admin/dashboard
Authorization: Bearer <user_token>
# Expected: 403 Forbidden

# Test 15: Merchant accessing admin endpoint
GET /api/v1/admin/users
Authorization: Bearer <merchant_token>
# Expected: 403 Forbidden
```

### Admin Action Log
```bash
# Test 16: Get action log
GET /api/v1/admin/actions/log
# Expected: 200 OK, list of admin actions

# Test 17: Filter by action type
GET /api/v1/admin/actions/log?action_type=BAN_USER
# Expected: 200 OK, only ban actions
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Admin account compromise | Critical | MFA for admin accounts |
| Accidental bans | Medium | Clear confirmation UI |
| Missing audit logs | High | Mandatory logging |
| Bulk actions needed | Low | Future enhancement |

## Security Considerations

1. **MFA**: Multi-factor authentication for admin accounts
2. **Audit Trail**: Every admin action must be logged
3. **Session Timeout**: Shorter timeout for admin sessions
4. **IP Whitelist**: Optional: restrict admin access by IP
5. **Action Confirmation**: Require confirmation for destructive actions

## Next Steps

1. Sprint 10: React Native core setup
2. Sprint 13: Frontend admin dashboard

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Requires: All previous sprints (for entities)
- Blocks: Sprint 13 (RN Admin Features)

## Admin Action Types

```python
ADMIN_ACTIONS = [
    "BAN_USER",           # Ban/unban user
    "VERIFY_VENUE",       # Verify venue
    "REJECT_VENUE",       # Reject venue
    "DELETE_VENUE",       # Delete venue
    "HIDE_POST",          # Hide post
    "DELETE_POST",        # Delete post
    "DELETE_COMMENT",     # Delete comment
    "RESOLVE_REPORT",     # Resolve user report
    "RESET_PASSWORD",     # Reset user password
    "VIEW_SENSITIVE",     # Access sensitive data (logged)
]
```
