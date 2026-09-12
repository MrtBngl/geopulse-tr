"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building,
  Clock,
  Compass,
  Crosshair,
  Gauge,
  Layers3,
  MapPin,
  Radio,
  Share2,
  Users,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger, Badge, Separator } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { NewsFeed } from "@/components/panel/news-feed";
import { AiSummary } from "@/components/panel/ai-summary";
import { useQuakes } from "@/components/providers/quake-provider";
import {
  depthLabel,
  distanceKm,
  formatClock,
  formatCoord,
  formatDateTime,
  formatTimeAgo,
  getTierMeta,
} from "@/lib/quake";
import { cn } from "@/lib/utils";
import type { Earthquake } from "@/types/earthquake";

const MAJOR_CITIES = [
  { name: "İstanbul", latitude: 41.01, longitude: 28.98 },
  { name: "Ankara", latitude: 39.93, longitude: 32.86 },
  { name: "İzmir", latitude: 38.42, longitude: 27.14 },
  { name: "Adana", latitude: 37.0, longitude: 35.32 },
  { name: "Antalya", latitude: 36.89, longitude: 30.71 },
  { name: "Erzurum", latitude: 39.9, longitude: 41.27 },
  { name: "Diyarbakır", latitude: 37.91, longitude: 40.24 },
  { name: "Samsun", latitude: 41.29, longitude: 36.33 },
  { name: "Konya", latitude: 37.87, longitude: 32.49 },
  { name: "Gaziantep", latitude: 37.07, longitude: 37.38 },
];

function InfoTile({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[9.5px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className={cn("mt-1.5 font-mono text-[15px] font-semibold tabular-nums text-slate-100", accent)}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[10.5px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

function OverviewTab({ quake, now }: { quake: Earthquake; now: number }) {
  const meta = getTierMeta(quake.magnitude);
  const nearest = React.useMemo(() => {
    return MAJOR_CITIES.map((city) => ({ ...city, km: distanceKm(quake, city) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
  }, [quake]);

  const intensity = Math.min(100, (quake.magnitude / 7.5) * 100);

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <InfoTile
          icon={<Gauge className="h-3 w-3" />}
          label="Büyüklük"
          value={`ML ${quake.magnitude.toFixed(1)}`}
          sub={meta.label}
          accent={meta.text}
        />
        <InfoTile
          icon={<Layers3 className="h-3 w-3" />}
          label="Derinlik"
          value={`${quake.depth.toFixed(1)} km`}
          sub={depthLabel(quake.depth)}
        />
        <InfoTile
          icon={<Clock className="h-3 w-3" />}
          label="Zaman"
          value={formatTimeAgo(quake.timestamp, now)}
          sub={formatClock(quake.timestamp)}
        />
        <InfoTile
          icon={<Users className="h-3 w-3" />}
          label="Hissettim"
          value={quake.feltReports.toLocaleString("tr-TR")}
          sub="bildirim"
        />
      </div>

      {/* Şiddet ölçeği */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Sarsıntı Şiddeti
          </p>
          <span className={cn("font-mono text-[11px]", meta.text)}>{meta.label}</span>
        </div>
        <div className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-yellow-500/25 via-orange-500/25 to-red-500/25">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${intensity}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full", meta.bar)}
            style={{ boxShadow: `0 0 14px ${meta.color}` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-slate-600">
          <span>1.0</span>
          <span>3.0</span>
          <span>5.0</span>
          <span>7.5+</span>
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-400">{meta.description}</p>
      </div>

      {/* Konum bilgileri */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Epizantr Konumu
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11.5px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <Compass className="h-3 w-3 text-slate-600" />
            {formatCoord(quake.latitude, "lat")}
          </span>
          <span className="flex items-center gap-1.5">
            <Compass className="h-3 w-3 text-slate-600" />
            {formatCoord(quake.longitude, "lon")}
          </span>
        </div>
        <Separator className="my-2.5" />
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
          En yakın büyükşehirler
        </p>
        <ul className="mt-2 space-y-1.5">
          {nearest.map((city) => (
            <li key={city.name} className="flex items-center gap-2 text-[11.5px]">
              <Building className="h-3 w-3 text-slate-600" />
              <span className="text-slate-300">{city.name}</span>
              <span className="ml-auto font-mono text-slate-500">{city.km} km</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
        <Radio className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-[11.5px] text-slate-400">Veri kaynağı</span>
        <span className="ml-auto font-mono text-[11.5px] text-slate-200">{quake.provider}</span>
      </div>
    </div>
  );
}

export function QuakeDetailSheet() {
  const { selected, isPanelOpen, closePanel, now, selectQuake } = useQuakes();
  const [lastQuake, setLastQuake] = React.useState<Earthquake | null>(null);

  React.useEffect(() => {
    if (selected) setLastQuake(selected);
  }, [selected]);

  const quake = selected ?? lastQuake;
  const meta = quake ? getTierMeta(quake.magnitude) : null;

  return (
    <Sheet open={isPanelOpen} onOpenChange={(open) => (!open ? closePanel() : undefined)}>
      <SheetContent>
        {quake && meta ? (
          <>
            {/* Başlık */}
            <div
              className="relative shrink-0 overflow-hidden border-b border-white/[0.07] px-5 pb-4 pt-5"
              style={{
                background: `linear-gradient(135deg, ${meta.color}1f 0%, transparent 65%)`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                  style={{
                    color: meta.color,
                    background: `${meta.color}14`,
                    boxShadow: `inset 0 0 0 1px ${meta.color}40`,
                  }}
                >
                  <span className="radar-ring" />
                  <span className="font-mono text-lg font-bold tabular-nums">
                    {quake.magnitude.toFixed(1)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <Badge className={meta.badge}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label} Sarsıntı
                  </Badge>
                  <SheetTitle className="mt-1.5 truncate text-[17px] font-semibold tracking-tight text-slate-50">
                    {quake.city}
                    <span className="mx-1.5 text-slate-600">–</span>
                    <span className="text-slate-300">{quake.district}</span>
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {quake.region}
                    </span>
                    <span className="text-slate-700">•</span>
                    <span>{formatDateTime(quake.timestamp)}</span>
                  </SheetDescription>
                </div>

                <button
                  type="button"
                  onClick={closePanel}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
                  aria-label="Paneli kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3.5 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => selectQuake(quake, { fly: true })}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Haritada Odakla
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="h-3.5 w-3.5" />
                  Paylaş
                </Button>
              </div>
            </div>

            {/* Sekmeler */}
            <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                  <TabsTrigger value="news">Son Dakika</TabsTrigger>
                  <TabsTrigger value="ai">AI Analiz</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab quake={quake} now={now} />
                </TabsContent>
                <TabsContent value="news">
                  <NewsFeed quake={quake} />
                </TabsContent>
                <TabsContent value="ai">
                  <AiSummary quake={quake} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="shrink-0 border-t border-white/[0.07] px-5 py-2.5 flex items-center justify-between">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-slate-600">
                GeoPulse-TR
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-emerald-500/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Canlı Veri
              </span>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
