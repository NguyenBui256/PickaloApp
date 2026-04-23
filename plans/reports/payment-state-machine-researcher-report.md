# Payment State Machine Research Report

## Executive Summary

This research analyzes payment state machine design patterns for the PickAlo sports facility booking platform. The research covers state management, status transitions, idempotency patterns, webhook retry strategies, payment reconciliation, and SQLAlchemy async patterns for payment processing.

## Current System Analysis

### Existing Booking Status Implementation
From the current codebase analysis (`backend/app/models/booking.py`), the system implements a basic booking status system:

```python
class BookingStatus(str, Enum):
    PENDING = "PENDING"      # Created by user, awaiting merchant approval
    CONFIRMED = "CONFIRMED"  # Approved by merchant
    CANCELLED = "CANCELLED"  # Cancelled by user, merchant, or admin
    COMPLETED = "COMPLETED"  # Booking time has passed
    EXPIRED = "EXPIRED"      # Payment timeout (15 minutes)
```

### Current Payment Flow
The current system has basic payment fields:
- `payment_method`: Payment gateway used
- `payment_id`: Transaction ID from payment provider
- `paid_at`: Payment completion timestamp
- `is_paid`: Computed property to check payment status

However, there is no detailed payment state machine to handle complex payment scenarios.

## Payment State Machine Design Patterns

### 1. Comprehensive Payment States

#### Core States:
- **PENDING**: Payment initiated, waiting for processing
- **PROCESSING**: Currently being processed by payment gateway
- **SUCCESS**: Payment completed successfully
- **FAILED**: Payment failed for any reason
- **VOIDED**: Payment cancelled before completion
- **REFUNDED**: Payment refunded after success
- **PARTIALLY_REFUNDED**: Only part of the payment refunded

#### Extended States for Complex Workflows:
- **AUTHORIZATION_REQUIRED**: 3D Secure authentication needed
- **CHALLENGE_REQUIRED**: Additional verification required
- **PENDING_RETRY**: Failed, scheduled for retry
- **MANUAL_REVIEW**: Requires human intervention
- **PARTIAL_SUCCESS**: Partial payment completed
- **REFUND_PENDING**: Refund initiated but not completed
- **REFUND_PROCESSING**: Refund in progress
- **REFUND_SUCCESS**: Refund completed
- **REFUND_FAILED**: Refund failed

### 2. State Transition Matrix

| From | To | Trigger | Conditions |
|------|----|---------|------------|
| **PENDING** | PROCESSING | Payment gateway initiated | Valid payment method, amount > 0 |
| **PENDING** | FAILED | Immediate validation failure | Invalid card, insufficient funds |
| **PENDING** | VOIDED | User cancellation | User cancels payment |
| **PROCESSING** | SUCCESS | Gateway response | Authentication successful, funds captured |
| **PROCESSING** | FAILED | Gateway error | Network timeout, gateway unavailable |
| **PROCESSING** | AUTHORIZATION_REQUIRED | 3D Secure | High-risk transaction, requires authentication |
| **PROCESSING** | PENDING_RETRY | Retry mechanism | Transient failure, retry scheduled |
| **SUCCESS** | REFUNDED | Refund request | Full refund initiated |
| **SUCCESS** | PARTIALLY_REFUNDED | Partial refund | Partial refund initiated |
| **SUCCESS** | REFUND_FAILED | Refund failure | Refund failed but original payment successful |
| **FAILED** | PENDING_RETRY | Retry | Temporary failure, automatic retry |
| **FAILED** | VOIDED | User abandonment | User gives up on failed payment |
| **FAILED** | MANUAL_REVIEW | System escalation | Multiple failures, requires human review |

### 3. Event-Driven State Machine Pattern

#### Key Events:
- `payment_initiated`: Payment request received
- `validation_completed`: Initial validation finished
- `processing_started`: Gateway processing began
- `authentication_completed`: 3D Secure/auth completed
- `processing_completed`: Gateway processing finished
- `payment_successful`: Payment completed successfully
- `payment_failed`: Payment failed
- `refund_initiated`: Refund requested
- `refund_completed`: Refund finished
- `payment_expired`: Payment timeout

#### State Machine Implementation Pattern:

```python
class PaymentStateMachine:
    def __init__(self):
        self.transitions = {
            'PENDING': {
                'PROCESSING': ['payment_initiated', 'validation_completed'],
                'FAILED': ['validation_failed'],
                'VOIDED': ['payment_cancelled'],
                'AUTHORIZATION_REQUIRED': ['validation_completed', 'high_risk_detected']
            },
            'PROCESSING': {
                'SUCCESS': ['payment_successful'],
                'FAILED': ['processing_failed'],
                'AUTHORIZATION_REQUIRED': ['authentication_required'],
                'PENDING_RETRY': ['retry_scheduled']
            },
            'SUCCESS': {
                'REFUNDED': ['refund_initiated', 'refund_completed'],
                'PARTIALLY_REFUNDED': ['partial_refund_completed'],
                'MANUAL_REVIEW': ['fraud_detected']
            }
        }

    def transition(self, current_state, event, data=None):
        allowed_transitions = self.transitions.get(current_state, {})

        if event in allowed_transitions:
            new_state = allowed_transitions[event]
            self._validate_transition(current_state, new_state, data)
            self._log_transition(current_state, new_state, event, data)
            return new_state

        raise InvalidTransitionException(f"Cannot transition from {current_state} via {event}")
```

## Idempotency Patterns for Payment Operations

### 1. Idempotency Key Strategy
- Generate unique idempotency key for each payment request
- Store key-value pairs in database
- Use hash or UUID format for keys

### 2. Idempotency Implementation

```python
class PaymentIdempotencyService:
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.idempotency_key_expiry = 24 * 3600  # 24 hours

    async def execute_payment_with_idempotency(self, payment_data):
        idempotency_key = self._generate_idempotency_key(payment_data)

        # Check if this exact payment has been processed
        existing_result = await self.redis_client.get(f"idempotency:{idempotency_key}")
        if existing_result:
            return json.loads(existing_result)

        # Process payment
        result = await self._process_payment(payment_data)

        # Store result for idempotency
        await self.redis_client.setex(
            f"idempotency:{idempotency_key}",
            self.idempotency_key_expiry,
            json.dumps(result)
        )

        return result
```

### 3. Idempotency Best Practices
- Use business keys for idempotency (customer_id + venue_id + date + time)
- Set appropriate TTL for idempotency keys
- Include payment amount and currency in idempotency check
- Handle concurrent idempotency requests gracefully

## Webhook Retry Strategies

### 1. Exponential Backoff Implementation

```python
class WebhookRetryService:
    def __init__(self, max_retries=5, base_delay=1):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = 300  # 5 minutes max delay

    async def schedule_webhook_retry(self, webhook_data, failed_attempts=0):
        if failed_attempts >= self.max_retries:
            return await self._mark_as_failed(webhook_data)

        # Calculate exponential backoff with jitter
        delay = min(self.base_delay * (2 ** failed_attempts), self.max_delay)
        jitter = random.uniform(0.1, 0.5) * delay
        retry_time = datetime.utcnow() + timedelta(seconds=delay + jitter)

        # Schedule retry
        await self._schedule_retry(webhook_data, retry_time, failed_attempts + 1)
```

### 2. Retry Strategy Components
- **Immediate retry**: For transient failures (network issues, timeouts)
- **Exponential backoff**: Increasing delay between retries
- **Jitter**: Prevent retry storms from multiple failed requests
- **Maximum retries**: Prevent infinite retry loops
- **Dead letter queue**: For permanently failed webhooks

### 3. Webhook Processing Pattern

```python
class WebhookProcessor:
    async def process_webhook(self, webhook_data):
        try:
            # Validate webhook signature
            self._validate_signature(webhook_data)

            # Parse webhook payload
            payload = self._parse_payload(webhook_data)

            # Find corresponding payment
            payment = await self._find_payment(payload.payment_id)

            # Update payment state
            updated_payment = await self._update_payment_state(payment, payload)

            # Send confirmation
            await self._send_confirmation(updated_payment)

        except SignatureValidationError:
            await self._retry_or_fail(webhook_data, "invalid_signature")
        except PaymentNotFoundError:
            await self._retry_or_fail(webhook_data, "payment_not_found")
        except Exception as e:
            await self._retry_or_fail(webhook_data, f"processing_error: {str(e)}")
```

## Payment Reconciliation Patterns

### 1. Transaction Matching System

```python
class PaymentReconciliationService:
    async def reconcile_transactions(self):
        # Get all payments from our system
        our_payments = await self._get_our_payments()

        # Get all transactions from payment gateway
        gateway_transactions = await self._get_gateway_transactions()

        # Match transactions
        matched = await self._match_transactions(our_payments, gateway_transactions)

        # Identify discrepancies
        discrepancies = await self._identify_discrepancies(matched)

        # Generate reconciliation report
        report = await self._generate_report(discrepancies)

        return report

    async def _match_transactions(self, our_payments, gateway_transactions):
        matched = []

        for our_payment in our_payments:
            matching_gateway = await self._find_match(our_payment, gateway_transactions)

            if matching_gateway:
                matched.append({
                    'our_payment': our_payment,
                    'gateway_transaction': matching_gateway,
                    'status': 'matched',
                    'match_quality': self._calculate_match_quality(our_payment, matching_gateway)
                })
            else:
                matched.append({
                    'our_payment': our_payment,
                    'gateway_transaction': None,
                    'status': 'unmatched',
                    'discrepancy_type': 'gateway_missing'
                })

        return matched
```

### 2. Reconciliation Rules

| Discrepancy Type | Action | Resolution |
|------------------|--------|-----------|
| **Amount Mismatch** | Flag for manual review | Investigate pricing calculation |
| **Status Mismatch** | Investigate both systems | Check gateway vs our state |
| **Missing Transaction** | Investigate | Create investigation ticket |
| **Duplicate Transaction** | Refund duplicate | Process refund and update records |
| **Timing Delay** | Monitor | Set alert if exceeds threshold |

### 3. Daily Reconciliation Process
1. **Morning reconciliation**: Match overnight transactions
2. **Hourly reconciliation**: Monitor for discrepancies
3. **Real-time alerts**: Flag immediate issues
4. **Monthly reconciliation**: Comprehensive review

## SQLAlchemy Async Patterns for Payment Processing

### 1. Async Database Operations

```python
class PaymentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_payment(self, payment_data: dict) -> Payment:
        payment = Payment(**payment_data)
        self.session.add(payment)
        await self.session.flush()  # Get ID without commit
        return payment

    async def get_payment_by_id(self, payment_id: uuid.UUID) -> Payment | None:
        result = await self.session.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()

    async def update_payment_state(self, payment_id: uuid.UUID, new_state: PaymentStatus) -> Payment:
        payment = await self.get_payment_by_id(payment_id)
        if not payment:
            raise PaymentNotFoundError(payment_id)

        payment.status = new_state
        if new_state == PaymentStatus.SUCCESS:
            payment.paid_at = datetime.utcnow()

        await self.session.flush()
        return payment
```

### 2. Transaction Management Pattern

```python
class PaymentOrchestrator:
    async def process_payment(self, payment_data: dict):
        async with self.session.begin():
            # Create payment record
            payment = await self._create_payment(payment_data)

            # Process with payment gateway
            try:
                gateway_result = await self._process_with_gateway(payment)

                # Update payment state
                await self._update_payment_state(payment, gateway_result)

                # Schedule webhook if needed
                if gateway_result.needs_webhook:
                    await self._schedule_webhook(payment, gateway_result)

            except GatewayException as e:
                await self._handle_gateway_error(payment, e)
                raise
```

### 3. Connection Pool Configuration
```python
# FastAPI + SQLAlchemy Async configuration
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/pickaloapp"
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

## FastAPI Service Layer Patterns for Payment Logic

### 1. Service Architecture

```python
class PaymentService:
    def __init__(self,
                 payment_repo: PaymentRepository,
                 payment_gateway: PaymentGatewayInterface,
                 idempotency_service: PaymentIdempotencyService,
                 webhook_service: WebhookService):
        self.payment_repo = payment_repo
        self.payment_gateway = payment_gateway
        self.idempotency_service = idempotency_service
        self.webhook_service = webhook_service

    async def create_payment(self, payment_request: PaymentCreateRequest) -> PaymentResponse:
        # Check idempotency
        result = await self.idempotency_service.execute_payment_with_idempotency(payment_request)

        if result:
            return PaymentResponse(**result)

        # Create payment
        payment = await self.payment_repo.create_payment({
            'user_id': payment_request.user_id,
            'venue_id': payment_request.venue_id,
            'amount': payment_request.amount,
            'currency': payment_request.currency,
            'status': PaymentStatus.PENDING,
            'booking_id': payment_request.booking_id
        })

        # Process with gateway
        try:
            gateway_result = await self.payment_gateway.process_payment(payment)

            # Update payment state
            updated_payment = await self.payment_repo.update_payment_state(
                payment.id, gateway_result.status
            )

            return PaymentResponse(**updated_payment.to_dict())

        except Exception as e:
            # Handle payment failure
            await self.payment_repo.update_payment_state(
                payment.id, PaymentStatus.FAILED
            )
            raise PaymentProcessingException(f"Payment failed: {str(e)}")
```

### 2. Dependency Injection Pattern

```python
class PaymentDependencies:
    def __init__(self, config: PaymentConfig):
        self.config = config
        self.session = Depends(get_db)
        self.payment_repo = PaymentRepository
        self.payment_gateway = PaymentGatewayFactory.create(config.gateway_type)
        self.idempotency_service = PaymentIdempotencyService
        self.webhook_service = WebhookService

    def get_payment_service(self) -> PaymentService:
        return PaymentService(
            payment_repo=self.payment_repo(self.session),
            payment_gateway=self.payment_gateway,
            idempotency_service=self.idempotency_service,
            webhook_service=self.webhook_service
        )
```

### 3. API Endpoint Structure

```python
router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("", response_model=PaymentResponse)
async def create_payment(
    request: PaymentCreateRequest,
    payment_service: Annotated[PaymentService, Depends(PaymentDependencies().get_payment_service)]
) -> PaymentResponse:
    return await payment_service.create_payment(request)

@router.post("/{payment_id}/webhook", status_code=204)
async def webhook_handler(
    payment_id: str,
    webhook_data: WebhookPayload,
    payment_service: Annotated[PaymentService, Depends(PaymentDependencies().get_payment_service)]
) -> None:
    await payment_service.handle_webhook(payment_id, webhook_data)

@router.get("/{payment_id}/status", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    payment_service: Annotated[PaymentService, Depends(PaymentDependencies().get_payment_service)]
) -> PaymentStatusResponse:
    return await payment_service.get_payment_status(payment_id)
```

## Implementation Recommendations

### 1. Migration Strategy for PickAlo
1. **Phase 1**: Implement detailed payment state machine alongside existing booking states
2. **Phase 2**: Add idempotency service to prevent duplicate payments
3. **Phase 3**: Implement webhook processing with retry mechanisms
4. **Phase 4**: Add payment reconciliation system
5. **Phase 5**: Optimize async database operations

### 2. Key Files to Modify
- `backend/app/models/payment.py`: New payment model with detailed states
- `backend/app/services/payment.py`: Payment service with state machine
- `backend/app/api/v1/endpoints/payments.py`: Payment API endpoints
- `backend/app/schemas/payment.py`: Payment schemas and validation
- `backend/app/core/config.py`: Payment gateway configuration

### 3. Testing Strategy
1. **Unit tests**: State machine transitions and business logic
2. **Integration tests**: Payment gateway interactions
3. **End-to-end tests**: Complete payment flows
4. **Performance tests**: Concurrent payment processing
5. **Security tests**: Payment validation and idempotency

### 4. Monitoring and Alerting
- Payment success/failure rates
- Webhook processing success rates
- State transition anomalies
- Reconciliation discrepancies
- Performance metrics (processing times, database queries)

## Conclusion

The current PickAlo booking platform has a basic payment status system but lacks sophisticated payment state management. By implementing the comprehensive payment state machine patterns outlined in this research, the platform can handle complex payment scenarios, ensure data consistency, provide better user experience, and maintain financial integrity.

The key focus areas should be:
1. Detailed state machine with proper transitions
2. Idempotency to prevent duplicate payments
3. Robust webhook retry mechanisms
4. Payment reconciliation system
5. Async database operations for performance

This approach will create a solid foundation for payment processing that can scale with the platform's growth and handle the complexities of Vietnamese payment ecosystems like VNPay and Momo.