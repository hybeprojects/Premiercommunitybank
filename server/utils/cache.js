class TTLCache {
  constructor() {
    this.store = new Map();
  }
  set(key, value, ttlMs = 60_000) {
    const expires = Date.now() + ttlMs;
    this.store.set(key, { value, expires });
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }
  del(key) { this.store.delete(key); }
}

module.exports = new TTLCache();
