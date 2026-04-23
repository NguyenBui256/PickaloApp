# Phase 7: Update Screens Using Direct Mock Imports

**Priority:** MEDIUM
**Status:** Pending
**Depends on:** Phase 2-6
**Estimated effort:** 2-3 hours

## Overview
Several screen components import mock data directly from `mock-data.ts` instead of going through service functions. These need to be updated to use the real API service calls.

## Files to Modify

### 7.1 Screens importing from mock-data.ts directly

| Screen | Mock Data Used | Change |
|--------|---------------|--------|
| `HomeScreen.tsx` | `VENUES`, `CATEGORIES`, `HIGHLIGHT_BANNERS` | Use `fetchVenues()`, derive categories from `VenueType` enum |
| `ExploreScreen.tsx` | `EXPLORE_FILTERS`, `MEMBERSHIPS` | Derive from API or keep as static UI constants |
| `HighlightsScreen.tsx` | `HIGHLIGHT_BANNERS` | Keep as static content (no BE API for banners) |
| `MapVenueDetailOverlayScreen.tsx` | `VENUES`, `BANK_DETAILS` | Use `fetchVenueById()` |
| `VenueDetailScreen.tsx` | `VENUES`, `MOCK_AVAILABILITY`, `BOOKING_COURTS` | Use `fetchVenueById()`, `fetchVenueAvailability()` |
| `BookingDetailsScreen.tsx` | `MOCK_BOOKINGS` | Use `fetchBookingById()` |
| `FinalPaymentScreen.tsx` | `MOCK_BOOKINGS`, `BANK_DETAILS` | Use `fetchBookingById()`, payment API |
| `LoginScreen.tsx` | `MOCK_USER`, `MOCK_OWNER` | Use `login()` from auth-service |
| `BookingListScreen.tsx` | `MOCK_BOOKINGS` | Use `fetchMyBookings()` |
| `BookingHistoryDetailScreen.tsx` | `MOCK_BOOKINGS` | Use `fetchBookingById()` |
| `OwnerBookingDetailScreen.tsx` | `OWNER_BOOKING_REQUESTS` | Use `fetchMerchantBookingById()` |
| `OwnerRevenueReportScreen.tsx` | `OWNER_VENUES` | Use `fetchMerchantStats()` |
| `ReviewSubmissionScreen.tsx` | Mock review data | Use `createReview()` |
| `ScheduleManagementScreen.tsx` | `MOCK_AVAILABILITY`, `TIME_SLOTS` | Use `fetchVenueAvailability()` |
| `MaintenanceSchedulerScreen.tsx` | `MOCK_AVAILABILITY` | Use venue availability API |
| `VenueRegistrationScreen.tsx` | Mock venue data | Use `createVenue()` |

### 7.2 Static constants to keep (no backend API needed)
These are UI-only constants that don't need backend data:
- `QUICK_FILTERS` — Static search suggestions
- `EXPLORE_FILTERS` — UI tab filters
- `HIGHLIGHT_BANNERS` — Promotional banners (keep until admin content API exists)
- `MEMBERSHIPS` — Package/membership display (keep until BE membership API exists)
- `CATEGORIES` — Can derive from `VenueType` enum values, but keep as fallback

### 7.3 Pattern for screen updates
```typescript
// BEFORE (direct mock import)
import { VENUES } from '@constants/mock-data';
const venue = VENUES.find(v => v.id === venueId);

// AFTER (API call via service)
import { fetchVenueById } from '@services/venue-service';
const [venue, setVenue] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchVenueById(venueId)
    .then(setVenue)
    .catch(console.error)
    .finally(() => setLoading(false));
}, [venueId]);
```

## Success Criteria
- [ ] No screen imports from `mock-data.ts` for data that has a backend API
- [ ] All screens show loading states during API calls
- [ ] All screens handle API errors gracefully
- [ ] Static UI constants (banners, filters) remain as local constants
