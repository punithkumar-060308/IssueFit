from __future__ import annotations
import time
from typing import Any

_cache: dict[str, tuple[Any, float]] = {}


def get(key: str) -> Any | None:
    """Return cached value if not expired, else None."""
    entry = _cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.monotonic() > expires_at:
        del _cache[key]
        return None
    return value


def set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Store value with a TTL."""
    _cache[key] = (value, time.monotonic() + ttl_seconds)


def delete(key: str) -> None:
    _cache.pop(key, None)


def clear() -> None:
    _cache.clear()
