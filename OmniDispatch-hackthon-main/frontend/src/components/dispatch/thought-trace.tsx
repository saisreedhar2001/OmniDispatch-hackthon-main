'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

interface ThoughtEntry {
  id: number
  type: 'thinking' | 'search' | 'action' | 'result'
  agent: 'intake' | 'historian' | 'orchestrator'
  content: string
  timestamp: Date
}

const AGENT_COLORS = {
  intake: 'text-blue-400',
  historian: 'text-purple-400',
  orchestrator: 'text-green-400',
}

const AGENT_NAMES = {
  intake: 'Empathetic Intake',
  historian: 'Incident Historian',
  orchestrator: 'Strategic Orchestrator',
}

const SAMPLE_THOUGHTS: Omit<ThoughtEntry, 'id' | 'timestamp'>[] = [
  { type: 'thinking', agent: 'intake', content: 'Analyzing caller voice patterns... stress indicators detected' },
  { type: 'search', agent: 'historian', content: 'Querying RAG: similar incidents at 123 Main St' },
  { type: 'result', agent: 'historian', content: 'Found 2 previous fire incidents in building (2024, 2025)' },
  { type: 'thinking', agent: 'intake', content: 'Extracting key phrases: "smoke", "3rd floor", "trapped"' },
  { type: 'action', agent: 'orchestrator', content: 'Dispatching Engine 7 and Ladder 3 to location' },
  { type: 'search', agent: 'historian', content: 'Loading building blueprints from knowledge base...' },
  { type: 'result', agent: 'historian', content: 'Blueprint found: 5-story residential, 3 stairwells' },
  { type: 'action', agent: 'orchestrator', content: 'Notifying hospitals: Metro General, City Medical' },
  { type: 'thinking', agent: 'intake', content: 'Caller reports multiple people on floor. Escalating priority.' },
  { type: 'action', agent: 'orchestrator', content: 'Upgrading to Multi-Victim Incident protocol' },
]

interface ThoughtTraceProps {
  isActive: boolean
}

export function ThoughtTrace({ isActive }: ThoughtTraceProps) {
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) {
      setThoughts([])
      setCurrentIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev >= SAMPLE_THOUGHTS.length - 1 ? 0 : prev + 1
        const newThought: ThoughtEntry = {
          id: Date.now(),
          ...SAMPLE_THOUGHTS[nextIndex],
          timestamp: new Date(),
        }
        setThoughts(current => [...current.slice(-15), newThought])
        return nextIndex
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [isActive])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thoughts])

  const getIcon = (type: ThoughtEntry['type']) => {
    switch (type) {
      case 'thinking':
        return <Loader2 className="w-3 h-3 animate-spin" />
      case 'search':
        return <Search className="w-3 h-3" />
      case 'action':
        return <AlertTriangle className="w-3 h-3" />
      case 'result':
        return <CheckCircle className="w-3 h-3" />
    }
  }

  return (
    <div className="relative">
      <ScrollArea className="h-[300px]" ref={scrollRef}>
        <div className="space-y-2 font-mono text-xs p-2">
          {!isActive ? (
            <div className="flex items-center justify-center h-full text-muted-foreground py-12">
              <Brain className="w-5 h-5 mr-2 opacity-50" />
              <span>Waiting for active call...</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {thoughts.map((thought) => (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 p-2 rounded bg-secondary/30 border border-border/50"
                >
                  <div className={`mt-0.5 ${AGENT_COLORS[thought.agent]}`}>
                    {getIcon(thought.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${AGENT_COLORS[thought.agent]}`}>
                        [{AGENT_NAMES[thought.agent]}]
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {thought.timestamp.toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground break-words">
                      {thought.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
      
      {/* Processing indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      )}
    </div>
  )
}
