@echo off
echo ================================================
echo   OmniDispatch Setup Script
echo   Wafer-Scale Emergency Intelligence
echo ================================================
echo.

echo [1/4] Setting up Backend...
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [2/4] Setting up Frontend...
cd frontend
if not exist node_modules (
    echo Installing Node.js dependencies...
    call npm install
)
cd ..

echo.
echo [3/4] Setting up Environment Files...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your API keys!
    echo.
)

if not exist frontend\.env.local (
    echo Creating frontend .env.local file...
    copy .env.example frontend\.env.local
    echo.
    echo ⚠️  IMPORTANT: Edit frontend\.env.local with your API keys!
    echo.
)

echo.
echo [4/4] Setup Complete!
echo.
echo ================================================
echo   Next Steps:
echo ================================================
echo.
echo 1. Edit .env files with your API keys:
echo    - .env (backend)
echo    - frontend\.env.local (frontend)
echo.
echo 2. Start the Backend (Terminal 1):
echo    cd backend
echo    venv\Scripts\activate
echo    python main.py
echo.
echo 3. Start the Frontend (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open http://localhost:3000 in your browser
echo.
echo ================================================
echo.
echo Press any key to exit...
pause > nul
