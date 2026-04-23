# Phase 6: Swap review-service to Real API

**Priority:** MEDIUM
**Status:** Pending
**Depends on:** Phase 2
**Estimated effort:** 30 minutes

## File to Modify
- `frontend/src/services/review-service.ts`

## Changes Per Function

### 6.1 `fetchVenueReviews(venueId, page, limit)`
```
BEFORE: Returns hardcoded 3 mock reviews
AFTER:  GET /venues/{venueId}/reviews?page=X&limit=Y
```

### 6.2 `createReview(venueId, data)`
```
BEFORE: Returns mock review
AFTER:  POST /venues/{venueId}/reviews with { rating, comment?, images? }
```

### 6.3 `updateReview(reviewId, data)`
```
BEFORE: Returns mock updated review
AFTER:  PUT /reviews/{reviewId} with { rating?, comment?, images? }
```

### 6.4 `deleteReview(reviewId)`
```
BEFORE: Logs and returns
AFTER:  DELETE /reviews/{reviewId}
```

## Cleanup
- Remove inline mock review arrays
- Remove all `console.log('[MOCK] ...')` lines

## Success Criteria
- [ ] Venue detail shows real reviews from backend
- [ ] Can submit new review after completed booking
- [ ] Can edit own review
- [ ] Can delete own review
