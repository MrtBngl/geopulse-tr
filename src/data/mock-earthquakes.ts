import type { Earthquake, NewsItem, QuakeProvider } from "@/types/earthquake";
import { getTier } from "@/lib/quake";
import { pickRandom, randomBetween } from "@/lib/utils";

interface QuakeSeed {
  city: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  minutesAgo: number;
  provider: QuakeProvider;
  feltReports: number;
}

/**
 * Gerçek Türkiye lokasyonlarına dayalı, tamamen sahte (mock) deprem kayıtları.
 * Backend bağlanana kadar tüm arayüz bu veriyle beslenir.
 */
const SEEDS: QuakeSeed[] = [
  { city: "Malatya", district: "Pütürge", region: "Doğu Anadolu", latitude: 38.19, longitude: 38.87, magnitude: 5.4, depth: 7.2, minutesAgo: 12, provider: "AFAD", feltReports: 2843 },
  { city: "Hatay", district: "Defne", region: "Akdeniz", latitude: 36.18, longitude: 36.16, magnitude: 4.3, depth: 11.4, minutesAgo: 27, provider: "Kandilli", feltReports: 912 },
  { city: "İzmir", district: "Seferihisar", region: "Ege", latitude: 38.2, longitude: 26.84, magnitude: 3.6, depth: 14.8, minutesAgo: 41, provider: "AFAD", feltReports: 318 },
  { city: "Kahramanmaraş", district: "Elbistan", region: "Akdeniz", latitude: 38.2, longitude: 37.19, magnitude: 4.8, depth: 9.1, minutesAgo: 58, provider: "AFAD", feltReports: 1477 },
  { city: "Van", district: "Erciş", region: "Doğu Anadolu", latitude: 39.02, longitude: 43.36, magnitude: 2.8, depth: 6.4, minutesAgo: 73, provider: "Kandilli", feltReports: 41 },
  { city: "Muğla", district: "Datça", region: "Ege", latitude: 36.72, longitude: 27.69, magnitude: 3.9, depth: 21.6, minutesAgo: 96, provider: "AFAD", feltReports: 205 },
  { city: "Bingöl", district: "Karlıova", region: "Doğu Anadolu", latitude: 39.29, longitude: 41.01, magnitude: 3.2, depth: 5.9, minutesAgo: 118, provider: "AFAD", feltReports: 87 },
  { city: "Elazığ", district: "Sivrice", region: "Doğu Anadolu", latitude: 38.45, longitude: 39.31, magnitude: 4.1, depth: 8.3, minutesAgo: 134, provider: "Kandilli", feltReports: 623 },
  { city: "Çanakkale", district: "Ayvacık", region: "Marmara", latitude: 39.6, longitude: 26.4, magnitude: 2.4, depth: 12.1, minutesAgo: 152, provider: "AFAD", feltReports: 19 },
  { city: "Düzce", district: "Merkez", region: "Karadeniz", latitude: 40.84, longitude: 31.16, magnitude: 3.4, depth: 7.7, minutesAgo: 171, provider: "AFAD", feltReports: 264 },
  { city: "Adana", district: "Ceyhan", region: "Akdeniz", latitude: 37.03, longitude: 35.82, magnitude: 2.9, depth: 16.2, minutesAgo: 188, provider: "Kandilli", feltReports: 56 },
  { city: "Kütahya", district: "Simav", region: "Ege", latitude: 39.09, longitude: 28.98, magnitude: 3.1, depth: 9.5, minutesAgo: 206, provider: "AFAD", feltReports: 73 },
  { city: "Erzincan", district: "Merkez", region: "Doğu Anadolu", latitude: 39.75, longitude: 39.49, magnitude: 5.1, depth: 10.8, minutesAgo: 233, provider: "AFAD", feltReports: 1980 },
  { city: "Balıkesir", district: "Sındırgı", region: "Marmara", latitude: 39.24, longitude: 28.17, magnitude: 3.7, depth: 6.1, minutesAgo: 259, provider: "Kandilli", feltReports: 341 },
  { city: "Antalya", district: "Kaş", region: "Akdeniz", latitude: 36.2, longitude: 29.64, magnitude: 4.5, depth: 42.3, minutesAgo: 287, provider: "USGS", feltReports: 402 },
  { city: "Tokat", district: "Erbaa", region: "Karadeniz", latitude: 40.67, longitude: 36.57, magnitude: 2.6, depth: 8.8, minutesAgo: 312, provider: "AFAD", feltReports: 23 },
  { city: "Bolu", district: "Gerede", region: "Karadeniz", latitude: 40.8, longitude: 32.2, magnitude: 3.3, depth: 11.9, minutesAgo: 344, provider: "AFAD", feltReports: 128 },
  { city: "Denizli", district: "Acıpayam", region: "Ege", latitude: 37.42, longitude: 29.35, magnitude: 2.2, depth: 5.4, minutesAgo: 371, provider: "Kandilli", feltReports: 11 },
  { city: "Ağrı", district: "Doğubayazıt", region: "Doğu Anadolu", latitude: 39.55, longitude: 44.08, magnitude: 3.8, depth: 13.6, minutesAgo: 402, provider: "AFAD", feltReports: 96 },
  { city: "Osmaniye", district: "Düziçi", region: "Akdeniz", latitude: 37.25, longitude: 36.45, magnitude: 4.0, depth: 7.5, minutesAgo: 438, provider: "AFAD", feltReports: 517 },
  { city: "Manisa", district: "Akhisar", region: "Ege", latitude: 38.92, longitude: 27.84, magnitude: 2.7, depth: 10.2, minutesAgo: 469, provider: "Kandilli", feltReports: 34 },
  { city: "Bitlis", district: "Ahlat", region: "Doğu Anadolu", latitude: 38.75, longitude: 42.49, magnitude: 3.5, depth: 15.1, minutesAgo: 511, provider: "AFAD", feltReports: 62 },
  { city: "Yalova", district: "Çınarcık", region: "Marmara", latitude: 40.64, longitude: 29.12, magnitude: 2.5, depth: 8.9, minutesAgo: 552, provider: "Kandilli", feltReports: 47 },
  { city: "Sivas", district: "Gürün", region: "İç Anadolu", latitude: 38.72, longitude: 37.27, magnitude: 3.0, depth: 12.7, minutesAgo: 598, provider: "AFAD", feltReports: 39 },
  { city: "Aydın", district: "Söke", region: "Ege", latitude: 37.75, longitude: 27.41, magnitude: 4.2, depth: 6.8, minutesAgo: 641, provider: "AFAD", feltReports: 688 },
  { city: "Kayseri", district: "Develi", region: "İç Anadolu", latitude: 38.39, longitude: 35.49, magnitude: 2.3, depth: 9.3, minutesAgo: 687, provider: "Kandilli", feltReports: 8 },
  { city: "Şırnak", district: "Cizre", region: "Güneydoğu Anadolu", latitude: 37.33, longitude: 42.19, magnitude: 3.6, depth: 18.4, minutesAgo: 742, provider: "USGS", feltReports: 71 },
  { city: "Burdur", district: "Bucak", region: "Akdeniz", latitude: 37.46, longitude: 30.59, magnitude: 2.9, depth: 7.1, minutesAgo: 806, provider: "AFAD", feltReports: 26 },
  { city: "Tekirdağ", district: "Marmara Ereğlisi", region: "Marmara", latitude: 40.97, longitude: 27.95, magnitude: 3.2, depth: 11.2, minutesAgo: 878, provider: "Kandilli", feltReports: 154 },
  { city: "Konya", district: "Ereğli", region: "İç Anadolu", latitude: 37.51, longitude: 34.05, magnitude: 2.1, depth: 4.9, minutesAgo: 946, provider: "AFAD", feltReports: 6 },
  { city: "Muş", district: "Varto", region: "Doğu Anadolu", latitude: 39.17, longitude: 41.45, magnitude: 4.6, depth: 8.6, minutesAgo: 1024, provider: "AFAD", feltReports: 733 },
  { city: "Gaziantep", district: "Nurdağı", region: "Güneydoğu Anadolu", latitude: 37.18, longitude: 36.73, magnitude: 3.4, depth: 10.5, minutesAgo: 1102, provider: "Kandilli", feltReports: 212 },
];

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter.toString().padStart(4, "0")}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Uygulama açılışında kullanılan mock liste (client tarafında üretilir). */
export function buildInitialQuakes(now: number = Date.now()): Earthquake[] {
  return SEEDS.map((seed) => ({
    id: nextId("tr"),
    city: seed.city,
    district: seed.district,
    region: seed.region,
    latitude: seed.latitude,
    longitude: seed.longitude,
    magnitude: seed.magnitude,
    depth: seed.depth,
    timestamp: now - seed.minutesAgo * 60_000,
    provider: seed.provider,
    feltReports: seed.feltReports,
  })).sort((a, b) => b.timestamp - a.timestamp);
}

/** Canlı veri akışı simülasyonu: rastgele yeni bir sarsıntı üretir. */
export function generateLiveQuake(now: number = Date.now()): Earthquake {
  const seed = pickRandom(SEEDS);
  const magnitude = Number(
    Math.max(1.6, Math.min(6.4, seed.magnitude + randomBetween(-1.4, 1.1, 1))).toFixed(1),
  );
  const tier = getTier(magnitude);

  return {
    id: nextId("live"),
    city: seed.city,
    district: seed.district,
    region: seed.region,
    latitude: Number((seed.latitude + randomBetween(-0.25, 0.25, 3)).toFixed(4)),
    longitude: Number((seed.longitude + randomBetween(-0.25, 0.25, 3)).toFixed(4)),
    magnitude,
    depth: randomBetween(3.2, 32, 1),
    timestamp: now,
    provider: pickRandom<QuakeProvider>(["AFAD", "Kandilli", "USGS"]),
    feltReports:
      tier === "low"
        ? Math.round(randomBetween(0, 60, 0))
        : tier === "mid"
          ? Math.round(randomBetween(60, 900, 0))
          : Math.round(randomBetween(900, 4200, 0)),
    isLive: true,
  };
}

/** Detay panelindeki "Son Dakika" sekmesi için sahte haber akışı. */
export function buildMockNews(quake: Earthquake): NewsItem[] {
  const place = `${quake.city} - ${quake.district}`;
  const mag = quake.magnitude.toFixed(1);

  const base: NewsItem[] = [
    {
      id: `${quake.id}-n1`,
      source: "AFAD Basın Merkezi",
      title: `${place} merkezli ${mag} büyüklüğünde deprem`,
      summary: `AFAD, saat verilerine göre ${place} merkez üslü ${mag} büyüklüğünde bir sarsıntı kaydedildiğini duyurdu. Saha ekipleri bölgeye yönlendirildi.`,
      minutesAgo: 2,
      tag: "Resmî",
    },
    {
      id: `${quake.id}-n2`,
      source: "Ulusal Haber Ajansı",
      title: `Vali: "İlk incelemelerde olumsuz bir durum yok"`,
      summary: `${quake.city} Valiliği, deprem sonrası yapılan ilk saha taramalarında can kaybı veya ağır hasar ihbarı bulunmadığını açıkladı.`,
      minutesAgo: 6,
      tag: "Ajans",
    },
    {
      id: `${quake.id}-n3`,
      source: `${quake.city} Yerel Gazete`,
      title: `Vatandaşlar sokağa çıktı, park alanlarında toplanma sürüyor`,
      summary: `Sarsıntının ardından ${quake.district} ilçesinde vatandaşlar binaları tahliye etti. Belediye ekipleri toplanma alanlarında ısınma noktaları kurdu.`,
      minutesAgo: 11,
      tag: "Yerel",
    },
    {
      id: `${quake.id}-n4`,
      source: "Kandilli Rasathanesi",
      title: `Artçı sarsıntılar sürüyor: ${quake.magnitude >= 4 ? "23" : "7"} artçı kaydedildi`,
      summary: `Boğaziçi Üniversitesi Kandilli Rasathanesi, ana şoku takiben bölgede artçı hareketliliğin devam ettiğini bildirdi.`,
      minutesAgo: 18,
      tag: "Ajans",
    },
    {
      id: `${quake.id}-n5`,
      source: "Sosyal Medya Analizi",
      title: `"Hissettim" bildirimleri ${quake.feltReports.toLocaleString("tr-TR")} kişiye ulaştı`,
      summary: `Sarsıntı sonrası açık kaynak bildirim platformlarında ${quake.feltReports.toLocaleString("tr-TR")} kullanıcı depremi hissettiğini raporladı.`,
      minutesAgo: 24,
      tag: "Sosyal",
    },
  ];

  return quake.magnitude >= 4 ? base : base.slice(0, 3);
}
