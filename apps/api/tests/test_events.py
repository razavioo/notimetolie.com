import pytest
from unittest.mock import AsyncMock, Mock

from src.events.bus import EventBus
from src.events.events import UserRegistered


@pytest.mark.asyncio
async def test_event_bus_subscribe_and_publish():
    bus = EventBus()
    handler = AsyncMock()
    bus.subscribe(UserRegistered, handler)

    import uuid
    evt = UserRegistered(user_id=uuid.uuid4(), username="alice", email="a@example.com")
    await bus.publish(evt)

    handler.assert_awaited_once()
    called_evt = handler.await_args.args[0]
    assert isinstance(called_evt, UserRegistered)
    assert called_evt.username == "alice"
