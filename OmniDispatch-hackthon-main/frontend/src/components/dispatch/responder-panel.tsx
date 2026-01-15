'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Flame, Shield, HeartPulse, Radio, Navigation } from 'lucide-react'

interface Responder {
  id: string
  type: 'fire' | 'police' | 'medical'
  unit: string
  status: 'available' | 'responding' | 'on-scene' | 'unavailable'
  location: string
  eta?: string
}

const MOCK_RESPONDERS: Responder[] = [
  { id: '1', type: 'fire', unit: 'Engine 7', status: 'responding', location: '0.8 mi away', eta: '2:30' },
  { id: '2', type: 'fire', unit: 'Ladder 3', status: 'responding', location: '1.2 mi away', eta: '3:15' },
  { id: '3', type: 'police', unit: 'Unit 42', status: 'on-scene', location: 'On location' },
  { id: '4', type: 'medical', unit: 'Medic 9', status: 'available', location: 'Station 5' },
  { id: '5', type: 'police', unit: 'Unit 18', status: 'available', location: 'Patrol Zone 3' },
  { id: '6', type: 'fire', unit: 'Rescue 2', status: 'unavailable', location: 'In service' },
]

const getResponderIcon = (type: Responder['type']) => {
  switch (type) {
    case 'fire': return Flame
    case 'police': return Shield
    case 'medical': return HeartPulse
  }
}

const getResponderColor = (type: Responder['type']) => {
  switch (type) {
    case 'fire': return 'from-orange-500 to-red-500'
    case 'police': return 'from-blue-500 to-blue-600'
    case 'medical': return 'from-green-500 to-green-600'
  }
}

const getStatusColor = (status: Responder['status']) => {
  switch (status) {
    case 'available': return 'bg-green-500/20 text-green-400 border-green-500/50'
    case 'responding': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse'
    case 'on-scene': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    case 'unavailable': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
  }
}

export function ResponderPanel() {
  return (
    <Card className="border-blue-500/20 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            Responders
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-400">
              {MOCK_RESPONDERS.filter(r => r.status === 'available').length} Available
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-yellow-400">
              {MOCK_RESPONDERS.filter(r => r.status === 'responding').length} Responding
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px]">
          <div className="p-4 space-y-2">
            {MOCK_RESPONDERS.map((responder, index) => {
              const Icon = getResponderIcon(responder.type)
              return (
                <motion.div
                  key={responder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer ${getStatusColor(responder.status)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getResponderColor(responder.type)}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-white">
                          {responder.unit}
                        </p>
                        {responder.eta && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-500/30 text-yellow-400 text-[10px] font-mono">
                            ETA {responder.eta}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-3 h-3 opacity-50" />
                        <span className="text-xs text-muted-foreground truncate">
                          {responder.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
