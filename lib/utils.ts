import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 100) return 'text-green-600'
  if (efficiency >= 90) return 'text-yellow-600'
  if (efficiency >= 80) return 'text-orange-600'
  return 'text-red-600'
}

export function getEfficiencyBgColor(efficiency: number): string {
  if (efficiency >= 100) return 'bg-green-100'
  if (efficiency >= 90) return 'bg-yellow-100'
  if (efficiency >= 80) return 'bg-orange-100'
  return 'bg-red-100'
}