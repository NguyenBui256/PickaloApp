# Phase 4: Swap booking-service to Real API

**Priority:** HIGH
**Status:** Pending
**Depends on:** Phase 2, Phase 3
**Estimated effort:** 1 hour

## File to Modify
- `frontend/src/services/booking-service.ts`

## Changes Per Function

### 4.1 `calculateBookingPrice(data)`
```
BEFORE: Calculates mock price (150000/hr * hours + 5% fee)
AFTER:  POST /bookings/price-calculation with BookingPricePreviewRequest
NOTE:   Real pricing uses venue's base_price * price_factor per slot
```

### 4.2 `createBooking(data)`
```
BEFORE: Returns mock booking with PENDING status
AFTER:  POST /bookings with BookingCreateRequest
```

### 4.3 `fetchMyBookings(filters?)`
```
BEFORE: Filters MOCK_BOOKINGS array
AFTER:  GET /bookings with query params (status, date_from, date_to, venue_id, page, limit)
```

### 4.4 `fetchBookingById(bookingId)`
```
BEFORE: Finds in MOCK_BOOKINGS array
AFTER:  GET /bookings/{bookingId}
```

### 4.5 `cancelBooking(bookingId, data?)`
```
BEFORE: Returns mock with CANCELLED status
AFTER:  POST /bookings/{bookingId}/cancel with { reason? }
```

## Cleanup
- Remove `import { MOCK_BOOKINGS } from '@constants/mock-data'`
- Remove `_normalizeBookingStatus` helper (BE returns correct enum values)
- Remove all `console.log('[MOCK] ...')` lines

## Success Criteria
- [ ] Price preview shows real calculated price
- [ ] Booking creation returns real booking with backend-generated ID
- [ ] Booking list shows real user bookings
- [ ] Booking detail shows full data including services & slots
- [ ] Cancel booking updates status in backend
