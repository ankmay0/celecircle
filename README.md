# CeleLink - Entertainment Industry Marketplace

A full-stack platform connecting artists/celebrities with event organizers, producers, and brands.

## Tech Stack
- **Backend**: FastAPI
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **Payments**: Stripe (configurable to Razorpay)

## Features
- Multi-role authentication (Artist, Organizer, Admin)
- Artist profiles with portfolio and AI scoring
- Gig/Event posting and application system
- Secure payment escrow system
- Real-time chat
- Reviews and ratings with AI moderation
- AI-powered recommendations

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (create `.env` file):
```
SECRET_KEY=your-secret-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

3. Run the application:
```bash
uvicorn main:app --reload
```

4. Access the application:
- Frontend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Database
SQLite database will be created automatically on first run. Use `python seed_data.py` to populate with sample data.

## Project Structure
```
celelink/
├── main.py                 # FastAPI application entry point
├── database.py             # Database connection and session
├── models.py               # SQLAlchemy models
├── schemas.py              # Pydantic schemas
├── auth.py                 # Authentication utilities
├── ai_service.py           # AI scoring and recommendations
├── payment_service.py      # Payment processing
├── routers/                # API route handlers
│   ├── auth.py
│   ├── users.py
│   ├── gigs.py
│   ├── payments.py
│   ├── chat.py
│   └── admin.py
├── static/                 # Static files (CSS, JS, images)
├── templates/              # HTML templates
└── uploads/                # User uploaded files
```

