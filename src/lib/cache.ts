/**
 * GeoPulse-TR — In-Memory Cache
 *
 * node-cache üzerinde tip-güvenli bir wrapper.
 * Vercel/Next.js serverless ortamında harici Redis gerektirmeden çalışır.
 * Üretim ortamında birden fazla instance çalışıyorsa Redis'e geçiş için
 * yalnızca bu dosyanın güncellenmesi yeterlidir.
 */

import NodeCache from "node-cache";

// ─── TTL Sabitleri (saniye) ───────────────────────────────────────────────────
export const TTL = {
  EARTHQUAKES: 30,        // /api/earthquakes → 30 sn
  NEWS: 120,              // /api/news       → 2 dk
  AI_REPORT: 600,         // /api/ai/report  → 10 dk
} as const;

// ─── Cache Instance ──────────────────────────────────────────────────────────
const cache = new NodeCache({
  stdTTL: TTL.EARTHQUAKES,
  checkperiod: 60,
  useClones: false,       // performans: derin kopyalama yapma
});

// ─── Tip-Güvenli API ─────────────────────────────────────────────────────────

/**
 * Cache'den değer oku. Bulunamazsa `undefined` döner.
 */
export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Cache'e değer yaz.
 * @param ttl Opsiyonel. Belirtilmezse instance default TTL kullanılır.
 */
export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

/**
 * Cache key'ini sil.
 */
export function cacheDel(key: string): void {
  cache.del(key);
}

/**
 * Tüm cache'i temizle (test/debug için).
 */
export function cacheFlush(): void {
  cache.flushAll();
}

// ─── Cache Key Oluşturucular ─────────────────────────────────────────────────
export const CacheKey = {
  earthquakes: () => "earthquakes:list",
  news: (location: string) => `news:${location.toLowerCase().trim()}`,
  aiReport: (earthquakeId: string) => `ai:report:${earthquakeId}`,
} as const;
