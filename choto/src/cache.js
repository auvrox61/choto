// Tiny LRU with TTL. Links are immutable, so the only reason for the TTL
// is to let deleted/disabled links disappear within a few minutes.
export class LRU {
  constructor(max, ttlMs) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry || entry.expires < Date.now()) {
      if (entry) this.map.delete(key);
      this.misses++;
      return undefined;
    }
    this.map.delete(key); // re-insert = mark as most recently used
    this.map.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key, value) {
    this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }

  get size() {
    return this.map.size;
  }
}
