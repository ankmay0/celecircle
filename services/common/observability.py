import json
import os
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_metrics_state() -> Dict[str, Any]:
    return {
        "requests_total": 0,
        "requests_by_status": defaultdict(int),
        "duration_seconds_sum": 0.0,
    }


def install_operational_middleware(
    app: FastAPI,
    service_name: str,
    metrics_state: Dict[str, Any],
    enforce_internal_auth: bool = True,
) -> None:
    bypass_paths = {"/health", "/metrics", "/docs", "/redoc", "/openapi.json"}

    @app.middleware("http")
    async def operational_middleware(request: Request, call_next):
        started = time.perf_counter()
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        user_id = request.headers.get("X-User-ID")

        if enforce_internal_auth and request.url.path not in bypass_paths:
            required = os.getenv("INTERNAL_SERVICE_TOKEN", "").strip()
            incoming = request.headers.get("X-Internal-Token", "")
            if required and incoming != required:
                response = JSONResponse(
                    status_code=401,
                    content={"detail": "Unauthorized internal service access"},
                )
                response.headers["X-Request-ID"] = request_id
                _log(
                    service_name=service_name,
                    request_id=request_id,
                    method=request.method,
                    route=request.url.path,
                    status_code=response.status_code,
                    response_time_ms=_duration_ms(started),
                    user_id=user_id,
                )
                _record_metrics(metrics_state, response.status_code, started)
                return response

        try:
            response = await call_next(request)
        except Exception:
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "request_id": request_id},
            )

        duration_ms = _duration_ms(started)
        response.headers["X-Request-ID"] = request_id
        _log(
            service_name=service_name,
            request_id=request_id,
            method=request.method,
            route=request.url.path,
            status_code=response.status_code,
            response_time_ms=duration_ms,
            user_id=user_id,
        )
        _record_metrics(metrics_state, response.status_code, started)
        return response


def register_health_and_metrics(
    app: FastAPI, service_name: str, metrics_state: Dict[str, Any]
) -> None:
    @app.get("/health")
    def health():
        return {"status": "ok", "service": service_name, "timestamp": utc_now_iso()}

    @app.get("/metrics", response_class=PlainTextResponse)
    def metrics():
        lines = [
            "# HELP service_requests_total Total HTTP requests handled",
            "# TYPE service_requests_total counter",
            f'service_requests_total{{service="{service_name}"}} {metrics_state["requests_total"]}',
            "# HELP service_request_duration_seconds_sum Sum of request durations",
            "# TYPE service_request_duration_seconds_sum counter",
            f'service_request_duration_seconds_sum{{service="{service_name}"}} {metrics_state["duration_seconds_sum"]:.6f}',
        ]
        for code, count in sorted(metrics_state["requests_by_status"].items()):
            lines.append(
                f'service_requests_by_status_total{{service="{service_name}",status="{code}"}} {count}'
            )
        return "\n".join(lines) + "\n"


def _duration_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)


def _record_metrics(metrics_state: Dict[str, Any], status_code: int, started: float) -> None:
    metrics_state["requests_total"] += 1
    metrics_state["requests_by_status"][str(status_code)] += 1
    metrics_state["duration_seconds_sum"] += time.perf_counter() - started


def _log(
    service_name: str,
    request_id: str,
    method: str,
    route: str,
    status_code: int,
    response_time_ms: int,
    user_id: str = None,
) -> None:
    payload = {
        "timestamp": utc_now_iso(),
        "request_id": request_id,
        "service_name": service_name,
        "method": method,
        "route": route,
        "status_code": status_code,
        "response_time_ms": response_time_ms,
        "user_id": user_id,
    }
    print(json.dumps(payload, separators=(",", ":")))
