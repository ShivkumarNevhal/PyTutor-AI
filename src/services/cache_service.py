import time
import re
import threading
from typing import Optional, Dict, Any
from collections import OrderedDict

class EnterpriseCache:
    """Thread-safe LRU Cache with TTL and Token Savings tracking."""

    def __init__(self, max_size: int = 500, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = threading.Lock()
        self.total_requests = 0
        self.hits = 0
        self.misses = 0
        self.estimated_tokens_saved = 0

    @staticmethod
    def normalize_key(query: str) -> str:
        """Normalize query to maximize cache hits (e.g. casing, trailing punctuation, extra spaces)."""
        clean = query.strip().lower()
        clean = re.sub(r'[^\w\s]', '', clean)
        clean = re.sub(r'\s+', ' ', clean)
        return clean

    def get(self, query: str) -> Optional[Dict[str, Any]]:
        key = self.normalize_key(query)
        with self._lock:
            self.total_requests += 1
            if key not in self._cache:
                self.misses += 1
                return None

            entry = self._cache[key]
            # Check expiration
            if time.time() - entry["timestamp"] > self.ttl_seconds:
                del self._cache[key]
                self.misses += 1
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self.hits += 1
            saved = entry.get("tokens_saved_estimate", 350)
            self.estimated_tokens_saved += saved
            return entry["data"]

    def set(self, query: str, data: Dict[str, Any], tokens_saved_estimate: int = 350) -> None:
        key = self.normalize_key(query)
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = {
                "data": data,
                "timestamp": time.time(),
                "tokens_saved_estimate": tokens_saved_estimate
            }
            if len(self._cache) > self.max_size:
                self._cache.popitem(last=False)  # Evict least recently used

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            hit_rate = (self.hits / self.total_requests * 100) if self.total_requests > 0 else 0.0
            return {
                "total_queries": self.total_requests,
                "cache_hits": self.hits,
                "cache_misses": self.misses,
                "hit_rate_pct": round(hit_rate, 2),
                "current_cache_size": len(self._cache),
                "estimated_tokens_saved": self.estimated_tokens_saved
            }

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self.hits = 0
            self.misses = 0
            self.total_requests = 0
            self.estimated_tokens_saved = 0
