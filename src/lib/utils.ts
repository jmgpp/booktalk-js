import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind CSS, merging them safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 