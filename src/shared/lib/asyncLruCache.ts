/** O(1) cache hits and individual evictions. Insertions may evict several entries. Eviction drops ownership, never disposes a
 * resource an active renderer may still use. Rejected requests can retry. */
export class AsyncLruCache<T> {
  private entries = new Map<string, { promise: Promise<T>; bytes: number }>();
  private retainedBytes = 0;

  constructor(private readonly maxEntries: number, private readonly maxBytes: number,
    private readonly sizeOf: (value: T) => number) {
    if (maxEntries < 1 || maxBytes < 1) throw new Error('Cache limits must be positive');
  }
  get size(): number { return this.entries.size; }
  get bytes(): number { return this.retainedBytes; }

  get(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing.promise;
    }
    const entry = { promise: Promise.resolve().then(loader), bytes: 0 };
    this.entries.set(key, entry);
    entry.promise = entry.promise.then(value => {
      // An evicted pending request must never reinsert itself.
      if (this.entries.get(key) === entry) {
        entry.bytes = Math.max(0, this.sizeOf(value));
        this.retainedBytes += entry.bytes;
        this.trim();
      }
      return value;
    }, error => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
      throw error;
    });
    this.trim();
    return entry.promise;
  }
  clear(): void { this.entries.clear(); this.retainedBytes = 0; }
  private trim(): void {
    while (this.entries.size > this.maxEntries || this.retainedBytes > this.maxBytes) {
      const key = this.entries.keys().next().value;
      if (key === undefined) break;
      this.retainedBytes -= this.entries.get(key)!.bytes;
      this.entries.delete(key);
    }
  }
}
