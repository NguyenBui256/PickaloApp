# FastAPI Payment Integration Patterns and Best Practices Research Report

**Research Date:** 2026-04-08
**Project:** PickAlo - Sports Facility Booking Platform
**Target Payment Platforms:** VNPay, Momo, QR Code

---

## Executive Summary

This research provides comprehensive patterns and best practices for implementing payment integration in FastAPI applications, specifically tailored for the PickAlo sports booking platform. The report covers dependency injection, async processing, error handling, security, and testing strategies for multiple Vietnamese payment gateways.

---

## 1. FastAPI Dependency Injection for Payment Services

### 1.1 Service Layer Architecture

```python
# app/services/payment.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
import asyncio

class PaymentProvider(ABC):
    """Abstract base class for payment providers."""

    @abstractmethod
    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        """Create payment session."""
        pass

    @abstractmethod
    async def verify_payment(self, payment_id: str, transaction_id: str) -> Dict[str, Any]:
        """Verify payment status."""
        pass

    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        """Process refund."""
        pass

class VNPayService(PaymentProvider):
    """VNPay payment implementation."""

    def __init__(self, config: Dict[str, Any]):
        self.merchant_id = config['merchant_id']
        self.hash_secret = config['hash_secret']
        self.return_url = config['return_url']
        self.tmn_code = config['tmn_code']

    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        # Implementation details
        pass

    async def verify_payment(self, payment_id: str, transaction_id: str) -> Dict[str, Any]:
        # Implementation details
        pass

class MomoService(PaymentProvider):
    """Momo payment implementation."""

    def __init__(self, config: Dict[str, Any]):
        self.partner_code = config['partner_code']
        self.access_key = config['access_key']
        self.secret_key = config['secret_key']

    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        # Implementation details
        pass

class QRCodeService(PaymentProvider):
    """QR Code payment implementation."""

    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        # Implementation details
        pass
```

### 1.2 Factory Pattern for Payment Provider Selection

```python
# app/services/payment_factory.py
from typing import Dict, Type
from app.services.payment import VNPayService, MomoService, QRCodeService

class PaymentProviderFactory:
    """Factory for creating payment providers."""

    _providers: Dict[str, Type[PaymentProvider]] = {
        'vnpay': VNPayService,
        'momo': MomoService,
        'qrcode': QRCodeService,
    }

    @classmethod
    def create_provider(cls, provider_name: str, config: Dict[str, Any]) -> PaymentProvider:
        """Create payment provider instance."""
        if provider_name not in cls._providers:
            raise ValueError(f"Unsupported payment provider: {provider_name}")

        provider_class = cls._providers[provider_name]
        return provider_class(config)

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """Get list of supported providers."""
        return list(cls._providers.keys())
```

### 1.3 Dependency Injection Setup

```python
# app/api/deps.py
from fastapi import Depends, HTTPException
from app.services.payment import PaymentProvider
from app.services.payment_factory import PaymentProviderFactory

def get_payment_provider(provider_name: str, config: Dict[str, Any]) -> PaymentProvider:
    """Dependency for payment provider injection."""
    try:
        return PaymentProviderFactory.create_provider(provider_name, config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Dict, Any

class PaymentConfig(BaseSettings):
    """Payment configuration."""

    # VNPay configuration
    vnpay_merchant_id: str
    vnpay_hash_secret: str
    vnpay_return_url: str
    vnpay_tmn_code: str

    # Momo configuration
    momo_partner_code: str
    momo_access_key: str
    momo_secret_key: str

    # Default payment provider
    default_provider: str = "vnpay"

    class Config:
        env_file = ".env"

payment_config = PaymentConfig()

def get_payment_config() -> PaymentConfig:
    """Dependency for payment configuration."""
    return payment_config
```

---

## 2. Async Payment Processing Patterns

### 2.1 Payment Service with Async Operations

```python
# app/services/payment_service.py
import asyncio
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.booking import Booking
from app.services.payment import PaymentProvider
from app.schemas.payment import PaymentRequest, PaymentResponse, PaymentStatus

class PaymentService:
    """Service for handling payment operations."""

    def __init__(self, payment_provider: PaymentProvider):
        self.payment_provider = payment_provider
        self.payment_timeout = timedelta(minutes=15)  # Payment timeout
        self.max_retry_attempts = 3
        self.retry_delay = 5  # seconds

    async def create_payment_session(self, booking: Booking) -> PaymentResponse:
        """Create payment session for booking."""
        amount = booking.total_price

        # Generate unique payment reference
        payment_ref = str(uuid.uuid4())

        # Create payment with provider
        try:
            payment_data = await self.payment_provider.create_payment(
                amount=amount,
                description=f"Booking {booking.id} - {booking.venue.name}",
                booking_id=str(booking.id),
                user_id=str(booking.user_id)
            )

            # Update booking with payment details
            booking.payment_method = self.get_provider_name()
            booking.payment_id = payment_data['payment_id']

            return PaymentResponse(
                payment_id=payment_data['payment_id'],
                payment_url=payment_data.get('payment_url'),
                qr_code=payment_data.get('qr_code'),
                status=PaymentStatus.PENDING,
                created_at=datetime.now(),
                expires_at=datetime.now() + self.payment_timeout,
                amount=amount,
                currency="VND"
            )

        except Exception as e:
            raise PaymentException(f"Failed to create payment: {str(e)}")

    async def verify_payment_status(self, payment_id: str, transaction_id: str) -> Dict[str, Any]:
        """Verify payment status with retry logic."""
        for attempt in range(self.max_retry_attempts):
            try:
                result = await self.payment_provider.verify_payment(payment_id, transaction_id)
                return {
                    'status': result['status'],
                    'transaction_id': transaction_id,
                    'amount': result.get('amount'),
                    'verified_at': datetime.now()
                }
            except Exception as e:
                if attempt == self.max_retry_attempts - 1:
                    raise PaymentException(f"Failed to verify payment after {self.max_retry_attempts} attempts: {str(e)}")
                await asyncio.sleep(self.retry_delay * (attempt + 1))

    async def process_payment_callback(self, callback_data: Dict[str, Any]) -> bool:
        """Process payment webhook callback."""
        # Verify callback signature
        if not self._verify_callback_signature(callback_data):
            raise PaymentException("Invalid callback signature")

        payment_id = callback_data['payment_id']
        transaction_id = callback_data['transaction_id']
        status = callback_data['status']

        # Update payment status
        verified_data = await self.verify_payment_status(payment_id, transaction_id)

        if verified_data['status'] == 'SUCCESS':
            # Update booking as paid
            await self._mark_booking_as_paid(payment_id, transaction_id)
            return True

        return False

    async def refund_payment(self, payment_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        """Process refund with validation."""
        # Validate refund amount
        booking = await self._get_booking_by_payment_id(payment_id)
        if booking.total_price < amount:
            raise PaymentException("Refund amount exceeds original payment amount")

        # Process refund
        result = await self.payment_provider.refund_payment(payment_id, amount, reason)

        # Update refund status
        await self._record_refund(payment_id, amount, reason, result)

        return result

    def _verify_callback_signature(self, callback_data: Dict[str, Any]) -> bool:
        """Verify callback signature for security."""
        # Implementation depends on provider
        pass

    async def _mark_booking_as_paid(self, payment_id: str, transaction_id: str) -> None:
        """Mark booking as paid."""
        booking = await self._get_booking_by_payment_id(payment_id)
        if booking:
            booking.paid_at = datetime.now()
            booking.status = 'CONFIRMED'  # Update status based on your logic
            # Save to database
```

### 2.2 Background Task for Payment Verification

```python
# app/services/background_tasks.py
import asyncio
from datetime import datetime, timedelta
from typing import List

from app.services.payment_service import PaymentService
from app.models.booking import Booking, BookingStatus
from app.database import async_session

async def verify_pending_payments():
    """Background task to verify pending payments."""
    async with async_session() as session:
        # Get all pending payments that are about to expire
        pending_bookings = await session.execute(
            select(Booking)
            .where(Booking.status == BookingStatus.PENDING)
            .where(Booking.created_at < datetime.now() - timedelta(minutes=10))
            .limit(100)
        )

        for booking in pending_bookings.scalars().all():
            try:
                payment_service = PaymentService(get_payment_provider('vnpay'))
                # Verify payment status
                result = await payment_service.verify_payment_status(
                    booking.payment_id,
                    booking.transaction_id or ""
                )

                if result['status'] == 'FAILED':
                    # Mark booking as expired
                    booking.expire()
                    await session.commit()

            except Exception as e:
                # Log error and continue
                print(f"Error verifying payment {booking.id}: {e}")

async def cleanup_expired_payments():
    """Background task to cleanup expired payments."""
    async with async_session() as session:
        # Get expired payments
        expired_bookings = await session.execute(
            select(Booking)
            .where(Booking.status == BookingStatus.EXPIRED)
            .where(Booking.created_at < datetime.now() - timedelta(hours=24))
        )

        for booking in expired_bookings.scalars().all():
            # Remove payment data
            booking.payment_method = None
            booking.payment_id = None
            booking.paid_at = None
            await session.commit()

# Background task scheduler
class PaymentBackgroundTasks:
    """Background task scheduler for payment operations."""

    def __init__(self):
        self.tasks = [
            verify_pending_payments,
            cleanup_expired_payments
        ]
        self.running = False

    async def start(self):
        """Start background tasks."""
        self.running = True
        while self.running:
            for task in self.tasks:
                try:
                    await task()
                except Exception as e:
                    print(f"Background task error: {e}")
                await asyncio.sleep(60)  # Run every minute

    def stop(self):
        """Stop background tasks."""
        self.running = False
```

---

## 3. Error Handling and Validation Patterns

### 3.1 Custom Exceptions

```python
# app/core/exceptions.py
from fastapi import HTTPException
from typing import Optional

class PaymentException(Exception):
    """Base payment exception."""

    def __init__(self, message: str, error_code: Optional[str] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class PaymentTimeoutException(PaymentException):
    """Payment timeout exception."""

    def __init__(self, message: str = "Payment timeout"):
        super().__init__(message, "PAYMENT_TIMEOUT")

class PaymentVerificationException(PaymentException):
    """Payment verification exception."""

    def __init__(self, message: str = "Payment verification failed"):
        super().__init__(message, "PAYMENT_VERIFICATION_FAILED")

class PaymentRefundException(PaymentException):
    """Payment refund exception."""

    def __init__(self, message: str = "Payment refund failed"):
        super().__init__(message, "PAYMENT_REFUND_FAILED")

class InvalidPaymentMethodException(PaymentException):
    """Invalid payment method exception."""

    def __init__(self, message: str = "Invalid payment method"):
        super().__init__(message, "INVALID_PAYMENT_METHOD")

# FastAPI exception handler
from fastapi import Request
from fastapi.responses import JSONResponse

async def payment_exception_handler(request: Request, exc: PaymentException):
    """Handle payment exceptions."""
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message
            }
        }
    )
```

### 3.2 Request Validation Schema

```python
# app/schemas/payment.py
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from enum import Enum

class PaymentMethod(str, Enum):
    """Payment method enumeration."""
    VNPAY = "vnpay"
    MOMO = "momo"
    QRCODE = "qrcode"
    BANK_TRANSFER = "bank_transfer"

class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    REFUNDED = "REFUNDED"

class PaymentRequest(BaseModel):
    """Payment request schema."""

    payment_method: PaymentMethod
    amount: Decimal = Field(..., ge=0.01, description="Payment amount")
    currency: str = Field(default="VND", description="Currency code")
    booking_id: str = Field(..., description="Booking ID")
    customer_email: str = Field(..., description="Customer email")
    customer_name: str = Field(..., description="Customer name")
    customer_phone: str = Field(..., description="Customer phone")
    return_url: Optional[str] = Field(None, description="Return URL")
    cancel_url: Optional[str] = Field(None, description="Cancel URL")

    @validator('amount')
    def validate_amount(cls, v):
        if v > 100000000:  # 100 million VND
            raise ValueError("Amount exceeds maximum limit")
        return v

    @validator('booking_id')
    def validate_booking_id(cls, v):
        # Validate UUID format
        try:
            from uuid import UUID
            UUID(v)
        except ValueError:
            raise ValueError("Invalid booking ID format")
        return v

class PaymentResponse(BaseModel):
    """Payment response schema."""

    payment_id: str
    payment_url: Optional[str] = None
    qr_code: Optional[str] = None
    status: PaymentStatus
    created_at: datetime
    expires_at: datetime
    amount: Decimal
    currency: str
    transaction_id: Optional[str] = None

class PaymentVerificationRequest(BaseModel):
    """Payment verification request schema."""

    payment_id: str
    transaction_id: str
    signature: str

    @validator('signature')
    def validate_signature(cls, v, values):
        # Implement signature validation logic
        pass

class PaymentRefundRequest(BaseModel):
    """Payment refund request schema."""

    payment_id: str
    amount: Decimal = Field(..., ge=0.01)
    reason: str = Field(..., max_length=500)
    refund_type: str = Field(default="FULL", regex="^(FULL|PARTIAL)$")

    @validator('amount')
    def validate_refund_amount(cls, v, values):
        if 'payment_id' in values:
            # Validate against original payment amount
            # This would require querying the database
            pass
        return v

class PaymentCallbackRequest(BaseModel):
    """Payment callback request schema."""

    payment_id: str
    transaction_id: str
    status: PaymentStatus
    amount: Decimal
    signature: str
    timestamp: datetime
    extra_data: Optional[dict] = {}

    @validator('signature')
    def validate_callback_signature(cls, v, values):
        # Implement callback signature validation
        pass
```

---

## 4. API Endpoint Design for Payment Operations

### 4.1 Payment API Endpoints

```python
# app/api/v1/endpoints/payments.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentRequest,
    PaymentResponse,
    PaymentVerificationRequest,
    PaymentRefundRequest,
    PaymentCallbackRequest
)
from app.services.payment_service import PaymentService
from app.core.exceptions import PaymentException
from app.services.background_tasks import PaymentBackgroundTasks

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create", response_model=PaymentResponse, status_code=201)
async def create_payment(
    payment_request: PaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = Depends()
) -> PaymentResponse:
    """
    Create payment session for booking.

    Creates a new payment session for the specified booking amount.
    Returns payment details including payment URL or QR code.
    """
    try:
        # Get payment provider
        payment_service = PaymentService(payment_request.payment_method)

        # Get booking from database
        booking = await db.get(Booking, payment_request.booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        # Check if user owns the booking
        if booking.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        # Create payment session
        payment_response = await payment_service.create_payment_session(booking)

        # Add background task to verify payment status
        background_tasks.add_task(
            verify_payment_status,
            payment_response.payment_id
        )

        return payment_response

    except PaymentException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/verify")
async def verify_payment(
    verification_request: PaymentVerificationRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verify payment status.

    Verifies the status of a payment using transaction details.
    """
    try:
        payment_service = PaymentService('vnpay')  # Default provider
        result = await payment_service.verify_payment_status(
            verification_request.payment_id,
            verification_request.transaction_id
        )

        return result

    except PaymentException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/refund")
async def refund_payment(
    refund_request: PaymentRefundRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Process payment refund.

    Refunds a payment with the specified amount and reason.
    """
    try:
        # Get booking to verify ownership
        booking = await db.get(Booking, refund_request.payment_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        payment_service = PaymentService('vnpay')
        result = await payment_service.refund_payment(
            refund_request.payment_id,
            refund_request.amount,
            refund_request.reason
        )

        return result

    except PaymentException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def payment_webhook(
    callback_data: PaymentCallbackRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Payment webhook endpoint.

    Handles payment callbacks from payment providers.
    """
    try:
        # Verify callback signature
        if not payment_service._verify_callback_signature(callback_data.dict()):
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Process callback
        success = await payment_service.process_payment_callback(callback_data.dict())

        return {
            "status": "success" if success else "failed",
            "message": "Callback processed successfully"
        }

    except PaymentException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/methods")
async def get_payment_methods() -> Dict[str, Any]:
    """
    Get available payment methods.

    Returns list of supported payment methods and their details.
    """
    return {
        "methods": [
            {
                "id": "vnpay",
                "name": "VNPay",
                "description": "Vietnamese payment gateway",
                "currency": ["VND"],
                "min_amount": 10000,
                "max_amount": 100000000
            },
            {
                "id": "momo",
                "name": "MoMo",
                "description": "Mobile money payment",
                "currency": ["VND"],
                "min_amount": 10000,
                "max_amount": 100000000
            },
            {
                "id": "qrcode",
                "name": "QR Code",
                "description": "QR code payment",
                "currency": ["VND"],
                "min_amount": 10000,
                "max_amount": 100000000
            }
        ]
    }

@router.get("/{payment_id}/status")
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get payment status.

    Returns current status of a payment.
    """
    try:
        # Get booking to verify ownership
        booking = await db.get(Booking, payment_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Payment not found")

        if booking.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access")

        # Check payment status
        if booking.paid_at:
            return {
                "payment_id": payment_id,
                "status": "SUCCESS",
                "paid_at": booking.paid_at,
                "amount": booking.total_price
            }
        else:
            return {
                "payment_id": payment_id,
                "status": "PENDING",
                "expires_at": booking.created_at + timedelta(minutes=15)
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
```

### 4.2 Webhook Security

```python
# app/api/security.py
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import hashlib
import hmac

class PaymentWebhookSecurity:
    """Security utilities for payment webhooks."""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key.encode('utf-8')

    def verify_signature(self, payload: dict, signature: str) -> bool:
        """Verify webhook signature."""
        # Create signature string
        payload_string = str(sorted(payload.items()))
        expected_signature = hmac.new(
            self.secret_key,
            payload_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

    def validate_ip_whitelist(self, client_ip: str, whitelist: list[str]) -> bool:
        """Validate client IP against whitelist."""
        return client_ip in whitelist

# Dependency for webhook security
security = PaymentWebhookSecurity(secret_key="your-secret-key")

async def verify_webhook_signature(request: Request):
    """Verify webhook signature before processing."""
    # Get signature from headers
    signature = request.headers.get("x-signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    # Get IP whitelist
    whitelist = ["203.162.4.190", "203.162.4.191", "14.160.91.46"]  # VNPay IPs

    # Verify IP
    client_ip = request.client.host
    if not security.validate_ip_whitelist(client_ip, whitelist):
        raise HTTPException(status_code=403, detail="Unauthorized IP")

    # Verify signature
    payload = await request.json()
    if not security.verify_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
```

---

## 5. Testing Strategies

### 5.1 Unit Tests for Payment Service

```python
# tests/test_payment_service.py
import pytest
from unittest.mock import Mock, patch
from decimal import Decimal
from datetime import datetime

from app.services.payment_service import PaymentService
from app.schemas.payment import PaymentStatus

@pytest.fixture
def mock_payment_provider():
    """Mock payment provider for testing."""
    provider = Mock()
    provider.create_payment = Mock(return_value={
        'payment_id': 'test_payment_123',
        'payment_url': 'https://vnpay.vn/test',
        'qr_code': 'base64_qr_code_data'
    })
    provider.verify_payment = Mock(return_value={
        'status': 'SUCCESS',
        'amount': Decimal('100000'),
        'transaction_id': 'txn_123'
    })
    provider.refund_payment = Mock(return_value={
        'status': 'SUCCESS',
        'refund_id': 'refund_123'
    })
    return provider

@pytest.fixture
def payment_service(mock_payment_provider):
    """Payment service fixture."""
    return PaymentService(mock_payment_provider)

class TestPaymentService:
    """Test cases for payment service."""

    @pytest.mark.asyncio
    async def test_create_payment_session(self, payment_service, mock_payment_provider):
        """Test payment session creation."""
        from app.models.booking import Booking

        # Mock booking
        booking = Mock(spec=Booking)
        booking.id = "booking_123"
        booking.total_price = Decimal("100000")
        booking.venue.name = "Test Venue"

        result = await payment_service.create_payment_session(booking)

        # Verify payment was created
        mock_payment_provider.create_payment.assert_called_once()
        assert result.payment_id == "test_payment_123"
        assert result.status == PaymentStatus.PENDING
        assert result.amount == Decimal("100000")

    @pytest.mark.asyncio
    async def test_verify_payment_status(self, payment_service, mock_payment_provider):
        """Test payment verification."""
        result = await payment_service.verify_payment_status(
            "test_payment_123",
            "txn_123"
        )

        # Verify verification was called
        mock_payment_provider.verify_payment.assert_called_once()
        assert result['status'] == 'SUCCESS'
        assert result['amount'] == Decimal('100000')

    @pytest.mark.asyncio
    async def test_refund_payment(self, payment_service, mock_payment_provider):
        """Test payment refund."""
        result = await payment_service.refund_payment(
            "test_payment_123",
            Decimal("50000"),
            "Test refund"
        )

        # Verify refund was called
        mock_payment_provider.refund_payment.assert_called_once()
        assert result['status'] == 'SUCCESS'
        assert result['refund_id'] == 'refund_123'

    @pytest.mark.asyncio
    async def test_payment_timeout_handling(self, payment_service):
        """Test payment timeout handling."""
        # This test would require mocking time
        pass
```

### 5.2 Integration Tests

```python
# tests/test_payment_integration.py
import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.main import app

@pytest.mark.asyncio
async def test_payment_creation_endpoint():
    """Test payment creation endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/payments/create",
            json={
                "payment_method": "vnpay",
                "amount": "100000",
                "currency": "VND",
                "booking_id": "test_booking_123",
                "customer_email": "test@example.com",
                "customer_name": "Test User",
                "customer_phone": "0123456789"
            },
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 201
        data = response.json()
        assert "payment_id" in data
        assert "payment_url" in data

@pytest.mark.asyncio
async def test_payment_webhook_endpoint():
    """Test payment webhook endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/payments/webhook",
            json={
                "payment_id": "test_payment_123",
                "transaction_id": "txn_123",
                "status": "SUCCESS",
                "amount": "100000",
                "signature": "test_signature",
                "timestamp": "2024-01-01T00:00:00Z"
            },
            headers={"x-signature": "test_signature"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
```

### 5.3 E2E Tests

```python
# tests/test_payment_e2e.py
import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.main import app

@pytest.mark.asyncio
async def test_payment_flow_e2e():
    """End-to-end test for payment flow."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Step 1: Create booking
        booking_response = await ac.post(
            "/api/v1/bookings",
            json={
                "venue_id": "venue_123",
                "booking_date": "2024-01-15",
                "start_time": "09:00",
                "end_time": "11:00"
            },
            headers={"Authorization": "Bearer test_token"}
        )

        assert booking_response.status_code == 201
        booking_data = booking_response.json()
        booking_id = booking_data["id"]

        # Step 2: Create payment
        payment_response = await ac.post(
            "/api/v1/payments/create",
            json={
                "payment_method": "vnpay",
                "amount": str(booking_data["total_price"]),
                "currency": "VND",
                "booking_id": booking_id,
                "customer_email": "test@example.com",
                "customer_name": "Test User",
                "customer_phone": "0123456789"
            },
            headers={"Authorization": "Bearer test_token"}
        )

        assert payment_response.status_code == 201
        payment_data = payment_response.json()
        payment_id = payment_data["payment_id"]

        # Step 3: Simulate payment completion
        webhook_response = await ac.post(
            "/api/v1/payments/webhook",
            json={
                "payment_id": payment_id,
                "transaction_id": "txn_123",
                "status": "SUCCESS",
                "amount": payment_data["amount"],
                "signature": "test_signature",
                "timestamp": "2024-01-01T00:00:00Z"
            },
            headers={"x-signature": "test_signature"}
        )

        assert webhook_response.status_code == 200

        # Step 4: Verify booking status
        status_response = await ac.get(
            f"/api/v1/bookings/{booking_id}",
            headers={"Authorization": "Bearer test_token"}
        )

        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["is_paid"] == True
        assert status_data["status"] == "CONFIRMED"
```

### 5.4 Mock Payment Providers for Testing

```python
# tests/mock_providers.py
from typing import Dict, Any
from decimal import Decimal
from datetime import datetime

class MockVNPayProvider:
    """Mock VNPay provider for testing."""

    def __init__(self):
        self.payments = {}
        self.webhooks = []

    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        """Mock payment creation."""
        payment_id = f"vnpay_test_{datetime.now().timestamp()}"

        self.payments[payment_id] = {
            'amount': amount,
            'description': description,
            'booking_id': booking_id,
            'user_id': user_id,
            'status': 'PENDING',
            'created_at': datetime.now()
        }

        return {
            'payment_id': payment_id,
            'payment_url': f'https://test.vnpay.vn/payment?payment_id={payment_id}',
            'qr_code': f'mock_qr_code_{payment_id}'
        }

    async def verify_payment(self, payment_id: str, transaction_id: str) -> Dict[str, Any]:
        """Mock payment verification."""
        if payment_id not in self.payments:
            raise Exception("Payment not found")

        # Simulate successful payment
        self.payments[payment_id]['status'] = 'SUCCESS'
        self.payments[payment_id]['transaction_id'] = transaction_id

        return {
            'status': 'SUCCESS',
            'amount': self.payments[payment_id]['amount'],
            'transaction_id': transaction_id,
            'verified_at': datetime.now()
        }

    async def refund_payment(self, payment_id: str, amount: Decimal, reason: str) -> Dict[str, Any]:
        """Mock refund process."""
        if payment_id not in self.payments:
            raise Exception("Payment not found")

        return {
            'status': 'SUCCESS',
            'refund_id': f'refund_{datetime.now().timestamp()}',
            'amount': amount,
            'reason': reason
        }

class MockMomoProvider:
    """Mock MoMo provider for testing."""

    def __init__(self):
        self.payments = {}

    async def create_payment(self, amount: Decimal, description: str,
                           booking_id: str, user_id: str) -> Dict[str, Any]:
        """Mock MoMo payment creation."""
        payment_id = f"momo_test_{datetime.now().timestamp()}"

        self.payments[payment_id] = {
            'amount': amount,
            'description': description,
            'booking_id': booking_id,
            'user_id': user_id,
            'status': 'PENDING',
            'created_at': datetime.now()
        }

        return {
            'payment_id': payment_id,
            'deep_link': f'momo://payment?payment_id={payment_id}'
        }

# Test fixtures
@pytest.fixture
def mock_vnpay():
    return MockVNPayProvider()

@pytest.fixture
def mock_momo():
    return MockMomoProvider()
```

---

## 6. Configuration and Environment Management

### 6.1 Environment Configuration

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Dict, Any
import os

class PaymentConfig(BaseSettings):
    """Payment configuration management."""

    # VNPay Configuration
    VNPAY_MERCHANT_ID: str = ""
    VNPAY_HASH_SECRET: str = ""
    VNPAY_RETURN_URL: str = ""
    VNPAY_TMN_CODE: str = ""
    VNPAY_API_URL: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    VNPAY_QUERY_URL: str = "https://sandbox.vnpayment.vn//paymentv2/vpcpay_query.html"

    # MoMo Configuration
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_API_URL: str = "https://test-payment.momo.vn/gw/payment/transaction"

    # General Payment Configuration
    PAYMENT_TIMEOUT_MINUTES: int = 15
    MAX_RETRY_ATTEMPTS: int = 3
    RETRY_DELAY_SECONDS: int = 5
    CURRENCY: str = "VND"

    # Security Configuration
    WEBHOOK_SECRET_KEY: str = ""
    IP_WHITELIST: list[str] = ["127.0.0.1", "localhost"]

    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost/pickalo"

    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_provider_config(self, provider_name: str) -> Dict[str, Any]:
        """Get configuration for specific provider."""
        if provider_name == "vnpay":
            return {
                "merchant_id": self.VNPAY_MERCHANT_ID,
                "hash_secret": self.VNPAY_HASH_SECRET,
                "return_url": self.VNPAY_RETURN_URL,
                "tmn_code": self.VNPAY_TMN_CODE,
                "api_url": self.VNPAY_API_URL,
                "query_url": self.VNPAY_QUERY_URL
            }
        elif provider_name == "momo":
            return {
                "partner_code": self.MOMO_PARTNER_CODE,
                "access_key": self.MOMO_ACCESS_KEY,
                "secret_key": self.MOMO_SECRET_KEY,
                "api_url": self.MOMO_API_URL
            }
        else:
            raise ValueError(f"Unknown provider: {provider_name}")

# Initialize configuration
payment_config = PaymentConfig()
```

### 6.2 Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pickalo
      - VNPAY_MERCHANT_ID=${VNPAY_MERCHANT_ID}
      - VNPAY_HASH_SECRET=${VNPAY_HASH_SECRET}
      - MOMO_PARTNER_CODE=${MOMO_PARTNER_CODE}
      - MOMO_SECRET_KEY=${MOMO_SECRET_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pickalo
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  worker:
    build: .
    command: python -m app.worker
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pickalo
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

---

## 7. Monitoring and Logging

### 7.1 Payment Monitoring

```python
# app/monitoring/payment_monitor.py
import logging
from datetime import datetime
from typing import Dict, Any
from decimal import Decimal
from app.services.payment_service import PaymentService

class PaymentMonitor:
    """Payment monitoring and logging."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.metrics = {
            'total_payments': 0,
            'successful_payments': 0,
            'failed_payments': 0,
            'total_amount': Decimal('0'),
            'processing_time': []
        }

    def log_payment_start(self, payment_id: str, amount: Decimal, method: str):
        """Log payment start."""
        self.logger.info(f"Payment started: {payment_id}, Amount: {amount}, Method: {method}")
        self.metrics['total_payments'] += 1
        self.metrics['total_amount'] += amount

    def log_payment_success(self, payment_id: str, processing_time: float):
        """Log successful payment."""
        self.logger.info(f"Payment successful: {payment_id}, Time: {processing_time}s")
        self.metrics['successful_payments'] += 1
        self.metrics['processing_time'].append(processing_time)

    def log_payment_failure(self, payment_id: str, error: str):
        """Log failed payment."""
        self.logger.error(f"Payment failed: {payment_id}, Error: {error}")
        self.metrics['failed_payments'] += 1

    def get_metrics(self) -> Dict[str, Any]:
        """Get payment metrics."""
        avg_time = (
            sum(self.metrics['processing_time']) / len(self.metrics['processing_time'])
            if self.metrics['processing_time'] else 0
        )

        return {
            'total_payments': self.metrics['total_payments'],
            'successful_payments': self.metrics['successful_payments'],
            'failed_payments': self.metrics['failed_payments'],
            'success_rate': (
                self.metrics['successful_payments'] / self.metrics['total_payments']
                if self.metrics['total_payments'] > 0 else 0
            ),
            'total_amount': float(self.metrics['total_amount']),
            'average_processing_time': avg_time
        }

# Initialize monitor
payment_monitor = PaymentMonitor()
```

### 7.2 Logging Configuration

```python
# app/core/logging.py
import logging
import sys
from logging.handlers import RotatingFileHandler

def setup_logging():
    """Setup logging configuration."""
    # Create logger
    logger = logging.getLogger('payment')
    logger.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # File handler
    file_handler = RotatingFileHandler(
        'logs/payment.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

# Setup logging
payment_logger = setup_logging()
```

---

## 8. Performance Optimization

### 8.1 Caching Strategy

```python
# app/services/payment_cache.py
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from typing import Optional
from datetime import datetime, timedelta
import json

class PaymentCache:
    """Payment caching utilities."""

    @staticmethod
    @cache(expire=300)  # 5 minutes
    async def get_payment_status(payment_id: str) -> Optional[Dict]:
        """Cache payment status."""
        # Implementation would fetch from database
        pass

    @staticmethod
    async def set_payment_status(payment_id: str, status: Dict):
        """Set cached payment status."""
        await FastAPICache.get_backend().set(
            f"payment:{payment_id}",
            json.dumps(status),
            expire=300
        )

    @staticmethod
    async def invalidate_payment_cache(payment_id: str):
        """Invalidate payment cache."""
        await FastAPICache.get_backend().delete(f"payment:{payment_id}")
```

### 8.2 Database Optimization

```python
# app/database/indexes.py
from sqlalchemy import Index
from app.models.booking import Booking

# Add indexes for payment queries
payment_status_index = Index(
    'idx_payment_status',
    Booking.status,
    Booking.paid_at,
    Booking.created_at
)

payment_method_index = Index(
    'idx_payment_method',
    Booking.payment_method
)

user_payment_index = Index(
    'idx_user_payment',
    Booking.user_id,
    Booking.created_at
)
```

---

## 9. Security Best Practices

### 9.1 Payment Data Protection

```python
# app/security/payment_security.py
from cryptography.fernet import Fernet
from typing import Dict, Any
import base64

class PaymentDataEncryption:
    """Encryption utilities for payment data."""

    def __init__(self, key: str):
        self.cipher = Fernet(key.encode()[:32].ljust(32, b'0'))

    def encrypt(self, data: Dict[str, Any]) -> str:
        """Encrypt payment data."""
        json_data = json.dumps(data)
        encrypted = self.cipher.encrypt(json_data.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt payment data."""
        encrypted = base64.b64decode(encrypted_data.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return json.loads(decrypted.decode())

# Payment security middleware
async def secure_payment_data(request: Request, call_next):
    """Middleware to secure payment data."""
    # Encrypt/decrypt payment data in request/response
    response = await call_next(request)
    return response
```

---

## 10. Implementation Checklist

### 10.1 Development Checklist

- [ ] **Payment Service Layer**: Implement abstract payment provider interface
- [ ] **Provider Implementations**: Create VNPay, MoMo, and QR code providers
- [ ] **Dependency Injection**: Set up payment provider factory and injection
- [ ] **API Endpoints**: Implement payment creation, verification, and refund endpoints
- [ ] **Webhook Security**: Implement signature verification and IP whitelisting
- [ ] **Background Tasks**: Set up payment verification and cleanup tasks
- [ ] **Error Handling**: Create custom exceptions and error handlers
- [ ] **Validation**: Implement Pydantic schemas for payment requests
- [ ] **Testing**: Write unit, integration, and E2E tests
- [ ] **Monitoring**: Set up logging and monitoring for payment operations
- [ ] **Configuration**: Implement environment-based configuration
- [ ] **Documentation**: Create API documentation for payment endpoints

### 10.2 Testing Checklist

- [ ] **Unit Tests**: Test payment service methods with mocked providers
- [ ] **Integration Tests**: Test API endpoints with test database
- [ ] **E2E Tests**: Test complete payment flow from booking to payment
- [ ] **Webhook Tests**: Test webhook endpoint with various scenarios
- [ ] **Error Scenarios**: Test error handling for payment failures
- [ ] **Performance Tests**: Test payment processing under load
- [ ] **Security Tests**: Test security measures and validation

### 10.3 Deployment Checklist

- [ ] **Environment Setup**: Configure payment provider credentials
- [ ] **Database Migration**: Run payment-related migrations
- [ ] **Background Services**: Start payment background task worker
- [ ] **Monitoring**: Set up payment monitoring and alerting
- [ ] **Security Audit**: Review payment security measures
- [ ] **Load Testing**: Test system under expected load
- [ ] **Production Testing**: Test in staging environment first

---

## 11. Recommendations for PickAlo

### 11.1 Priority Implementation

1. **Start with VNPay**: Implement VNPay first as it's the most widely used in Vietnam
2. **Use Background Tasks**: Implement payment verification background tasks
3. **Security First**: Implement webhook security before going live
4. **Comprehensive Testing**: Test all payment scenarios including failures

### 11.2 Risk Mitigation

1. **Payment Timeout**: Implement 15-minute timeout for pending payments
2. **Retry Logic**: Implement retry logic for payment verification failures
3. **Monitoring**: Set up monitoring for payment success rates and processing times
4. **Backup Providers**: Have backup payment providers ready

### 11.3 Performance Considerations

1. **Database Optimization**: Add indexes for payment queries
2. **Caching**: Cache frequently accessed payment data
3. **Async Processing**: Use async/await for payment operations
4. **Load Testing**: Test system with expected payment volumes

---

## 12. Conclusion

This research provides a comprehensive foundation for implementing payment integration in the PickAlo FastAPI application. The patterns and best practices outlined cover:

- **Service Architecture**: Abstract payment providers with dependency injection
- **Async Processing**: Background tasks for payment verification
- **Security**: Webhook verification and data protection
- **Testing**: Comprehensive testing strategies
- **Monitoring**: Payment metrics and logging
- **Performance**: Caching and database optimization

The implementation should start with VNPay integration, followed by MoMo and QR code providers. Focus on security and testing before going live to ensure reliable payment processing for the PickAlo platform.

---

**Sources:**
- FastAPI Documentation: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- VNPay Integration Guide: [https://sandbox.vnpayment.vn/](https://sandbox.vnpayment.vn/)
- MoMo Developer Portal: [https://developers.momo.vn/](https://developers.momo.vn/)
- Pydantic Documentation: [https://pydantic-docs.helpmanual.io/](https://pydantic-docs.helpmanual.io/)
- SQLAlchemy Async Documentation: [https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)