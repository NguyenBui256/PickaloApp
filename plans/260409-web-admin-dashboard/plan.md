---
title: "Web-Based Admin Dashboard - ReactJS"
description: "Modern ReactJS web admin dashboard for PickAlo platform management"
status: pending
priority: P1
effort: 32h
branch: main
tags: [admin, dashboard, reactjs, typescript, web]
created: 2026-04-09
---

# Web-Based Admin Dashboard Implementation Plan

## Overview

Comprehensive web-based admin dashboard using ReactJS + TypeScript for the PickAlo sports venue booking platform. This replaces the React Native approach with a modern web interface optimized for desktop/tablet administration.

**Current Status:** Planning Phase
**Estimated Effort:** 32 hours
**Backend APIs:** 100% Complete (17 admin endpoints + 4 analytics endpoints)

---

## Existing Backend API Analysis

### Admin Endpoints (Already Implemented)

**Dashboard & Metrics:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/dashboard` | GET | Platform-wide metrics |
| `/admin/analytics/revenue` | GET | Revenue trends with date filtering |
| `/admin/analytics/bookings` | GET | Booking statistics |
| `/admin/analytics/users` | GET | User growth metrics |
| `/admin/analytics/venues` | GET | Venue performance rankings |

**User Management:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/users` | GET | List users (paginated, filtered) |
| `/admin/users/{id}/ban` | PATCH | Ban user with reason |
| `/admin/users/{id}/unban` | PATCH | Unban user with reason |
| `/admin/users/{id}/role` | PATCH | Change user role |

**Venue Management:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/merchants` | GET | List all merchants |
| `/admin/venues` | GET | List venues (paginated, filtered) |
| `/admin/venues/{id}/verify` | PATCH | Verify/unverify venue |

**Booking Oversight:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/bookings` | GET | List all bookings |
| `/admin/bookings/{id}/cancel` | PATCH | Admin cancel booking |

**Content Moderation:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/posts` | GET | List posts for moderation |
| `/admin/posts/{id}` | DELETE | Delete post |
| `/admin/comments/{id}` | DELETE | Delete comment |

**Audit Logging:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/audit-log` | GET | View admin action history |

### Authentication
- **Login:** `POST /auth/login` → Returns JWT access + refresh tokens
- **Refresh:** `POST /auth/refresh` → Refresh access token
- **Me:** `GET /auth/me` → Get current user profile

---

## Tech Stack Selection

### Core Framework
- **React 19** - Latest React with compiler support
- **TypeScript 5.8** - Type safety
- **Vite 6** - Fast build tool with HMR

### UI Framework Comparison
| Framework | Pros | Cons | Decision |
|-----------|------|-------|----------|
| **shadcn/ui** | Modern, customizable, copy-paste, no runtime deps | Requires setup | ✅ **SELECTED** |
| Material-UI | Complete, enterprise | Heavy bundle, opinionated | ❌ |
| Ant Design | Feature-rich | Large bundle, Chinese-first | ❌ |
| Chakra UI | Simple API | Less customizable | ❌ |

**Why shadcn/ui:**
- Built on Radix UI primitives (accessibility)
- TailwindCSS for styling (flexible, modern)
- Copy-paste components (own the code)
- Excellent TypeScript support
- Smaller bundle (tree-shakeable)

### Data Fetching
- **TanStack Query v5** - Server state management, caching, refetching

### Routing
- **React Router v7** - Latest with data loading support

### Forms
- **React Hook Form** - Performance, validation
- **Zod** - Schema validation

### Charts
- **Recharts** - React-native, composable, SVG-based

### Date Handling
- **date-fns** - Tree-shakeable, modular

### Tables
- **TanStack Table v8** - Headless, powerful

---

## Project Structure

```
web-admin/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── src/
    ├── main.tsx                    # App entry
    ├── App.tsx                     # Root component
    ├── lib/                        # Utilities
    │   ├── api.ts                  # Axios instance
    │   ├── query-client.ts         # TanStack Query setup
    │   ├── query-keys.ts           # Query keys factory
    │   └── utils.ts                # Helper functions
    ├── features/                   # Feature-based modules
    │   ├── auth/                   # Authentication
    │   │   ├── components/
    │   │   │   ├── login-form.tsx
    │   │   │   └── protected-route.tsx
    │   │   ├── hooks/
    │   │   │   └── use-auth.ts
    │   │   └── api/
    │   │       └── auth-api.ts
    │   ├── dashboard/              # Dashboard
    │   │   ├── components/
    │   │   │   ├── metric-card.tsx
    │   │   │   ├── revenue-chart.tsx
    │   │   │   └── booking-stats.tsx
    │   │   └── api/
    │   │       └── dashboard-api.ts
    │   ├── users/                  # User Management
    │   │   ├── components/
    │   │   │   ├── user-table.tsx
    │   │   │   ├── user-filters.tsx
    │   │   │   └── ban-user-dialog.tsx
    │   │   └── api/
    │   │       └── users-api.ts
    │   ├── venues/                 # Venue Management
    │   │   ├── components/
    │   │   │   ├── venue-table.tsx
    │   │   │   └── verify-venue-dialog.tsx
    │   │   └── api/
    │   │       └── venues-api.ts
    │   ├── bookings/               # Booking Oversight
    │   │   ├── components/
    │   │   │   ├── booking-table.tsx
    │   │   │   └── cancel-booking-dialog.tsx
    │   │   └── api/
    │   │       └── bookings-api.ts
    │   ├── content/                # Content Moderation
    │   │   ├── components/
    │   │   │   ├── post-table.tsx
    │   │   │   └── delete-post-dialog.tsx
    │   │   └── api/
    │   │       └── content-api.ts
    │   └── audit/                  # Audit Log
    │       ├── components/
    │       │   └── audit-log-table.tsx
    │       └── api/
    │           └── audit-api.ts
    ├── components/                 # Shared components
    │   ├── ui/                     # shadcn/ui components
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   ├── header.tsx
    │   │   └── main-layout.tsx
    │   └── common/
    │       ├── data-table.tsx
    │       ├── page-header.tsx
    │       └── loading-spinner.tsx
    ├── hooks/                      # Shared hooks
    │   ├── use-api-error.ts
    │   ├── use-debounce.ts
    │   └── use-toast.ts
    ├── types/                      # TypeScript types
    │   ├── api.types.ts
    │   ├── user.types.ts
    │   └── venue.types.ts
    └── routes/                     # Route definitions
        ├── index.tsx
        ├── auth.routes.tsx
        └── protected.routes.tsx
```

---

## Implementation Phases

| Phase | Title | File | Status | Effort | Priority |
|-------|-------|------|--------|--------|----------|
| 1 | Project Setup & Infrastructure | [phase-01-setup-infrastructure.md](./phase-01-setup-infrastructure.md) | Pending | 4h | P1 |
| 2 | Authentication Flow | [phase-02-authentication-flow.md](./phase-02-authentication-flow.md) | Pending | 4h | P1 |
| 3 | Dashboard Screen | [phase-03-dashboard-screen.md](./phase-03-dashboard-screen.md) | Pending | 6h | P1 |
| 4 | User Management | [phase-04-user-management.md](./phase-04-user-management.md) | Pending | 5h | P1 |
| 5 | Venue & Merchant Management | [phase-05-venue-management.md](./phase-05-venue-management.md) | Pending | 4h | P2 |
| 6 | Booking Oversight | [phase-06-booking-oversight.md](./phase-06-booking-oversight.md) | Pending | 4h | P2 |
| 7 | Content Moderation | [phase-07-content-moderation.md](./phase-07-content-moderation.md) | Pending | 3h | P2 |
| 8 | Audit Log Viewer | [phase-08-audit-log-viewer.md](./phase-08-audit-log-viewer.md) | Pending | 2h | P3 |

**Total Estimated Effort:** 32 hours

### Phase 1: Project Setup & Infrastructure (4h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Initialize Vite + React + TypeScript project
2. Configure TailwindCSS
3. Setup shadcn/ui
4. Configure TanStack Query
5. Setup React Router
6. Create base layout structure
7. Configure Axios instance with auth interceptors

**Deliverables:**
- Working development server
- Base layout with sidebar navigation
- Authenticated route wrapper
- API client with token management

---

### Phase 2: Authentication Flow (4h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Login form component
2. Auth API integration
3. Token storage (secure httpOnly cookie or localStorage with XSS protection)
4. Token refresh interceptor
5. Protected route component
6. Logout functionality

**Deliverables:**
- Working login screen
- JWT token management
- Auto-refresh on expiration
- Protected routes redirect to login

---

### Phase 3: Dashboard Screen (6h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. Metric cards (users, venues, bookings, revenue)
2. Revenue trend chart (line chart)
3. Booking statistics (bar chart)
4. User growth metrics
5. Venue performance table
6. Date range picker for analytics
7. Real-time data refresh

**Components:**
- `MetricCard` - Display single metric with trend
- `RevenueChart` - Line chart with Recharts
- `BookingStats` - Bar chart for booking patterns
- `TopVenuesTable` - Table of top performing venues

**Deliverables:**
- Comprehensive dashboard with all metrics
- Interactive charts with tooltips
- Date-filtered analytics
- Responsive layout

---

### Phase 4: User Management (5h)
**Status:** Pending
**Priority:** P1

**Tasks:**
1. User data table with pagination
2. Search by phone, name, email
3. Filter by role, active status
4. Ban/unban dialog with reason input
5. Role change dialog
6. User detail modal

**Components:**
- `UserTable` - TanStack Table with sorting
- `UserFilters` - Search and filter controls
- `BanUserDialog` - Confirmation with reason
- `ChangeRoleDialog` - Role selector

**Deliverables:**
- Full user management interface
- Bulk actions support
- Optimistic updates

---

### Phase 5: Venue & Merchant Management (4h)
**Status:** Pending
**Priority:** P2

**Tasks:**
1. Venue data table with pagination
2. Filter by verification status
3. Search by name, address
4. Verify/unverify dialog
5. Merchant list view
6. Pending verification queue

**Components:**
- `VenueTable` - Venue listing
- `VerifyVenueDialog` - Verification workflow
- `MerchantTable` - Merchant listing

**Deliverables:**
- Complete venue management
- Verification workflow
- Merchant oversight

---

### Phase 6: Booking Oversight (4h)
**Status:** Pending
**Priority:** P2

**Tasks:**
1. Booking data table with pagination
2. Filter by status
3. Search by user, venue
4. Admin cancel dialog
5. Booking detail modal
6. Status badge indicators

**Components:**
- `BookingTable` - Booking listing
- `CancelBookingDialog` - Admin cancel workflow
- `BookingDetailModal` - Full booking information

**Deliverables:**
- Full booking oversight
- Admin cancellation capability
- Detailed booking view

---

### Phase 7: Content Moderation (3h)
**Status:** Pending
**Priority:** P2

**Tasks:**
1. Post listing table
2. Content preview
3. Delete post confirmation
4. Comment moderation
5. Report queue

**Components:**
- `PostTable` - Post listing
- `DeletePostDialog` - Delete confirmation
- `CommentTable` - Comment listing

**Deliverables:**
- Content moderation interface
- Delete actions for posts/comments
- Audit trail for all actions

---

### Phase 8: Audit Log Viewer (2h)
**Status:** Pending
**Priority:** P3

**Tasks:**
1. Audit log table
2. Filter by action type
3. Date range filter
4. Admin filter
5. Export functionality

**Components:**
- `AuditLogTable` - Audit log listing
- `AuditFilters` - Filter controls

**Deliverables:**
- Complete audit log viewer
- Filtered history
- Export to CSV

---

## Component Specifications

### MetricCard Component
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;  // Percentage change
  period?: string;
  icon?: ReactNode;
  loading?: boolean;
}
```

### DataTable Component (Reusable)
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}
```

### BanUserDialog Component
```typescript
interface BanUserDialogProps {
  user: UserListItem;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

---

## Security Considerations

### XSS Protection
1. **CSP Headers:** Configure Content-Security-Policy
2. **Input Sanitization:** DOMPurify for user-generated content
3. **React Defaults:** JSX auto-escapes by default

### CSRF Protection
1. **SameSite Cookies:** Configure cookie settings
2. **CSRF Tokens:** Implement if using cookie-based auth

### Token Storage
**Option A: httpOnly Secure Cookies (Recommended)**
- Server sets httpOnly cookie
- Automatic CSRF protection
- XSS safe

**Option B: localStorage with Mitigations**
- Short-lived access tokens (15 min)
- Refresh token rotation
- Implement CSP

### API Security
1. **Rate Limiting:** Implement on admin endpoints
2. **Request Signing:** Consider for sensitive operations
3. **Audit Logging:** All actions logged server-side

---

## Error Handling Strategy

### API Error Handling
```typescript
// api.ts - Axios interceptors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - trigger refresh
      return refreshAndRetry(error);
    }
    if (error.response?.status === 403) {
      // Forbidden - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### User-Facing Errors
- Network errors: "Connection error. Please check your internet."
- 404: "Resource not found."
- 500: "Server error. Please try again later."
- 401: Redirect to login

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./features/dashboard'));
const Users = lazy(() => import('./features/users'));
```

### Data Caching (TanStack Query)
```typescript
// Configure stale time
queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000,  // 10 minutes
    },
  },
});
```

### Virtual Scrolling
- Use for long lists (audit log, user lists)
- `react-virtuoso` or `@tanstack/react-virtual`

---

## Testing Strategy

### Unit Tests (Vitest)
- Components: @testing-library/react
- Hooks: @testing-library/react-hooks
- Utilities: Vitest

### Integration Tests
- API mocking: MSW (Mock Service Worker)
- User flows: Login → Navigate → Perform Action

### E2E Tests (Playwright)
- Critical admin flows
- Cross-browser testing

---

## Deployment

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'charts': ['recharts'],
        },
      },
    },
  },
});
```

### Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=PickAlo Admin
VITE_VERSION=1.0.0
```

---

## Success Criteria

- [ ] Login/logout working with JWT
- [ ] Dashboard displays all 8 metric cards
- [ ] Revenue chart renders with date filtering
- [ ] User table with pagination, search, filters
- [ ] Ban/unban functionality with audit logging
- [ ] Role change functionality
- [ ] Venue verification workflow
- [ ] Booking oversight with admin cancel
- [ ] Content moderation (delete posts/comments)
- [ ] Audit log viewer with filters
- [ ] Responsive design (desktop/tablet)
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] 80%+ test coverage
- [ ] Bundle size < 500KB (gzipped)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| XSS attacks | HIGH | CSP headers, input sanitization |
| Token theft | HIGH | httpOnly cookies, short expiration |
| Performance on large datasets | MEDIUM | Pagination, virtual scrolling |
| Browser compatibility | LOW | Modern browsers only (Chrome, Edge, Firefox) |
| State synchronization | MEDIUM | TanStack Query refetch on focus |

---

## Dependencies

### Required
- ✅ Backend admin APIs (17 endpoints)
- ✅ Backend analytics APIs (4 endpoints)
- ✅ Authentication endpoints

### External Packages
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "recharts": "^2.0.0",
    "date-fns": "^3.0.0",
    "axios": "^1.7.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0",
    "typescript": "^5.8.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "playwright": "^1.40.0"
  }
}
```

---

## Next Steps

1. **Phase 1:** Initialize Vite project and setup infrastructure
2. **Phase 2:** Implement authentication flow
3. **Phase 3:** Build dashboard screen
4. **Phase 4-8:** Implement management screens
5. **Testing:** Comprehensive test coverage
6. **Deployment:** Build and deploy

---

## Related Files

### To Create
- `web-admin/` - New web admin directory
- `web-admin/src/` - Source code
- `web-admin/package.json` - Dependencies

### To Modify
- `docker-compose.yml` - Add web-admin service
- `.gitignore` - Add web-admin exclusions

### Backend (No Changes Needed)
- All admin APIs already implemented
- Analytics endpoints complete
