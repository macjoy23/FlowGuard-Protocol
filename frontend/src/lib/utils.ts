import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatUSDC(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fractional = amount % divisor;
  const fractionalStr = fractional.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fractionalStr}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

export function getPolygonscanUrl(hash: string, type: "tx" | "address" = "tx"): string {
  return `https://polygonscan.com/${type}/${hash}`;
}

export function getPolygonscanTokenUrl(address: string): string {
  return `https://polygonscan.com/token/${address}`;
}

export const ANIMATION_DURATION = {
  fast: 0.25,
  normal: 0.4,
  slow: 0.6,
} as const;

export const EASE_CURVE = [0.4, 0, 0.2, 1] as const;
