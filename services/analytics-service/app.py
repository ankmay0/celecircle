from pathlib import Path
import sys

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from services.common.security import validate_internal_token  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

app = FastAPI(title="CeleCircle Analytics Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
_metrics = build_metrics_state()
install_operational_middleware(app, "analytics-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "analytics-service", _metrics)


@app.get("/analytics/admin")
def analytics_admin(_: bool = Depends(validate_internal_token)):
    return {
        "scope": "admin",
        "message": "Analytics read-model endpoint ready for event-sync integration",
    }


@app.get("/analytics/artist")
def analytics_artist():
    return {
        "scope": "artist",
        "message": "Artist analytics endpoint ready",
    }


@app.get("/analytics/organizer")
def analytics_organizer():
    return {
        "scope": "organizer",
        "message": "Organizer analytics endpoint ready",
    }


@app.get("/api/analytics/admin")
def api_analytics_admin(_: bool = Depends(validate_internal_token)):
    return analytics_admin(True)


@app.get("/api/analytics/artist")
def api_analytics_artist():
    return analytics_artist()


@app.get("/api/analytics/organizer")
def api_analytics_organizer():
    return analytics_organizer()
