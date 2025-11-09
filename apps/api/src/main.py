from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .schemas import (
    BlockCreate,
    BlockPublic,
    BlockUpdate,
    SuggestionCreate,
    SuggestionResponse,
    PathCreate,
    PathPublic,
    BlockType,
)
from .db import db

app = FastAPI(
    title="No Time To Lie API",
    version="0.1.0",
    description="A Living Knowledge Infrastructure API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/v1/health")
async def health():
    return {"status": "ok", "timestamp": "2024-01-01T00:00:00Z"}


@app.post("/v1/blocks", response_model=BlockPublic, status_code=201)
async def create_block(payload: BlockCreate):
    if db.get_block_by_slug(payload.slug):
        raise HTTPException(status_code=409, detail="Block slug already exists")

    rec = db.create_block(payload.dict())
    return BlockPublic(**rec)


@app.get("/v1/blocks/{slug}", response_model=BlockPublic)
async def get_block(slug: str):
    rec = db.get_block_by_slug(slug)
    if not rec:
        raise HTTPException(status_code=404, detail="Block not found")
    return BlockPublic(**rec)


@app.put("/v1/blocks/{block_id}", response_model=BlockPublic)
async def update_block(block_id: str, payload: BlockUpdate):
    rec = db.update_block(block_id, payload.dict(exclude_unset=True))
    if not rec:
        raise HTTPException(status_code=404, detail="Block not found")
    return BlockPublic(**rec)


@app.post("/v1/blocks/{block_id}/suggestions", response_model=SuggestionResponse, status_code=201)
async def suggest_edit(block_id: str, payload: SuggestionCreate):
    if not db.get_block_by_id(block_id):
        raise HTTPException(status_code=404, detail="Block not found")

    rec = db.add_suggestion(block_id, payload.dict())
    return SuggestionResponse(**rec)


@app.get("/v1/blocks/{block_id}/suggestions", response_model=list[SuggestionResponse])
async def get_block_suggestions(block_id: str):
    if not db.get_block_by_id(block_id):
        raise HTTPException(status_code=404, detail="Block not found")

    suggestions = db.get_suggestions(block_id)
    return [SuggestionResponse(**s) for s in suggestions]


@app.post("/v1/paths", response_model=PathPublic, status_code=201)
async def create_path(payload: PathCreate):
    if db.get_path_by_slug(payload.slug):
        raise HTTPException(status_code=409, detail="Path slug already exists")

    missing = [bid for bid in payload.block_ids if not db.get_block_by_id(bid)]
    if missing:
        raise HTTPException(status_code=400, detail={"missing_block_ids": missing})

    rec = db.create_path(payload.dict())
    blocks = [BlockPublic(**db.get_block_by_id(bid)) for bid in payload.block_ids]
    return PathPublic(
        id=rec["id"],
        title=rec["title"],
        slug=rec["slug"],
        blocks=blocks,
        is_published=rec["is_published"],
        created_at=rec["created_at"],
        updated_at=rec["updated_at"],
        created_by_id=rec["created_by_id"],
        metadata=rec["metadata"]
    )


@app.get("/v1/paths/{slug}", response_model=PathPublic)
async def get_path(slug: str):
    rec = db.get_path_by_slug(slug)
    if not rec:
        raise HTTPException(status_code=404, detail="Path not found")

    blocks = [BlockPublic(**db.get_block_by_id(bid)) for bid in rec.get("block_ids", [])]
    return PathPublic(
        id=rec["id"],
        title=rec["title"],
        slug=rec["slug"],
        blocks=blocks,
        is_published=rec["is_published"],
        created_at=rec["created_at"],
        updated_at=rec["updated_at"],
        created_by_id=rec["created_by_id"],
        metadata=rec["metadata"]
    )


@app.get("/v1/embed/{node_type}/{id}")
async def embed(node_type: str, id: str):
    if node_type == "block":
        block = db.get_block_by_id(id)
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")

        html = f"""
        <div class="ntl-block" data-block-id="{block['id']}">
            <h3 class="ntl-block-title">{block['title']}</h3>
            <div class="ntl-block-content">{block['content'] or ''}</div>
        </div>
        """
        return {"html": html.strip()}

    elif node_type == "path":
        path = db.get_path_by_id(id)
        if not path:
            raise HTTPException(status_code=404, detail="Path not found")

        html_blocks = []
        for bid in path.get("block_ids", []):
            block = db.get_block_by_id(bid)
            if not block:
                continue
            html_blocks.append(f"""
            <section class="ntl-block" data-block-id="{block['id']}">
                <h3 class="ntl-block-title">{block['title']}</h3>
                <div class="ntl-block-content">{block['content'] or ''}</div>
            </section>
            """)

        html = f"""
        <article class="ntl-path" data-path-id="{path['id']}">
            <h2 class="ntl-path-title">{path['title']}</h2>
            {''.join(html_blocks)}
        </article>
        """
        return {"html": html.strip()}

    else:
        raise HTTPException(status_code=400, detail="Invalid node_type. Must be 'block' or 'path'")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)