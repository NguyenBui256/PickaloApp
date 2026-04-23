---
title: "Sprint 5: Payment Integration"
description: "VNPay/Momo payment gateway integration, payment status handling, and refund processing"
status: pending
priority: P1
effort: 20h
tags: [payment, vnpay, momo, webhook, redis, idempotency]
created: 2026-04-06
updated: 2026-04-08
branch: master
---

# Sprint 5: Payment Integration

## Overview

Integrate Vietnamese payment gateways (VNPay, Momo) for booking payments, handle payment status callbacks, and implement refund logic with enhanced security, idempotency, and state machine patterns.

**Priority:** P1 (High - required for booking completion)
**Current Status:** Pending
**Total Estimated Effort:** 20 hours

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.2: Payment integration)
- Sprint 4: `./sprint-04-booking-pricing.md` (Booking dependencies)
- Research Reports:
  - `../../reports/vnpay-researcher-report.md`
  - `../../reports/momo-researcher-report.md`
  - `../../reports/payment-state-machine-researcher-report.md`
  - `../../reports/fastapi-payment-patterns-researcher-report.md`

## Key Insights from Research

### VNPay Integration
- **Authentication**: HMAC SHA512 signature required for all requests
- **Endpoints**: Create payment, Query status, Refund
- **Response Codes**: 00 (Success), 01 (Failed), 02 (Bank declined), 04 (Processing), 07 (Expired), 09 (Invalid signature)
- **IP Whitelist**: 203.162.4.190, 203.162.4.191, 14.160.91.46

### Momo Integration
- **Authentication**: HMAC SHA256 signature
- **Endpoints**: /v2/gateway/api/create, /v2/gateway/api/query, /v2/gateway/api/refund
- **Status Codes**: 0 (Success), 9994 (User cancelled), 9995 (Timeout), 9999 (Error)
- **Payment Type**: captureWallet for wallet payments

### State Machine Patterns
- **Enhanced States**: PENDING, PROCESSING, SUCCESS, FAILED, VOIDED, REFUNDED, PARTIALLY_REFUNDED, AUTHORIZATION_REQUIRED, PENDING_RETRY, MANUAL_REVIEW
- **Event-Driven Transitions**: payment_initiated, validation_completed, processing_completed, payment_successful, payment_failed, refund_initiated
- **Transition Validation**: Prevent invalid state changes with InvalidTransitionException

### Idempotency Requirements
- **Redis-based**: Use Redis for idempotency key storage with 24-hour TTL
- **Business Keys**: Use customer_id + venue_id + date + time for idempotency
- **Concurrent Handling**: Handle duplicate requests gracefully

### Webhook Retry Strategies
- **Exponential Backoff**: base_delay * (2 ** failed_attempts) with jitter
- **Maximum Retries**: 5 attempts before dead letter queue
- **Retry Triggers**: Transient failures (network issues, timeouts)

## Requirements

### Functional Requirements

1. **Create Payment**: Generate payment URL for booking with idempotency
2. **VNPay Integration**: Redirect to VNPay, handle callback with signature validation
3. **Momo Integration**: Redirect to Momo, handle callback with signature validation
4. **QR Payment**: Generate QR code, manual confirmation
5. **Payment Callback**: Process webhook with idempotency, update booking status
6. **Payment Status**: Check payment status from gateway with retry logic
7. **Refund**: Process refunds for cancelled bookings with validation
8. **Payment History**: List user's payment transactions
9. **Background Tasks**: Verify pending payments, cleanup expired, process webhook retries
10. **Reconciliation**: Daily reconciliation between system and gateway records

### Non-Functional Requirements

1. **Security**: HMAC signature validation for all callbacks
2. **Idempotency**: Handle duplicate callbacks safely using Redis
3. **Timeout Handling**: Expire unpaid bookings after 15 minutes
4. **Logging**: Log all payment transactions for audit with structured logging
5. **Monitoring**: Track success rates, processing times, failed payments
6. **Performance**: Sub-second response for payment status queries

## Architecture

### Enhanced Payment Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────┐         ┌───────┐
│ Client  │         │  API    │         │ Gateway  │         │  Bank   │         │ Redis │
└────┬────┘         └────┬────┘         └────┬─────┘         └────┬────┘         └───┬───┘
     │                   │                   │                    │                  │
     │ POST /payments    │                   │                    │                  │
     │──────────────────>│                   │                    │                  │
     │                   │ Check idempotency │                    │                  │
     │                   │──────────────────>│                    │                  │
     │                   │<──────────────────│                    │                  │
     │                   │ Create payment    │                    │                  │
     │                   │──────────────────>│                    │                  │
     │                   │<──────────────────│                    │                  │
     │ payment_url       │                   │                    │                  │
     │<──────────────────│                   │                    │                  │
     │ Redirect          │                   │                    │                  │
     │──────────────────────────────────────>│                    │                  │
     │                   │                   │ User pays          │                  │
     │                   │                   │───────────────────>│                  │
     │                   │                   │<───────────────────│                  │
     │                   │ Callback webhook  │                    │                  │
     │                   │<──────────────────│                    │                  │
     │                   │ Verify signature  │                    │                  │
     │                   │ Check idempotency │                    │                  │
     │                   │──────────────────>│                    │                  │
     │                   │ Update state      │                    │                  │
     │                   │──────────────────>│ DB                 │                  │
     │                   │                   │                    │                  │
     │ GET /payments/:id │                   │                    │                  │
     │──────────────────>│                   │                    │                  │
     │ payment status    │                   │                    │                  │
     │<──────────────────│                   │                    │                  │
```

### Enhanced Payment State Machine

```
                    ┌──────────────┐
                    │   PENDING    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │ VOIDED  │      │PROCESSING│     │ FAILED  │
    └─────────┘      └────┬────┘      └─────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │ SUCCESS │     │AUTH_REQ  │     │PENDING_ │
    └────┬────┘     │UIRED     │     │RETRY    │
         │          └──────────┘     └─────────┘
         │
    ┌────▼────┐
    │REFUNDED │
    └─────────┘
```

### Database Schema Addition

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Payment identification
    payment_method VARCHAR(20) NOT NULL,  -- VNPAY, MOMO, QR_TRANSFER, BANK_TRANSFER
    payment_status VARCHAR(20) DEFAULT 'PENDING',

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',

    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,

    -- Gateway transaction details
    transaction_id VARCHAR(255),
    gateway_response JSONB,

    -- QR transfer fields
    qr_code_url TEXT,
    qr_expires_at TIMESTAMP,

    -- Refund fields
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    refunded_at TIMESTAMP,

    -- State machine fields
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,
    webhook_received_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Webhook retry queue
CREATE TABLE webhook_retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    gateway VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_retry_next ON webhook_retry_queue(next_retry_at);
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/models/payment.py` | Payment model with enhanced states |
| `backend/app/schemas/payment.py` | Payment Pydantic schemas |
| `backend/app/services/vnpay.py` | VNPay integration with HMAC SHA512 |
| `backend/app/services/momo.py` | Momo integration with HMAC SHA256 |
| `backend/app/services/payment.py` | Payment business logic with state machine |
| `backend/app/services/payment_state_machine.py` | State machine implementation |
| `backend/app/services/idempotency.py` | Redis-based idempotency service |
| `backend/app/services/webhook_retry.py` | Webhook retry with exponential backoff |
| `backend/app/services/payment_reconciliation.py` | Daily reconciliation service |
| `backend/app/services/payment_background_tasks.py` | Background tasks scheduler |
| `backend/app/api/v1/endpoints/payments.py` | Payment endpoints |
| `backend/app/api/v1/endpoints/webhooks.py` | Webhook handlers with security |
| `backend/app/core/redis.py` | Redis client wrapper |
| `backend/app/core/exceptions.py` | Payment exception classes |
| `backend/app/monitoring/payment_monitor.py` | Payment monitoring and logging |
| `backend/tests/test_payment_service.py` | Payment service tests |
| `backend/tests/test_payment_integration.py` | Integration tests |
| `backend/tests/test_payment_e2e.py` | E2E tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/booking.py` | Add payment relationship |
| `backend/app/core/config.py` | Add payment gateway configs |
| `backend/app/api/deps.py` | Add payment dependencies |
| `backend/alembic/versions/` | Add payments migration |
| `docker-compose.yml` | Add Redis service |

## Implementation Phases

### Phase 1: Foundation (Infrastructure & Models) - 5.5h

**Dependencies:** None
**Output:** Payment model, state machine, idempotency service, Redis setup

#### 1.1 Set up Redis Infrastructure (2h)
- Update docker-compose.yml with Redis service
- Create backend/app/core/redis.py with connection pooling
- Configure environment variables
- Add Redis health check

#### 1.2 Create Payment Model (1.5h)
- Create backend/app/models/payment.py
- Implement PaymentStatus enum with all states
- Add all fields including idempotency_key, retry_count
- Create indexes for performance
- Add relationship to Booking

#### 1.3 Implement Idempotency Service (2h)
- Create backend/app/services/idempotency.py
- Implement IdempotencyService with Redis backend
- Add methods: check_and_set, get_result, is_processed
- Use SHA256 hash for keys
- Set 24-hour TTL
- Add unit tests

### Phase 2: Services (Gateway & Business Logic) - 13h

**Dependencies:** Phase 1
**Output:** Payment gateway services, factory, main payment service

#### 2.1 Create Payment State Machine (2h)
- Create backend/app/services/payment_state_machine.py
- Define state transition matrix
- Implement PaymentStateMachine class
- Add event-driven transitions
- Add InvalidTransitionException

#### 2.2 Create Payment Schemas (1.5h)
- Create backend/app/schemas/payment.py
- Define PaymentMethod, PaymentStatus enums
- Create all request/response schemas
- Add validation for amounts, booking IDs
- Add callback schemas for VNPay and Momo

#### 2.3 Implement VNPay Gateway Service (2.5h)
- Create backend/app/services/vnpay.py
- Implement PaymentProvider interface
- Add HMAC SHA512 signature generation/verification
- Implement create_payment, verify_payment, refund_payment
- Handle VNPay error codes
- Add query_transaction method

#### 2.4 Implement Momo Gateway Service (2h)
- Create backend/app/services/momo.py
- Implement PaymentProvider interface
- Add HMAC SHA256 signature generation/verification
- Implement create_payment, verify_payment, refund_payment
- Handle Momo status codes
- Add deep link generation

#### 2.5 Create Payment Gateway Factory (1.5h)
- Create backend/app/services/payment_gateway_factory.py
- Define PaymentProvider ABC
- Implement PaymentProviderFactory
- Add create_provider, get_supported_providers methods
- Update backend/app/api/deps.py with dependencies

#### 2.6 Implement Payment Service (3h)
- Create backend/app/services/payment.py
- Integrate IdempotencyService
- Integrate PaymentStateMachine
- Implement create_payment_session
- Add verify_payment_status with retry logic
- Add process_payment_callback with idempotency
- Add refund_payment with validation

#### 2.7 Implement Webhook Retry Service (2h)
- Create backend/app/services/webhook_retry.py
- Implement exponential backoff with jitter
- Add schedule_webhook_retry method
- Create webhook_retry_queue table
- Implement dead_letter_queue

### Phase 3: API & Endpoints - 8h

**Dependencies:** Phase 2
**Output:** REST API endpoints, webhook handlers, background tasks

#### 3.1 Create Payment Endpoints (2h)
- Create backend/app/api/v1/endpoints/payments.py
- POST /api/v1/payments - Create payment session
- GET /api/v1/payments/:id - Get payment status
- GET /api/v1/payments/:id/qr - Generate QR code
- POST /api/v1/payments/:id/refund - Process refund
- GET /api/v1/payments/methods - List available methods
- Add authentication and validation

#### 3.2 Create Webhook Endpoints (2h)
- Create backend/app/api/v1/endpoints/webhooks.py
- POST /api/v1/webhooks/vnpay - VNPay callback
- POST /api/v1/webhooks/momo - Momo callback
- Implement signature verification for both
- Add IP whitelist validation
- Add timestamp validation for replay prevention
- Return proper gateway responses

#### 3.3 Create Background Tasks (2h)
- Create backend/app/services/payment_background_tasks.py
- Implement verify_pending_payments (every 5 min)
- Implement cleanup_expired_payments
- Implement process_webhook_retries
- Add PaymentBackgroundTasks scheduler
- Integrate with FastAPI BackgroundTasks

#### 3.4 Create Exception Handlers (1h)
- Update backend/app/core/exceptions.py
- Add PaymentException base class
- Add specialized exceptions (Timeout, Verification, Refund)
- Add InvalidTransitionException
- Create FastAPI exception handlers
- Add consistent error response format

#### 3.5 Database Migrations (1h)
- Create Alembic migration for payments table
- Add webhook_retry_queue table
- Update bookings table with payment relationship
- Add all indexes
- Test migration rollback

### Phase 4: Testing & Configuration - 10.5h

**Dependencies:** Phase 3
**Output:** Comprehensive tests, configuration, monitoring

#### 4.1 Unit Tests (3h)
- Create tests/test_payment_service.py
- Test payment creation with idempotency
- Test state machine transitions
- Test signature generation/verification
- Test VNPay and Momo service methods
- Test webhook retry logic
- Use mock payment providers

#### 4.2 Integration Tests (2.5h)
- Create tests/test_payment_integration.py
- Test all payment endpoints
- Test webhook with valid/invalid signatures
- Test refund endpoint
- Test idempotency on duplicate requests
- Test error scenarios

#### 4.3 E2E Tests (2h)
- Create tests/test_payment_e2e.py
- Test complete booking -> payment -> webhook flow
- Test VNPay flow end-to-end
- Test Momo flow end-to-end
- Test QR code payment flow
- Test payment timeout
- Test refund flow

#### 4.4 Update Configuration (1h)
- Update backend/app/core/config.py
- Add VNPay configuration
- Add Momo configuration
- Add payment timeout settings
- Add retry configuration
- Add webhook security settings
- Add Redis configuration

#### 4.5 Create Monitoring (1.5h)
- Create backend/app/monitoring/payment_monitor.py
- Implement PaymentMonitor class
- Add structured logging
- Add metrics collection
- Create payment_metrics dashboard schema
- Add alerting for failed payments

### Phase 5: Deployment & Documentation - 4h

**Dependencies:** Phase 4
**Output:** Production-ready deployment, documentation

#### 5.1 Update Docker Compose (0.5h)
- Add Redis service
- Configure persistence
- Add healthcheck
- Update app dependencies

#### 5.2 Create Reconciliation Service (2h)
- Create backend/app/services/payment_reconciliation.py
- Implement reconcile_transactions method
- Add transaction matching logic
- Add discrepancy detection
- Add reconciliation report generation
- Add daily reconciliation task

#### 5.3 Create API Documentation (1.5h)
- Update OpenAPI/Swagger documentation
- Document all payment endpoints
- Add request/response examples
- Document webhook payload formats
- Add integration guide for frontend

#### 5.4 Security Review (0.5h)
- Verify HMAC signature implementations
- Review IP whitelist configuration
- Check timestamp validation
- Verify idempotency implementation
- Review error messages for data leakage

#### 5.5 Performance Testing (0.5h)
- Test payment creation under load
- Test webhook processing performance
- Verify Redis performance
- Check database query performance

## Detailed TODO List

See TaskList for comprehensive TODO items organized by phase.

## Success Criteria

1. **VNPay Integration**: Payment URL generated, callback processed, signature validated
2. **Momo Integration**: Payment URL generated, callback processed, signature validated
3. **Webhook Security**: Signature validation prevents tampering, IP whitelist enforced
4. **Idempotency**: Duplicate callbacks don't cause double payment (Redis-based)
5. **State Machine**: All valid state transitions work, invalid transitions blocked
6. **Booking Status**: Payment success confirms booking, failure expires booking
7. **Refund**: Cancelled bookings can be refunded with proper validation
8. **Background Tasks**: Pending payments verified, expired payments cleaned up
9. **Monitoring**: All payment events logged, metrics collected
10. **Tests**: All unit, integration, and E2E tests pass (80%+ coverage)

## Test Scenarios

### Payment Creation
```bash
# Test 1: Create VNPay payment with idempotency
POST /api/v1/payments
Authorization: Bearer <user_token>
X-Idempotency-Key: <unique_key>
{
  "booking_id": "{uuid}",
  "payment_method": "VNPAY",
  "return_url": "https://app://payment/success"
}
# Expected: 201 Created, returns payment_url

# Test 2: Duplicate request (same idempotency key)
POST /api/v1/payments
X-Idempotency-Key: <same_key>
{ same request }
# Expected: 200 OK, returns same payment (idempotent)

# Test 3: Create Momo payment
POST /api/v1/payments
{
  "payment_method": "MOMO",
  ...
}
# Expected: 201 Created, returns payment_url/deep_link

# Test 4: Generate QR payment
GET /api/v1/payments/{id}/qr
# Expected: 200 OK, returns qr_code_url, bank_info
```

### Webhook Callbacks
```bash
# Test 5: VNPay success callback
POST /api/v1/webhooks/vnpay
{
  "vnp_TxnRef": "payment_id",
  "vnp_ResponseCode": "00",
  "vnp_SecureHash": "valid_signature"
}
# Expected: 200 OK, payment.status=SUCCESS, booking.status=CONFIRMED

# Test 6: VNPay failed callback
POST /api/v1/webhooks/vnpay
{
  "vnp_ResponseCode": "01"
}
# Expected: 200 OK, payment.status=FAILED

# Test 7: Invalid signature
POST /api/v1/webhooks/vnpay
{
  "vnp_SecureHash": "invalid"
}
# Expected: 400 Bad Request

# Test 8: Idempotent callback (duplicate)
POST /api/v1/webhooks/vnpay
{ same success callback }
# Expected: 200 OK, no duplicate processing, same result

# Test 9: Momo success callback
POST /api/v1/webhooks/momo
{
  "partnerCode": "PARTNER_CODE",
  "transId": "TEST_TRANS_123",
  "requestId": "TEST_REQ_123",
  "amount": "10000",
  "responseCode": "0",
  "signature": "VALID_SIGNATURE"
}
# Expected: 200 OK, payment.status=SUCCESS
```

### State Transitions
```bash
# Test 10: Valid state transition
PATCH /api/v1/payments/{id}/state
{
  "event": "payment_initiated"
}
# Expected: 200 OK, PENDING -> PROCESSING

# Test 11: Invalid state transition
PATCH /api/v1/payments/{id}/state
{
  "event": "refund_initiated"
}
# Expected: 400 Bad Request (cannot refund from PENDING)
```

### Refunds
```bash
# Test 12: Refund successful payment
POST /api/v1/payments/{id}/refund
{
  "reason": "Changed plans"
}
# Expected: 200 OK, payment.status=REFUNDED

# Test 13: Refund failed payment
POST /api/v1/payments/{failed_id}/refund
# Expected: 400 Bad Request, cannot refund failed payment

# Test 14: Partial refund
POST /api/v1/payments/{id}/refund
{
  "amount": 50000,
  "reason": "Partial refund"
}
# Expected: 200 OK, payment.status=PARTIALLY_REFUNDED
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Webhook signature bypass | Critical | Always validate HMAC, never skip, use constant-time comparison |
| Duplicate payment | High | Redis-based idempotency with unique constraint |
| Payment gateway downtime | Medium | Webhook retry queue with exponential backoff |
| Redis failure | Medium | Graceful degradation, log idempotency failures |
| Refund window exceeded | Medium | Check gateway refund policy, warn users |
| State machine inconsistency | Medium | Transaction-based updates, audit logging |
| IP whitelist bypass | High | Use Cloudflare/NGINX for IP filtering |

## Security Considerations

1. **Signature Validation**: Always validate HMAC signatures using constant-time comparison
2. **Idempotency**: Use Redis for idempotency with SHA256 hash of business keys
3. **Amount Verification**: Verify callback amount matches booking amount
4. **Webhook Rate Limiting**: Prevent abuse with rate limiting
5. **IP Whitelisting**: Restrict webhook endpoints to gateway IPs
6. **Timestamp Validation**: Prevent replay attacks
7. **Logging**: Log all payment transactions without sensitive data
8. **HTTPS Only**: Production must use TLS
9. **Secrets Management**: Use environment variables, never hardcode secrets
10. **Error Messages**: Don't leak sensitive information in errors

## Monitoring & Alerting

### Metrics to Track
- Payment success rate (target: >95%)
- Payment processing time (p50, p95, p99)
- Webhook processing success rate
- Idempotency cache hit rate
- State transition anomalies
- Reconciliation discrepancies

### Alerts to Configure
- Payment success rate below 90%
- Webhook processing failures >5%
- Redis connection failures
- Payment gateway API errors
- Reconciliation discrepancies

## Next Steps

1. Sprint 6: Maps and search functionality
2. Sprint 11: Frontend payment flow integration

## Dependencies

- **Requires**: Sprint 1 (Database Models)
- **Requires**: Sprint 2 (Authentication)
- **Requires**: Sprint 4 (Booking & Pricing)
- **Blocks**: Sprint 11 (RN User Features)

## Payment Gateway Credentials (Sandbox)

**VNPay Sandbox:**
- URL: https://sandbox.vnpayment.vn
- Test cards: Available in VNPay documentation

**Momo Sandbox:**
- URL: https://test-payment.momo.vn
- Test accounts: Available in Momo documentation

## Unresolved Questions

1. Should we implement 3D Secure authentication for high-value transactions?
2. What is the refund window period for each gateway?
3. Do we need to support partial payments (installments)?
4. Should we implement fraud detection rules?
5. What is the daily reconciliation schedule?

## References

- VNPay Research: `../../reports/vnpay-researcher-report.md`
- Momo Research: `../../reports/momo-researcher-report.md`
- State Machine Research: `../../reports/payment-state-machine-researcher-report.md`
- FastAPI Patterns: `../../reports/fastapi-payment-patterns-researcher-report.md`
