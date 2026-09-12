/**
 * GeoPulse-TR — AFAD Deprem Veri Servisi
 *
 * AFAD REST API'sinden son depremleri çeker ve normalize eder.
 * API erişilemezse mevcut mock veriye (src/data/mock-earthquakes.ts) fallback yapar.
 *
 * AFAD Endpoint:
 *   POST https://deprem.afad.gov.tr/api/v2/event/filter
 *   Body: { start, end, minmag, orderby, limit }
 *
 * Alternatif (GET, public):
 *   https://deprem.afad.gov.tr/EventData/GetEventsByFilter?EventSearchFilterSortDTO={...}
 */

import axios, { AxiosError } from "axios";
import type { EarthquakeDto } from "@/types/api";

// ─── AFAD Sabitler ───────────────────────────────────────────────────────────

const AFAD_BASE_URL = "https://deprem.afad.gov.tr/apiv2/event/filter";
const TIMEOUT_MS = 8_000;
const DEFAULT_LIMIT = 50;

/** AFAD API'sinden gelen ham veri şeması */
interface AfadEvent {
  eventID: string | number;
  latitude: string | number;
  longitude: string | number;
  depth: string | number;
  magnitude: string | number;
  magnitudeType?: string;
  date: string;       // "YYYY-MM-DD HH:mm:ss"
  location: string;   // "İLÇE (ŞEHİR)"
  province?: string;
  district?: string;
  country?: string;
}

interface AfadApiResponse {
  eventCount?: number;
  eventList?: AfadEvent[];
}

// ─── Bölge Haritası (Türkiye) ────────────────────────────────────────────────
// İl → Coğrafi bölge eşlemesi — tam liste değil, temsili.
const REGION_MAP: Record<string, string> = {
  "İstanbul": "Marmara", "Bursa": "Marmara", "Kocaeli": "Marmara",
  "Balıkesir": "Marmara", "Tekirdağ": "Marmara", "Edirne": "Marmara",
  "İzmir": "Ege", "Manisa": "Ege", "Aydın": "Ege", "Muğla": "Ege",
  "Denizli": "Ege", "Uşak": "Ege", "Kütahya": "Ege", "Afyonkarahisar": "Ege",
  "Antalya": "Akdeniz", "Mersin": "Akdeniz", "Adana": "Akdeniz",
  "Hatay": "Akdeniz", "Isparta": "Akdeniz", "Burdur": "Akdeniz",
  "Ankara": "İç Anadolu", "Konya": "İç Anadolu", "Eskişehir": "İç Anadolu",
  "Kayseri": "İç Anadolu", "Sivas": "İç Anadolu", "Yozgat": "İç Anadolu",
  "Malatya": "Doğu Anadolu", "Elazığ": "Doğu Anadolu", "Diyarbakır": "Doğu Anadolu",
  "Erzurum": "Doğu Anadolu", "Van": "Doğu Anadolu", "Bingöl": "Doğu Anadolu",
  "Erzincan": "Doğu Anadolu", "Muş": "Doğu Anadolu", "Bitlis": "Doğu Anadolu",
  "Adıyaman": "Doğu Anadolu", "Kahramanmaraş": "Doğu Anadolu",
  "Gaziantep": "Güneydoğu Anadolu", "Şanlıurfa": "Güneydoğu Anadolu",
  "Mardin": "Güneydoğu Anadolu", "Batman": "Güneydoğu Anadolu",
  "Şırnak": "Güneydoğu Anadolu", "Siirt": "Güneydoğu Anadolu",
  "Samsun": "Karadeniz", "Trabzon": "Karadeniz", "Rize": "Karadeniz",
  "Artvin": "Karadeniz", "Giresun": "Karadeniz", "Ordu": "Karadeniz",
  "Zonguldak": "Karadeniz", "Kastamonu": "Karadeniz", "Sinop": "Karadeniz",
};

function getRegion(city: string): string {
  return REGION_MAP[city] ?? "Türkiye";
}

// ─── Dönüştürücü ─────────────────────────────────────────────────────────────

/**
 * AFAD ham verisini frontend'in beklediği EarthquakeDto'ya dönüştürür.
 */
function normalizeAfadEvent(ev: AfadEvent, index: number): EarthquakeDto {
  const location = ev.location ?? "";

  // "İLÇE (ŞEHİR)" → ayrıştır
  const parenMatch = location.match(/^(.+?)\s*\((.+?)\)$/);
  const district = parenMatch ? toTitleCase(parenMatch[1].trim()) : location;
  const city = parenMatch
    ? toTitleCase(parenMatch[2].trim())
    : ev.province
    ? toTitleCase(String(ev.province))
    : "Bilinmiyor";

  const lat = parseFloat(String(ev.latitude));
  const lon = parseFloat(String(ev.longitude));
  const mag = parseFloat(String(ev.magnitude));
  const depth = parseFloat(String(ev.depth));

  // AFAD date: "YYYY-MM-DD HH:mm:ss" → ISO
  const isoDate = ev.date.replace(" ", "T") + (ev.date.includes("+") ? "" : "Z");
  const timestamp = new Date(isoDate).getTime();

  return {
    id: String(ev.eventID ?? `afad-${Date.now()}-${index}`),
    city,
    district,
    region: getRegion(city),
    latitude: isNaN(lat) ? 39 : lat,
    longitude: isNaN(lon) ? 35 : lon,
    magnitude: isNaN(mag) ? 0 : mag,
    depth: isNaN(depth) ? 10 : depth,
    timestamp: isNaN(timestamp) ? Date.now() : timestamp,
    provider: "AFAD",
    feltReports: 0,
  };
}

function toTitleCase(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .replace(/(?:^|\s|-)\S/g, (c) => c.toLocaleUpperCase("tr-TR"));
}

// ─── Ana Fonksiyon ────────────────────────────────────────────────────────────

/**
 * AFAD API'sinden son `limit` depremi çeker ve normalize eder.
 * Başarısızlık durumunda mock verisine fallback yapar.
 */
export async function fetchEarthquakes(limit = DEFAULT_LIMIT): Promise<{
  data: EarthquakeDto[];
  source: "afad" | "mock";
  error?: string;
}> {
  // ─── AFAD'a istek at ─────────────────────────────────────────────────────
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) =>
      d.toISOString().slice(0, 19).replace("T", " ");

    const params = new URLSearchParams({
      start: formatDate(sevenDaysAgo),
      end: formatDate(now),
      minmag: "-1",
      maxmag: "10",
      orderby: "timedesc",
      limit: String(limit),
      skip: "0",
    });

    const response = await axios.get<AfadApiResponse | AfadEvent[]>(
      `${AFAD_BASE_URL}?${params.toString()}`,
      {
        timeout: TIMEOUT_MS,
        headers: {
          Accept: "application/json",
          "User-Agent": "GeoPulse-TR/1.0",
        },
      },
    );

    const raw = response.data;

    // AFAD bazen doğrudan dizi, bazen {eventList: [...]} döndürür
    const events: AfadEvent[] = Array.isArray(raw)
      ? (raw as AfadEvent[])
      : (raw as AfadApiResponse).eventList ?? [];

    if (events.length === 0) {
      throw new Error("AFAD boş liste döndürdü");
    }

    const data = events
      .map((ev, i) => normalizeAfadEvent(ev, i))
      .filter((eq) => !isNaN(eq.latitude) && !isNaN(eq.longitude));

    return { data, source: "afad" };
  } catch (err) {
    const message =
      err instanceof AxiosError
        ? `AFAD API hatası: ${err.message}`
        : `Beklenmedik hata: ${String(err)}`;

    console.warn("[afad.service]", message, "— Mock veriye geçiliyor.");

    // ─── Mock Fallback ────────────────────────────────────────────────────
    const { buildInitialQuakes } = await import("@/data/mock-earthquakes");
    const mockData = buildInitialQuakes(Date.now());

    // Mock Earthquake → EarthquakeDto uyumu (aynı şema)
    return {
      data: mockData as unknown as EarthquakeDto[],
      source: "mock",
      error: message,
    };
  }
}
