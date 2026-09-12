/**
 * GeoPulse-TR — Google Gemini AI Deprem Analiz Servisi
 *
 * Verilen deprem verilerini Gemini 2.0 Flash modeline gönderir ve
 * Türkçe, somut güvenlik özeti + risk seviyesi alır.
 *
 * API anahtarı: process.env.GEMINI_API_KEY
 * Asla istemciye sızdırılmaz (yalnızca server-side çalışır).
 */

import { GoogleGenAI } from "@google/genai";
import type { AiReportDto } from "@/types/api";

// ─── Model Yapılandırması ─────────────────────────────────────────────────────

const MODEL_ID = "gemini-2.0-flash";

// ─── Prompt Oluşturucu ────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Sen Türkiye'nin deprem ve afet yönetimi konusunda uzman bir yapay zekâ asistanısın.
Görevin: Verilen deprem büyüklüğü ve derinliği bilgilerine dayanarak o bölgedeki vatandaşlar için
kısa, somut ve uygulanabilir güvenlik önerileri oluşturmak.

Yanıt kuralları:
- Her zaman geçerli JSON formatında yanıt ver.
- Yanıt YALNIZCA şu JSON yapısını içermeli: {"summary": ["...", "...", "..."], "riskLevel": "low|medium|high", "riskScore": 0-100}
- summary: 3 maddeli kısa Türkçe öneriler (her madde max 100 karakter)
- riskLevel: "low" (Mw < 3.5), "medium" (3.5–5.0), "high" (> 5.0 veya derinlik < 10km)
- riskScore: 0–100 sayısal risk skoru
- Panik yaratmadan bilgilendirici ol
- Türkçe dilbilgisi kurallarına uy`;
}

function buildUserPrompt(city: string, magnitude: number, depth: number): string {
  return `Deprem verisi:
- Konum: ${city}, Türkiye
- Büyüklük: ${magnitude.toFixed(1)} (ML/Mw)
- Odak derinliği: ${depth.toFixed(1)} km

Bu deprem için 3 maddeli güvenlik özeti çıkar. JSON formatında ver.`;
}

// ─── Risk Hesaplama (Fallback) ─────────────────────────────────────────────────

function computeRiskLocally(magnitude: number, depth: number): Pick<AiReportDto, "riskLevel" | "riskScore"> {
  const depthFactor = Math.max(0, 1 - depth / 100);
  const rawScore = magnitude * 13 + depthFactor * 15;
  const riskScore = Math.min(100, Math.round(rawScore));

  let riskLevel: AiReportDto["riskLevel"] = "low";
  if (magnitude >= 5.0 || depth < 10) riskLevel = "high";
  else if (magnitude >= 3.5) riskLevel = "medium";

  return { riskLevel, riskScore };
}

// ─── Fallback Öneriler ────────────────────────────────────────────────────────

function buildFallbackSummary(magnitude: number): string[] {
  if (magnitude >= 5.0) {
    return [
      "Hasarlı binalara kesinlikle girmeyin, yetkililerin talimatlarını bekleyin.",
      "Doğalgaz vanasını ve sigortaları kapatın, açık alanda kalın.",
      "AFAD 122 / Acil 112 hatlarını yalnızca gerçek acil durumda arayın.",
    ];
  }
  if (magnitude >= 3.5) {
    return [
      "Çök–Kapan–Tutun refleksini uygulayın, sarsıntı bitene kadar yerden kalkmayın.",
      "Asansör kullanmayın; merdivenleri dikkatli kullanarak binayı terk edin.",
      "Doğalgaz ve elektrik tesisatını gözle kontrol edin, şüpheli durumda yetkilileri arayın.",
    ];
  }
  return [
    "Panik gerektirmez; bu büyüklükte sarsıntı genellikle hasar oluşturmaz.",
    "Artçı sarsıntılara karşı dikkatli olun ve AFAD bildirimlerini takip edin.",
    "Acil durum çantanızın hazır olduğundan emin olun.",
  ];
}

// ─── Ana Fonksiyon ─────────────────────────────────────────────────────────────

/**
 * Deprem parametrelerini Gemini API'ye gönderir, analiz raporu döner.
 * API anahtarı yoksa veya hata oluşursa hesaplanan fallback döner.
 */
export async function generateEarthquakeReport(
  city: string,
  magnitude: number,
  depth: number,
): Promise<{ report: AiReportDto; source: "gemini" | "fallback"; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[gemini.service] GEMINI_API_KEY tanımlı değil — fallback kullanılıyor.");
    const { riskLevel, riskScore } = computeRiskLocally(magnitude, depth);
    return {
      report: {
        summary: buildFallbackSummary(magnitude),
        riskLevel,
        riskScore,
        generatedAt: Date.now(),
      },
      source: "fallback",
      error: "GEMINI_API_KEY eksik",
    };
  }

  // ─── Gemini API Çağrısı ───────────────────────────────────────────────────
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(city, magnitude, depth) }],
        },
      ],
      config: {
        systemInstruction: buildSystemPrompt(),
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    });

    const rawText = response.text ?? "";

    // JSON parse — bazen model markdown kod bloğu içine sarıyor
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      summary?: string[];
      riskLevel?: string;
      riskScore?: number;
    };

    const { riskLevel: localLevel, riskScore: localScore } = computeRiskLocally(magnitude, depth);

    const report: AiReportDto = {
      summary: Array.isArray(parsed.summary) ? parsed.summary.slice(0, 3) : buildFallbackSummary(magnitude),
      riskLevel: (["low", "medium", "high"].includes(parsed.riskLevel ?? "")) 
        ? (parsed.riskLevel as AiReportDto["riskLevel"])
        : localLevel,
      riskScore: typeof parsed.riskScore === "number" ? parsed.riskScore : localScore,
      generatedAt: Date.now(),
    };

    return { report, source: "gemini" };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gemini.service] Hata:", message);

    const { riskLevel, riskScore } = computeRiskLocally(magnitude, depth);
    return {
      report: {
        summary: buildFallbackSummary(magnitude),
        riskLevel,
        riskScore,
        generatedAt: Date.now(),
      },
      source: "fallback",
      error: `Gemini API hatası: ${message}`,
    };
  }
}
