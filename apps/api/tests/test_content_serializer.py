"""
Test suite for BlockNote content serialization functionality.
"""
import pytest
import json
from datetime import datetime
from src.content_serializer import (
    BlockNoteContent, 
    ContentSerializer, 
    ContentValidator
)


class TestBlockNoteContent:
    """Test BlockNoteContent class"""
    
    def test_init_with_blocks(self):
        """Test initialization with blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello World"}],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        
        assert content.type == "doc"
        assert content.blocks == blocks
        assert content.created_at is not None
        assert content.updated_at is not None
    
    def test_to_dict(self):
        """Test conversion to dictionary"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello World"}],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        result = content.to_dict()
        
        assert result["type"] == "doc"
        assert result["blocks"] == blocks
        assert "created_at" in result
        assert "updated_at" in result
        assert result["version"] == "1.0"
    
    def test_from_dict(self):
        """Test creation from dictionary"""
        data = {
            "type": "doc",
            "blocks": [
                {
                    "id": "test-block-1",
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello World"}],
                    "props": {"textColor": "default"}
                }
            ],
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "version": "1.0"
        }
        
        content = BlockNoteContent.from_dict(data)
        
        assert content.type == "doc"
        assert len(content.blocks) == 1
        assert content.blocks[0]["id"] == "test-block-1"
    
    def test_from_dict_legacy_content(self):
        """Test creation from legacy content format"""
        data = {"content": "Legacy text content"}
        
        content = BlockNoteContent.from_dict(data)
        
        assert len(content.blocks) == 1
        assert content.blocks[0]["type"] == "paragraph"
        assert content.blocks[0]["content"][0]["text"] == "Legacy text content"
    
    def test_from_dict_empty(self):
        """Test creation from empty/None data"""
        content = BlockNoteContent.from_dict(None)
        assert len(content.blocks) == 0
        
        content = BlockNoteContent.from_dict({})
        assert len(content.blocks) == 0
    
    def test_to_html_paragraph(self):
        """Test HTML conversion for paragraph blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello World"}],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        assert "<p>Hello World</p>" in html
    
    def test_to_html_heading(self):
        """Test HTML conversion for heading blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "heading",
                "content": [{"type": "text", "text": "Title"}],
                "props": {"level": 2, "textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        assert "<h2>Title</h2>" in html
    
    def test_to_html_code_block(self):
        """Test HTML conversion for code blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "codeBlock",
                "content": [{"type": "text", "text": "print('Hello')"}],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        assert "<pre><code>print('Hello')</code></pre>" in html
    
    def test_to_html_with_styling(self):
        """Test HTML conversion with text styling"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Bold ", "styles": {"bold": True}},
                    {"type": "text", "text": "italic", "styles": {"italic": True}}
                ],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        assert "<strong>Bold </strong>" in html
        assert "<em>italic</em>" in html
    
    def test_to_html_with_links(self):
        """Test HTML conversion with links"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Visit "},
                    {"type": "link", "text": "Google", "url": "https://google.com"}
                ],
                "props": {"textColor": "default"}
            }
        ]
        content = BlockNoteContent(blocks)
        html = content.to_html()
        
        assert '<a href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a>' in html


class TestContentSerializer:
    """Test ContentSerializer class"""
    
    def test_serialize_blocknote_content(self):
        """Test serialization of BlockNote blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello World"}],
                "props": {"textColor": "default"}
            }
        ]
        
        result = ContentSerializer.serialize_blocknote_content(blocks)
        data = json.loads(result)
        
        assert data["type"] == "doc"
        assert data["blocks"] == blocks
        assert "version" in data
    
    def test_deserialize_blocknote_content(self):
        """Test deserialization of BlockNote content"""
        json_str = json.dumps({
            "type": "doc",
            "blocks": [
                {
                    "id": "test-block-1",
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello World"}],
                    "props": {"textColor": "default"}
                }
            ],
            "version": "1.0"
        })
        
        content = ContentSerializer.deserialize_blocknote_content(json_str)
        
        assert content.type == "doc"
        assert len(content.blocks) == 1
        assert content.blocks[0]["id"] == "test-block-1"
    
    def test_deserialize_invalid_json(self):
        """Test deserialization with invalid JSON"""
        content = ContentSerializer.deserialize_blocknote_content("invalid json")
        
        assert len(content.blocks) == 0
    
    def test_extract_text_content(self):
        """Test text extraction from BlockNote blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Hello ", "styles": {"bold": True}},
                    {"type": "text", "text": "World"}
                ],
                "props": {"textColor": "default"}
            }
        ]
        
        text = ContentSerializer.extract_text_content(blocks)
        
        assert "Hello" in text
        assert "World" in text
    
    def test_is_blocknote_content(self):
        """Test detection of BlockNote format"""
        # Valid BlockNote content
        blocknote_json = json.dumps({
            "type": "doc",
            "blocks": [],
            "version": "1.0"
        })
        assert ContentSerializer.is_blocknote_content(blocknote_json) is True
        
        # Invalid JSON
        assert ContentSerializer.is_blocknote_content("invalid json") is False
        
        # Plain text
        assert ContentSerializer.is_blocknote_content("plain text") is False


class TestContentValidator:
    """Test ContentValidator class"""
    
    def test_validate_blocknote_blocks_valid(self):
        """Test validation of valid BlockNote blocks"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"type": "text", "text": "Hello World"}],
                "props": {"textColor": "default"}
            }
        ]
        
        errors = ContentValidator.validate_blocknote_blocks(blocks)
        assert len(errors) == 0
    
    def test_validate_blocknote_blocks_invalid_structure(self):
        """Test validation of invalid block structure"""
        blocks = [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "Missing ID"}]
            }
        ]
        
        errors = ContentValidator.validate_blocknote_blocks(blocks)
        assert len(errors) > 0
        assert "missing required 'id' field" in errors[0]
    
    def test_validate_blocknote_blocks_invalid_content(self):
        """Test validation of invalid content structure"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": "invalid content"  # Should be list
            }
        ]
        
        errors = ContentValidator.validate_blocknote_blocks(blocks)
        assert len(errors) > 0
        assert "content must be a list" in errors[0]
    
    def test_validate_blocknote_blocks_invalid_content_item(self):
        """Test validation of invalid content item"""
        blocks = [
            {
                "id": "test-block-1",
                "type": "paragraph",
                "content": [{"text": "Missing type"}]  # Missing type field
            }
        ]
        
        errors = ContentValidator.validate_blocknote_blocks(blocks)
        assert len(errors) > 0
        assert "missing 'type' field" in errors[0]
    
    def test_sanitize_html(self):
        """Test HTML sanitization"""
        # Test script tag removal
        html = '<p>Safe content</p><script>alert("xss")</script>'
        sanitized = ContentValidator.sanitize_html(html)
        assert "<script>" not in sanitized
        
        # Test javascript URL removal
        html = '<a href="javascript:alert(\'xss\')">Link</a>'
        sanitized = ContentValidator.sanitize_html(html)
        assert "javascript:" not in sanitized
        
        # Test event handler removal
        html = '<p onclick="alert(\'xss\')">Click me</p>'
        sanitized = ContentValidator.sanitize_html(html)
        assert "onclick=" not in sanitized
    
    def test_validate_blocknote_blocks_not_list(self):
        """Test validation when blocks is not a list"""
        errors = ContentValidator.validate_blocknote_blocks("not a list")
        assert len(errors) > 0
        assert "Blocks must be a list" in errors[0]
