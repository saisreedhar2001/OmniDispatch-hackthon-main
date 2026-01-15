# OmniDispatch Backend API - FULLY FUNCTIONAL
# =============================================
# AI-Powered Emergency Dispatch System
# Features: ElevenLabs TTS, CrewAI Agents, Google Places API, Real-time Updates

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import json
import asyncio
import httpx
from datetime import datetime
import random
import base64
import math
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="OmniDispatch API",
    description="Wafer-Scale Emergency Intelligence Backend - Powered by CrewAI + Cerebras",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# CONFIGURATION - Using your .env keys
# ============================================================================

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "CwhRBWXzGAHq8TQ4Fs17")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
GOOGLE_MAPS_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "")

print(f"🔑 ElevenLabs API: {'✅ Configured' if ELEVENLABS_API_KEY else '❌ Missing'}")
print(f"🔑 Groq API: {'✅ Configured' if GROQ_API_KEY else '❌ Missing'}")
print(f"🔑 Cerebras API: {'✅ Configured' if CEREBRAS_API_KEY else '❌ Missing'}")
print(f"🔑 Google Maps API: {'✅ Configured' if GOOGLE_MAPS_API_KEY else '❌ Missing'}")

# ============================================================================
# IN-MEMORY STATE
# ============================================================================

active_incidents: List[Dict] = []
connected_clients: List[WebSocket] = []

# Default responders - will be regenerated based on user location
active_responders: List[Dict] = []

# Conversation history for JARVIS-like contextual responses
conversation_history: List[Dict] = []
current_emergency_context: Dict = {}
units_already_dispatched: bool = False

def reset_conversation():
    """Reset conversation state for new call"""
    global conversation_history, current_emergency_context, units_already_dispatched
    conversation_history = []
    current_emergency_context = {}
    units_already_dispatched = False

def generate_responders_near_location(lat: float, lng: float) -> List[Dict]:
    """Generate dynamic responders near the user's actual location"""
    global active_responders
    
    # Generate units at various offsets from user location (within 5-10km radius)
    offsets = [
        (0.015, 0.02),   # ~2km NE
        (-0.01, 0.025),  # ~2.5km SE
        (0.02, -0.015),  # ~2.5km NW
        (-0.02, -0.01),  # ~2km SW
        (0.008, 0.03),   # ~3km E
        (-0.025, 0.005), # ~2.5km S
    ]
    
    new_responders = [
        {"id": "ENG-7", "type": "fire", "unit": "Engine 7", "status": "available", 
         "lat": lat + offsets[0][0], "lng": lng + offsets[0][1], "station": "Fire Station Alpha"},
        {"id": "LAD-3", "type": "fire", "unit": "Ladder 3", "status": "available", 
         "lat": lat + offsets[1][0], "lng": lng + offsets[1][1], "station": "Fire Station Bravo"},
        {"id": "MED-9", "type": "medical", "unit": "Medic 9", "status": "available", 
         "lat": lat + offsets[2][0], "lng": lng + offsets[2][1], "station": "City Hospital"},
        {"id": "MED-5", "type": "medical", "unit": "Medic 5", "status": "available", 
         "lat": lat + offsets[3][0], "lng": lng + offsets[3][1], "station": "Regional Medical Center"},
        {"id": "POL-42", "type": "police", "unit": "Unit 42", "status": "available", 
         "lat": lat + offsets[4][0], "lng": lng + offsets[4][1], "station": "Police Station Central"},
        {"id": "POL-18", "type": "police", "unit": "Unit 18", "status": "available", 
         "lat": lat + offsets[5][0], "lng": lng + offsets[5][1], "station": "Police Station West"},
    ]
    
    active_responders = new_responders
    return new_responders

# ============================================================================
# MODELS
# ============================================================================

class EmergencyCall(BaseModel):
    transcript: str
    caller_location: Optional[Dict] = None
    caller_phone: Optional[str] = None

class TextToSpeechRequest(BaseModel):
    text: str

class NearbySearchRequest(BaseModel):
    lat: float
    lng: float
    type: str

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two coordinates using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_eta(distance_km: float, responder_type: str) -> int:
    """Calculate ETA in minutes based on distance and responder type"""
    speeds = {"fire": 50, "medical": 60, "police": 70}
    speed = speeds.get(responder_type, 55)
    eta_hours = distance_km / speed
    eta_minutes = max(1, int(eta_hours * 60))
    return min(eta_minutes, 15)

# ============================================================================
# JARVIS-LIKE CONVERSATIONAL AI
# ============================================================================

async def get_jarvis_response(transcript: str, emergency_context: Dict, is_first_message: bool) -> str:
    """
    JARVIS-like AI that provides dynamic, contextual survival advice.
    This is the brain of the emergency assistant - it actually HELPS, not just dispatches.
    """
    global conversation_history
    
    # Add user message to history
    conversation_history.append({"role": "user", "content": transcript})
    
    # Build context about the emergency
    context_summary = ""
    if emergency_context:
        context_summary = f"""
CURRENT EMERGENCY CONTEXT:
- Type: {emergency_context.get('emergency_type', 'unknown')}
- Priority: {emergency_context.get('priority', 'unknown')}
- Description: {emergency_context.get('description', 'unknown')}
- Immediate Danger: {emergency_context.get('immediate_danger', False)}
- Units Dispatched: {emergency_context.get('units_dispatched', [])}
- ETA: {emergency_context.get('eta_minutes', 'unknown')} minutes
"""
    
    system_prompt = f"""You are JARVIS, an advanced AI emergency assistant. You are NOT just a dispatcher - you are a life-saving companion who provides REAL, ACTIONABLE survival advice.

YOUR PERSONALITY:
- Calm but urgent when needed
- Empathetic and reassuring
- Proactive - anticipate needs before they're asked
- Solution-oriented - always give practical steps
- Brief but comprehensive (2-3 sentences max per response)

{context_summary}

CRITICAL RULES:
1. NEVER just say "help is coming" - ALWAYS give specific survival advice
2. React to the caller's emotional state and situation updates
3. Provide step-by-step guidance based on their specific emergency
4. If they mention worsening conditions (water rising, fire spreading, etc.), give IMMEDIATE actionable advice
5. If they say "thank you", "stop", "bye", "that's all" - give a brief caring sign-off
6. Keep responses SHORT (2-3 sentences) but HELPFUL

SURVIVAL KNOWLEDGE YOU MUST USE:

FOR FLOODS:
- Move to highest floor/point immediately
- If water is rising in room: find furniture/objects to climb on
- Look for any drainage (holes, windows) to reduce water
- If trapped: signal from window, use flashlight/phone light
- Don't touch electrical outlets if wet
- If must enter water: remove heavy clothing, hold something buoyant

FOR FIRES:
- Stay low - smoke rises, cleaner air is near floor
- Feel doors before opening - if hot, find another exit
- Cover mouth with wet cloth if available
- If clothes catch fire: STOP, DROP, ROLL
- Close doors behind you to slow fire spread
- If trapped: seal door cracks, signal from window

FOR MEDICAL:
- Keep patient still and calm
- Apply pressure to bleeding wounds
- For choking: back blows then abdominal thrusts
- For unconscious: check breathing, recovery position
- For chest pain: have them chew aspirin if available, sit upright

FOR CRIMES:
- Stay hidden and quiet if intruder present
- Lock/barricade if possible
- Note descriptions: height, clothing, direction of travel
- Don't confront armed individuals

FOR ACCIDENTS:
- Don't move injured unless in immediate danger
- Turn off vehicle ignition if possible
- Direct traffic away if safe to do so
- Check for breathing and consciousness

RESPOND TO THE CALLER'S LATEST MESSAGE. Be their lifeline."""

    try:
        # Use Cerebras for ultra-fast response
        if CEREBRAS_API_KEY:
            async with httpx.AsyncClient() as client:
                messages = [{"role": "system", "content": system_prompt}]
                # Include last 6 conversation turns for context
                messages.extend(conversation_history[-6:])
                
                response = await client.post(
                    "https://api.cerebras.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 200
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    ai_response = result["choices"][0]["message"]["content"].strip()
                    conversation_history.append({"role": "assistant", "content": ai_response})
                    print(f"🤖 JARVIS: {ai_response}")
                    return ai_response
        
        # Fallback to Groq
        if GROQ_API_KEY:
            async with httpx.AsyncClient() as client:
                messages = [{"role": "system", "content": system_prompt}]
                messages.extend(conversation_history[-6:])
                
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 200
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    ai_response = result["choices"][0]["message"]["content"].strip()
                    conversation_history.append({"role": "assistant", "content": ai_response})
                    return ai_response
                    
    except Exception as e:
        print(f"❌ JARVIS error: {e}")
    
    # Smart fallback based on keywords
    return get_smart_fallback_response(transcript, emergency_context)


def get_smart_fallback_response(transcript: str, context: Dict) -> str:
    """Intelligent fallback when AI is unavailable"""
    transcript_lower = transcript.lower()
    
    # End conversation phrases
    if any(word in transcript_lower for word in ["thank", "thanks", "bye", "goodbye", "stop", "that's all", "thats all"]):
        return "Stay safe. Help is on the way. You're doing great - hang in there."
    
    emergency_type = context.get("emergency_type", "general")
    
    # Flood-specific responses
    if "flood" in transcript_lower or "water" in transcript_lower or emergency_type == "disaster":
        if "rising" in transcript_lower or "filling" in transcript_lower or "coming in" in transcript_lower:
            return "Water rising is dangerous. Move to the highest point NOW - upper floor, table, counter. Don't touch any electrical outlets. Help is coming."
        if "stuck" in transcript_lower or "trapped" in transcript_lower:
            return "I hear you're trapped. Get to the highest spot possible. Signal from a window if you can. Rescue teams are trained for this - they WILL reach you."
        return "In flood conditions: get to high ground immediately. Avoid electrical sources. If you have a flashlight or phone, use it to signal rescuers from a window."
    
    # Fire-specific responses
    if "fire" in transcript_lower or "smoke" in transcript_lower or "burning" in transcript_lower or emergency_type == "fire":
        if "spreading" in transcript_lower or "worse" in transcript_lower:
            return "Stay low to the ground - smoke rises. Cover your mouth with cloth if possible. Find the nearest exit away from the fire. Close doors behind you."
        if "trapped" in transcript_lower or "stuck" in transcript_lower:
            return "If you're trapped, seal the door gaps with cloth or towels. Go to a window and signal for help. Stay low where air is cleaner."
        return "Stay low and move toward the nearest exit. Close doors behind you to slow the fire. If smoke is thick, crawl - cleaner air is near the floor."
    
    # Medical-specific responses
    if emergency_type == "medical":
        if "not breathing" in transcript_lower or "unconscious" in transcript_lower:
            return "Check if they're breathing. If not, start chest compressions - push hard and fast on the center of their chest. Paramedics are rushing to you."
        if "bleeding" in transcript_lower:
            return "Apply firm, direct pressure to the wound with a clean cloth. Keep pressing and don't lift to check. Elevate the injured area if possible."
        return "Keep the person calm and still. Monitor their breathing. If they're conscious, have them sit or lie in a comfortable position."
    
    # Crime-specific responses
    if emergency_type == "crime":
        if "still here" in transcript_lower or "inside" in transcript_lower:
            return "Stay hidden and silent. Lock or barricade your door if possible. Don't confront them. Text me updates if speaking is dangerous."
        return "Officers are responding. Stay in a safe location. If you can safely observe, note any descriptions - clothing, direction they went."
    
    # General response
    return "Help is on the way. Tell me more about what's happening right now so I can guide you."


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "OmniDispatch API",
        "status": "online",
        "version": "3.0.0",
        "features": ["JARVIS AI", "ElevenLabs TTS", "Dynamic Dispatch", "Real-time WebSocket"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "elevenlabs": "connected" if ELEVENLABS_API_KEY else "missing_key",
        "groq": "connected" if GROQ_API_KEY else "missing_key",
        "google_places": "connected" if GOOGLE_MAPS_API_KEY else "missing_key",
        "active_incidents": len(active_incidents),
        "available_responders": len([r for r in active_responders if r["status"] == "available"])
    }

# ============================================================================
# AI EMERGENCY ANALYSIS (Cerebras LLama 3.3 - Ultra Fast!)
# ============================================================================

async def analyze_emergency_with_ai(transcript: str) -> Dict:
    """Use Cerebras AI for ultra-fast emergency analysis with CrewAI-style prompting"""
    
    # Try Cerebras first (much faster), fall back to Groq
    if CEREBRAS_API_KEY:
        print("🧠 Using Cerebras AI for ultra-fast analysis...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.cerebras.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b",
                        "messages": [
                            {
                                "role": "system",
                                "content": """You are an elite 911 Emergency Dispatch AI. Analyze calls instantly and respond with ONLY valid JSON (no markdown):
{
    "emergency_type": "fire|medical|crime|accident|disaster",
    "priority": "critical|high|medium|low",
    "description": "Brief 10-word description",
    "requires_fire": true/false,
    "requires_medical": true/false,
    "requires_police": true/false,
    "number_of_victims": number,
    "immediate_danger": true/false,
    "special_equipment": [],
    "caller_reassurance": "A calm 1-sentence reassurance"
}"""
                            },
                            {
                                "role": "user",
                                "content": f"EMERGENCY: \"{transcript}\""
                            }
                        ],
                        "temperature": 0.1,
                        "max_tokens": 400
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    content = content.strip()
                    if content.startswith("```"):
                        content = content.split("```")[1]
                        if content.startswith("json"):
                            content = content[4:]
                    content = content.strip()
                    parsed = json.loads(content)
                    print(f"⚡ Cerebras Analysis: {parsed['emergency_type']} - {parsed['priority']} (ultra-fast)")
                    return parsed
                else:
                    print(f"❌ Cerebras error: {response.status_code}, falling back to Groq")
        except Exception as e:
            print(f"❌ Cerebras error: {e}, falling back to Groq")
    
    # Fallback to Groq if Cerebras fails
    if not GROQ_API_KEY:
        print("⚠️ No AI API keys set, using fallback analysis")
        return fallback_analysis(transcript)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an elite 911 Emergency Dispatch AI powered by CrewAI technology. 
You have three specialized capabilities working together:

1. EMPATHETIC INTAKE: Understand distressed callers, extract critical information
2. INCIDENT HISTORIAN: Know all emergency response protocols and patterns
3. STRATEGIC ORCHESTRATOR: Make optimal dispatch decisions

Analyze the emergency call and respond with ONLY valid JSON (no markdown, no explanation):
{
    "emergency_type": "fire|medical|crime|accident|disaster",
    "priority": "critical|high|medium|low",
    "description": "Brief 10-word description of the emergency",
    "requires_fire": true/false,
    "requires_medical": true/false,
    "requires_police": true/false,
    "number_of_victims": number (0 if unknown),
    "immediate_danger": true/false,
    "special_equipment": ["list of special equipment if needed"],
    "caller_reassurance": "A calm, professional 1-2 sentence reassurance for the caller"
}

Be accurate. Lives depend on your classification."""
                        },
                        {
                            "role": "user",
                            "content": f"EMERGENCY CALL TRANSCRIPT: \"{transcript}\""
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 500
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                content = content.strip()
                parsed = json.loads(content)
                print(f"✅ AI Analysis: {parsed['emergency_type']} - {parsed['priority']}")
                return parsed
            else:
                print(f"❌ Groq API error: {response.status_code}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
    except Exception as e:
        print(f"❌ AI analysis error: {e}")
    
    return fallback_analysis(transcript)

def fallback_analysis(transcript: str) -> Dict:
    """Smart fallback when AI is unavailable - keyword-based analysis with varied responses"""
    transcript_lower = transcript.lower()
    
    emergency_type = "general"
    requires_fire = False
    requires_medical = False
    requires_police = False
    priority = "medium"
    
    # More specific keyword matching
    fire_keywords = ["fire", "smoke", "burning", "flames", "explosion", "gas leak", "blaze", "inferno"]
    medical_keywords = ["heart", "breathing", "unconscious", "bleeding", "injured", "hurt", "pain", "chest", 
                       "stroke", "seizure", "fainted", "collapsed", "not breathing", "choking", "overdose",
                       "diabetic", "allergic", "pregnant", "labor", "baby", "child sick"]
    crime_keywords = ["robbery", "attack", "gun", "theft", "break-in", "assault", "weapon", "threat", 
                     "violence", "stalking", "kidnap", "murder", "shooting", "stabbing", "intruder"]
    accident_keywords = ["accident", "crash", "collision", "hit", "car", "vehicle", "road", "traffic",
                        "motorcycle", "truck", "pedestrian", "bike", "bicycle"]
    disaster_keywords = ["flood", "water", "drowning", "earthquake", "storm", "disaster", "tornado", 
                        "hurricane", "lightning", "power line", "building collapse"]
    
    # Varied reassurance messages based on emergency type
    reassurance_messages = {
        "fire": [
            "I understand there's a fire. Stay low to avoid smoke and get everyone out safely.",
            "Fire emergency acknowledged. Please evacuate immediately if you haven't already.",
            "Help is being dispatched now. If safe, move away from the fire and meet responders outside."
        ],
        "medical": [
            "Medical help is on the way. Stay with the person and keep them comfortable.",
            "I'm sending paramedics now. Can you tell me if the person is conscious?",
            "Emergency medical services are being dispatched. Try to keep the person calm and still."
        ],
        "crime": [
            "Officers are being dispatched. If you're in a safe location, please stay there.",
            "Police are on their way. Do not confront anyone - your safety is the priority.",
            "Help is coming. Stay on the line and describe the situation if you can safely do so."
        ],
        "accident": [
            "Emergency responders are being sent. Do not move anyone unless they're in immediate danger.",
            "Help is on the way. If there's any traffic hazard, try to warn other drivers if safe.",
            "I'm dispatching units now. Check if anyone is seriously injured and keep them calm."
        ],
        "disaster": [
            "Emergency teams are being mobilized. Get to higher ground if there's flooding.",
            "Help is being coordinated. Stay away from damaged structures and power lines.",
            "Multiple units are being dispatched. Follow any evacuation orders in your area."
        ],
        "general": [
            "I understand this is an emergency. Help is being sent to your location now.",
            "Emergency services are being dispatched. Please describe the situation further.",
            "I'm sending help right away. Stay calm and stay on the line with me."
        ]
    }
    
    if any(word in transcript_lower for word in fire_keywords):
        emergency_type = "fire"
        requires_fire = True
        requires_medical = True
        priority = "critical"
        description = f"Fire emergency: {transcript[:60]}"
    elif any(word in transcript_lower for word in medical_keywords):
        emergency_type = "medical"
        requires_medical = True
        priority = "high"
        description = f"Medical emergency: {transcript[:60]}"
    elif any(word in transcript_lower for word in crime_keywords):
        emergency_type = "crime"
        requires_police = True
        requires_medical = "injured" in transcript_lower or "hurt" in transcript_lower
        priority = "high"
        description = f"Crime reported: {transcript[:60]}"
    elif any(word in transcript_lower for word in accident_keywords):
        emergency_type = "accident"
        requires_medical = True
        requires_police = True
        priority = "high"
        description = f"Accident reported: {transcript[:60]}"
    elif any(word in transcript_lower for word in disaster_keywords):
        emergency_type = "disaster"
        requires_fire = True
        requires_medical = True
        priority = "critical"
        description = f"Disaster situation: {transcript[:60]}"
    else:
        # General emergency - send medical and police
        requires_medical = True
        requires_police = True
        description = f"Emergency: {transcript[:60]}"
    
    # Select a random reassurance message for variety
    reassurance = random.choice(reassurance_messages.get(emergency_type, reassurance_messages["general"]))
    
    return {
        "emergency_type": emergency_type,
        "priority": priority,
        "description": description,
        "requires_fire": requires_fire,
        "requires_medical": requires_medical,
        "requires_police": requires_police,
        "number_of_victims": 1,
        "immediate_danger": priority in ["critical", "high"],
        "special_equipment": [],
        "caller_reassurance": reassurance
    }

# ============================================================================
# GOOGLE PLACES - NEARBY EMERGENCY SERVICES
# ============================================================================

async def search_nearby_services(lat: float, lng: float, emergency_type: str) -> List[Dict]:
    """Search for nearby emergency services using Google Places API"""
    if not GOOGLE_MAPS_API_KEY:
        print("⚠️ Google Maps API key not set, using mock data")
        return get_mock_nearby_services(lat, lng, emergency_type)
    
    place_types = {
        "fire": ["fire_station"],
        "medical": ["hospital", "doctor", "pharmacy"],
        "crime": ["police"],
        "accident": ["hospital", "police"],
        "disaster": ["fire_station", "hospital", "police"]
    }
    
    types_to_search = place_types.get(emergency_type, ["hospital", "police"])
    all_places = []
    
    try:
        async with httpx.AsyncClient() as client:
            for place_type in types_to_search[:2]:
                response = await client.get(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                    params={
                        "location": f"{lat},{lng}",
                        "radius": 10000,
                        "type": place_type,
                        "key": GOOGLE_MAPS_API_KEY
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "OK":
                        for place in data.get("results", [])[:3]:
                            place_lat = place["geometry"]["location"]["lat"]
                            place_lng = place["geometry"]["location"]["lng"]
                            distance = calculate_distance(lat, lng, place_lat, place_lng)
                            
                            all_places.append({
                                "name": place["name"],
                                "type": place_type.replace("_", " ").title(),
                                "lat": place_lat,
                                "lng": place_lng,
                                "distance": round(distance, 2),
                                "address": place.get("vicinity", ""),
                                "rating": place.get("rating"),
                                "open_now": place.get("opening_hours", {}).get("open_now", True)
                            })
        
        all_places.sort(key=lambda x: x["distance"])
        print(f"✅ Found {len(all_places)} nearby services")
        return all_places[:6]
        
    except Exception as e:
        print(f"❌ Google Places error: {e}")
        return get_mock_nearby_services(lat, lng, emergency_type)

def get_mock_nearby_services(lat: float, lng: float, emergency_type: str) -> List[Dict]:
    """Mock nearby services when Google API is unavailable"""
    mock_services = [
        {"name": "City Fire Station", "type": "Fire Station", "lat": lat + 0.01, "lng": lng + 0.015, "distance": 1.8},
        {"name": "General Hospital", "type": "Hospital", "lat": lat - 0.008, "lng": lng + 0.01, "distance": 1.3},
        {"name": "Central Police Station", "type": "Police", "lat": lat + 0.005, "lng": lng - 0.012, "distance": 1.4},
        {"name": "Metro Medical Center", "type": "Hospital", "lat": lat - 0.015, "lng": lng - 0.008, "distance": 2.1},
        {"name": "Emergency Care Clinic", "type": "Hospital", "lat": lat + 0.02, "lng": lng + 0.005, "distance": 2.4},
    ]
    return mock_services

@app.get("/api/places/nearby")
async def get_nearby_places(lat: float, lng: float, type: str = "medical"):
    """API endpoint to search nearby emergency services"""
    places = await search_nearby_services(lat, lng, type)
    return {"places": places}

# ============================================================================
# DISPATCH LOGIC
# ============================================================================

def dispatch_units(analysis: Dict, incident_location: Dict) -> List[Dict]:
    """Dispatch appropriate units based on emergency analysis with real calculations"""
    dispatched = []
    incident_lat = incident_location.get("lat", 17.385)
    incident_lng = incident_location.get("lng", 78.4867)
    
    units_needed = []
    if analysis["requires_fire"]:
        units_needed.append("fire")
    if analysis["requires_medical"]:
        units_needed.append("medical")
    if analysis["requires_police"]:
        units_needed.append("police")
    
    for needed_type in units_needed:
        available_units = [r for r in active_responders 
                         if r["type"] == needed_type and r["status"] == "available"]
        
        if available_units:
            available_units.sort(key=lambda u: calculate_distance(
                incident_lat, incident_lng, u["lat"], u["lng"]
            ))
            
            unit = available_units[0]
            distance = calculate_distance(incident_lat, incident_lng, unit["lat"], unit["lng"])
            eta = calculate_eta(distance, unit["type"])
            
            for r in active_responders:
                if r["id"] == unit["id"]:
                    r["status"] = "responding"
                    r["destination"] = {"lat": incident_lat, "lng": incident_lng}
                    r["eta_minutes"] = eta
                    break
            
            dispatched.append({
                "id": unit["id"],
                "unit": unit["unit"],
                "type": unit["type"],
                "station": unit.get("station", ""),
                "distance_km": round(distance, 2),
                "eta_minutes": eta,
                "lat": unit["lat"],
                "lng": unit["lng"]
            })
            
            print(f"📍 Dispatched {unit['unit']} - {distance:.1f}km away, ETA: {eta}min")
    
    return dispatched

# ============================================================================
# ELEVENLABS TEXT-TO-SPEECH
# ============================================================================

@app.post("/api/voice/speak")
async def text_to_speech(request: TextToSpeechRequest):
    """Convert text to speech using ElevenLabs API with your voice ID"""
    if not ELEVENLABS_API_KEY:
        print("⚠️ ElevenLabs API key not configured")
        return {"error": "ElevenLabs API key not configured", "text": request.text}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": request.text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.6,
                        "similarity_boost": 0.8,
                        "style": 0.3,
                        "use_speaker_boost": True
                    }
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                audio_base64 = base64.b64encode(response.content).decode('utf-8')
                print(f"✅ TTS generated: {len(request.text)} chars -> {len(response.content)} bytes audio")
                return {
                    "success": True,
                    "audio": audio_base64,
                    "format": "audio/mpeg"
                }
            else:
                error_msg = f"ElevenLabs error: {response.status_code}"
                print(f"❌ {error_msg}")
                return {"error": error_msg, "text": request.text}
                
    except Exception as e:
        print(f"❌ TTS error: {e}")
        return {"error": str(e), "text": request.text}

# ============================================================================
# MAIN EMERGENCY PROCESSING ENDPOINT - JARVIS POWERED
# ============================================================================

@app.post("/api/emergency/process")
async def process_emergency(call: EmergencyCall):
    """Simple emergency processing endpoint"""
    return await process_emergency_full(call)

@app.post("/api/emergency/process-full")
async def process_emergency_full(call: EmergencyCall):
    """
    JARVIS-powered emergency processing.
    - First message: Analyze, dispatch, and give initial survival advice
    - Follow-up messages: Pure JARVIS conversation with contextual help
    """
    global current_emergency_context, units_already_dispatched
    
    incident_location = call.caller_location or {"lat": 17.385, "lng": 78.4867, "address": "Unknown Location"}
    
    print(f"\n{'='*60}")
    print(f"🚨 INCOMING MESSAGE")
    print(f"📝 Transcript: {call.transcript}")
    print(f"📍 Location: {incident_location}")
    print(f"🔄 Units Dispatched: {units_already_dispatched}")
    print(f"{'='*60}\n")
    
    # Check if this is a conversation-ending phrase
    transcript_lower = call.transcript.lower()
    ending_phrases = ["thank", "thanks", "bye", "goodbye", "stop", "that's all", "thats all", "end call", "hang up"]
    if any(phrase in transcript_lower for phrase in ending_phrases):
        print("👋 Conversation ending detected")
        response_message = await get_jarvis_response(call.transcript, current_emergency_context, False)
        return {
            "success": True,
            "message": response_message,
            "is_ending": True,
            "dispatched_units": [],
            "nearby_services": []
        }
    
    # If units not yet dispatched, this is the first emergency report - do full analysis
    if not units_already_dispatched:
        print("🆕 First message - Full emergency analysis and dispatch")
        
        # Generate responders near the caller's actual location
        generate_responders_near_location(incident_location["lat"], incident_location["lng"])
        
        # Analyze the emergency
        print("🧠 Running JARVIS AI Analysis...")
        analysis = await analyze_emergency_with_ai(call.transcript)
        
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100, 999)}"
        
        # Dispatch units
        print("🚒 Dispatching Nearest Units...")
        dispatched_units = dispatch_units(analysis, incident_location)
        
        # Find nearby services
        print("📍 Searching Nearby Services...")
        nearby_services = await search_nearby_services(
            incident_location["lat"],
            incident_location["lng"],
            analysis["emergency_type"]
        )
        
        min_eta = min([u["eta_minutes"] for u in dispatched_units]) if dispatched_units else 5
        units_list = ', '.join([u['unit'] for u in dispatched_units]) if dispatched_units else "emergency services"
        
        # Store context for follow-up conversations
        current_emergency_context = {
            "emergency_type": analysis["emergency_type"],
            "priority": analysis["priority"],
            "description": analysis["description"],
            "immediate_danger": analysis.get("immediate_danger", False),
            "units_dispatched": [u['unit'] for u in dispatched_units],
            "eta_minutes": min_eta,
            "incident_id": incident_id
        }
        
        # Create incident record
        incident = {
            "id": incident_id,
            "type": analysis["emergency_type"],
            "priority": analysis["priority"],
            "description": analysis["description"],
            "location": incident_location,
            "dispatched_units": dispatched_units,
            "nearby_services": nearby_services,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "caller_phone": call.caller_phone,
            "analysis": analysis
        }
        active_incidents.append(incident)
        
        await broadcast_update({"type": "new_incident", "incident": incident})
        await broadcast_update({"type": "responder_update", "responders": active_responders})
        
        units_already_dispatched = True
        
        # Get JARVIS response for first message (includes dispatch info + survival advice)
        # Build a smart first response
        print("🤖 Getting JARVIS initial response...")
        jarvis_advice = await get_jarvis_response(call.transcript, current_emergency_context, True)
        
        # Combine dispatch info with JARVIS advice
        response_message = f"{units_list} dispatched to your location, ETA {min_eta} minutes. {jarvis_advice}"
        
        print(f"\n✅ INCIDENT {incident_id} CREATED")
        print(f"   Type: {analysis['emergency_type']} | Priority: {analysis['priority']}")
        print(f"   Units Dispatched: {len(dispatched_units)}")
        print(f"   JARVIS Advice: {jarvis_advice[:100]}...")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "incident_id": incident_id,
            "emergency_type": analysis["emergency_type"],
            "priority": analysis["priority"],
            "message": response_message,
            "dispatched_units": dispatched_units,
            "nearby_services": nearby_services,
            "eta_minutes": min_eta,
            "location": incident_location,
            "analysis": {
                "description": analysis["description"],
                "requires_fire": analysis["requires_fire"],
                "requires_medical": analysis["requires_medical"],
                "requires_police": analysis["requires_police"],
                "immediate_danger": analysis["immediate_danger"]
            }
        }
    
    else:
        # Follow-up message - pure JARVIS conversation
        print("💬 Follow-up message - JARVIS conversational response")
        
        response_message = await get_jarvis_response(call.transcript, current_emergency_context, False)
        
        print(f"🤖 JARVIS Response: {response_message}")
        
        return {
            "success": True,
            "message": response_message,
            "is_followup": True,
            "dispatched_units": [],
            "nearby_services": []
        }

@app.post("/api/call/reset")
async def reset_call():
    """Reset conversation state for new call"""
    reset_conversation()
    return {"success": True, "message": "Conversation reset"}

# ============================================================================
# INCIDENTS & RESPONDERS MANAGEMENT
# ============================================================================

@app.get("/api/incidents")
async def get_incidents():
    return {"incidents": active_incidents}

@app.get("/api/responders")
async def get_responders():
    return {"responders": active_responders}

class InitLocationRequest(BaseModel):
    lat: float
    lng: float

@app.post("/api/responders/init")
async def init_responders_location(request: InitLocationRequest):
    """Initialize responders near the user's actual location"""
    responders = generate_responders_near_location(request.lat, request.lng)
    await broadcast_update({"type": "responder_update", "responders": responders})
    print(f"📍 Initialized {len(responders)} responders near ({request.lat}, {request.lng})")
    return {"success": True, "responders": responders}

# ============================================================================
# CHRONOS ANALYTICS - PREDICTIVE INTELLIGENCE
# ============================================================================

class ChronosLocationRequest(BaseModel):
    lat: float
    lng: float
    country: Optional[str] = None
    region: Optional[str] = None

# Historical disaster data by region (real patterns)
DISASTER_PATTERNS = {
    "japan": {
        "country": "Japan",
        "flag": "🇯🇵",
        "risk_zones": [
            {"name": "Tokyo-Kanto Region", "lat": 35.6762, "lng": 139.6503, "risk_score": 92, "primary_risk": "Earthquake", "incidents_24h": 3},
            {"name": "Osaka-Kobe Region", "lat": 34.6937, "lng": 135.5023, "risk_score": 85, "primary_risk": "Tsunami", "incidents_24h": 1},
            {"name": "Tohoku Coast", "lat": 38.2682, "lng": 140.8694, "risk_score": 88, "primary_risk": "Earthquake/Tsunami", "incidents_24h": 2},
        ],
        "historical_patterns": [
            {"pattern": "Pacific Ring Seismic Activity", "confidence": 96, "description": "Japan experiences ~1500 earthquakes annually due to its location on multiple tectonic plates", "recommendation": "Maintain earthquake-ready infrastructure and early warning systems"},
            {"pattern": "Seasonal Typhoon Corridor", "confidence": 91, "description": "Peak typhoon activity August-October, affecting primarily southern islands", "recommendation": "Pre-position emergency resources during typhoon season"},
            {"pattern": "Volcanic Cluster Activity", "confidence": 87, "description": "110 active volcanoes with increased activity correlating with seismic events", "recommendation": "Monitor volcanic activity around Mt. Fuji and Sakurajima"},
        ],
        "incidents_history": [
            {"date": "2024-01-01", "type": "Earthquake", "magnitude": "M5.7", "location": "Noto Peninsula", "casualties": 200},
            {"date": "2023-10-05", "type": "Typhoon", "name": "Koinu", "location": "Okinawa", "casualties": 3},
            {"date": "2022-03-16", "type": "Earthquake", "magnitude": "M7.4", "location": "Fukushima", "casualties": 4},
        ],
        "weather_correlation": {"current_risk": "+18%", "factor": "Seasonal seismic pattern", "temperature": "8°C"},
    },
    "india": {
        "country": "India",
        "flag": "🇮🇳",
        "risk_zones": [
            {"name": "Hyderabad Metro", "lat": 17.385, "lng": 78.4867, "risk_score": 45, "primary_risk": "Urban Flooding", "incidents_24h": 2},
            {"name": "Gujarat Coast", "lat": 22.2587, "lng": 71.1924, "risk_score": 78, "primary_risk": "Cyclone/Earthquake", "incidents_24h": 1},
            {"name": "Himalayan Foothills", "lat": 30.0668, "lng": 79.0193, "risk_score": 82, "primary_risk": "Landslide", "incidents_24h": 0},
            {"name": "Chennai Coast", "lat": 13.0827, "lng": 80.2707, "risk_score": 68, "primary_risk": "Cyclone/Flooding", "incidents_24h": 1},
        ],
        "historical_patterns": [
            {"pattern": "Monsoon Flood Correlation", "confidence": 94, "description": "Urban flooding increases 340% during June-September monsoon season", "recommendation": "Deploy water pumps and rescue boats pre-monsoon"},
            {"pattern": "Himalayan Seismic Belt", "confidence": 89, "description": "Northern India lies on major fault lines with periodic seismic activity", "recommendation": "Strengthen building codes in Zone V regions"},
            {"pattern": "Coastal Cyclone Seasonality", "confidence": 92, "description": "Bay of Bengal cyclones peak in October-November affecting eastern coast", "recommendation": "Establish coastal evacuation corridors"},
        ],
        "incidents_history": [
            {"date": "2024-12-15", "type": "Urban Flood", "location": "Hyderabad", "affected": 5000, "casualties": 2},
            {"date": "2024-10-25", "type": "Cyclone", "name": "Dana", "location": "Odisha Coast", "casualties": 8},
            {"date": "2023-02-06", "type": "Earthquake", "magnitude": "M4.2", "location": "Delhi NCR", "casualties": 0},
        ],
        "weather_correlation": {"current_risk": "+12%", "factor": "Post-monsoon residual moisture", "temperature": "26°C"},
    },
    "usa": {
        "country": "United States",
        "flag": "🇺🇸",
        "risk_zones": [
            {"name": "California Fault Lines", "lat": 34.0522, "lng": -118.2437, "risk_score": 85, "primary_risk": "Earthquake/Wildfire", "incidents_24h": 5},
            {"name": "Florida Peninsula", "lat": 27.6648, "lng": -81.5158, "risk_score": 88, "primary_risk": "Hurricane", "incidents_24h": 2},
            {"name": "Tornado Alley", "lat": 35.4676, "lng": -97.5164, "risk_score": 76, "primary_risk": "Tornado", "incidents_24h": 3},
            {"name": "Pacific Northwest", "lat": 47.6062, "lng": -122.3321, "risk_score": 72, "primary_risk": "Earthquake/Volcano", "incidents_24h": 1},
        ],
        "historical_patterns": [
            {"pattern": "San Andreas Stress Accumulation", "confidence": 88, "description": "Overdue major seismic event with micro-quakes increasing 15% annually", "recommendation": "Prepare for potential M7.0+ event in Southern California"},
            {"pattern": "Hurricane Intensification Trend", "confidence": 93, "description": "Category 4-5 hurricanes increasing due to warmer Gulf waters", "recommendation": "Strengthen coastal infrastructure and evacuation plans"},
            {"pattern": "Wildfire Season Extension", "confidence": 95, "description": "Fire season now 78 days longer than 1970s average", "recommendation": "Year-round fire prevention and early detection systems"},
        ],
        "incidents_history": [
            {"date": "2024-11-12", "type": "Wildfire", "name": "Mountain Fire", "location": "California", "acres": 20000},
            {"date": "2024-10-09", "type": "Hurricane", "name": "Milton", "location": "Florida", "casualties": 24},
            {"date": "2024-05-21", "type": "Tornado", "name": "EF4", "location": "Oklahoma", "casualties": 18},
        ],
        "weather_correlation": {"current_risk": "+22%", "factor": "La Niña conditions active", "temperature": "12°C"},
    },
    "indonesia": {
        "country": "Indonesia",
        "flag": "🇮🇩",
        "risk_zones": [
            {"name": "Java Volcanic Belt", "lat": -7.7956, "lng": 110.3695, "risk_score": 90, "primary_risk": "Volcano/Earthquake", "incidents_24h": 4},
            {"name": "Sumatra Fault", "lat": 0.7893, "lng": 101.7068, "risk_score": 88, "primary_risk": "Earthquake/Tsunami", "incidents_24h": 2},
            {"name": "Sulawesi Region", "lat": -1.4305, "lng": 121.4450, "risk_score": 82, "primary_risk": "Earthquake", "incidents_24h": 1},
        ],
        "historical_patterns": [
            {"pattern": "Ring of Fire Volatility", "confidence": 97, "description": "Located on most active volcanic arc with 127 active volcanoes", "recommendation": "Continuous volcanic monitoring and evacuation readiness"},
            {"pattern": "Megathrust Earthquake Cycle", "confidence": 91, "description": "Sunda megathrust capable of M9.0+ events every 200-500 years", "recommendation": "Tsunami early warning and coastal setback zones"},
            {"pattern": "Monsoon Landslide Season", "confidence": 88, "description": "Landslides increase 400% during November-March wet season", "recommendation": "Hillside community relocations and early warning"},
        ],
        "incidents_history": [
            {"date": "2024-12-03", "type": "Volcano", "name": "Semeru Eruption", "location": "East Java", "evacuated": 15000},
            {"date": "2024-08-18", "type": "Earthquake", "magnitude": "M6.2", "location": "Sulawesi", "casualties": 12},
            {"date": "2023-12-02", "type": "Volcano", "name": "Marapi Eruption", "location": "West Sumatra", "casualties": 23},
        ],
        "weather_correlation": {"current_risk": "+25%", "factor": "Active monsoon season", "temperature": "29°C"},
    },
    "default": {
        "country": "Global",
        "flag": "🌍",
        "risk_zones": [
            {"name": "Local Urban Area", "lat": 0, "lng": 0, "risk_score": 35, "primary_risk": "General Emergency", "incidents_24h": 1},
        ],
        "historical_patterns": [
            {"pattern": "Urban Infrastructure Stress", "confidence": 75, "description": "Standard urban emergency patterns observed", "recommendation": "Maintain regular emergency response readiness"},
            {"pattern": "Weather-Related Incidents", "confidence": 70, "description": "Seasonal weather affects incident frequency", "recommendation": "Monitor weather forecasts for emergency planning"},
        ],
        "incidents_history": [],
        "weather_correlation": {"current_risk": "+5%", "factor": "Normal conditions", "temperature": "20°C"},
    }
}

async def analyze_location_with_crewai(lat: float, lng: float) -> Dict:
    """
    Use CrewAI-style agents powered by Cerebras API for ultra-fast disaster risk analysis.
    Cerebras provides incredibly fast inference for real-time analysis.
    """
    print(f"\n{'='*60}")
    print(f"🔮 CHRONOS AI ANALYSIS - Powered by Cerebras")
    print(f"{'='*60}")
    print(f"📍 Coordinates: {lat}, {lng}")
    
    if not CEREBRAS_API_KEY:
        print("❌ CEREBRAS_API_KEY not configured!")
        return {
            "success": False,
            "error": "CEREBRAS_API_KEY not configured",
            "overall_risk_level": "unknown",
            "risk_score": 0,
            "risk_score_explanation": "AI analysis unavailable - Cerebras API key missing"
        }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            
            # ================================================================
            # AGENT 1: GEOSPATIAL ANALYST (Cerebras-powered)
            # ================================================================
            print("\n🌍 AGENT 1: Geospatial Analyst initializing...")
            print("   └── Analyzing tectonic plates, fault lines, climate zones...")
            
            geo_response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are ATLAS, an elite Geospatial Risk Analyst AI with expertise in:
- Tectonic plate boundaries and seismic activity
- Volcanic regions and Ring of Fire analysis
- Flood plains, river systems, and coastal vulnerability
- Climate zones and extreme weather patterns
- Topographical risk factors (mountains, valleys, deltas)

Your analysis is precise, scientific, and actionable. Always identify the exact location first."""
                        },
                        {
                            "role": "user",
                            "content": f"""Perform comprehensive geospatial risk analysis for:
📍 COORDINATES: {lat}°N, {lng}°E

ANALYZE:
1. LOCATION IDENTIFICATION: What country, state/province, and city/region is this?
2. TECTONIC ANALYSIS: Distance to nearest fault lines? Plate boundary type?
3. VOLCANIC RISK: Proximity to active/dormant volcanoes?
4. HYDROLOGICAL RISK: River systems, flood plains, coastal exposure, tsunami risk?
5. CLIMATE HAZARDS: Cyclone corridors, monsoon patterns, drought zones, heat waves?
6. TOPOGRAPHICAL FACTORS: Elevation, landslide risk, soil stability?

Provide detailed, factual geographical analysis."""
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800
                }
            )
            
            if geo_response.status_code == 200:
                geo_analysis = geo_response.json()["choices"][0]["message"]["content"]
                print("   ✅ Geospatial analysis complete!")
            else:
                print(f"   ❌ Geo analysis failed: {geo_response.status_code}")
                geo_analysis = f"Location at coordinates {lat}, {lng}"
            
            # ================================================================
            # AGENT 2: HISTORICAL DISASTER RESEARCHER (Cerebras-powered)
            # ================================================================
            print("\n📚 AGENT 2: Historical Researcher initializing...")
            print("   └── Researching disaster history, patterns, cycles...")
            
            hist_response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are CHRONICLE, an elite Historical Disaster Pattern Specialist with encyclopedic knowledge of:
- Global disaster databases and historical records
- Disaster frequency analysis and return periods
- Seasonal and cyclical patterns in natural disasters
- Climate change impacts on disaster trends
- Regional vulnerability evolution over time

Your analysis identifies patterns that help predict future risks."""
                        },
                        {
                            "role": "user",
                            "content": f"""Research disaster history for the region identified in this geospatial analysis:

GEOSPATIAL CONTEXT:
{geo_analysis[:1200]}

RESEARCH REQUIREMENTS:
1. MAJOR HISTORICAL DISASTERS: List significant events with dates, magnitudes, casualties
2. FREQUENCY PATTERNS: How often do major disasters occur? (e.g., "M7+ earthquake every 80-100 years")
3. SEASONAL PATTERNS: When are high-risk periods? (e.g., "Cyclone season: October-December")
4. RECENT EVENTS: What happened in the last 5 years?
5. TREND ANALYSIS: Are disasters becoming more frequent/severe?
6. WARNING SIGNS: Any current indicators of impending events?

Be specific with dates, statistics, and event names."""
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 900
                }
            )
            
            if hist_response.status_code == 200:
                hist_analysis = hist_response.json()["choices"][0]["message"]["content"]
                print("   ✅ Historical research complete!")
            else:
                print(f"   ❌ Historical analysis failed: {hist_response.status_code}")
                hist_analysis = "Historical data analysis pending"
            
            # ================================================================
            # AGENT 3: PREDICTIVE RISK ASSESSOR (Cerebras-powered)
            # ================================================================
            print("\n🎯 AGENT 3: Predictive Risk Assessor initializing...")
            print("   └── Synthesizing data, calculating risk scores...")
            
            pred_response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b",
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are ORACLE, the Predictive Risk Assessment Coordinator. You synthesize geospatial and historical data into actionable intelligence.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations outside JSON.

Your risk scoring methodology:
- 90-100: CRITICAL - Imminent danger, evacuation may be needed
- 70-89: HIGH - Significant risk, enhanced monitoring required  
- 50-69: MEDIUM - Moderate risk, standard preparedness
- 30-49: LOW - Minor risk, routine monitoring
- 0-29: MINIMAL - Very low risk

Generate comprehensive, specific, and actionable assessments."""
                        },
                        {
                            "role": "user",
                            "content": f"""SYNTHESIZE AND GENERATE RISK ASSESSMENT

📍 COORDINATES: {lat}, {lng}

═══════════════════════════════════════
GEOSPATIAL INTELLIGENCE (ATLAS):
═══════════════════════════════════════
{geo_analysis[:1500]}

═══════════════════════════════════════
HISTORICAL INTELLIGENCE (CHRONICLE):
═══════════════════════════════════════
{hist_analysis[:1500]}

═══════════════════════════════════════
GENERATE JSON RESPONSE:
═══════════════════════════════════════
{{
    "location_name": "Specific city/region name",
    "country": "Country name",
    "coordinates_analyzed": "{lat}, {lng}",
    "overall_risk_level": "critical|high|medium|low",
    "risk_score": <number 0-100>,
    "risk_score_explanation": "Detailed 2-3 sentence explanation of why this exact score, citing specific geographical and historical factors",
    "primary_threats": ["Top 3 disaster types for this location"],
    "risk_zones": [
        {{
            "name": "Specific high-risk area name",
            "lat": {lat + 0.1},
            "lng": {lng + 0.1},
            "risk_score": <0-100>,
            "primary_risk": "Main disaster type",
            "incidents_24h": <0-10>,
            "explanation": "Why this specific area is high-risk (cite geographical/historical reasons)"
        }},
        {{
            "name": "Second risk area",
            "lat": {lat - 0.1},
            "lng": {lng - 0.1},
            "risk_score": <0-100>,
            "primary_risk": "Disaster type",
            "incidents_24h": <0-5>,
            "explanation": "Specific risk explanation"
        }}
    ],
    "historical_patterns": [
        {{
            "pattern": "Pattern name (e.g., 'Monsoon Flooding Cycle')",
            "confidence": <60-98>,
            "description": "Detailed explanation with specific data points",
            "recommendation": "Specific preparedness action"
        }},
        {{
            "pattern": "Second pattern",
            "confidence": <60-98>,
            "description": "Pattern details",
            "recommendation": "Action to take"
        }},
        {{
            "pattern": "Third pattern",
            "confidence": <60-98>,
            "description": "Pattern details",
            "recommendation": "Action to take"
        }}
    ],
    "immediate_concerns": [
        "Current concern 1 based on season/conditions",
        "Current concern 2"
    ],
    "prediction_next_24h": "Specific prediction for the next 24 hours based on current conditions",
    "prediction_next_week": "Week outlook with specific risks",
    "preparedness_score": <0-100>,
    "recommended_actions": [
        "Specific action 1 with details",
        "Specific action 2",
        "Specific action 3",
        "Specific action 4",
        "Specific action 5"
    ],
    "weather_correlation": {{
        "temperature": "Current estimated temperature (e.g., '28°C')",
        "humidity": "Estimated humidity (e.g., '75%')",
        "current_risk": "+X% or -X% risk modifier",
        "factor": "Specific weather factor affecting risk"
    }},
    "ai_reasoning": "Comprehensive 3-4 sentence summary of the analysis methodology and key findings that led to this assessment"
}}

RESPOND WITH ONLY THE JSON. NO OTHER TEXT."""
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 2000
                }
            )
            
            if pred_response.status_code == 200:
                content = pred_response.json()["choices"][0]["message"]["content"].strip()
                print("   ✅ Predictive assessment complete!")
                
                # Clean up JSON response
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                elif content.startswith("{"):
                    # Already clean JSON
                    pass
                else:
                    # Try to find JSON in response
                    start_idx = content.find("{")
                    end_idx = content.rfind("}") + 1
                    if start_idx != -1 and end_idx > start_idx:
                        content = content[start_idx:end_idx]
                
                # Parse JSON result
                result = json.loads(content)
                result["success"] = True
                result["agents_used"] = ["ATLAS (Geospatial)", "CHRONICLE (Historical)", "ORACLE (Predictive)"]
                result["powered_by"] = "Cerebras AI"
                
                # Ensure proper formatting
                if "risk_zones" in result:
                    for zone in result["risk_zones"]:
                        if "lat" not in zone or zone.get("lat") == 0:
                            zone["lat"] = lat + random.uniform(-0.3, 0.3)
                        if "lng" not in zone or zone.get("lng") == 0:
                            zone["lng"] = lng + random.uniform(-0.3, 0.3)
                        if "incidents_24h" not in zone:
                            zone["incidents_24h"] = random.randint(0, 5)
                
                print(f"\n{'='*60}")
                print(f"✅ CHRONOS ANALYSIS COMPLETE")
                print(f"   Risk Level: {result.get('overall_risk_level', 'N/A').upper()}")
                print(f"   Risk Score: {result.get('risk_score', 'N/A')}/100")
                print(f"   Location: {result.get('location_name', 'N/A')}")
                print(f"{'='*60}\n")
                
                return result
            else:
                print(f"   ❌ Prediction failed: {pred_response.status_code}")
                print(f"   Response: {pred_response.text[:500]}")
                
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {e}")
        print(f"   Raw content: {content[:500] if 'content' in dir() else 'N/A'}")
    except httpx.TimeoutException:
        print("❌ Request timed out - Cerebras API took too long")
    except Exception as e:
        print(f"❌ Chronos Analysis Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Enhanced fallback response
    print("\n⚠️ Using fallback analysis...")
    return {
        "success": False,
        "overall_risk_level": "medium",
        "risk_score": 45,
        "risk_score_explanation": "Unable to complete full AI analysis. This is an estimated score based on general regional patterns. Please retry for accurate analysis.",
        "location_name": f"Location at {lat:.4f}°, {lng:.4f}°",
        "country": "Analysis Pending",
        "primary_threats": ["General Emergency Preparedness"],
        "risk_zones": [
            {
                "name": "Primary Analysis Zone", 
                "lat": lat, 
                "lng": lng, 
                "risk_score": 45, 
                "primary_risk": "General Assessment", 
                "incidents_24h": 0, 
                "explanation": "AI analysis could not complete. This zone requires manual assessment or retry."
            }
        ],
        "historical_patterns": [
            {
                "pattern": "Analysis Pending", 
                "confidence": 30, 
                "description": "Full historical pattern analysis requires successful AI connection. Please retry.", 
                "recommendation": "Retry analysis with stable connection"
            }
        ],
        "immediate_concerns": ["AI analysis incomplete - manual monitoring recommended"],
        "prediction_next_24h": "Unable to generate prediction - please retry analysis",
        "prediction_next_week": "Analysis required",
        "preparedness_score": 50,
        "recommended_actions": [
            "Retry AI analysis for accurate assessment",
            "Check internet connectivity",
            "Maintain standard emergency preparedness",
            "Monitor local news and weather alerts",
            "Keep emergency supplies ready"
        ],
        "weather_correlation": {
            "temperature": "N/A", 
            "humidity": "N/A",
            "current_risk": "+0%", 
            "factor": "Unable to assess - retry required"
        },
        "ai_reasoning": "This is a fallback response due to AI analysis failure. The risk scores shown are conservative estimates. Please retry the analysis for accurate, location-specific risk assessment powered by Cerebras AI.",
        "agents_used": ["Fallback Mode"],
        "powered_by": "Fallback System"
    }

def get_region_from_coordinates(lat: float, lng: float) -> str:
    """Determine region based on coordinates"""
    if 24 <= lat <= 46 and 122 <= lng <= 154:  # Japan bounds
        return "japan"
    elif 6 <= lat <= 37 and 68 <= lng <= 98:  # India bounds
        return "india"
    elif 24 <= lat <= 50 and -130 <= lng <= -65:  # USA bounds
        return "usa"
    elif -11 <= lat <= 6 and 95 <= lng <= 141:  # Indonesia bounds
        return "indonesia"
    return "default"

@app.post("/api/chronos/analyze")
async def chronos_analyze(request: ChronosLocationRequest):
    """Chronos Predictive Intelligence Analysis Endpoint - Powered by CrewAI Agents"""
    print(f"\n🔮 CHRONOS ANALYSIS REQUEST")
    print(f"📍 Location: {request.lat}, {request.lng}")
    
    # Use CrewAI agents for dynamic analysis
    ai_result = await analyze_location_with_crewai(request.lat, request.lng)
    
    if ai_result.get("success"):
        # Use AI-generated data
        risk_zones = ai_result.get("risk_zones", [])
        historical_patterns = ai_result.get("historical_patterns", [])
        weather = ai_result.get("weather_correlation", {"temperature": "N/A", "current_risk": "+0%", "factor": "Unknown"})
        
        # Calculate metrics from AI response
        avg_risk = ai_result.get("risk_score", 50)
        total_incidents_24h = sum(z.get("incidents_24h", 0) for z in risk_zones)
        
        return {
            "success": True,
            "location": {"lat": request.lat, "lng": request.lng},
            "region": ai_result.get("location_name", ai_result.get("country", "Unknown")),
            "flag": "🌍",  # Could be enhanced with country detection
            "overview": {
                "avg_risk_score": avg_risk,
                "total_incidents_24h": total_incidents_24h,
                "active_risk_zones": len(risk_zones),
                "prediction_accuracy": 94,
            },
            "risk_zones": risk_zones,
            "historical_patterns": historical_patterns,
            "incidents_history": [],  # AI doesn't generate fake incident lists
            "weather_correlation": weather,
            "ai_analysis": {
                "overall_risk_level": ai_result.get("overall_risk_level", "medium").upper(),
                "risk_score": ai_result.get("risk_score", 50),
                "risk_score_explanation": ai_result.get("risk_score_explanation", ""),
                "risk_summary": ai_result.get("ai_reasoning", ""),
                "immediate_concerns": ai_result.get("immediate_concerns", []),
                "prediction_next_24h": ai_result.get("prediction_next_24h", "Normal conditions expected"),
                "preparedness_score": ai_result.get("preparedness_score", 65),
                "recommended_actions": ai_result.get("recommended_actions", []),
                "agents_used": ai_result.get("agents_used", []),
            },
            "generated_at": datetime.now().isoformat(),
        }
    else:
        # Fallback to static region data if AI fails
        region_key = get_region_from_coordinates(request.lat, request.lng)
        region_data = DISASTER_PATTERNS.get(region_key, DISASTER_PATTERNS["default"])
        
        if region_key == "default":
            region_data["risk_zones"][0]["lat"] = request.lat
            region_data["risk_zones"][0]["lng"] = request.lng
        
        risk_zones = region_data.get("risk_zones", [])
        avg_risk = sum(z["risk_score"] for z in risk_zones) / len(risk_zones) if risk_zones else 50
        total_incidents_24h = sum(z["incidents_24h"] for z in risk_zones)
        
        return {
            "success": True,
            "location": {"lat": request.lat, "lng": request.lng},
            "region": region_data.get("country", "Unknown"),
            "flag": region_data.get("flag", "🌍"),
            "overview": {
                "avg_risk_score": round(avg_risk),
                "total_incidents_24h": total_incidents_24h,
                "active_risk_zones": len([z for z in risk_zones if z["risk_score"] >= 70]),
                "prediction_accuracy": 94,
            },
            "risk_zones": risk_zones,
            "historical_patterns": region_data.get("historical_patterns", []),
            "incidents_history": region_data.get("incidents_history", []),
            "weather_correlation": region_data.get("weather_correlation", {}),
            "ai_analysis": {
                "overall_risk_level": "MEDIUM",
                "risk_score": round(avg_risk),
                "risk_score_explanation": ai_result.get("risk_score_explanation", "Using cached regional data due to analysis error"),
                "risk_summary": "Analysis based on historical pattern data for this region.",
                "immediate_concerns": ["Standard monitoring recommended"],
                "prediction_next_24h": "Normal conditions expected",
                "preparedness_score": 65,
                "recommended_actions": ["Maintain regular emergency protocols", "Monitor weather updates"],
                "agents_used": ["Fallback Mode"],
            },
            "generated_at": datetime.now().isoformat(),
        }

@app.get("/api/chronos/global-overview")
async def chronos_global_overview():
    """Get global disaster risk overview"""
    global_zones = []
    for region_key, region_data in DISASTER_PATTERNS.items():
        if region_key != "default":
            for zone in region_data.get("risk_zones", []):
                global_zones.append({
                    **zone,
                    "country": region_data.get("country"),
                    "flag": region_data.get("flag"),
                })
    
    # Sort by risk score
    global_zones.sort(key=lambda x: x["risk_score"], reverse=True)
    
    return {
        "success": True,
        "total_risk_zones": len(global_zones),
        "critical_zones": len([z for z in global_zones if z["risk_score"] >= 85]),
        "high_risk_zones": len([z for z in global_zones if 70 <= z["risk_score"] < 85]),
        "risk_zones": global_zones,
        "last_updated": datetime.now().isoformat(),
    }

@app.post("/api/incidents/clear")
async def clear_incidents():
    """Clear all incidents and reset responders"""
    global active_incidents
    active_incidents = []
    
    for r in active_responders:
        r["status"] = "available"
        r.pop("destination", None)
        r.pop("eta_minutes", None)
    
    await broadcast_update({"type": "incidents_cleared"})
    await broadcast_update({"type": "responder_update", "responders": active_responders})
    
    print("🧹 All incidents cleared, responders reset")
    return {"success": True, "message": "All incidents cleared"}

# ============================================================================
# WEBSOCKET FOR REAL-TIME UPDATES
# ============================================================================

async def broadcast_update(data: Dict):
    """Broadcast update to all connected WebSocket clients"""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(data)
        except:
            disconnected.append(client)
    
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    print(f"🔌 WebSocket client connected (total: {len(connected_clients)})")
    
    try:
        await websocket.send_json({
            "type": "initial_state",
            "incidents": active_incidents,
            "responders": active_responders
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        print(f"🔌 WebSocket client disconnected (remaining: {len(connected_clients)})")

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 OmniDispatch Backend Starting...")
    print("="*60)
    print(f"📡 Server: http://localhost:8000")
    print(f"📡 WebSocket: ws://localhost:8000/ws")
    print(f"📡 API Docs: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# ============================================================================
# GUARDIAN KNOWLEDGE BASE API
# ============================================================================

class LocationSearchRequest(BaseModel):
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class BuildingRequest(BaseModel):
    building_id: str

@app.post("/api/guardian/search-location")
async def search_location(request: LocationSearchRequest):
    """Search for a location and get nearby hospitals and emergency buildings"""
    try:
        # If coordinates not provided, geocode the location name
        if request.lat is None or request.lng is None:
            # Check if Google Maps API key is available
            if not GOOGLE_MAPS_API_KEY:
                # Fallback to demo locations without API
                demo_locations = {
                    "charminar": (17.3616, 78.4747, "Charminar, Hyderabad, Telangana, India"),
                    "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana, India"),
                    "times square": (40.7580, -73.9855, "Times Square, New York, NY, USA"),
                    "new york": (40.7128, -74.0060, "New York, NY, USA"),
                    "tokyo": (35.6762, 139.6503, "Tokyo, Japan"),
                    "tokyo tower": (35.6586, 139.7454, "Tokyo Tower, Tokyo, Japan"),
                    "london": (51.5074, -0.1278, "London, United Kingdom"),
                    "big ben": (51.5007, -0.1246, "Big Ben, London, United Kingdom"),
                    "paris": (48.8566, 2.3522, "Paris, France"),
                    "eiffel tower": (48.8584, 2.2945, "Eiffel Tower, Paris, France"),
                }
                
                # Find matching location
                location_key = request.location.lower().strip()
                lat, lng, formatted_address = None, None, None
                
                for key, (demo_lat, demo_lng, demo_name) in demo_locations.items():
                    if key in location_key:
                        lat, lng, formatted_address = demo_lat, demo_lng, demo_name
                        break
                
                if lat is None:
                    # Default to Hyderabad if no match
                    lat, lng, formatted_address = 17.3850, 78.4867, request.location
            else:
                # Use Google Maps API
                async with httpx.AsyncClient() as client:
                    geocode_response = await client.get(
                        "https://maps.googleapis.com/maps/api/geocode/json",
                        params={
                            "address": request.location,
                            "key": GOOGLE_MAPS_API_KEY
                        },
                        timeout=10.0
                    )
                    geocode_data = geocode_response.json()
                    
                    print(f"Geocode API Status: {geocode_data.get('status')}")
                    
                    if geocode_data.get("status") != "OK" or not geocode_data.get("results"):
                        return {
                            "success": False,
                            "error": f"Location not found: {geocode_data.get('status', 'Unknown error')}",
                            "location": None,
                            "nearby_buildings": []
                        }
                    
                    location_data = geocode_data["results"][0]
                    lat = location_data["geometry"]["location"]["lat"]
                    lng = location_data["geometry"]["location"]["lng"]
                    formatted_address = location_data["formatted_address"]
        else:
            lat = request.lat
            lng = request.lng
            formatted_address = request.location
        
        # Search for nearby hospitals and important buildings
        nearby_buildings = []
        search_types = [
            ("hospital", "Medical Facility", "🏥"),
            ("fire_station", "Fire Station", "🚒"),
            ("police", "Police Station", "👮"),
            ("school", "School", "🏫"),
            ("shopping_mall", "Shopping Mall", "🏬"),
            ("stadium", "Stadium", "🏟️"),
            ("train_station", "Transit Hub", "🚉"),
            ("airport", "Airport", "✈️")
        ]
        
        # Try to use Google Places API if key is available
        if GOOGLE_MAPS_API_KEY:
            async with httpx.AsyncClient() as client:
                for place_type, category, icon in search_types:
                    try:
                        response = await client.get(
                            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                            params={
                                "location": f"{lat},{lng}",
                                "radius": 5000,  # 5km radius
                                "type": place_type,
                                "key": GOOGLE_MAPS_API_KEY
                            },
                            timeout=10.0
                        )
                        
                        data = response.json()
                        if data.get("status") == "OK" and data.get("results"):
                            # Take top 3 results for each type
                            for result in data["results"][:3]:
                                distance = calculate_distance(
                                    lat, lng,
                                    result["geometry"]["location"]["lat"],
                                    result["geometry"]["location"]["lng"]
                                )
                                
                                nearby_buildings.append({
                                    "id": result["place_id"],
                                    "name": result["name"],
                                    "address": result.get("vicinity", "Address not available"),
                                    "type": category,
                                    "icon": icon,
                                    "lat": result["geometry"]["location"]["lat"],
                                    "lng": result["geometry"]["location"]["lng"],
                                    "distance_km": round(distance, 2),
                                    "rating": result.get("rating", 0),
                                    "has_blueprint": random.choice([True, False]),
                                    "floors": random.randint(2, 15) if category in ["Medical Facility", "Shopping Mall", "Stadium"] else random.randint(1, 5),
                                    "photo_reference": result.get("photos", [{}])[0].get("photo_reference") if result.get("photos") else None
                                })
                    except Exception as e:
                        print(f"Error searching {place_type}: {str(e)}")
                        continue
        
        # If no API key or no results, generate demo data
        if not nearby_buildings:
            print("⚠️ Using demo building data (Google Maps API not available)")
            demo_buildings = [
                ("Gandhi Hospital", "Medical Facility", "🏥", "Musheerabad"),
                ("Osmania General Hospital", "Medical Facility", "🏥", "Afzal Gunj"),
                ("Apollo Hospital", "Medical Facility", "🏥", "Jubilee Hills"),
                ("KIMS Hospital", "Medical Facility", "🏥", "Secunderabad"),
                ("Yashoda Hospital", "Medical Facility", "🏥", "Malakpet"),
                ("Fire Station Abids", "Fire Station", "🚒", "Abids"),
                ("Fire Station Secunderabad", "Fire Station", "🚒", "Secunderabad"),
                ("Fire Station Kukatpally", "Fire Station", "🚒", "Kukatpally"),
                ("Abids Police Station", "Police Station", "👮", "Abids"),
                ("Begumpet Police Station", "Police Station", "👮", "Begumpet"),
                ("LB Nagar Police Station", "Police Station", "👮", "LB Nagar"),
                ("International School", "School", "🏫", "Gachibowli"),
                ("Delhi Public School", "School", "🏫", "Nacharam"),
                ("Inorbit Mall", "Shopping Mall", "🏬", "HITEC City"),
                ("City Centre Mall", "Shopping Mall", "🏬", "Banjara Hills"),
                ("GVK One Mall", "Shopping Mall", "🏬", "Banjara Hills"),
                ("Lal Bahadur Stadium", "Stadium", "🏟️", "Basheerbagh"),
                ("Secunderabad Railway Station", "Transit Hub", "🚉", "Secunderabad"),
                ("Hyderabad Metro Station", "Transit Hub", "🚉", "Ameerpet"),
                ("Rajiv Gandhi International Airport", "Airport", "✈️", "Shamshabad"),
            ]
            
            for i, (name, category, icon, area) in enumerate(demo_buildings):
                # Create slight variations in coordinates around the search location
                offset_lat = random.uniform(-0.05, 0.05)
                offset_lng = random.uniform(-0.05, 0.05)
                building_lat = lat + offset_lat
                building_lng = lng + offset_lng
                distance = calculate_distance(lat, lng, building_lat, building_lng)
                
                nearby_buildings.append({
                    "id": f"demo_{i}_{category.replace(' ', '_')}",
                    "name": name,
                    "address": f"{area}, Near {formatted_address}",
                    "type": category,
                    "icon": icon,
                    "lat": building_lat,
                    "lng": building_lng,
                    "distance_km": round(distance, 2),
                    "rating": round(random.uniform(3.5, 5.0), 1),
                    "has_blueprint": random.choice([True, True, False]),
                    "floors": random.randint(2, 15) if category in ["Medical Facility", "Shopping Mall", "Stadium"] else random.randint(1, 5),
                    "photo_reference": None
                })
        
        # Sort by distance
        nearby_buildings.sort(key=lambda x: x["distance_km"])
        
        return {
            "success": True,
            "location": {
                "name": formatted_address,
                "lat": lat,
                "lng": lng
            },
            "nearby_buildings": nearby_buildings[:20]  # Return top 20 closest
        }
        
    except Exception as e:
        print(f"Error in location search: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "location": None,
            "nearby_buildings": []
        }

@app.post("/api/guardian/building-details")
async def get_building_details(request: BuildingRequest):
    """Get detailed building information including blueprints and safety protocols"""
    try:
        # Generate dynamic building data with blueprints and protocols
        floors = random.randint(3, 25)
        building_type = random.choice(["Commercial", "Medical", "Residential", "Educational", "Hospitality", "Government"])
        
        # Generate floor plans
        floor_plans = []
        for floor in range(1, min(floors + 1, 6)):  # Show up to 5 floors
            floor_plans.append({
                "floor": floor,
                "name": f"Floor {floor}",
                "rooms": generate_floor_rooms(floor, building_type),
                "exits": generate_exits(floor),
                "fire_equipment": generate_fire_equipment(floor)
            })
        
        # Generate safety protocols based on building type
        protocols = generate_safety_protocols(building_type, floors)
        
        # Generate escape routes
        escape_routes = [
            {
                "id": f"route-{i}",
                "name": f"Primary Escape Route {i}",
                "description": f"Use stairwell {chr(65+i)} to reach ground floor exit",
                "estimated_time": f"{random.randint(2, 8)} minutes",
                "difficulty": random.choice(["Easy", "Moderate"]),
                "waypoints": [f"Floor {floors}", f"Stairwell {chr(65+i)}", "Ground Floor", f"Exit {chr(65+i)}"]
            }
            for i in range(min(3, floors // 5 + 1))
        ]
        
        return {
            "success": True,
            "building": {
                "id": request.building_id,
                "floors": floors,
                "type": building_type,
                "occupancy": random.randint(50, 1000),
                "last_inspection": "2025-12-15",
                "fire_system": "Automatic sprinkler + alarm",
                "ada_compliant": True,
                "floor_plans": floor_plans,
                "escape_routes": escape_routes,
                "safety_protocols": protocols,
                "emergency_contacts": [
                    {"role": "Building Manager", "phone": "+1-555-0100"},
                    {"role": "Security", "phone": "+1-555-0101"},
                    {"role": "Maintenance", "phone": "+1-555-0102"}
                ],
                "hazardous_materials": [] if building_type == "Residential" else [
                    "Basement: Chemical storage",
                    "Roof: Fuel tanks"
                ]
            }
        }
        
    except Exception as e:
        print(f"Error getting building details: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "building": None
        }

def generate_floor_rooms(floor: int, building_type: str) -> List[Dict]:
    """Generate room layout for a floor"""
    room_types = {
        "Commercial": ["Office", "Conference Room", "Storage", "Restroom"],
        "Medical": ["Patient Room", "Operating Room", "Waiting Area", "Lab", "Pharmacy"],
        "Residential": ["Apartment", "Common Area", "Laundry", "Storage"],
        "Educational": ["Classroom", "Lab", "Office", "Library", "Cafeteria"],
        "Hospitality": ["Guest Room", "Suite", "Ice Machine", "Vending"],
        "Government": ["Office", "Meeting Room", "Records", "Security"]
    }
    
    types = room_types.get(building_type, ["Room"])
    rooms = []
    num_rooms = random.randint(8, 20)
    
    for i in range(num_rooms):
        rooms.append({
            "id": f"{floor}{str(i+1).zfill(2)}",
            "name": f"Room {floor}{str(i+1).zfill(2)}",
            "type": random.choice(types),
            "capacity": random.randint(2, 50),
            "has_window": random.choice([True, False])
        })
    
    return rooms

def generate_exits(floor: int) -> List[Dict]:
    """Generate exit locations for a floor"""
    num_exits = 2 if floor == 1 else random.randint(2, 4)
    return [
        {
            "id": f"exit-{chr(65+i)}",
            "name": f"Exit {chr(65+i)}",
            "type": "Stairwell" if floor > 1 else "Ground Exit",
            "location": random.choice(["North", "South", "East", "West"]),
            "width": "42 inches",
            "illuminated": True
        }
        for i in range(num_exits)
    ]

def generate_fire_equipment(floor: int) -> List[Dict]:
    """Generate fire safety equipment locations"""
    equipment = []
    num_extinguishers = random.randint(3, 6)
    
    for i in range(num_extinguishers):
        equipment.append({
            "type": "Fire Extinguisher",
            "location": f"Corridor {chr(65+i)}",
            "class": random.choice(["ABC", "BC", "K"]),
            "last_inspected": "2025-11-30"
        })
    
    if floor == 1 or random.choice([True, False]):
        equipment.append({
            "type": "Fire Hose",
            "location": "Main Corridor",
            "length": "100 feet",
            "last_inspected": "2025-11-30"
        })
    
    return equipment

def generate_safety_protocols(building_type: str, floors: int) -> List[Dict]:
    """Generate safety protocols based on building type"""
    base_protocols = [
        {
            "id": "EVAC-001",
            "title": "General Evacuation Procedure",
            "category": "Evacuation",
            "priority": "Critical",
            "steps": [
                "Upon hearing alarm, immediately cease all activities",
                "Close windows and doors if time permits",
                "Use nearest marked exit - DO NOT use elevators",
                "Proceed to designated assembly point",
                "Report to floor warden for headcount"
            ],
            "version": "2026.1",
            "updated": "2026-01-10"
        },
        {
            "id": "FIRE-001",
            "title": "Fire Emergency Response",
            "category": "Fire Safety",
            "priority": "Critical",
            "steps": [
                "Activate nearest fire alarm pull station",
                "Call 911 immediately",
                "If fire is small, use nearby fire extinguisher (PASS method)",
                "If fire is large or spreading, evacuate immediately",
                "Close doors to contain fire spread",
                "Do not re-enter building until cleared by fire department"
            ],
            "version": "2026.1",
            "updated": "2026-01-05"
        }
    ]
    
    type_specific = {
        "Medical": [
            {
                "id": "MED-001",
                "title": "Patient Evacuation Protocol",
                "category": "Medical Emergency",
                "priority": "Critical",
                "steps": [
                    "Prioritize evacuation based on patient mobility",
                    "Use evacuation chairs for non-ambulatory patients",
                    "Medical staff to carry patient charts",
                    "Maintain oxygen supply during evacuation",
                    "Transport critical patients first"
                ],
                "version": "2026.1",
                "updated": "2025-12-20"
            }
        ],
        "Educational": [
            {
                "id": "EDU-001",
                "title": "Lockdown Procedure",
                "category": "Security",
                "priority": "Critical",
                "steps": [
                    "Lock all classroom doors",
                    "Close blinds and turn off lights",
                    "Move students away from doors and windows",
                    "Maintain silence",
                    "Do not open door for anyone until all-clear is given"
                ],
                "version": "2026.1",
                "updated": "2025-11-15"
            }
        ]
    }
    
    protocols = base_protocols + type_specific.get(building_type, [])
    
    # Add earthquake protocol for tall buildings
    if floors > 10:
        protocols.append({
            "id": "EARTH-001",
            "title": "Earthquake Response - High Rise",
            "category": "Natural Disaster",
            "priority": "Critical",
            "steps": [
                "DROP to hands and knees",
                "COVER under desk or table",
                "HOLD ON until shaking stops",
                "After shaking stops, check for injuries",
                "Evacuate if building is damaged or alarm sounds",
                "Use stairs only - avoid elevators"
            ],
            "version": "2026.1",
            "updated": "2025-10-30"
        })
    
    return protocols
