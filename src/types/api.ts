/**
 * GeoPulse-TR — API Yanıt Tip Tanımları
 * Tüm endpoint'lerin request ve response şemaları buradan yönetilir.
 */

// ─── Genel Sarmalayıcılar ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  cached?: boolean;
  /** Unix ms — verinin kaynakta ne zaman güncellendiği */
  fetchedAt: number;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── GET /api/earthquakes ────────────────────────────────────────────────────

/** AFAD API'sinden gelen ham kayıt */
export interface AfadRawEvent {
  eventID: string;
  latitude: string;
  longitude: string;
  depth: string;
  magnitude: string;
  magnitudeType: string;
  date: string;       // "YYYY-MM-DD HH:mm:ss"
  location: string;   // "İlçe (Şehir)"
  country: string;
  province: string;
  district: string;
}

/** Frontend'e döndürülen normalize deprem verisi */
export interface EarthquakeDto {
  id: string;
  city: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  timestamp: number;
  provider: "AFAD" | "Kandilli" | "USGS";
  feltReports: number;
  isLive?: boolean;
}

export type EarthquakeListResponse = ApiSuccess<EarthquakeDto[]>;

// ─── GET /api/news ───────────────────────────────────────────────────────────

export interface NewsItemDto {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  minutesAgo: number;
  tag: "Resmî" | "Ajans" | "Yerel" | "Sosyal";
}

export type NewsListResponse = ApiSuccess<NewsItemDto[]>;

// ─── POST /api/ai/report ─────────────────────────────────────────────────────

export interface AiReportRequest {
  earthquakeId: string;
  city: string;
  magnitude: number;
  depth: number;
}

export interface AiReportDto {
  summary: string[];
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  generatedAt: number;
}

export type AiReportResponse = ApiSuccess<AiReportDto>;
