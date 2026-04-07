"""
API router aggregation for v1 endpoints.

Combines all API route modules into a single router.
"""

from fastapi import APIRouter

# Import route modules (will be created in future sprints)
# from app.api.v1.endpoints import auth, venues, bookings, payments, etc.

api_router = APIRouter()

# Health check is already in main.py, but we can add v1 specific ones here
@api_router.get("/")
async def v1_root() -> dict[str, str]:
    """V1 API root endpoint."""
    return {
        "message": "ALOBO Booking API v1",
        "docs": "/docs",
    }

# Route modules will be included here as they are created
# Example:
# api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
# api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
