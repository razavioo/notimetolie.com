from __future__ import annotations

import logging
from .events import Event

logger = logging.getLogger("events")


def logging_listener(event: Event) -> None:
    try:
        logger.info("event", extra={"event": type(event).__name__, **event.__dict__})
    except Exception:
        # Never fail due to logging
        pass

