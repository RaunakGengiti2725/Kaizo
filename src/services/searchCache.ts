interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SearchCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Generate cache key for restaurant searches
  generateSearchKey(location: { lat: number; lng: number }, filters: any): string {
    const locationKey = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    const filtersKey = JSON.stringify(filters);
    return `search:${locationKey}:${filtersKey}`;
  }

  // Generate cache key for geocoding
  generateGeocodeKey(address: string): string {
    return `geocode:${address.toLowerCase().trim()}`;
  }

  // Generate cache key for restaurant details
  generateDetailsKey(placeId: string): string {
    return `details:${placeId}`;
  }

  // Get cache statistics
  getStats(): { size: number; hitRate?: number } {
    this.cleanup(); // Clean expired entries first
    return {
      size: this.cache.size
    };
  }
}

export const searchCache = new SearchCacheService();

// Clean up expired entries every 10 minutes
setInterval(() => {
  searchCache.cleanup();
}, 10 * 60 * 1000);
