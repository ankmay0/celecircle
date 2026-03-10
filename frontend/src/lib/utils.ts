import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const BACKEND_URL = 'https://celecircle.onrender.com'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0) || ''
  const l = lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || '?'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
