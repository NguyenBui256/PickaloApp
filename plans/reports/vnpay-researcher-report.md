# VNPay Payment Gateway Integration Research Report

**Date**: 2026-04-08
**Project**: PickAlo Sports Facility Booking Platform
**Research Focus**: VNPay API Integration for Fast Applications

## Executive Summary

After conducting comprehensive research through multiple channels, this report identifies significant challenges in accessing VNPay's official documentation and provides strategic guidance for successful integration. The research reveals that VNPay's official documentation is not readily accessible through standard web searches, requiring direct engagement with Vietnamese resources and official channels.

## Research Findings

### 1. Documentation Accessibility Challenges

**Issue**: Standard web search methods did not return comprehensive VNPay API documentation
- **Official Website**: vnpay.vn and sandbox.vnpay.vn returned limited or no accessible content
- **Search Results**: Queries for VNPay API documentation yielded minimal results
- **Language Barrier**: Most technical content is in Vietnamese, requiring localized research

**Mitigation Strategies**:
1. **Direct Contact**: Reach out to VNPay support for official documentation
2. **Vietnamese Resources**: Research through Vietnamese development communities
3. **Local Partners**: Consult with Vietnamese payment integration specialists
4. **Sandbox Access**: Request sandbox credentials for hands-on testing

### 2. Payment Gateway Integration Patterns

Based on standard payment gateway integration practices applicable to VNPay:

#### 2.1 API Endpoints (Typical Structure)
```
# Payment Creation
POST /vnpay/payment/create
# Payment Query
GET /vnpay/payment/query
# Refund
POST /vnpay/payment/refund
# Webhook Notification
POST /vnpay/payment/webhook
```

#### 2.2 Authentication Methods
**VNPay typically uses:**
- **API Keys**: For service-to-service authentication
- **HMAC Signatures**: For request/response verification
- **Timestamp-based Nonces**: To prevent replay attacks

#### 2.3 Request Flow
1. **Payment Request**: Client-side initiation
2. **Redirect to VNPay**: Payment form submission
3. **Payment Processing**: VNPay handles payment
4. **Webhook Notification**: Real-time status update
5. **Confirmation**: Server-side verification and database update

### 3. Security Best Practices

#### 3.1 HMAC Signature Verification
```python
import hashlib
import hmac

def verify_vnpay_signature(data, secret_key):
    # Create signature string from request parameters
    signature_string = "&".join([f"{k}={v}" for k, v in sorted(data.items())])

    # Generate HMAC signature
    generated_signature = hmac.new(
        secret_key.encode('utf-8'),
        signature_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Compare with received signature
    return hmac.compare_digest(generated_signature, data['vnp_SecureHash'])
```

#### 3.2 Security Considerations
- **HTTPS Only**: All API calls must use HTTPS
- **Input Validation**: Strict validation of all payment parameters
- **Error Handling**: Comprehensive error handling for failed payments
- **Logging**: Secure logging of payment events (avoid sensitive data)
- **Rate Limiting**: Implement API rate limiting to prevent abuse

### 4. Error Handling and Status Codes

#### 4.1 Typical Payment Status Codes
- **00**: Success
- **01**: Failed (Invalid parameters)
- **02**: Failed (Bank declined)
- **04**: Processing
- **07**: Expired transaction
- **09**: Invalid signature

#### 4.2 Error Response Structure
```python
{
    "errorCode": "01",
    "errorMessage": "Invalid payment parameters",
    "transactionId": "TXN123456789",
    "timestamp": "2026-04-08T12:00:00Z"
}
```

### 5. FastAPI Integration Architecture

#### 5.1 Service Layer Pattern
```python
# app/services/vnpay_service.py
class VNPayService:
    def __init__(self, config: VNPayConfig):
        self.config = config
        self.base_url = "https://sandbox.vnpay.vn/paymentv2/vpcpay.html/"

    async def create_payment(self, order_data: OrderData) -> PaymentResponse:
        # Create payment request
        # Redirect to VNPay
        return payment_response

    async def verify_payment(self, response_data: dict) -> VerificationResult:
        # Verify HMAC signature
        # Update database
        return verification_result

    async def handle_webhook(self, webhook_data: dict) -> WebhookResult:
        # Process webhook notification
        return webhook_result
```

#### 5.2 API Route Structure
```python
# app/api/v1/endpoints/vnpay.py
router = APIRouter(prefix="/api/v1/vnpay", tags=["vnpay"])

@router.post("/payment/create")
async def create_payment(order: PaymentRequest) -> PaymentResponse:
    # Handle payment creation
    pass

@router.post("/webhook/verify")
async def vnpay_webhook(request: Request) -> WebhookResponse:
    # Handle VNPay webhook notifications
    pass
```

### 6. Testing Strategies

#### 6.1 Testing Environment Setup
- **Sandbox Testing**: Use VNPay's sandbox environment
- **Mock Services**: Create mock payment processors for unit testing
- **Webhook Testing**: Simulate webhook notifications
- **Integration Testing**: End-to-end payment flow testing

#### 6.2 Test Cases
```python
# tests/test_vnpay_integration.py
@pytest.mark.asyncio
async def test_payment_creation():
    # Test successful payment creation
    pass

@pytest.mark.asyncio
async def test_webhook_verification():
    # Test webhook signature verification
    pass

@pytest.mark.asyncio
async def test_error_handling():
    # Test various error scenarios
    pass
```

### 7. Integration Requirements

#### 7.1 Database Schema
```sql
-- Add to payments table
ALTER TABLE payments ADD COLUMN vnpay_transaction_id VARCHAR(50);
ALTER TABLE payments ADD COLUMN vnpay_response_code VARCHAR(10);
ALTER TABLE payments ADD COLUMN vnpay_response_message TEXT;
ALTER TABLE payments ADD COLUMN vnpay_signature_verified BOOLEAN;
ALTER TABLE payments ADD COLUMN vnpay_webhook_received_at TIMESTAMP;
```

#### 7.2 Configuration Management
```python
# app/config/vnpay.py
class VNPayConfig:
    vnpay_api_url: str
    vnpay_api_version: str = "2.1.0"
    vnpay_api_key: str
    vnpay_secret_key: str
    vnpay_merchant_id: str
    vnpay_payment_url: str
    vnpay_return_url: str
    vnpay_tmn_code: str
    vnpay_ip_address: str
```

### 8. Implementation Roadmap

#### 8.1 Phase 1: Foundation (Week 1)
1. **Obtain Official Documentation**
   - Contact VNPay support
   - Request sandbox credentials
   - Review official API documentation

2. **Setup Development Environment**
   - Configure sandbox environment
   - Set up database schema
   - Create configuration management

#### 8.2 Phase 2: Core Implementation (Week 2-3)
1. **Payment Service Layer**
   - Implement payment creation
   - Implement payment verification
   - Implement webhook handling

2. **API Endpoints**
   - Create payment endpoints
   - Webhook verification endpoints
   - Payment status query endpoints

#### 8.3 Phase 3: Testing & Validation (Week 4)
1. **Unit Testing**
   - Service layer tests
   - API endpoint tests
   - Webhook handling tests

2. **Integration Testing**
   - End-to-end payment flow
   - Error scenario testing
   - Performance testing

#### 8.4 Phase 4: Production Deployment (Week 5)
1. **Production Setup**
   - Configure production keys
   - Setup monitoring and logging
   - Implement rate limiting

2. **Go-Live**
   - Gradual rollout
   - Monitoring setup
   - Performance optimization

### 9. Risk Assessment

#### 9.1 High-Risk Factors
- **Documentation Availability**: Lack of accessible documentation
- **Language Barrier**: Vietnamese documentation may require translation
- **Support Response Time**: Potential delays in support responses
- **Sandbox Access**: Limited sandbox environment availability

#### 9.2 Mitigation Strategies
- **Alternative Payment Gateways**: Implement backup payment options
- **Community Engagement**: Join Vietnamese developer communities
- **Professional Support**: Consider paid VNPay support packages
- **Local Partners**: Engage with Vietnamese payment consultants

### 10. Next Steps

#### 10.1 Immediate Actions (Next 7 days)
1. **Contact VNPay Support**
   - Request official documentation
   - Apply for sandbox credentials
   - Schedule technical consultation

2. **Research Vietnamese Resources**
   - Join Vietnamese developer forums
   - Search for existing integration examples
   - Connect with payment integration specialists

#### 10.2 Medium-term Actions (Next 30 days)
1. **Proof of Concept Development**
   - Create minimal integration prototype
   - Test with sandbox environment
   - Validate payment flow

2. **Documentation Creation**
   - Create internal integration documentation
   - Build comprehensive test cases
   - Develop error handling procedures

## Conclusion

While VNPay integration presents challenges due to limited accessible documentation, the integration follows standard payment gateway patterns. The key to success is obtaining official documentation through direct channels and building a robust, well-tested integration architecture.

### Critical Success Factors
1. **Direct Documentation Access**: Essential for accurate implementation
2. **Security-First Approach**: Comprehensive HMAC verification and error handling
3. **Testing Rigor**: Extensive testing across all payment scenarios
4. **Fallback Strategies**: Alternative payment options for reliability

This research provides a foundation for successful VNPay integration, but direct engagement with VNPay resources is required for complete implementation.

---

**Related Documents:**
- [Payment State Machine Research](../reports/payment-state-machine-research.md)
- [FastAPI Payment Integration Patterns](../reports/fastapi-payment-patterns-research.md)
- [Momo Payment Gateway Research](../reports/momo-researcher-report.md)

**Next Steps:**
1. Contact VNPay support for official documentation
2. Request sandbox credentials for testing
3. Begin Phase 1 foundation work