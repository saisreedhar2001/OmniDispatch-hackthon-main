'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Flame, Shield, HeartPulse, Clock, MapPin } from 'lucide-react'

interface Incident {
  id: string
  type: 'fire' | 'medical' | 'crime' | 'accident'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  location: string
  time: string
  status: 'active' | 'dispatched' | 'resolved'
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    type: 'fire',
    priority: 'critical',
    title: 'Structure Fire - Multi-Story',
    location: '123 Main St',
    time: '2 min ago',
    status: 'active',
  },
  {
    id: '2',
    type: 'medical',
    priority: 'high',
    title: 'Cardiac Emergency',
    location: '456 Oak Ave',
    time: '8 min ago',
    status: 'dispatched',
  },
  {
    id: '3',
    type: 'crime',
    priority: 'medium',
    title: 'Burglary in Progress',
    location: '789 Pine Rd',
    time: '15 min ago',
    status: 'dispatched',
  },
  {
    id: '4',
    type: 'accident',
    priority: 'high',
    title: 'Vehicle Collision',
    location: 'I-95 Mile 42',
    time: '22 min ago',
    status: 'dispatched',
  },
]

const getIncidentIcon = (type: Incident['type']) => {
  switch (type) {
    case 'fire': return Flame
    case 'medical': return HeartPulse
    case 'crime': return Shield
    default: return AlertTriangle
  }
}

const getIncidentColor = (type: Incident['type']) => {
  switch (type) {
    case 'fire': return 'text-orange-400 bg-orange-500/20 border-orange-500/50'
    case 'medical': return 'text-green-400 bg-green-500/20 border-green-500/50'
    case 'crime': return 'text-blue-400 bg-blue-500/20 border-blue-500/50'
    default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
  }
}

const getPriorityColor = (priority: Incident['priority']) => {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-yellow-500 text-black'
    default: return 'bg-green-500 text-white'
  }
}

export function IncidentPanel() {
  return (
    <Card className="border-orange-500/20 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Active Incidents
          </CardTitle>
          <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-mono">
            {MOCK_INCIDENTS.filter(i => i.status !== 'resolved').length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[250px]">
          <div className="p-4 space-y-3">
            {MOCK_INCIDENTS.map((incident, index) => {
              const Icon = getIncidentIcon(incident.type)
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getIncidentColor(incident.type)} cursor-pointer hover:bg-opacity-30 transition-colors ${
                    incident.status === 'active' ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(incident.priority)}`}>
                          {incident.priority}
                        </span>
                        {incident.status === 'active' && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate">
                        {incident.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.time}
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
