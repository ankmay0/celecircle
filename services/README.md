# CeleCircle Microservices Backend

This directory introduces a microservice-first backend structure while keeping
existing API paths backward compatible through the API Gateway.

## Services

- `auth-service`: registration/login/JWT/roles
- `user-service`: profiles and user-facing account endpoints
- `booking-service`: booking lifecycle and history
- `payment-service`: payment workflows and financial operations
- `admin-service`: admin controls, settings, oversight
- `news-service`: CeleNews fetch/filter/admin endpoints
- `messaging-service`: chat and conversation APIs
- `analytics-service`: analytics read-model API (event-ready placeholder)
- `api-gateway`: single public entry point for frontend clients

## Domain Boundaries

- Each service has its own app and deployment unit.
- Database ownership should remain per-service domain:
  - Auth: users and auth concerns
  - User: profiles
  - Booking: bookings
  - Payment: payments/payouts
  - Admin: audit logs/system settings
  - News: celebrity_news
  - Messaging: messages/conversations
  - Analytics: read model / event sink
- Current compose uses one PostgreSQL instance for convenience. You can move to
  per-service DB instances by changing each service `DATABASE_URL`.

## API Gateway

- Routes `/api/*` requests to the matching service.
- Applies:
  - JWT validation for protected paths (via auth service)
  - in-memory IP rate limiting
  - request-id propagation (`X-Request-ID`)
  - circuit breaker + timeout protection
  - centralized JSON logging
  - centralized upstream error handling

## Operational Hardening

- Every service exposes:
  - `GET /health` with service and timestamp
  - `GET /metrics` (Prometheus-friendly text)
- Every service enforces internal access token (`X-Internal-Token`) for non-health routes.
- Gateway exposes `GET /api/health` to aggregate downstream health.
- Gateway forwards:
  - `X-Request-ID`
  - `X-User-ID` (for authenticated calls)
  - `X-Internal-Token`

## Communication Strategy

- Synchronous: REST via API Gateway.
- Asynchronous: event bus placeholder in `services/common/event_bus.py`.
- Event contracts ready for future broker integration (Kafka/RabbitMQ):
  - `BookingRequested` -> payment domain
  - `PaymentAdvanceRequested` / `PaymentFinalRequested`
  - Extend for payment completed, refund issued, booking completed, analytics sync.

## Run

```bash
docker compose up --build
```

Gateway URL:
- `http://localhost:8000`

Health checks:
- `http://localhost:8000/health`
- `http://localhost:8001/health` ... `http://localhost:8008/health`
