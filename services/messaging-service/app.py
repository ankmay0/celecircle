from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from database import init_db  # noqa: E402
from routers import chat  # noqa: E402
from services.common.observability import (  # noqa: E402
    build_metrics_state,
    install_operational_middleware,
    register_health_and_metrics,
)

init_db()
app = FastAPI(title="CeleCircle Messaging Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chat.router)
_metrics = build_metrics_state()
install_operational_middleware(app, "messaging-service", _metrics, enforce_internal_auth=True)
register_health_and_metrics(app, "messaging-service", _metrics)


@app.post("/messages/send")
def messages_send_alias():
    return RedirectResponse(url="/api/chat", status_code=307)


@app.get("/messages/conversation/{user_id}")
def messages_conversation_alias(user_id: int):
    return RedirectResponse(url=f"/api/chat/conversations/{user_id}", status_code=307)
