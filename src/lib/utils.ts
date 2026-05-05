import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeIsoDate(seconds: number | undefined | null): string | null {
  if (!seconds) return null;
  const date = new Date(seconds * 1000);
  return isNaN(date.getTime()) ? null : date.toISOString();
}
