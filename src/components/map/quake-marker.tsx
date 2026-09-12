"use client";

import * as React from "react";
import { Marker } from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import { getMarkerSize, getRingCount, getTierMeta } from "@/lib/quake";
import { cn } from "@/lib/utils";
import type { Earthquake } from "@/types/earthquake";

interface QuakeMarkerProps {
  quake: Earthquake;
  isSelected: boolean;
  isLatest: boolean;
  onSelect: (quake: Earthquake) => void;
}

function QuakeMarkerBase({ quake, isSelected, isLatest, onSelect }: QuakeMarkerProps) {
  const meta = getTierMeta(quake.magnitude);
  const size = getMarkerSize(quake.magnitude);
  const rings = getRingCount(quake.magnitude);
  const showLabel = quake.magnitude >= 4.5 || isSelected;

  return (
    <Marker
      longitude={quake.longitude}
      latitude={quake.latitude}
      anchor="center"
      onClick={(event) => {
        event.originalEvent?.stopPropagation();
        onSelect(quake);
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        whileHover={{ scale: 1.28 }}
        className="group relative grid place-items-center"
        style={{ width: size, height: size, color: meta.color }}
        aria-label={`${quake.city} ${quake.magnitude} büyüklüğünde deprem`}
      >
        {/* Radar dalgaları */}
        {Array.from({ length: rings }).map((_, index) => (
          <span
            key={index}
            className="radar-ring"
            style={{ animationDelay: `${index * 1.02}s` }}
          />
        ))}

        {/* Çekirdek nokta */}
        <span
          className="radar-core absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${meta.color} 45%, ${meta.color}cc 100%)`,
            boxShadow: `0 0 ${Math.round(size * 0.9)}px ${meta.color}88, 0 0 6px ${meta.color}`,
          }}
        />

        {/* Seçili halka */}
        {isSelected ? (
          <motion.span
            layoutId="quake-selection-ring"
            className="pointer-events-none absolute rounded-full border-2 border-white/90"
            style={{
              width: size + 16,
              height: size + 16,
              boxShadow: "0 0 22px rgba(255,255,255,0.55)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          />
        ) : null}

        {/* Yeni gelen canlı kayıt işareti */}
        {isLatest && !isSelected ? (
          <span
            className="pointer-events-none absolute rounded-full border border-cyan-300/70"
            style={{ width: size + 24, height: size + 24 }}
          />
        ) : null}

        {/* Büyüklük etiketi */}
        {showLabel ? (
          <span
            className={cn(
              "pointer-events-none absolute -top-1 left-full ml-2 rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums backdrop-blur-sm",
              meta.text,
            )}
          >
            {quake.magnitude.toFixed(1)}
          </span>
        ) : null}

        {/* Hover kartı */}
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#070b14]/95 px-3 py-2 text-left shadow-2xl backdrop-blur group-hover:block">
          <p className="text-[11px] font-semibold text-slate-100">
            {quake.city} <span className="text-slate-500">/</span> {quake.district}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
            ML {quake.magnitude.toFixed(1)} · {quake.depth.toFixed(1)} km ·{" "}
            <span className={meta.text}>{meta.label}</span>
          </p>
        </div>
      </motion.div>
    </Marker>
  );
}

export const QuakeMarker = React.memo(QuakeMarkerBase);
