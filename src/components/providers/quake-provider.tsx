/**
 * GeoPulse-TR — Deprem Veri Sağlayıcısı
 *
 * Açılışta GET /api/earthquakes'ten gerçek veri çeker.
 * Her 30 saniyede polling ile listeyi günceller; yeni gelen kayıtlar
 * başa eklenir (max MAX_EVENTS adet tutulur).
 * AFAD ulaşılamazsa otomatik olarak mock veriye fallback yapılır.
 */

"use client";

import * as React from "react";
import { computeStats, filterQuakes } from "@/lib/quake";
import type { Earthquake, MagnitudeFilter, QuakeStats } from "@/types/earthquake";
import type { EarthquakeDto } from "@/types/api";

// ─── Tip Dönüşümü ─────────────────────────────────────────────────────────────
// EarthquakeDto ile Earthquake aynı şemayı paylaşıyor; ek alanlar için cast yapıyoruz.
function dtoToEarthquake(dto: EarthquakeDto): Earthquake {
  return {
    id: dto.id,
    city: dto.city,
    district: dto.district,
    region: dto.region,
    latitude: dto.latitude,
    longitude: dto.longitude,
    magnitude: dto.magnitude,
    depth: dto.depth,
    timestamp: dto.timestamp,
    provider: dto.provider,
    feltReports: dto.feltReports ?? 0,
    isLive: dto.isLive,
  };
}

export type FlyToFn = (options: {
  longitude: number;
  latitude: number;
  zoom?: number;
  withPanelOffset?: boolean;
}) => void;

interface QuakeContextValue {
  /** Ham (filtrelenmemiş) liste — istatistikler için */
  allQuakes: Earthquake[];
  /** Filtre + arama uygulanmış liste — harita ve sidebar için */
  quakes: Earthquake[];
  selected: Earthquake | null;
  isPanelOpen: boolean;
  isLoading: boolean;
  isLive: boolean;
  filter: MagnitudeFilter;
  query: string;
  stats: QuakeStats;
  /** Göreli zaman hesaplamaları için tetiklenen "şimdi" değeri */
  now: number;
  /** Canlı akışta yeni düşen kaydın id'si (flash efekti) */
  latestLiveId: string | null;
  /** Son API hatası — null ise sorun yok */
  fetchError: string | null;
  setFilter: (filter: MagnitudeFilter) => void;
  setQuery: (query: string) => void;
  toggleLive: () => void;
  refetch: () => void;
  selectQuake: (quake: Earthquake, options?: { fly?: boolean }) => void;
  closePanel: () => void;
  resetView: () => void;
  registerFlyTo: (fn: FlyToFn | null) => void;
}

const QuakeContext = React.createContext<QuakeContextValue | null>(null);

const POLL_INTERVAL = 30_000;    // 30 sn — API cache TTL ile eşleşiyor
const CLOCK_INTERVAL = 15_000;   // Göreli zaman etiketleri
const MAX_EVENTS = 90;

// ─── Veri Çekme Hook ───────────────────────────────────────────────────────────

interface FetchResult {
  data: Earthquake[];
  fetchedAt: number;
  source: string;
  warning?: string;
}

async function loadEarthquakes(): Promise<FetchResult> {
  const res = await fetch("/api/earthquakes", { cache: "no-store" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  const json = await res.json() as {
    success: boolean;
    data: EarthquakeDto[];
    fetchedAt: number;
    source: string;
    warning?: string;
  };

  if (!json.success) throw new Error("API başarısız yanıt döndürdü");

  return {
    data: json.data.map(dtoToEarthquake),
    fetchedAt: json.fetchedAt,
    source: json.source,
    warning: json.warning,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function QuakeProvider({ children }: { children: React.ReactNode }) {
  const [allQuakes, setAllQuakes] = React.useState<Earthquake[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isLive, setIsLive] = React.useState(true);
  const [filter, setFilter] = React.useState<MagnitudeFilter>("all");
  const [query, setQuery] = React.useState("");
  const [now, setNow] = React.useState(0);
  const [latestLiveId, setLatestLiveId] = React.useState<string | null>(null);
  const [refetchToken, setRefetchToken] = React.useState(0);

  const flyToRef = React.useRef<FlyToFn | null>(null);

  // ─── İlk Yükleme + Polling ─────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const result = await loadEarthquakes();
        if (cancelled) return;

        const stamp = Date.now();

        setAllQuakes((prev) => {
          if (prev.length === 0) {
            // İlk yükleme: tüm listeyi al
            return result.data.slice(0, MAX_EVENTS);
          }

          // Polling: mevcut ID setini oluştur
          const existingIds = new Set(prev.map((q) => q.id));
          const newOnes = result.data
            .filter((q) => !existingIds.has(q.id))
            .map((q) => ({ ...q, isLive: true }));

          if (newOnes.length > 0) {
            setLatestLiveId(newOnes[0].id);
            return [...newOnes, ...prev].slice(0, MAX_EVENTS);
          }

          return prev;
        });

        setNow(stamp);
        setFetchError(null);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Bağlantı hatası";
        console.error("[QuakeProvider] Veri çekme hatası:", msg);
        setFetchError(msg);

        // Fallback: boşsa mock veriye geç
        if (allQuakes.length === 0) {
          try {
            const { buildInitialQuakes } = await import("@/data/mock-earthquakes");
            if (!cancelled) setAllQuakes(buildInitialQuakes(Date.now()).slice(0, MAX_EVENTS));
          } catch {
            // Mock import da başarısız — boş liste ile devam
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchToken]);

  // ─── Polling (isLive aktifken) ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!isLive || isLoading) return;

    const interval = window.setInterval(() => {
      setRefetchToken((t) => t + 1);
    }, POLL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [isLive, isLoading]);

  // ─── Göreli Zaman Güncelleme ───────────────────────────────────────────────
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), CLOCK_INTERVAL);
    return () => window.clearInterval(interval);
  }, []);

  // ─── Türetilmiş Değerler ───────────────────────────────────────────────────
  const quakes = React.useMemo(
    () => filterQuakes(allQuakes, filter, query),
    [allQuakes, filter, query],
  );

  const stats = React.useMemo(() => computeStats(allQuakes, now || Date.now()), [allQuakes, now]);

  const selected = React.useMemo(
    () => allQuakes.find((q) => q.id === selectedId) ?? null,
    [allQuakes, selectedId],
  );

  // ─── Callback'ler ──────────────────────────────────────────────────────────
  const registerFlyTo = React.useCallback((fn: FlyToFn | null) => {
    flyToRef.current = fn;
  }, []);

  const selectQuake = React.useCallback<QuakeContextValue["selectQuake"]>(
    (quake, options) => {
      setSelectedId(quake.id);
      setIsPanelOpen(true);
      if (options?.fly !== false) {
        flyToRef.current?.({
          longitude: quake.longitude,
          latitude: quake.latitude,
          zoom: quake.magnitude >= 5 ? 8 : 8.8,
          withPanelOffset: true,
        });
      }
    },
    [],
  );

  const closePanel = React.useCallback(() => {
    setIsPanelOpen(false);
    window.setTimeout(() => setSelectedId(null), 320);
  }, []);

  const resetView = React.useCallback(() => {
    flyToRef.current?.({ longitude: 35, latitude: 39, zoom: 5.35, withPanelOffset: false });
  }, []);

  const toggleLive = React.useCallback(() => setIsLive((prev) => !prev), []);

  const refetch = React.useCallback(() => setRefetchToken((t) => t + 1), []);

  // ─── Context Value ─────────────────────────────────────────────────────────
  const value = React.useMemo<QuakeContextValue>(
    () => ({
      allQuakes,
      quakes,
      selected,
      isPanelOpen,
      isLoading,
      isLive,
      filter,
      query,
      stats,
      now,
      latestLiveId,
      fetchError,
      setFilter,
      setQuery,
      toggleLive,
      refetch,
      selectQuake,
      closePanel,
      resetView,
      registerFlyTo,
    }),
    [
      allQuakes,
      quakes,
      selected,
      isPanelOpen,
      isLoading,
      isLive,
      filter,
      query,
      stats,
      now,
      latestLiveId,
      fetchError,
      toggleLive,
      refetch,
      selectQuake,
      closePanel,
      resetView,
      registerFlyTo,
    ],
  );

  return <QuakeContext.Provider value={value}>{children}</QuakeContext.Provider>;
}

export function useQuakes() {
  const ctx = React.useContext(QuakeContext);
  if (!ctx) throw new Error("useQuakes, <QuakeProvider> içinde kullanılmalıdır.");
  return ctx;
}
