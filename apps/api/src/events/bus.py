from __future__ import annotations

from typing import Callable, Dict, List, Type, Any
from asyncio import iscoroutinefunction

from .events import Event


EventHandler = Callable[[Event], Any]


class EventBus:
    """Simple in-memory event bus supporting sync/async listeners."""

    def __init__(self) -> None:
        self._listeners: Dict[Type[Event], List[EventHandler]] = {}

    def subscribe(self, event_type: Type[Event], handler: EventHandler) -> None:
        handlers = self._listeners.setdefault(event_type, [])
        handlers.append(handler)

    async def publish(self, event: Event) -> None:
        handlers = self._listeners.get(type(event), [])
        for handler in handlers:
            if iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)


# Global bus instance for the app
bus = EventBus()

