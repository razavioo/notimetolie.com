"""
Content serialization utilities for BlockNote integration.
Handles conversion between BlockNote blocks and database storage.
"""
import json
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from uuid import UUID


class BlockNoteContent:
    """Represents BlockNote content structure"""
    
    def __init__(self, blocks: List[Dict[str, Any]], type: str = "doc"):
        self.type = type
        self.blocks = blocks
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "type": self.type,
            "blocks": self.blocks,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "version": "1.0"
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BlockNoteContent':
        """Create from dictionary (from storage)"""
        if not data or not isinstance(data, dict):
            return cls([])
        
        # Handle legacy content (plain text)
        if "type" not in data:
            # Legacy content - convert plain text to BlockNote format
            blocks = [{
                "id": "legacy-block",
                "type": "paragraph",
                "content": [{"type": "text", "text": data.get("content", "")}],
                "props": {"textColor": "default", "backgroundColor": "default"}
            }]
            return cls(blocks)
        
        content = cls(data.get("blocks", []))
        content.type = data.get("type", "doc")
        content.created_at = datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat()))
        content.updated_at = datetime.fromisoformat(data.get("updated_at", datetime.utcnow().isoformat()))
        return content
    
    def to_html(self) -> str:
        """Convert BlockNote content to HTML"""
        if not self.blocks:
            return ""
        
        html_parts = []
        for block in self.blocks:
            block_html = self._block_to_html(block)
            if block_html:
                html_parts.append(block_html)
        
        return "\n".join(html_parts)
    
    def _block_to_html(self, block: Dict[str, Any]) -> str:
        """Convert individual block to HTML"""
        block_type = block.get("type", "paragraph")
        content = block.get("content", [])
        props = block.get("props", {})
        
        # Extract text content
        text_content = self._extract_text_content(content)
        
        # Apply styling based on props
        style = self._apply_block_styles(props)
        
        if block_type == "heading":
            level = props.get("level", 1)
            return f"<h{level}{style}>{text_content}</h{level}>"
        elif block_type == "bulletListItem":
            return f"<li{style}>{text_content}</li>"
        elif block_type == "numberedListItem":
            return f"<li{style}>{text_content}</li>"
        elif block_type == "codeBlock":
            return f"<pre{style}><code>{text_content}</code></pre>"
        elif block_type == "quote":
            return f"<blockquote{style}>{text_content}</blockquote>"
        else:  # paragraph or default
            return f"<p{style}>{text_content}</p>"
    
    def _extract_text_content(self, content: List[Dict[str, Any]]) -> str:
        """Extract text from BlockNote content array"""
        if not content:
            return ""
        
        text_parts = []
        for item in content:
            if item.get("type") == "text":
                text = item.get("text", "")
                # Apply text styling
                if item.get("styles", {}).get("bold"):
                    text = f"<strong>{text}</strong>"
                if item.get("styles", {}).get("italic"):
                    text = f"<em>{text}</em>"
                if item.get("styles", {}).get("underline"):
                    text = f"<u>{text}</u>"
                if item.get("styles", {}).get("strike"):
                    text = f"<s>{text}</s>"
                text_parts.append(text)
            elif item.get("type") == "link":
                url = item.get("url", "#")
                text = item.get("text", url)
                text_parts.append(f'<a href="{url}" target="_blank" rel="noopener noreferrer">{text}</a>')
            elif item.get("type") == "mention":
                # Handle mentions/people tags
                text_parts.append(f"@{item.get('text', 'user')}")
        
        return "".join(text_parts)
    
    def _apply_block_styles(self, props: Dict[str, Any]) -> str:
        """Apply block-level styling"""
        styles = []
        
        if props.get("textColor") and props["textColor"] != "default":
            styles.append(f"color: {props['textColor']}")
        
        if props.get("backgroundColor") and props["backgroundColor"] != "default":
            styles.append(f"background-color: {props['backgroundColor']}")
        
        return f' style="{"; ".join(styles)}"' if styles else ""


class ContentSerializer:
    """Service for serializing and deserializing content"""
    
    @staticmethod
    def serialize_blocknote_content(blocks: List[Dict[str, Any]]) -> str:
        """Serialize BlockNote blocks to JSON string"""
        try:
            content = BlockNoteContent(blocks)
            return json.dumps(content.to_dict())
        except Exception as e:
            # Fallback to legacy format
            return json.dumps({"type": "legacy", "content": ""})
    
    @staticmethod
    def deserialize_blocknote_content(content_str: str) -> BlockNoteContent:
        """Deserialize JSON string to BlockNoteContent"""
        try:
            data = json.loads(content_str)
            return BlockNoteContent.from_dict(data)
        except (json.JSONDecodeError, Exception):
            # Fallback for corrupted or missing content
            return BlockNoteContent([])
    
    @staticmethod
    def extract_text_content(blocks: List[Dict[str, Any]]) -> str:
        """Extract plain text from BlockNote blocks for search"""
        if not blocks:
            return ""
        
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        # Simple HTML to text conversion
        import re
        text = re.sub(r'<[^>]+>', '', html)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    @staticmethod
    def is_blocknote_content(content: str) -> bool:
        """Check if content is in BlockNote format"""
        try:
            data = json.loads(content)
            return data.get("type") in ["doc", "legacy"] or "blocks" in data
        except:
            return False


class ContentValidator:
    """Validates content structure and safety"""
    
    @staticmethod
    def validate_blocknote_blocks(blocks: List[Dict[str, Any]]) -> List[str]:
        """Validate BlockNote blocks and return list of errors"""
        errors = []
        
        if not isinstance(blocks, list):
            errors.append("Blocks must be a list")
            return errors
        
        for i, block in enumerate(blocks):
            if not isinstance(block, dict):
                errors.append(f"Block {i} must be a dictionary")
                continue
            
            # Required fields
            if "id" not in block:
                errors.append(f"Block {i} missing required 'id' field")
            
            if "type" not in block:
                errors.append(f"Block {i} missing required 'type' field")
            
            # Validate content structure
            if "content" in block:
                content = block["content"]
                if not isinstance(content, list):
                    errors.append(f"Block {i} content must be a list")
                else:
                    for j, item in enumerate(content):
                        if not isinstance(item, dict):
                            errors.append(f"Block {i} content item {j} must be a dictionary")
                        elif "type" not in item:
                            errors.append(f"Block {i} content item {j} missing 'type' field")
        
        return errors
    
    @staticmethod
    def sanitize_html(html: str) -> str:
        """Basic HTML sanitization for safe rendering"""
        import re
        
        # Remove script tags and javascript: URLs
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.IGNORECASE | re.DOTALL)
        html = re.sub(r'javascript:[^"\']*', '', html, flags=re.IGNORECASE)
        
        # Remove potentially dangerous attributes
        html = re.sub(r'on\w+="[^"]*"', '', html, flags=re.IGNORECASE)
        html = re.sub(r'on\w+=\'[^\']*\'', '', html, flags=re.IGNORECASE)
        
        return html