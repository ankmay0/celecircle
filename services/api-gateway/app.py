import json
import os
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, Response


app = FastAPI(title="CeleCircle API Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SERVICE_MAP: Dict[str, str] = {
    "/api/auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "/api/users": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "/api/connections": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "/api/posts": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "/api/gigs": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "/api/reviews": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "/api/bookings": os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8003"),
    "/api/payments": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004"),
    "/api/admin": os.getenv("ADMIN_SERVICE_URL", "http://admin-service:8005"),
    "/api/news": os.getenv("NEWS_SERVICE_URL", "http://news-service:8006"),
    "/api/chat": os.getenv("MESSAGING_SERVICE_URL", "http://messaging-service:8007"),
    "/api/analytics": os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8008"),
}

HEALTH_SERVICES: Dict[str, str] = {
    "auth-service": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "user-service": os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "booking-service": os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8003"),
    "payment-service": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004"),
    "admin-service": os.getenv("ADMIN_SERVICE_URL", "http://admin-service:8005"),
    "news-service": os.getenv("NEWS_SERVICE_URL", "http://news-service:8006"),
    "messaging-service": os.getenv("MESSAGING_SERVICE_URL", "http://messaging-service:8007"),
    "analytics-service": os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8008"),
}

PROTECTED_PREFIXES = (
    "/api/users",
    "/api/connections",
    "/api/posts",
    "/api/gigs",
    "/api/reviews",
    "/api/bookings",
    "/api/payments",
    "/api/admin",
    "/api/chat",
    "/api/analytics",
)

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
DOWNSTREAM_TIMEOUT_SECONDS = float(os.getenv("DOWNSTREAM_TIMEOUT_SECONDS", "5"))
CB_FAILURE_THRESHOLD = int(os.getenv("CIRCUIT_BREAKER_FAILURE_THRESHOLD", "3"))
CB_COOLDOWN_SECONDS = int(os.getenv("CIRCUIT_BREAKER_COOLDOWN_SECONDS", "30"))

_WINDOWS = defaultdict(deque)
_metrics = {"requests_total": 0, "requests_by_status": defaultdict(int), "duration_seconds_sum": 0.0}
_circuit = defaultdict(lambda: {"failures": 0, "opened_until": 0.0})


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _match_service(path: str) -> Optional[str]:
    matched = None
    for prefix in SERVICE_MAP:
        if path.startswith(prefix):
            if matched is None or len(prefix) > len(matched):
                matched = prefix
    return matched


def _is_rate_limited(client_id: str) -> bool:
    now = time.time()
    q = _WINDOWS[client_id]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= RATE_LIMIT_PER_MINUTE:
        return True
    q.append(now)
    return False


def _is_protected(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in PROTECTED_PREFIXES)


def _verify_jwt(auth_header: str) -> Tuple[bool, Optional[str]]:
    auth_service = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
    internal_token = os.getenv("INTERNAL_SERVICE_TOKEN", "")
    headers = {"Authorization": auth_header}
    if internal_token:
        headers["X-Internal-Token"] = internal_token
    try:
        resp = requests.get(
            f"{auth_service}/api/auth/me",
            headers=headers,
            timeout=DOWNSTREAM_TIMEOUT_SECONDS,
        )
        if resp.status_code != 200:
            return False, None
        payload = resp.json() if resp.content else {}
        user_id = payload.get("id")
        return True, str(user_id) if user_id is not None else None
    except Exception:
        return False, None


def _circuit_open(service_prefix: str) -> bool:
    return time.time() < _circuit[service_prefix]["opened_until"]


def _mark_success(service_prefix: str) -> None:
    _circuit[service_prefix]["failures"] = 0
    _circuit[service_prefix]["opened_until"] = 0.0


def _mark_failure(service_prefix: str) -> None:
    state = _circuit[service_prefix]
    state["failures"] += 1
    if state["failures"] >= CB_FAILURE_THRESHOLD:
        state["opened_until"] = time.time() + CB_COOLDOWN_SECONDS
        state["failures"] = 0


def _log(request_id: str, method: str, route: str, status_code: int, response_time_ms: int, user_id: str = None):
    payload = {
        "timestamp": _utc_now_iso(),
        "request_id": request_id,
        "service_name": "api-gateway",
        "method": method,
        "route": route,
        "status_code": status_code,
        "response_time_ms": response_time_ms,
        "user_id": user_id,
    }
    print(json.dumps(payload, separators=(",", ":")))


@app.middleware("http")
async def gateway_middleware(request: Request, call_next):
    started = time.perf_counter()
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    user_id = None

    client_host = request.client.host if request.client else "unknown"
    if _is_rate_limited(client_host):
        resp = JSONResponse(status_code=429, content={"detail": "Rate limit exceeded", "request_id": request_id})
        resp.headers["X-Request-ID"] = request_id
        _record_and_log(request, resp.status_code, started, request_id, user_id)
        return resp

    if _is_protected(request.url.path):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            resp = JSONResponse(status_code=401, content={"detail": "Missing bearer token", "request_id": request_id})
            resp.headers["X-Request-ID"] = request_id
            _record_and_log(request, resp.status_code, started, request_id, user_id)
            return resp
        valid, user_id = _verify_jwt(auth_header)
        if not valid:
            resp = JSONResponse(status_code=401, content={"detail": "Invalid or expired token", "request_id": request_id})
            resp.headers["X-Request-ID"] = request_id
            _record_and_log(request, resp.status_code, started, request_id, user_id)
            return resp

    request.state.request_id = request_id
    request.state.user_id = user_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    _record_and_log(request, response.status_code, started, request_id, user_id)
    return response


def _record_and_log(request: Request, status_code: int, started: float, request_id: str, user_id: str) -> None:
    duration = time.perf_counter() - started
    _metrics["requests_total"] += 1
    _metrics["requests_by_status"][str(status_code)] += 1
    _metrics["duration_seconds_sum"] += duration
    _log(
        request_id=request_id,
        method=request.method,
        route=request.url.path,
        status_code=status_code,
        response_time_ms=int(duration * 1000),
        user_id=user_id,
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway", "timestamp": _utc_now_iso()}


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    lines = [
        "# HELP service_requests_total Total HTTP requests handled",
        "# TYPE service_requests_total counter",
        f'service_requests_total{{service="api-gateway"}} {_metrics["requests_total"]}',
        "# HELP service_request_duration_seconds_sum Sum of request durations",
        "# TYPE service_request_duration_seconds_sum counter",
        f'service_request_duration_seconds_sum{{service="api-gateway"}} {_metrics["duration_seconds_sum"]:.6f}',
    ]
    for code, count in sorted(_metrics["requests_by_status"].items()):
        lines.append(f'service_requests_by_status_total{{service="api-gateway",status="{code}"}} {count}')
    return "\n".join(lines) + "\n"


@app.get("/api/health")
def aggregate_health():
    statuses = {}
    overall_ok = True
    for name, base_url in HEALTH_SERVICES.items():
        try:
            resp = requests.get(f"{base_url}/health", timeout=DOWNSTREAM_TIMEOUT_SECONDS)
            body = resp.json() if resp.content else {}
            statuses[name] = {"status_code": resp.status_code, "body": body}
            if resp.status_code != 200:
                overall_ok = False
        except Exception as exc:
            statuses[name] = {"status_code": 503, "error": str(exc)}
            overall_ok = False
    return {
        "status": "ok" if overall_ok else "degraded",
        "service": "api-gateway",
        "timestamp": _utc_now_iso(),
        "services": statuses,
    }


@app.api_route(
    "/api/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)
async def proxy(full_path: str, request: Request):
    incoming_path = f"/api/{full_path}"
    prefix = _match_service(incoming_path)
    if not prefix:
        raise HTTPException(status_code=404, detail="No service mapping for path")

    if _circuit_open(prefix):
        return JSONResponse(
            status_code=503,
            content={"detail": "Service temporarily unavailable", "request_id": request.state.request_id},
        )

    base_url = SERVICE_MAP[prefix]
    query = request.url.query
    target_url = f"{base_url}{incoming_path}"
    if query:
        target_url = f"{target_url}?{query}"

    body = await request.body()
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length", "connection"}
    }
    headers["X-Request-ID"] = request.state.request_id
    if getattr(request.state, "user_id", None):
        headers["X-User-ID"] = request.state.user_id

    internal_token = os.getenv("INTERNAL_SERVICE_TOKEN", "")
    if internal_token:
        headers["X-Internal-Token"] = internal_token

    try:
        upstream = requests.request(
            request.method,
            target_url,
            headers=headers,
            data=body if body else None,
            timeout=DOWNSTREAM_TIMEOUT_SECONDS,
        )
    except requests.Timeout:
        _mark_failure(prefix)
        return JSONResponse(
            status_code=504,
            content={"detail": "Downstream timeout", "request_id": request.state.request_id},
        )
    except requests.RequestException as exc:
        _mark_failure(prefix)
        return JSONResponse(
            status_code=502,
            content={"detail": f"Upstream request failed: {exc}", "request_id": request.state.request_id},
        )

    if upstream.status_code >= 500:
        _mark_failure(prefix)
    else:
        _mark_success(prefix)

    excluded = {"content-encoding", "transfer-encoding", "connection"}
    response_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in excluded}
    response_headers["X-Request-ID"] = request.state.request_id
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
