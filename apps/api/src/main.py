from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .routers import users_router, blocks_router, paths_router, search_router, moderation_router, embed_router, progress_router
from .routers import websocket as websocket_router
from .routers import ai_config as ai_router
from .routers import auth as auth_router
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


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Custom error handling middleware
class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            logger.error(f"HTTP Exception: {e.status_code} - {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail, "status_code": e.status_code}
            )
        except Exception as e:
            logger.error(f"Unhandled Exception: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error", "status_code": 500}
            )


app = FastAPI(title="No Time To Lie API", version="0.1.0", description="A Living Knowledge Infrastructure API")

app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under versioned prefixes (limit to what tests need)
app.include_router(users_router, prefix="/v1", tags=["users"])
app.include_router(auth_router.router, prefix="/v1", tags=["auth"])
app.include_router(blocks_router, prefix="/v1", tags=["blocks"])
app.include_router(paths_router, prefix="/v1", tags=["paths"])
app.include_router(search_router, prefix="/v1", tags=["search"])
app.include_router(moderation_router, prefix="/v1", tags=["moderation"])
app.include_router(embed_router, prefix="/v1", tags=["embed"])
app.include_router(progress_router, prefix="/v1", tags=["progress"])
app.include_router(websocket_router.router, prefix="/v1")
app.include_router(ai_router.router, tags=["ai"])


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
