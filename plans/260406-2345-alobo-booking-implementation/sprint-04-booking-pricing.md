---
title: "Sprint 4: Booking & Pricing Engine"
description: "Booking CRUD, dynamic pricing calculation, availability checking, and booking status management"
status: pending
priority: P1
effort: 16h
tags: [booking, pricing, availability, business-logic]
created: 2026-04-06
---

# Sprint 4: Booking & Pricing Engine

## Overview

Implement the core booking system with dynamic pricing based on time slots, availability checking, and booking status workflow management.

**Priority:** P1 (Critical - core business logic)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.2: Booking features, Section 4: Pricing Logic)
- Sprint 1: `./sprint-01-database-models.md` (Booking models)
- Sprint 3: `./sprint-03-venue-management.md` (Venue dependencies)

## Key Insights

1. **Pricing Formula**: `Total = (BasePrice × TimeSlotFactor) + ServiceFee`
2. **Time Slot Factors**: Off-peak (1.0x), Peak (1.5x), Weekend (+20%)
3. **Booking States**: PENDING → CONFIRMED → COMPLETED (or CANCELLED)
4. **Merchant Approval**: Bookings require merchant confirmation
5. **Conflict Detection**: Prevent double-booking same venue/time

## Requirements

### Functional Requirements

1. **Create Booking**: User selects venue, date, time slot, services
2. **Price Calculation**: Automatic calculation based on formula
3. **Availability Check**: Real-time slot availability
4. **Booking List**: User's booking history with filters
5. **Booking Details**: Full booking information
6. **Cancel Booking**: User/merchant can cancel (with rules)
7. **Merchant Approval**: Merchant confirms/rejects pending bookings
8. **Booking Timeline**: Visual timeline UI support (prepare data structure)

### Non-Functional Requirements

1. **Atomic Operations**: Prevent race conditions on bookings
2. **Transaction Safety**: Rollback on payment failure
3. **Performance**: Availability check < 200ms
4. **Audit Trail**: Track all booking state changes

## Architecture

### Pricing Formula Implementation

```python
# PRD Formula: Total = (BasePrice × TimeSlotFactor) + ServiceFee

def calculate_booking_price(
    base_price: Decimal,
    start_time: time,
    end_time: time,
    booking_date: date,
    duration_hours: float,
    service_fee: Decimal = 0
) -> Decimal:
    # 1. Determine time slot factor
    if is_weekend(booking_date):
        factor = 1.2  # Weekend +20%
    elif is_peak_hour(start_time):
        factor = 1.5  # Peak hours 16:00-22:00
    else:
        factor = 1.0  # Off-peak 05:00-16:00

    # 2. Calculate
    hourly_price = base_price * factor
    subtotal = hourly_price * duration_hours
    total = subtotal + service_fee

    return total, factor, subtotal

def is_peak_hour(t: time) -> bool:
    return time(16, 0) <= t < time(22, 0)

def is_weekend(d: date) -> bool:
    return d.weekday() >= 5  # Sat=5, Sun=6
```

### Booking State Machine

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          v                v                v
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │CONFIRMED │     │CANCELLED │     │  EXPIRED │
    └─────┬────┘     └──────────┘     └──────────┘
          │
          v
    ┌──────────┐
    │COMPLETED │
    └──────────┘

State Transitions:
- PENDING → CONFIRMED: Merchant approves
- PENDING → CANCELLED: User cancels or merchant rejects
- PENDING → EXPIRED: 15min timeout without payment
- CONFIRMED → COMPLETED: Booking time passed
- CONFIRMED → CANCELLED: User cancels (with possible refund)
```

### API Endpoints

```
USER ENDPOINTS (Auth Required)
├── POST   /api/v1/bookings                    # Create booking
├── GET    /api/v1/bookings                    # List my bookings
├── GET    /api/v1/bookings/:id                # Get booking details
├── POST   /api/v1/bookings/:id/cancel         # Cancel booking
├── GET    /api/v1/venues/:id/timeline         # Get availability timeline
└── GET    /api/v1/bookings/price-calculation  # Calculate price preview

MERCHANT ENDPOINTS (Auth Required)
├── GET    /api/v1/merchant/bookings           # List venue bookings
├── GET    /api/v1/merchant/bookings/:id       # Get booking details
├── POST   /api/v1/merchant/bookings/:id/approve  # Approve booking
├── POST   /api/v1/merchant/bookings/:id/reject   # Reject booking
├── POST   /api/v1/merchant/bookings/:id/cancel   # Cancel booking
└── GET    /api/v1/merchant/venues/:id/bookings  # Venue bookings by date
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/schemas/booking.py` | Booking Pydantic schemas |
| `backend/app/services/pricing.py` | Pricing calculation logic |
| `backend/app/services/booking.py` | Booking business logic |
| `backend/app/api/v1/bookings.py` | User booking endpoints |
| `backend/app/api/v1/merchant-bookings.py` | Merchant booking endpoints |
| `backend/tests/test_bookings.py` | Booking tests |
| `backend/tests/test_pricing.py` | Pricing calculation tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/booking.py` | Add status transition methods |
| `backend/app/api/v1/api.py` | Register booking routers |

## Implementation Steps

### Step 1: Create Pricing Service (3h)

1. Create `backend/app/services/pricing.py`:

**Functions:**
- `calculate_slot_price(base_price, start_time, end_time, booking_date)`: Calculate with factor
- `calculate_booking_total(venue, start_time, end_time, booking_date, services)`: Full calculation
- `get_price_factor(venue_id, day_type, time)`: Get custom or default factor
- `is_peak_hour(time)`: Check if peak (16:00-22:00)
- `is_weekend(date)`: Check if weekend
- `calculate_duration_minutes(start_time, end_time)`: Duration in minutes
- `get_service_fee(subtotal)`: Calculate service fee percentage

**Default Factors (configurable):**
- Weekday 05:00-16:00: 1.0x
- Weekday 16:00-22:00: 1.5x
- Weekend all day: 1.2x (additional)
- Weekend 16:00-22:00: 1.5 × 1.2 = 1.8x

### Step 2: Create Booking Schemas (2h)

1. Create `backend/app/schemas/booking.py`:

**Schemas:**
- `BookingServiceRequest`: service_id, quantity
- `BookingCreateRequest`: venue_id, booking_date, start_time, end_time, services
- `BookingPricePreview`: venue_id, booking_date, start_time, end_time, services
- `BookingPriceResponse`: breakdown of pricing
- `BookingResponse`: Full booking details
- `BookingListItem`: Simplified for list view
- `BookingCancelRequest`: reason (optional)
- `BookingApproveRejectRequest`: reason (optional for reject)
- `BookingTimelineResponse`: available slots for a date
- `BookingListFilters`: status, date_from, date_to

### Step 3: Create Booking Service (4h)

1. Create `backend/app/services/booking.py`:

**Functions:**
- `check_availability(venue_id, date, start_time, end_time)`: Check if slot is free
- `create_booking(user_id, booking_data)`: Create with price calculation
- `get_user_bookings(user_id, filters)`: List user's bookings
- `get_booking_by_id(booking_id, user_id)`: Get with ownership check
- `cancel_booking(booking_id, user_id, reason)`: Cancel with validation
- `approve_booking(booking_id, merchant_id)`: Merchant approves
- `reject_booking(booking_id, merchant_id, reason)`: Merchant rejects
- `get_venue_bookings(venue_id, merchant_id, date)`: For merchant view
- `get_merchant_bookings(merchant_id, filters)`: All merchant venue bookings
- `get_timeline_availability(venue_id, date)`: Return available slots
- `update_booking_status(booking_id, status)`: State transition
- `expire_pending_bookings()`: Background job to expire unpaid

**Availability Logic:**
```python
def check_availability(venue_id, date, start_time, end_time):
    # Find overlapping bookings
    conflicts = db.query(Booking).filter(
        Booking.venue_id == venue_id,
        Booking.booking_date == date,
        Booking.status.in_(['PENDING', 'CONFIRMED']),
        # Overlap condition: (StartA < EndB) and (EndA > StartB)
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).all()

    return len(conflicts) == 0
```

### Step 4: Create User Booking Endpoints (3h)

1. Create `backend/app/api/v1/bookings.py`:

**POST /api/v1/bookings**
- Auth: Required (USER role)
- Input: venue_id, booking_date, start_time, end_time, services
- Logic: Check availability, calculate price, create PENDING booking
- Return: Created booking with price breakdown

**GET /api/v1/bookings**
- Auth: Required
- Query params: status, date_from, date_to, page, limit
- Return: User's bookings (reverse chronological)

**GET /api/v1/bookings/:id**
- Auth: Required
- Return: Full booking details

**POST /api/v1/bookings/:id/cancel**
- Auth: Required
- Input: reason (optional)
- Logic: Validate status (can cancel PENDING, CONFIRMED), update status
- Return: Updated booking

**GET /api/v1/venues/:id/timeline**
- Auth: Optional (public for browsing)
- Query params: date
- Return: Available time slots for the date
- Format: Hourly slots with availability status

**POST /api/v1/bookings/price-calculation**
- Auth: Optional (for preview before login)
- Input: Same as create but without saving
- Return: Price breakdown without creating booking

### Step 5: Create Merchant Booking Endpoints (2h)

1. Create `backend/app/api/v1/merchant-bookings.py`:

**GET /api/v1/merchant/bookings**
- Auth: Required (MERCHANT)
- Query params: status, venue_id, date, page, limit
- Return: Bookings across all merchant's venues

**GET /api/v1/merchant/bookings/:id**
- Auth: Required
- Logic: Verify booking is for merchant's venue
- Return: Booking details

**POST /api/v1/merchant/bookings/:id/approve**
- Auth: Required
- Logic: Verify ownership, check status is PENDING, approve
- Return: Updated booking

**POST /api/v1/merchant/bookings/:id/reject**
- Auth: Required
- Input: reason
- Logic: Verify ownership, check status, reject with reason
- Return: Updated booking

**POST /api/v1/merchant/bookings/:id/cancel**
- Auth: Required
- Logic: Merchant can cancel (e.g., for maintenance)
- Return: Updated booking

**GET /api/v1/merchant/venues/:venue_id/bookings**
- Auth: Required
- Query params: date
- Logic: Verify ownership, return bookings for venue/date
- Return: List of bookings for the day

### Step 6: Register Routes (30m)

1. Update `backend/app/api/v1/api.py`:
   - Include bookings router
   - Include merchant bookings router

### Step 7: Write Tests (2.5h)

1. Create `tests/test_pricing.py`:
   - Test off-peak pricing (1.0x)
   - Test peak hour pricing (1.5x)
   - Test weekend pricing (+20%)
   - Test weekend + peak (1.8x)
   - Test service fee calculation
   - Test duration calculation
   - Test custom venue pricing tiers

2. Create `tests/test_bookings.py`:
   - Test booking creation
   - Test availability check (no conflict)
   - Test availability check (with conflict)
   - Test booking cancellation by user
   - Test booking approval by merchant
   - Test booking rejection by merchant
   - Test price preview endpoint
   - Test timeline endpoint
   - Test ownership checks

## Todo List

- [ ] Create pricing service with time slot factors
- [ ] Implement weekend and peak hour detection
- [ ] Create booking Pydantic schemas
- [ ] Implement availability checking logic
- [ ] Implement booking creation service
- [ ] Implement booking cancellation logic
- [ ] Implement merchant approval/rejection
- [ ] Create user booking endpoints
- [ ] Create merchant booking endpoints
- [ ] Implement timeline availability endpoint
- [ ] Implement price preview endpoint
- [ ] Add booking state transition validation
- [ ] Write pricing calculation tests
- [ ] Write booking workflow tests
- [ ] Test concurrent booking prevention

## Success Criteria

1. **Price Calculation**: Correct pricing per PRD formula
2. **Availability**: Prevents double-booking
3. **Booking Creation**: Users can create pending bookings
4. **Merchant Approval**: Merchants can approve/reject
5. **Cancellation**: Proper state transitions
6. **Timeline**: Returns accurate available slots
7. **Tests**: All pricing and booking tests pass

## Test Scenarios

### Pricing Calculation
```bash
# Test 1: Off-peak weekday (1.0x)
POST /api/v1/bookings/price-calculation
{
  "venue_id": "{uuid}",
  "booking_date": "2026-04-09",  # Wednesday
  "start_time": "10:00",
  "end_time": "11:00",
  "services": []
}
# Expected: base_price × 1.0 = 300,000 VND

# Test 2: Peak hour weekday (1.5x)
POST /api/v1/bookings/price-calculation
{
  "booking_date": "2026-04-09",
  "start_time": "18:00",
  "end_time": "19:00"
}
# Expected: base_price × 1.5 = 450,000 VND

# Test 3: Weekend off-peak (1.2x)
POST /api/v1/bookings/price-calculation
{
  "booking_date": "2026-04-12",  # Saturday
  "start_time": "10:00",
  "end_time": "11:00"
}
# Expected: base_price × 1.2 = 360,000 VND

# Test 4: Weekend peak (1.5 × 1.2 = 1.8x)
POST /api/v1/bookings/price-calculation
{
  "booking_date": "2026-04-12",
  "start_time": "18:00",
  "end_time": "19:00"
}
# Expected: base_price × 1.8 = 540,000 VND

# Test 5: With services
POST /api/v1/bookings/price-calculation
{
  "services": [
    {"service_id": "{uuid}", "quantity": 2}  # 10,000 each
  ]
}
# Expected: (base_price × factor) + (10,000 × 2)
```

### Booking Creation
```bash
# Test 6: Create booking (available)
POST /api/v1/bookings
Authorization: Bearer <user_token>
{
  "venue_id": "{uuid}",
  "booking_date": "2026-04-09",
  "start_time": "10:00",
  "end_time": "11:00"
}
# Expected: 201 Created, status=PENDING

# Test 7: Create booking (conflict)
POST /api/v1/bookings
{ same as above, already booked }
# Expected: 409 Conflict, slot not available

# Test 8: Get my bookings
GET /api/v1/bookings
Authorization: Bearer <user_token>
# Expected: 200 OK, user's bookings
```

### Merchant Actions
```bash
# Test 9: Approve booking
POST /api/v1/merchant/bookings/{id}/approve
Authorization: Bearer <merchant_token>
# Expected: 200 OK, status=CONFIRMED

# Test 10: Reject booking
POST /api/v1/merchant/bookings/{id}/reject
Authorization: Bearer <merchant_token>
{ "reason": "Maintenance" }
# Expected: 200 OK, status=CANCELLED

# Test 11: Approve non-owned venue
POST /api/v1/merchant/bookings/{other_id}/approve
Authorization: Bearer <merchant_token>
# Expected: 403 Forbidden
```

### Cancellation
```bash
# Test 12: User cancel pending booking
POST /api/v1/bookings/{id}/cancel
Authorization: Bearer <user_token>
# Expected: 200 OK, status=CANCELLED

# Test 13: Cancel confirmed booking
POST /api/v1/bookings/{id}/cancel
# Expected: 200 OK (with refund logic in Sprint 5)

# Test 14: Cancel other user's booking
POST /api/v1/bookings/{other_id}/cancel
Authorization: Bearer <user_token>
# Expected: 403 Forbidden
```

### Timeline
```bash
# Test 15: Get daily timeline
GET /api/v1/venues/{uuid}/timeline?date=2026-04-09
# Expected: 200 OK, hourly slots with availability
# Format: [{"hour": 5, "available": true}, {"hour": 6, "available": true}, ...]
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition on bookings | Critical | Use database transaction with SELECT FOR UPDATE |
| Incorrect pricing calculation | High | Comprehensive unit tests for all scenarios |
| Double booking | High | Strict availability check with locking |
| Orphaned pending bookings | Medium | Background job to expire unpaid |

## Security Considerations

1. **Ownership Verification**: Users can only cancel their own bookings
2. **Merchant Verification**: Merchants can only manage their venue bookings
3. **Transaction Safety**: Use database transactions for booking creation
4. **Rate Limiting**: Prevent booking spam

## Next Steps

1. Sprint 5: Payment integration with VNPay/Momo
2. Sprint 11: Frontend booking UI

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Requires: Sprint 3 (Venue Management)
- Blocks: Sprint 5 (Payment Integration)
- Blocks: Sprint 11 (RN User Features)
