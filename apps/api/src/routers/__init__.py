from .users import router as users_router
from .blocks import router as blocks_router
from .paths import router as paths_router
from .embed import router as embed_router
from .search import router as search_router
from .moderation import router as moderation_router

__all__ = ["users_router", "blocks_router", "paths_router", "embed_router", "search_router", "moderation_router"]
