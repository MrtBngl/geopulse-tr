"use client";

import { Activity, Layers, Locate } from "lucide-react";
import { TIER_META } from "@/lib/quake";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEGEND = [
  { meta: TIER_META.low, range: "ML < 3.0", size: 10 },
  { meta: TIER_META.mid, range: "3.0 – 4.9", size: 16 },
  { meta: TIER_META.high, range: "5.0 – 5.9", size: 22 },
  { meta: TIER_META.extreme, range: "6.0 +", size: 26 },
];

export function MapLegend({
  styleMode,
  onToggleStyle,
  onResetView,
  visibleCount,
  vectorAvailable,
}: {
  styleMode: "dark" | "tactical" | "outline";
  onToggleStyle: () => void;
  onResetView: () => void;
  visibleCount: number;
  /** Uzak vektör tema indirilebildi mi? */
  vectorAvailable: boolean;
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex flex-col gap-2">
      <div className="pointer-events-auto glass w-[228px] rounded-2xl p-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-300" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Büyüklük Ölçeği
          </p>
        </div>

        <ul className="space-y-2">
          {LEGEND.map(({ meta, range, size }) => (
            <li key={meta.tier} className="flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center">
                <span
                  className="rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: meta.color,
                    boxShadow: `0 0 12px ${meta.color}aa`,
                  }}
                />
              </span>
              <span className="flex-1 font-mono text-[11px] text-slate-300">{range}</span>
              <span className={cn("text-[10px] font-medium", meta.text)}>{meta.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2.5">
          <span className="text-[10px] text-slate-500">Haritadaki olay</span>
          <span className="font-mono text-[11px] font-semibold text-cyan-300">
            {visibleCount}
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5 border-t border-white/[0.07] pt-2.5">
          <div className="flex items-center gap-2">
            <span className="h-[3px] w-5 rounded-full bg-[#d8f3ff] shadow-[0_0_6px_#7dd3fc]" />
            <span className="text-[10px] text-slate-400">Ülke sınırı</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-5 rounded-full bg-[#8fb3d9]" />
            <span className="text-[10px] text-slate-400">İl sınırı (81 il)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-5 rounded-full bg-[#fb7185] opacity-70" />
            <span className="text-[10px] text-slate-400">Fay zonu</span>
          </div>
        </div>

        <div className="mt-2.5 border-t border-white/[0.07] pt-2.5">
          <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.14em] text-slate-500">
            İl Aktivitesi
          </p>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full">
            {["#1b2c46", "#234064", "#5c3f26", "#7d3020", "#8e2133"].map((color) => (
              <span key={color} className="h-full flex-1" style={{ background: color }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-600">
            <span>sakin</span>
            <span>yoğun</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Mod</span>
          <span className="font-mono text-[10px] text-cyan-300">
            {styleMode === "outline" ? "İdari Çizim (Harita)" : styleMode === "dark" ? "Vektör Dark" : "Taktik Neon"}
          </span>
        </div>
      </div>

      <div className="pointer-events-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="glass-soft"
          onClick={onToggleStyle}
        >
          <Layers className="h-3.5 w-3.5" />
          {styleMode === "tactical" ? "İdari Çizim Görünüm" : styleMode === "outline" ? "Vektör Dark" : "Taktik Görünüm"}
        </Button>
        <Button variant="outline" size="sm" className="glass-soft" onClick={onResetView}>
          <Locate className="h-3.5 w-3.5" />
          Türkiye
        </Button>
      </div>
    </div>
  );
}
