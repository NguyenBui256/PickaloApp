---
title: "Sprint 8: Merchant Dashboard APIs"
description: "Business analytics, booking management, revenue tracking, and venue control for merchants"
status: pending
priority: P1
effort: 12h
tags: [merchant, dashboard, analytics, revenue]
created: 2026-04-06
---

# Sprint 8: Merchant Dashboard APIs

## Overview

Implement merchant-facing dashboard features including business analytics, booking management, revenue tracking, and venue control.

**Priority:** P1 (High - essential for merchant operations)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.3: Merchant features)
- Sprint 3: `./sprint-03-venue-management.md` (Venue APIs)
- Sprint 4: `./sprint-04-booking-pricing.md` (Booking APIs)

## Key Insights

1. **Multi-Venue**: Merchants can own multiple venues
2. **Dashboard Views**: Today, Week, Month, Custom range
3. **Revenue Tracking**: By venue, date range, service type
4. **Booking Management**: Quick approve/reject actions
5. **Maintenance Mode**: Mark venue as unavailable

## Requirements

### Functional Requirements

1. **Dashboard Stats**: Today's revenue, bookings, occupancy
2. **Revenue Analytics**: Charts/trends over time
3. **Booking Queue**: Pending bookings requiring action
4. **Venue Management**: Quick status updates
5. **Service Management**: Enable/disable services
6. **Maintenance Mode**: Temporarily close venue
7. **Booking History**: Filtered list of all bookings
8. **Export**: Download booking/revenue data (CSV)

### Non-Functional Requirements

1. **Performance**: Dashboard loads < 2s
2. **Real-time**: Optional WebSocket for live updates
3. **Data Accuracy**: Revenue calculations must be precise

## Architecture

### API Endpoints

```
MERCHANT DASHBOARD ENDPOINTS
├── GET  /api/v1/merchant/dashboard             # Dashboard overview
├── GET  /api/v1/merchant/dashboard/stats       # Key metrics
├── GET  /api/v1/merchant/dashboard/revenue     # Revenue analytics
├── GET  /api/v1/merchant/dashboard/bookings    # Booking stats
├── GET  /api/v1/merchant/venues                # My venues
├── POST /api/v1/merchant/venues/:id/maintenance# Toggle maintenance
├── GET  /api/v1/merchant/bookings/pending      # Pending bookings
├── GET  /api/v1/merchant/bookings/upcoming     # Upcoming bookings
├── GET  /api/v1/merchant/revenue               # Revenue breakdown
├── GET  /api/v1/merchant/revenue/export        # Export CSV
└── GET  /api/v1/merchant/analytics/occupancy   # Occupancy rates
```

### Dashboard Stats Model

```python
{
    "today": {
        "revenue": 4500000,      # Today's revenue
        "bookings": 15,          # Total bookings
        "confirmed": 12,         # Confirmed bookings
        "pending": 3,            # Pending approval
        "completed": 8,          # Completed today
        "cancelled": 1           # Cancelled today
    },
    "week": {
        "revenue": 28000000,
        "bookings": 95,
        "occupancy_rate": 0.75   # 75% occupancy
    },
    "month": {
        "revenue": 120000000,
        "bookings": 420,
        "occupancy_rate": 0.68
    }
}
```

### Revenue Analytics

```python
{
    "by_venue": [
        {"venue_id": "...", "venue_name": "San A", "revenue": 5000000},
        {"venue_id": "...", "venue_name": "San B", "revenue": 3000000}
    ],
    "by_date": [
        {"date": "2026-04-01", "revenue": 4500000},
        {"date": "2026-04-02", "revenue": 5200000}
    ],
    "by_service": [
        {"service_name": "Nước uống", "revenue": 500000},
        {"service_name": "Thuê áo", "revenue": 300000}
    ],
    "trends": {
        "daily_avg": 4500000,
        "growth_rate": 0.15,  # 15% growth
        "peak_hours": ["18:00", "19:00", "20:00"]
    }
}
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/merchant.py` | Merchant dashboard schemas |
| `backend/app/services/analytics.py` | Analytics calculation logic |
| `backend/app/services/merchant.py` | Merchant business logic |
| `backend/app/api/v1/merchant-dashboard.py` | Dashboard endpoints |
| `backend/tests/test_merchant_dashboard.py` | Dashboard tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/venue.py` | Add maintenance_mode flag |
| `backend/app/api/v1/api.py` | Register dashboard router |

## Implementation Steps

### Step 1: Create Merchant Schemas (1.5h)

1. Create `backend/app/schemas/merchant.py`:

**Schemas:**
- `DashboardStats`: today, week, month metrics
- `RevenueAnalytics`: by_venue, by_date, by_service, trends
- `BookingQueueItem`: booking with venue info
- `OccupancyRate`: venue_id, date, rate, slots
- `MaintenanceModeRequest`: is_maintenance, reason
- `RevenueExportRequest`: date_from, date_to, venue_id
- `MerchantVenueListItem`: id, name, status, today_bookings

### Step 2: Create Analytics Service (3h)

1. Create `backend/app/services/analytics.py`:

**Functions:**
- `calculate_dashboard_stats(merchant_id)`: Get today/week/month stats
- `calculate_revenue(merchant_id, date_from, date_to)`: Total revenue
- `revenue_by_venue(merchant_id, date_range)`: Breakdown by venue
- `revenue_by_date(merchant_id, date_range)`: Daily revenue
- `revenue_by_service(merchant_id, date_range)`: Service revenue
- `calculate_occupancy(venue_id, date)`: Occupancy rate
- `get_peak_hours(merchant_id, date_range)`: Busiest hours
- `calculate_growth_rate(current, previous)`: Growth percentage

**Occupancy Calculation:**
```python
def calculate_occupancy(venue_id, date):
    # Total bookable slots (operating hours / slot duration)
    operating_hours = get_operating_hours(venue_id)
    total_slots = (operating_hours.close - operating_hours.open) * 60 / 60  # 1h slots

    # Booked slots
    booked_slots = db.query(Booking).filter(
        Booking.venue_id == venue_id,
        Booking.booking_date == date,
        Booking.status.in_(['CONFIRMED', 'COMPLETED'])
    ).count()

    return booked_slots / total_slots if total_slots > 0 else 0
```

### Step 3: Create Merchant Service (2h)

1. Create `backend/app/services/merchant.py`:

**Functions:**
- `get_merchant_venues(merchant_id)`: List all venues
- `set_maintenance_mode(venue_id, is_maintenance, reason)`: Toggle
- `get_pending_bookings(merchant_id)`: Queue for approval
- `get_upcoming_bookings(merchant_id, days)`: Next N days
- `export_revenue_csv(merchant_id, date_range)`: Generate CSV
- `get_merchant_profile(merchant_id)`: Merchant info
- `update_merchant_profile(merchant_id, data)`: Update profile

### Step 4: Create Dashboard Endpoints (3h)

1. Create `backend/app/api/v1/merchant-dashboard.py`:

**GET /api/v1/merchant/dashboard**
- Auth: Required (MERCHANT)
- Return: Complete dashboard overview
- Includes: today stats, pending bookings, upcoming, revenue summary

**GET /api/v1/merchant/dashboard/stats**
- Auth: Required
- Query params: period (today, week, month)
- Return: Requested period stats

**GET /api/v1/merchant/dashboard/revenue**
- Auth: Required
- Query params: date_from, date_to, venue_id
- Return: Revenue analytics with breakdowns

**GET /api/v1/merchant/dashboard/bookings**
- Auth: Required
- Query params: date_from, date_to, status
- Return: Booking statistics

**GET /api/v1/merchant/venues**
- Auth: Required
- Return: List of merchant's venues with quick stats

**POST /api/v1/merchant/venues/:id/maintenance**
- Auth: Required
- Input: is_maintenance, reason
- Logic: Toggle maintenance mode, notify users
- Return: Updated venue

**GET /api/v1/merchant/bookings/pending**
- Auth: Required
- Query params: venue_id (optional)
- Return: Pending bookings requiring action

**GET /api/v1/merchant/bookings/upcoming**
- Auth: Required
- Query params: days (default 7)
- Return: Upcoming confirmed bookings

**GET /api/v1/merchant/revenue**
- Auth: Required
- Query params: date_from, date_to, venue_id, group_by
- Return: Revenue data grouped as requested

**GET /api/v1/merchant/revenue/export**
- Auth: Required
- Query params: date_from, date_to, venue_id
- Return: CSV file download

**GET /api/v1/merchant/analytics/occupancy**
- Auth: Required
- Query params: venue_id, date_from, date_to
- Return: Daily occupancy rates

### Step 5: Add Maintenance Mode (30m)

1. Update `backend/app/models/venue.py`:
   - Add `is_maintenance` boolean field
   - Add `maintenance_reason` text field

2. Update booking creation:
   - Reject bookings for venues in maintenance

### Step 6: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include merchant dashboard router

### Step 7: Write Tests (2h)

1. Create `tests/test_merchant_dashboard.py`:
   - Test dashboard stats calculation
   - Test revenue analytics
   - Test occupancy calculation
   - Test maintenance mode toggle
   - Test pending bookings queue
   - Test revenue export CSV

## Todo List

- [ ] Create merchant dashboard Pydantic schemas
- [ ] Implement dashboard stats calculation
- [ ] Implement revenue analytics service
- [ ] Implement occupancy calculation
- [ ] Implement peak hours detection
- [ ] Create dashboard overview endpoint
- [ ] Create revenue analytics endpoint
- [ ] Create pending bookings endpoint
- [ ] Create upcoming bookings endpoint
- [ ] Implement maintenance mode
- [ ] Implement CSV export
- [ ] Add is_maintenance to venue model
- [ ] Write dashboard tests

## Success Criteria

1. **Dashboard**: Loads with all key metrics
2. **Revenue**: Accurate revenue calculations
3. **Occupancy**: Correct occupancy rates
4. **Pending Queue**: Shows bookings needing action
5. **Maintenance**: Toggle works, prevents bookings
6. **Export**: CSV downloads correctly
7. **Tests**: All dashboard tests pass

## Test Scenarios

### Dashboard Stats
```bash
# Test 1: Get dashboard overview
GET /api/v1/merchant/dashboard
Authorization: Bearer <merchant_token>
# Expected: 200 OK, full dashboard data

# Test 2: Get today's stats
GET /api/v1/merchant/dashboard/stats?period=today
# Expected: 200 OK, today's revenue, bookings, occupancy

# Test 3: Get week stats
GET /api/v1/merchant/dashboard/stats?period=week
# Expected: 200 OK, weekly aggregates

# Test 4: Get monthly stats
GET /api/v1/merchant/dashboard/stats?period=month
# Expected: 200 OK, monthly aggregates
```

### Revenue Analytics
```bash
# Test 5: Revenue by venue
GET /api/v1/merchant/dashboard/revenue?date_from=2026-04-01&date_to=2026-04-07
# Expected: 200 OK, breakdown by venue

# Test 6: Revenue by date
GET /api/v1/merchant/revenue?date_from=2026-04-01&date_to=2026-04-07&group_by=date
# Expected: 200 OK, daily revenue

# Test 7: Revenue by service
GET /api/v1/merchant/revenue?group_by=service
# Expected: 200 OK, service breakdown
```

### Bookings
```bash
# Test 8: Get pending bookings
GET /api/v1/merchant/bookings/pending
# Expected: 200 OK, pending booking queue

# Test 9: Get upcoming bookings
GET /api/v1/merchant/bookings/upcoming?days=7
# Expected: 200 OK, next 7 days confirmed bookings
```

### Maintenance Mode
```bash
# Test 10: Enable maintenance
POST /api/v1/merchant/venues/{id}/maintenance
Authorization: Bearer <merchant_token>
{
  "is_maintenance": true,
  "reason": "Bao duong san"
}
# Expected: 200 OK, venue.is_maintenance=true

# Test 11: Cannot book maintenance venue
POST /api/v1/bookings
{
  "venue_id": "{maintenance_venue_id}",
  ...
}
# Expected: 400 Bad Request, venue in maintenance

# Test 12: Disable maintenance
POST /api/v1/merchant/venues/{id}/maintenance
{
  "is_maintenance": false
}
# Expected: 200 OK, venue.is_maintenance=false
```

### Export
```bash
# Test 13: Export revenue CSV
GET /api/v1/merchant/revenue/export?date_from=2026-04-01&date_to=2026-04-07
# Expected: 200 OK, CSV file download
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect revenue calc | High | Comprehensive unit tests |
| Slow dashboard queries | Medium | Database indexes, caching |
| Maintenance mode not checked | Medium | Add validation in booking flow |
| Large export timeout | Low | Stream CSV, add date limit |

## Security Considerations

1. **Ownership**: Merchants can only access their own data
2. **Date Range**: Limit export date range (max 1 year)
3. **Rate Limiting**: Prevent dashboard abuse

## Next Steps

1. Sprint 9: Admin dashboard
2. Sprint 12: Frontend merchant dashboard

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Requires: Sprint 3 (Venue Management)
- Requires: Sprint 4 (Booking & Pricing)
- Blocks: Sprint 12 (RN Merchant Features)
