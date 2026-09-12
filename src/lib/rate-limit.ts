/**
 * GeoPulse-TR — IP Tabanlı In-Memory Rate Limiter
 *
 * Harici middleware veya Redis gerektirmeyen, saf TypeScript ile
 * yazılmış sliding-window benzeri rate limiter.
 *
 * Kullanım:
 *   const result = checkRateLimit(ip, { max: 30, windowMs: 60_000 });
 *   if (!result.allowed) return rateLimitError(result);
 */

import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

interface RateLimitOptions {
  /** Pencere içinde izin verilen maksimum istek sayısı */
  max: number;
  /** Pencere süresi (ms) */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

// Her endpoint için ayrı store tutmak üzere namespace destekliyoruz
const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(namespace: string): Map<string, RateLimitEntry> {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }
  return stores.get(namespace)!;
}

/**
 * Rate limit kontrolü yap.
 *
 * @param ip       İstek sahibinin IP adresi
 * @param opts     max (istek) + windowMs (pencere süresi)
 * @param ns       Namespace — her endpoint için benzersiz olmalı
 */
export function checkRateLimit(
  ip: string,
  opts: RateLimitOptions,
  ns = "default",
): RateLimitResult {
  const { max, windowMs } = opts;
  const store = getStore(ns);
  const now = Date.now();

  const existing = store.get(ip);

  if (!existing || now >= existing.resetAt) {
    // Yeni pencere başlat
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(ip, entry);
    return { allowed: true, remaining: max - 1, resetAt: entry.resetAt, retryAfterMs: 0 };
  }

  existing.count++;

  if (existing.count > max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: existing.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  };
}

/**
 * NextRequest'ten IP adresini çıkar.
 * Vercel, Cloudflare ve doğrudan Node.js ortamlarını destekler.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Rate limit aşıldığında dönecek standart JSON yanıtı oluştur.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: "Çok fazla istek gönderdiniz. Lütfen bir dakika sonra tekrar deneyin.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterMs: result.retryAfterMs,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
      },
    },
  );
}
