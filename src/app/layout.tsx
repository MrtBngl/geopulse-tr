import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoPulse-TR · Türkiye Canlı Deprem Haritası",
  description:
    "Türkiye geneli sismik hareketliliği gerçek zamanlı izleyen karanlık temalı interaktif deprem haritası. (Demo — mock veri)",
  applicationName: "GeoPulse-TR",
  keywords: ["deprem", "Türkiye", "sismik", "harita", "AFAD", "Kandilli", "GeoPulse"],
};

export const viewport: Viewport = {
  themeColor: "#04060c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-dvh bg-[#04060c] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
