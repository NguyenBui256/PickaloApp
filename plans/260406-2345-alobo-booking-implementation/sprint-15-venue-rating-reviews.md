---
title: "Sprint 15: Venue Rating & Reviews"
description: "Implementation of user reviews and ratings for venues with booking verification"
status: pending
priority: P2
effort: 8h
tags: [api, reviews, ratings, validation]
created: 2026-04-22
---

# Sprint 15: Venue Rating & Reviews

## Overview

Implement a rating and review system that allows users to share their experiences. To ensure authenticity, only users who have completed at least one booking at a venue can submit a review for that venue.

**Priority:** P2 (Medium - enhances user trust and venue discovery)
**Current Status:** Pending

## Context Links

- PRD: `D:\PTIT\PickaloApp\PRD.md` (Section 3.1: Venue Details & Ratings)
- Sprint 1: `./sprint-01-database-models.md` (Base models)
- Sprint 4: `./sprint-03-venue-management.md` (Venue logic)

## Key Insights

1. **Verified Reviews**: Users must have at least one `COMPLETED` booking at the target venue to post a review.
2. **One Review per User**: To prevent spam, each user can post only one review per venue (but can update it).
3. **Rating Impact**: New ratings should trigger a recalculation of the venue's overall average rating.
4. **Content Moderation**: Stores comments and optional images for visual feedback.

## Requirements

### Functional Requirements

1. **Submit Review**: Users rate (1-5 stars) and comment on a venue they've visited.
2. **List Reviews**: Publicly view all reviews for a specific venue with pagination.
3. **Verify Eligibility**: Backend check for `COMPLETED` status in booking history for that specific venue.
4. **Edit/Delete Review**: Users can manage their own reviews.
5. **Venue Stats**: Update `average_rating` and `total_reviews` in the `venues` table.

### Non-Functional Requirements

1. **Integrity**: Prevent multiple ratings from the same user on the same venue.
2. **Performance**: Denormalize rating stats on the Venue model to avoid heavy JOINs during search.

## Architecture

### API Endpoints

```
PUBLIC ENDPOINTS
├── GET  /api/v1/venues/:id/reviews          # List reviews for a venue

USER ENDPOINTS (Auth Required)
├── POST   /api/v1/venues/:id/reviews        # Submit a new review
├── PUT    /api/v1/reviews/:id               # Update own review
└── DELETE /api/v1/reviews/:id               # Remove own review
```

### Database Schema (New Table)

```sql
-- Venue Reviews Table
CREATE TABLE venue_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSONB,  -- Array of URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, venue_id) -- Only one review per user per venue
);
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `backend/app/models/review.py` | VenueReview SQLAlchemy model |
| `backend/app/schemas/review.py` | Pydantic schemas for reviews |
| `backend/app/services/review.py` | Business logic for ratings & validation |
| `backend/app/api/v1/endpoints/reviews.py` | API endpoints for reviews |

### Files to Modify

| Path | Changes |
|------|---------|
| `backend/app/models/venue.py` | Add `rating` and `review_count` fields |
| `backend/app/api/v1/api.py` | Register reviews router |

## Implementation Steps

### Step 1: Database Model (1h)

1. Create `backend/app/models/review.py`.
2. Add `VenueReview` model with fields: `user_id`, `venue_id`, `rating`, `comment`, `images`.
3. Add `UniqueConstraint` on `(user_id, venue_id)`.
4. Update `Venue` model in `backend/app/models/venue.py` to include summary fields.

### Step 2: Pydantic Schemas (1h)

1. Create `backend/app/schemas/review.py`:
   - `ReviewCreate`: rating, comment, optional images.
   - `ReviewResponse`: Full review details with User info (name, avatar).
   - `ReviewUpdate`: Optional rating/comment.

### Step 3: Review Service (3h)

1. Implement `create_review`:
   - **Check Eligibility**: Query `bookings` table for `user_id`, `venue_id`, and `status='COMPLETED'`.
   - **Check Existing**: Prevent duplicate reviews.
   - **Save Review**: Insert record.
   - **Update Venue Stats**: Calculate new average and count, update `Venue` record.
2. Implement `get_venue_reviews`: Paginated query with User relationship.
3. Implement `delete_review`: Remove record and update Venue stats.

### Step 4: API Endpoints (2h)

1. Create `backend/app/api/v1/endpoints/reviews.py`.
2. Implement the routes and link to Service layer.
3. Register in `api.py`.

### Step 5: Testing (1h)

1. Test rating with no bookings (should fail 403).
2. Test rating with `PENDING` booking (should fail 403).
3. Test rating with `COMPLETED` booking (should succeed 201).
4. Verify Venue average rating updates correctly.

## Success Criteria

1. Only users with a `COMPLETED` booking history at a venue can rate it.
2. Venue details show updated average rating and total counts.
3. Users can only have one active review per venue.
4. Reviews are paginated and show reviewer names/avatars.
