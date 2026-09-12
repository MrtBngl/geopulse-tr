/**
 * POST /api/ai/report
 *
 * Tıklanan depremin verilerini Gemini API'ye gönderir,
 * Türkçe 3 maddeli güvenlik özeti + risk seviyesi döner.
 *
 * Body: { earthquakeId, city, magnitude, depth }
 * Cache TTL: 10 dakika (earthquakeId bazlı)
 * Rate limit: 10 istek / dakika / IP (Gemini maliyetli)
 *
 * GÜVENLİK: GEMINI_API_KEY yalnızca server-side okunur, response'ta yer almaz.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateEarthquakeReport } from "@/services/gemini.service";
import { cacheGet, cacheSet, CacheKey, TTL } from "@/lib/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AiReportDto, AiReportRequest } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, { max: 10, windowMs: 60_000 }, "ai-report");

  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "AI raporu için çok fazla istek gönderdiniz. 1 dakika sonra tekrar deneyin.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
    );
  }

  // ─── Body Parse & Doğrulama ────────────────────────────────────────────────
  let body: Partial<AiReportRequest>;
  try {
    body = (await req.json()) as Partial<AiReportRequest>;
  } catch {
    return NextResponse.json(
      { success: false, message: "Geçersiz JSON gövdesi.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { earthquakeId, city, magnitude, depth } = body;

  if (!earthquakeId || typeof earthquakeId !== "string") {
    return NextResponse.json(
      { success: false, message: "'earthquakeId' zorunludur.", code: "MISSING_FIELD" },
      { status: 400 },
    );
  }
  if (!city || typeof city !== "string" || city.length > 100) {
    return NextResponse.json(
      { success: false, message: "'city' zorunludur.", code: "MISSING_FIELD" },
      { status: 400 },
    );
  }
  if (typeof magnitude !== "number" || magnitude < 0 || magnitude > 10) {
    return NextResponse.json(
      { success: false, message: "Geçersiz 'magnitude' değeri.", code: "INVALID_FIELD" },
      { status: 400 },
    );
  }
  if (typeof depth !== "number" || depth < 0) {
    return NextResponse.json(
      { success: false, message: "Geçersiz 'depth' değeri.", code: "INVALID_FIELD" },
      { status: 400 },
    );
  }

  // ─── Cache Kontrolü ────────────────────────────────────────────────────────
  const cacheKey = CacheKey.aiReport(earthquakeId);
  const cached = cacheGet<AiReportDto>(cacheKey);

  if (cached) {
    return NextResponse.json(
      {
        success: true,
        data: cached,
        cached: true,
        fetchedAt: cached.generatedAt,
        source: "cache",
      },
      { status: 200, headers: { "X-Cache": "HIT" } },
    );
  }

  // ─── Gemini API Çağrısı ────────────────────────────────────────────────────
  try {
    const { report, source, error } = await generateEarthquakeReport(
      city,
      magnitude,
      depth,
    );

    // Cache'e yaz (aynı deprem için tekrar sorgulanmasın)
    cacheSet(cacheKey, report, TTL.AI_REPORT);

    return NextResponse.json(
      {
        success: true,
        data: report,
        cached: false,
        fetchedAt: report.generatedAt,
        source,
        ...(error && { warning: error }),
      },
      {
        status: 200,
        headers: {
          "X-Cache": "MISS",
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[POST /api/ai/report]", message);

    return NextResponse.json(
      {
        success: false,
        message: "AI analizi üretilemedi. Lütfen daha sonra tekrar deneyin.",
        code: "AI_ERROR",
      },
      { status: 500 },
    );
  }
}
