/**
 * GeoPulse-TR — Haber Servisi
 *
 * Öncelik sırası:
 *   1. NewsAPI.org  (NEWSAPI_KEY env varsa)
 *   2. Google News RSS  (key gerektirmez)
 *   3. Statik güvenlik fallback nesnesi
 */

import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import type { NewsItemDto } from "@/types/api";

const TIMEOUT_MS = 5_000;
const MAX_ITEMS = 5;

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function minutesAgo(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.round(diff / 60_000));
}

function guessTag(title: string, source: string): NewsItemDto["tag"] {
  const t = (title + source).toLocaleLowerCase("tr-TR");
  if (t.includes("afad") || t.includes("kandilli") || t.includes("resmî") || t.includes("resmi")) return "Resmî";
  if (t.includes("aa") || t.includes("ihlas") || t.includes("dha") || t.includes("ajans")) return "Ajans";
  if (t.includes("twitter") || t.includes("sosyal") || t.includes("instagram")) return "Sosyal";
  return "Yerel";
}

let _counter = 0;
function uid(): string {
  return `news-${Date.now()}-${_counter++}`;
}

// ─── 1. NewsAPI ───────────────────────────────────────────────────────────────

interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface NewsApiResponse {
  status: string;
  articles: NewsApiArticle[];
  message?: string;
}

async function fetchFromNewsApi(location: string): Promise<NewsItemDto[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error("NEWSAPI_KEY tanımlı değil");

  const query = encodeURIComponent(`${location} deprem`);
  const url =
    `https://newsapi.org/v2/everything?` +
    `q=${query}&language=tr&sortBy=publishedAt&pageSize=${MAX_ITEMS}&apiKey=${key}`;

  const response = await axios.get<NewsApiResponse>(url, { timeout: TIMEOUT_MS });

  if (response.data.status !== "ok") {
    throw new Error(`NewsAPI hatası: ${response.data.message}`);
  }

  return response.data.articles.map((a) => ({
    id: uid(),
    source: a.source.name,
    title: a.title,
    summary: a.description ?? "İçerik özeti mevcut değil.",
    url: a.url,
    publishedAt: a.publishedAt,
    minutesAgo: minutesAgo(a.publishedAt),
    tag: guessTag(a.title, a.source.name),
  }));
}

// ─── 2. Google News RSS ───────────────────────────────────────────────────────

async function fetchFromGoogleRss(location: string): Promise<NewsItemDto[]> {
  const query = encodeURIComponent(`${location} deprem`);
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;

  const response = await axios.get<string>(rssUrl, {
    timeout: TIMEOUT_MS,
    responseType: "text",
    headers: { "User-Agent": "GeoPulse-TR/1.0" },
  });

  const $ = cheerio.load(response.data, { xmlMode: true });
  const items: NewsItemDto[] = [];

  $("item").each((_, el) => {
    if (items.length >= MAX_ITEMS) return;

    const title = $(el).find("title").first().text().replace(/ - [^-]+$/, "").trim();
    const link = $(el).find("link").text().trim() || $(el).find("guid").text().trim();
    const pubDate = $(el).find("pubDate").text().trim();
    const sourceName = $(el).find("source").text().trim() || "Google Haberler";
    const description = $(el).find("description").text().trim();

    if (!title) return;

    items.push({
      id: uid(),
      source: sourceName,
      title,
      summary: description ? cheerio.load(description)("body").text().slice(0, 180) + "…" : title,
      url: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      minutesAgo: pubDate ? minutesAgo(pubDate) : 0,
      tag: guessTag(title, sourceName),
    });
  });

  if (items.length === 0) throw new Error("RSS akışında haber bulunamadı");
  return items;
}

// ─── 3. Statik Fallback ────────────────────────────────────────────────────────

function buildFallback(location: string): NewsItemDto[] {
  return [
    {
      id: uid(),
      source: "AFAD",
      title: `${location} bölgesindeki deprem sonrası AFAD uyarısı`,
      summary:
        "Artçı sarsıntılara karşı dikkatli olun. Hasarlı binalara girmeyin, yetkililerin talimatlarını takip edin.",
      url: "https://www.afad.gov.tr",
      publishedAt: new Date().toISOString(),
      minutesAgo: 0,
      tag: "Resmî",
    },
    {
      id: uid(),
      source: "Kandilli Rasathanesi",
      title: "Deprem sonrası güvenlik önerileri",
      summary:
        "Sarsıntı anında çök–kapan–tutun. Sarsıntı durduğunda bina dışına çıkın, asansör kullanmayın.",
      url: "http://www.koeri.boun.edu.tr",
      publishedAt: new Date().toISOString(),
      minutesAgo: 0,
      tag: "Resmî",
    },
  ];
}

// ─── Ana Fonksiyon ─────────────────────────────────────────────────────────────

/**
 * Verilen şehir için haber makalelerini çeker.
 * NewsAPI → Google RSS → statik fallback öncelik sırasıyla dener.
 */
export async function fetchNews(location: string): Promise<{
  items: NewsItemDto[];
  source: "newsapi" | "rss" | "fallback";
  error?: string;
}> {
  // 1. NewsAPI
  try {
    const items = await fetchFromNewsApi(location);
    return { items, source: "newsapi" };
  } catch (err) {
    const reason = err instanceof AxiosError ? err.message : String(err);
    console.warn("[news.service] NewsAPI başarısız:", reason);
  }

  // 2. Google RSS
  try {
    const items = await fetchFromGoogleRss(location);
    return { items, source: "rss" };
  } catch (err) {
    const reason = err instanceof AxiosError ? err.message : String(err);
    console.warn("[news.service] RSS başarısız:", reason);
  }

  // 3. Fallback
  console.warn("[news.service] Tüm kaynaklar başarısız — statik fallback kullanılıyor.");
  return {
    items: buildFallback(location),
    source: "fallback",
    error: "Haber kaynağına ulaşılamadı, genel güvenlik bilgileri gösteriliyor.",
  };
}
