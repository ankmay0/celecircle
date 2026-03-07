from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import news  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

init_db()
app = FastAPI(title="CeleCircle News Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(news.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "news-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "news-service", _metrics)


@app.get("/news")
def news_alias():
    return RedirectResponse(url="/api/news/articles", status_code=307)


@app.post("/news/fetch")
def news_fetch_alias():
    return RedirectResponse(url="/api/news/admin/fetch", status_code=307)
