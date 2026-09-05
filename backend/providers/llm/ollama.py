"""OllamaProvider — a real local model via Ollama's structured-output API.

Opt-in only (`LLM_PROVIDER=ollama`); tests and CI use `FixtureLLM`. No API key —
needs `ollama serve` running with `settings.ollama_model` pulled.
"""

from __future__ import annotations

import json

import httpx
from pydantic import BaseModel, ValidationError

from backend.config import settings
from backend.providers.llm.base import LLMProvider

_ATTEMPTS = 2
_TIMEOUT = 120.0


class OllamaProvider(LLMProvider):
    def __init__(self, *, host: str | None = None, model: str | None = None) -> None:
        self._host = (host or settings.ollama_host).rstrip("/")
        self._model = model or settings.ollama_model

    async def complete_structured(
        self, prompt: str, schema: type[BaseModel], tier: str = "cheap"
    ) -> BaseModel:
        # `tier` is accepted for interface parity; Phase 1 has one local model.
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "format": schema.model_json_schema(),
            "stream": False,
            "options": {"temperature": 0},
        }
        last: Exception | None = None
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            for _ in range(_ATTEMPTS):
                try:
                    resp = await client.post(f"{self._host}/api/chat", json=payload)
                    resp.raise_for_status()
                    content = resp.json()["message"]["content"]
                    return schema.model_validate_json(content)
                except (
                    httpx.HTTPError,
                    KeyError,
                    json.JSONDecodeError,
                    ValidationError,
                ) as exc:
                    last = exc
        raise RuntimeError(f"Ollama structured completion failed: {last}") from last
