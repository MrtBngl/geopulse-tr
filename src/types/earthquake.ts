export type QuakeProvider = "AFAD" | "Kandilli" | "USGS";

export type MagnitudeTier = "low" | "mid" | "high" | "extreme";

export interface Earthquake {
  /** Benzersiz olay kimliği (mock) */
  id: string;
  /** Şehir, örn: "Malatya" */
  city: string;
  /** İlçe / mevkii, örn: "Pütürge" */
  district: string;
  /** Coğrafi bölge, örn: "Doğu Anadolu" */
  region: string;
  latitude: number;
  longitude: number;
  /** Yerel büyüklük (ML) */
  magnitude: number;
  /** Odak derinliği (km) */
  depth: number;
  /** Olay zamanı (epoch ms) */
  timestamp: number;
  provider: QuakeProvider;
  /** "Hissettim" bildirim sayısı (mock) */
  feltReports: number;
  /** Canlı akışta yeni gelen kayıt işareti */
  isLive?: boolean;
}

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  summary: string;
  minutesAgo: number;
  tag: "Resmî" | "Ajans" | "Yerel" | "Sosyal";
}

export type MagnitudeFilter = "all" | "3" | "4" | "5";

export interface QuakeStats {
  total24h: number;
  strongest: number;
  averageDepth: number;
  lastEventAt: number | null;
  above4: number;
}
