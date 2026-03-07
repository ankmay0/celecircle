"""
Lightweight event bus placeholder.

Designed so we can swap to Kafka/RabbitMQ later without
changing service business logic calls.
"""

from datetime import datetime
from typing import Any, Dict


class EventBus:
    def __init__(self, service_name: str):
        self.service_name = service_name

    def publish(self, event_name: str, payload: Dict[str, Any]) -> None:
        # Placeholder implementation (log-only).
        # Replace with real broker producer in future.
        print(
            f"[event-bus] {datetime.utcnow().isoformat()} "
            f"service={self.service_name} event={event_name} payload={payload}"
        )


def get_event_bus(service_name: str) -> EventBus:
    return EventBus(service_name)
