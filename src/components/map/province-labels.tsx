"use client";

import * as React from "react";
import { Marker } from "react-map-gl/maplibre";
import { PROVINCE_CENTERS } from "@/data/turkey-province-centers";
import { cn } from "@/lib/utils";

interface ProvinceLabelsProps {
  /** Zoom "kovası" — kademeli güncellenir (performans). */
  zoom: number;
  /** Deprem kaydı bulunan iller. */
  activeProvinces: Set<string>;
  /** Seçili depremin ili. */
  focusedProvince: string | null;
  /** Açık renkli / çizim teması aktif mi? */
  isLightMode?: boolean;
}

/**
 * 81 ilin TAMAMI her zaman etiketlenir.
 * Okunabilirlik zoom'a göre punto ve opaklıkla sağlanır:
 * uzaktayken küçük iller sönükleşir, yakınlaştıkça netleşir.
 */
function ProvinceLabelsBase({
  zoom,
  activeProvinces,
  focusedProvince,
  isLightMode = false,
}: ProvinceLabelsProps) {
  // Zoom arttıkça yazı büyür (5 → 9px, 8+ → 13px)
  const baseSize = Math.max(9, Math.min(13, 9 + (zoom - 5) * 1.15));

  return (
    <>
      {PROVINCE_CENTERS.map((province) => {
        const isActive = activeProvinces.has(province.name);
        const isFocused = focusedProvince === province.name;
        // Küçük iller uzak zoom'da sönük, büyükler net
        const prominence = Math.min(1, province.area / 0.85);
        const baseOpacity = 0.42 + prominence * 0.34 + Math.max(0, zoom - 5.3) * 0.16;
        const opacity = isFocused || isActive ? 1 : Math.min(0.95, baseOpacity);
        const fontSize = isFocused
          ? baseSize + 1.5
          : isActive
            ? baseSize + 0.5
            : baseSize - (1 - prominence) * 1.2;

        return (
          <Marker
            key={province.id}
            longitude={province.lon}
            latitude={province.lat}
            anchor="center"
            style={{ pointerEvents: "none", zIndex: isFocused ? 6 : isActive ? 3 : 1 }}
          >
            <span
              className={cn(
                "select-none whitespace-nowrap font-semibold tracking-wide transition-colors duration-300",
                isLightMode
                  ? isFocused
                    ? "text-cyan-900 font-bold"
                    : isActive
                      ? "text-slate-900 font-bold"
                      : "text-slate-800"
                  : isFocused
                    ? "text-cyan-100 font-bold"
                    : isActive
                      ? "text-slate-100 font-semibold"
                      : "text-slate-300",
              )}
              style={{
                fontSize: `${fontSize}px`,
                opacity: isLightMode ? Math.max(0.7, opacity) : opacity,
                letterSpacing: "0.02em",
                textShadow: isLightMode
                  ? "0 0 4px #ffffff, 0 0 2px #ffffff, 0 1px 2px #ffffff"
                  : "0 1px 3px rgba(0,0,0,0.98), 0 0 7px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)",
              }}
            >
              {province.name}
            </span>
          </Marker>
        );
      })}
    </>
  );
}

export const ProvinceLabels = React.memo(ProvinceLabelsBase);
