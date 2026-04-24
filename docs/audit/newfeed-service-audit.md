# Newfeed Service Audit (Social Recruitment)

## 1. Overview
This service manages the social interaction part of PickaloApp, specifically focusing on "Recruit Member" (Tuyển thành viên) posts where players can find partners for their booked pickleball matches.

## 2. API Endpoints

### 2.1. Recruitment Posts
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/posts` | Fetch list of recruitment posts | [NEW] |
| POST | `/api/v1/posts` | Create a new recruitment post | [NEW] |
| GET | `/api/v1/posts/{id}` | Get specific post details | [NEW] |
| POST | `/api/v1/posts/{id}/report` | Report a post for violations | [NEW] |

### 2.2. Comments
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/posts/{id}/comments` | Add a comment to a post | [NEW] |
| DELETE | `/api/v1/posts/{id}/comments/{commentId}` | Delete own comment | [NEW] |

### 2.3. Integration with Booking Service
| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/me/bookings` | Fetch user's bookings to associate with a post | [PENDING] |

---

## 3. Data Models

### 3.1. Post Object
```json
{
  "id": "string (UUID)",
  "user": {
    "id": "string",
    "name": "string",
    "avatar": "url_string"
  },
  "content": "string (max 1000 chars)",
  "venue": {
    "id": "string",
    "name": "string",
    "address": "string"
  },
  "booking_details": {
    "booking_id": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:mm - HH:mm"
  },
  "comments": [
    {
      "id": "string",
      "user_name": "string",
      "content": "string",
      "created_at": "ISO8601",
      "is_mine": "boolean"
    }
  ],
  "created_at": "ISO8601"
}
```

---

## 4. Backend Gaps & Requirements

### 4.1. Missing Endpoints (Backend needs to implement)
- **POST `/api/v1/posts`**: Needs logic to validate that the `booking_id` belongs to the user and is still in the future.
- **Report System**: Needs a reporting table and admin notification logic.
- **My Bookings**: Frontend needs a specific endpoint to list "Active/Future Bookings" that haven't been posted yet to avoid duplicates.

### 4.2. Logic Requirements
- **Post Persistence**: If a user cancels their booking, the recruitment post should either be automatically deleted or marked as "Canceled".
- **Comment Permissions**: A user can only delete their own comments.
- **Anti-Spam**: Rate limiting for post creation and commenting.

## 5. Frontend To-Do
- [x] Create Social Feed UI (Highlights Tab).
- [x] Implement Post Creation Overlay.
- [x] Implement Comment/Delete Logic (Mock).
- [x] Integrate Venue Overlay navigation from Posts.
- [ ] Connect with real `NewfeedService` once BE is ready.
