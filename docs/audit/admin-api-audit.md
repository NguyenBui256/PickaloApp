# Admin API Audit & Integration Plan

This document outlines the administrative APIs required for the PickaloApp and their current implementation status (Mock vs. Backend).

## 1. Statistics & Overview
**Objective:** Provide a high-level overview of system health and performance.

| Feature | Endpoint | Method | Mock Status | Backend Status |
| :--- | :--- | :--- | :--- | :--- |
| System Stats | `/admin/stats` | GET | ✅ Implemented | 🔴 Pending |
| Revenue Report | `/admin/revenue` | GET | ✅ Implemented | 🔴 Pending |

**Note:** Currently using `getAdminStats` in `admin-service.ts`.

## 2. User & Merchant Management
**Objective:** Moderate accounts, handle bans, and view owner associations.

| Feature | Endpoint | Method | Mock Status | Backend Status |
| :--- | :--- | :--- | :--- | :--- |
| List Users | `/admin/users?role={ROLE}` | GET | ✅ Implemented | 🔴 Pending |
| Toggle Status | `/admin/users/{id}/status` | PATCH | ✅ Implemented | 🔴 Pending |
| List Owner Venues | `/venues/merchant/{owner_id}` | GET | ✅ Implemented | 🔴 Pending |

**Logic:** 
- Admins can lock/unlock accounts.
- Merchants can be expanded to show all registered venues.

## 3. Venue Moderation
**Objective:** Verify new registrations and soft-delete inactive/violating venues.

| Feature | Endpoint | Method | Mock Status | Backend Status |
| :--- | :--- | :--- | :--- | :--- |
| List Venues | `/admin/venues?status={STATUS}` | GET | ✅ Implemented | 🔴 Pending |
| Verify Venue | `/venues/{id}/verify` | POST | ✅ Implemented | 🟡 venues.py:L503 |
| Update Status | `/venues/merchant/{id}` | PUT | ✅ Implemented | 🟡 venues.py:L307 |

**Details:** 
- Statuses: `ACTIVE`, `PENDING`, `DELETED`.
- Admin can "Undo Delete" by updating status back to `ACTIVE`.

## 4. Content Moderation (Social)
**Objective:** Handle user reports on "Hire Player" or "Recruit Member" posts.

| Feature | Endpoint | Method | Mock Status | Backend Status |
| :--- | :--- | :--- | :--- | :--- |
| List Reported | `/admin/reports` | GET | ✅ Implemented | 🔴 Pending |
| Resolve Report | `/admin/reports/{id}` | PATCH | ✅ Implemented | 🔴 Pending |
| Delete Post | `/posts/{id}` | DELETE | ✅ Implemented | 🔴 Pending |

## 5. UI Customizations for Admin
- **VenueDetails:** Shared screen, but filters out `Booking`, `Favorite`, and `Share` features for roles with `ADMIN`.
- **VenueDetails Actions:** Replaces booking with a `Delete` action in the top header.

---
*Last Updated: 2026-04-23*
