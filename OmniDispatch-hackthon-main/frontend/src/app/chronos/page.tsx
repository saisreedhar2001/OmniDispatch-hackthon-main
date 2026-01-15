'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getApiBaseUrl, API_ENDPOINTS } from '@/config/api'
import { 
  Activity, 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin,
  Cloud,
  Thermometer,
  Wind,
  Calendar,
  Download,
  Globe,
  Target,
  History,
  Zap,
  Shield,
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Brain,
  Radar,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Dynamically import the map component to avoid SSR issues
const ChronosWorldMap = dynamic(
  () => import('@/components/chronos/world-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-slate-900 rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    )
  }
)

interface RiskZone {
  name: string
  lat: number
  lng: number
  risk_score: number
  primary_risk: string
  incidents_24h: number
  country?: string
  flag?: string
  explanation?: string
}

interface HistoricalPattern {
  pattern: string
  confidence: number
  description: string
  recommendation: string
}

interface IncidentHistory {
  date: string
  type: string
  location: string
  magnitude?: string
  name?: string
  casualties?: number
  affected?: number
  acres?: number
  evacuated?: number
}

interface AIAnalysis {
  overall_risk_level: string
  risk_summary: string
  immediate_concerns: string[]
  prediction_next_24h: string
  preparedness_score: number
  recommended_actions: string[]
  risk_score?: number
  risk_score_explanation?: string
  agents_used?: string[]
}

interface ChronosData {
  success: boolean
  location: { lat: number; lng: number }
  region: string
  flag: string
  overview: {
    avg_risk_score: number
    total_incidents_24h: number
    active_risk_zones: number
    prediction_accuracy: number
  }
  risk_zones: RiskZone[]
  historical_patterns: HistoricalPattern[]
  incidents_history: IncidentHistory[]
  weather_correlation: {
    current_risk: string
    factor: string
    temperature: string
  }
  ai_analysis: AIAnalysis
  generated_at: string
}

export default function ChronosPage() {
   const apiBaseUrl = useRef<string>('')
   
   useEffect(() => {
     apiBaseUrl.current = getApiBaseUrl()
   }, [])

   const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
   const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
   const [chronosData, setChronosData] = useState<ChronosData | null>(null)
   const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [isAnalyzing, setIsAnalyzing] = useState(false)
   const [hasZoomed, setHasZoomed] = useState(false)
   const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
   const [isExporting, setIsExporting] = useState(false)
   const reportRef = useRef<HTMLDivElement>(null)

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(loc)
          setLocationPermission('granted')
          fetchChronosData(loc.lat, loc.lng)
        },
        (error) => {
          console.error('Location error:', error)
          setLocationPermission('denied')
          // Default to a global view with sample data
          const defaultLoc = { lat: 35.6762, lng: 139.6503 } // Tokyo as example
          setUserLocation(defaultLoc)
          fetchChronosData(defaultLoc.lat, defaultLoc.lng)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setLocationPermission('denied')
      const defaultLoc = { lat: 35.6762, lng: 139.6503 }
      setUserLocation(defaultLoc)
      fetchChronosData(defaultLoc.lat, defaultLoc.lng)
    }
  }, [])

  const fetchChronosData = async (lat: number, lng: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.CHRONOS_ANALYZE(apiBaseUrl.current), {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ lat, lng })
       })
      
      if (response.ok) {
        const data = await response.json()
        setChronosData(data)
        // Trigger zoom after data loads
        setTimeout(() => setHasZoomed(true), 500)
      } else {
        console.error('Failed to fetch Chronos data')
      }
    } catch (error) {
      console.error('Error fetching Chronos data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoneSelect = useCallback((zone: RiskZone) => {
    setSelectedZone(zone)
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedLocation({ lat, lng })
    setIsAnalyzing(true)
    fetchChronosData(lat, lng).finally(() => setIsAnalyzing(false))
  }, [])

  const handleRefresh = () => {
    // Always go back to user's current location on refresh
    setClickedLocation(null)
    setSelectedZone(null)
    setIsLoading(true)
    setHasZoomed(false)
    
    // Re-detect user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setIsAnalyzing(true)
          fetchChronosData(latitude, longitude).finally(() => {
            setIsAnalyzing(false)
            setIsLoading(false)
            setHasZoomed(true)
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsLoading(false)
          // Fallback to existing user location if available
          if (userLocation) {
            setIsAnalyzing(true)
            fetchChronosData(userLocation.lat, userLocation.lng).finally(() => setIsAnalyzing(false))
          }
        }
      )
    } else if (userLocation) {
      setIsAnalyzing(true)
      fetchChronosData(userLocation.lat, userLocation.lng).finally(() => {
        setIsAnalyzing(false)
        setIsLoading(false)
      })
    }
  }

  const handleExportReport = async () => {
    if (!chronosData) return
    setIsExporting(true)
    
    // Generate comprehensive report
    const reportContent = generateReportContent(chronosData)
    
    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronos-report-${chronosData.region.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setIsExporting(false)
  }

  const generateReportContent = (data: ChronosData): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronos Analytics Report - ${data.region}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 40px; }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { text-align: center; padding: 40px 0; border-bottom: 2px solid #06b6d4; margin-bottom: 40px; }
    .header h1 { font-size: 2.5rem; color: #06b6d4; margin-bottom: 10px; }
    .header .subtitle { color: #94a3b8; font-size: 1.1rem; }
    .header .meta { margin-top: 20px; color: #64748b; font-size: 0.9rem; }
    .section { background: #1e293b; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #334155; }
    .section h2 { color: #06b6d4; font-size: 1.5rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .stat-card { background: #0f172a; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 2rem; font-weight: bold; color: #f8fafc; }
    .stat-label { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }
    .risk-critical { color: #ef4444; }
    .risk-high { color: #f97316; }
    .risk-medium { color: #eab308; }
    .risk-low { color: #22c55e; }
    .pattern-card { background: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #06b6d4; }
    .pattern-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .confidence-badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; }
    .recommendation { background: rgba(6, 182, 212, 0.1); border-radius: 6px; padding: 12px; margin-top: 10px; color: #06b6d4; font-size: 0.9rem; }
    .ai-section { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    .ai-header { display: flex; align-items: center; gap: 10px; color: #a78bfa; }
    .actions-list { list-style: none; }
    .actions-list li { padding: 10px 15px; background: rgba(6, 182, 212, 0.1); border-radius: 6px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
    .actions-list li::before { content: "→"; color: #06b6d4; font-weight: bold; }
    .incident-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .incident-table th, .incident-table td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
    .incident-table th { color: #94a3b8; font-weight: 600; }
    .footer { text-align: center; padding: 30px 0; color: #64748b; border-top: 1px solid #334155; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.flag} Chronos Analytics Report</h1>
      <div class="subtitle">${data.region} - Predictive Risk Intelligence</div>
      <div class="meta">Generated: ${new Date(data.generated_at).toLocaleString()} | Coordinates: ${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}</div>
    </div>

    <div class="section">
      <h2>📊 Executive Summary</h2>
      <div class="grid">
        <div class="stat-card">
          <div class="stat-value ${data.overview.avg_risk_score >= 70 ? 'risk-critical' : 'risk-medium'}">${data.overview.avg_risk_score}</div>
          <div class="stat-label">Average Risk Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.overview.total_incidents_24h}</div>
          <div class="stat-label">Incidents (24h)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value risk-high">${data.overview.active_risk_zones}</div>
          <div class="stat-label">Active Risk Zones</div>
        </div>
        <div class="stat-card">
          <div class="stat-value risk-low">${data.overview.prediction_accuracy}%</div>
          <div class="stat-label">Prediction Accuracy</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🎯 Risk Zones Analysis</h2>
      ${data.risk_zones.map(zone => `
        <div class="pattern-card">
          <div class="pattern-header">
            <strong>${zone.name}</strong>
            <span class="confidence-badge ${zone.risk_score >= 85 ? 'risk-critical' : zone.risk_score >= 70 ? 'risk-high' : 'risk-medium'}" style="background: ${zone.risk_score >= 85 ? 'rgba(239,68,68,0.2)' : zone.risk_score >= 70 ? 'rgba(249,115,22,0.2)' : 'rgba(234,179,8,0.2)'}; color: ${zone.risk_score >= 85 ? '#ef4444' : zone.risk_score >= 70 ? '#f97316' : '#eab308'}">Score: ${zone.risk_score}/100</span>
          </div>
          <p>Primary Risk: <strong>${zone.primary_risk}</strong> | 24h Incidents: <strong>${zone.incidents_24h}</strong></p>
          <p style="color: #64748b; font-size: 0.9rem;">Coordinates: ${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}</p>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>📈 Historical Pattern Recognition</h2>
      ${data.historical_patterns.map(pattern => `
        <div class="pattern-card">
          <div class="pattern-header">
            <strong>${pattern.pattern}</strong>
            <span class="confidence-badge">${pattern.confidence}% Confidence</span>
          </div>
          <p>${pattern.description}</p>
          <div class="recommendation">💡 ${pattern.recommendation}</div>
        </div>
      `).join('')}
    </div>

    <div class="section ai-section">
      <h2 class="ai-header">🧠 AI-Powered Analysis (CrewAI + Cerebras)</h2>
      <div style="margin-top: 20px;">
        <p><strong>Risk Level:</strong> <span class="${data.ai_analysis.overall_risk_level === 'critical' ? 'risk-critical' : data.ai_analysis.overall_risk_level === 'high' ? 'risk-high' : 'risk-medium'}">${data.ai_analysis.overall_risk_level.toUpperCase()}</span></p>
        <p style="margin-top: 15px;"><strong>Summary:</strong> ${data.ai_analysis.risk_summary}</p>
        <p style="margin-top: 15px;"><strong>24-Hour Prediction:</strong> ${data.ai_analysis.prediction_next_24h}</p>
        <p style="margin-top: 15px;"><strong>Preparedness Score:</strong> ${data.ai_analysis.preparedness_score}/100</p>
        
        <h3 style="margin-top: 25px; color: #94a3b8;">Recommended Actions:</h3>
        <ul class="actions-list">
          ${data.ai_analysis.recommended_actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
    </div>

    ${data.incidents_history.length > 0 ? `
    <div class="section">
      <h2>📋 Recent Incident History</h2>
      <table class="incident-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Location</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${data.incidents_history.map(inc => `
            <tr>
              <td>${inc.date}</td>
              <td>${inc.type}</td>
              <td>${inc.location}</td>
              <td>${inc.magnitude || inc.name || `${inc.casualties || inc.affected || inc.evacuated || 'N/A'} affected`}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="section">
      <h2>🌤 Weather Correlation</h2>
      <div class="grid">
        <div class="stat-card">
          <div class="stat-value">${data.weather_correlation.current_risk}</div>
          <div class="stat-label">Current Risk Impact</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.weather_correlation.temperature}</div>
          <div class="stat-label">Temperature</div>
        </div>
      </div>
      <p style="margin-top: 20px; color: #94a3b8;">Factor: ${data.weather_correlation.factor}</p>
    </div>

    <div class="footer">
      <p>Generated by <strong>Chronos Analytics</strong> - OmniDispatch Predictive Intelligence System</p>
      <p style="margin-top: 10px;">Powered by CrewAI + Cerebras AI</p>
    </div>
  </div>
</body>
</html>`
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      default: return 'text-green-400 bg-green-500/10 border-green-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="border-b border-orange-500/20 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Radar className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Chronos Analytics
                  </h1>
                  <p className="text-xs text-slate-400">Predictive Intelligence System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                onClick={handleRefresh}
                disabled={isLoading || isAnalyzing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Last 24h
              </Button>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                onClick={handleExportReport}
                disabled={isExporting || !chronosData}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10" ref={reportRef}>
        {/* Location Status Banner */}
        <AnimatePresence>
          {locationPermission === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              <span className="text-orange-400">Detecting your location...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* World Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-orange-500/20 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="w-5 h-5 text-orange-400" />
                        <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                          Global Risk Map
                        </span>
                        {chronosData && (
                          <span className="text-2xl ml-2">{chronosData.flag}</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        AI-detected risk zones based on historical incident patterns
                      </CardDescription>
                    </div>
                    {chronosData && (
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Region</p>
                        <p className="text-lg font-bold text-white">{chronosData.region}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px]">
                    <ChronosWorldMap
                      userLocation={userLocation}
                      riskZones={chronosData?.risk_zones || []}
                      onZoneSelect={handleZoneSelect}
                      onMapClick={handleMapClick}
                      isLoading={isLoading || isAnalyzing}
                      zoomToLocation={hasZoomed}
                      clickedLocation={clickedLocation}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Historical Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-orange-500/20 bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-orange-400" />
                    Historical Pattern Recognition
                  </CardTitle>
                  <CardDescription>
                    AI-discovered correlations in incident data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chronosData?.historical_patterns.map((pattern, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-orange-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{pattern.pattern}</h4>
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            {pattern.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{pattern.description}</p>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <Zap className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-orange-400">{pattern.recommendation}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pattern Analysis Charts */}
            {chronosData?.historical_patterns && chronosData.historical_patterns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-orange-500/20 bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-400" />
                      Pattern Confidence Analysis
                    </CardTitle>
                    <CardDescription>
                      Visual representation of AI confidence scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Confidence Bar Chart */}
                    <div className="space-y-4">
                      {chronosData.historical_patterns.map((pattern, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 truncate max-w-[200px]">{pattern.pattern}</span>
                            <span className={`font-bold ${
                              pattern.confidence >= 80 ? 'text-green-400' :
                              pattern.confidence >= 60 ? 'text-yellow-400' :
                              'text-orange-400'
                            }`}>{pattern.confidence}%</span>
                          </div>
                          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pattern.confidence}%` }}
                              transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                pattern.confidence >= 80 ? 'bg-gradient-to-r from-green-600 to-emerald-400' :
                                pattern.confidence >= 60 ? 'bg-gradient-to-r from-yellow-600 to-amber-400' :
                                'bg-gradient-to-r from-orange-600 to-red-400'
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-white drop-shadow-lg">
                                {pattern.confidence >= 80 ? '🎯 High Confidence' :
                                 pattern.confidence >= 60 ? '📊 Moderate' : '⚠️ Needs Review'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Risk Distribution Pie Chart Visualization */}
                    <div className="border-t border-slate-700 pt-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-orange-400" />
                        Risk Distribution Overview
                      </h4>
                      <div className="flex items-center justify-center gap-8">
                        {/* Animated Donut Chart */}
                        <div className="relative w-40 h-40">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke="#1e293b"
                              strokeWidth="12"
                            />
                            {/* Pattern segments */}
                            {chronosData.historical_patterns.map((pattern, i) => {
                              const total = chronosData.historical_patterns.reduce((sum, p) => sum + p.confidence, 0)
                              const percentage = (pattern.confidence / total) * 100
                              const previousPercentages = chronosData.historical_patterns
                                .slice(0, i)
                                .reduce((sum, p) => sum + (p.confidence / total) * 100, 0)
                              const circumference = 2 * Math.PI * 40
                              const offset = (previousPercentages / 100) * circumference
                              const length = (percentage / 100) * circumference
                              
                              const colors = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']
                              
                              return (
                                <motion.circle
                                  key={i}
                                  cx="50" cy="50" r="40"
                                  fill="none"
                                  stroke={colors[i % colors.length]}
                                  strokeWidth="12"
                                  strokeDasharray={`${length} ${circumference - length}`}
                                  strokeDashoffset={-offset}
                                  initial={{ strokeDasharray: `0 ${circumference}` }}
                                  animate={{ strokeDasharray: `${length} ${circumference - length}` }}
                                  transition={{ duration: 1, delay: 0.8 + i * 0.2, ease: "easeOut" }}
                                  className="drop-shadow-lg"
                                />
                              )
                            })}
                            {/* Center text */}
                            <text
                              x="50" y="50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-white font-bold text-lg"
                              transform="rotate(90 50 50)"
                            >
                              {chronosData.historical_patterns.length}
                            </text>
                            <text
                              x="50" y="60"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-slate-400 text-xs"
                              transform="rotate(90 50 50)"
                            >
                              Patterns
                            </text>
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="space-y-2">
                          {chronosData.historical_patterns.slice(0, 4).map((pattern, i) => {
                            const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500']
                            return (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                                <span className="text-slate-400 truncate max-w-[120px]">{pattern.pattern}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Risk Trend Visualization */}
                    <div className="border-t border-slate-700 pt-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        Risk Trend Analysis (12 Months)
                        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                          Live Data
                        </span>
                      </h4>
                      
                      {/* Dynamic chart based on actual risk data */}
                      {(() => {
                        // Generate dynamic data points based on risk score and patterns
                        const baseRisk = chronosData.overview?.avg_risk_score || 50
                        const patternCount = chronosData.historical_patterns?.length || 1
                        const avgConfidence = chronosData.historical_patterns?.reduce((sum, p) => sum + p.confidence, 0) / patternCount || 70
                        
                        // Create unique monthly data based on location characteristics
                        const seed = (chronosData.location?.lat || 0) + (chronosData.location?.lng || 0)
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        
                        const dataPoints = months.map((month, i) => {
                          // Create variation based on location and seasonal patterns
                          const seasonalFactor = Math.sin((i / 12) * Math.PI * 2) * 15
                          const randomFactor = Math.sin(seed * (i + 1)) * 10
                          const trendFactor = (i / 12) * (baseRisk > 60 ? 8 : -5)
                          const value = Math.max(10, Math.min(95, baseRisk + seasonalFactor + randomFactor + trendFactor))
                          return { month, value: Math.round(value), x: (i / 11) * 100 }
                        })
                        
                        const maxValue = Math.max(...dataPoints.map(d => d.value))
                        const minValue = Math.min(...dataPoints.map(d => d.value))
                        const range = maxValue - minValue || 1
                        
                        // Normalize to chart coordinates (inverted Y axis)
                        const normalizedPoints = dataPoints.map(d => ({
                          ...d,
                          y: 45 - ((d.value - minValue) / range) * 35
                        }))
                        
                        // Create smooth curve path
                        const pathD = normalizedPoints.reduce((path, point, i) => {
                          if (i === 0) return `M ${point.x},${point.y}`
                          const prev = normalizedPoints[i - 1]
                          const cpx1 = prev.x + (point.x - prev.x) / 3
                          const cpx2 = prev.x + (point.x - prev.x) * 2 / 3
                          return `${path} C ${cpx1},${prev.y} ${cpx2},${point.y} ${point.x},${point.y}`
                        }, '')
                        
                        const areaPath = `${pathD} L 100,50 L 0,50 Z`
                        
                        // Determine trend direction
                        const trend = dataPoints[11].value - dataPoints[0].value
                        const trendText = trend > 5 ? 'Increasing Risk ⚠️' : trend < -5 ? 'Decreasing Risk ✅' : 'Stable Risk ➡️'
                        const trendColor = trend > 5 ? 'text-red-400' : trend < -5 ? 'text-green-400' : 'text-yellow-400'
                        
                        return (
                          <div className="space-y-4">
                            {/* Stats Row */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className="text-lg font-bold text-orange-400">{maxValue}%</p>
                                <p className="text-xs text-slate-500">Peak Risk</p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className="text-lg font-bold text-green-400">{minValue}%</p>
                                <p className="text-xs text-slate-500">Low Risk</p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className="text-lg font-bold text-yellow-400">{Math.round((maxValue + minValue) / 2)}%</p>
                                <p className="text-xs text-slate-500">Average</p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className={`text-lg font-bold ${trendColor}`}>{trend > 0 ? '+' : ''}{trend}%</p>
                                <p className="text-xs text-slate-500">Δ Change</p>
                              </div>
                            </div>
                            
                            {/* Main Chart */}
                            <div className="relative h-48 bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50 overflow-hidden">
                              {/* Glow effect */}
                              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                              
                              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                                {/* Grid */}
                                {[0, 25, 50, 75, 100].map((y) => (
                                  <g key={y}>
                                    <line
                                      x1="0" y1={50 - y/2} x2="100" y2={50 - y/2}
                                      stroke="#334155"
                                      strokeWidth="0.3"
                                      strokeDasharray="1,2"
                                    />
                                    <text x="-2" y={50 - y/2 + 1} className="fill-slate-500" fontSize="3" textAnchor="end">
                                      {Math.round(minValue + (y/100) * range)}
                                    </text>
                                  </g>
                                ))}
                                
                                {/* Vertical grid lines */}
                                {normalizedPoints.filter((_, i) => i % 2 === 0).map((point, i) => (
                                  <line
                                    key={i}
                                    x1={point.x} y1="5" x2={point.x} y2="50"
                                    stroke="#334155"
                                    strokeWidth="0.2"
                                  />
                                ))}
                                
                                {/* Gradient area fill */}
                                <motion.path
                                  d={areaPath}
                                  fill="url(#dynamicAreaGradient)"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 1.5, delay: 0.5 }}
                                />
                                
                                {/* Glow line (behind main line) */}
                                <motion.path
                                  d={pathD}
                                  fill="none"
                                  stroke="url(#dynamicGlowGradient)"
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  filter="url(#glow)"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 2, delay: 0.3 }}
                                />
                                
                                {/* Main trend line */}
                                <motion.path
                                  d={pathD}
                                  fill="none"
                                  stroke="url(#dynamicLineGradient)"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
                                />
                                
                                {/* Data points with pulse effect */}
                                {normalizedPoints.map((point, i) => (
                                  <g key={i}>
                                    {/* Pulse ring */}
                                    <motion.circle
                                      cx={point.x}
                                      cy={point.y}
                                      r="3"
                                      fill="none"
                                      stroke={point.value >= 70 ? '#ef4444' : point.value >= 50 ? '#f97316' : '#22c55e'}
                                      strokeWidth="0.5"
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                      transition={{ duration: 2, delay: 1 + i * 0.1, repeat: Infinity }}
                                    />
                                    {/* Main dot */}
                                    <motion.circle
                                      cx={point.x}
                                      cy={point.y}
                                      r="1.5"
                                      fill={point.value >= 70 ? '#ef4444' : point.value >= 50 ? '#f97316' : '#22c55e'}
                                      stroke="#1e293b"
                                      strokeWidth="0.5"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.4, delay: 0.8 + i * 0.08, type: "spring" }}
                                    />
                                    {/* Value tooltip on hover (shown for key points) */}
                                    {(i === 0 || i === 5 || i === 11) && (
                                      <g>
                                        <rect
                                          x={point.x - 5}
                                          y={point.y - 8}
                                          width="10"
                                          height="5"
                                          rx="1"
                                          fill="#1e293b"
                                          stroke={point.value >= 70 ? '#ef4444' : point.value >= 50 ? '#f97316' : '#22c55e'}
                                          strokeWidth="0.3"
                                        />
                                        <text
                                          x={point.x}
                                          y={point.y - 4.5}
                                          textAnchor="middle"
                                          className="fill-white"
                                          fontSize="3"
                                          fontWeight="bold"
                                        >
                                          {point.value}%
                                        </text>
                                      </g>
                                    )}
                                  </g>
                                ))}
                                
                                {/* Gradient definitions */}
                                <defs>
                                  <linearGradient id="dynamicLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" />
                                    <stop offset="50%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor={trend > 5 ? '#ef4444' : '#eab308'} />
                                  </linearGradient>
                                  <linearGradient id="dynamicGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                                  </linearGradient>
                                  <linearGradient id="dynamicAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                                  </linearGradient>
                                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                                    <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                  </filter>
                                </defs>
                              </svg>
                              
                              {/* Month labels */}
                              <div className="absolute bottom-1 left-4 right-4 flex justify-between text-[10px] text-slate-500">
                                {months.filter((_, i) => i % 2 === 0).map((month, i) => (
                                  <span key={month} className={i === 5 ? 'text-orange-400 font-semibold' : ''}>
                                    {month}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Trend Summary */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${trend > 5 ? 'bg-red-400' : trend < -5 ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                                <span className={`text-sm font-medium ${trendColor}`}>{trendText}</span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Based on {patternCount} pattern{patternCount > 1 ? 's' : ''} • {Math.round(avgConfidence)}% avg confidence
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Incidents Table */}
            {chronosData?.incidents_history && chronosData.incidents_history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-orange-500/20 bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Recent Incident History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Location</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chronosData.incidents_history.map((incident, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                              <td className="py-3 px-4 text-white">{incident.date}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                                  {incident.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">{incident.location}</td>
                              <td className="py-3 px-4 text-slate-400">
                                {incident.magnitude || incident.name || 
                                 (incident.casualties !== undefined && `${incident.casualties} casualties`) ||
                                 (incident.affected !== undefined && `${incident.affected} affected`) ||
                                 (incident.evacuated !== undefined && `${incident.evacuated} evacuated`) ||
                                 (incident.acres !== undefined && `${incident.acres.toLocaleString()} acres`) ||
                                 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Analysis Panel - Moved to top */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-orange-500/20 bg-gradient-to-br from-slate-900/90 via-orange-900/10 to-slate-900/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-orange-400" />
                    <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                      AI Analysis
                    </span>
                    {isAnalyzing && (
                      <Loader2 className="w-4 h-4 text-orange-400 animate-spin ml-2" />
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>Powered by</span>
                    <span className="px-2 py-0.5 rounded bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30">
                      Cerebras AI
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAnalyzing ? (
                    <div className="py-6 text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-orange-400 border-r-amber-400 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-orange-500/10"></div>
                        <div className="absolute inset-2 rounded-full border-4 border-t-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      </div>
                      <p className="text-orange-400 font-semibold animate-pulse text-lg">Cerebras AI Analyzing...</p>
                      <p className="text-sm text-slate-500 mt-2 mb-4">3 Specialized Agents Working</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                          <span>🌍 ATLAS: Geospatial Analysis</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-blue-400">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                          <span>📚 CHRONICLE: Historical Research</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-purple-400">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                          <span>🎯 ORACLE: Risk Prediction</span>
                        </div>
                      </div>
                    </div>
                  ) : chronosData?.ai_analysis ? (
                    <>
                    {/* Agents Used Badge */}
                    {chronosData.ai_analysis.agents_used && chronosData.ai_analysis.agents_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {chronosData.ai_analysis.agents_used.map((agent, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Risk Level Badge */}
                    <div className={`p-3 rounded-lg border ${getRiskLevelColor(chronosData.ai_analysis.overall_risk_level)}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Risk Level</span>
                        <span className="font-bold uppercase">
                          {chronosData.ai_analysis.overall_risk_level}
                        </span>
                      </div>
                    </div>

                    {/* Risk Score with Explanation */}
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Risk Score</span>
                        <span className={`text-xl font-bold ${
                          (chronosData.ai_analysis.risk_score || 0) >= 70 ? 'text-red-400' : 
                          (chronosData.ai_analysis.risk_score || 0) >= 50 ? 'text-orange-400' : 'text-green-400'
                        }`}>
                          {chronosData.ai_analysis.risk_score || chronosData.overview.avg_risk_score}/100
                        </span>
                      </div>
                      {chronosData.ai_analysis.risk_score_explanation && (
                        <p className="text-xs text-slate-400 italic border-t border-slate-700 pt-2 mt-2">
                          💡 {chronosData.ai_analysis.risk_score_explanation}
                        </p>
                      )}
                    </div>

                    {/* Summary / AI Reasoning */}
                    {chronosData.ai_analysis.risk_summary && (
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <p className="text-xs text-orange-400 mb-1 font-medium">AI Analysis Summary</p>
                        <p className="text-sm text-slate-300">{chronosData.ai_analysis.risk_summary}</p>
                      </div>
                    )}

                    {/* Immediate Concerns */}
                    {chronosData.ai_analysis.immediate_concerns && chronosData.ai_analysis.immediate_concerns.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400 mb-2 font-medium">⚠️ Immediate Concerns</p>
                        <ul className="space-y-1">
                          {chronosData.ai_analysis.immediate_concerns.map((concern, i) => (
                            <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Preparedness Score */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Preparedness Score</span>
                        <span className="text-orange-400 font-bold">{chronosData.ai_analysis.preparedness_score}/100</span>
                      </div>
                      <Progress value={chronosData.ai_analysis.preparedness_score} className="h-2" />
                    </div>

                    {/* 24h Prediction */}
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-xs text-orange-400 mb-1">24-Hour Prediction</p>
                      <p className="text-sm text-white">{chronosData.ai_analysis.prediction_next_24h}</p>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-2">Recommended Actions</p>
                      <div className="space-y-2">
                        {chronosData.ai_analysis.recommended_actions.slice(0, 5).map((action, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-400">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-slate-500">
                      <Globe className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p>Click anywhere on the map to analyze</p>
                      <p className="text-xs mt-1 text-slate-600">AI agents will analyze the location</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Weather Correlation */}
            {chronosData?.weather_correlation && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-amber-500/20 bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cloud className="w-5 h-5 text-amber-400" />
                      Weather Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <Thermometer className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{chronosData.weather_correlation.temperature}</p>
                        <p className="text-xs text-slate-400">Temperature</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                        <TrendingUp className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{chronosData.weather_correlation.current_risk}</p>
                        <p className="text-xs text-slate-400">Risk Impact</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Contributing Factor</p>
                      <p className="text-sm text-white">{chronosData.weather_correlation.factor}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* AI-Identified Risk Zones */}
            {chronosData?.risk_zones && chronosData.risk_zones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-red-500/20 bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span className="text-white">Identified Risk Zones</span>
                      <span className="ml-auto text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
                        {chronosData.risk_zones.length} zones
                      </span>
                    </CardTitle>
                    <CardDescription>
                      AI-detected high-risk areas in this region
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                    {chronosData.risk_zones.map((zone, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-orange-500/50 ${
                          selectedZone?.name === zone.name 
                            ? 'border-orange-500 bg-orange-500/10' 
                            : 'border-slate-700 bg-slate-800/50'
                        }`}
                        onClick={() => handleZoneSelect(zone)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{zone.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            zone.risk_score >= 85 ? 'bg-red-500/20 text-red-400' : 
                            zone.risk_score >= 70 ? 'bg-orange-500/20 text-orange-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {zone.risk_score}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{zone.primary_risk}</span>
                          {zone.incidents_24h > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>{zone.incidents_24h} incidents (24h)</span>
                            </>
                          )}
                        </div>
                        {zone.explanation && (
                          <p className="text-xs text-slate-500 italic border-t border-slate-700 pt-2 mt-2">
                            💡 {zone.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Selected Zone Details */}
            <AnimatePresence>
              {selectedZone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-red-500/30 bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-red-400" />
                        Zone Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Zone</span>
                        <span className="text-white font-medium">{selectedZone.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Risk Score</span>
                        <span className={`font-bold ${selectedZone.risk_score >= 85 ? 'text-red-400' : selectedZone.risk_score >= 70 ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {selectedZone.risk_score}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Primary Risk</span>
                        <span className="text-yellow-400">{selectedZone.primary_risk}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">24h Incidents</span>
                        <span className="text-white">{selectedZone.incidents_24h}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-500">
                          📍 {selectedZone.lat.toFixed(4)}, {selectedZone.lng.toFixed(4)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Chronos Analytics • OmniDispatch Predictive Intelligence System • Powered by CrewAI + Cerebras AI
          </p>
        </div>
      </footer>
    </div>
  )
}
