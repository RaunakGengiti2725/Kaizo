// Cache system for scan results to improve performance and offline functionality

interface CachedScanResult {
  imageHash: string;
  result: any;
  timestamp: number;
  confidence: number;
}

export class ScanCache {
  private static readonly CACHE_KEY = 'vegan-scan-cache';
  private static readonly MAX_CACHE_SIZE = 50;
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Generate a simple hash for image comparison
  private static async generateImageHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  // Get cached result for an image
  public static async getCachedResult(file: File): Promise<CachedScanResult | null> {
    try {
      const hash = await this.generateImageHash(file);
      const cache = this.getCache();
      
      const cached = cache.find(item => 
        item.imageHash === hash && 
        Date.now() - item.timestamp < this.CACHE_EXPIRY
      );

      if (cached) {
        console.log('Cache hit for image:', hash);
        return cached;
      }

      return null;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  // Store scan result in cache
  public static async cacheResult(file: File, result: any, confidence: number): Promise<void> {
    try {
      const hash = await this.generateImageHash(file);
      const cache = this.getCache();
      
      const newEntry: CachedScanResult = {
        imageHash: hash,
        result,
        timestamp: Date.now(),
        confidence
      };

      // Remove existing entry for same hash
      const filtered = cache.filter(item => item.imageHash !== hash);
      
      // Add new entry
      filtered.push(newEntry);

      // Maintain cache size limit
      if (filtered.length > this.MAX_CACHE_SIZE) {
        // Remove oldest entries
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        filtered.splice(this.MAX_CACHE_SIZE);
      }

      this.setCache(filtered);
      console.log('Cached scan result for:', hash);
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  // Get all cached results
  private static getCache(): CachedScanResult[] {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return [];
      
      const parsed = JSON.parse(cached);
      
      // Filter out expired entries
      const valid = parsed.filter((item: CachedScanResult) => 
        Date.now() - item.timestamp < this.CACHE_EXPIRY
      );

      // Update cache if we filtered out expired entries
      if (valid.length !== parsed.length) {
        this.setCache(valid);
      }

      return valid;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return [];
    }
  }

  // Store cache
  private static setCache(cache: CachedScanResult[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to write cache:', error);
    }
  }

  // Clear all cached results
  public static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('Scan cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get cache statistics
  public static getCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
    const cache = this.getCache();
    
    if (cache.length === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = cache.map(item => item.timestamp);
    
    return {
      size: cache.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }

  // Check if image might be cached (without actually processing it)
  public static async isLikelyCached(file: File): Promise<boolean> {
    try {
      const hash = await this.generateImageHash(file);
      const cache = this.getCache();
      
      return cache.some(item => 
        item.imageHash === hash && 
        Date.now() - item.timestamp < this.CACHE_EXPIRY
      );
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const scanCache = ScanCache;
