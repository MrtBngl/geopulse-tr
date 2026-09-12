"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { Header } from "@/components/layout/header";
import { QuakeSidebar } from "@/components/layout/quake-sidebar";
import { MapShell } from "@/components/map/map-shell";
import { QuakeDetailSheet } from "@/components/panel/quake-detail-sheet";
import { QuakeProvider, useQuakes } from "@/components/providers/quake-provider";
import { getTierMeta } from "@/lib/quake";
import { cn } from "@/lib/utils";

/** Canlı akıştan güçlü bir kayıt düştüğünde beliren uyarı kartı. */
function LiveAlert() {
  const { allQuakes, latestLiveId, selectQuake } = useQuakes();
  const [visibleId, setVisibleId] = React.useState<string | null>(null);

  const quake = React.useMemo(
    () => allQuakes.find((item) => item.id === latestLiveId) ?? null,
    [allQuakes, latestLiveId],
  );

  React.useEffect(() => {
    if (!quake || quake.magnitude < 3.5) return;
    setVisibleId(quake.id);
    const timer = window.setTimeout(() => setVisibleId(null), 7000);
    return () => window.clearTimeout(timer);
  }, [quake]);

  const active = quake && quake.id === visibleId ? quake : null;
  const meta = active ? getTierMeta(active.magnitude) : null;

  return (
    <AnimatePresence>
      {active && meta ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          onClick={() => {
            selectQuake(active, { fly: true });
            setVisibleId(null);
          }}
          className="glass absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-2.5 text-left shadow-2xl"
          style={{ borderColor: `${meta.color}55` }}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            <Zap className="h-4 w-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Yeni Sarsıntı Algılandı
            </span>
            <span className="block text-[12.5px] font-semibold text-slate-100">
              {active.city} – {active.district}
              <span className={cn("ml-2 font-mono", meta.text)}>
                ML {active.magnitude.toFixed(1)}
              </span>
            </span>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="relative flex min-h-0 flex-1">
        {/* Masaüstü sidebar */}
        <div className="hidden shrink-0 lg:block">
          <QuakeSidebar />
        </div>

        {/* Mobil sidebar */}
        <AnimatePresence>
          {isSidebarOpen ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 34 }}
                className="absolute inset-y-0 left-0 z-50 w-[86%] max-w-[340px] shadow-2xl lg:hidden"
              >
                <QuakeSidebar onClose={() => setIsSidebarOpen(false)} />
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        {/* Harita */}
        <main className="relative min-w-0 flex-1">
          <MapShell />
          <LiveAlert />
        </main>
      </div>

      <QuakeDetailSheet />
    </div>
  );
}

export function Dashboard() {
  return (
    <QuakeProvider>
      <DashboardLayout />
    </QuakeProvider>
  );
}
