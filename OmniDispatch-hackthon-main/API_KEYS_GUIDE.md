# 🔑 API Keys Setup Guide

This guide will help you obtain all the necessary API keys for OmniDispatch.

---

## Required API Keys

### 1. ElevenLabs API Key 🎙️

**What it's for:** Voice AI and conversational interface

**How to get it:**
1. Go to https://elevenlabs.io
2. Sign up for a free account
3. Navigate to your profile settings
4. Copy your API key from the "API Keys" section
5. (Optional) Create a conversational AI agent and copy the Agent ID

**Add to .env:**
```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
```

**Free Tier:** 10,000 characters/month

---

### 2. Cerebras API Key 🧠

**What it's for:** Ultra-fast AI inference (sub-200ms)

**How to get it:**
1. Go to https://cerebras.ai or https://cloud.cerebras.ai
2. Sign up for access (may require waitlist)
3. Once approved, navigate to API keys section
4. Generate a new API key

**Add to .env:**
```env
CEREBRAS_API_KEY=your_key_here
```

**Alternative:** Use OpenAI API as fallback during development
```env
OPENAI_API_KEY=your_openai_key_here
```

---

### 3. Pinecone API Key 📊

**What it's for:** Vector database for RAG (knowledge base)

**How to get it:**
1. Go to https://www.pinecone.io
2. Sign up for a free account
3. Create a new project
4. Navigate to "API Keys" in the dashboard
5. Copy your API key and environment name
6. Create an index named "omnidispatch-knowledge"

**Add to .env:**
```env
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=your_environment_here
PINECONE_INDEX_NAME=omnidispatch-knowledge
```

**Free Tier:** 1 pod, 5M vectors

**Alternative:** The project also supports ChromaDB (local, no API key needed)

---

### 4. OpenAI API Key 🤖

**What it's for:** Embeddings and fallback LLM

**How to get it:**
1. Go to https://platform.openai.com
2. Sign up or log in
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key immediately (shown only once)

**Add to .env:**
```env
OPENAI_API_KEY=sk-your_key_here
```

**Pricing:** Pay-as-you-go, ~$0.01 per 1000 tokens

---

### 5. Google Maps API Key 🗺️

**What it's for:** Tactical map visualization

**How to get it:**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Go to "Credentials" section
5. Create a new API key
6. (Optional) Restrict the key to your domain

**Add to .env:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

**Free Tier:** $200 credit per month

**Alternative:** The project has a custom SVG-based map that works without API key

---

## Quick Setup Checklist

- [ ] ElevenLabs API key obtained
- [ ] Cerebras API key obtained (or OpenAI as fallback)
- [ ] Pinecone account created and index set up
- [ ] OpenAI API key obtained
- [ ] Google Maps API key obtained
- [ ] All keys added to `.env` file
- [ ] All keys added to `frontend/.env.local` file
- [ ] Both servers restarted after adding keys

---

## Testing Your Setup

### Test Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

Visit http://localhost:8000/health - should show all systems "online"

### Test Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 - should load without errors

---

## Troubleshooting

### "Invalid API Key" Errors
- Double-check you copied the key correctly (no extra spaces)
- Make sure you're using the correct key type (some services have multiple)
- Verify the key hasn't expired or been revoked
- Restart the server after adding keys

### "Rate Limit Exceeded"
- You've hit the free tier limit
- Wait for the limit to reset (usually monthly)
- Upgrade to a paid plan
- Use alternative service temporarily

### "Service Unavailable"
- Check your internet connection
- Verify the service status page
- Try again in a few minutes
- Use alternative/fallback service

---

## Development Without All Keys

You can run OmniDispatch with partial API keys:

### Minimum Viable Setup
```env
# Just OpenAI for development
OPENAI_API_KEY=your_key_here

# Everything else can be dummy values
ELEVENLABS_API_KEY=dummy
CEREBRAS_API_KEY=dummy
PINECONE_API_KEY=dummy
GOOGLE_MAPS_API_KEY=dummy
```

The frontend will work with mock data, and you can test the UI fully.

---

## Production Checklist

Before deploying to production:

- [ ] All API keys are production-grade (not test keys)
- [ ] Keys are stored in secure environment variables
- [ ] API key restrictions are configured (domain, IP)
- [ ] Rate limits are understood and monitored
- [ ] Billing alerts are set up
- [ ] Backup/fallback services are configured
- [ ] Keys are never committed to git
- [ ] Team has access to key management system

---

## Security Best Practices

1. **Never commit keys to git**
   - Use .env files (already in .gitignore)
   - Use environment variables in production

2. **Rotate keys regularly**
   - Change keys every 90 days minimum
   - Immediately rotate if compromised

3. **Use key restrictions**
   - Limit by domain/IP when possible
   - Set usage quotas
   - Enable monitoring/alerts

4. **Separate dev/prod keys**
   - Never use production keys in development
   - Use different accounts if possible

---

## Cost Optimization Tips

1. **Use free tiers during development**
2. **Implement caching** to reduce API calls
3. **Set up billing alerts** on all services
4. **Monitor usage daily** during testing
5. **Use local alternatives** when possible (ChromaDB vs Pinecone)

---

## Need Help?

- Check each service's documentation
- Visit their support forums
- Contact their support team
- Check the project's GitHub issues

---

**Happy Building! 🚀**
