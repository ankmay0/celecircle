from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import auth  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)


init_db()
app = FastAPI(title="CeleCircle Auth Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "auth-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "auth-service", _metrics)


# Alias endpoints requested in architecture brief.
@app.get("/auth/roles")
def roles():
    return {"roles": ["artist", "organizer", "admin"]}


@app.get("/auth/verify")
def verify_alias():
    return RedirectResponse(url="/api/auth/me", status_code=307)
