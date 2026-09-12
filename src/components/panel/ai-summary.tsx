/**
 * GeoPulse-TR — AI Deprem Analiz Bileşeni
 *
 * POST /api/ai/report üzerinden Gemini AI'dan gerçek analiz alır.
 * API anahtarı yoksa veya hata varsa yerel fallback önerileri gösterir.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Building2, Info, LifeBuoy, ShieldAlert, Sparkles, Wifi } from "lucide-react";
import { depthLabel, getTierMeta } from "@/lib/quake";
import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Earthquake } from "@/types/earthquake";
import type { AiReportDto } from "@/types/api";

// ─── Typewriter Effect ────────────────────────────────────────────────────────

function useTypewriter(text: string, enabled: boolean, speed = 9) {
  const [output, setOutput] = React.useState("");

  React.useEffect(() => {
    if (!enabled) {
      setOutput("");
      return;
    }
    let index = 0;
    setOutput("");
    const interval = window.setInterval(() => {
      index += 3;
      setOutput(text.slice(0, index));
      if (index >= text.length) window.clearInterval(interval);
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, enabled, speed]);

  return output;
}

// ─── Öneri İkonları ───────────────────────────────────────────────────────────

const SUGGESTION_ICONS = [
  <ShieldAlert key="shield" className="h-3.5 w-3.5" />,
  <Building2 key="building" className="h-3.5 w-3.5" />,
  <LifeBuoy key="life" className="h-3.5 w-3.5" />,
  <Info key="info" className="h-3.5 w-3.5" />,
];

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

/** AI analiz sekmesi — POST /api/ai/report ile Gemini'den gerçek veri alır */
export function AiSummary({ quake }: { quake: Earthquake }) {
  const [report, setReport] = React.useState<AiReportDto | null>(null);
  const [isThinking, setIsThinking] = React.useState(true);
  const [source, setSource] = React.useState<"gemini" | "fallback" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const meta = getTierMeta(quake.magnitude);

  // Birleştirilmiş özet metni (typewriter için)
  const summaryText = React.useMemo(
    () => (report?.summary ?? []).join(" "),
    [report],
  );

  const typed = useTypewriter(summaryText, !isThinking && report !== null);

  // ─── Veri Çekme ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setIsThinking(true);
    setReport(null);
    setError(null);

    async function fetchReport() {
      try {
        const res = await fetch("/api/ai/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            earthquakeId: quake.id,
            city: quake.city,
            magnitude: quake.magnitude,
            depth: quake.depth,
          }),
        });

        const json = await res.json() as {
          success: boolean;
          data?: AiReportDto;
          source?: "gemini" | "fallback";
          warning?: string;
          message?: string;
        };

        if (cancelled) return;

        if (!json.success || !json.data) {
          setError(json.message ?? "AI analizi üretilemedi.");
          // Yerel hesaplama ile çalışmaya devam et
          setReport(buildLocalFallback(quake.magnitude, quake.depth));
          setSource("fallback");
          return;
        }

        setReport(json.data);
        setSource(json.source ?? "gemini");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Bağlantı hatası");
        setReport(buildLocalFallback(quake.magnitude, quake.depth));
        setSource("fallback");
      } finally {
        if (!cancelled) setIsThinking(false);
      }
    }

    fetchReport();
    return () => { cancelled = true; };
  }, [quake.id, quake.city, quake.magnitude, quake.depth]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const riskScore = report?.riskScore ?? computeRiskScore(quake.magnitude, quake.depth);

  return (
    <div className="space-y-3.5">
      {/* AI Metin Özeti */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-cyan-500/[0.06] p-3.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/15 ring-1 ring-inset ring-violet-400/30">
            <BrainCircuit className="h-3.5 w-3.5 text-violet-300" />
          </span>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold text-slate-100">GeoPulse AI Asistan</p>
            <p className="text-[10px] text-slate-500">
              {source === "gemini" ? "Gemini 2.0 Flash · Canlı Analiz" : "Yerel Analiz · v0.9"}
            </p>
          </div>
          {source === "gemini" ? (
            <Sparkles className="ml-auto h-3.5 w-3.5 text-violet-300/60" />
          ) : (
            <Wifi className="ml-auto h-3.5 w-3.5 text-slate-600" />
          )}
        </div>

        <div className="mt-3 min-h-[104px]">
          {isThinking ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-7/12" />
              <p className="pt-1 text-[10px] text-violet-300/70">Model analiz ediyor…</p>
            </div>
          ) : (
            <p className="text-[12px] leading-relaxed text-slate-300">
              {/* Her maddeyi satır satır göster */}
              {report?.summary.map((line, i) => (
                <span key={i} className="block mb-1.5">
                  <span className={cn("mr-1 font-bold", meta.text)}>{i + 1}.</span>
                  {line}
                </span>
              ))}
              {typed.length < summaryText.length && !isThinking ? (
                <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-violet-300/80" />
              ) : null}
            </p>
          )}
        </div>

        {/* AI kaynak uyarısı */}
        {error && !isThinking && (
          <p className="mt-2 text-[10px] text-amber-400/70">
            ⚠ AI servisine ulaşılamadı — yerel analiz kullanılıyor.
          </p>
        )}
      </div>

      {/* Risk Göstergesi */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Tahmini Etki Skoru
          </p>
          <span className={cn("font-mono text-[13px] font-bold", meta.text)}>
            {riskScore}/100
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${riskScore}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={cn("h-full rounded-full", meta.bar)}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {depthLabel(quake.depth)} odaklı bir olay ({quake.depth.toFixed(1)} km).{" "}
          {quake.depth < 12
            ? "Sığ odak, yüzeydeki sarsıntı şiddetini artırır."
            : "Derin odak, yüzeydeki etkiyi görece azaltır."}
        </p>
      </div>

      {/* Risk Seviyesi Özeti */}
      {report && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Risk Değerlendirmesi
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold",
                report.riskLevel === "high"
                  ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                  : report.riskLevel === "medium"
                  ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
                  : "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
              )}
            >
              {report.riskLevel === "high" ? "!" : report.riskLevel === "medium" ? "⚠" : "i"}
            </span>
            <span className="text-[12px] text-slate-300">
              {report.riskLevel === "high"
                ? "Yüksek Risk — Yetkililerin talimatlarını takip edin."
                : report.riskLevel === "medium"
                ? "Orta Risk — Dikkatli olun, artçıları takip edin."
                : "Düşük Risk — Rutin takip yeterli."}
            </span>
          </div>
        </div>
      )}

      <p className="px-1 text-[10px] leading-relaxed text-slate-600">
        {source === "gemini"
          ? "Bu içerik Google Gemini AI tarafından oluşturulmuştur ve resmî bir uyarı niteliği taşımaz."
          : "Bu içerik yerel hesaplama ile oluşturulmuştur."}{" "}
        Güncel bilgi için{" "}
        <a href="https://www.afad.gov.tr" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
          AFAD
        </a>{" "}
        ve{" "}
        <a href="http://www.koeri.boun.edu.tr" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
          Kandilli Rasathanesi
        </a>{" "}
        kaynaklarını takip edin.
      </p>
    </div>
  );
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

function computeRiskScore(magnitude: number, depth: number): number {
  return Math.min(100, Math.round(magnitude * 14 + Math.max(0, 25 - depth) * 1.2));
}

function buildLocalFallback(magnitude: number, depth: number): AiReportDto {
  const riskScore = computeRiskScore(magnitude, depth);
  let riskLevel: AiReportDto["riskLevel"] = "low";
  if (magnitude >= 5.0 || depth < 10) riskLevel = "high";
  else if (magnitude >= 3.5) riskLevel = "medium";

  let summary: string[];
  if (riskLevel === "high") {
    summary = [
      "Hasarlı binalara kesinlikle girmeyin, yetkililerin talimatlarını bekleyin.",
      "Doğalgaz vanasını ve sigortaları kapatın, açık alanda kalın.",
      "AFAD 122 / Acil 112 hatlarını yalnızca gerçek acil durumda arayın.",
    ];
  } else if (riskLevel === "medium") {
    summary = [
      "Çök–Kapan–Tutun refleksini uygulayın, sarsıntı bitene kadar yerden kalkmayın.",
      "Asansör kullanmayın; merdivenleri dikkatli kullanarak binayı terk edin.",
      "Doğalgaz ve elektrik tesisatını gözle kontrol edin.",
    ];
  } else {
    summary = [
      "Panik gerektirmez; bu büyüklükte sarsıntı genellikle hasar oluşturmaz.",
      "Artçı sarsıntılara karşı dikkatli olun ve AFAD bildirimlerini takip edin.",
      "Acil durum çantanızın hazır olduğundan emin olun.",
    ];
  }

  return { summary, riskLevel, riskScore, generatedAt: Date.now() };
}
