---
title: "Sprint 3: Venue Management APIs"
description: "CRUD operations for venues, services, pricing tiers, and venue search with filters"
status: pending
priority: P1
effort: 14h
tags: [api, venues, crud, postgis]
created: 2026-04-06
---

# Sprint 3: Venue Management APIs

## Overview

Implement RESTful API endpoints for venue management including CRUD operations, geospatial search, filtering, and venue service management.

**Priority:** P1 (High - core feature for users and merchants)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.1: Maps & Data, Section 3.3: Merchant features)
- Sprint 1: `./sprint-01-database-models.md` (Venue models)
- Sprint 2: `./sprint-02-authentication.md` (Auth dependencies)

## Key Insights

1. **Geospatial Search**: Users find venues by radius + district
2. **Merchant Ownership**: Only venue owners can edit their venues
3. **Verification Flow**: New venues require admin verification
4. **Dynamic Pricing**: Venues have multiple time slot pricing tiers

## Requirements

### Functional Requirements

1. **Public Venue Search**: List venues with filters (district, type, radius)
2. **Venue Details**: Get full venue info with images, amenities
3. **Venue Creation**: Merchants register new venues
4. **Venue Updates**: Merchants edit their venues
5. **Venue Deactivation**: Soft delete for venues
6. **Service Management**: CRUD for venue services (add-ons)
7. **Pricing Management**: CRUD for time slot pricing
8. **Venue Verification**: Admin approval workflow

### Non-Functional Requirements

1. **Performance**: Geospatial queries < 500ms
2. **Pagination**: List endpoints support page/limit
3. **Caching**: Cache popular venue searches (future)
4. **Image Upload**: Support multiple images per venue

## Architecture

### API Endpoints

```
PUBLIC ENDPOINTS
├── GET  /api/v1/venues                    # List venues
├── GET  /api/v1/venues/:id                # Get venue details
├── GET  /api/v1/venues/:id/services       # Get venue services
├── GET  /api/v1/venues/:id/availability   # Check availability
└── GET  /api/v1/districts                 # List Hanoi districts

MERCHANT ENDPOINTS (Auth Required)
├── POST   /api/v1/merchant/venues         # Create venue
├── PUT    /api/v1/merchant/venues/:id     # Update venue
├── DELETE /api/v1/merchant/venues/:id     # Deactivate venue
├── POST   /api/v1/merchant/venues/:id/services    # Add service
├── PUT    /api/v1/merchant/venues/:id/services/:id  # Update service
├── DELETE /api/v1/merchant/venues/:id/services/:id  # Delete service
├── POST   /api/v1/merchant/venues/:id/pricing       # Add pricing tier
├── PUT    /api/v1/merchant/venues/:id/pricing/:id   # Update pricing
└── DELETE /api/v1/merchant/venues/:id/pricing/:id   # Delete pricing

ADMIN ENDPOINTS (Admin Role)
├── GET  /api/v1/admin/venues/pending      # Pending verification
├── POST /api/v1/admin/venues/:id/verify   # Verify venue
└── POST /api/v1/admin/venues/:id/reject   # Reject venue
```

### Search Query Parameters

```
GET /api/v1/venues?
    district=Hai+Ba+Trung&           # Filter by district
    type=Football+5&                 # Filter by venue type
    lat=21.0285&                     # Center latitude
    lng=105.8542&                    # Center longitude
    radius=5000&                     # Radius in meters
    min_price=200000&                # Min price per hour
    max_price=500000&                # Max price per hour
    has_parking=true&                # Filter by amenity
    page=1&                          # Page number
    limit=20                         # Items per page
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/venue.py` | Venue Pydantic schemas |
| `backend/app/services/venue.py` | Venue business logic |
| `backend/app/api/v1/venues.py` | Public venue endpoints |
| `backend/app/api/v1/merchant.py` | Merchant venue endpoints |
| `backend/app/api/v1/admin/venues.py` | Admin venue endpoints |
| `backend/tests/test_venues.py` | Venue API tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/api/v1/api.py` | Register new routers |
| `backend/app/api/deps.py` | Add merchant ownership check |

## Implementation Steps

### Step 1: Create Venue Schemas (2h)

1. Create `backend/app/schemas/venue.py`:

**Schemas:**
- `VenueBase`: name, address, district, description
- `VenueCreate`: VenueBase + coordinates, venue_type, images, amenities
- `VenueUpdate`: Partial update fields
- `VenueResponse`: Full venue with calculated fields
- `VenueListItem`: Simplified for list view
- `VenueServiceCreate`: name, description, price_per_unit
- `VenueServiceResponse`: Service details
- `PricingSlotCreate`: day_type, start_time, end_time, price_factor
- `PricingSlotResponse`: Pricing tier details
- `VenueSearchParams`: Query parameters for search
- `VenueListResponse`: venues + pagination metadata

### Step 2: Create Venue Service (3h)

1. Create `backend/app/services/venue.py`:

**Functions:**
- `get_venues(filters, pagination)`: List with filters
- `get_venue_by_id(venue_id)`: Single venue details
- `search_venues_by_radius(lat, lng, radius)`: Geospatial search
- `create_venue(merchant_id, venue_data)`: Create new venue
- `update_venue(venue_id, merchant_id, data)`: Update with ownership check
- `deactivate_venue(venue_id, merchant_id)`: Soft delete
- `add_service(venue_id, service_data)`: Add venue service
- `update_service(service_id, venue_id, data)`: Update service
- `delete_service(service_id, venue_id)`: Remove service
- `get_venue_availability(venue_id, date)`: Check available slots
- `verify_venue(venue_id)`: Admin verification
- `get_hanoi_districts()`: Return list of districts

### Step 3: Public Venue Endpoints (3h)

1. Create `backend/app/api/v1/venues.py`:

**GET /api/v1/venues**
- Query params: district, type, lat, lng, radius, min_price, max_price, page, limit
- Return: Paginated venue list
- Logic: Apply filters, execute geospatial query if coordinates provided

**GET /api/v1/venues/:id**
- Return: Full venue details with services and pricing
- Include: Images, amenities, operating hours

**GET /api/v1/venues/:id/services**
- Return: List of venue services

**GET /api/v1/venues/:id/availability**
- Query params: date
- Return: Available time slots for the date
- Logic: Check against existing bookings

**GET /api/v1/districts**
- Return: List of Hanoi districts (static data)

### Step 4: Merchant Venue Endpoints (3h)

1. Create `backend/app/api/v1/merchant.py`:

**POST /api/v1/merchant/venues**
- Auth: Required (MERCHANT role)
- Input: Venue data
- Logic: Create venue, link to merchant, set is_verified=false
- Return: Created venue

**PUT /api/v1/merchant/venues/:id**
- Auth: Required
- Logic: Verify ownership, update venue
- Return: Updated venue

**DELETE /api/v1/merchant/venues/:id**
- Auth: Required
- Logic: Verify ownership, soft delete (set deleted_at)

**POST /api/v1/merchant/venues/:id/services**
- Auth: Required
- Input: Service data
- Return: Created service

**PUT /api/v1/merchant/venues/:id/services/:service_id**
- Auth: Required
- Logic: Verify venue ownership, update service

**DELETE /api/v1/merchant/venues/:id/services/:service_id**
- Auth: Required
- Logic: Verify venue ownership, delete service

**POST /api/v1/merchant/venues/:id/pricing**
- Auth: Required
- Input: Pricing slot data
- Return: Created pricing tier

**PUT /api/v1/merchant/venues/:id/pricing/:pricing_id**
- Auth: Required
- Logic: Verify ownership, update pricing

**DELETE /api/v1/merchant/venues/:id/pricing/:pricing_id**
- Auth: Required
- Logic: Verify ownership, delete pricing

**GET /api/v1/merchant/venues**
- Auth: Required
- Return: List of merchant's venues

### Step 5: Admin Venue Endpoints (1.5h)

1. Create `backend/app/api/v1/admin/venues.py`:

**GET /api/v1/admin/venues/pending**
- Auth: Required (ADMIN role)
- Return: List of unverified venues

**POST /api/v1/admin/venues/:id/verify**
- Auth: Required (ADMIN)
- Logic: Set is_verified=true
- Log: Create admin action record

**POST /api/v1/admin/venues/:id/reject**
- Auth: Required (ADMIN)
- Input: reason
- Logic: Set is_active=false, log action

### Step 6: Add Dependencies (30m)

1. Update `backend/app/api/deps.py`:
   - `get_current_merchant()`: Verify MERCHANT role
   - `get_venue_ownership(venue_id)`: Verify user owns venue
   - `get_admin()`: Verify ADMIN role

### Step 7: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include venues router (public)
   - Include merchant router
   - Include admin venues router

### Step 8: Write Tests (2h)

1. Create `tests/test_venues.py`:
   - Test venue listing with filters
   - Test geospatial radius search
   - Test venue creation by merchant
   - Test venue update by owner
   - Test venue update by non-owner (should fail)
   - Test service CRUD
   - Test pricing CRUD
   - Test admin verification

## Todo List

- [ ] Create venue Pydantic schemas
- [ ] Create venue service with geospatial search
- [ ] Implement GET /venues (list with filters)
- [ ] Implement GET /venues/:id (details)
- [ ] Implement GET /venues/:id/services
- [ ] Implement GET /venues/:id/availability
- [ ] Implement POST /merchant/venues (create)
- [ ] Implement PUT /merchant/venues/:id (update)
- [ ] Implement DELETE /merchant/venues/:id
- [ ] Implement venue service CRUD endpoints
- [ ] Implement pricing tier CRUD endpoints
- [ ] Implement GET /districts endpoint
- [ ] Implement admin verification endpoints
- [ ] Add ownership verification dependency
- [ ] Write comprehensive venue tests

## Success Criteria

1. **List Venues**: Returns paginated list with filters
2. **Geospatial Search**: Radius search returns correct venues
3. **Create Venue**: Merchants can create venues
4. **Ownership**: Non-owners cannot edit venues
5. **Services**: Services can be added/removed
6. **Admin Verify**: Admin can verify/reject venues
7. **Tests**: All venue tests pass

## Test Scenarios

### Public Venue Search
```bash
# Test 1: List all venues
GET /api/v1/venues?page=1&limit=20
# Expected: 200 OK, paginated venue list

# Test 2: Filter by district
GET /api/v1/venues?district=Hai+Ba+Trang
# Expected: 200 OK, only venues in district

# Test 3: Filter by type
GET /api/v1/venues?type=Football+5
# Expected: 200 OK, only 5-a-side football

# Test 4: Geospatial radius search
GET /api/v1/venues?lat=21.0285&lng=105.8542&radius=5000
# Expected: 200 OK, venues within 5km

# Test 5: Price range filter
GET /api/v1/venues?min_price=200000&max_price=400000
# Expected: 200 OK, venues in price range

# Test 6: Get venue details
GET /api/v1/venues/{uuid}
# Expected: 200 OK, full venue info

# Test 7: Get venue not found
GET /api/v1/venues/00000000-0000-0000-0000-000000000000
# Expected: 404 Not Found
```

### Merchant Venue Management
```bash
# Test 8: Create venue
POST /api/v1/merchant/venues
Authorization: Bearer <merchant_token>
{
  "name": "Sân bóng PTIT",
  "address": "Km10, Đường Nguyễn Trãi",
  "district": "Ha Dong",
  "coordinates": {"lat": 20.980, "lng": 105.787},
  "venue_type": "Football 5",
  "base_price_per_hour": 300000
}
# Expected: 201 Created

# Test 9: Update own venue
PUT /api/v1/merchant/venues/{id}
Authorization: Bearer <merchant_token>
# Expected: 200 OK

# Test 10: Update another's venue (should fail)
PUT /api/v1/merchant/venues/{other_venue_id}
Authorization: Bearer <merchant_token>
# Expected: 403 Forbidden

# Test 11: Add service
POST /api/v1/merchant/venues/{id}/services
Authorization: Bearer <merchant_token>
{
  "name": "Nước uống",
  "price_per_unit": 10000
}
# Expected: 201 Created

# Test 12: Deactivate venue
DELETE /api/v1/merchant/venues/{id}
Authorization: Bearer <merchant_token>
# Expected: 200 OK (soft delete)
```

### Admin Verification
```bash
# Test 13: List pending venues
GET /api/v1/admin/venues/pending
Authorization: Bearer <admin_token>
# Expected: 200 OK, unverified venues

# Test 14: Verify venue
POST /api/v1/admin/venues/{id}/verify
Authorization: Bearer <admin_token>
# Expected: 200 OK, venue.is_verified = true

# Test 15: User accessing admin endpoint
GET /api/v1/admin/venues/pending
Authorization: Bearer <user_token>
# Expected: 403 Forbidden
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Invalid coordinates | Medium | Validate lat/lng ranges in schema |
| Slow geospatial queries | High | Ensure GiST index exists |
| Ownership bypass | Critical | Always verify in service layer |
| Orphaned services | Low | Cascade delete or handle in cleanup |

## Security Considerations

1. **Ownership Verification**: Always check merchant owns venue
2. **Input Validation**: Validate coordinates (lat: -90 to 90, lng: -180 to 180)
3. **SQL Injection**: Use parameterized queries (SQLAlchemy handles)
4. **Rate Limiting**: Apply to public search endpoints
5. **Image Upload**: Validate file types, size limits

## Next Steps

1. Sprint 4: Implement booking and pricing engine
2. Sprint 6: Add advanced map features

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Blocks: Sprint 4 (Booking & Pricing)
- Blocks: Sprint 6 (Maps & Search)
