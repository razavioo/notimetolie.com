"""Simple test to create first block with AI."""
import asyncio
import sys
sys.path.insert(0, '/Users/emad/IdeaProjects/notimetolie.com/apps/api')

from src.services.ai_providers import create_ai_provider


async def test_openrouter():
    """Test OpenRouter AI provider directly."""
    
    print("Testing OpenRouter AI provider...")
    print("-" * 60)
    
    # Your OpenRouter API key
    api_key = "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"
    model = "kat-ai/kat-coder-pro-v1:free"
    
    # Create provider
    print(f"Creating provider: openrouter")
    print(f"Model: {model}")
    provider = create_ai_provider(
        provider_type="openrouter",
        api_key=api_key,
        model_name=model
    )
    
    # Test prompt
    prompt = """Create a simple knowledge block about Python async/await.

Include:
1. A clear title
2. Brief explanation (2-3 paragraphs)
3. One code example
4. 3 relevant tags

Format as JSON with: title, content (markdown), tags (array), difficulty, summary"""
    
    print(f"\nSending prompt...")
    print("-" * 60)
    
    # Generate content
    try:
        result = await provider.generate(
            prompt=prompt,
            system_prompt="You are a helpful knowledge creator. Be concise and clear.",
            temperature=0.7,
            max_tokens=1000
        )
    except Exception as e:
        print(f"\n❌ Exception during generation: {e}")
        import traceback
        traceback.print_exc()
        result = {"error": str(e)}
    
    print("\n" + "=" * 60)
    print("RESULT")
    print("=" * 60)
    
    if result.get("error"):
        print(f"❌ ERROR: {result['error']}")
    else:
        print(f"✅ SUCCESS!")
        print(f"\nContent ({len(result.get('content', ''))} chars):")
        print("-" * 60)
        print(result.get("content", ""))
        print("-" * 60)
        print(f"\nTokens used:")
        print(f"  Prompt: {result['tokens_used']['prompt']}")
        print(f"  Completion: {result['tokens_used']['completion']}")
        print(f"  Total: {result['tokens_used']['total']}")
    
    return result


if __name__ == "__main__":
    result = asyncio.run(test_openrouter())
    
    if result.get("error"):
        sys.exit(1)
    else:
        print("\n✅ AI provider working correctly!")
        sys.exit(0)
