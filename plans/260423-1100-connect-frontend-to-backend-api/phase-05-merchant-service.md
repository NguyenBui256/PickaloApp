# Phase 5: Swap merchant-service to Real API

**Priority:** HIGH
**Status:** Pending
**Depends on:** Phase 2, Phase 3, Phase 4
**Estimated effort:** 1 hour

## File to Modify
- `frontend/src/services/merchant-service.ts`

## Changes Per Function

### 5.1 `fetchMerchantStats()`
```
BEFORE: Maps OWNER_VENUES mock to MerchantStatsResponse
AFTER:  GET /merchant/bookings/stats
```

### 5.2 `fetchMyVenues()`
```
BEFORE: Returns OWNER_VENUES mock
AFTER:  GET /merchant/venues (requires Phase 1.2 backend endpoint)
NOTE:   If backend endpoint not ready, add fallback with TODO comment
```

### 5.3 `fetchMerchantBookings(params?)`
```
BEFORE: Maps OWNER_BOOKING_REQUESTS mock
AFTER:  GET /merchant/bookings with { status, venue_id, date_from, date_to, page, limit }
```

### 5.4 `fetchMerchantBookingById(bookingId)`
```
BEFORE: Finds in OWNER_BOOKING_REQUESTS mock
AFTER:  GET /merchant/bookings/{bookingId}
```

### 5.5 `approveBooking(bookingId, data?)`
```
BEFORE: Returns mock with CONFIRMED status
AFTER:  POST /merchant/bookings/{bookingId}/approve with { reason? }
```

### 5.6 `rejectBooking(bookingId, data)`
```
BEFORE: Returns mock with CANCELLED status
AFTER:  POST /merchant/bookings/{bookingId}/reject with { reason? }
```

### 5.7 `merchantCancelBooking(bookingId, data)`
```
BEFORE: Returns mock with CANCELLED status
AFTER:  POST /merchant/bookings/{bookingId}/cancel with { reason }
```

### 5.8 `fetchVenueBookings(venueId, params?)`
```
BEFORE: Filters OWNER_BOOKING_REQUESTS mock
AFTER:  GET /merchant/bookings/venues/{venueId}/bookings with { booking_date, status }
```

## Cleanup
- Remove `import { OWNER_VENUES, OWNER_BOOKING_REQUESTS } from '@constants/mock-data'`
- Remove all `console.log('[MOCK] ...')` lines

## Success Criteria
- [ ] Merchant dashboard shows real stats
- [ ] Owner venue list fetched from backend
- [ ] Booking requests show real pending bookings
- [ ] Approve/reject updates booking status in backend
- [ ] Venue-specific bookings filtered correctly
