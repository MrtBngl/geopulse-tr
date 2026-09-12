/**
 * GeoPulse-TR — Bölgesel Haber Akışı
 *
 * GET /api/news?location={city} üzerinden gerçek haber verisi çeker.
 * Tüm kaynaklar başarısızsa AFAD/Kandilli güvenlik fallback gösterir.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Earthquake } from "@/types/earthquake";
import type { NewsItemDto } from "@/types/api";

const TAG_STYLES: Record<NewsItemDto["tag"], string> = {
  Resmî: "bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
  Ajans: "bg-blue-500/12 text-blue-300 ring-1 ring-inset ring-blue-400/25",
  Yerel: "bg-violet-500/12 text-violet-300 ring-1 ring-inset ring-violet-400/25",
  Sosyal: "bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/25",
};

function NewsSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <li
          key={index}
          className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
          <Skeleton className="mt-3 h-3.5 w-11/12" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
        </li>
      ))}
    </ul>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
      <p className="text-[12px] text-red-400">{message}</p>
      <Button variant="ghost" size="xs" className="mt-3" onClick={onRetry}>
        <RefreshCw className="h-3 w-3" />
        Tekrar Dene
      </Button>
    </div>
  );
}

/** Bölgesel haber akışı — GET /api/news?location={city} */
export function NewsFeed({ quake }: { quake: Earthquake }) {
  const [items, setItems] = React.useState<NewsItemDto[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isWarning, setIsWarning] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    setIsWarning(false);

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/news?location=${encodeURIComponent(quake.city)}`,
          { cache: "no-store" },
        );

        const json = await res.json() as {
          success: boolean;
          data: NewsItemDto[];
          warning?: string;
          message?: string;
        };

        if (cancelled) return;

        if (!json.success) {
          setError(json.message ?? "Haber verisi alınamadı.");
          setItems([]);
          return;
        }

        if (json.warning) setIsWarning(true);
        setItems(json.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Bağlantı hatası");
        setItems([]);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [quake.city, reloadToken]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Newspaper className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Bölgesel Haber Akışı
        </p>
        <Button
          variant="ghost"
          size="xs"
          className="ml-auto"
          onClick={() => setReloadToken((token) => token + 1)}
          disabled={items === null}
        >
          <RefreshCw className={cn("h-3 w-3", items === null && "animate-spin")} />
          Yenile
        </Button>
      </div>

      {/* Fallback uyarısı */}
      {isWarning && items && items.length > 0 && (
        <p className="text-[10px] text-amber-400/80">
          ⚠ Haber kaynağına ulaşılamadı — genel güvenlik bilgileri gösteriliyor.
        </p>
      )}

      {items === null ? (
        <NewsSkeleton />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => setReloadToken((t) => t + 1)} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-400/20">
            <Newspaper className="h-5 w-5" />
          </div>
          <h4 className="mt-2 text-[13px] font-semibold text-slate-200">
            Henüz Basın Haberi Yayınlanmamış
          </h4>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
            Son dakikalarda gerçekleşen (son 15-30 dk) veya düşük büyüklükteki (M &lt; 3.5) sarsıntılar için henüz resmî ajans haberi oluşmamış olabilir. AFAD sismik verileri anlıktır.
          </p>
          <div className="mt-3 flex justify-center">
            <a
              href={`https://news.google.com/search?q=${encodeURIComponent(`${quake.city} ${quake.district ?? ""} deprem`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-500/20 hover:text-cyan-200"
            >
              Google Haberler&apos;de Canlı Ara <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.32 }}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 transition hover:border-cyan-400/25 hover:bg-cyan-500/[0.04]"
            >
              <div className="flex items-center gap-2">
                <Badge className={TAG_STYLES[item.tag]}>{item.tag}</Badge>
                <span className="truncate text-[11px] text-slate-400">{item.source}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-600">
                  {item.minutesAgo} dk
                </span>
              </div>
              <h4 className="mt-2 text-[12.5px] font-semibold leading-snug text-slate-100">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
                {item.summary}
              </p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-slate-600 transition group-hover:text-cyan-300"
                >
                  Kaynağa git <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
