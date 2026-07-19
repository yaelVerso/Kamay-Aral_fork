import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Picks a smaller Tailwind text-size class as a label gets longer, so
 * multi-word phrases like "Congratulations" or "Good Afternoon" shrink to
 * fit their card instead of overflowing it. `sizes` is ordered largest to
 * smallest, e.g. ['text-6xl', 'text-4xl', 'text-2xl'].
 */
export function labelTextSize(label: string, sizes: readonly string[]): string {
  const len = label.length
  if (len > 14) return sizes[Math.min(2, sizes.length - 1)]
  if (len > 8) return sizes[Math.min(1, sizes.length - 1)]
  return sizes[0]
}
