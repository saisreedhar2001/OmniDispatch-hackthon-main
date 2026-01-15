'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Shield, HeartPulse, Car, MapPin, AlertTriangle } from 'lucide-react'

interface Marker {
  id: string
  type: 'fire' | 'police' | 'medical' | 'incident' | 'caller'
  position: { x: number; y: number }
  label: string
  status: 'responding' | 'on-scene' | 'available' | 'critical'
}

const MOCK_MARKERS: Marker[] = [
  { id: '1', type: 'incident', position: { x: 50, y: 45 }, label: 'Active Incident', status: 'critical' },
  { id: '2', type: 'fire', position: { x: 35, y: 55 }, label: 'Engine 7', status: 'responding' },
  { id: '3', type: 'fire', position: { x: 40, y: 60 }, label: 'Ladder 3', status: 'responding' },
  { id: '4', type: 'police', position: { x: 60, y: 40 }, label: 'Unit 42', status: 'on-scene' },
  { id: '5', type: 'medical', position: { x: 25, y: 35 }, label: 'Medic 9', status: 'available' },
  { id: '6', type: 'caller', position: { x: 52, y: 46 }, label: 'Caller Location', status: 'critical' },
]

const getIcon = (type: Marker['type']) => {
  switch (type) {
    case 'fire': return Flame
    case 'police': return Shield
    case 'medical': return HeartPulse
    case 'incident': return AlertTriangle
    case 'caller': return MapPin
    default: return MapPin
  }
}

const getColor = (type: Marker['type'], status: Marker['status']) => {
  if (status === 'critical') return 'bg-red-500 border-red-400'
  switch (type) {
    case 'fire': return 'bg-orange-500 border-orange-400'
    case 'police': return 'bg-blue-500 border-blue-400'
    case 'medical': return 'bg-green-500 border-green-400'
    case 'incident': return 'bg-red-500 border-red-400'
    default: return 'bg-gray-500 border-gray-400'
  }
}

export function TacticalMap() {
  const [markers, setMarkers] = useState<Marker[]>(MOCK_MARKERS)
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null)

  // Animate responding units
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers(prev => prev.map(marker => {
        if (marker.status === 'responding') {
          const targetX = 50 // Move towards incident
          const targetY = 45
          const speed = 0.5
          return {
            ...marker,
            position: {
              x: marker.position.x + (targetX - marker.position.x) * speed * 0.1,
              y: marker.position.y + (targetY - marker.position.y) * speed * 0.1,
            }
          }
        }
        return marker
      }))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[500px] bg-slate-900 rounded-lg overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Map Content (Simplified city blocks) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Streets */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        <line x1="20" y1="0" x2="20" y2="100" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        <line x1="45" y1="0" x2="45" y2="100" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        <line x1="70" y1="0" x2="70" y2="100" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
        
        {/* Buildings */}
        <rect x="22" y="32" width="20" height="16" fill="rgba(71,85,105,0.4)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.3" />
        <rect x="47" y="32" width="20" height="16" fill="rgba(71,85,105,0.4)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.3" />
        <rect x="47" y="52" width="20" height="16" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.5)" strokeWidth="0.5" />
        <rect x="22" y="52" width="20" height="16" fill="rgba(71,85,105,0.4)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.3" />
        <rect x="72" y="32" width="15" height="16" fill="rgba(71,85,105,0.4)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.3" />
        <rect x="72" y="52" width="15" height="16" fill="rgba(71,85,105,0.4)" stroke="rgba(100,116,139,0.5)" strokeWidth="0.3" />
        
        {/* Incident radius */}
        <circle cx="50" cy="45" r="8" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth="0.3">
          <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Markers */}
      {markers.map((marker) => {
        const Icon = getIcon(marker.type)
        return (
          <motion.div
            key={marker.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${marker.position.x}%`,
              top: `${marker.position.y}%`,
            }}
            animate={{
              left: `${marker.position.x}%`,
              top: `${marker.position.y}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={() => setSelectedMarker(marker)}
          >
            <div className={`relative group`}>
              {/* Pulse effect for critical/responding */}
              {(marker.status === 'critical' || marker.status === 'responding') && (
                <div className={`absolute inset-0 rounded-full ${getColor(marker.type, marker.status)} animate-ping opacity-50`} />
              )}
              
              {/* Marker icon */}
              <div className={`relative w-8 h-8 rounded-full ${getColor(marker.type, marker.status)} border-2 flex items-center justify-center shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              
              {/* Label */}
              <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 rounded bg-black/80 text-xs text-white">
                  {marker.label}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-black/60 backdrop-blur-sm">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-white">Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-white">Fire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-white">Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white">Medical</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-medium animate-pulse">
          🔴 ACTIVE INCIDENT - 123 Main St
        </div>
        <div className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
          3 Units Responding • ETA 2:30
        </div>
      </div>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 p-4 rounded-lg bg-black/80 backdrop-blur-sm border border-border w-64"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">{selectedMarker.label}</span>
            <button 
              className="text-muted-foreground hover:text-white"
              onClick={() => setSelectedMarker(null)}
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Status: <span className="text-white capitalize">{selectedMarker.status}</span></p>
            <p>Type: <span className="text-white capitalize">{selectedMarker.type}</span></p>
            <p>Position: <span className="text-white">{selectedMarker.position.x.toFixed(1)}, {selectedMarker.position.y.toFixed(1)}</span></p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
