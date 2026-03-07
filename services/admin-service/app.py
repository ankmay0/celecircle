from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import admin  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

init_db()
app = FastAPI(title="CeleCircle Admin Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(admin.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "admin-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "admin-service", _metrics)


@app.get("/admin/users")
def admin_users_alias():
    return RedirectResponse(url="/api/admin/users", status_code=307)


@app.get("/admin/bookings")
def admin_bookings_alias():
    return RedirectResponse(url="/api/admin/bookings", status_code=307)


@app.get("/admin/finance")
def admin_finance_alias():
    return RedirectResponse(url="/api/admin/finance", status_code=307)


@app.get("/admin/settings")
def admin_settings_alias():
    return RedirectResponse(url="/api/admin/pricing", status_code=307)


@app.get("/admin/audit-logs")
def admin_audit_alias():
    return RedirectResponse(url="/api/admin/audit-logs", status_code=307)
