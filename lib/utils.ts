import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatMinutes(seconds: number): string {
  return `${(seconds / 60).toFixed(1)} min`
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

export const PLANS = {
  free: { name: 'Free', price: 0, minutesPerMonth: 3, label: '$0/mo' },
  creator: { name: 'Creator', price: 29, minutesPerMonth: 60, label: '$29/mo' },
  pro: { name: 'Pro', price: 79, minutesPerMonth: 300, label: '$79/mo' },
} as const
