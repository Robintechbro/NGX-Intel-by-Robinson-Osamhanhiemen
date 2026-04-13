import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePrice(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return 0;
  return parseFloat(val.replace(/[^\d.]/g, '')) || 0;
}

export function parsePercent(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return 0;
  return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
}
