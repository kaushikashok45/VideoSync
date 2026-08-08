interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface MetadataCacheDeps {
  ttlMs: number;
  now?: () => number;
}

export class MetadataCache<T> {
  private entries = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(deps: MetadataCacheDeps) {
    this.ttlMs = deps.ttlMs;
    this.now = deps.now ?? Date.now;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }
}
