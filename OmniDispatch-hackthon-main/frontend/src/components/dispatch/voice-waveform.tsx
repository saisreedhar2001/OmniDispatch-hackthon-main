'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface VoiceWaveformProps {
  isActive: boolean
  stressLevel: number
}

export function VoiceWaveform({ isActive, stressLevel }: VoiceWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(24).fill(4))

  useEffect(() => {
    if (!isActive) {
      setBars(Array(24).fill(4))
      return
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => {
        const baseHeight = 4 + (stressLevel / 100) * 30
        const variation = Math.random() * 20
        return Math.max(4, Math.min(50, baseHeight + variation - 10))
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, stressLevel])

  const getBarColor = (index: number) => {
    if (!isActive) return 'bg-muted'
    if (stressLevel > 70) return 'bg-gradient-to-t from-red-500 to-red-400'
    if (stressLevel > 40) return 'bg-gradient-to-t from-yellow-500 to-yellow-400'
    return 'bg-gradient-to-t from-green-500 to-green-400'
  }

  return (
    <div className="relative h-20 flex items-center justify-center gap-1 p-4 rounded-lg bg-secondary/30 overflow-hidden">
      {/* Glow effect */}
      {isActive && (
        <div 
          className={`absolute inset-0 opacity-20 blur-xl ${
            stressLevel > 70 ? 'bg-red-500' : stressLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
        />
      )}
      
      {/* Scanner line */}
      {isActive && (
        <div className="scanner-line opacity-50" />
      )}

      {/* Waveform bars */}
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className={`w-1.5 rounded-full ${getBarColor(index)}`}
          animate={{ height }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />
      ))}

      {/* Inactive overlay */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
          <span className="text-sm text-muted-foreground">No active call</span>
        </div>
      )}
    </div>
  )
}
