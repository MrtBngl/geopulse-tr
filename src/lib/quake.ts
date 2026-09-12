import type { Earthquake, MagnitudeFilter, MagnitudeTier, QuakeStats } from "@/types/earthquake";

export interface TierMeta {
  tier: MagnitudeTier;
  label: string;
  /** Marker & grafik rengi (hex) */
  color: string;
  /** Tailwind metin rengi */
  text: string;
  /** Tailwind rozet sınıfları */
  badge: string;
  /** Tailwind arka plan (bar/istatistik) */
  bar: string;
  description: string;
}

export const TIER_META: Record<MagnitudeTier, TierMeta> = {
  low: {
    tier: "low",
    label: "Hafif",
    color: "#facc15",
    text: "text-yellow-300",
    badge: "bg-yellow-400/12 text-yellow-300 ring-1 ring-inset ring-yellow-400/30",
    bar: "bg-yellow-400",
    description: "Genellikle yalnızca hassas cihazlarca kaydedilir, sınırlı hissedilir.",
  },
  mid: {
    tier: "mid",
    label: "Orta",
    color: "#fb923c",
    text: "text-orange-300",
    badge: "bg-orange-400/12 text-orange-300 ring-1 ring-inset ring-orange-400/30",
    bar: "bg-orange-400",
    description: "Epizantr çevresinde net hissedilir, eşyalarda sallanma görülebilir.",
  },
  high: {
    tier: "high",
    label: "Şiddetli",
    color: "#ef4444",
    text: "text-red-400",
    badge: "bg-red-500/12 text-red-400 ring-1 ring-inset ring-red-500/30",
    bar: "bg-red-500",
    description: "Hasar potansiyeli taşır, geniş bir alanda güçlü şekilde hissedilir.",
  },
  extreme: {
    tier: "extreme",
    label: "Yıkıcı",
    color: "#f43f5e",
    text: "text-rose-400",
    badge: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/40",
    bar: "bg-rose-500",
    description: "Ciddi yapısal hasar riski; artçı sarsıntı olasılığı çok yüksek.",
  },
};

/** Büyüklüğe göre seviye (renk/boyut mantığının tek kaynağı). */
export function getTier(magnitude: number): MagnitudeTier {
  if (magnitude >= 6) return "extreme";
  if (magnitude >= 5) return "high";
  if (magnitude >= 3) return "mid";
  return "low";
}

export function getTierMeta(magnitude: number): TierMeta {
  return TIER_META[getTier(magnitude)];
}

/**
 * Harita üzerindeki nokta çapı (px).
 * Mag < 3 → küçük, 3-5 → orta, 5+ → büyük.
 */
export function getMarkerSize(magnitude: number): number {
  const tier = getTier(magnitude);
  if (tier === "low") return 12;
  if (tier === "mid") return 20;
  if (tier === "high") return 30;
  return 38;
}

/** Radar halkası sayısı — büyüklük arttıkça daha yoğun dalga. */
export function getRingCount(magnitude: number): number {
  const tier = getTier(magnitude);
  if (tier === "low") return 1;
  if (tier === "mid") return 2;
  return 3;
}

const rtf = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

/** "12 dakika önce" biçiminde göreli zaman. */
export function formatTimeAgo(timestamp: number, now: number = Date.now()): string {
  const diffSec = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 45) return "az önce";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatCoord(value: number, axis: "lat" | "lon"): string {
  const hemisphere = axis === "lat" ? (value >= 0 ? "K" : "G") : value >= 0 ? "D" : "B";
  return `${Math.abs(value).toFixed(4)}° ${hemisphere}`;
}

/** Derinlik sınıflandırması (sığ depremler daha yıkıcıdır). */
export function depthLabel(depth: number): string {
  if (depth < 10) return "Çok sığ";
  if (depth < 30) return "Sığ";
  if (depth < 70) return "Orta derinlik";
  return "Derin";
}

export function magnitudeFilterValue(filter: MagnitudeFilter): number {
  return filter === "all" ? 0 : Number(filter);
}

export function filterQuakes(
  quakes: Earthquake[],
  filter: MagnitudeFilter,
  query: string,
): Earthquake[] {
  const min = magnitudeFilterValue(filter);
  const q = query.trim().toLocaleLowerCase("tr-TR");

  return quakes.filter((item) => {
    if (item.magnitude < min) return false;
    if (!q) return true;
    return (
      item.city.toLocaleLowerCase("tr-TR").includes(q) ||
      item.district.toLocaleLowerCase("tr-TR").includes(q) ||
      item.region.toLocaleLowerCase("tr-TR").includes(q)
    );
  });
}

export function computeStats(quakes: Earthquake[], now: number = Date.now()): QuakeStats {
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const recent = quakes.filter((q) => q.timestamp >= dayAgo);

  return {
    total24h: recent.length,
    strongest: quakes.reduce((max, q) => Math.max(max, q.magnitude), 0),
    averageDepth:
      quakes.length === 0
        ? 0
        : Number((quakes.reduce((sum, q) => sum + q.depth, 0) / quakes.length).toFixed(1)),
    lastEventAt: quakes.length ? Math.max(...quakes.map((q) => q.timestamp)) : null,
    above4: quakes.filter((q) => q.magnitude >= 4).length,
  };
}

/** Basit Haversine — panelde "en yakın il merkezi" gibi bilgiler için. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
