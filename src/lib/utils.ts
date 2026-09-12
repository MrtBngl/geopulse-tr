import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını çakışmasız birleştirir (shadcn/ui standardı). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** [min, max] aralığında rastgele sayı. */
export function randomBetween(min: number, max: number, fractionDigits = 1) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(fractionDigits));
}

/** Diziden rastgele bir eleman seçer. */
export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
