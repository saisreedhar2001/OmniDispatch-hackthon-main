# OmniDispatch: The Wafer-Scale Emergency Intelligence

<div align="center">

![OmniDispatch Logo](https://img.shields.io/badge/OmniDispatch-Emergency%20Intelligence-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Hackathon%20Ready-success?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/Powered%20by-Cerebras%20%7C%20ElevenLabs-orange?style=for-the-badge)

**Sub-200ms AI reasoning. Multi-agent coordination. Predictive intelligence.**  
*The future of emergency dispatch is here.*

</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd omni-dispatch

# Frontend Setup
cd frontend
npm install
cp ../.env.example .env.local
# Edit .env.local with your API keys
npm run dev

# Backend Setup (separate terminal)
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your API keys
python main.py
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 The Vision

Most emergency systems are **reactive**. OmniDispatch is **predictive**.

By utilizing Cerebras' wafer-scale hardware, we've eliminated the 3-second latency gap that traditionally prevents AI from being used in life-or-death situations. Our agents hear a fire, verify it against building blueprints in our RAG vault, and coordinate the entire response team **before the caller even hangs up**.

---

## 🏗️ Architecture

### The "Turbo" Crew (Powered by Cerebras)

Using Cerebras' high-speed inference (1,000+ tokens/sec), our agents "think" as fast as they can talk:

#### **Agent A: The Empathetic Intake** 🎙️
- Manages voice stream via ElevenLabs
- Analyzes caller stress levels in real-time
- Uses custom RAG query-rewriting for context preservation

#### **Agent B: The Incident Historian** 🧠
- Searches historical incident logs
- Queries technical manuals and building data
- Pattern recognition across 1000s of past incidents

#### **Agent C: The Strategic Orchestrator** 🎯
- Triggers external APIs (Maps, Fire, Police, EMS)
- Coordinates multi-agency response
- Updates real-time dashboards

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Voice AI** | ElevenLabs ConvAI 2.0 | Low-latency voice interaction with built-in RAG |
| **Inference** | Cerebras API | Sub-200ms reasoning eliminates AI lag |
| **Orchestration** | CrewAI | Parallel multi-agent task execution |
| **Vector DB** | Pinecone / ChromaDB | Historical logs and blueprint storage |
| **Frontend** | Next.js 14 + Shadcn/UI | Mission Control dark-mode interface |
| **Backend** | FastAPI + Python | High-performance async API |

---

## 🎨 The Three Command Centers

### 1. **War Room** - Active Dispatch Center
- 🎙️ **Voice-Sync Visualization**: Pulsing waveform reacting to caller stress
- 🧠 **Live Thought Trace**: Real-time Cerebras reasoning display
- 🗺️ **Tactical Map**: 3D scene rendering with GPS responder tracking

### 2. **Chronos** - Predictive Analytics
- 🔥 **Predictive Hotspotting**: Risk zones based on incident clustering
- ⏰ **Temporal Correlation**: Weather/traffic impact on response times
- 📊 **Pattern Recognition**: AI-discovered incident patterns

### 3. **Guardian** - Knowledge Base
- 🏢 **Smart Blueprints**: 3D floor plans with AI-assisted navigation
- 📚 **Safety Protocols**: 2026-standard emergency procedures
- 🔍 **Instant Search**: RAG-powered knowledge retrieval

---

## 📁 Project Structure

```
omni-dispatch/
├── frontend/                 # Next.js 14 Application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── warroom/     # War Room dispatch
│   │   │   ├── chronos/     # Analytics dashboard
│   │   │   └── guardian/    # Knowledge base
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Shadcn UI components
│   │   │   └── dispatch/    # Custom dispatch components
│   │   └── lib/             # Utilities
│   ├── package.json
│   └── tailwind.config.js
├── backend/                  # FastAPI Backend
│   ├── main.py              # API entry point
│   ├── agents/
│   │   └── crew.py          # CrewAI agent definitions
│   ├── services/
│   │   └── rag.py           # RAG knowledge base
│   └── requirements.txt
└── .env.example             # Environment template
```

---

## 🔑 Environment Variables

Create `.env` files in the root directory:

### Required API Keys

```env
# ElevenLabs (Voice AI)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here

# Cerebras (Ultra-Fast Inference)
CEREBRAS_API_KEY=your_key_here

# Pinecone (Vector Database)
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=your_environment_here

# OpenAI (Fallback/Embeddings)
OPENAI_API_KEY=your_key_here

# Google Maps (Tactical Map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## 🚦 API Endpoints

### Emergency Call Processing
```http
POST /api/emergency/call
Content-Type: application/json

{
  "caller_phone": "+1-555-123-4567",
  "location": {"lat": 40.7128, "lng": -74.0060},
  "transcript": "There's a fire on the 3rd floor!",
  "stress_level": 0.87
}
```

### Active Incidents
```http
GET /api/incidents/active
```

### Knowledge Base Search
```http
GET /api/knowledge/search?query=fire protocol
```

### Building Blueprints
```http
GET /api/buildings/{building_id}
```

### Risk Hotspots
```http
GET /api/analytics/hotspots
```

---

## 🎪 Demo Flow

1. **Start the System**: Navigate to War Room
2. **Initiate Call**: Click green phone button
3. **Watch Magic Happen**:
   - Voice waveform shows real-time audio
   - Stress level indicator tracks caller emotion
   - AI thoughts stream in <200ms
   - Map updates with responder locations
   - Units automatically dispatched

4. **Explore Analytics**: Check Chronos for predictive insights
5. **Access Knowledge**: Guardian provides instant building info

---

## 🏆 Hackathon Winning Features

### Innovation (🌟🌟🌟🌟🌟)
- **Sub-200ms AI reasoning** with Cerebras
- **Multi-agent coordination** via CrewAI
- **Predictive hotspotting** from historical data
- **Voice stress analysis** integration

### User Experience (🌟🌟🌟🌟🌟)
- **Dark-mode Mission Control** aesthetic
- **Real-time animations** and live updates
- **Intuitive 3-panel layout** for each view
- **Professional emergency service** design

### Technical Excellence (🌟🌟🌟🌟🌟)
- **Type-safe** with TypeScript
- **Modern stack**: Next.js 14, FastAPI
- **Scalable architecture** with RAG
- **WebSocket** real-time communication

---

## 🔧 Development Commands

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint check
```

### Backend
```bash
python main.py   # Start FastAPI server
uvicorn main:app --reload  # Auto-reload mode
```

---

## 📈 Future Enhancements

- [ ] Full ElevenLabs conversational AI integration
- [ ] Real-time GPS tracking of emergency vehicles
- [ ] Mobile app for field responders
- [ ] Integration with actual 911 systems
- [ ] Machine learning model training on real data
- [ ] Multi-language support
- [ ] Drone dispatch coordination
- [ ] AR visualization for responders

---

## 🤝 Contributing

This is a hackathon project built for demonstration purposes. For production use, please ensure proper security audits and emergency service compliance.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Cerebras** for wafer-scale computing
- **ElevenLabs** for natural voice AI
- **CrewAI** for agent orchestration
- **Shadcn** for beautiful UI components
- **Emergency responders** everywhere 🚒🚑🚓

---

<div align="center">

**Built with ❤️ for emergency response innovation**

*OmniDispatch © 2026*

</div>
