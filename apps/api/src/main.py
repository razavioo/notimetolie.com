from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import users_router, blocks_router, paths_router, search_router
from .services.search import ensure_index_bootstrapped
from .events.bus import bus
from .events.listeners import search_index_listener, notification_listener
from .events.logging_listener import logging_listener
from .events.events import (
    UserRegistered,
    BlockCreated,
    BlockUpdated,
    BlockDeleted,
    PathCreated,
    PathUpdated,
    PathDeleted,
    SuggestionCreated,
)


app = FastAPI(title="No Time To Lie API", version="0.1.0", description="A Living Knowledge Infrastructure API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under versioned prefixes (limit to what tests need)
app.include_router(users_router, prefix="/v1", tags=["users"])
app.include_router(blocks_router, prefix="/v1", tags=["blocks"])
app.include_router(paths_router, prefix="/v1", tags=["paths"])
app.include_router(search_router, prefix="/v1", tags=["search"])


@app.get("/v1/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def init_startup():
    # Best-effort Meilisearch bootstrap; tolerate missing service
    try:
        ensure_index_bootstrapped()
    except Exception:
        pass

    # Subscribe event listeners
    bus.subscribe(UserRegistered, notification_listener)
    bus.subscribe(BlockCreated, search_index_listener)
    bus.subscribe(BlockUpdated, search_index_listener)
    bus.subscribe(BlockDeleted, search_index_listener)
    bus.subscribe(PathCreated, search_index_listener)
    bus.subscribe(PathUpdated, search_index_listener)
    bus.subscribe(PathDeleted, search_index_listener)
    bus.subscribe(SuggestionCreated, notification_listener)
    # Log all events for visibility in dev
    for evt in (UserRegistered, BlockCreated, BlockUpdated, BlockDeleted, PathCreated, PathUpdated, PathDeleted, SuggestionCreated):
        bus.subscribe(evt, logging_listener)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
