"""The pluggable LLM layer. Write this once, never change it.

See BUILD_GUIDE.md Part 2 — "The two interfaces that make everything upgradeable".
Agents call this, never a vendor SDK directly.
"""

from abc import ABC, abstractmethod

from pydantic import BaseModel


class LLMProvider(ABC):
    """Phase 1: Ollama. Phase 2: Claude API. Phase 3: routed by task.
    Agents call this, never a vendor SDK directly."""

    @abstractmethod
    async def complete_structured(
        self,
        prompt: str,
        schema: type[BaseModel],
        tier: str = "cheap",  # "cheap" | "standard" | "strong"
    ) -> BaseModel:
        """Returns a validated Pydantic object. Retries once on
        invalid output, then raises. Never returns free-form text."""
        ...
