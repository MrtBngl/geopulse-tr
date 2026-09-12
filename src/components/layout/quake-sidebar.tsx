"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ListFilter, MapPin, Search, SignalHigh, X } from "lucide-react";
import { useQuakes } from "@/components/providers/quake-provider";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { depthLabel, formatTimeAgo, getTierMeta, TIER_META } from "@/lib/quake";
import { cn } from "@/lib/utils";
import type { Earthquake, MagnitudeFilter } from "@/types/earthquake";

const FILTERS: { value: MagnitudeFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "3", label: "3.0+" },
  { value: "4", label: "4.0+" },
  { value: "5", label: "5.0+" },
];

function QuakeRow({
  quake,
  isSelected,
  isLatest,
  now,
  onSelect,
}: {
  quake: Earthquake;
  isSelected: boolean;
  isLatest: boolean;
  now: number;
  onSelect: () => void;
}) {
  const meta = getTierMeta(quake.magnitude);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -18, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 18, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200",
          isSelected
            ? "border-cyan-400/40 bg-cyan-500/10"
            : "border-transparent hover:border-white/10 hover:bg-white/[0.04]",
        )}
      >
        {/* Büyüklük rozeti */}
        <span
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg font-mono text-[13px] font-bold tabular-nums"
          style={{
            color: meta.color,
            background: `${meta.color}14`,
            boxShadow: `inset 0 0 0 1px ${meta.color}33`,
          }}
        >
          {quake.magnitude.toFixed(1)}
          {isLatest ? (
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 blink"
              title="Canlı akıştan yeni düştü"
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-slate-100">
              {quake.city}
            </span>
            <span className="text-slate-600">/</span>
            <span className="truncate text-[12px] text-slate-400">{quake.district}</span>
          </span>
          <span className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-slate-500">
            <span>{quake.depth.toFixed(1)} km</span>
            <span className="text-slate-700">•</span>
            <span>{quake.provider}</span>
            <span className="text-slate-700">•</span>
            <span className={cn("truncate", meta.text)}>{meta.label}</span>
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block whitespace-nowrap text-[10.5px] text-slate-400">
            {formatTimeAgo(quake.timestamp, now)}
          </span>
          <span className="mt-1 block text-[9.5px] text-slate-600">
            {depthLabel(quake.depth)}
          </span>
        </span>

        <span
          className={cn(
            "absolute inset-y-2 -left-px w-0.5 rounded-full transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
          style={{ background: meta.color }}
        />
      </button>
    </motion.li>
  );
}

export function QuakeSidebar({ onClose }: { onClose?: () => void }) {
  const {
    quakes,
    allQuakes,
    isLoading,
    filter,
    setFilter,
    query,
    setQuery,
    selected,
    selectQuake,
    latestLiveId,
    now,
  } = useQuakes();

  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? quakes.slice(0, 40) : quakes.slice(0, 10);

  const distribution = React.useMemo(() => {
    const counts = { low: 0, mid: 0, high: 0, extreme: 0 };
    for (const quake of allQuakes) {
      if (quake.magnitude >= 6) counts.extreme += 1;
      else if (quake.magnitude >= 5) counts.high += 1;
      else if (quake.magnitude >= 3) counts.mid += 1;
      else counts.low += 1;
    }
    const total = allQuakes.length || 1;
    return (["low", "mid", "high", "extreme"] as const).map((tier) => ({
      tier,
      count: counts[tier],
      percent: (counts[tier] / total) * 100,
    }));
  }, [allQuakes]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/[0.07] bg-[#060a12]/80 backdrop-blur-xl lg:w-[340px]">
      {/* Başlık */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <SignalHigh className="h-4 w-4 text-cyan-300" />
        <h2 className="text-[13px] font-semibold tracking-tight text-slate-100">
          Son Depremler
        </h2>
        <Badge className="bg-white/[0.05] text-slate-400 ring-1 ring-inset ring-white/[0.08]">
          {isLoading ? "—" : quakes.length}
        </Badge>
        {onClose ? (
          <Button
            variant="ghost"
            size="iconSm"
            className="ml-auto lg:hidden"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Arama */}
      <div className="px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Şehir veya ilçe ara…"
            className="h-9 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-9 pr-8 text-[12.5px] text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Aramayı temizle"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-1.5 px-4 pb-3 pt-3">
        <ListFilter className="mr-0.5 h-3.5 w-3.5 text-slate-600" />
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 font-mono text-[11px] transition-all",
              filter === item.value
                ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/30"
                : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="thin-scroll flex-1 overflow-y-auto px-2.5 pb-2">
        {isLoading ? (
          <ul className="space-y-1.5 px-1.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
                <Skeleton className="h-2.5 w-12" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <MapPin className="h-5 w-5 text-slate-600" />
            <p className="text-[12.5px] text-slate-400">Kayıt bulunamadı</p>
            <p className="text-[11px] text-slate-600">
              Filtreyi genişletmeyi veya aramayı temizlemeyi deneyin.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((quake) => (
                <QuakeRow
                  key={quake.id}
                  quake={quake}
                  now={now}
                  isSelected={selected?.id === quake.id}
                  isLatest={latestLiveId === quake.id}
                  onSelect={() => selectQuake(quake, { fly: true })}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        {!isLoading && quakes.length > 10 ? (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="mx-auto mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-slate-500 transition hover:bg-white/[0.04] hover:text-cyan-300"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")}
            />
            {showAll ? "Son 10 kaydı göster" : `Tümünü göster (${quakes.length})`}
          </button>
        ) : null}
      </div>

      {/* Dağılım */}
      <div className="border-t border-white/[0.07] px-4 py-3">
        <p className="mb-2 text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Büyüklük Dağılımı
        </p>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
          {distribution.map((item) => (
            <div
              key={item.tier}
              className="h-full transition-all duration-500"
              style={{
                width: `${item.percent}%`,
                background: TIER_META[item.tier].color,
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
          {distribution.map((item) => (
            <span key={item.tier} className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: TIER_META[item.tier].color }}
              />
              {item.count}
            </span>
          ))}
          <span className="text-slate-600">Toplam {allQuakes.length}</span>
        </div>
      </div>
    </aside>
  );
}
