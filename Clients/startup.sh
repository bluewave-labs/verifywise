#!/bin/bash
# startup.sh

# Check if VITE_APP_API_BASE_URL is set, if not default to http://localhost:3000
echo "Setting up the VITE_APP_API_BASE_URL..."
export VITE_APP_API_BASE_URL=${VITE_APP_API_BASE_URL:-"http://localhost:3000"}

# Start the application (e.g., serving your frontend app)
exec "$@"
