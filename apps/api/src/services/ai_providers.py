"""
AI provider implementations for OpenAI, Anthropic, and custom providers.
"""
from typing import Dict, Any, List, Optional, AsyncGenerator
from abc import ABC, abstractmethod
import json
import os
import asyncio

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class AIProvider(ABC):
    """Base class for AI providers."""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate completion from AI."""
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]:
        """Stream completion from AI."""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI API provider."""
    
    def __init__(self, api_key: str, model_name: str = "gpt-4"):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model_name = model_name
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate completion from OpenAI."""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"
        
        try:
            response = await self.client.chat.completions.create(**kwargs)
            
            result = {
                "content": response.choices[0].message.content,
                "finish_reason": response.choices[0].finish_reason,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                }
            }
            
            # Handle tool calls if present
            if hasattr(response.choices[0].message, 'tool_calls') and response.choices[0].message.tool_calls:
                result["tool_calls"] = [
                    {
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments)
                    }
                    for tc in response.choices[0].message.tool_calls
                ]
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "content": None,
                "tokens_used": {"prompt": 0, "completion": 0, "total": 0}
            }
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]:
        """Stream completion from OpenAI."""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"


class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider."""
    
    def __init__(self, api_key: str, model_name: str = "claude-3-sonnet-20240229"):
        if not ANTHROPIC_AVAILABLE:
            raise ImportError("Anthropic package not installed. Run: pip install anthropic")
        
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model_name = model_name
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate completion from Anthropic."""
        kwargs = {
            "model": self.model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        if tools:
            kwargs["tools"] = tools
        
        try:
            response = await self.client.messages.create(**kwargs)
            
            result = {
                "content": response.content[0].text if response.content else None,
                "finish_reason": response.stop_reason,
                "tokens_used": {
                    "prompt": response.usage.input_tokens,
                    "completion": response.usage.output_tokens,
                    "total": response.usage.input_tokens + response.usage.output_tokens
                }
            }
            
            # Handle tool use if present
            if hasattr(response, 'tool_use') and response.tool_use:
                result["tool_calls"] = [
                    {
                        "id": tool.id,
                        "name": tool.name,
                        "arguments": tool.input
                    }
                    for tool in response.tool_use
                ]
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "content": None,
                "tokens_used": {"prompt": 0, "completion": 0, "total": 0}
            }
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]:
        """Stream completion from Anthropic."""
        kwargs = {
            "model": self.model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        try:
            async with self.client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            yield f"Error: {str(e)}"


class CustomProvider(AIProvider):
    """Custom API provider for self-hosted models."""
    
    def __init__(self, api_endpoint: str, api_key: Optional[str] = None, model_name: str = "custom"):
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.model_name = model_name
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate completion from custom endpoint."""
        import httpx
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system_prompt": system_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if tools:
            payload["tools"] = tools
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_endpoint,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
                data = response.json()
                return {
                    "content": data.get("content"),
                    "finish_reason": data.get("finish_reason"),
                    "tokens_used": data.get("tokens_used", {
                        "prompt": 0,
                        "completion": 0,
                        "total": 0
                    })
                }
        except Exception as e:
            return {
                "error": str(e),
                "content": None,
                "tokens_used": {"prompt": 0, "completion": 0, "total": 0}
            }
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]:
        """Stream completion from custom endpoint."""
        yield "Streaming not implemented for custom provider"


def create_ai_provider(
    provider_type: str,
    api_key: str,
    model_name: str,
    api_endpoint: Optional[str] = None
) -> AIProvider:
    """
    Factory function to create AI provider instance.
    
    Args:
        provider_type: 'openai', 'anthropic', or 'custom'
        api_key: API key for the provider
        model_name: Model to use
        api_endpoint: Required for custom providers
    
    Returns:
        AIProvider instance
    """
    if provider_type == "openai":
        return OpenAIProvider(api_key, model_name)
    elif provider_type == "anthropic":
        return AnthropicProvider(api_key, model_name)
    elif provider_type == "custom":
        if not api_endpoint:
            raise ValueError("api_endpoint required for custom provider")
        return CustomProvider(api_endpoint, api_key, model_name)
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")
