# 🚀 Quick Start Guide

## Step 1: Install Dependencies

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: Configure Environment

Copy the `.env.example` file to `.env` and add your API keys:

```bash
cp .env.example .env
```

Then edit `.env` with your keys:
- ElevenLabs API key
- Cerebras API key
- Pinecone API key
- OpenAI API key
- Google Maps API key

## Step 3: Run the Application

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python main.py
```

Backend will start at: http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Frontend will start at: http://localhost:3000

## Step 4: Explore!

1. Open http://localhost:3000 in your browser
2. Click "Enter War Room" to see the main dispatch interface
3. Click the green phone button to simulate an active call
4. Watch the AI agents work in real-time!
5. Explore "View Analytics" for Chronos
6. Check the Guardian Knowledge Base

## 🎯 Demo Tips

- The War Room shows real-time stress analysis and AI thinking
- Chronos displays predictive hotspots and patterns
- Guardian has building blueprints and safety protocols
- Everything is animated for maximum visual impact!

## 🐛 Troubleshooting

**Port already in use?**
- Frontend: Change port in package.json
- Backend: Change port in main.py

**Missing API keys?**
- Check .env file exists
- Verify all keys are filled in
- Restart both servers after adding keys

**Dependencies not installing?**
- Update Node.js to version 18+
- Update Python to 3.10+
- Clear npm cache: `npm cache clean --force`

## 📚 Next Steps

1. Read the full README.md for architecture details
2. Customize the UI colors in tailwind.config.js
3. Add your own sample data in backend/services/rag.py
4. Integrate real API keys for live demo

---

**Need help?** Check the README.md or API documentation at http://localhost:8000/docs
