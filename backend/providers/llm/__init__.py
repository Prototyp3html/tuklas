"""LLM-provider selection.

Default `fixture` (deterministic — tests + CI). `LLM_PROVIDER=ollama` switches to
a real local model. `get_llm_provider()` is the one place this is decided.
"""

from backend.config import settings
from backend.providers.llm.base import LLMProvider
from backend.providers.llm.fixture import FixtureLLM


def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "ollama":
        from backend.providers.llm.ollama import OllamaProvider

        return OllamaProvider()
    return FixtureLLM()


__all__ = ["FixtureLLM", "LLMProvider", "get_llm_provider"]
