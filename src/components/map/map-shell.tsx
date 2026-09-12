"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/**
 * MapLibre yalnızca tarayıcıda çalışır (window/WebGL bağımlılığı),
 * bu yüzden harita SSR devre dışı bırakılarak yüklenir.
 */
const EarthquakeMap = dynamic(() => import("@/components/map/earthquake-map"), {
  ssr: false,
  loading: () => (
    <div className="grid-backdrop grid h-full w-full place-items-center bg-[#04060c]">
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        <span className="font-mono text-[11px] uppercase tracking-[0.25em]">
          Harita motoru yükleniyor
        </span>
      </div>
    </div>
  ),
});

export function MapShell() {
  return <EarthquakeMap />;
}
