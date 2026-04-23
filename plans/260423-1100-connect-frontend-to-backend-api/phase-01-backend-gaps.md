# Phase 1: Fix Backend Gaps & Verify Connectivity

**Priority:** HIGH
**Status:** Pending
**Estimated effort:** 2-3 hours

## Overview
Fix critical backend gaps that block frontend API integration, then verify the backend is reachable from the React Native emulator.

## Tasks

### 1.1 Add 'Pickleball' to VenueType enum
- **File:** `backend/app/models/venue.py`
- **Change:** Add `PICKLEBALL = "Pickleball"` to the `VenueType` enum
- **After:** Run `alembic revision --autogenerate` + `alembic upgrade head` if it affects DB

### 1.2 Add GET /merchant/venues endpoint
- **File:** `backend/app/api/v1/endpoints/venues.py` (or new merchant_venues.py)
- **Endpoint:** `GET /merchant/venues` — returns venues owned by current merchant user
- **Response:** List of `{ id, name, status, total_bookings, revenue_mtd, rating }`
- **Auth:** Requires MERCHANT role
- **Query params:** `page`, `limit`

### 1.3 Add customer info to merchant booking list
- **File:** `backend/app/api/v1/endpoints/merchant_bookings.py` or `backend/app/schemas/booking.py`
- **Change:** Add `customer_name` and `customer_phone` fields to booking list response for merchant view
- **Implementation:** Join User table when fetching bookings for merchant

### 1.4 Verify backend connectivity
- Start backend: `docker-compose up` or `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Test health: `curl http://10.0.2.2:8000/api/v1/`
- Test auth: `curl -X POST http://10.0.2.2:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"phone":"+84987654321","password":"Password123!"}'`
- Verify CORS headers in response

### 1.5 Add PUT/DELETE for venue services (Medium priority)
- **File:** `backend/app/api/v1/endpoints/venues.py`
- **Endpoints:**
  - `PUT /venues/{venue_id}/services/{service_id}`
  - `DELETE /venues/{venue_id}/services/{service_id}`
- **Auth:** MERCHANT role, owner of venue

### 1.6 Seed test data
- Ensure `seed_multi_court_venues.py` or `seed_venues.py` has realistic test data
- Verify at least 2 venues, 3+ bookings, 2+ reviews exist in DB

## Success Criteria
- [ ] `Pickleball` is a valid VenueType in backend
- [ ] `GET /merchant/venues` returns venues for logged-in merchant
- [ ] Merchant booking list includes customer name & phone
- [ ] Backend responds on `http://10.0.2.2:8000/api/v1/`
- [ ] CORS headers present in responses
- [ ] Test data seeded in database
