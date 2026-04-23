# Phase 3: Swap venue-service to Real API

**Priority:** HIGH
**Status:** Pending
**Depends on:** Phase 2 (auth working)
**Estimated effort:** 1 hour

## File to Modify
- `frontend/src/services/venue-service.ts`

## Changes Per Function

### 3.1 `fetchVenues(params?)`
```
BEFORE: Filters VENUES mock array locally
AFTER:  GET /venues with query params (district, venue_type, lat, lng, etc.)
NOTE:   apiClient already returns T directly, no .data needed
```

### 3.2 `searchVenuesNearby(params)`
```
BEFORE: Delegates to mock fetchVenues
AFTER:  GET /venues/search/nearby with { lat, lng, radius, venue_type, etc. }
```

### 3.3 `fetchVenueById(venueId)`
```
BEFORE: Finds in VENUES mock array
AFTER:  GET /venues/{venueId}
```

### 3.4 `fetchVenueAvailability(venueId, date)`
```
BEFORE: Generates random availability
AFTER:  GET /venues/{venueId}/availability?date=YYYY-MM-DD
```

### 3.5 `fetchDistrictsList()`
```
BEFORE: Returns hardcoded district array
AFTER:  GET /venues/districts/list
```

### 3.6 `createVenue(data)` (Merchant)
```
BEFORE: Returns mock venue
AFTER:  POST /venues/merchant with VenueCreateRequest body
```

### 3.7 `updateVenue(venueId, data)` (Merchant)
```
BEFORE: Merges with mock data
AFTER:  PUT /venues/merchant/{venueId} with VenueUpdateRequest body
```

### 3.8 `deactivateVenue(venueId)` (Merchant)
```
BEFORE: Logs and returns
AFTER:  DELETE /venues/merchant/{venueId}
```

### 3.9 `fetchVenueServices(venueId)`
```
BEFORE: Maps OWNER_SERVICES mock
AFTER:  GET /venues/{venueId}/services
```

### 3.10 `createVenueService(venueId, data)`
```
BEFORE: Returns mock service
AFTER:  POST /venues/{venueId}/services
```

### 3.11 `updateVenueService(venueId, serviceId, data)`
```
STATUS: No BE endpoint — KEEP MOCK if Phase 1.5 not done
AFTER:  PUT /venues/{venueId}/services/{serviceId} (if endpoint added)
```

### 3.12 `deleteVenueService(venueId, serviceId)`
```
STATUS: No BE endpoint — KEEP MOCK if Phase 1.5 not done
AFTER:  DELETE /venues/{venueId}/services/{serviceId} (if endpoint added)
```

### 3.13 `fetchPricingSlots(venueId)`
```
BEFORE: Returns hardcoded pricing
AFTER:  GET /venues/{venueId}/pricing
```

### 3.14 `createPricingSlot(venueId, data)`
```
BEFORE: Returns mock slot
AFTER:  POST /venues/{venueId}/pricing
```

### 3.15 `verifyVenue(venueId)` (Admin)
```
BEFORE: Returns mock success
AFTER:  POST /venues/{venueId}/verify
```

## Cleanup
- Remove `import { VENUES, OWNER_SERVICES } from '@constants/mock-data'`
- Remove all `console.log('[MOCK] ...')` lines

## Success Criteria
- [ ] Home screen shows real venue list from API
- [ ] Venue detail fetches real data
- [ ] Availability shows real slot status
- [ ] Search nearby works with GPS coordinates
- [ ] Merchant can create/update venues
- [ ] Pricing slots fetched from backend
