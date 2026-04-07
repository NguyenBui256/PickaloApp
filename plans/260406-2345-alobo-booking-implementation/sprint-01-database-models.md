---
title: "Sprint 1: Database & Models"
description: "Database schema design with SQLAlchemy models and PostGIS for geospatial queries"
status: completed
priority: P1
effort: 12h
tags: [database, postgresql, postgis, models]
created: 2026-04-06
completed: 2026-04-07
---

# Sprint 1: Database & Models

## Overview

Design and implement the complete database schema with SQLAlchemy ORM models, including PostGIS integration for venue location queries.

**Priority:** P1 (Critical - blocks all data-dependent features)
**Current Status:** Completed

**Completed:** 2026-04-07

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 4: Pricing Logic, Section 6: Data Structure)
- Sprint 0: `./sprint-00-infrastructure-setup.md` (Prerequisites)

## Key Insights

1. **Geospatial Queries**: PostGIS `geography` type enables efficient radius searches for venues
2. **Dynamic Pricing**: Needs time-slot factors stored separately from base prices
3. **Booking States**: Status enum (PENDING, CONFIRMED, CANCELLED, COMPLETED)
4. **Soft Deletes**: Use `deleted_at` instead of hard deletes for audit trail

## Requirements

### Functional Requirements

1. **User Models**: Support for 3 roles (USER, MERCHANT, ADMIN)
2. **Venue Models**: With PostGIS location, pricing tiers, operating hours
3. **Booking Models**: Link users, venues, time slots, services
4. **Service Models**: Add-on services (water, bib rental, shoes)
5. **Newsfeed Models**: Posts with sport type, location filters
6. **Pricing Configuration**: Time slot factors, weekend/holiday multipliers

### Non-Functional Requirements

1. **Query Performance**: Index on frequently queried fields (status, user_id, venue_id)
2. **Geospatial Index**: GiST index on location column
3. **Data Integrity**: Foreign key constraints, unique constraints
4. **Audit Trail**: created_at, updated_at timestamps on all tables

## Architecture

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'MERCHANT', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Venues Table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(50),  -- Quan/Huyen in Hanoi
    location GEOGRAPHY(POINT, 4326),  -- PostGIS
    venue_type VARCHAR(50) NOT NULL,  -- Football 5, Football 7, Tennis, Badminton
    description TEXT,
    images JSONB,  -- Array of image URLs
    operating_hours JSONB,  -- {"open": "05:00", "close": "23:00"}
    amenities JSONB,  -- [parking, showers, lights, etc]
    base_price_per_hour DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Pricing Time Slots (for dynamic pricing)
CREATE TABLE pricing_time_slots (
    id SERIAL PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    day_type VARCHAR(20) NOT NULL,  -- WEEKDAY, WEEKEND, HOLIDAY
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price_factor DECIMAL(3,2) DEFAULT 1.0,  -- 1.0 = base, 1.5 = 50% premium
    CHECK (end_time > start_time)
);

-- Venue Services (add-ons)
CREATE TABLE venue_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    name VARCHAR(100) NOT NULL,  -- Water, Bib rental, Shoes
    description TEXT,
    price_per_unit DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    venue_id UUID REFERENCES venues(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    price_factor DECIMAL(3,2) NOT NULL,
    service_fee DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(20)  -- USER, MERCHANT, ADMIN
);

-- Booking Services (many-to-many)
CREATE TABLE booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    service_id UUID REFERENCES venue_services(id),
    quantity INT DEFAULT 1,
    price_per_unit DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED'))
);

-- Newsfeed Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    post_type VARCHAR(50) NOT NULL,  -- RECRUITING, LOOKING_FOR_TEAM, SOCIAL
    sport_type VARCHAR(50),  -- Football, Tennis, Badminton
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    venue_id UUID REFERENCES venues(id),  -- Optional: linked venue
    venue_name VARCHAR(255),  -- Denormalized for search
    district VARCHAR(50),
    event_date DATE,
    event_time TIME,
    player_count_needed INT,
    images JSONB,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'HIDDEN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Actions (audit log)
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,  -- BAN_USER, DELETE_POST, VERIFY_VENUE
    target_type VARCHAR(50),  -- USER, POST, VENUE
    target_id UUID,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_district ON venues(district);
CREATE INDEX idx_venues_type ON venues(venue_type);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_venue ON bookings(venue_id);
CREATE INDEX idx_bookings_date_status ON bookings(booking_date, status);
CREATE INDEX idx_posts_sport ON posts(sport_type);
CREATE INDEX idx_posts_district ON posts(district);
CREATE INDEX idx_posts_status ON posts(status);
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/models/base.py` | Base model with common fields |
| `backend/app/models/user.py` | User model |
| `backend/app/models/venue.py` | Venue, PricingTimeSlot, VenueService models |
| `backend/app/models/booking.py` | Booking, BookingService models |
| `backend/app/models/post.py` | Post, Comment models |
| `backend/app/models/admin.py` | AdminAction model |
| `backend/app/models/__init__.py` | Model exports |
| `backend/alembic/versions/001_initial.py` | Initial migration |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/core/database.py` | Add Base model import |
| `backend/requirements.txt` | Add geoalchemy2 |

## Implementation Steps

### Step 1: Create Base Model (1h)

1. Create `backend/app/models/base.py`
2. Define `BaseModel` with:
   - `id` as UUID primary key
   - `created_at`, `updated_at` timestamps
   - `deleted_at` for soft deletes
3. Add `__repr__` method for debugging
4. Add auto-update `updated_at` logic

### Step 2: Create User Model (1h)

1. Create `backend/app/models/user.py`
2. Define `User` model with fields from schema
3. Add relationship to `Venue` (as merchant)
4. Add relationship to `Booking`, `Post`, `Comment`
5. Create enum for `UserRole`

### Step 3: Create Venue Models (2h)

1. Create `backend/app/models/venue.py`
2. Define `Venue` model with PostGIS location
3. Define `PricingTimeSlot` model
4. Define `VenueService` model
5. Add relationships to `User` (merchant), `Booking`

### Step 4: Create Booking Models (2h)

1. Create `backend/app/models/booking.py`
2. Define `Booking` model with all pricing fields
3. Define `BookingService` junction model
4. Add relationships to `User`, `Venue`, `VenueService`
5. Create enum for `BookingStatus`

### Step 5: Create Post Models (1h)

1. Create `backend/app/models/post.py`
2. Define `Post` model with filters (sport_type, district)
3. Define `Comment` model
4. Add relationships to `User`, `Venue`
5. Create enums for `PostType`, `PostStatus`

### Step 6: Create Admin Model (30m)

1. Create `backend/app/models/admin.py`
2. Define `AdminAction` model for audit trail
3. Add relationship to `User` (admin)

### Step 7: Create Alembic Migration (2h)

1. Generate migration: `alembic revision --autogenerate -m "Initial schema"`
2. Review and adjust migration SQL
3. Ensure PostGIS extension is created
4. Add all indexes
5. Test migration up/down

### Step 8: Seed Data (2h)

1. Create `backend/app/seed/` directory
2. Create `seed_hanoi_venues.py` with sample venues:
   - 20+ venues across Hanoi districts
   - Mix of football, tennis, badminton
   - Real coordinates from Hanoi
3. Create `seed_pricing.py` with default time slots
4. Create `seed_admin.py` with default admin user

### Step 9: Test Models (1h)

1. Create `tests/test_models/` directory
2. Test model creation
3. Test relationships
4. Test soft deletes
5. Test PostGIS queries

## Todo List

- [ ] Create base model with timestamp fields
- [ ] Create User model with role enum
- [ ] Create Venue model with PostGIS location
- [ ] Create PricingTimeSlot model for dynamic pricing
- [ ] Create VenueService model for add-ons
- [ ] Create Booking model with status enum
- [ ] Create BookingService junction model
- [ ] Create Post model with filters
- [ ] Create Comment model
- [ ] Create AdminAction audit model
- [ ] Generate and review Alembic migration
- [ ] Add database indexes for performance
- [ ] Create venue seed data for Hanoi
- [ ] Create pricing seed data
- [ ] Write unit tests for models

## Success Criteria

1. **Migration**: `alembic upgrade head` completes without errors
2. **PostGIS**: `SELECT * FROM venues LIMIT 1` returns location as geography
3. **Relationships**: ORM queries work (e.g., `user.bookings`)
4. **Seed Data**: 20+ venues imported with valid coordinates
5. **Tests**: All model tests pass
6. **Geospatial Query**: Radius search returns correct venues

## Test Scenarios

### Model Creation
```python
def test_create_user():
    user = User(
        phone="+84901234567",
        email="test@example.com",
        password_hash="hash",
        full_name="Test User",
        role=UserRole.USER
    )
    db.add(user)
    db.commit()
    assert user.id is not None
    assert user.created_at is not None

def test_venue_geospatial():
    venue = Venue(
        merchant_id=merchant.id,
        name="Test Stadium",
        address="Hanoi",
        location="POINT(105.8542 21.0285)",  # Hanoi coords
        venue_type="Football 5",
        base_price_per_hour=300000
    )
    db.add(venue)
    db.commit()
    assert venue.location is not None
```

### Geospatial Queries
```python
def test_venue_radius_search():
    # Find venues within 5km of Hanoi center
    hanoi_center = "POINT(105.8542 21.0285)"
    venues = db.query(Venue).filter(
        func.ST_DWithin(
            Venue.location,
            ST_GeographyFromText(hanoi_center),
            5000  # meters
        )
    ).all()
    assert len(venues) > 0
```

### Pricing Calculation
```python
def test_dynamic_pricing():
    # Peak hour (16:00-22:00) should have 1.5x factor
    peak_slot = db.query(PricingTimeSlot).filter(
        PricingTimeSlot.start_time >= time(16, 0),
        PricingTimeSlot.end_time <= time(22, 0)
    ).first()
    assert peak_slot.price_factor == 1.5
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PostGIS not available in CI | Medium | Use Docker PostGIS or skip geo tests in CI |
| Coordinate format errors | Medium | Validate lat/lng in model validation |
| Migration conflicts | Low | Review migrations carefully, use down migration |

## Security Considerations

1. **Password Hashing**: Never store plain passwords (handled in auth sprint)
2. **PII Data**: Phone numbers indexed for search but accessible only to authorized
3. **Soft Deletes**: Preserve data for audit but exclude from queries

## Next Steps

1. Sprint 2: Implement authentication and authorization
2. Sprint 3: Create venue management endpoints

## Dependencies

- Requires: Sprint 0 (Infrastructure)
- Blocks: Sprint 2 (Authentication)
- Blocks: Sprint 3 (Venue Management)
- Blocks: Sprint 4 (Booking)
