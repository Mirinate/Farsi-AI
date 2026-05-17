import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  return format(new Date(date), pattern)
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'h:mm a')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isExpiringSoon(expiryDate: string, daysThreshold = 30) {
  const expiry = new Date(expiryDate)
  const threshold = addDays(new Date(), daysThreshold)
  return isBefore(expiry, threshold) && isAfter(expiry, new Date())
}

export function isExpired(expiryDate: string) {
  return isBefore(new Date(expiryDate), new Date())
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
