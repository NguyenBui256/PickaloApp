---
title: "Sprint 5: Payment Integration"
description: "VNPay/Momo payment gateway integration, payment status handling, and refund processing"
status: pending
priority: P1
effort: 12h
tags: [payment, vnpay, momo, webhook]
created: 2026-04-06
---

# Sprint 5: Payment Integration

## Overview

Integrate Vietnamese payment gateways (VNPay, Momo) for booking payments, handle payment status callbacks, and implement refund logic.

**Priority:** P1 (High - required for booking completion)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.2: Payment integration)
- Sprint 4: `./sprint-04-booking-pricing.md` (Booking dependencies)

## Key Insights

1. **Vietnamese Gateways**: VNPay (banking), Momo (e-wallet) are standard
2. **Payment Flow**: Create → Redirect to gateway → Callback → Confirm booking
3. **Webhook Security**: Validate HMAC signatures from gateways
4. **Idempotency**: Handle duplicate webhook callbacks safely
5. **QR Code**: Support QR transfer with auto-status update

## Requirements

### Functional Requirements

1. **Create Payment**: Generate payment URL for booking
2. **VNPay Integration**: Redirect to VNPay, handle callback
3. **Momo Integration**: Redirect to Momo, handle callback
4. **QR Payment**: Generate QR code, manual confirmation
5. **Payment Callback**: Process webhook, update booking status
6. **Payment Status**: Check payment status from gateway
7. **Refund**: Process refunds for cancelled bookings
8. **Payment History**: List user's payment transactions

### Non-Functional Requirements

1. **Security**: HMAC signature validation for all callbacks
2. **Idempotency**: Handle duplicate callbacks safely
3. **Timeout Handling**: Expire unpaid bookings after 15 minutes
4. **Logging**: Log all payment transactions for audit

## Architecture

### Payment Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────┐
│ Client  │         │  API    │         │ Gateway  │         │  Bank   │
└────┬────┘         └────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                   │                    │
     │ POST /payments    │                   │                    │
     │──────────────────>│                   │                    │
     │                   │ Create payment    │                    │
     │                   │──────────────────>│                    │
     │                   │<──────────────────│                    │
     │ payment_url       │                   │                    │
     │<──────────────────│                   │                    │
     │ Redirect          │                   │                    │
     │──────────────────────────────────────>│                    │
     │                   │                   │ User pays          │
     │                   │                   │───────────────────>│
     │                   │                   │<───────────────────│
     │                   │ Callback webhook  │                    │
     │                   │<──────────────────│                    │
     │                   │ Update booking    │                    │
     │                   │──────────────────>│ DB                 │
     │                   │                   │                    │
     │ GET /payments/:id │                   │                    │
     │──────────────────>│                   │                    │
     │ payment status    │                   │                    │
     │<──────────────────│                   │                    │
```

### Payment States

```
PENDING → PROCESSING → SUCCESS
               ↓
            FAILED
               ↓
            REFUNDED
```

### Database Schema Addition

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    payment_method VARCHAR(50) NOT NULL,  -- VNPAY, MOMO, QR_TRANSFER
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    -- VNPay/Momo fields
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    -- QR transfer fields
    qr_code_url TEXT,
    qr_expires_at TIMESTAMP,
    -- Refund fields
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/models/payment.py` | Payment model |
| `backend/app/schemas/payment.py` | Payment Pydantic schemas |
| `backend/app/services/vnpay.py` | VNPay integration |
| `backend/app/services/momo.py` | Momo integration |
| `backend/app/services/payment.py` | Payment business logic |
| `backend/app/api/v1/payments.py` | Payment endpoints |
| `backend/app/api/v1/webhooks.py` | Webhook handlers |
| `backend/tests/test_payments.py` | Payment tests |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/booking.py` | Add payment relationship |
| `backend/app/core/config.py` | Add payment gateway configs |
| `backend/alembic/versions/` | Add payments migration |

## Implementation Steps

### Step 1: Create Payment Model (1h)

1. Create `backend/app/models/payment.py`:
   - Payment model with fields from schema
   - Relationship to Booking and User
   - Payment status enum
   - Payment method enum

### Step 2: Create Payment Schemas (1.5h)

1. Create `backend/app/schemas/payment.py`:

**Schemas:**
- `PaymentCreateRequest`: booking_id, payment_method
- `PaymentResponse`: id, amount, status, payment_url
- `PaymentStatusResponse`: status, transaction details
- `VNPayCallbackResponse`: vnp_TxnRef, vnp_ResponseCode, etc.
- `MomoCallbackResponse**: partnerCode, orderId, statusCode, etc.
- `QRPaymentResponse`: qr_code_url, expires_at, bank_info
- `RefundRequest`: reason
- `RefundResponse`: refund_id, amount, status

### Step 3: Implement VNPay Integration (2h)

1. Create `backend/app/services/vnpay.py`:

**Functions:**
- `create_payment(booking_id, amount, return_url)`: Generate VNPay payment URL
- `generate_signature(params, secret_key)`: Create HMAC SHA512 signature
- `verify_signature(params, signature)`: Validate callback signature
- `process_callback(params)`: Process VNPay callback
- `query_transaction(transaction_id)`: Check payment status

**VNPay Configuration:**
```python
VNPAY_TMN_CODE = "YOUR_MERCHANT_ID"
VNPAY_HASH_SECRET = "YOUR_SECRET_KEY"
VNPAY_PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_QUERY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
```

### Step 4: Implement Momo Integration (2h)

1. Create `backend/app/services/momo.py`:

**Functions:**
- `create_payment(booking_id, amount, return_url)`: Generate Momo payment URL
- `generate_signature(params, secret_key)`: Create HMAC SHA256 signature
- `verify_signature(params, signature)`: Validate callback
- `process_callback(params)`: Process Momo callback
- `query_transaction(transaction_id)`: Check status

**Momo Configuration:**
```python
MOMO_PARTNER_CODE = "YOUR_PARTNER_CODE"
MOMO_ACCESS_KEY = "YOUR_ACCESS_KEY"
MOMO_SECRET_KEY = "YOUR_SECRET_KEY"
MOMO_PAYMENT_URL = "https://test-payment.momo.vn/gateway_payment"
```

### Step 5: Create Payment Service (2h)

1. Create `backend/app/services/payment.py`:

**Functions:**
- `create_payment(booking_id, user_id, method, return_url)`: Create payment record
- `process_vnpay_callback(params)`: Validate and process VNPay callback
- `process_momo_callback(params)`: Validate and process Momo callback
- `generate_qr_payment(booking_id)`: Generate QR code for transfer
- `confirm_qr_payment(payment_id)`: Manual confirmation by admin
- `get_payment_status(payment_id)`: Return current status
- `process_refund(payment_id, reason)`: Initiate refund
- `handle_idempotent_callback(transaction_id, status)`: Handle duplicates
- `expire_pending_payments()`: Background job to expire unpaid

**Callback Processing:**
```python
def process_payment_callback(transaction_id, status, amount, gateway):
    # 1. Find payment by transaction_id
    # 2. Verify amount matches booking
    # 3. Update payment status
    # 4. Update booking status to CONFIRMED
    # 5. Handle idempotency (already processed)
```

### Step 6: Create Payment Endpoints (2h)

1. Create `backend/app/api/v1/payments.py`:

**POST /api/v1/payments**
- Auth: Required
- Input: booking_id, payment_method, return_url
- Logic: Create payment, generate payment URL
- Return: payment_id, payment_url, amount

**GET /api/v1/payments/:id**
- Auth: Required
- Return: Payment status and details

**GET /api/v1/payments/:id/qr**
- Auth: Required
- Logic: Generate QR code for bank transfer
- Return: qr_code_url, bank_info, expires_at

**POST /api/v1/payments/:id/refund**
- Auth: Required
- Input: reason
- Logic: Validate booking status, process refund
- Return: refund details

**GET /api/v1/bookings/:id/payment**
- Auth: Required
- Return: Payment info for booking

### Step 7: Create Webhook Endpoints (1h)

1. Create `backend/app/api/v1/webhooks.py`:

**POST /api/v1/webhooks/vnpay**
- Auth: None (signature validated)
- Input: VNPay callback parameters
- Logic: Verify signature, process payment
- Return: JSON response for VNPay

**POST /api/v1/webhooks/momo**
- Auth: None (signature validated)
- Input: Momo callback parameters
- Logic: Verify signature, process payment
- Return: JSON response for Momo

### Step 8: Update Booking Flow (30m)

1. Modify booking creation:
   - When booking is created, status remains PENDING
   - Payment URL is returned
   - Booking confirmed only after payment success

2. Add booking auto-expire:
   - Cron job to cancel unpaid bookings after 15 min

### Step 9: Write Tests (1.5h)

1. Create `tests/test_payments.py`:
   - Test VNPay payment creation
   - Test Momo payment creation
   - Test VNPay callback processing
   - Test Momo callback processing
   - Test signature validation
   - Test idempotent callback handling
   - Test QR generation
   - Test refund processing

## Todo List

- [ ] Create Payment model
- [ ] Create payment Pydantic schemas
- [ ] Implement VNPay signature generation
- [ ] Implement VNPay payment creation
- [ ] Implement VNPay callback processing
- [ ] Implement Momo signature generation
- [ ] Implement Momo payment creation
- [ ] Implement Momo callback processing
- [ ] Create payment service with idempotency
- [ ] Implement QR code generation
- [ ] Create payment endpoints
- [ ] Create webhook endpoints
- [ ] Add payment status to booking
- [ ] Implement refund logic
- [ ] Write payment tests

## Success Criteria

1. **VNPay**: Payment URL generated, callback processed
2. **Momo**: Payment URL generated, callback processed
3. **Webhook Security**: Signature validation prevents tampering
4. **Idempotency**: Duplicate callbacks don't cause double payment
5. **Booking Status**: Payment success confirms booking
6. **Refund**: Cancelled bookings can be refunded
7. **Tests**: All payment tests pass

## Test Scenarios

### Payment Creation
```bash
# Test 1: Create VNPay payment
POST /api/v1/payments
Authorization: Bearer <user_token>
{
  "booking_id": "{uuid}",
  "payment_method": "VNPAY",
  "return_url": "https://app://payment/success"
}
# Expected: 201 Created, returns payment_url

# Test 2: Create Momo payment
POST /api/v1/payments
{
  "payment_method": "MOMO",
  ...
}
# Expected: 201 Created, returns payment_url

# Test 3: Generate QR payment
GET /api/v1/payments/{id}/qr
# Expected: 200 OK, returns qr_code_url
```

### Webhook Callbacks
```bash
# Test 4: VNPay success callback
POST /api/v1/webhooks/vnpay
{
  "vnp_TxnRef": "payment_id",
  "vnp_ResponseCode": "00",  # Success
  "vnp_SecureHash": "valid_signature"
}
# Expected: 200 OK, payment.status=SUCCESS, booking.status=CONFIRMED

# Test 5: VNPay failed callback
POST /api/v1/webhooks/vnpay
{
  "vnp_ResponseCode": "01"  # Failed
}
# Expected: 200 OK, payment.status=FAILED

# Test 6: Invalid signature
POST /api/v1/webhooks/vnpay
{
  "vnp_SecureHash": "invalid"
}
# Expected: 400 Bad Request

# Test 7: Idempotent callback (duplicate)
POST /api/v1/webhooks/vnpay
{ same success callback }
# Expected: 200 OK, no duplicate processing
```

### Refunds
```bash
# Test 8: Refund successful payment
POST /api/v1/payments/{id}/refund
Authorization: Bearer <user_token>
{
  "reason": "Changed plans"
}
# Expected: 200 OK, payment.status=REFUNDED

# Test 9: Refund failed payment
POST /api/v1/payments/{failed_id}/refund
# Expected: 400 Bad Request, cannot refund failed payment
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Webhook signature bypass | Critical | Always validate HMAC, never skip |
| Duplicate payment | High | Idempotency check by transaction_id |
| Payment gateway downtime | Medium | Queue callbacks, retry logic |
| Refund window exceeded | Medium | Check gateway refund policy |

## Security Considerations

1. **Signature Validation**: Always validate HMAC signatures
2. **Idempotency**: Check for already processed transactions
3. **Amount Verification**: Verify callback amount matches booking
4. **Webhook Rate Limiting**: Prevent abuse
5. **Logging**: Log all payment transactions for audit
6. **HTTPS Only**: Production must use TLS

## Next Steps

1. Sprint 6: Maps and search functionality
2. Sprint 11: Frontend payment flow

## Dependencies

- Requires: Sprint 1 (Database Models)
- Requires: Sprint 2 (Authentication)
- Requires: Sprint 4 (Booking & Pricing)
- Blocks: Sprint 11 (RN User Features)

## Payment Gateway Credentials (Sandbox)

**VNPay Sandbox:**
- URL: https://sandbox.vnpayment.vn
- Test cards: Available in VNPay documentation

**Momo Sandbox:**
- URL: https://test-payment.momo.vn
- Test accounts: Available in Momo documentation
