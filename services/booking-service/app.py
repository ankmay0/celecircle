from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import bookings  # noqa: E402
from services.common.event_bus import get_event_bus  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

init_db()
event_bus = get_event_bus("booking-service")

app = FastAPI(title="CeleCircle Booking Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(bookings.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "booking-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "booking-service", _metrics)


@app.post("/bookings/create")
def booking_create_alias():
    # Event naming contract placeholder for future broker integration.
    event_bus.publish("BookingRequested", {"source": "booking-service"})
    return RedirectResponse(url="/api/bookings", status_code=307)


@app.get("/bookings/{booking_id}")
def booking_get_alias(booking_id: int):
    return RedirectResponse(url=f"/api/bookings/{booking_id}", status_code=307)


@app.put("/bookings/{booking_id}/update-status")
def booking_update_status_alias(booking_id: int):
    return RedirectResponse(url=f"/api/bookings/{booking_id}/admin-status", status_code=307)


@app.get("/bookings/list")
def booking_list_alias():
    return RedirectResponse(url="/api/bookings", status_code=307)
