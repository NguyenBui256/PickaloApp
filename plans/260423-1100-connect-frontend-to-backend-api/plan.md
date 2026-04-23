# Plan: Connect Frontend Mobile App to Backend API

**Date:** 2026-04-23
**Branch:** feat/nguyen
**Goal:** Replace all mock data in frontend services with real backend API calls

## Overview

The frontend currently has 5 service files (`auth-service.ts`, `venue-service.ts`, `booking-service.ts`, `merchant-service.ts`, `review-service.ts`) where every function has a **commented-out real API call** and an **active mock fallback**. The `api-client.ts` is already fully implemented with axios, auth interceptors, and token refresh. The TypeScript types in `api-types.ts` already match the backend schemas 1:1.

The migration is a **swap operation** per service function: uncomment the real API call, delete the mock fallback, and remove unused mock imports.

## Current State

### Frontend Infrastructure (READY)
- `api-client.ts` — Axios client with auth interceptors, token refresh, error handling
- `app-config.ts` — API_BASE_URL configured (`10.0.2.2:8000/api/v1` for emulator)
- `api-types.ts` — All TypeScript types mapped 1:1 with backend Pydantic schemas
- `auth-store.ts` — Zustand auth state with AsyncStorage persistence

### Backend API Endpoints (READY)
All routes mounted under `/api/v1`:
- `/auth/*` — login, register, refresh, logout, verify-phone, me, change-password
- `/venues/*` — list, nearby search, detail, availability, districts, merchant CRUD, services, pricing
- `/bookings/*` — create, list, detail, cancel, price-calculation
- `/merchant/bookings/*` — stats, list, detail, approve, reject, cancel, venue bookings
- `/reviews/*` — list by venue, create, update, delete

### Mock Data Usage (22 files reference mock data)
- `mock-data.ts` — Source of all mock data
- 5 service files — Active mock implementations
- ~15 screen files — Some import mock data directly (HIGHLIGHT_BANNERS, CATEGORIES, etc.)

## Phases

| Phase | Description | Status | Phase File |
|-------|-------------|--------|------------|
| 1 | Fix backend gaps & verify connectivity | Pending | phase-01-backend-gaps.md |
| 2 | Swap auth-service to real API | Pending | phase-02-auth-service.md |
| 3 | Swap venue-service to real API | Pending | phase-03-venue-service.md |
| 4 | Swap booking-service to real API | Pending | phase-04-booking-service.md |
| 5 | Swap merchant-service to real API | Pending | phase-05-merchant-service.md |
| 6 | Swap review-service to real API | Pending | phase-06-review-service.md |
| 7 | Update screens using direct mock imports | Pending | phase-07-screen-mock-removal.md |
| 8 | Integration testing & cleanup | Pending | phase-08-testing-cleanup.md |

## Gap Analysis (FE needs, BE missing)

### Critical (blocks core flows)
| Gap | Impact | Fix |
|-----|--------|-----|
| `VenueType` enum missing 'Pickleball' | Venues can't be created/listed as Pickleball | Add to `models/venue.py` |
| `GET /merchant/venues` doesn't exist | Owner can't see their venue list | Add endpoint |
| `BookingListItem` lacks `customerName`, `phone` | Owner booking management shows no customer info | Join User table in response |

### Medium (nice to have, can workaround)
| Gap | Impact | Fix |
|-----|--------|-----|
| No `PUT /venues/{id}/services/{serviceId}` | Can't update venue services | Add endpoint |
| No `DELETE /venues/{id}/services/{serviceId}` | Can't delete venue services | Add endpoint |
| No `POST /auth/me/avatar` | Can't upload profile picture | Add endpoint |
| `VenueServiceResponse` lacks `unit` field | Service unit display missing | Add field to schema |

### Low (FE-only, no BE needed)
| Gap | Solution |
|-----|----------|
| `distance` | FE calculates from user GPS + venue `location` |
| `hours` display | FE formats from `operating_hours.open/close` |
| `badges` | FE logic based on venue data |
| `HIGHLIGHT_BANNERS` | Static content, keep as constants or add admin API later |
| `CATEGORIES` | Derive from `VenueType` enum values |

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Backend not running / unreachable | HIGH | Verify Docker containers are up before starting |
| Schema mismatch between FE types & BE response | MEDIUM | Test each endpoint after swap, adjust types if needed |
| Auth token not persisted correctly | HIGH | Test login flow end-to-end first |
| CORS blocking requests from emulator | MEDIUM | Verify backend CORS includes emulator origin |

## Dependencies
- Backend server running (`docker-compose up`)
- PostgreSQL with seeded data
- Android emulator or physical device for testing
