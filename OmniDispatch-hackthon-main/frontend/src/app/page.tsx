'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Radio, 
  Activity, 
  MapPin, 
  Clock, 
  Shield, 
  Zap,
  Brain,
  Phone,
  AlertTriangle,
  Cpu,
  Network,
  Mic,
  Target,
  TrendingUp,
  Users,
  Globe,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Play,
  X,
  Flame,
  Heart,
  Car,
  Building,
  PhoneCall,
  Siren
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false)

  const emergencyContacts = [
    { name: 'Emergency Services', number: '911', icon: Siren, color: 'from-red-500 to-red-600', desc: 'Police, Fire, Medical - All emergencies' },
    { name: 'Fire Department', number: '911', icon: Flame, color: 'from-orange-500 to-red-500', desc: 'Fire emergencies & rescue operations' },
    { name: 'Police Department', number: '911', icon: Shield, color: 'from-blue-500 to-blue-600', desc: 'Law enforcement & crime reporting' },
    { name: 'Ambulance / EMS', number: '911', icon: Heart, color: 'from-pink-500 to-red-500', desc: 'Medical emergencies & paramedics' },
    { name: 'Poison Control', number: '1-800-222-1222', icon: AlertTriangle, color: 'from-purple-500 to-purple-600', desc: '24/7 poison emergency hotline' },
    { name: 'Highway Patrol', number: '*HP (*47)', icon: Car, color: 'from-amber-500 to-orange-500', desc: 'Road accidents & highway emergencies' },
    { name: 'Disaster Relief (FEMA)', number: '1-800-621-3362', icon: Building, color: 'from-teal-500 to-cyan-500', desc: 'Natural disaster assistance' },
    { name: 'Crisis Hotline', number: '988', icon: PhoneCall, color: 'from-green-500 to-emerald-500', desc: 'Mental health & suicide prevention' },
  ]

  const stats = [
    { label: 'AI Response Time', value: '<200ms', icon: Zap, desc: 'Lightning fast inference' },
    { label: 'Active Units', value: '47', icon: Radio, desc: 'Real-time tracking' },
    { label: 'AI Accuracy', value: '99.7%', icon: Target, desc: 'Precision dispatch' },
    { label: 'Uptime', value: '99.99%', icon: TrendingUp, desc: 'Always available' },
  ]

  const features = [
    {
      title: 'War Room',
      description: 'Live dispatch with voice-sync visualization and real-time tactical mapping',
      href: '/warroom',
      icon: Radio,
      color: 'from-red-500 to-orange-500',
      status: 'LIVE',
    },
    {
      title: 'Chronos Analytics',
      description: 'Predictive hotspotting and temporal correlation analysis',
      href: '/chronos',
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      status: 'ACTIVE',
    },
    {
      title: 'Guardian KB',
      description: 'Smart blueprints and 2026-standard safety protocols',
      href: '/guardian',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      status: 'READY',
    },
  ]

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Emergency Contacts Modal - Rendered at root level */}
      <AnimatePresence>
        {showEmergencyContacts && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowEmergencyContacts(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-5 text-center border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
                <button
                  onClick={() => setShowEmergencyContacts(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
                
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 mb-3 shadow-lg shadow-red-500/20">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Emergency Contacts</h3>
                <p className="text-xs text-zinc-500 mt-1">Tap any number to call</p>
              </div>

              {/* Alert */}
              <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <p className="text-xs text-red-400 font-medium">For life-threatening emergencies, call 911</p>
              </div>

              {/* Contacts */}
              <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
                {emergencyContacts.map((contact) => (
                  <a
                    key={contact.name}
                    href={`tel:${contact.number.replace(/[^0-9*#]/g, '')}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${contact.color} flex items-center justify-center flex-shrink-0`}>
                      <contact.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm">{contact.name}</h4>
                      <p className="text-[10px] text-zinc-500 truncate">{contact.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-orange-400">{contact.number}</span>
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Phone className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                <button
                  onClick={() => setShowEmergencyContacts(false)}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-background to-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
            <div className="absolute inset-0 rounded-full bg-orange-500/5 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-8 rounded-full bg-orange-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-16 rounded-full bg-orange-500/15 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-20">
          {/* Header */}
          <nav className="flex items-center justify-between mb-10 sm:mb-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">OmniDispatch</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Wafer-Scale Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-400">System Online</span>
              </div>
              <Button 
                variant="outline" 
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-xs sm:text-sm"
                onClick={() => setShowEmergencyContacts(true)}
              >
                <Phone className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Emergency Line</span>
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto px-2"
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6 sm:mb-8">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
              <span className="text-xs sm:text-sm text-orange-400">Powered by Cerebras Wafer-Scale Engine</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                Crisis Response
              </span>
              <br />
              <span className="text-white">at the Speed of Light</span>
            </h2>
            
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
              Sub-200ms AI reasoning. Multi-agent coordination. Predictive intelligence.
              The future of emergency dispatch is here.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/warroom">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  <Radio className="w-5 h-5 mr-2" />
                  Enter War Room
                </Button>
              </Link>
              <Link href="/chronos">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-orange-500/50 text-orange-400 hover:bg-orange-500/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  <Activity className="w-5 h-5 mr-2" />
                  History Analysis
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 sm:p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm hover:border-orange-500/50 transition-all">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mb-2 sm:mb-3" />
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm font-medium text-white/80">{stat.label}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
            <span className="text-xs sm:text-sm text-orange-400">Revolutionary Technology</span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            How OmniDispatch Works
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            From emergency call to dispatch in milliseconds — powered by cutting-edge AI
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { step: '01', title: 'Voice Input', desc: 'ElevenLabs ConvAI processes incoming emergency calls with real-time transcription', icon: Mic, color: 'from-red-500 to-orange-500' },
              { step: '02', title: 'AI Analysis', desc: 'Cerebras Wafer-Scale Engine analyzes situation in under 200ms', icon: Brain, color: 'from-orange-500 to-amber-500' },
              { step: '03', title: 'Multi-Agent Crew', desc: 'CrewAI agents collaborate to determine optimal response strategy', icon: Network, color: 'from-amber-500 to-yellow-500' },
              { step: '04', title: 'Smart Dispatch', desc: 'Resources deployed with tactical precision and real-time tracking', icon: Target, color: 'from-yellow-500 to-green-500' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="relative z-10 p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-orange-500/50 transition-all group">
                  <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30">
                    {item.step}
                  </div>
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-background to-amber-600/20" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-40 sm:w-72 h-40 sm:h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 p-8 sm:p-12 md:p-20 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 mb-6 sm:mb-8 shadow-2xl shadow-orange-500/30"
            >
              <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white ml-1" />
            </motion.div>
            
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              See It In Action
            </h3>
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Experience the future of emergency dispatch. Watch our AI process a live emergency call and coordinate response in real-time.
            </p>
            
            <Link href="/warroom">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group">
                <Radio className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Try Live Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Command Centers
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Three integrated modules working in perfect harmony to coordinate emergency response
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={feature.href}>
                <div className="group relative h-full">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity blur-xl`} />
                  <div className="relative h-full p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-orange-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${feature.color}`}>
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        feature.status === 'LIVE' ? 'bg-red-500/20 text-red-400' :
                        feature.status === 'ACTIVE' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {feature.status}
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Technology Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-900/20 to-amber-900/20 border border-orange-500/20 p-6 sm:p-8 lg:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Powered By The Best</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">Cutting-edge technologies working together to save lives</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[
                { name: 'ElevenLabs', desc: 'ConvAI 2.0 Voice Intelligence', icon: '🎙️', highlight: 'Real-time voice processing' },
                { name: 'Cerebras', desc: 'Sub-200ms AI Inference', icon: '🧠', highlight: 'Wafer-scale computing' },
                { name: 'CrewAI', desc: 'Multi-Agent Orchestration', icon: '🤖', highlight: 'Autonomous coordination' },
                { name: 'Three.js', desc: '3D Tactical Visualization', icon: '📊', highlight: 'Immersive blueprints' },
              ].map((tech, index) => (
                <motion.div 
                  key={tech.name} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-4 sm:p-6 rounded-xl bg-background/50 border border-border hover:border-orange-500/50 transition-all group"
                >
                  <span className="text-2xl sm:text-4xl mb-3 sm:mb-4 block group-hover:scale-110 transition-transform">{tech.icon}</span>
                  <h4 className="text-sm sm:text-lg font-semibold text-white">{tech.name}</h4>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mb-1 sm:mb-2 hidden sm:block">{tech.desc}</p>
                  <p className="text-[10px] sm:text-xs text-orange-400">{tech.highlight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why OmniDispatch Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4 sm:mb-6">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="text-xs sm:text-sm text-green-400">Built for the Future</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Why Choose OmniDispatch?
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8">
              Traditional dispatch systems are slow, error-prone, and can't scale. OmniDispatch brings AI-powered intelligence to emergency response, ensuring every second counts.
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              {[
                { title: '10x Faster Response', desc: 'AI processes calls instantly, eliminating human delay' },
                { title: 'Predictive Analytics', desc: 'Anticipate incidents before they escalate' },
                { title: 'Perfect Coordination', desc: 'Multi-agent AI ensures optimal resource allocation' },
                { title: 'Real-Time Visibility', desc: '3D tactical maps and live unit tracking' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card/50 border border-border hover:border-orange-500/50 transition-all"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-white">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl sm:rounded-3xl blur-3xl" />
            <div className="relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:space-y-0 lg:grid-cols-1 lg:gap-6">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <Cpu className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">850 TOPS</p>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">Cerebras Power</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">Global</p>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">Any deployment</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">5 Agents</p>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">Perfect harmony</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-white">Voice AI</p>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">ElevenLabs</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative z-10 p-8 sm:p-12 md:p-20 text-center">
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Transform Emergency Response?
            </h3>
            <p className="text-sm sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join the revolution in crisis management. Experience the power of AI-driven dispatch today.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/warroom">
                <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-white/90 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold">
                  <Radio className="w-5 h-5 mr-2" />
                  Launch War Room
                </Button>
              </Link>
              <Link href="/guardian">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/50 text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Explore Guardian
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">OmniDispatch</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Wafer-Scale Intelligence</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Revolutionizing emergency response with AI-powered dispatch technology.
              </p>
            </div>
            <div>
              <h5 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">Modules</h5>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link href="/warroom" className="hover:text-orange-400 transition-colors">War Room</Link></li>
                <li><Link href="/chronos" className="hover:text-orange-400 transition-colors">Chronos Analytics</Link></li>
                <li><Link href="/guardian" className="hover:text-orange-400 transition-colors">Guardian KB</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">Technology</h5>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Cerebras Inference</li>
                <li>ElevenLabs ConvAI</li>
                <li>CrewAI Agents</li>
                <li>Three.js Visualization</li>
              </ul>
            </div>
            <div className="hidden md:block">
              <h5 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">Built With</h5>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Next.js 14</li>
                <li>FastAPI</li>
                <li>ChromaDB</li>
                <li>Framer Motion</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
              OmniDispatch © 2026 • Built for the future of emergency response
            </p>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-green-400">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
