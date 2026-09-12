/**
 * Türkiye coğrafi verileri.
 *
 * Sınır verileri aynı origin'den (`/geo/*.json`) statik asset olarak servis edilir:
 * JS bundle'ı şişmez, yanıt gzip'lenir ve tarayıcı tarafından önbelleklenir.
 * Kaynak: geoBoundaries gbOpen TUR (ADM0 + ADM1), sadeleştirilmiş.
 *
 * - `PROVINCES_URL`: 81 ilin gerçek sınırları (22.900 nokta)
 * - `OUTLINE_URL`  : Resmî ülke sınırı — haritanın dış çerçevesi (6.500 nokta)
 * - `FAULT_LINES`  : Ana fay zonları (dekoratif, gömülü)
 */

import provinceJson from "./geo/turkey-provinces.json";
import outlineJson from "./geo/turkey-outline.json";
import borderJson from "./geo/turkey-border-lines.json";
import maskJson from "./geo/turkey-outside-mask.json";

/** 81 il sınırı — `feature.id` alanı PROVINCE_CENTERS ile eşleşir. */
export const PROVINCES_DATA = provinceJson as unknown as GeoJSON.FeatureCollection;

/** Ülke gövdesi (dolgu için polygon). */
export const OUTLINE_DATA = outlineJson as unknown as GeoJSON.FeatureCollection;

/** Ülke dış sınırı — line katmanına özel MultiLineString. */
export const BORDER_LINES_DATA = borderJson as unknown as GeoJSON.FeatureCollection;

/** Türkiye dışını karartan ters maske. */
export const OUTSIDE_MASK_DATA = maskJson as unknown as GeoJSON.FeatureCollection;

export const PROVINCES_URL = "/geo/turkey-provinces.json";
export const OUTLINE_URL = "/geo/turkey-outline.json";
export const BORDER_LINES_URL = "/geo/turkey-border-lines.json";
export const OUTSIDE_MASK_URL = "/geo/turkey-outside-mask.json";

/** Veri gelene kadar kullanılan boş koleksiyon. */
export const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};


const NORTH_ANATOLIAN_FAULT: [number, number][] = [
  [26.6, 40.6],
  [27.5, 40.72],
  [28.8, 40.72],
  [29.9, 40.72],
  [30.9, 40.75],
  [31.6, 40.8],
  [32.6, 40.75],
  [33.9, 41.0],
  [35.0, 40.85],
  [36.0, 40.75],
  [36.6, 40.65],
  [37.5, 40.3],
  [38.5, 39.9],
  [39.5, 39.75],
  [40.3, 39.6],
  [41.0, 39.3],
];

const EAST_ANATOLIAN_FAULT: [number, number][] = [
  [41.0, 39.3],
  [40.5, 38.95],
  [39.95, 38.7],
  [39.3, 38.45],
  [38.5, 38.05],
  [37.6, 37.78],
  [36.85, 37.38],
  [36.4, 36.9],
  [36.2, 36.4],
];

const WEST_ANATOLIAN_GRABENS: [number, number][][] = [
  [
    [26.8, 38.4],
    [28.2, 38.6],
    [29.5, 38.7],
  ],
  [
    [27.2, 37.85],
    [28.6, 37.9],
    [29.9, 37.85],
  ],
];

export const FAULT_LINES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Kuzey Anadolu Fay Zonu", code: "KAF" },
      geometry: { type: "LineString", coordinates: NORTH_ANATOLIAN_FAULT },
    },
    {
      type: "Feature",
      properties: { name: "Doğu Anadolu Fay Zonu", code: "DAF" },
      geometry: { type: "LineString", coordinates: EAST_ANATOLIAN_FAULT },
    },
    ...WEST_ANATOLIAN_GRABENS.map((coords, index) => ({
      type: "Feature" as const,
      properties: { name: "Batı Anadolu Graben Sistemi", code: `BAG-${index + 1}` },
      geometry: { type: "LineString" as const, coordinates: coords },
    })),
  ],
};

/** Türkiye merkezli varsayılan görünüm (Lat 39.0 / Lon 35.0). */
export const TURKEY_VIEW = {
  longitude: 35.0,
  latitude: 39.0,
  zoom: 5.35,
} as const;

/**
 * Ülke sınır kutusu — açılışta `fitBounds` ile kullanılır, böylece
 * Türkiye her ekran boyutunda tam olarak görünür.
 * (İl verisinden hesaplandı: 25.67,35.82 → 44.83,42.11)
 */
export const TURKEY_BOUNDS: [number, number, number, number] = [25.4, 35.6, 45.1, 42.4];

/** Kullanıcının Türkiye dışına kaymasını engelleyen pan sınırı. */
export const TURKEY_MAX_BOUNDS: [number, number, number, number] = [21, 32.5, 49, 45.5];
