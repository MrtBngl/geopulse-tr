/**
 * GET /api/earthquakes
 *
 * Son 50 depremi AFAD API'sinden çeker, 30 saniyelik TTL ile cache'ler.
 * Cache HIT → direkt döner | Cache MISS → AFAD → normalize → cache → döner
 * AFAD erişilemezse mock veriye fallback yapar.
 *
 * Rate limit: 30 istek / dakika / IP
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchEarthquakes } from "@/services/afad.service";
import { cacheGet, cacheSet, CacheKey, TTL } from "@/lib/cache";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import type { EarthquakeDto } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, { max: 30, windowMs: 60_000 }, "earthquakes");

  if (!rl.allowed) {
    return NextResponse.json(null, { status: 429 });
  }

  // ─── Cache Kontrolü ────────────────────────────────────────────────────────
  const cacheKey = CacheKey.earthquakes();
  const cached = cacheGet<{ data: EarthquakeDto[]; fetchedAt: number; source: string }>(cacheKey);

  if (cached) {
    return NextResponse.json(
      {
        success: true,
        data: cached.data,
        cached: true,
        fetchedAt: cached.fetchedAt,
        source: cached.source,
      },
      {
        status: 200,
        headers: {
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": String(rl.remaining),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // ─── Veri Çekme ────────────────────────────────────────────────────────────
  try {
    const { data, source, error } = await fetchEarthquakes(50);

    const fetchedAt = Date.now();
    const payload = { data, fetchedAt, source };

    // Cache'e yaz
    cacheSet(cacheKey, payload, TTL.EARTHQUAKES);

    return NextResponse.json(
      {
        success: true,
        data,
        cached: false,
        fetchedAt,
        source,
        ...(error && { warning: error }),
      },
      {
        status: 200,
        headers: {
          "X-Cache": "MISS",
          "X-RateLimit-Remaining": String(rl.remaining),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[GET /api/earthquakes]", message);

    return NextResponse.json(
      {
        success: false,
        message: "Deprem verisi alınamadı. Lütfen daha sonra tekrar deneyin.",
        code: "FETCH_ERROR",
      },
      { status: 500 },
    );
  }
}
