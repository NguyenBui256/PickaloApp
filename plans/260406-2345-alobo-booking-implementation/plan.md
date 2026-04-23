---
title: "ALOBO Booking - Comprehensive Implementation Plan"
description: "Full implementation plan for sports facility booking platform with React Native, FastAPI, PostgreSQL+PostGIS"
status: in_progress
priority: P1
effort: 120h
branch: main
tags: [mobile, backend, database, maps, payment]
created: 2026-04-06
---

# ALOBO Booking - Implementation Plan

## Overview

Sports facility booking platform connecting venue owners (Merchants) and players (Users) in Hanoi, Vietnam.

**Tech Stack:**
- Frontend: React Native (Android)
- Backend: Python FastAPI (Monolithic)
- Database: PostgreSQL + PostGIS
- Maps: Leaflet JS + OpenStreetMap
- Payment: VNPay/Momo/QR transfer

**User Personas:**
- Users: Find venues, book slots, pay online, find opponents
- Merchants: Register venues, manage schedules, approve bookings
- Admin: Dashboard, user management, content moderation

## Sprint Progression

| Sprint | Focus | Status | Effort |
|--------|-------|--------|--------|
| Sprint 0 | Infrastructure & Setup | ✅ Complete | 8h |
Completed: 2026-04-07
| Sprint 1 | Database & Models | ✅ Complete | 12h |
Completed: 2026-04-07
| Sprint 2 | Authentication & Authorization | ✅ Complete | 10h |
Completed: 2026-04-07
| Sprint 3 | Venue Management APIs | ✅ Complete | 14h |
Completed: 2026-04-08
| Sprint 4 | Booking & Pricing Engine | ✅ Complete | 16h |
Completed: 2026-04-08
| Sprint 5 | Payment Integration | 🔄 In Progress | 20h |
| Sprint 6 | Maps & Search | ✅ Complete | 10h |
Completed: 2026-04-08
| Sprint 7 | Newsfeed & Community | ⏳ Planned | 10h |
| Sprint 8 | Merchant Dashboard APIs | ⏳ Planned | 12h |
| Sprint 9 | Admin Dashboard APIs | ✅ Complete | 8h |
Completed: 2026-04-09
| Sprint 10 | React Native - Core & Navigation | ⏳ Planned | 10h |
| Sprint 11 | React Native - User Features | ⏳ Planned | 14h |
| Sprint 12 | React Native - Merchant Features | ⏳ Planned | 12h |
| Sprint 13 | React Native - Admin Features | ⏳ Planned | 8h |
| Sprint 14 | Integration Testing & Polish | ⏳ Planned | 8h |

## Dependencies

```
Sprint 0 (Infrastructure)
    |
    v
Sprint 1 (Database) --> Sprint 2 (Auth)
                            |
                            v
Sprint 3 (Venues) --> Sprint 4 (Booking) --> Sprint 5 (Payment)
                            |
                            v
                    Sprint 6 (Maps) --> Sprint 7 (Newsfeed)
                            |
                            v
Sprint 8 (Merchant) --> Sprint 9 (Admin)
                            |
                            v
Sprint 10-13 (Frontend) --> Sprint 14 (Testing)
```

## Phase Files

- [Sprint 0: Infrastructure & Setup](./sprint-00-infrastructure-setup.md)
- [Sprint 1: Database & Models](./sprint-01-database-models.md)
- [Sprint 2: Authentication & Authorization](./sprint-02-authentication.md)
- [Sprint 3: Venue Management APIs](./sprint-03-venue-management.md)
- [Sprint 4: Booking & Pricing Engine](./sprint-04-booking-pricing.md)
- [Sprint 5: Payment Integration](./sprint-05-payment-integration.md)
- [Sprint 6: Maps & Search](./sprint-06-maps-search.md)
- [Sprint 7: Newsfeed & Community](./sprint-07-newsfeed.md)
- [Sprint 8: Merchant Dashboard APIs](./sprint-08-merchant-dashboard.md)
- [Sprint 9: Admin Dashboard APIs](./sprint-09-admin-dashboard.md) ✅ Complete
- [Sprint 10: React Native - Core & Navigation](./sprint-10-rn-core.md)
- [Sprint 11: React Native - User Features](./sprint-11-rn-user.md)
- [Sprint 12: React Native - Merchant Features](./sprint-12-rn-merchant.md)
- [Sprint 13: React Native - Admin Features](./sprint-13-rn-admin.md)
- [Sprint 14: Integration Testing & Polish](./sprint-14-integration-testing.md)

## Success Criteria

- All API endpoints documented with OpenAPI/Swagger
- 80%+ test coverage across backend
- Frontend passes E2E tests for critical user flows
- Payment integration works with VNPay/Momo sandbox
- Maps display venues in Hanoi correctly
- Dynamic pricing calculates correctly per PRD formula

---

## Validation Log

### Session 1 — 2026-04-07
**Trigger:** Initial plan validation before implementation
**Questions asked:** 8

#### Questions & Answers

1. **[Architecture]** The plan uses a monolithic FastAPI architecture. Should this be reconsidered for future scaling?
   - Options: Keep monolithic | Modular monolith | Microservices now
   - **Answer:** Keep monolithic
   - **Rationale:** Monolithic architecture is simpler for MVP. Can split into microservices later if needed. Faster initial development and deployment.

2. **[Platform]** The plan assumes Android-only development. Should iOS be included from the start?
   - Options: Android-only MVP | Both platforms now | Web version first
   - **Answer:** Android-only MVP
   - **Rationale:** Focus on Android first to achieve faster time to market. iOS can be added after Android is stable.

3. **[Booking Logic]** How should venue availability and booking conflicts be handled to prevent race conditions?
   - Options: Database locks | Optimistic locking | Background queue
   - **Answer:** Database locks
   - **Rationale:** Use SELECT FOR UPDATE in PostgreSQL transactions. Prevents double booking with stronger guarantees at the cost of potential slower concurrent requests.

4. **[Notifications]** Should real-time notifications (WebSocket/FCM) be included or added later?
   - Options: Add later (Phase 2) | Include now | Hybrid approach
   - **Answer:** Add later (Phase 2)
   - **Rationale:** Use polling for now. Add WebSocket/FCM push notifications after core booking flow is stable to reduce initial complexity.

5. **[Payment Flow]** What should be the order of merchant approval and payment in the booking flow?
   - Options: Approve before pay | Pay before approve | Instant booking
   - **Answer:** Pay before approve
   - **Rationale:** User pays immediately, merchant approves/rejects after payment. Faster booking experience but requires robust refund process for rejected bookings.

6. **[Data Seeding]** How should the initial venue data be populated for the app launch?
   - Options: Real Hanoi venues | Generated data | Hybrid approach
   - **Answer:** Generated data
   - **Rationale:** Use generated/fake venue data for faster initial development. Real venue data can be added before production launch.

7. **[Time Zones]** How should time zones be handled given all venues are in Hanoi?
   - Options: Fixed Hanoi timezone | Per-venue timezone | UTC backend
   - **Answer:** Fixed Hanoi timezone
   - **Rationale:** Use Asia/Ho_Chi_Minh (GMT+7) timezone throughout. Simpler implementation since all venues are in Hanoi area.

8. **[Maps Integration]** Which map solution should be used for venue browsing?
   - Options: Google Maps SDK | Leaflet WebView | Static images
   - **Answer:** Leaflet WebView
   - **Rationale:** Use WebView with Leaflet + OpenStreetMap. No API key or billing setup required, aligns with PRD specification.

#### Confirmed Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| Backend Architecture | Monolithic FastAPI | Simpler MVP, can split later |
| Mobile Platform | Android-only MVP | Faster time to market, iOS later |
| Concurrency Control | Database locks (SELECT FOR UPDATE) | Strong consistency, may slow under load |
| Real-time Updates | Polling (Phase 1) | Reduced complexity, add WebSocket later |
| Payment Flow | Pay before merchant approve | Faster UX, needs refund logic |
| Initial Data | Generated venue data | Faster development |
| Timezone | Fixed GMT+7 (Hanoi) | Simpler pricing/time logic |
| Maps | Leaflet WebView (OSM) | No API key needed, PRD compliant |

#### Action Items

- [ ] **Sprint 4**: Update booking flow to implement "pay before approve" with refund logic for rejected bookings
- [ ] **Sprint 4**: Add SELECT FOR UPDATE to availability checking in booking service
- [ ] **Sprint 6**: Implement Leaflet WebView for maps instead of Google Maps SDK
- [ ] **Sprint 6**: Use Asia/Ho_Chi_Minh timezone for all time calculations
- [ ] **Sprint 1**: Generate realistic fake venue data with Hanoi districts
- [ ] **Future**: Add WebSocket/FCM notifications to Phase 2 roadmap
- [ ] **Future**: Document iOS port considerations for later phase

#### Impact on Phases

| Phase | Changes Required |
|-------|------------------|
| Sprint 1 (Database) | Use generated venue data script; ensure all timestamps use GMT+7 |
| Sprint 4 (Booking) | Implement pay-before-approve flow; add SELECT FOR UPDATE for availability checks; include refund logic for rejected bookings |
| Sprint 5 (Payment) | Add refund processing for merchant-rejected bookings; handle refund edge cases |
| Sprint 6 (Maps) | Use react-native-webview with Leaflet + OSM instead of Google Maps SDK |
| Sprint 10 (RN Core) | Android-only configuration; document iOS considerations for future |
| Sprint 14 (Testing) | Test refund flow; test concurrent booking scenarios with locks |
