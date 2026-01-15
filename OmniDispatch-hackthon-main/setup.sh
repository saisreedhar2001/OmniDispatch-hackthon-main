#!/bin/bash

echo "================================================"
echo "  OmniDispatch Setup Script"
echo "  Wafer-Scale Emergency Intelligence"
echo "================================================"
echo ""

echo "[1/4] Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt
cd ..

echo ""
echo "[2/4] Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi
cd ..

echo ""
echo "[3/4] Setting up Environment Files..."
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your API keys!"
    echo ""
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend .env.local file..."
    cp .env.example frontend/.env.local
    echo ""
    echo "⚠️  IMPORTANT: Edit frontend/.env.local with your API keys!"
    echo ""
fi

echo ""
echo "[4/4] Setup Complete!"
echo ""
echo "================================================"
echo "  Next Steps:"
echo "================================================"
echo ""
echo "1. Edit .env files with your API keys:"
echo "   - .env (backend)"
echo "   - frontend/.env.local (frontend)"
echo ""
echo "2. Start the Backend (Terminal 1):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "3. Start the Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "================================================"
echo ""
