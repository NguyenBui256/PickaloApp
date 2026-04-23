# MoMo Payment Gateway Integration Research Report

**Project:** PickAlo Sports Facility Booking Platform
**Research Date:** April 8, 2026
**Report ID:** Momo-Research-2026-04-08
**Target Environment:** FastAPI Backend + React Native Frontend

---

## Executive Summary

This report provides a comprehensive analysis of MoMo payment gateway integration for the PickAlo platform. Based on industry best practices for Vietnamese payment systems, we outline the technical requirements, security considerations, and implementation strategies for seamless payment processing.

---

## 1. MoMo API Documentation and Endpoints

### 1.1 Core API Categories

MoMo Vietnam provides the following primary API endpoints:

#### Payment Creation APIs
- **Endpoint:** `POST /v2/gateway/api/create`
- **Purpose:** Create payment requests
- **Authentication:** HMAC + API Key
- **Method:** Server-to-Server

#### Payment Status APIs
- **Endpoint:** `POST /v2/gateway/api/query`
- **Purpose:** Check payment status
- **Authentication:** HMAC + API Key
- **Method:** Server-to-Server

#### Refund APIs
- **Endpoint:** `POST /v2/gateway/api/refund`
- **Purpose:** Process refunds
- **Authentication:** HMAC + API Key
- **Method:** Server-to-Server

#### Webhook Endpoints
- **Endpoint:** `POST /webhook/payment`
- **Purpose:** Real-time payment notifications
- **Authentication:** HMAC signature verification
- **Method:** MoMo → Your Server

### 1.2 Base URLs
- **Sandbox:** `https://test-payment.momo.vn`
- **Production:** `https://payment.momo.vn`
- **API Version:** v2 (recommended for new integrations)

---

## 2. Authentication Methods

### 2.1 HMAC Authentication (Recommended)

MoMo uses HMAC (Hash-based Message Authentication Code) for secure API communication:

```python
import hmac
import hashlib
import json
from datetime import datetime

def generate_momo_signature(data: dict, secret_key: str) -> str:
    """
    Generate HMAC signature for MoMo API requests

    Args:
        data: Dictionary containing request parameters
        secret_key: MoMo secret key

    Returns:
        HMAC signature string
    """
    # Sort parameters by key name
    sorted_params = '&'.join([f"{k}={v}" for k, v in sorted(data.items())])

    # Generate HMAC-SHA256 signature
    signature = hmac.new(
        secret_key.encode('utf-8'),
        sorted_params.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return signature
```

### 2.2 Authentication Process

1. **Request Authentication:**
   - Generate HMAC signature for outgoing requests
   - Include API key in headers
   - Add timestamp for request freshness

2. **Webhook Verification:**
   - Verify HMAC signature from incoming webhook
   - Validate timestamp to prevent replay attacks
   - Cross-check payment amount and transaction ID

---

## 3. Payment Creation Flow

### 3.1 Request Structure

```python
class MoMoPaymentRequest(BaseModel):
    partner_code: str = "PARTNER_CODE"  # Your MoMo partner code
    partner_name: str = "PARTNER_NAME"  # Your business name
    store_id: str = "STORE_ID"         # Your store identifier
    request_id: str = str(uuid.uuid4())  # Unique request ID
    amount: float                       # Payment amount (VND)
    currency: str = "VND"               # Currency (always VND)
    order_info: str = "Pickalo Booking" # Order description
    order_type: str = "other"          # Order type
    return_url: str                     # Redirect URL after payment
    notify_url: str                     # Webhook URL for status updates
    extra_data: str = ""                # Additional data in JSON
    request_type: str = "captureWallet" # Payment method
    lang: str = "vi"                   # Language
    signature: str = Field(None)       # HMAC signature
```

### 3.2 Payment Flow Steps

1. **Create Payment Request:**
   - Generate unique transaction ID
   - Calculate total amount (including fees)
   - Create payment request with HMAC signature
   - Redirect user to MoMo payment page

2. **User Payment:**
   - User completes payment on MoMo platform
   - MoMo processes the transaction
   - User returns to return_url

3. **Status Verification:**
   - Webhook notification sent to notify_url
   - Verify webhook signature and data
   - Update booking status in database

---

## 4. Webhook Handling and Verification

### 4.1 Webhook Structure

```python
@app.post("/webhook/momo")
async def momo_webhook(request: Request):
    """
    Handle MoMo payment webhook notifications
    """
    try:
        # Get webhook data
        webhook_data = await request.json()

        # Verify signature
        is_valid = verify_webhook_signature(webhook_data)

        if not is_valid:
            return {"message": "Invalid signature"}

        # Extract payment data
        payment_data = {
            "transaction_id": webhook_data.get("transId"),
            "request_id": webhook_data.get("requestId"),
            "amount": webhook_data.get("amount"),
            "status": webhook_data.get("responseCode"),
            "message": webhook_data.get("responseMessage"),
            "timestamp": webhook_data.get("timestamp")
        }

        # Process payment update
        await process_payment_update(payment_data)

        return {"message": "Webhook processed successfully"}

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"message": "Webhook processing failed"}

def verify_webhook_signature(webhook_data: dict) -> bool:
    """
    Verify MoMo webhook signature
    """
    # Extract received signature
    received_signature = webhook_data.get("signature")

    # Remove signature from data for verification
    verification_data = webhook_data.copy()
    verification_data.pop("signature", None)

    # Generate expected signature
    expected_signature = generate_momo_signature(verification_data, SECRET_KEY)

    return hmac.compare_digest(received_signature, expected_signature)
```

### 4.2 Webhook Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `transId` | String | MoMo transaction ID |
| `requestId` | String | Original request ID |
| `amount` | String | Payment amount (VND) |
| `responseCode` | String | Payment status code |
| `responseMessage` | String | Status description |
| `signature` | String | HMAC signature |

### 4.3 Status Codes

| Code | Description | Action Required |
|------|-------------|-----------------|
| `0` | Success | Update booking status |
| `1` | Failed | Handle payment failure |
| `9994` | User cancelled | Allow retry |
| `9995` | Time out | Process accordingly |
| `9999` | Other error | Log and investigate |

---

## 5. Security Best Practices

### 5.1 API Security

- **HMAC Authentication:** Always use HMAC signatures for API communication
- **Environment Separation:** Use separate API keys for sandbox and production
- **HTTPS Only:** All API communication must use HTTPS
- **Rate Limiting:** Implement rate limiting on webhook endpoints
- **Input Validation:** Validate all incoming webhook data

### 5.2 Data Protection

```python
# Environment variable management
class MoMoConfig(BaseSettings):
    MOMO_PARTNER_CODE: str
    MOMO_SECRET_KEY: str
    MOMO_ACCESS_KEY: str
    MOMO_ENV: str = "sandbox"  # or "production"

    class Config:
        env_file = ".env"
```

### 5.3 Webhook Security

- **Signature Verification:** Always verify webhook signatures before processing
- **IP Whitelisting:** Restrict webhook access to MoMo IP addresses
- **Replay Protection:** Use timestamp validation to prevent replay attacks
- **Error Handling:** Log all webhook processing failures for audit

---

## 6. Error Handling and Status Codes

### 6.1 Common Error Responses

| Error Code | Description | Recovery Action |
|------------|-------------|-----------------|
| `400` | Bad Request | Check request parameters |
| `401` | Unauthorized | Verify API credentials |
| `403` | Forbidden | Check permissions |
| `404` | Not Found | Verify endpoint URL |
| `500` | Server Error | Check logs and retry |

### 6.2 Error Handling Strategy

```python
class MoMoPaymentError(Exception):
    def __init__(self, error_code: str, message: str):
        self.error_code = error_code
        self.message = message
        super().__init__(f"{error_code}: {message}")

async def handle_momo_payment(request_data: dict):
    try:
        # Create payment request
        response = await create_momo_payment(request_data)

        # Check response
        if response.get("resultCode") == "0":
            return response
        else:
            raise MoMoPaymentError(
                error_code=response.get("resultCode"),
                message=response.get("message", "Unknown error")
            )

    except Exception as e:
        logger.error(f"Payment processing failed: {str(e)}")
        raise
```

---

## 7. Python/FastAPI Integration Examples

### 7.1 Payment Service Implementation

```python
from typing import Dict, Optional
import httpx
from datetime import datetime
import uuid

class MoMoPaymentService:
    def __init__(self, config: MoMoConfig):
        self.config = config
        self.base_url = "https://test-payment.momo.vn" if config.MOMO_ENV == "sandbox" else "https://payment.momo.vn"

    async def create_payment(self, booking_data: Dict) -> Dict:
        """Create MoMo payment request"""

        # Prepare payment request data
        payment_data = {
            "partnerCode": self.config.MOMO_PARTNER_CODE,
            "partnerName": "Pickalo",
            "storeId": "pickalo_store",
            "requestId": str(uuid.uuid4()),
            "amount": str(int(booking_data["amount"] * 1000)),  # Convert to VND without decimals
            "currency": "VND",
            "orderInfo": f"Pickalo Booking - {booking_data['booking_id']}",
            "orderType": "other",
            "returnUrl": f"{self.config.BASE_URL}/payment/return",
            "notifyUrl": f"{self.config.BASE_URL}/webhook/momo",
            "extraData": json.dumps({"booking_id": booking_data["booking_id"]}),
            "requestType": "captureWallet",
            "lang": "vi"
        }

        # Generate signature
        payment_data["signature"] = self._generate_signature(payment_data)

        # Send request to MoMo
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v2/gateway/api/create",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )

        return response.json()

    def _generate_signature(self, data: Dict) -> str:
        """Generate HMAC signature for MoMo API requests"""

        # Remove signature from data if present
        data_copy = data.copy()
        data_copy.pop("signature", None)

        # Sort parameters and create string
        sorted_params = '&'.join([f"{k}={v}" for k, v in sorted(data_copy.items())])

        # Generate HMAC-SHA256
        signature = hmac.new(
            self.config.MOMO_SECRET_KEY.encode('utf-8'),
            sorted_params.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return signature

    async def query_payment_status(self, request_id: str) -> Dict:
        """Query payment status from MoMo"""

        query_data = {
            "partnerCode": self.config.MOMO_PARTNER_CODE,
            "accessKey": self.config.MOMO_ACCESS_KEY,
            "requestId": request_id,
            "timestamp": str(int(datetime.now().timestamp()))
        }

        query_data["signature"] = self._generate_signature(query_data)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v2/gateway/api/query",
                json=query_data,
                headers={"Content-Type": "application/json"}
            )

        return response.json()
```

### 7.2 API Endpoint Integration

```python
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.post("/create-payment")
async def create_payment(
    request: Request,
    booking_data: PaymentRequestSchema
):
    """Create MoMo payment for booking"""

    try:
        payment_service = MoMoPaymentService(config)
        response = await payment_service.create_payment(booking_data.dict())

        if response.get("resultCode") == "0":
            return {
                "payment_url": response.get("payUrl"),
                "request_id": response.get("requestId"),
                "message": "Payment created successfully"
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Payment creation failed: {response.get('message')}"
            )

    except Exception as e:
        logger.error(f"Payment creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/webhook/momo")
async def momo_webhook(request: Request):
    """Handle MoMo payment webhook"""

    try:
        webhook_data = await request.json()

        # Verify signature
        payment_service = MoMoPaymentService(config)
        is_valid = payment_service.verify_webhook(webhook_data)

        if not is_valid:
            return {"resultCode": "9999", "message": "Invalid signature"}

        # Process payment update
        await process_payment_update(webhook_data)

        return {"resultCode": "0", "message": "Success"}

    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return {"resultCode": "9999", "message": "Processing failed"}
```

---

## 8. Testing Strategies for MoMo Integration

### 8.1 Unit Testing

```python
import pytest
from unittest.mock import Mock, patch
from your_app.services.momo_payment import MoMoPaymentService

class TestMoMoPaymentService:

    def setup_method(self):
        self.config = Mock()
        self.config.MOMO_PARTNER_CODE = "TEST_PARTNER"
        self.config.MOMO_SECRET_KEY = "TEST_SECRET"
        self.config.MOMO_ENV = "sandbox"

        self.payment_service = MoMoPaymentService(self.config)

    def test_generate_signature(self):
        """Test HMAC signature generation"""

        test_data = {
            "partnerCode": "TEST_PARTNER",
            "amount": "10000",
            "currency": "VND"
        }

        signature = self.payment_service._generate_signature(test_data)

        assert len(signature) == 64  # SHA-256 hash length
        assert signature.isalnum()

    @patch('httpx.AsyncClient.post')
    async def test_create_payment_success(self, mock_post):
        """Test successful payment creation"""

        # Mock successful response
        mock_response = Mock()
        mock_response.json.return_value = {
            "resultCode": "0",
            "payUrl": "https://test-payment.momo.vn/pay",
            "requestId": "test_request_id"
        }
        mock_post.return_value = mock_response

        # Test payment creation
        booking_data = {
            "amount": 10000,
            "booking_id": "test_booking_123"
        }

        result = await self.payment_service.create_payment(booking_data)

        assert result["resultCode"] == "0"
        assert "payUrl" in result
        assert "requestId" in result
```

### 8.2 Integration Testing

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_payment_webhook_integration():
    """Test webhook endpoint with real MoMo data format"""

    # Test webhook data (sample)
    test_webhook = {
        "partnerCode": "PARTNER_CODE",
        "transId": "TEST_TRANS_123",
        "requestId": "TEST_REQ_123",
        "amount": "10000",
        "responseCode": "0",
        "responseMessage": "Success",
        "signature": "VALID_SIGNATURE"
    }

    async with AsyncClient(app=app) as client:
        response = await client.post(
            "/webhook/momo",
            json=test_webhook,
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["resultCode"] == "0"
```

### 8.3 Test Environment Setup

```python
# Test configuration
class TestMoMoConfig(BaseSettings):
    MOMO_PARTNER_CODE: str = "TEST_PARTNER_CODE"
    MOMO_SECRET_KEY: str = "TEST_SECRET_KEY"
    MOMO_ACCESS_KEY: str = "TEST_ACCESS_KEY"
    MOMO_ENV: str = "sandbox"
    BASE_URL: str = "http://localhost:8000"

# Test database
@pytest.fixture
async def test_db():
    """Setup test database"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        yield
        await conn.run_sync(Base.metadata.drop_all)
```

---

## 9. Implementation Roadmap

### Phase 1: Core Integration (2-3 days)
1. **Setup MoMo configuration module**
   - Create environment variable management
   - Implement HMAC signature generation
   - Configure API client

2. **Implement payment service**
   - Create payment request functionality
   - Implement webhook verification
   - Add error handling

3. **API endpoints**
   - Payment creation endpoint
   - Webhook handler
   - Status query endpoint

### Phase 2: Testing & Security (2 days)
1. **Unit testing**
   - Test payment service methods
   - Test signature generation
   - Test webhook verification

2. **Integration testing**
   - Test API endpoints
   - Test webhook processing
   - Test error scenarios

3. **Security audit**
   - Review HMAC implementation
   - Validate webhook security
   - Check rate limiting

### Phase 3: Production Deployment (1-2 days)
1. **Environment setup**
   - Configure production API keys
   - Setup monitoring
   - Configure logging

2. **Documentation**
   - Update API documentation
   - Create integration guide
   - Add troubleshooting guide

---

## 10. Dependencies and Requirements

### 10.1 Python Dependencies

```txt
# Add to requirements.txt
requests>=2.31.0
httpx>=0.26.0
python-hmac  # For HMAC authentication
cryptography>=41.0.0  # For secure hashing
```

### 10.2 Environment Variables

```env
# MoMo Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_SECRET_KEY=your_secret_key
MOMO_ACCESS_KEY=your_access_key
MOMO_ENV=sandbox  # or production

# Application Configuration
BASE_URL=https://your-domain.com
WEBHOOK_SECRET=your_webhook_secret
```

---

## 11. Risk Assessment and Mitigation

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|---------|------------|
| API key compromise | Low | High | Use environment variables, rotate keys |
| Webhook replay attacks | Medium | High | Implement timestamp validation |
| Payment double-spending | Low | High | Use transaction IDs, implement idempotency |
| Network timeouts | Medium | Medium | Implement retry logic, proper error handling |

### 11.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|---------|------------|
| Payment failures | Medium | High | Provide retry mechanism, customer support |
| Fraudulent payments | Low | High | Implement fraud detection, monitoring |
| Compliance issues | Low | High | Follow Vietnamese payment regulations |

---

## 12. Next Steps

### Immediate Actions (Week 1)
1. **Get MoMo API Credentials**
   - Register as MoMo partner
   - Obtain sandbox API keys
   - Review official documentation

2. **Implement Core Module**
   - Create MoMo service class
   - Implement HMAC authentication
   - Setup test environment

3. **Develop API Endpoints**
   - Payment creation endpoint
   - Webhook handler
   - Status query endpoint

### Medium-term Actions (Week 2)
1. **Testing**
   - Write comprehensive tests
   - Test with MoMo sandbox environment
   - Validate error handling

2. **Documentation**
   - Update API documentation
   - Create integration guide
   - Add troubleshooting section

### Long-term Actions (Week 3+)
1. **Production Deployment**
   - Configure production API keys
   - Setup monitoring and logging
   - Implement fraud detection

---

## 13. Monitoring and Logging

### 13.1 Logging Strategy

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("momo_payment")

# Payment creation log
logger.info(f"Creating payment for booking {booking_id} - Amount: {amount}")

# Webhook processing log
logger.info(f"Processing webhook for transaction {transaction_id} - Status: {status}")

# Error handling log
logger.error(f"Payment failed: {error_message}", exc_info=True)
```

### 13.2 Monitoring Metrics

- **Success Rate:** Track successful vs failed payments
- **Response Time:** Monitor API response times
- **Error Rates:** Track different error types
- **Webhook Processing:** Monitor webhook delivery success

---

## 14. Conclusion

The integration of MoMo payment gateway into the PickAlo platform requires careful attention to security, particularly HMAC signature verification and webhook handling. By following the outlined implementation strategy and testing approach, we can ensure a robust and secure payment system that meets the needs of Vietnamese users.

Key recommendations:
1. **Start with sandbox environment** for testing
2. **Implement comprehensive error handling** for all payment scenarios
3. **Use proper logging** for debugging and monitoring
4. **Follow MoMo's latest documentation** for updates and changes
5. **Implement proper backup and retry mechanisms** for failed payments

This research provides a solid foundation for implementing MoMo payment integration in the PickAlo platform while ensuring security, reliability, and compliance with Vietnamese payment regulations.

---

**Report Generated:** April 8, 2026
**Next Review Date:** May 8, 2026
**Version:** 1.0