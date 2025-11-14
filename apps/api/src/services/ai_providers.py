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
    
    def __init__(self, api_key: str, model_name: str = "gpt-4", base_url: Optional[str] = None):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        # Support custom base URL for OpenAI-compatible APIs like AgentRouter
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        
        self.client = openai.AsyncOpenAI(**client_kwargs)
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
            
            # Validate response structure
            if not hasattr(response, 'choices') or not response.choices:
                return {
                    "error": "Invalid response from AI provider: no choices in response",
                    "content": None,
                    "tokens_used": {"prompt": 0, "completion": 0, "total": 0}
                }
            
            result = {
                "content": response.choices[0].message.content,
                "finish_reason": response.choices[0].finish_reason,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens if hasattr(response, 'usage') else 0,
                    "completion": response.usage.completion_tokens if hasattr(response, 'usage') else 0,
                    "total": response.usage.total_tokens if hasattr(response, 'usage') else 0
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
            error_msg = str(e)
            # Better error handling for common issues
            if "401" in error_msg or "authentication" in error_msg.lower():
                error_msg = "Authentication failed. Please check your API key."
            elif "404" in error_msg:
                error_msg = f"Model not found. Please check the model name."
            elif "rate" in error_msg.lower() and "limit" in error_msg.lower():
                error_msg = "Rate limit exceeded. Please try again later."
            
            return {
                "error": error_msg,
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
    """OpenAI Compatible API provider for self-hosted models."""
    
    def __init__(self, api_endpoint: str, api_key: Optional[str] = None, model_name: str = "custom"):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        # Use OpenAI client with custom base URL for OpenAI-compatible endpoints
        # The endpoint should be the base URL (e.g., https://agentrouter.org/v1)
        # The client will automatically append /chat/completions
        client_kwargs = {"base_url": api_endpoint}
        if api_key:
            client_kwargs["api_key"] = api_key
        else:
            # Some local endpoints don't require API keys
            client_kwargs["api_key"] = "not-needed"
        
        self.client = openai.AsyncOpenAI(**client_kwargs)
        self.model_name = model_name
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        tools: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate completion from OpenAI-compatible endpoint."""
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
            
            # Validate response structure
            if not hasattr(response, 'choices') or not response.choices:
                return {
                    "error": "Invalid response from AI provider: no choices in response",
                    "content": None,
                    "tokens_used": {"prompt": 0, "completion": 0, "total": 0}
                }
            
            result = {
                "content": response.choices[0].message.content,
                "finish_reason": response.choices[0].finish_reason,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens if hasattr(response, 'usage') else 0,
                    "completion": response.usage.completion_tokens if hasattr(response, 'usage') else 0,
                    "total": response.usage.total_tokens if hasattr(response, 'usage') else 0
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
            error_msg = str(e)
            # Better error handling for common issues
            if "401" in error_msg or "authentication" in error_msg.lower():
                error_msg = "Authentication failed. Please check your API key."
            elif "404" in error_msg:
                error_msg = f"Model not found. Please check the model name."
            elif "rate" in error_msg.lower() and "limit" in error_msg.lower():
                error_msg = "Rate limit exceeded. Please try again later."
            
            return {
                "error": error_msg,
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
        """Stream completion from OpenAI Compatible endpoint."""
        yield "Streaming not implemented for OpenAI Compatible provider"


def create_ai_provider(
    provider_type: str,
    api_key: str,
    model_name: str,
    api_endpoint: Optional[str] = None
) -> AIProvider:
    """
    Factory function to create AI provider instance.
    
    Supports multiple AI providers including:
    - OpenAI, Anthropic (native support)
    - OpenRouter, Groq, Together AI, Fireworks AI, etc (OpenAI-compatible)
    - Custom endpoints (OpenAI-compatible API)
    
    Args:
        provider_type: Provider identifier (e.g., 'openai', 'anthropic', 'groq')
        api_key: API key for the provider
        model_name: Model to use
        api_endpoint: Optional custom base URL
    
    Returns:
        AIProvider instance
    """
    # Native OpenAI
    if provider_type == "openai":
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint)
    
    # Native Anthropic
    elif provider_type == "anthropic":
        return AnthropicProvider(api_key, model_name)
    
    # Aggregators & Routers (OpenAI-compatible)
    elif provider_type == "openrouter":
        return OpenAIProvider(api_key, model_name, base_url="https://openrouter.ai/api/v1")
    
    # Ultra-Fast Inference Providers (OpenAI-compatible)
    elif provider_type == "groq":
        return OpenAIProvider(api_key, model_name, base_url="https://api.groq.com/openai/v1")
    elif provider_type == "fireworks_ai":
        return OpenAIProvider(api_key, model_name, base_url="https://api.fireworks.ai/inference/v1")
    elif provider_type == "lepton_ai":
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint or "https://api.lepton.ai/api/v1")
    
    # Open Source Focused (OpenAI-compatible)
    elif provider_type == "together_ai":
        return OpenAIProvider(api_key, model_name, base_url="https://api.together.xyz/v1")
    elif provider_type == "huggingface":
        # Hugging Face Inference API
        return OpenAIProvider(api_key, model_name, base_url="https://api-inference.huggingface.co/v1")
    elif provider_type == "replicate":
        # Note: Replicate has different API structure, this might need custom implementation
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint or "https://api.replicate.com/v1")
    
    # Enterprise & Specialized
    elif provider_type == "cohere":
        # Cohere has its own SDK, but also supports OpenAI-compatible endpoints
        return OpenAIProvider(api_key, model_name, base_url="https://api.cohere.ai/v1")
    elif provider_type == "mistral_ai":
        return OpenAIProvider(api_key, model_name, base_url="https://api.mistral.ai/v1")
    elif provider_type == "ai21_labs":
        return OpenAIProvider(api_key, model_name, base_url="https://api.ai21.com/studio/v1")
    elif provider_type == "deepseek":
        return OpenAIProvider(api_key, model_name, base_url="https://api.deepseek.com/v1")
    elif provider_type == "aleph_alpha":
        return OpenAIProvider(api_key, model_name, base_url="https://api.aleph-alpha.com/v1")
    elif provider_type == "perplexity":
        return OpenAIProvider(api_key, model_name, base_url="https://api.perplexity.ai")
    
    # Cloud Platform Services
    elif provider_type == "azure_openai":
        # Azure OpenAI requires special endpoint format
        if not api_endpoint:
            raise ValueError("api_endpoint required for Azure OpenAI (format: https://{resource}.openai.azure.com)")
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint)
    elif provider_type == "amazon_bedrock":
        # Bedrock requires AWS SDK, would need custom implementation
        if not api_endpoint:
            raise ValueError("api_endpoint required for Amazon Bedrock")
        return CustomProvider(api_endpoint, api_key, model_name)
    elif provider_type == "cloudflare_ai":
        return OpenAIProvider(api_key, model_name, base_url="https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1")
    elif provider_type == "google_ai":
        # Google AI Studio / Gemini API
        return OpenAIProvider(api_key, model_name, base_url="https://generativelanguage.googleapis.com/v1")
    
    # Development & Deployment Platforms
    elif provider_type == "anyscale":
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint or "https://api.endpoints.anyscale.com/v1")
    elif provider_type == "baseten":
        if not api_endpoint:
            raise ValueError("api_endpoint required for Baseten")
        return OpenAIProvider(api_key, model_name, base_url=api_endpoint)
    elif provider_type == "modal":
        if not api_endpoint:
            raise ValueError("api_endpoint required for Modal")
        return CustomProvider(api_endpoint, api_key, model_name)
    
    # Local & Custom
    elif provider_type == "openai_compatible":
        if not api_endpoint:
            raise ValueError("api_endpoint required for OpenAI Compatible provider")
        return CustomProvider(api_endpoint, api_key, model_name)
    
    else:
        raise ValueError(f"Unknown provider type: {provider_type}. Supported providers: openai, anthropic, groq, together_ai, openrouter, and many more.")
