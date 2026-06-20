#!/bin/bash
# Exit on any error
set -e

# 1. Check if docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: docker is not installed. Please install Docker first."
  echo "See: https://docs.docker.com/get-docker/"
  exit 1
fi

# 2. Check if current user has access to Docker daemon
if ! docker ps &> /dev/null; then
  # Check if user is in the docker group in /etc/group but group is inactive in current shell
  if getent group docker | grep -q -E "\b${USER}\b"; then
    echo "Docker permission denied. Rerunning dev environment via 'sg docker'..."
    exec sg docker -c "bash \"$0\" \"$@\""
  else
    echo "Error: Permission denied to Docker daemon."
    echo "Please add your user to the docker group:"
    echo "  sudo usermod -aG docker \$USER"
    echo "Then restart your session or run 'newgrp docker' in your terminal."
    exit 1
  fi
fi

# 3. Start Supabase, with automatic cleanup fallback on port conflicts
echo "Starting Supabase local development..."
if ! npx supabase start; then
  echo "Supabase start failed. Attempting to stop stale containers and retry..."
  npx supabase stop
  npx supabase start
fi

# 4. Launch the frontend development server
echo "Starting UI dev server..."
npm --prefix ui run dev:local
