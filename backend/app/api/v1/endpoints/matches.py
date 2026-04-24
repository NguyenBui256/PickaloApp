from decimal import Decimal
import uuid
from datetime import time, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.match import MatchSkillLevel
from app.schemas.match import (
    MatchCreate,
    MatchResponse,
    MatchRequestCreate,
    MatchRequestResponse
)
from app.services.match import MatchService

router = APIRouter()


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_in: MatchCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Publish a booking to create a public match.
    """
    match_service = MatchService(db)
    try:
        match = await match_service.create_match(
            booking_id=match_in.booking_id,
            slots_needed=match_in.slots_needed,
            price_per_slot=match_in.price_per_slot,
            skill_level=match_in.skill_level,
            note=match_in.note,
            owner_id=current_user.id
        )
        return match
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/nearby", response_model=list[dict])
async def search_nearby_matches(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(5000, description="Search radius in meters"),
    skill_level: MatchSkillLevel = Query(None, description="Filter by skill level"),
    min_slots: int = Query(None, description="Minimum available slots required"),
    date: date | None = Query(None, description="Filter by booking date (YYYY-MM-DD)"),
    start_time: time | None = Query(None, description="Filter by start time (HH:MM:SS)"),
    end_time: time | None = Query(None, description="Filter by end time (HH:MM:SS)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Find open matches near a specific location.
    """
    match_service = MatchService(db)
    matches_data, total = await match_service.search_nearby_matches(
        lat=lat,
        lng=lng,
        radius=radius,
        skill_level=skill_level,
        min_slots=min_slots,
        date=date,
        start_time=start_time,
        end_time=end_time,
        skip=skip,
        limit=limit
    )
    
    # Format response: Tuple is (Match, lat, lng, distance, venue_name, venue_address)
    items = []
    for match, v_lat, v_lng, dist, v_name, v_addr in matches_data:
        # Load slots and owner info (ensure session is active)
        booking = match.booking
        host_name = booking.user.full_name or booking.user.phone if booking and booking.user else "Unknown"
        
        start_t = None
        end_t = None
        if booking and booking.slots:
            start_t = min(s.start_time for s in booking.slots).strftime("%H:%M")
            end_t = max(s.end_time for s in booking.slots).strftime("%H:%M")

        match_dict = {
            "id": str(match.id),
            "booking_id": str(match.booking_id),
            "slots_needed": match.slots_needed,
            "slots_filled": match.slots_filled,
            "available_slots": match.available_slots,
            "price_per_slot": float(match.price_per_slot),
            "skill_level": match.skill_level,
            "note": match.note,
            "status": match.status,
            "created_at": match.created_at.isoformat(),
            "updated_at": match.updated_at.isoformat(),
            "location": {"lat": v_lat, "lng": v_lng},
            "distance": dist,
            "venue_name": v_name,
            "venue_address": v_addr,
            "host_name": host_name,
            "start_time": start_t,
            "end_time": end_t,
            "booking_date": booking.booking_date.isoformat() if booking else None,
        }
        items.append(match_dict)
        
    return items


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match_details(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get match details."""
    match_service = MatchService(db)
    match = await match_service.get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("/{match_id}/requests", response_model=MatchRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_to_join_match(
    match_id: uuid.UUID,
    req_in: MatchRequestCreate,
    initial_message: str | None = Query(None, description="Optional initial message to the host"),
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request to join an open match. Creates a pending request and a chat room.
    """
    match_service = MatchService(db)
    try:
        req = await match_service.create_request(
            match_id=match_id,
            requester_id=current_user.id,
            member_count=req_in.member_count,
            initial_message=initial_message
        )
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{req_id}/respond", response_model=MatchRequestResponse)
async def respond_to_request(
    req_id: uuid.UUID,
    accept: bool = Query(..., description="True to accept, False to reject"),
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Host accepts or rejects a match request.
    """
    match_service = MatchService(db)
    try:
        req = await match_service.respond_to_request(
            request_id=req_id,
            owner_id=current_user.id,
            accept=accept
        )
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
