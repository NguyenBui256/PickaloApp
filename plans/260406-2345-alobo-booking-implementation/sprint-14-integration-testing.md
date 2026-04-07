---
title: "Sprint 14: Integration Testing & Polish"
description: "End-to-end testing, bug fixes, performance optimization, and deployment preparation"
status: pending
priority: P1
effort: 8h
tags: [testing, e2e, performance, deployment]
created: 2026-04-06
---

# Sprint 14: Integration Testing & Polish

## Overview

Comprehensive integration testing, bug fixes, performance optimization, and preparation for production deployment.

**Priority:** P1 (Critical - ensures quality before launch)
**Current Status:** Pending

## Context Links

- All previous sprints for integration points
- Sprint 0: `./sprint-00-infrastructure-setup.md` (Test setup)

## Key Insights

1. **Critical User Flows**: Test complete journeys from user perspective
2. **Edge Cases**: Test error scenarios and edge cases
3. **Performance**: Ensure app responds quickly
4. **Production Ready**: Prepare for deployment

## Requirements

### Functional Requirements

1. **E2E Tests**: Cover critical user journeys
2. **Integration Tests**: Test API endpoints with real database
3. **Performance Tests**: Load testing for APIs
4. **Bug Fixes**: Address issues found during testing
5. **Documentation**: Update API docs, deployment guides
6. **Deployment Prep**: Build configs, environment setup

### Non-Functional Requirements

1. **Test Coverage**: Backend 80%+, frontend 70%+
2. **Performance**: API response < 500ms (p95)
3. **Stability**: No critical bugs remaining

## Architecture

### Test Pyramid

```
                   ┌──────────────┐
                   │   E2E Tests  │  (Critical journeys)
                   │    Detox     │  5-10 tests
                   └──────┬───────┘
                      ┌────┴─────┐
           ┌──────────┴──────────┴──────────┐
           │      Integration Tests         │  (API + DB)
           │         pytest                 │  50+ tests
           └──────────┬─────────────────────┘
                      └──────┬─────────────┐
           ┌─────────────────────┴──────────┐
           │        Unit Tests              │  (Functions)
           │    pytest + jest               │  200+ tests
           └────────────────────────────────┘
```

### Critical User Flows to Test

1. **User Registration & Login**
2. **Venue Search & Booking**
3. **Payment Flow**
4. **Merchant Dashboard & Booking Approval**
5. **Admin Venue Verification**

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/tests/integration/test-booking-flow.py` | Booking E2E test |
| `backend/tests/integration/test-payment-flow.py` | Payment E2E test |
| `backend/tests/integration/test-merchant-flow.py` | Merchant flow test |
| `backend/tests/integration/test-admin-flow.py` | Admin flow test |
| `frontend/e2e/booking.e2e.ts` | Booking E2E (Detox) |
| `frontend/e2e/auth.e2e.ts` | Auth E2E |
| `frontend/e2e/merchant.e2e.ts` | Merchant E2E |
| `docs/api-documentation.md` | OpenAPI docs export |
| `docs/deployment-guide.md` | Deployment instructions |
| `docker-compose.prod.yml` | Production Docker setup |

### Files to Modify

| Path | Changes |
|------|---------|
| All previous files | Bug fixes based on test results |

## Implementation Steps

### Step 1: Backend Integration Tests (2h)

1. Create `backend/tests/integration/test-booking-flow.py`:

```python
import pytest
from datetime import date, time
from app.models import Booking, Venue, User

def test_complete_booking_flow(db_session, client, auth_headers):
    """Test complete booking flow from venue selection to payment"""

    # 1. Create test venue
    venue = Venue(
        merchant_id=merchant.id,
        name="Test Stadium",
        address="Hanoi",
        location="POINT(105.8542 21.0285)",
        venue_type="Football 5",
        base_price_per_hour=300000
    )
    db_session.add(venue)
    db_session.commit()

    # 2. Check availability
    response = client.get(
        f"/api/v1/venues/{venue.id}/availability",
        params={"date": "2026-04-10"}
    )
    assert response.status_code == 200
    slots = response.json()["slots"]
    assert len(slots) > 0

    # 3. Create booking
    response = client.post(
        "/api/v1/bookings",
        json={
            "venue_id": str(venue.id),
            "booking_date": "2026-04-10",
            "start_time": "10:00",
            "end_time": "11:00",
            "services": []
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    booking = response.json()
    assert booking["status"] == "PENDING"

    # 4. Get price preview
    response = client.post(
        "/api/v1/bookings/price-calculation",
        json={
            "venue_id": str(venue.id),
            "booking_date": "2026-04-10",
            "start_time": "10:00",
            "end_time": "11:00"
        }
    )
    assert response.status_code == 200
    assert response.json()["total_price"] == 300000

    # 5. Merchant approve
    merchant_headers = auth_headers_merchant(client)
    response = client.post(
        f"/api/v1/merchant/bookings/{booking['id']}/approve",
        headers=merchant_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED"

    # 6. User view booking
    response = client.get(
        f"/api/v1/bookings/{booking['id']}",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CONFIRMED"
```

2. Create similar tests for payment, merchant, admin flows

### Step 2: Backend Performance Tests (1h)

1. Create `backend/tests/performance/test-load.py`:

```python
import pytest
from locust import HttpUser, task, between

class ALOBOUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login
        response = self.client.post("/api/v1/auth/login", json={
            "phone": "+84901234567",
            "password": "password"
        })
        self.token = response.json()["access_token"]

    @task(3)
    def list_venues(self):
        self.client.get("/api/v1/venues")

    @task(2)
    def get_venue_details(self):
        self.client.get("/api/v1/venues/1")

    @task(1)
    def search_venues(self):
        self.client.get("/api/v1/venues?district=Hai+Ba+Trung")
```

### Step 3: Frontend E2E Tests with Detox (2h)

1. Create `frontend/e2e/booking.e2e.ts`:

```typescript
import { element, by, expect } from 'detox';

describe('Booking Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await login('+84901234567', 'password');
  });

  it('should complete a booking', async () => {
    // Navigate to venues
    await element(by.id('venues-tab')).tap();
    await expect(element(by.id('venue-list'))).toBeVisible();

    // Select venue
    await element(by.text('Sân bóng PTIT')).tap();
    await expect(element(by.id('venue-detail'))).toBeVisible();

    // Tap book button
    await element(by.id('book-button')).tap();

    // Select date
    await element(by.id('date-picker')).tap();
    await element(by.text('10')).tap();

    // Select time slot
    await element(by.id('time-slot-10:00')).tap();

    // Continue to services
    await element(by.id('continue-button')).tap();

    // Continue to payment
    await element(by.id('continue-button')).tap();

    // Select payment method
    await element(by.id('payment-vnpay')).tap();

    // Confirm booking
    await element(by.id('confirm-booking')).tap();

    // Verify success
    await expect(element(by.text('Đặt sân thành công'))).toBeVisible();
  });
});
```

2. Create tests for auth, merchant flows

### Step 4: Bug Fixes (1.5h)

1. Review test results
2. Fix critical bugs
3. Re-test to verify fixes

### Step 5: Performance Optimization (1h)

1. **Backend Optimizations**:
   - Add database indexes for slow queries
   - Implement response caching where appropriate
   - Optimize N+1 queries

2. **Frontend Optimizations**:
   - Implement image lazy loading
   - Add list virtualization for long lists
   - Optimize re-renders with React.memo

### Step 6: Documentation (30m)

1. Create `docs/api-documentation.md`:
   - Export OpenAPI spec
   - Document authentication
   - Document common errors

2. Create `docs/deployment-guide.md`:
   - Environment setup
   - Database migration
   - Docker deployment
   - Android build

### Step 7: Deployment Preparation (30m)

1. Create production environment files
2. Set up production database
3. Configure Android release build
4. Prepare VNPay/Momo production credentials

## Todo List

- [ ] Create booking integration test
- [ ] Create payment integration test
- [ ] Create merchant flow integration test
- [ ] Create admin flow integration test
- [ ] Create performance load test
- [ ] Create Detox E2E test for booking
- [ ] Create Detox E2E test for auth
- [ ] Create Detox E2E test for merchant
- [ ] Run all tests and fix failures
- [ ] Optimize slow database queries
- [ ] Add missing indexes
- [ ] Implement frontend performance optimizations
- [ ] Write API documentation
- [ ] Write deployment guide
- [ ] Prepare production build configs

## Success Criteria

1. **All Tests Pass**: Unit, integration, E2E tests all pass
2. **Test Coverage**: Backend 80%+, frontend 70%+
3. **Performance**: API p95 < 500ms
4. **No Critical Bugs**: All critical and high issues resolved
5. **Documentation Complete**: API docs and deployment guide ready
6. **Build Successful**: Production builds complete without errors

## Test Scenarios

### Integration Tests

```bash
# Test 1: Complete user booking flow
pytest tests/integration/test-booking-flow.py
# Expected: All steps pass

# Test 2: Payment flow
pytest tests/integration/test-payment-flow.py
# Expected: Payment created and processed

# Test 3: Merchant dashboard
pytest tests/integration/test-merchant-flow.py
# Expected: Dashboard loads, actions work

# Test 4: Admin moderation
pytest tests/integration/test-admin-flow.py
# Expected: Admin actions work correctly
```

### E2E Tests

```bash
# Test 5: User registration and login
detox test e2e/auth.e2e.ts
# Expected: User can register and login

# Test 6: Complete booking flow
detox test e2e/booking.e2e.ts
# Expected: Booking completed successfully

# Test 7: Merchant approve booking
detox test e2e/merchant.e2e.ts
# Expected: Booking approved
```

### Performance Tests

```bash
# Test 8: Load test
locust --host=http://localhost:8000
# Expected: Handles 100+ concurrent users
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test flakiness | Medium | Retry logic, stable test data |
| Slow tests | Low | Parallel execution |
| Production issues | High | Staging environment testing |

## Security Considerations

1. **Production Secrets**: Never commit production secrets
2. **API Rate Limiting**: Configure for production
3. **HTTPS Only**: Enforce HTTPS in production
4. **Input Validation**: Verify all inputs

## Next Steps

1. Production deployment
2. Monitoring setup
3. User acceptance testing

## Dependencies

- Requires: All previous sprints
- Final sprint before deployment

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Test coverage met
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Documentation complete
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking set up
- [ ] Production environment ready
- [ ] Android release build tested
