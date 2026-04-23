# Phase 8: Integration Testing & Cleanup

**Priority:** MEDIUM
**Status:** Pending
**Depends on:** Phase 2-7
**Estimated effort:** 2-3 hours

## Overview
End-to-end testing of all API integrations, cleanup of unused mock data, and final verification.

## Testing Checklist

### 8.1 Auth Flow
- [ ] Register new user → receives JWT tokens
- [ ] Login with existing user → receives JWT tokens
- [ ] Tokens persisted in AsyncStorage
- [ ] Auto-redirect after login based on role (USER → Home, MERCHANT → Owner Dashboard)
- [ ] Logout clears tokens and navigates to login
- [ ] Token refresh on 401 works transparently
- [ ] Profile fetch shows real user data
- [ ] Profile update saves to backend

### 8.2 Venue Flow
- [ ] Home screen shows real venue list
- [ ] Search by district works
- [ ] Search nearby with GPS works
- [ ] Venue detail shows real data (images, hours, price, amenities)
- [ ] Availability grid shows real slot status
- [ ] District filter dropdown populated from API

### 8.3 Booking Flow
- [ ] Price calculation shows real price breakdown
- [ ] Create booking → status PENDING
- [ ] Booking list shows real bookings with correct statuses
- [ ] Booking detail shows full info (slots, services, price)
- [ ] Cancel booking updates status

### 8.4 Merchant Flow
- [ ] Merchant dashboard shows real stats (bookings, revenue)
- [ ] Owner venue list from API
- [ ] Booking requests list with customer info
- [ ] Approve/reject booking works
- [ ] Venue CRUD operations work

### 8.5 Review Flow
- [ ] Venue reviews show real reviews
- [ ] Submit review after completed booking
- [ ] Edit/delete own reviews

## Cleanup Tasks

### 8.6 Remove unused mock data
- After all screens use API calls, remove unused exports from `mock-data.ts`
- Keep: `HIGHLIGHT_BANNERS`, `MEMBERSHIPS`, `QUICK_FILTERS`, `EXPLORE_FILTERS`, `CATEGORIES` (static UI)
- Remove: `VENUES`, `MOCK_BOOKINGS`, `MOCK_USER`, `MOCK_OWNER`, `MOCK_REGISTER_PAYLOAD`, `MOCK_OWNER_REGISTER_PAYLOAD`, `OWNER_VENUES`, `OWNER_BOOKING_REQUESTS`, `OWNER_SERVICES`, `MOCK_AVAILABILITY`, `BOOKING_COURTS`, `BANK_DETAILS`, `Booking` interface, `generateTimeSlots`, `TIME_SLOTS`

### 8.7 Remove `// @ts-ignore` comments
- Several service files have `// @ts-ignore` above the `apiClient` import
- Remove once mock code is deleted and real API calls are active

### 8.8 Verify TypeScript compilation
```bash
cd frontend && npx tsc --noEmit
```

### 8.9 Verify ESLint passes
```bash
cd frontend && npx eslint src/services/ src/screens/
```

## Success Criteria
- [ ] All test checklist items pass
- [ ] `mock-data.ts` only contains static UI constants
- [ ] No TypeScript errors
- [ ] No ESLint errors in modified files
- [ ] App runs without crashes on Android emulator
