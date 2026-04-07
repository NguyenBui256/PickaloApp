"""
API router aggregation for v1 endpoints.

Combines all API route modules into a single router.
"""

from fastapi import APIRouter

# Import route modules
from app.api.v1.endpoints import auth, users

api_router = APIRouter()

# Health check is already in main.py, but we can add v1 specific ones here
@api_router.get("/")
async def v1_root() -> dict[str, str]:
    """V1 API root endpoint."""
    return {
        "message": "ALOBO Booking API v1",
        "docs": "/docs",
    }

# Include route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
