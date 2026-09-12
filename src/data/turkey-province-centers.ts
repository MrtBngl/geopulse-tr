/**
 * Türkiye il merkezleri (alan-ağırlıklı centroid) — 81 il.
 * public/geo/turkey-provinces.json içindeki feature id degerleri ile birebir eslesir.
 * Etiket yerlesimi ve feature-state guncellemeleri icin kullanilir.
 */
export interface ProvinceCenter {
  /** GeoJSON feature id */
  id: number;
  name: string;
  lon: number;
  lat: number;
  /** Yüzölçümü (derece kare) — etiket boyut önceliği için */
  area: number;
}

export const PROVINCE_CENTERS: ProvinceCenter[] = [
  { id: 1, name: "Adana", lon: 35.5907, lat: 37.399, area: 1.3937 },
  { id: 2, name: "Adıyaman", lon: 38.2881, lat: 37.7952, area: 0.7608 },
  { id: 3, name: "Afyon", lon: 30.6481, lat: 38.6319, area: 1.4472 },
  { id: 4, name: "Ağrı", lon: 43.2561, lat: 39.5539, area: 1.1883 },
  { id: 5, name: "Aksaray", lon: 33.8411, lat: 38.4478, area: 0.8083 },
  { id: 6, name: "Amasya", lon: 35.712, lat: 40.7125, area: 0.6007 },
  { id: 7, name: "Ankara", lon: 32.5799, lat: 39.7985, area: 2.6969 },
  { id: 8, name: "Antalya", lon: 30.9201, lat: 36.8047, area: 2.055 },
  { id: 9, name: "Ardahan", lon: 42.8039, lat: 41.1206, area: 0.5296 },
  { id: 10, name: "Artvin", lon: 41.8193, lat: 41.1263, area: 0.7898 },
  { id: 11, name: "Aydın", lon: 28.0119, lat: 37.745, area: 0.8272 },
  { id: 12, name: "Balıkesir", lon: 27.8785, lat: 39.6731, area: 1.5299 },
  { id: 13, name: "Bartın", lon: 32.5235, lat: 41.5804, area: 0.2571 },
  { id: 14, name: "Batman", lon: 41.3784, lat: 37.9574, area: 0.468 },
  { id: 15, name: "Bayburt", lon: 40.1863, lat: 40.2573, area: 0.3808 },
  { id: 16, name: "Bilecik", lon: 30.1034, lat: 40.1097, area: 0.4391 },
  { id: 17, name: "Bingöl", lon: 40.6419, lat: 39.0392, area: 0.8596 },
  { id: 18, name: "Bitlis", lon: 42.3779, lat: 38.528, area: 0.8624 },
  { id: 19, name: "Bolu", lon: 31.6123, lat: 40.5957, area: 0.8732 },
  { id: 20, name: "Burdur", lon: 30.0858, lat: 37.4126, area: 0.7469 },
  { id: 21, name: "Bursa", lon: 29.041, lat: 40.1194, area: 1.1418 },
  { id: 22, name: "Çanakkale", lon: 26.8264, lat: 39.9743, area: 1.0361 },
  { id: 23, name: "Çankırı", lon: 33.4569, lat: 40.6817, area: 0.8119 },
  { id: 24, name: "Çorum", lon: 34.6748, lat: 40.566, area: 1.3326 },
  { id: 25, name: "Denizli", lon: 29.2719, lat: 37.7361, area: 1.2206 },
  { id: 26, name: "Diyarbakır", lon: 40.3415, lat: 38.0972, area: 1.5562 },
  { id: 27, name: "Düzce", lon: 31.2372, lat: 40.8738, area: 0.2788 },
  { id: 28, name: "Edirne", lon: 26.6106, lat: 41.2552, area: 0.6685 },
  { id: 29, name: "Elazığ", lon: 39.3895, lat: 38.6576, area: 0.9482 },
  { id: 30, name: "Erzincan", lon: 39.2919, lat: 39.6634, area: 1.2281 },
  { id: 31, name: "Erzurum", lon: 41.5477, lat: 40.0637, area: 2.6358 },
  { id: 32, name: "Eskişehir", lon: 31.071, lat: 39.6015, area: 1.4655 },
  { id: 33, name: "Gaziantep", lon: 37.3689, lat: 37.0855, area: 0.6889 },
  { id: 34, name: "Giresun", lon: 38.5678, lat: 40.5806, area: 0.7412 },
  { id: 35, name: "Gümüşhane", lon: 39.3866, lat: 40.3349, area: 0.7083 },
  { id: 36, name: "Hakkari", lon: 44.0683, lat: 37.4585, area: 0.719 },
  { id: 37, name: "Hatay", lon: 36.2526, lat: 36.4287, area: 0.557 },
  { id: 38, name: "Iğdır", lon: 43.9854, lat: 39.895, area: 0.3768 },
  { id: 39, name: "Isparta", lon: 30.9403, lat: 37.9293, area: 0.8891 },
  { id: 40, name: "İstanbul", lon: 28.496, lat: 41.211, area: 0.5869 },
  { id: 41, name: "İzmir", lon: 27.2957, lat: 38.4834, area: 1.236 },
  { id: 42, name: "Kahramanmaraş", lon: 36.9513, lat: 37.888, area: 1.4613 },
  { id: 43, name: "Karabük", lon: 32.6401, lat: 41.182, area: 0.4487 },
  { id: 44, name: "Karaman", lon: 33.2786, lat: 37.0904, area: 0.8647 },
  { id: 45, name: "Kars", lon: 43.0632, lat: 40.4533, area: 1.0912 },
  { id: 46, name: "Kastamonu", lon: 33.7051, lat: 41.4832, area: 1.4177 },
  { id: 47, name: "Kayseri", lon: 35.8336, lat: 38.6038, area: 1.7784 },
  { id: 48, name: "Kırıkkale", lon: 33.6996, lat: 39.8601, area: 0.5023 },
  { id: 49, name: "Kırklareli", lon: 27.4426, lat: 41.6757, area: 0.6893 },
  { id: 50, name: "Kırşehir", lon: 34.1177, lat: 39.3132, area: 0.6872 },
  { id: 51, name: "Kilis", lon: 37.1256, lat: 36.8, area: 0.1412 },
  { id: 52, name: "Kocaeli", lon: 29.8835, lat: 40.8516, area: 0.3661 },
  { id: 53, name: "Konya", lon: 32.5907, lat: 38.0403, area: 4.189 },
  { id: 54, name: "Kütahya", lon: 29.5772, lat: 39.2954, area: 1.2331 },
  { id: 55, name: "Malatya", lon: 38.1264, lat: 38.5167, area: 1.2705 },
  { id: 56, name: "Manisa", lon: 28.1274, lat: 38.7595, area: 1.3719 },
  { id: 57, name: "Mardin", lon: 40.8379, lat: 37.3377, area: 0.8761 },
  { id: 58, name: "Mersin", lon: 33.8306, lat: 36.6958, area: 1.6288 },
  { id: 59, name: "Muğla", lon: 28.4914, lat: 37.0071, area: 1.2712 },
  { id: 60, name: "Muş", lon: 41.8449, lat: 39.0017, area: 0.9158 },
  { id: 61, name: "Nevşehir", lon: 34.7172, lat: 38.7892, area: 0.5672 },
  { id: 62, name: "Niğde", lon: 34.6819, lat: 37.8996, area: 0.7466 },
  { id: 63, name: "Ordu", lon: 37.4929, lat: 40.7974, area: 0.6175 },
  { id: 64, name: "Osmaniye", lon: 36.2604, lat: 37.2841, area: 0.3399 },
  { id: 65, name: "Rize", lon: 40.8534, lat: 40.9262, area: 0.4105 },
  { id: 66, name: "Sakarya", lon: 30.5033, lat: 40.7438, area: 0.5143 },
  { id: 67, name: "Samsun", lon: 35.9897, lat: 41.2215, area: 1.0369 },
  { id: 68, name: "Siirt", lon: 42.1234, lat: 37.912, area: 0.5661 },
  { id: 69, name: "Sinop", lon: 34.8779, lat: 41.6283, area: 0.6092 },
  { id: 70, name: "Sivas", lon: 37.2864, lat: 39.565, area: 2.9974 },
  { id: 71, name: "Şanlıurfa", lon: 39.0997, lat: 37.2463, area: 1.9551 },
  { id: 72, name: "Şırnak", lon: 42.5201, lat: 37.4599, area: 0.7367 },
  { id: 73, name: "Tekirdağ", lon: 27.3887, lat: 41.0831, area: 0.6643 },
  { id: 74, name: "Tokat", lon: 36.5681, lat: 40.3696, area: 1.0651 },
  { id: 75, name: "Trabzon", lon: 39.8101, lat: 40.804, area: 0.4993 },
  { id: 76, name: "Tunceli", lon: 39.4813, lat: 39.1913, area: 0.7936 },
  { id: 77, name: "Uşak", lon: 29.3622, lat: 38.5754, area: 0.5762 },
  { id: 78, name: "Van", lon: 43.5881, lat: 38.4644, area: 2.1389 },
  { id: 79, name: "Yalova", lon: 29.1901, lat: 40.5948, area: 0.084 },
  { id: 80, name: "Yozgat", lon: 35.2322, lat: 39.6588, area: 1.4093 },
  { id: 81, name: "Zonguldak", lon: 31.8251, lat: 41.269, area: 0.3415 },
];

export const PROVINCE_ID_BY_NAME: Record<string, number> = Object.fromEntries(
  PROVINCE_CENTERS.map((p) => [p.name, p.id]),
);

/** Toplam il sayısı (81). */
export const PROVINCE_COUNT = PROVINCE_CENTERS.length;
