#!/bin/bash

# === Utility for colored messages ===
green() { echo -e "\033[1;32m$1\033[0m"; }
red()   { echo -e "\033[1;31m$1\033[0m"; }

echo "🧹 Clearing previous logs..."
> react.log && > express.log && > fastapi.log

# === Free ports (5173, 3000, 8000) ===
for port in 5173 3000 8000; do
  pid=$(lsof -ti :$port)
  if [ -n "$pid" ]; then
    red "🛑 Port $port in use (PID $pid). Killing..."
    kill -9 $pid
  else
    green "✅ Port $port is free."
  fi
done

echo "🔄 Starting all services with live logs..."

# === Start React (Vite) ===
(cd Clients && npm run dev >> ../react.log 2>&1) &
REACT_PID=$!
green "▶️ React (Vite) → http://localhost:5173"

# === Start Express ===
(cd Servers && npm run watch >> ../express.log 2>&1) &
EXPRESS_PID=$!
green "▶️ Express → http://localhost:3000"

# === Start FastAPI ===
(cd BiasAndFairnessServers && source .venv/bin/activate && uvicorn app:app --reload --port 8000 --app-dir src >> ../fastapi.log 2>&1) &
FASTAPI_PID=$!
green "▶️ FastAPI → http://localhost:8000"

# === Small delay before showing logs ===
sleep 2
echo ""
green "📺 Showing live logs (press Ctrl+C to stop)..."
echo "─────────────── REACT ───────────────"
tail -n 20 -f react.log &
TAIL_REACT=$!
echo "────────────── EXPRESS ─────────────"
tail -n 20 -f express.log &
TAIL_EXPRESS=$!
echo "────────────── FASTAPI ─────────────"
tail -n 20 -f fastapi.log &
TAIL_FASTAPI=$!

# Wait for any process to exit
wait -n $REACT_PID $EXPRESS_PID $FASTAPI_PID

# If any service exits, stop tails and others
red "⚠️ One of the services has stopped. Cleaning up..."
kill $TAIL_REACT $TAIL_EXPRESS $TAIL_FASTAPI
kill $REACT_PID $EXPRESS_PID $FASTAPI_PID 2>/dev/null
