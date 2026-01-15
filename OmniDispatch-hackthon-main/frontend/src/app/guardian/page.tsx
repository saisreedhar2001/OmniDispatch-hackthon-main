'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Shield, 
  ArrowLeft, 
  Search, 
  FileText, 
  Building, 
  AlertCircle, 
  BookOpen,
  Download,
  Eye,
  MapPin,
  Navigation,
  X,
  Loader2,
  ExternalLink,
  Info,
  Building2,
  CheckCircle2,
  Phone,
  Users,
  Calendar,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Dynamically import 3D component to avoid SSR issues
const Building3DViewer = dynamic(
  () => import('@/components/guardian/building-3d-viewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }
)

interface Building {
  id: string
  name: string
  address: string
  type: string
  icon: string
  lat: number
  lng: number
  distance_km: number
  rating: number
  has_blueprint: boolean
  floors: number
}

interface BuildingDetails {
  id: string
  floors: number
  type: string
  occupancy: number
  last_inspection: string
  fire_system: string
  ada_compliant: boolean
  floor_plans: FloorPlan[]
  escape_routes: EscapeRoute[]
  safety_protocols: SafetyProtocol[]
  emergency_contacts: EmergencyContact[]
  hazardous_materials: string[]
}

interface FloorPlan {
  floor: number
  name: string
  rooms: Room[]
  exits: Exit[]
  fire_equipment: FireEquipment[]
}

interface Room {
  id: string
  name: string
  type: string
  capacity: number
  has_window: boolean
}

interface Exit {
  id: string
  name: string
  type: string
  location: string
  width: string
  illuminated: boolean
}

interface FireEquipment {
  type: string
  location: string
  class?: string
  length?: string
  last_inspected: string
}

interface EscapeRoute {
  id: string
  name: string
  description: string
  estimated_time: string
  difficulty: string
  waypoints: string[]
}

interface SafetyProtocol {
  id: string
  title: string
  category: string
  priority: string
  steps: string[]
  version: string
  updated: string
}

interface EmergencyContact {
  role: string
  phone: string
}

export default function GuardianPage() {
  const [locationInput, setLocationInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{name: string, lat: number, lng: number} | null>(null)
  const [nearbyBuildings, setNearbyBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [buildingDetails, setBuildingDetails] = useState<BuildingDetails | null>(null)
  const [showBuildingModal, setShowBuildingModal] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [viewMode, setViewMode] = useState<'3d' | 'blueprints' | 'protocols'>('3d')

  // Search for location and nearby buildings
  const searchLocation = async () => {
    if (!locationInput.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/guardian/search-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationInput })
      })
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        setCurrentLocation(data.location)
        setNearbyBuildings(data.nearby_buildings)
      } else {
        // Show error but also generate demo data locally
        console.error('Backend error:', data.error)
        generateDemoData(locationInput)
      }
    } catch (error) {
      console.error('Error searching location:', error)
      // Network error - generate demo data locally
      generateDemoData(locationInput)
    } finally {
      setLoading(false)
    }
  }

  // Generate demo data locally when API fails
  const generateDemoData = (searchLocation: string) => {
    const demoBuildings: Building[] = [
      { id: 'demo_1', name: 'City Hospital', address: `Near ${searchLocation}`, type: 'Medical Facility', icon: '🏥', lat: 17.385, lng: 78.486, distance_km: 0.5, rating: 4.5, has_blueprint: true, floors: 8 },
      { id: 'demo_2', name: 'Apollo Emergency', address: `Near ${searchLocation}`, type: 'Medical Facility', icon: '🏥', lat: 17.390, lng: 78.490, distance_km: 0.8, rating: 4.7, has_blueprint: true, floors: 12 },
      { id: 'demo_3', name: 'Central Fire Station', address: `Near ${searchLocation}`, type: 'Fire Station', icon: '🚒', lat: 17.380, lng: 78.480, distance_km: 1.2, rating: 4.8, has_blueprint: true, floors: 3 },
      { id: 'demo_4', name: 'Main Police Station', address: `Near ${searchLocation}`, type: 'Police Station', icon: '👮', lat: 17.375, lng: 78.475, distance_km: 1.5, rating: 4.3, has_blueprint: false, floors: 4 },
      { id: 'demo_5', name: 'City Mall', address: `Near ${searchLocation}`, type: 'Shopping Mall', icon: '🏬', lat: 17.395, lng: 78.495, distance_km: 1.8, rating: 4.4, has_blueprint: true, floors: 6 },
      { id: 'demo_6', name: 'International School', address: `Near ${searchLocation}`, type: 'School', icon: '🏫', lat: 17.370, lng: 78.470, distance_km: 2.1, rating: 4.6, has_blueprint: true, floors: 4 },
      { id: 'demo_7', name: 'KIMS Hospital', address: `Near ${searchLocation}`, type: 'Medical Facility', icon: '🏥', lat: 17.400, lng: 78.500, distance_km: 2.3, rating: 4.8, has_blueprint: true, floors: 10 },
      { id: 'demo_8', name: 'Metro Station', address: `Near ${searchLocation}`, type: 'Transit Hub', icon: '🚉', lat: 17.365, lng: 78.465, distance_km: 2.5, rating: 4.2, has_blueprint: true, floors: 2 },
      { id: 'demo_9', name: 'Sports Stadium', address: `Near ${searchLocation}`, type: 'Stadium', icon: '🏟️', lat: 17.360, lng: 78.460, distance_km: 3.0, rating: 4.5, has_blueprint: true, floors: 4 },
      { id: 'demo_10', name: 'Regional Airport', address: `Near ${searchLocation}`, type: 'Airport', icon: '✈️', lat: 17.355, lng: 78.455, distance_km: 4.5, rating: 4.1, has_blueprint: true, floors: 3 },
    ]
    
    setCurrentLocation({ name: searchLocation, lat: 17.385, lng: 78.486 })
    setNearbyBuildings(demoBuildings)
  }

  // Use current geolocation
  const useMyLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            const response = await fetch('http://localhost:8000/api/guardian/search-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                location: 'Current Location',
                lat: latitude,
                lng: longitude
              })
            })
            
            const data = await response.json()
            
            if (data.success) {
              setCurrentLocation(data.location)
              setNearbyBuildings(data.nearby_buildings)
              setLocationInput(data.location.name)
            } else {
              generateDemoData('Your Current Location')
              setLocationInput('Your Current Location')
            }
          } catch (error) {
            console.error('Error:', error)
            generateDemoData('Your Current Location')
            setLocationInput('Your Current Location')
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Even if geolocation fails, show demo data
          generateDemoData('Hyderabad, India')
          setLocationInput('Hyderabad, India')
          setLoading(false)
        }
      )
    } else {
      // Browser doesn't support geolocation, use demo data
      generateDemoData('Hyderabad, India')
      setLocationInput('Hyderabad, India')
    }
  }

  // Generate demo building details locally
  const generateDemoBuildingDetails = (building: Building): BuildingDetails => {
    const floorCount = building.floors || 5
    return {
      id: building.id,
      floors: floorCount,
      type: building.type.includes('Medical') ? 'Medical' : 
            building.type.includes('School') ? 'Educational' : 
            building.type.includes('Mall') ? 'Commercial' : 'Government',
      occupancy: Math.floor(Math.random() * 500) + 100,
      last_inspection: '2025-12-15',
      fire_system: 'Automatic sprinkler + alarm',
      ada_compliant: true,
      floor_plans: Array.from({ length: Math.min(floorCount, 5) }, (_, i) => ({
        floor: i + 1,
        name: `Floor ${i + 1}`,
        rooms: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, j) => ({
          id: `${i + 1}${String(j + 1).padStart(2, '0')}`,
          name: `Room ${i + 1}${String(j + 1).padStart(2, '0')}`,
          type: ['Office', 'Conference', 'Storage', 'Restroom'][Math.floor(Math.random() * 4)],
          capacity: Math.floor(Math.random() * 30) + 5,
          has_window: Math.random() > 0.3
        })),
        exits: [
          { id: 'exit-A', name: 'Exit A', type: i === 0 ? 'Ground Exit' : 'Stairwell', location: 'North', width: '42 inches', illuminated: true },
          { id: 'exit-B', name: 'Exit B', type: i === 0 ? 'Ground Exit' : 'Stairwell', location: 'South', width: '42 inches', illuminated: true }
        ],
        fire_equipment: [
          { type: 'Fire Extinguisher', location: 'Corridor A', class: 'ABC', last_inspected: '2025-11-30' },
          { type: 'Fire Extinguisher', location: 'Corridor B', class: 'ABC', last_inspected: '2025-11-30' },
          { type: 'Fire Hose', location: 'Main Corridor', length: '100 feet', last_inspected: '2025-11-30' }
        ]
      })),
      escape_routes: [
        { id: 'route-1', name: 'Primary Escape Route', description: 'Use stairwell A to reach ground floor exit', estimated_time: '3 minutes', difficulty: 'Easy', waypoints: [`Floor ${floorCount}`, 'Stairwell A', 'Ground Floor', 'Exit A'] },
        { id: 'route-2', name: 'Secondary Escape Route', description: 'Use stairwell B to reach ground floor exit', estimated_time: '4 minutes', difficulty: 'Easy', waypoints: [`Floor ${floorCount}`, 'Stairwell B', 'Ground Floor', 'Exit B'] }
      ],
      safety_protocols: [
        { id: 'EVAC-001', title: 'General Evacuation Procedure', category: 'Evacuation', priority: 'Critical', steps: ['Upon hearing alarm, immediately cease all activities', 'Close windows and doors if time permits', 'Use nearest marked exit - DO NOT use elevators', 'Proceed to designated assembly point', 'Report to floor warden for headcount'], version: '2026.1', updated: '2026-01-10' },
        { id: 'FIRE-001', title: 'Fire Emergency Response', category: 'Fire Safety', priority: 'Critical', steps: ['Activate nearest fire alarm pull station', 'Call 911 immediately', 'If fire is small, use nearby fire extinguisher (PASS method)', 'If fire is large or spreading, evacuate immediately', 'Close doors to contain fire spread', 'Do not re-enter building until cleared by fire department'], version: '2026.1', updated: '2026-01-05' },
        { id: 'EARTH-001', title: 'Earthquake Response', category: 'Natural Disaster', priority: 'Critical', steps: ['DROP to hands and knees', 'COVER under desk or table', 'HOLD ON until shaking stops', 'After shaking stops, check for injuries', 'Evacuate if building is damaged or alarm sounds', 'Use stairs only - avoid elevators'], version: '2026.1', updated: '2025-10-30' }
      ],
      emergency_contacts: [
        { role: 'Building Manager', phone: '+1-555-0100' },
        { role: 'Security', phone: '+1-555-0101' },
        { role: 'Maintenance', phone: '+1-555-0102' }
      ],
      hazardous_materials: building.type.includes('Medical') ? ['Basement: Medical waste storage', 'Lab: Chemical storage'] : []
    }
  }

  // View building details
  const viewBuildingDetails = async (building: Building) => {
    setSelectedBuilding(building)
    setShowBuildingModal(true)
    setViewMode('3d') // Start with 3D view
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/guardian/building-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ building_id: building.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setBuildingDetails(data.building)
        setSelectedFloor(1)
      } else {
        // Use local demo data
        setBuildingDetails(generateDemoBuildingDetails(building))
        setSelectedFloor(1)
      }
    } catch (error) {
      console.error('Error getting building details:', error)
      // Use local demo data on error
      setBuildingDetails(generateDemoBuildingDetails(building))
      setSelectedFloor(1)
    } finally {
      setLoading(false)
    }
  }

  // Export building data
  const exportBuildingData = (building: Building) => {
    const data = {
      building_info: building,
      details: buildingDetails,
      exported_at: new Date().toISOString(),
      exported_by: 'Guardian Knowledge Base'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${building.name.replace(/\s+/g, '_')}_building_data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export protocol as PDF text
  const exportProtocol = (protocol: SafetyProtocol) => {
    const content = `
${protocol.title}
${'='.repeat(protocol.title.length)}

ID: ${protocol.id}
Category: ${protocol.category}
Priority: ${protocol.priority}
Version: ${protocol.version}
Last Updated: ${protocol.updated}

PROCEDURE STEPS:
${protocol.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---
Generated by Guardian Knowledge Base
${new Date().toLocaleString()}
    `.trim()
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${protocol.id}_${protocol.title.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredBuildings = nearbyBuildings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Guardian Knowledge Base</h1>
                  <p className="text-xs text-muted-foreground">RAG-Powered Safety Intelligence</p>
                </div>
              </div>
            </div>
            {currentLocation && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-green-400">{currentLocation.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Location Search */}
        <Card className="mb-8 border-blue-500/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter any location in the world (e.g., Times Square, Tokyo, Hyderabad)"
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  />
                </div>
                <Button 
                  onClick={searchLocation}
                  disabled={loading || !locationInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search
                </Button>
                <Button 
                  onClick={useMyLocation}
                  disabled={loading}
                  variant="outline"
                  className="gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use My Location
                </Button>
              </div>
              
              {currentLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>
                    Showing {nearbyBuildings.length} emergency buildings within 5km of your search location
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {nearbyBuildings.length > 0 && (
          <>
            {/* Filter Search */}
            <Card className="mb-6 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter buildings by name, type, or address..."
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredBuildings.length} results
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Buildings Grid */}
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Nearby Emergency Buildings
                </CardTitle>
                <CardDescription>
                  Critical infrastructure and emergency facilities near your location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="grid md:grid-cols-3 gap-4 pr-4">
                    {filteredBuildings.map((building, index) => (
                      <motion.div
                        key={building.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 rounded-lg bg-purple-500/20 text-2xl">
                            {building.icon}
                          </div>
                          <div className="text-right">
                            {building.has_blueprint && (
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs block mb-1">
                                Blueprint Available
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs block">
                              {building.distance_km} km
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-white mb-1">{building.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{building.type}</p>
                        <p className="text-xs text-muted-foreground mb-3">{building.address}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <p className="text-muted-foreground">Floors</p>
                            <p className="text-white font-semibold">{building.floors}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="text-white font-semibold">
                              {building.rating > 0 ? `⭐ ${building.rating.toFixed(1)}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => viewBuildingDetails(building)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => exportBuildingData(building)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && nearbyBuildings.length === 0 && !currentLocation && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Search for a Location</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Enter any place in the world to discover nearby hospitals, fire stations, emergency facilities, 
                and access their blueprints and safety protocols
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setLocationInput('Times Square, New York')} variant="outline">
                  Try: New York
                </Button>
                <Button onClick={() => setLocationInput('Tokyo Tower, Japan')} variant="outline">
                  Try: Tokyo
                </Button>
                <Button onClick={() => setLocationInput('Charminar, Hyderabad')} variant="outline">
                  Try: Hyderabad
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Building Details Modal */}
      <AnimatePresence>
        {showBuildingModal && selectedBuilding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBuildingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{selectedBuilding.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedBuilding.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedBuilding.address}</p>
                    </div>
                  </div>
                  {buildingDetails && (
                    <div className="flex gap-4 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        <span className="text-white font-semibold">{buildingDetails.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Floors:</span>{' '}
                        <span className="text-white font-semibold">{buildingDetails.floors}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Occupancy:</span>{' '}
                        <span className="text-white font-semibold">{buildingDetails.occupancy}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Distance:</span>{' '}
                        <span className="text-white font-semibold">{selectedBuilding.distance_km} km</span>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowBuildingModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <ScrollArea className="h-[calc(90vh-140px)]">
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : buildingDetails ? (
                    <div className="space-y-6">
                      {/* View Mode Tabs */}
                      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit">
                        <button
                          onClick={() => setViewMode('3d')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === '3d'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🎨 3D View
                        </button>
                        <button
                          onClick={() => setViewMode('blueprints')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'blueprints'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📋 Floor Plans
                        </button>
                        <button
                          onClick={() => setViewMode('protocols')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewMode === 'protocols'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🛡️ Safety Protocols
                        </button>
                      </div>

                      {/* 3D View */}
                      {viewMode === '3d' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Suspense fallback={<div className="w-full h-[500px] bg-slate-900 rounded-xl animate-pulse" />}>
                            <Building3DViewer
                              buildingName={selectedBuilding.name}
                              floors={buildingDetails.floors}
                              buildingType={buildingDetails.type}
                              selectedFloor={selectedFloor}
                              onFloorSelect={setSelectedFloor}
                              floorPlans={buildingDetails.floor_plans}
                              escapeRoutes={buildingDetails.escape_routes}
                            />
                          </Suspense>
                        </motion.div>
                      )}

                      {/* Blueprints Tab */}
                      {viewMode === 'blueprints' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-6"
                        >
                        {/* Escape Routes */}
                        <Card className="border-green-500/20">
                          <CardHeader>
                            <CardTitle className="text-lg">Emergency Escape Routes</CardTitle>
                            <CardDescription>Pre-planned evacuation paths for emergencies</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                              {buildingDetails.escape_routes.map((route) => (
                                <div key={route.id} className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                                  <h4 className="font-semibold text-white mb-2">{route.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">{route.description}</p>
                                  <div className="flex gap-4 text-xs mb-3">
                                    <div>
                                      <span className="text-muted-foreground">Time:</span>{' '}
                                      <span className="text-white">{route.estimated_time}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Difficulty:</span>{' '}
                                      <span className="text-white">{route.difficulty}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {route.waypoints.map((waypoint, i) => (
                                      <span key={i} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                                        {waypoint}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Floor Plans */}
                        <Card className="border-blue-500/20">
                          <CardHeader>
                            <CardTitle className="text-lg">Floor Plans</CardTitle>
                            <CardDescription>Detailed building layout by floor</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Floor Selector */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                              {buildingDetails.floor_plans.map((floor) => (
                                <Button
                                  key={floor.floor}
                                  size="sm"
                                  variant={selectedFloor === floor.floor ? 'default' : 'outline'}
                                  onClick={() => setSelectedFloor(floor.floor)}
                                >
                                  Floor {floor.floor}
                                </Button>
                              ))}
                            </div>

                            {/* Selected Floor Details */}
                            {buildingDetails.floor_plans.find(f => f.floor === selectedFloor) && (
                              <div className="space-y-4">
                                {/* Exits */}
                                <div>
                                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded bg-green-500"></span>
                                    Emergency Exits
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {buildingDetails.floor_plans.find(f => f.floor === selectedFloor)?.exits.map((exit) => (
                                      <div key={exit.id} className="p-2 rounded border border-green-500/30 bg-green-500/5 text-xs">
                                        <div className="font-semibold text-white">{exit.name}</div>
                                        <div className="text-muted-foreground">{exit.location}</div>
                                        <div className="text-muted-foreground">{exit.type}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Fire Equipment */}
                                <div>
                                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded bg-red-500"></span>
                                    Fire Safety Equipment
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {buildingDetails.floor_plans.find(f => f.floor === selectedFloor)?.fire_equipment.map((equipment, i) => (
                                      <div key={i} className="p-2 rounded border border-red-500/30 bg-red-500/5 text-xs">
                                        <div className="font-semibold text-white">{equipment.type}</div>
                                        <div className="text-muted-foreground">{equipment.location}</div>
                                        {equipment.class && <div className="text-muted-foreground">Class: {equipment.class}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Rooms */}
                                <div>
                                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded bg-blue-500"></span>
                                    Room Layout ({buildingDetails.floor_plans.find(f => f.floor === selectedFloor)?.rooms.length} rooms)
                                  </h4>
                                  <ScrollArea className="h-[200px]">
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pr-4">
                                      {buildingDetails.floor_plans.find(f => f.floor === selectedFloor)?.rooms.map((room) => (
                                        <div key={room.id} className="p-2 rounded border border-blue-500/30 bg-blue-500/5 text-xs">
                                          <div className="font-semibold text-white">{room.id}</div>
                                          <div className="text-muted-foreground">{room.type}</div>
                                          <div className="text-muted-foreground">Cap: {room.capacity}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                      {/* Building Info */}
                      <div className="grid md:grid-cols-2 gap-4">
                          <Card className="border-yellow-500/20">
                            <CardHeader>
                              <CardTitle className="text-sm">Emergency Contacts</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {buildingDetails.emergency_contacts.map((contact, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{contact.role}</span>
                                    <span className="text-white font-mono">{contact.phone}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-orange-500/20">
                            <CardHeader>
                              <CardTitle className="text-sm">Building Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Fire System</span>
                                  <span className="text-white">{buildingDetails.fire_system}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Inspection</span>
                                  <span className="text-white">{buildingDetails.last_inspection}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">ADA Compliant</span>
                                  <span className="text-white">{buildingDetails.ada_compliant ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {buildingDetails.hazardous_materials.length > 0 && (
                          <Card className="border-red-500/20">
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                Hazardous Materials
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-1">
                                {buildingDetails.hazardous_materials.map((material, i) => (
                                  <li key={i} className="text-sm text-red-400">{material}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                        </motion.div>
                      )}

                      {/* Safety Protocols Tab */}
                      {viewMode === 'protocols' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                        {buildingDetails.safety_protocols.map((protocol) => (
                          <Card key={protocol.id} className="border-green-500/20">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-green-500/20">
                                    <FileText className="w-4 h-4 text-green-400" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{protocol.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                      <span>{protocol.category}</span>
                                      <span>•</span>
                                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                                        {protocol.priority}
                                      </span>
                                    </CardDescription>
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">
                                  {protocol.id}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <ol className="space-y-2 list-decimal list-inside">
                                  {protocol.steps.map((step, i) => (
                                    <li key={i} className="text-sm text-white">
                                      <span className="text-muted-foreground">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span>Version {protocol.version}</span>
                                    <span>•</span>
                                    <span>Updated {protocol.updated}</span>
                                  </div>
                                  <Button size="sm" variant="outline" onClick={() => exportProtocol(protocol)}>
                                    <Download className="w-3 h-3 mr-1" />
                                    Export
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        </motion.div>
                      )}
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
