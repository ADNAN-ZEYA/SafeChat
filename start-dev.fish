#!/usr/bin/env fish
# SafeChat Dev Launcher
# Activates venv, starts backend + frontend, opens browser

set PROJECT_DIR /home/kelvin/Documents/SafeChat_sepm
set BACKEND_DIR $PROJECT_DIR/backend-ml
set FRONTEND_DIR $PROJECT_DIR/safechat-react
set VENV_DIR $BACKEND_DIR/venv
set FRONTEND_URL http://localhost:5173

echo "🚀 SafeChat Dev Launcher"
echo "========================"

# 1. Activate venv & start backend
echo ""
echo "⚙️  Starting backend (uvicorn)..."
fish -c "
    source $VENV_DIR/bin/activate.fish
    cd $BACKEND_DIR
    uvicorn app:app --reload --host 127.0.0.1 --port 8000
" &
set BACKEND_PID $last_pid
echo "   Backend PID: $BACKEND_PID"

# 2. Start frontend
echo "⚙️  Starting frontend (vite)..."
fish -c "
    cd $FRONTEND_DIR
    npm run dev
" &
set FRONTEND_PID $last_pid
echo "   Frontend PID: $FRONTEND_PID"

# 3. Wait for frontend to be ready, then open browser
echo ""
echo "⏳ Waiting for frontend to start..."
set RETRIES 0
while test $RETRIES -lt 30
    sleep 1
    if curl -s -o /dev/null $FRONTEND_URL 2>/dev/null
        echo "✅ Frontend is ready!"
        echo "🌐 Opening browser..."
        xdg-open $FRONTEND_URL 2>/dev/null &
        break
    end
    set RETRIES (math $RETRIES + 1)
end

if test $RETRIES -ge 30
    echo "⚠️  Timed out waiting for frontend. Open $FRONTEND_URL manually."
end

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend:  http://127.0.0.1:8000"
echo "  Frontend: $FRONTEND_URL"
echo "  Press Ctrl+C to stop both"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4. Trap Ctrl+C to kill both processes
function cleanup --on-signal INT
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
end

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
