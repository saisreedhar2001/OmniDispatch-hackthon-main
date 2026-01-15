import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

export function getEmergencyLevel(type: string): 'critical' | 'high' | 'medium' | 'low' {
  const critical = ['fire', 'shooting', 'explosion', 'collapse']
  const high = ['accident', 'assault', 'medical', 'hazmat']
  const medium = ['burglary', 'domestic', 'traffic']
  
  if (critical.some(t => type.toLowerCase().includes(t))) return 'critical'
  if (high.some(t => type.toLowerCase().includes(t))) return 'high'
  if (medium.some(t => type.toLowerCase().includes(t))) return 'medium'
  return 'low'
}

export function getEmergencyColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-500'
    case 'high': return 'text-orange-500'
    case 'medium': return 'text-yellow-500'
    case 'low': return 'text-green-500'
    default: return 'text-blue-500'
  }
}
