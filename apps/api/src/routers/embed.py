from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from ..database import get_db
from ..models import ContentNode, NodeLevel

router = APIRouter()


@router.get("/embed/{node_type}/{node_id}", response_class=HTMLResponse)
async def embed_node(node_type: str, node_id: str, theme: str = "light", db: AsyncSession = Depends(get_db)):
    """Simple server-rendered embed for blocks/paths.

    Renders minimal HTML that can be dropped into an iframe.
    """
    if node_type not in ("block", "path"):
        raise HTTPException(status_code=400, detail="Invalid node_type")

    try:
        node_uuid = uuid.UUID(node_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid node_id")

    result = await db.execute(
        select(ContentNode).where(ContentNode.id == node_uuid)
    )
    node = result.scalar_one_or_none()
    if not node or not node.is_published:
        raise HTTPException(status_code=404, detail="Node not found")

    # Basic styling adhering to theme param
    bg = "#ffffff" if theme == "light" else "#0b0b0b"
    fg = "#1f2937" if theme == "light" else "#e5e7eb"
    badge_bg = "#eef2ff" if theme == "light" else "#111827"
    badge_fg = "#3730a3" if theme == "light" else "#c7d2fe"

    # Content: for paths, list ordered blocks from metadata; for blocks, show content
    content_html = ""
    if node.level == NodeLevel.PATH:
        order_ids = []
        if node.meta_json and isinstance(node.meta_json, dict):
            order_ids = [str(i) for i in node.meta_json.get("block_ids", [])]
        items = []
        if order_ids:
            result_blocks = await db.execute(
                select(ContentNode).where(
                    ContentNode.id.in_([uuid.UUID(bid) for bid in order_ids]),
                    ContentNode.level == NodeLevel.BLOCK,
                    ContentNode.is_published == True,
                )
            )
            fetched = result_blocks.scalars().all()
            by_id = {str(b.id): b for b in fetched}
            for bid in order_ids:
                b = by_id.get(bid)
                if b:
                    items.append(f"<li><strong>{b.title}</strong> <span style='color:#9ca3af'>&nbsp;({b.slug})</span></li>")
        # Fallback to parent-child relationship if ordering not present or nothing found
        if not items:
            result_children = await db.execute(
                select(ContentNode)
                .where(
                    ContentNode.parent_id == node.id,
                    ContentNode.level == NodeLevel.BLOCK,
                    ContentNode.is_published == True,
                )
                .order_by(ContentNode.created_at.asc())
            )
            children = result_children.scalars().all()
            for b in children:
                items.append(f"<li><strong>{b.title}</strong> <span style='color:#9ca3af'>&nbsp;({b.slug})</span></li>")
        content_html = "<ol style='padding-left:20px;margin:8px 0;'>" + "".join(items) + "</ol>"
        if not items:
            content_html = "<div style='color:#6b7280'>No blocks in this path.</div>"
    else:
        if node.meta_json and isinstance(node.meta_json, dict) and node.meta_json.get("blocknote_content"):
            content_html = "<div>Embedded rich content not rendered server-side.</div>"
        elif node.content:
            safe = (node.content or "").replace("<", "&lt;").replace(">", "&gt;")
            content_html = f"<div style='line-height:1.6'>{safe}</div>"
        else:
            content_html = "<div style='color:#6b7280'>No content available.</div>"

    html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1' />
    <title>{node.title}</title>
    <style>
      body {{ margin:0; background:{bg}; color:{fg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
      .container {{ padding: 16px; }}
      .badge {{ display:inline-block; padding:2px 8px; border-radius:9999px; background:{badge_bg}; color:{badge_fg}; font-size:12px; }}
    </style>
  </head>
  <body>
    <div class='container'>
      <div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;'>
        <h1 style='font-size:20px;margin:0;'>{node.title}</h1>
        <span class='badge'>{node.level.value}</span>
      </div>
      {content_html}
    </div>
  </body>
</html>
"""

    return HTMLResponse(content=html, status_code=200)
