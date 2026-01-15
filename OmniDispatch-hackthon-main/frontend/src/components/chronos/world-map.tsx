'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RiskZone {
  name: string
  lat: number
  lng: number
  risk_score: number
  primary_risk: string
  incidents_24h: number
  country?: string
  flag?: string
}

interface WorldMapProps {
  userLocation: { lat: number; lng: number } | null
  riskZones: RiskZone[]
  onZoneSelect: (zone: RiskZone) => void
  onMapClick: (lat: number, lng: number) => void
  isLoading: boolean
  zoomToLocation: boolean
  clickedLocation: { lat: number; lng: number } | null
}

export default function ChronosWorldMap({
  userLocation,
  riskZones,
  onZoneSelect,
  onMapClick,
  isLoading,
  zoomToLocation,
  clickedLocation
}: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const clickMarkerRef = useRef<L.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Create map centered on world view
    const map = L.map(mapContainer.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    })

    // Add dark-themed tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Create marker layer group
    markersRef.current = L.layerGroup().addTo(map)

    // Add click handler for map
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle zoom to user location
  useEffect(() => {
    if (!mapRef.current || !userLocation || !zoomToLocation || !mapReady) return

    // Animate zoom to user location
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 6, {
      duration: 2.5,
      easeLinearity: 0.25
    })

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="relative">
          <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-50"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup('<b>📍 Your Location</b>')
  }, [userLocation, zoomToLocation, mapReady])

  // Handle clicked location marker
  useEffect(() => {
    if (!mapRef.current || !clickedLocation || !mapReady) return

    // Remove existing click marker
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove()
    }

    // Add new click marker
    const clickIcon = L.divIcon({
      className: 'clicked-location-marker',
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="absolute inset-0 w-8 h-8 bg-orange-400 rounded-full animate-ping opacity-50"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    clickMarkerRef.current = L.marker([clickedLocation.lat, clickedLocation.lng], { icon: clickIcon })
      .addTo(mapRef.current)
      .bindPopup('<b>📍 Analyzing this location...</b>')

    // Fly to clicked location
    mapRef.current.flyTo([clickedLocation.lat, clickedLocation.lng], 6, { duration: 1.5 })
  }, [clickedLocation, mapReady])

  // Add risk zone markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !mapReady) return

    // Clear existing markers
    markersRef.current.clearLayers()

    riskZones.forEach((zone) => {
      const getRiskColor = (score: number) => {
        if (score >= 85) return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }
        if (score >= 70) return { color: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' }
        if (score >= 50) return { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)' }
        return { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' }
      }

      const { color, glow } = getRiskColor(zone.risk_score)
      const size = Math.max(20, Math.min(40, zone.risk_score / 2.5))

      const riskIcon = L.divIcon({
        className: 'risk-zone-marker',
        html: `
          <div class="relative cursor-pointer group" style="width: ${size}px; height: ${size}px;">
            <div class="absolute inset-0 rounded-full animate-pulse" 
                 style="background: ${glow}; filter: blur(8px);"></div>
            <div class="absolute inset-0 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs"
                 style="background: ${color}; border-color: ${color};">
              ${zone.risk_score}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([zone.lat, zone.lng], { icon: riskIcon })
        .addTo(markersRef.current!)

      marker.on('click', () => {
        onZoneSelect(zone)
        mapRef.current?.flyTo([zone.lat, zone.lng], 8, { duration: 1 })
      })

      // Add popup with zone info
      marker.bindPopup(`
        <div class="p-2 min-w-[200px]">
          <div class="font-bold text-white mb-1">${zone.flag || '📍'} ${zone.name}</div>
          <div class="text-sm text-gray-300 mb-2">${zone.country || ''}</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-gray-400">Risk Score:</span>
              <span class="font-bold" style="color: ${color}">${zone.risk_score}/100</span>
            </div>
            <div>
              <span class="text-gray-400">24h Incidents:</span>
              <span class="font-bold text-white">${zone.incidents_24h}</span>
            </div>
          </div>
          <div class="mt-2 text-xs">
            <span class="text-gray-400">Primary Risk:</span>
            <span class="text-yellow-400 font-medium">${zone.primary_risk}</span>
          </div>
        </div>
      `, {
        className: 'chronos-popup',
        closeButton: false,
      })
    })
  }, [riskZones, onZoneSelect, mapReady])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-orange-500/30">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-orange-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-amber-500/30"></div>
                <div className="absolute inset-2 rounded-full border-4 border-t-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-orange-400 font-medium animate-pulse">Analyzing Risk Patterns...</p>
              <p className="text-sm text-gray-400 mt-1">Powered by CrewAI + Cerebras</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-black/80 backdrop-blur-sm border border-gray-700 z-40">
        <p className="text-xs font-semibold text-white mb-2">Risk Level</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="text-xs text-white">Critical (85+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span className="text-xs text-white">High (70-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            <span className="text-xs text-white">Medium (50-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
            <span className="text-xs text-white">Low (&lt;50)</span>
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      {userLocation && (
        <div className="absolute top-4 left-4 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm border border-orange-500/30 z-40">
          <p className="text-xs text-orange-400">📍 Your Location</p>
          <p className="text-sm font-mono text-white">
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* Click instruction */}
      <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm border border-orange-500/30 z-40">
        <p className="text-xs text-orange-400">🖱️ Click anywhere to analyze</p>
      </div>

      {/* Custom CSS for Leaflet popups */}
      <style jsx global>{`
        .chronos-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.2);
        }
        .chronos-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(249, 115, 22, 0.3);
        }
        .leaflet-container {
          background: #0f172a;
        }
      `}</style>
    </div>
  )
}
