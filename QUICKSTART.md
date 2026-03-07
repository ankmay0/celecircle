# CeleLink - Quick Start Guide

## Installation

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
# Copy the example env file
# On Windows:
copy .env.example .env

# On Linux/Mac:
cp .env.example .env
```

Edit `.env` and set your `SECRET_KEY` (use a strong random string in production).

3. **Initialize database and seed data:**
```bash
python seed_data.py
```

This will create:
- Admin user: `admin@celelink.com` / `admin123`
- Sample artists and organizers
- Sample gigs
- All users password: `password123`

## Running the Application

```bash
uvicorn main:app --reload
```

The application will be available at:
- **Frontend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## Testing the Application

### As an Artist:
1. Login with: `singer@example.com` / `password123`
2. Go to Profile page and complete your profile
3. Browse available gigs
4. Apply to gigs with proposals and quotes
5. Chat with organizers
6. Track payments and earnings

### As an Organizer:
1. Login with: `organizer1@example.com` / `password123`
2. Post a new gig
3. Review applications from artists
4. Accept applications
5. Create payments (escrow)
6. Release payments after event completion
7. Review artists

### As Admin:
1. Login with: `admin@celelink.com` / `admin123`
2. View dashboard statistics
3. Manage users (verify, deactivate)
4. Moderate reviews
5. Handle disputes

## Features Overview

### ✅ Authentication
- Email + password registration
- OTP verification (simulated in dev mode)
- JWT token-based authentication
- Role-based access control

### ✅ Artist Profiles
- Create and update profiles
- Upload portfolio (images/videos)
- Set pricing range
- AI-generated score based on:
  - Profile completeness
  - Reviews and ratings
  - Number of hires
  - Response time

### ✅ Gig System
- Organizers post gigs with budget, date, location
- Artists browse and apply to gigs
- Organizers review applications
- Accept/reject applications
- Direct hire invitations

### ✅ Payments (Escrow)
- Secure payment processing
- Escrow system (payment held until event completion)
- Payment release after event
- Refund capability
- Mock payments for development (set `USE_MOCK_PAYMENTS=true`)

### ✅ Chat & Notifications
- Real-time messaging between users
- In-app notifications
- Unread message indicators

### ✅ Reviews & Ratings
- Organizers review artists after events
- AI-powered moderation
- Verified reviews only
- Average rating calculation

### ✅ AI Recommendations
- Recommended artists for gigs
- Recommended gigs for artists
- Based on category, location, budget, AI score

### ✅ Admin Dashboard
- Platform statistics
- User management
- Review moderation
- Dispute handling

## Payment Integration

### Development Mode
By default, the app uses mock payments. Set `USE_MOCK_PAYMENTS=true` in `.env`.

### Production Mode
1. Get Stripe API keys from https://stripe.com
2. Set in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   USE_MOCK_PAYMENTS=false
   ```

## Database

The application uses SQLite by default (`celelink.db`). For production, consider:
- PostgreSQL
- MySQL
- Update `database.py` with your database connection string

## Frontend

The frontend is built with vanilla HTML, CSS, and JavaScript:
- Responsive design
- Dark/Light theme toggle
- Modern UI with smooth animations
- Mobile-friendly

## API Documentation

See `API_DOCUMENTATION.md` for complete API reference.

## Troubleshooting

### Database errors
- Delete `celelink.db` and run `python seed_data.py` again

### Authentication errors
- Check that JWT token is included in requests
- Verify user is verified (check email verification)

### Payment errors
- Ensure `USE_MOCK_PAYMENTS=true` for development
- Check Stripe keys are correct for production

## Next Steps

1. **Production Deployment:**
   - Use PostgreSQL instead of SQLite
   - Set up proper email service for OTP
   - Configure Redis for OTP storage
   - Set up proper file storage (S3, etc.)
   - Enable HTTPS
   - Set strong SECRET_KEY

2. **Enhancements:**
   - Add file upload for portfolio
   - Implement real-time chat with WebSockets
   - Add email notifications
   - Enhance AI scoring algorithm
   - Add geolocation-based search
   - Implement advanced filtering

3. **Security:**
   - Add rate limiting
   - Implement CSRF protection
   - Add input validation
   - Set up logging and monitoring

## Support

For issues or questions, refer to:
- `README.md` - Project overview
- `API_DOCUMENTATION.md` - API reference
- Code comments in source files

