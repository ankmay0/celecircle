from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import users, connections, posts, gigs, reviews  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)


init_db()
app = FastAPI(title="CeleCircle User Profile Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users.router)
app.include_router(connections.router)
app.include_router(posts.router)
app.include_router(gigs.router)
app.include_router(reviews.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "user-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "user-service", _metrics)


# Domain-friendly aliases (kept in addition to /api/users/*).
@app.get("/profiles/{profile_id}")
def get_profile_alias(profile_id: int):
    return RedirectResponse(url=f"/api/users/profiles/{profile_id}", status_code=307)


@app.put("/profiles/update")
def update_profile_alias():
    return RedirectResponse(url="/api/users/profiles/me", status_code=307)


@app.post("/profiles/upload-photo")
def upload_photo_alias():
    return RedirectResponse(url="/api/users/me/profile-photo", status_code=307)
