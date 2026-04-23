---
title: "Admin Dashboard & Management System"
description: "Comprehensive admin management and dashboard page for PickAlo sports venue booking platform"
status: pending
priority: P1
effort: 28h
branch: main
tags: [admin, dashboard, backend, react-native]
created: 2026-04-09
---

# Admin Dashboard & Management System

## Overview

This plan covers the implementation of a comprehensive admin dashboard and management system for the PickAlo sports venue booking platform. The admin persona requires full platform oversight capabilities including user management, merchant verification, booking oversight, content moderation, and system analytics.

**Current Status:** Planning Phase
**Estimated Effort:** 28 hours
**Dependencies:** Sprint 2 (Auth), Sprint 3 (Venues), Sprint 4 (Bookings)

---

## Existing Infrastructure Analysis

### Available Backend Models
- `User` with `UserRole` (USER, MERCHANT, ADMIN)
- `Venue` with `is_verified` flag
- `Booking` with full state tracking
- `Post` and `Comment` for community content
- `AdminAction` for audit logging

### Existing Dependencies
- `get_admin()` - Admin verification dependency
- `get_current_user()` - Authenticated user dependency
- `require_role()` - Role-based access control
- `verify_venue_ownership()` - Venue ownership check

### Available APIs
- Authentication endpoints (`/auth/*`)
- Venue management (`/venues/*`)
- User bookings (`/bookings/*`)
- Merchant bookings (`/merchant/bookings/*`)
- Map search (`/map/*`)

---

## Phase Breakdown

### Phase 1: Backend - Admin Dashboard APIs (8h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Create admin schemas (`backend/app/schemas/admin.py`)
2. Create admin service (`backend/app/services/admin.py`)
3. Create admin endpoints (`backend/app/api/v1/endpoints/admin.py`)
4. Register admin router (`backend/app/api/v1/api.py`)

**Endpoints to implement:**
- `GET /admin/dashboard` - Platform metrics and statistics
- `GET /admin/users` - List users with filters
- `PATCH /admin/users/{id}/ban` - Ban/unban users
- `PATCH /admin/users/{id}/role` - Change user roles
- `GET /admin/merchants` - List merchants with verification status
- `PATCH /admin/merchants/{id}/verify` - Verify/unverify merchants
- `GET /admin/bookings` - View all platform bookings
- `PATCH /admin/bookings/{id}/cancel` - Admin cancel booking
- `GET /admin/posts` - View and moderate content
- `DELETE /admin/posts/{id}` - Delete posts
- `DELETE /admin/comments/{id}` - Delete comments
- `GET /admin/audit-log` - View admin action history

---

### Phase 2: Backend - Analytics & Reporting (6h)
**Status:** Pending
**Priority:** P2

**Tasks:**
1. Create analytics service
2. Implement time-series aggregations
3. Add export functionality

**Analytics endpoints:**
- `GET /admin/analytics/revenue` - Revenue trends
- `GET /admin/analytics/bookings` - Booking statistics
- `GET /admin/analytics/users` - User growth metrics
- `GET /admin/analytics/venues` - Venue performance

---

### Phase 3: React Native - Admin Navigation Structure (4h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Create admin navigator
2. Create admin screen layout structure
3. Implement tab navigation (Dashboard, Users, Merchants, Bookings, Content)
4. Add admin route protection

**Files:**
- `frontend/src/navigators/admin-navigator.tsx`
- `frontend/src/screens/admin/admin-dashboard-screen.tsx`
- `frontend/src/screens/admin/admin-users-screen.tsx`
- `frontend/src/screens/admin/admin-merchants-screen.tsx`
- `frontend/src/screens/admin/admin-bookings-screen.tsx`
- `frontend/src/screens/admin/admin-content-screen.tsx`

---

### Phase 4: React Native - Dashboard UI Components (5h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Create metric cards component
2. Create charts for analytics
3. Create data tables with pagination
4. Create filter and search components

**Components:**
- `frontend/src/components/admin/admin-metric-card.tsx`
- `frontend/src/components/admin/admin-chart.tsx`
- `frontend/src/components/admin/admin-table.tsx`
- `frontend/src/components/admin/admin-filter-bar.tsx`
- `frontend/src/components/admin/admin-user-item.tsx`
- `frontend/src/components/admin/admin-booking-item.tsx`

---

### Phase 5: React Native - Management Screens (5h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. User management screen (ban/unban, role change)
2. Merchant verification screen
3. Booking oversight screen
4. Content moderation screen

**Implementation:**
- User list with search and filters
- User detail modal with actions
- Merchant list with verification queue
- Venue verification flow
- Booking list with admin actions
- Post/comment moderation

---

## API Specifications

### Dashboard Metrics Response
```python
{
    "users": {
        "total": 1250,
        "active": 980,
        "new_this_week": 45,
        "by_role": {"USER": 1000, "MERCHANT": 200, "ADMIN": 50}
    },
    "venues": {
        "total": 85,
        "verified": 72,
        "pending_verification": 13
    },
    "bookings": {
        "total": 3420,
        "pending": 125,
        "confirmed": 2800,
        "cancelled": 495,
        "revenue": {"vnd": 125000000}
    },
    "content": {
        "posts": 450,
        "comments": 1200,
        "reported": 23
    }
}
```

### User List Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `role`: Filter by role (USER, MERCHANT, ADMIN)
- `is_active`: Filter by active status
- `is_verified`: Filter by verification status
- `search`: Search by phone, name, email

---

## Security Considerations

### Authorization
- All admin endpoints require `UserRole.ADMIN`
- Double-check admin status on sensitive operations
- Audit log all admin actions

### Rate Limiting
- Implement stricter rate limits on admin endpoints
- Prevent bulk operations abuse

### Data Protection
- Sanitize user data in responses
- No password hashes in any response
- Mask partial phone numbers in logs

---

## Testing Requirements

### Backend Tests
- Admin endpoint access control (10 tests)
- Dashboard metrics calculation (5 tests)
- User ban/unban operations (5 tests)
- Merchant verification (5 tests)
- Audit logging (5 tests)

### Frontend Tests
- Admin navigation (3 tests)
- Dashboard rendering (5 tests)
- User management actions (5 tests)
- Merchant verification flow (5 tests)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Admin account compromise | HIGH | MFA for admin accounts, audit logging |
| Bulk operation abuse | MEDIUM | Rate limiting, confirmation dialogs |
| Performance on large datasets | MEDIUM | Pagination, indexing, caching |
| Privilege escalation | HIGH | Role checks on all operations, audit |

---

## Dependencies

### Completed
- Sprint 2: Authentication & Authorization
- Sprint 3: Venue Management APIs
- Sprint 4: Booking & Pricing Engine
- AdminAction model for audit logging

### Required
- None (all dependencies complete)

---

## Success Criteria

- [ ] All admin API endpoints implemented and tested
- [ ] Dashboard displays accurate real-time metrics
- [ ] User management (ban/unban, role changes) functional
- [ ] Merchant verification workflow complete
- [ ] Booking oversight with admin cancel capability
- [ ] Content moderation (post/comment deletion)
- [ ] Audit log tracking all admin actions
- [ ] React Native admin screens functional
- [ ] 80%+ test coverage on admin endpoints
- [ ] Security review passed

---

## Next Steps

1. Begin Phase 1: Backend Admin Dashboard APIs
2. Create admin schemas and service layer
3. Implement dashboard metrics aggregation
4. Create admin endpoint routes
5. Write comprehensive tests
6. Proceed to Phase 3: React Native screens

---

## Related Files

### Backend (to create)
- `backend/app/schemas/admin.py` - Admin request/response schemas
- `backend/app/services/admin.py` - Admin business logic
- `backend/app/api/v1/endpoints/admin.py` - Admin API routes
- `backend/tests/test_admin.py` - Admin endpoint tests

### Frontend (to create)
- `frontend/src/navigators/admin-navigator.tsx`
- `frontend/src/screens/admin/*.tsx` - Admin screens
- `frontend/src/components/admin/*.tsx` - Admin components
- `frontend/src/services/api/admin.ts` - Admin API client

### Backend (to modify)
- `backend/app/api/v1/api.py` - Register admin router

