from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import payments  # noqa: E402
from services.common.event_bus import get_event_bus  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

init_db()
event_bus = get_event_bus("payment-service")

app = FastAPI(title="CeleCircle Payment Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(payments.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "payment-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "payment-service", _metrics)


@app.post("/payments/advance")
def payment_advance_alias():
    event_bus.publish("PaymentAdvanceRequested", {"source": "payment-service"})
    return RedirectResponse(url="/api/payments", status_code=307)


@app.post("/payments/final")
def payment_final_alias():
    event_bus.publish("PaymentFinalRequested", {"source": "payment-service"})
    return RedirectResponse(url="/api/payments", status_code=307)


@app.post("/payments/{payment_id}/refund")
def payment_refund_alias(payment_id: int):
    return RedirectResponse(url=f"/api/payments/{payment_id}/refund", status_code=307)


@app.get("/payments/history")
def payment_history_alias():
    return RedirectResponse(url="/api/payments/me", status_code=307)
