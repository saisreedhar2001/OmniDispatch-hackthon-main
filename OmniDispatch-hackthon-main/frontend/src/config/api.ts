// API Configuration - dynamically selects based on environment
export const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    // Server-side (shouldn't happen in client components)
    return "http://localhost:8000";
  }

  // Production URL
  if (window.location.hostname === "omni-dispatch-hackthon-main.vercel.app") {
    return "https://omnidispatch-hackthon.onrender.com";
  }

  // Localhost development
  return "http://localhost:8000";
};

export const getWsUrl = (): string => {
  if (typeof window === "undefined") {
    return "ws://localhost:8000/ws";
  }

  // Production WebSocket (must use wss:// for HTTPS)
  if (window.location.hostname === "omni-dispatch-hackthon-main.vercel.app") {
    return "wss://omnidispatch-hackthon.onrender.com/ws";
  }

  // Local WebSocket
  return "ws://localhost:8000/ws";
};

export const API_ENDPOINTS = {
  RESPONDERS_INIT: (baseUrl: string) => `${baseUrl}/api/responders/init`,
  RESPONDERS: (baseUrl: string) => `${baseUrl}/api/responders`,
  VOICE_SPEAK: (baseUrl: string) => `${baseUrl}/api/voice/speak`,
  EMERGENCY_PROCESS: (baseUrl: string) => `${baseUrl}/api/emergency/process-full`,
  CALL_RESET: (baseUrl: string) => `${baseUrl}/api/call/reset`,
  INCIDENTS_CLEAR: (baseUrl: string) => `${baseUrl}/api/incidents/clear`,
  GUARDIAN_SEARCH: (baseUrl: string) => `${baseUrl}/api/guardian/search-location`,
  GUARDIAN_BUILDING: (baseUrl: string) => `${baseUrl}/api/guardian/building-details`,
  CHRONOS_ANALYZE: (baseUrl: string) => `${baseUrl}/api/chronos/analyze`,
};
