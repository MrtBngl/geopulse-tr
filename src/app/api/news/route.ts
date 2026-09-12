/**
 * GET /api/news?location={sehir_adi}
 *
 * Tıklanan şehir için ilgili haber başlıklarını döner.
 * Öncelik: NewsAPI → Google RSS → statik fallback
 * Cache TTL: 2 dakika (şehir bazlı key)
 * Rate limit: 20 istek / dakika / IP
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/services/news.service";
import { cacheGet, cacheSet, CacheKey, TTL } from "@/lib/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { NewsItemDto } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ─── Parametre Doğrulama ───────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location")?.trim();

  if (!location || location.length < 2) {
    return NextResponse.json(
      {
        success: false,
        message: "'location' parametresi zorunludur (en az 2 karakter).",
        code: "MISSING_PARAM",
      },
      { status: 400 },
    );
  }

  if (location.length > 100) {
    return NextResponse.json(
      { success: false, message: "Geçersiz konum adı.", code: "INVALID_PARAM" },
      { status: 400 },
    );
  }

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, { max: 20, windowMs: 60_000 }, "news");

  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
    );
  }

  // ─── Cache Kontrolü ────────────────────────────────────────────────────────
  const cacheKey = CacheKey.news(location);
  const cached = cacheGet<{ items: NewsItemDto[]; fetchedAt: number; source: string }>(cacheKey);

  if (cached) {
    return NextResponse.json(
      {
        success: true,
        data: cached.items,
        cached: true,
        fetchedAt: cached.fetchedAt,
        source: cached.source,
      },
      { status: 200, headers: { "X-Cache": "HIT" } },
    );
  }

  // ─── Veri Çekme ────────────────────────────────────────────────────────────
  try {
    const { items, source, error } = await fetchNews(location);

    const fetchedAt = Date.now();
    cacheSet(cacheKey, { items, fetchedAt, source }, TTL.NEWS);

    return NextResponse.json(
      {
        success: true,
        data: items,
        cached: false,
        fetchedAt,
        source,
        ...(error && { warning: error }),
      },
      { status: 200, headers: { "X-Cache": "MISS", "X-RateLimit-Remaining": String(rl.remaining) } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[GET /api/news]", message);

    return NextResponse.json(
      {
        success: false,
        message: "Haber verisi alınamadı. Lütfen daha sonra tekrar deneyin.",
        code: "FETCH_ERROR",
        data: [],
      },
      { status: 500 },
    );
  }
}
