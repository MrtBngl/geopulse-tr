"use client";

import { Activity, ChevronsUpDown, Gauge, Menu, Pause, Play, Radar, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { useQuakes } from "@/components/providers/quake-provider";
import { Button } from "@/components/ui/button";
import { Badge, Separator, Skeleton, StatPill } from "@/components/ui/primitives";
import { formatTimeAgo, getTierMeta } from "@/lib/quake";
import { cn } from "@/lib/utils";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { stats, isLive, toggleLive, isLoading, now, allQuakes } = useQuakes();
  const strongestMeta = getTierMeta(stats.strongest);
  const lastEvent = allQuakes[0];

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#060a12]/85 px-3 backdrop-blur-xl sm:px-5">
      {/* Logo */}
      <Button
        variant="ghost"
        size="iconSm"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Paneli aç/kapat"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-3">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-blue-600/10 ring-1 ring-inset ring-cyan-400/30">
          <Waves className="h-4.5 w-4.5 text-cyan-300" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400 blink" />
        </div>
        <div className="leading-none">
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-50">
            GeoPulse
            <span className="ml-0.5 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              -TR
            </span>
          </h1>
          <p className="mt-1 hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:block">
            Sismik İzleme Merkezi
          </p>
        </div>
      </div>

      <Separator orientation="vertical" className="mx-1 hidden h-8 md:block" />

      {/* Canlı durum */}
      <button
        type="button"
        onClick={toggleLive}
        className={cn(
          "group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all",
          isLive
            ? "border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15"
            : "border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15",
        )}
        title={isLive ? "Canlı akışı duraklat" : "Canlı akışı başlat"}
      >
        <span className="relative flex h-2 w-2">
          {isLive ? (
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
              animate={{ scale: [1, 2.4, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          ) : null}
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              isLive ? "bg-emerald-400" : "bg-amber-400",
            )}
          />
        </span>
        <span
          className={cn(
            "hidden text-[11px] font-medium sm:inline",
            isLive ? "text-emerald-300" : "text-amber-300",
          )}
        >
          {isLive ? "Sistem Aktif · Canlı Veri Akışı" : "Akış Duraklatıldı"}
        </span>
        {isLive ? (
          <Pause className="h-3 w-3 text-emerald-300/70 opacity-0 transition group-hover:opacity-100" />
        ) : (
          <Play className="h-3 w-3 text-amber-300/70" />
        )}
      </button>

      <div className="ml-auto flex items-center gap-2">
        {isLoading ? (
          <>
            <Skeleton className="hidden h-9 w-28 rounded-xl md:block" />
            <Skeleton className="hidden h-9 w-28 rounded-xl lg:block" />
            <Skeleton className="hidden h-9 w-32 rounded-xl xl:block" />
          </>
        ) : (
          <>
            <div className="hidden md:block">
              <StatPill
                label="Son 24 Saat"
                value={stats.total24h}
                hint="olay"
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </div>
            <div className="hidden lg:block">
              <StatPill
                label="En Büyük"
                value={`ML ${stats.strongest.toFixed(1)}`}
                accent={strongestMeta.text}
                icon={<ChevronsUpDown className="h-3.5 w-3.5" />}
              />
            </div>
            <div className="hidden xl:block">
              <StatPill
                label="Ort. Derinlik"
                value={stats.averageDepth.toFixed(1)}
                hint="km"
                icon={<Gauge className="h-3.5 w-3.5" />}
              />
            </div>
            {lastEvent ? (
              <Badge className="hidden border border-white/[0.08] bg-white/[0.03] text-slate-300 sm:inline-flex">
                <Radar className="h-3 w-3 text-cyan-300" />
                Son kayıt:
                <span className="font-mono text-cyan-200">
                  {lastEvent.city} · ML {lastEvent.magnitude.toFixed(1)}
                </span>
                <span className="text-slate-500">{formatTimeAgo(lastEvent.timestamp, now)}</span>
              </Badge>
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}
