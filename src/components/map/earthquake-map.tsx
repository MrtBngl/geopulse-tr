"use client";

import * as React from "react";
import MapGL, {
  Layer,
  NavigationControl,
  ScaleControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";
import { AnimatePresence, motion } from "framer-motion";
import { MapPinned, RadioTower } from "lucide-react";
import {
  BORDER_LINES_DATA,
  BORDER_LINES_URL,
  EMPTY_FC,
  FAULT_LINES,
  OUTLINE_DATA,
  OUTLINE_URL,
  OUTSIDE_MASK_DATA,
  OUTSIDE_MASK_URL,
  PROVINCES_DATA,
  PROVINCES_URL,
  TURKEY_BOUNDS,
  TURKEY_MAX_BOUNDS,
  TURKEY_VIEW,
} from "@/data/turkey-geo";
import { PROVINCE_ID_BY_NAME } from "@/data/turkey-province-centers";
import { useQuakes, type FlyToFn } from "@/components/providers/quake-provider";
import { QuakeMarker } from "@/components/map/quake-marker";
import { ProvinceLabels } from "@/components/map/province-labels";
import { MapLegend } from "@/components/map/map-legend";
import { cn } from "@/lib/utils";

/** Token gerektirmeyen, Mapbox Dark v11 muadili ücretsiz vektör tema. */
const DARK_STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/**
 * Tamamen yerel, ağ gerektirmeyen "taktik" tema.
 * Harita HER ZAMAN bununla başlatılır: `load` olayı ağ durumundan bağımsız
 * olarak anında tetiklenir ve Türkiye haritası (il poligonları) hemen çizilir.
 */
const TACTICAL_STYLE: StyleSpecification = {
  version: 8,
  name: "GeoPulse Tactical",
  sources: {},
  layers: [
    {
      id: "tactical-background",
      type: "background",
      paint: { "background-color": "#050810" },
    },
  ],
};

const READY_FAILSAFE = 2500;
const STYLE_FETCH_TIMEOUT = 4500;

const PROVINCE_FILL_LAYER = "provinces-fill";

type StyleMode = "dark" | "tactical" | "outline";

export default function EarthquakeMap() {
  const { quakes, allQuakes, selected, selectQuake, registerFlyTo, latestLiveId } = useQuakes();
  const mapRef = React.useRef<MapRef | null>(null);

  const [isReady, setIsReady] = React.useState(false);
  /**
   * Varsayılan TAKTİK: yerel Türkiye katmanları dış tema değişiminden etkilenmez.
   * `outline` modu kullanıcının attığı idari sınır çizim haritası tarzıdır.
   */
  const [styleMode, setStyleMode] = React.useState<StyleMode>("tactical");
  const [remoteStyle, setRemoteStyle] = React.useState<StyleSpecification | null>(null);
  const [remoteFailed, setRemoteFailed] = React.useState(false);
  /** Stil her değiştiğinde artar → feature-state yeniden uygulanır. */
  const [styleVersion, setStyleVersion] = React.useState(0);
  /** Kademeli zoom (etiket yoğunluğu için) */
  const [zoomBucket, setZoomBucket] = React.useState<number>(TURKEY_VIEW.zoom);
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(null);

  /** Statik sınır verileri — Doğrudan gömülü nesneler (0 ağ gecikmesi, 100% erişilebilir) */
  const [provinces, setProvinces] = React.useState<GeoJSON.FeatureCollection>(PROVINCES_DATA);
  const [outline, setOutline] = React.useState<GeoJSON.FeatureCollection>(OUTLINE_DATA);
  const [borderLines, setBorderLines] = React.useState<GeoJSON.FeatureCollection>(BORDER_LINES_DATA);
  const [outsideMask, setOutsideMask] = React.useState<GeoJSON.FeatureCollection>(OUTSIDE_MASK_DATA);
  const [geoLoaded, setGeoLoaded] = React.useState(true);

  /* Yükleme katmanı failsafe */
  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), READY_FAILSAFE);
    return () => window.clearTimeout(timer);
  }, []);

  /* Vektör altlığı arka planda indir (opsiyonel iyileştirme) */
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), STYLE_FETCH_TIMEOUT);

    fetch(DARK_STYLE_URL, { signal: controller.signal, cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<StyleSpecification>;
      })
      .then((style) => {
        if (!cancelled) setRemoteStyle(style);
      })
      .catch(() => {
        if (!cancelled) setRemoteFailed(true);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  const activeStyle = styleMode === "dark" && remoteStyle ? remoteStyle : TACTICAL_STYLE;
  const isTactical = styleMode === "tactical";
  const isOutline = styleMode === "outline";

  /* İl bazında aktivite özeti (deprem sayısı + en büyük magnitüd) */
  const provinceActivity = React.useMemo(() => {
    const map = new Map<string, { count: number; maxMag: number }>();
    for (const quake of allQuakes) {
      const current = map.get(quake.city);
      if (current) {
        current.count += 1;
        current.maxMag = Math.max(current.maxMag, quake.magnitude);
      } else {
        map.set(quake.city, { count: 1, maxMag: quake.magnitude });
      }
    }
    return map;
  }, [allQuakes]);

  const activeProvinceNames = React.useMemo(
    () => new Set(provinceActivity.keys()),
    [provinceActivity],
  );

  const focusedProvince = selected?.city ?? null;

  /* İl poligonlarına aktiviteyi feature-state olarak uygula */
  React.useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isReady || !geoLoaded) return;
    if (!map.getSource("turkey-provinces")) return;

    for (const [name, id] of Object.entries(PROVINCE_ID_BY_NAME)) {
      const activity = provinceActivity.get(name);
      map.setFeatureState(
        { source: "turkey-provinces", id },
        {
          maxMag: activity ? activity.maxMag : null,
          count: activity ? activity.count : 0,
          focused: name === focusedProvince,
        },
      );
    }
  }, [provinceActivity, focusedProvince, isReady, geoLoaded, styleVersion]);

  const flyTo = React.useCallback<FlyToFn>(
    ({ longitude, latitude, zoom = 8.6, withPanelOffset = false }) => {
      const map = mapRef.current;
      if (!map) return;
      const wide = typeof window !== "undefined" && window.innerWidth >= 1024;
      map.flyTo({
        center: [longitude, latitude],
        zoom,
        duration: 2100,
        curve: 1.45,
        essential: true,
        padding: {
          top: 0,
          bottom: 0,
          left: 0,
          right: withPanelOffset && wide ? 420 : 0,
        },
      });
    },
    [],
  );

  React.useEffect(() => {
    registerFlyTo(flyTo);
    return () => registerFlyTo(null);
  }, [flyTo, registerFlyTo]);

  const markReady = React.useCallback(() => setIsReady(true), []);

  const handleZoom = React.useCallback(() => {
    const zoom = mapRef.current?.getZoom();
    if (typeof zoom !== "number") return;
    // 0.4 adımlarla yuvarla → gereksiz re-render yok
    const bucket = Math.round(zoom / 0.4) * 0.4;
    setZoomBucket((prev) => (Math.abs(prev - bucket) < 0.01 ? prev : bucket));
  }, []);

  /** İl poligonuna tıklayınca o ile yakınlaş. */
  const handleMapClick = React.useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: event.lngLat, zoom: Math.max(7.4, map.getZoom()), duration: 1200 });
  }, []);

  const handleMouseMove = React.useCallback((event: MapLayerMouseEvent) => {
    const name = event.features?.[0]?.properties?.name;
    setHoveredProvince(typeof name === "string" ? name : null);
  }, []);

  return (
    <div className={cn("relative h-full w-full overflow-hidden transition-colors duration-500", isOutline ? "bg-[#e2e8f0]" : "bg-[#050810]")}>
      {isTactical ? (
        <div className="grid-backdrop pointer-events-none absolute inset-0 z-0 opacity-60" />
      ) : null}

      <MapGL
        ref={mapRef}
        initialViewState={{
          bounds: TURKEY_BOUNDS,
          fitBoundsOptions: { padding: 32 },
          bearing: 0,
          pitch: 0,
        }}
        mapStyle={activeStyle}
        maxBounds={TURKEY_MAX_BOUNDS}
        minZoom={4.6}
        maxZoom={13}
        dragRotate={false}
        touchZoomRotate
        attributionControl={{ compact: true }}
        interactiveLayerIds={[PROVINCE_FILL_LAYER]}
        cursor={hoveredProvince ? "pointer" : "grab"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        onLoad={() => {
          markReady();
          handleZoom();
        }}
        onStyleData={() => {
          markReady();
          setStyleVersion((version) => version + 1);
        }}
        onIdle={markReady}
        onZoomEnd={handleZoom}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseOut={() => setHoveredProvince(null)}
        onError={(event) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[GeoPulse] map error:", event?.error?.message);
          }
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* TÜRKİYE HARİTASI — 81 il, yerel veri, her zaman görünür          */}
        {/* ---------------------------------------------------------------- */}
        {/* Türkiye dışını karart: ülke silüeti zeminden kesin biçimde ayrılır */}
        <Source id="turkey-outside-mask" type="geojson" data={outsideMask}>
          <Layer
            id="outside-dim"
            source="turkey-outside-mask"
            type="fill"
            paint={{
              "fill-color": isOutline ? "#cbd5e1" : "#01040a",
              "fill-opacity": isOutline ? 0.95 : (isTactical ? 0.88 : 0.72),
            }}
          />
        </Source>

        {/* Deniz zemini + ülke gövdesi (en altta) */}
        <Source id="turkey-outline" type="geojson" data={outline}>
          <Layer
            id="country-base"
            source="turkey-outline"
            type="fill"
            paint={{
              "fill-color": isOutline ? "#f8fafc" : (isTactical ? "#0c192c" : "#0e2036"),
              "fill-opacity": 1,
              "fill-outline-color": isOutline ? "#020617" : "#38bdf8",
            }}
          />
          <Layer
            id="country-halo-outer"
            source="turkey-outline"
            type="line"
            paint={{
              "line-color": "#00f0ff",
              "line-width": ["interpolate", ["linear"], ["zoom"], 4.6, 20, 8, 36],
              "line-opacity": isOutline ? 0 : 0.18,
              "line-blur": 16,
            }}
          />
          <Layer
            id="country-halo-inner"
            source="turkey-outline"
            type="line"
            paint={{
              "line-color": "#38bdf8",
              "line-width": ["interpolate", ["linear"], ["zoom"], 4.6, 8, 8, 14],
              "line-opacity": isOutline ? 0 : 0.45,
              "line-blur": 6,
            }}
          />
        </Source>

        {/* ---------------------------------------------------------------- */}
        {/* 81 İL — dolgu + her ilin etrafında net, keskin line border      */}
        {/* ---------------------------------------------------------------- */}
        <Source id="turkey-provinces" type="geojson" data={provinces} promoteId="id">
          {/* İl gövdesi */}
          <Layer
            id={PROVINCE_FILL_LAYER}
            source="turkey-provinces"
            type="fill"
            paint={{
              "fill-color": isOutline
                ? [
                    "case",
                    ["!=", ["feature-state", "maxMag"], null],
                    [
                      "interpolate",
                      ["linear"],
                      ["feature-state", "maxMag"],
                      2,
                      "#fef3c7",
                      3,
                      "#fed7aa",
                      4,
                      "#fca5a5",
                      5,
                      "#f87171",
                      6.5,
                      "#ef4444",
                    ],
                    "#f8fafc",
                  ]
                : [
                    "case",
                    ["!=", ["feature-state", "maxMag"], null],
                    [
                      "interpolate",
                      ["linear"],
                      ["feature-state", "maxMag"],
                      2,
                      "#1c3254",
                      3,
                      "#284a75",
                      4,
                      "#6e4726",
                      5,
                      "#943420",
                      6.5,
                      "#b91c1c",
                    ],
                    "#122238",
                  ],
              "fill-opacity": 1,
              "fill-outline-color": isOutline ? "#020617" : "#38bdf8",
            }}
          />

          {/* Seçili il vurgusu */}
          <Layer
            id="provinces-focus"
            source="turkey-provinces"
            type="fill"
            paint={{
              "fill-color": isOutline ? "#0284c7" : "#22d3ee",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "focused"], false],
                isOutline ? 0.35 : 0.28,
                0,
              ],
            }}
          />

          {/* SINIR ALT ÇİZGİSİ (casing) — net zemin ayrımı */}
          <Layer
            id="provinces-casing"
            source="turkey-provinces"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": isOutline ? "#ffffff" : "#000000",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                4.6,
                5.0,
                6,
                6.0,
                8,
                7.5,
                12,
                9.5,
              ],
              "line-opacity": isOutline ? 0.8 : 0.95,
            }}
          />

          {/* İL SINIR ÇİZGİSİ (81 İL BORDER LINE) — Her ilin etrafındaki ana hat */}
          <Layer
            id="provinces-border"
            source="turkey-provinces"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": isOutline ? "#0f172a" : "#38bdf8",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                4.6,
                isOutline ? 2.8 : 2.5,
                6,
                3.4,
                8,
                4.2,
                12,
                5.5,
              ],
              "line-opacity": 1,
            }}
          />
        </Source>

        {/* Ana fay zonları */}
        <Source id="fault-lines" type="geojson" data={FAULT_LINES}>
          <Layer
            id="fault-glow"
            source="fault-lines"
            type="line"
            paint={{
              "line-color": "#f43f5e",
              "line-width": 7,
              "line-opacity": isOutline ? 0.25 : 0.16,
              "line-blur": 4,
            }}
          />
          <Layer
            id="fault-line"
            source="fault-lines"
            type="line"
            paint={{
              "line-color": isOutline ? "#e11d48" : "#fb7185",
              "line-width": 1.8,
              "line-opacity": isOutline ? 0.85 : (isTactical ? 0.75 : 0.55),
              "line-dasharray": [3, 2],
            }}
          />
        </Source>

        {/* TÜRKİYE DIŞ SINIRI — Ülkenin etrafında kalın, kesintisiz çizgi border */}
        <Source id="turkey-border-lines" type="geojson" data={borderLines}>
          {/* 1) Ayrım bandı */}
          <Layer
            id="country-casing"
            source="turkey-border-lines"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": isOutline ? "#ffffff" : "#000000",
              "line-width": ["interpolate", ["linear"], ["zoom"], 4.6, 12, 8, 18, 12, 24],
              "line-opacity": 1,
            }}
          />
          {/* 2) Ana Türkiye dış sınır çizgisi */}
          <Layer
            id="country-border"
            source="turkey-border-lines"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": isOutline ? "#020617" : "#ffffff",
              "line-width": ["interpolate", ["linear"], ["zoom"], 4.6, 6.0, 8, 9.5, 12, 12.0],
              "line-opacity": 1,
            }}
          />
          {/* 3) Taktik mod iç accent */}
          <Layer
            id="country-border-accent"
            source="turkey-border-lines"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#00f0ff",
              "line-width": ["interpolate", ["linear"], ["zoom"], 4.6, 2.5, 8, 3.8, 12, 5.0],
              "line-opacity": isOutline ? 0 : 1,
            }}
          />
        </Source>

        {/* İl adı etiketleri */}
        <ProvinceLabels
          zoom={zoomBucket}
          activeProvinces={activeProvinceNames}
          focusedProvince={focusedProvince}
          isLightMode={isOutline}
        />

        {/* Deprem balonları — il/ilçe üzerinde yanıp sönen radar noktaları */}
        {quakes.map((quake) => (
          <QuakeMarker
            key={quake.id}
            quake={quake}
            isSelected={selected?.id === quake.id}
            isLatest={latestLiveId === quake.id}
            onSelect={(item) => selectQuake(item, { fly: true })}
          />
        ))}

        <NavigationControl position="top-right" showCompass={false} />
        <ScaleControl position="bottom-right" maxWidth={110} unit="metric" />
      </MapGL>

      {/* Harita çerçevesi — köşe ayraçları ve iç kenarlık */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[2px] ring-1 ring-inset ring-cyan-400/15" />
      <div className="pointer-events-none absolute inset-2 z-20 rounded-lg border border-cyan-400/10" />
      {[
        "left-2 top-2 border-l-2 border-t-2 rounded-tl-lg",
        "right-2 top-2 border-r-2 border-t-2 rounded-tr-lg",
        "left-2 bottom-2 border-l-2 border-b-2 rounded-bl-lg",
        "right-2 bottom-2 border-r-2 border-b-2 rounded-br-lg",
      ].map((position) => (
        <span
          key={position}
          className={`pointer-events-none absolute z-20 h-6 w-6 border-cyan-300/40 ${position}`}
        />
      ))}

      {/* Vinyet */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#050810] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#050810]/80 to-transparent" />

      {/* Radar tarama */}
      <div className="sweep pointer-events-none absolute left-1/2 top-1/2 z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full opacity-40" />

      {/* Harita kimliği */}
      <div className="glass-soft pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-xl px-3 py-2 shadow-xl">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/25">
          <MapPinned className="h-3.5 w-3.5 text-cyan-200" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold tracking-[0.08em] text-slate-100">
            TÜRKİYE İL HARİTASI
          </span>
          <span className="block font-mono text-[9.5px] text-slate-500">
            81 il · resmî idari sınırlar
          </span>
        </span>
      </div>

      {/* Hover ipucu */}
      <AnimatePresence>
        {hoveredProvince ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="glass pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full px-3.5 py-1.5"
          >
            <span className="text-[11px] text-slate-300">
              {hoveredProvince}
              {provinceActivity.has(hoveredProvince) ? (
                <span className="ml-2 font-mono text-cyan-300">
                  {provinceActivity.get(hoveredProvince)?.count} kayıt · maks ML{" "}
                  {provinceActivity.get(hoveredProvince)?.maxMag.toFixed(1)}
                </span>
              ) : (
                <span className="ml-2 text-slate-600">kayıt yok</span>
              )}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <MapLegend
        styleMode={styleMode}
        vectorAvailable={Boolean(remoteStyle) && !remoteFailed}
        visibleCount={quakes.length}
        onToggleStyle={() => setStyleMode((prev) => (prev === "tactical" ? "outline" : prev === "outline" ? "dark" : "tactical"))}
        onResetView={() => {
          mapRef.current?.fitBounds(TURKEY_BOUNDS, { padding: 32, duration: 1600 });
          window.setTimeout(handleZoom, 1700);
        }}
      />

      {/* İlk yükleme katmanı (maks. 2.5 sn) */}
      <AnimatePresence>
        {!isReady || !geoLoaded ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-[#050810]/80 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative grid h-16 w-16 place-items-center text-cyan-400">
                <span className="radar-ring" />
                <span className="radar-ring" style={{ animationDelay: "1s" }} />
                <RadioTower className="h-6 w-6 animate-pulse" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
                Sismik ağ taranıyor
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
