"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  AlertTriangle,
  Shield,
  Flame,
  HeartPulse,
  Radio,
  Zap,
  MapPin,
  Clock,
  Users,
  Brain,
  Waves,
  Loader2,
  CheckCircle2,
  Truck,
  Timer,
  Activity,
  X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Types
interface Message {
  id: string;
  type: "system" | "caller" | "dispatch";
  content: string;
  timestamp: Date;
}

interface Responder {
  id: string;
  type: "fire" | "medical" | "police";
  unit: string;
  status: "available" | "responding" | "on-scene";
  lat: number;
  lng: number;
  destination?: { lat: number; lng: number };
  eta_minutes?: number;
}

interface Incident {
  id: string;
  type: string;
  priority: string;
  description: string;
  location: { lat: number; lng: number };
  dispatched_units: any[];
  status: string;
  created_at?: string;
}

interface NearbyPlace {
  name: string;
  type: string;
  lat: number;
  lng: number;
  distance: number;
}

// Dynamic import for the map
const DispatchMap = dynamic(() => import("@/components/dispatch/dispatch-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-orange-500" />
        </motion.div>
        <span className="text-orange-400 font-medium">Loading Map...</span>
      </div>
    </div>
  ),
});

export default function WarRoom() {
  // State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [aiSteps, setAiSteps] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callAbortedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAITextRef = useRef<string>(""); // Track what AI just said for echo detection
  const speechStartTimeRef = useRef<number>(0); // When user started speaking
  const processEmergencyRef = useRef<((text: string) => void) | null>(null);
  const endCallRef = useRef<(() => void) | null>(null); // Ref to end call function

  // Fix hydration: Only render time on client
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCallActive]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get user location and initialize responders nearby
  useEffect(() => {
    const initLocation = async (lat: number, lng: number) => {
      setUserLocation({ lat, lng });
      // Initialize responders near user's location
      try {
        await fetch("http://localhost:8000/api/responders/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        fetchResponders();
      } catch (err) {
        console.error("Failed to init responders:", err);
        fetchResponders();
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initLocation(pos.coords.latitude, pos.coords.longitude),
        () => initLocation(17.385, 78.4867) // Fallback location
      );
    } else {
      initLocation(17.385, 78.4867);
    }
  }, []);

  // WebSocket
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws");
      ws.onopen = () => {
        setIsConnected(true);
      };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "initial_state") {
          setResponders(data.responders || []);
          setIncidents(data.incidents || []);
        } else if (data.type === "new_incident") {
          setIncidents((prev) => [...prev, data.incident]);
          fetchResponders();
        } else if (data.type === "responder_update") {
          setResponders(data.responders || []);
        } else if (data.type === "incidents_cleared") {
          setIncidents([]);
          fetchResponders();
        }
      };
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const fetchResponders = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/responders");
      const data = await res.json();
      setResponders(data.responders || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const addMessage = useCallback((type: Message["type"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type, content, timestamp: new Date() },
    ]);
  }, []);

  // Stop AI audio immediately (manual stop button)
  const stopAIAudio = useCallback(() => {
    // Clear the queue
    audioQueueRef.current = [];
    
    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    isPlayingRef.current = false;
    setIsAISpeaking(false);
  }, []);

  // ElevenLabs TTS - Gemini Live style (mic stays on for barge-in)
  const playAudio = useCallback(async (text: string) => {
    if (!isSpeakerOn || callAbortedRef.current) return;
    
    // Store what AI is about to say (for echo detection)
    lastAITextRef.current = text.toLowerCase();
    
    audioQueueRef.current.push(text);
    if (isPlayingRef.current) return;

    const processQueue = async () => {
      while (audioQueueRef.current.length > 0 && !callAbortedRef.current) {
        isPlayingRef.current = true;
        setIsAISpeaking(true);
        const currentText = audioQueueRef.current.shift()!;
        lastAITextRef.current = currentText.toLowerCase();

        if (callAbortedRef.current) break;

        try {
          const res = await fetch("http://localhost:8000/api/voice/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: currentText }),
          });
          if (callAbortedRef.current) break;
          const data = await res.json();
          if (data.success && data.audio && !callAbortedRef.current) {
            const blob = new Blob(
              [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
              { type: "audio/mpeg" }
            );
            await new Promise<void>((resolve) => {
              if (callAbortedRef.current) { resolve(); return; }
              const audio = new Audio(URL.createObjectURL(blob));
              currentAudioRef.current = audio;
              audio.onended = () => { 
                currentAudioRef.current = null; 
                resolve(); 
              };
              audio.onerror = () => { currentAudioRef.current = null; resolve(); };
              audio.play().catch(() => { currentAudioRef.current = null; resolve(); });
            });
          }
        } catch (err) {
          console.error("TTS error:", err);
        }
      }
      isPlayingRef.current = false;
      setIsAISpeaking(false);
      lastAITextRef.current = ""; // Clear echo detection
    };
    processQueue();
  }, [isSpeakerOn]);

  // Process emergency - JARVIS-powered conversation
  const processEmergency = useCallback(async (transcript: string) => {
    if (!transcript.trim() || !userLocation) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsProcessing(true);
    setAiSteps(["🤖 JARVIS analyzing..."]);

    try {
      // Check if aborted
      if (callAbortedRef.current) {
        setIsProcessing(false);
        setAiSteps([]);
        return;
      }
      
      await new Promise((r) => setTimeout(r, 150));
      if (callAbortedRef.current) return;
      setAiSteps((p) => [...p, "🧠 Understanding your situation..."]);

      const res = await fetch("http://localhost:8000/api/emergency/process-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          caller_location: { lat: userLocation.lat, lng: userLocation.lng },
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check if call was aborted during fetch
      if (callAbortedRef.current) {
        setIsProcessing(false);
        setAiSteps([]);
        return;
      }

      const data = await res.json();

      if (callAbortedRef.current) {
        setIsProcessing(false);
        setAiSteps([]);
        return;
      }

      if (data.success) {
        addMessage("dispatch", data.message);
        if (!callAbortedRef.current) {
          playAudio(data.message);
        }
        // Only fetch responders and places on first message (when units dispatched)
        if (data.dispatched_units && data.dispatched_units.length > 0) {
          fetchResponders();
        }
        if (data.nearby_services && data.nearby_services.length > 0) {
          setNearbyPlaces(data.nearby_services);
        }
      } else {
        addMessage("system", "⚠️ Error processing. Please try again.");
      }
    } catch (err: any) {
      // Don't show error if it was aborted intentionally
      if (err.name !== 'AbortError' && !callAbortedRef.current) {
        addMessage("system", "⚠️ Connection error. Check if backend is running.");
      }
    } finally {
      setIsProcessing(false);
      setAiSteps([]);
    }
  }, [userLocation, addMessage, playAudio]);

  // Store processEmergency in ref for recognition callback
  useEffect(() => {
    processEmergencyRef.current = processEmergency;
  }, [processEmergency]);

  // Helper: Check if speech is echo of AI (similar to what AI just said)
  const isEchoOfAI = useCallback((text: string): boolean => {
    if (!lastAITextRef.current) return false;
    const normalizedInput = text.toLowerCase().trim();
    const normalizedAI = lastAITextRef.current.toLowerCase();
    
    // Check if input contains significant portions of AI text (echo)
    const words = normalizedInput.split(' ').filter(w => w.length > 3);
    const aiWords = normalizedAI.split(' ').filter(w => w.length > 3);
    
    if (words.length === 0) return false;
    
    let matchCount = 0;
    for (const word of words) {
      if (aiWords.includes(word)) matchCount++;
    }
    
    // If more than 50% of words match AI text, it's likely echo
    return (matchCount / words.length) > 0.5;
  }, []);

  // GEMINI LIVE STYLE: Continuous listening with smart barge-in
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      addMessage("system", "⚠️ Please use Chrome for voice input.");
      return;
    }
    
    if (recognitionRef.current) return; // Already listening

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript("");
      console.log("🎤 Recognition started");
    };

    recognition.onresult = (e: any) => {
      let interim = "";
      let final = "";
      let confidence = 0;
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const t = result[0].transcript;
        confidence = result[0].confidence || 0.8;
        
        if (result.isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      
      // Check for END CALL commands (works even while AI is speaking)
      const textToCheck = (final || interim).toLowerCase().trim();
      const endCallPhrases = ['stop', 'stop it', 'shut up', 'be quiet', 'enough', 'okay stop', 'please stop', 
                              'stop talking', 'end call', 'hang up', 'end', 'thanks', 'thank you', 'bye', 
                              'goodbye', 'that\'s all', 'i\'m done', 'done', 'ok thanks', 'okay thanks'];
      const isEndCommand = endCallPhrases.some(phrase => textToCheck === phrase || textToCheck.startsWith(phrase + ' ') || textToCheck.endsWith(' ' + phrase));
      
      if (isEndCommand && !isEchoOfAI(textToCheck)) {
        console.log("📴 END CALL COMMAND detected:", textToCheck);
        setCurrentTranscript("");
        // End the call - triggers the red button action
        if (endCallRef.current) {
          endCallRef.current();
        }
        return;
      }
      
      // If AI is speaking, check for BARGE-IN
      if (isPlayingRef.current || currentAudioRef.current) {
        // Need significant speech (10+ chars with high confidence) to interrupt
        const potentialBargeIn = interim.length >= 10 || (final && final.length >= 5);
        
        if (potentialBargeIn && confidence > 0.75) {
          const speechText = final || interim;
          
          // Make sure it's not echo
          if (!isEchoOfAI(speechText)) {
            console.log("🛑 BARGE-IN: User interrupted, stopping AI");
            stopAIAudio();
            speechStartTimeRef.current = Date.now();
          }
        }
        
        // Show what we're hearing but don't process yet if echo
        if (interim && !isEchoOfAI(interim)) {
          setCurrentTranscript(interim);
        }
        return; // Don't process while AI is speaking (wait for barge-in to complete)
      }
      
      // AI is not speaking - normal processing
      if (final && final.trim().length > 0) {
        // Skip if it's echo of what AI just said
        if (isEchoOfAI(final)) {
          console.log("🔇 Ignoring echo:", final);
          setCurrentTranscript("");
          return;
        }
        
        setCurrentTranscript("");
        addMessage("caller", final.trim());
        
        if (processEmergencyRef.current) {
          processEmergencyRef.current(final.trim());
        }
      } else if (interim) {
        // Only show interim if it's not echo
        if (!isEchoOfAI(interim)) {
          setCurrentTranscript(interim);
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.log("Speech error:", e.error);
      // Don't stop on no-speech errors, just continue
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setIsListening(false);
      }
    };
    
    recognition.onend = () => {
      console.log("🎤 Recognition ended, restarting...");
      recognitionRef.current = null;
      
      // Auto-restart to keep listening (Gemini Live style)
      if (isCallActive && !isMuted && !callAbortedRef.current) {
        setTimeout(() => {
          if (!recognitionRef.current && isCallActive) {
            try {
              const newRecognition = new SpeechRecognition();
              newRecognition.continuous = true;
              newRecognition.interimResults = true;
              newRecognition.lang = "en-US";
              newRecognition.onstart = recognition.onstart;
              newRecognition.onresult = recognition.onresult;
              newRecognition.onerror = recognition.onerror;
              newRecognition.onend = recognition.onend;
              recognitionRef.current = newRecognition;
              newRecognition.start();
            } catch (err) {
              console.log("Recognition restart failed");
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.log("Recognition start failed:", e);
    }
  }, [isCallActive, isMuted, addMessage, isEchoOfAI, stopAIAudio]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setCurrentTranscript("");
  }, []);

  const startCall = useCallback(() => {
    // Reset abort flag
    callAbortedRef.current = false;
    audioQueueRef.current = [];
    
    setIsCallActive(true);
    setMessages([]);
    setIncidents([]);
    setNearbyPlaces([]);

    // Reset conversation on backend for fresh JARVIS context
    fetch("http://localhost:8000/api/call/reset", { method: "POST" }).catch(() => {});
    fetch("http://localhost:8000/api/incidents/clear", { method: "POST" }).catch(() => {});

    addMessage("system", "🚨 Emergency line active. JARVIS AI ready to assist.");
    
    // Start listening immediately
    startListening();
    
    // Play greeting
    const greeting = "911 Emergency. I'm JARVIS, your AI assistant. Tell me what's happening and I'll help you through this.";
    addMessage("dispatch", greeting);
    playAudio(greeting);
  }, [addMessage, playAudio, startListening]);

  const endCall = useCallback(() => {
    // Set abort flag FIRST to stop all audio and processing immediately
    callAbortedRef.current = true;
    
    // Abort any ongoing API requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    // Clear the audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsAISpeaking(false);
    
    // Clear processing state
    setIsProcessing(false);
    setAiSteps([]);
    
    // Stop listening
    stopListening();
    setIsCallActive(false);
    setCurrentTranscript("");
    
    // Just show system message, NO audio on end
    addMessage("system", "📴 Call ended. Emergency services have been notified.");
  }, [stopListening, addMessage]);

  // Store endCall in ref so voice recognition can access it
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) stopListening();
      else if (isCallActive) startListening();
      return !prev;
    });
  }, [isCallActive, stopListening, startListening]);

  const clearIncidents = async () => {
    try {
      await fetch("http://localhost:8000/api/incidents/clear", { method: "POST" });
      setIncidents([]);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const respondersReady = responders.filter((r) => r.status === "available").length;
  const respondersActive = responders.filter((r) => r.status === "responding").length;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-orange-500/30 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
                animate={{ boxShadow: ["0 0 15px rgba(249,115,22,0.3)", "0 0 30px rgba(249,115,22,0.5)", "0 0 15px rgba(249,115,22,0.3)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-5 h-5" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-orange-400">OmniDispatch</h1>
                <p className="text-[10px] text-gray-500">AI Emergency Response</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              <motion.div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {isConnected ? "CONNECTED" : "OFFLINE"}
            </div>

            {/* Time - Only render on client */}
            {currentTime && (
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {currentTime}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-14 h-screen flex">
        {/* Left - Call Interface */}
        <div className="w-[380px] border-r border-gray-800 flex flex-col bg-gradient-to-b from-gray-950 to-black">
          {/* Call Controls */}
          <div className="p-5 border-b border-gray-800">
            {/* Call Status */}
            {isCallActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-red-500"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-red-400 font-medium">CALL ACTIVE</span>
                </div>
                <span className="text-red-300 font-mono text-lg">{formatDuration(callDuration)}</span>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-center gap-5">
              <motion.button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                  isSpeakerOn ? "border-gray-600 text-gray-300" : "border-red-500 text-red-400 bg-red-500/10"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </motion.button>

              <motion.button
                onClick={isCallActive ? endCall : startCall}
                className={`w-18 h-18 rounded-full flex items-center justify-center shadow-xl ${
                  isCallActive
                    ? "bg-gradient-to-br from-red-500 to-red-700"
                    : "bg-gradient-to-br from-green-500 to-green-700"
                }`}
                style={{ width: "72px", height: "72px" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={isCallActive ? {
                  boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 15px rgba(239,68,68,0)"]
                } : {
                  boxShadow: ["0 0 20px rgba(34,197,94,0.3)", "0 0 40px rgba(34,197,94,0.5)", "0 0 20px rgba(34,197,94,0.3)"]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isCallActive ? <PhoneOff className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
              </motion.button>

              <motion.button
                onClick={toggleMute}
                disabled={!isCallActive}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                  !isCallActive ? "border-gray-700 text-gray-600 cursor-not-allowed" :
                  isMuted ? "border-red-500 text-red-400 bg-red-500/10" : "border-gray-600 text-gray-300"
                }`}
                whileHover={isCallActive ? { scale: 1.1 } : {}}
                whileTap={isCallActive ? { scale: 0.9 } : {}}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Voice Indicator */}
            <AnimatePresence>
              {(isListening || isAISpeaking) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className={`flex items-center justify-center gap-3 py-3 rounded-lg ${
                    isAISpeaking ? "bg-orange-500/10 border border-orange-500/30" : "bg-green-500/10 border border-green-500/30"
                  }`}>
                    <div className="flex items-end gap-1 h-6">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`w-1 rounded-full ${isAISpeaking ? "bg-orange-500" : "bg-green-500"}`}
                          animate={{ height: [4, 16 + Math.random() * 8, 4] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isAISpeaking ? "text-orange-400" : "text-green-400"}`}>
                        {isAISpeaking ? "🔊 AI Speaking" : "🎤 Listening..."}
                      </span>
                      {isAISpeaking && isListening && (
                        <span className="text-xs text-orange-300/70">Speak to interrupt</span>
                      )}
                    </div>
                    {/* Stop AI Button - visible when AI is speaking */}
                    {isAISpeaking && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopAIAudio}
                        className="ml-2 px-2 py-1 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors text-xs font-medium"
                        title="Stop AI"
                      >
                        ⏹ Stop
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Transcript */}
            {currentTranscript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
              >
                <p className="text-blue-300 text-sm italic">"{currentTranscript}"</p>
              </motion.div>
            )}
          </div>

          {/* AI Processing */}
          <AnimatePresence>
            {aiSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-4 bg-purple-900/20 border-b border-purple-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                    <Brain className="w-4 h-4 text-purple-400" />
                  </motion.div>
                  <span className="text-purple-400 font-medium text-sm">AI Processing</span>
                </div>
                <div className="space-y-1">
                  {aiSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-purple-300/80"
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl ${
                    msg.type === "dispatch"
                      ? "bg-gray-800/80 border border-orange-500/40"
                      : msg.type === "caller"
                      ? "bg-orange-600/30 border border-orange-400/50 ml-6"
                      : "bg-gray-900/60 border border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === "dispatch" && <Radio className="w-3 h-3 text-orange-400" />}
                    {msg.type === "caller" && <Mic className="w-3 h-3 text-orange-300" />}
                    {msg.type === "system" && <Zap className="w-3 h-3 text-yellow-400" />}
                    <span className={`text-xs font-bold uppercase ${
                      msg.type === "dispatch" ? "text-orange-400" : 
                      msg.type === "caller" ? "text-orange-300" : "text-yellow-400"
                    }`}>
                      {msg.type === "dispatch" ? "AI DISPATCH" : msg.type === "caller" ? "YOU" : "SYSTEM"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{msg.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative">
          <DispatchMap
            responders={responders}
            incidents={incidents}
            nearbyPlaces={nearbyPlaces}
            userLocation={userLocation}
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-black/90 rounded-xl p-3 border border-gray-700">
            <div className="space-y-2 text-xs">
              {[
                { color: "bg-red-500", label: "Emergency", pulse: true },
                { color: "bg-orange-500", label: "Fire Unit" },
                { color: "bg-green-500", label: "Medical" },
                { color: "bg-blue-500", label: "Police" },
                { color: "bg-cyan-400", label: "You" },
              ].map((i) => (
                <div key={i.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${i.color}`} />
                  <span className="text-gray-400">{i.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Status Panel */}
        <div className="w-[320px] border-l border-gray-800 flex flex-col bg-gradient-to-b from-gray-950 to-black">
          {/* Responders Summary */}
          <div className="p-4 border-b border-gray-800">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <div className="text-2xl font-bold text-green-400">{respondersReady}</div>
                <div className="text-xs text-green-400/70">READY</div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                <div className="text-2xl font-bold text-orange-400">{respondersActive}</div>
                <div className="text-xs text-orange-400/70">RESPONDING</div>
              </div>
            </div>
          </div>

          {/* Active Incidents */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="font-medium text-gray-200">Active Incidents</span>
              </div>
              {incidents.length > 0 && (
                <button
                  onClick={clearIncidents}
                  className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No active incidents
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {incidents.map((inc) => (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-gradient-to-r from-red-900/40 to-orange-900/20 border border-red-500/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inc.priority === "critical" ? "bg-red-500 text-white" :
                        inc.priority === "high" ? "bg-orange-500 text-white" : "bg-yellow-500 text-black"
                      }`}>
                        {inc.priority?.toUpperCase() || "MEDIUM"}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{inc.type}</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-1 line-clamp-1">{inc.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Truck className="w-3 h-3 text-orange-400" />
                      <span className="text-orange-300">{inc.dispatched_units?.length || 0} units en route</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Responders List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-200">Units</span>
            </div>

            <div className="space-y-2">
              {responders.map((r) => {
                const Icon = r.type === "fire" ? Flame : r.type === "medical" ? HeartPulse : Shield;
                const colors = {
                  fire: "text-orange-400 bg-orange-500/20",
                  medical: "text-green-400 bg-green-500/20",
                  police: "text-blue-400 bg-blue-500/20",
                }[r.type];

                return (
                  <motion.div
                    key={r.id}
                    className={`p-3 rounded-lg border ${
                      r.status === "responding"
                        ? "bg-orange-900/30 border-orange-500/50"
                        : "bg-gray-800/50 border-gray-700/50"
                    }`}
                    animate={r.status === "responding" ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{r.unit}</div>
                        <div className="text-xs text-gray-500 capitalize">{r.type}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        r.status === "available" ? "bg-green-500/20 text-green-400" :
                        r.status === "responding" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {r.status === "responding" && r.eta_minutes && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {r.eta_minutes}m
                          </span>
                        )}
                        {r.status === "available" && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Nearby Services */}
          {nearbyPlaces.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Nearby Services</span>
              </div>
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {nearbyPlaces.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-gray-800/50 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-gray-300 truncate flex-1">{p.name}</span>
                    <span className="text-gray-500">{p.distance}km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-900/30 to-gray-900/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xs text-gray-500">Response</div>
                  <div className="text-lg font-bold text-green-400">&lt;200ms</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Powered by</div>
                <div className="text-sm font-bold text-orange-400">Cerebras</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
