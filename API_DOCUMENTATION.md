# CeleCircle API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "role": "artist" | "organizer"
}
```

#### Request OTP
```
POST /api/auth/request-otp
Body: {
  "email": "user@example.com"
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Body: {
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "access_token": "...",
  "token_type": "bearer"
}
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Profiles (Artists)

#### Create Profile
```
POST /api/users/profiles
Headers: Authorization: Bearer <token>
Body: {
  "name": "Artist Name",
  "category": "Singer",
  "location": "Mumbai, India",
  "languages": "Hindi, English",
  "bio": "Bio text",
  "min_price": 5000,
  "experience_years": 10
}
```

#### Get My Profile
```
GET /api/users/profiles/me
Headers: Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/users/profiles/me
Headers: Authorization: Bearer <token>
Body: {
  "name": "Updated Name",
  "bio": "Updated bio",
  ...
}
```

#### Get Profile by ID
```
GET /api/users/profiles/{profile_id}
```

#### Search Profiles
```
GET /api/users/profiles?category=Singer&location=Mumbai&min_price=1000
```

### Gigs

#### Create Gig
```
POST /api/gigs
Headers: Authorization: Bearer <token> (organizer/admin)
Body: {
  "title": "Wedding Singer Needed",
  "description": "Looking for a professional singer...",
  "category": "Singer",
  "location": "Mumbai, India",
  "event_date": "2024-12-25T18:00:00",
  "budget_min": 10000,
  "budget_max": 30000,
  "required_languages": "Hindi, English",
  "required_experience": 5
}
```

#### List Gigs
```
GET /api/gigs?category=Singer&location=Mumbai&status=open
```

#### Get Gig
```
GET /api/gigs/{gig_id}
```

#### Update Gig
```
PUT /api/gigs/{gig_id}
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated Title",
  "status": "closed",
  ...
}
```

#### Delete Gig
```
DELETE /api/gigs/{gig_id}
Headers: Authorization: Bearer <token>
```

### Applications

#### Apply to Gig
```
POST /api/gigs/{gig_id}/applications
Headers: Authorization: Bearer <token> (artist)
Body: {
  "proposal": "I would love to perform...",
  "quote": 25000
}
```

#### Get Gig Applications
```
GET /api/gigs/{gig_id}/applications
Headers: Authorization: Bearer <token> (organizer/admin)
```

#### Update Application Status
```
PUT /api/gigs/applications/{application_id}
Headers: Authorization: Bearer <token>
Body: {
  "status": "accepted" | "rejected" | "withdrawn"
}
```

### Payments

#### Create Payment
```
POST /api/payments
Headers: Authorization: Bearer <token> (organizer/admin)
Body: {
  "gig_id": 1,
  "artist_id": 2,
  "amount": 25000
}
Response: {
  "payment_id": 1,
  "client_secret": "...",
  "payment_intent_id": "..."
}
```

#### Confirm Payment
```
POST /api/payments/{payment_id}/confirm
Headers: Authorization: Bearer <token>
```

#### Release Payment
```
POST /api/payments/{payment_id}/release
Headers: Authorization: Bearer <token>
```

#### Refund Payment
```
POST /api/payments/{payment_id}/refund?amount=10000
Headers: Authorization: Bearer <token>
```

#### Get Payment
```
GET /api/payments/{payment_id}
Headers: Authorization: Bearer <token>
```

#### List Payments
```
GET /api/payments
Headers: Authorization: Bearer <token>
```

### Reviews

#### Create Review
```
POST /api/reviews
Headers: Authorization: Bearer <token> (organizer/admin)
Body: {
  "gig_id": 1,
  "artist_id": 2,
  "rating": 5,
  "comment": "Excellent performance!"
}
```

#### Get Artist Reviews
```
GET /api/reviews/artist/{artist_id}?verified_only=true
```

#### Get Gig Review
```
GET /api/reviews/gig/{gig_id}
```

### Chat

#### Send Message
```
POST /api/chat
Headers: Authorization: Bearer <token>
Body: {
  "receiver_id": 2,
  "gig_id": 1,
  "message": "Hello!"
}
```

#### Get Conversation
```
GET /api/chat/conversations/{user_id}?gig_id=1
Headers: Authorization: Bearer <token>
```

#### List Conversations
```
GET /api/chat/conversations
Headers: Authorization: Bearer <token>
```

### Notifications

#### Get Notifications
```
GET /api/chat/notifications?unread_only=true
Headers: Authorization: Bearer <token>
```

#### Mark Notification Read
```
PUT /api/chat/notifications/{notification_id}/read
Headers: Authorization: Bearer <token>
```

### Recommendations

#### Get Recommended Artists for Gig
```
GET /api/gigs/recommendations/artists/{gig_id}?limit=10
```

#### Get Recommended Gigs for Artist
```
GET /api/gigs/recommendations/for-me?limit=10
Headers: Authorization: Bearer <token> (artist)
```

### Admin

#### Dashboard Stats
```
GET /api/admin/dashboard
Headers: Authorization: Bearer <token> (admin)
```

#### List Users
```
GET /api/admin/users?role=artist&verified=true&limit=50
Headers: Authorization: Bearer <token> (admin)
```

#### Verify User
```
PUT /api/admin/users/{user_id}/verify
Headers: Authorization: Bearer <token> (admin)
```

#### Deactivate User
```
PUT /api/admin/users/{user_id}/deactivate
Headers: Authorization: Bearer <token> (admin)
```

#### Get Pending Reviews
```
GET /api/admin/reviews/pending
Headers: Authorization: Bearer <token> (admin)
```

#### Moderate Review
```
PUT /api/admin/reviews/{review_id}/moderate?approve=true
Headers: Authorization: Bearer <token> (admin)
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### User Roles
- `artist` - Artists/Celebrities
- `organizer` - Event Organizers/Recruiters
- `admin` - Platform Administrators

### Gig Status
- `draft` - Draft (not published)
- `open` - Open for applications
- `closed` - Closed (application accepted)
- `completed` - Event completed
- `cancelled` - Cancelled

### Application Status
- `pending` - Pending review
- `accepted` - Accepted by organizer
- `rejected` - Rejected
- `withdrawn` - Withdrawn by artist

### Payment Status
- `pending` - Payment pending
- `paid` - Payment confirmed (in escrow)
- `released` - Payment released to artist
- `refunded` - Payment refunded
- `failed` - Payment failed

