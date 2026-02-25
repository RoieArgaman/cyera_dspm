#!/usr/bin/env bash
set -e

# Resolve repo root: script lives in cyera-automation/scripts/, so two levels up.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ZIP_PATH="$REPO_ROOT/cyera-automation/platform Assignment.zip"
PLATFORM_DIR="$REPO_ROOT/platform-home-assignment"

echo "Repo root: $REPO_ROOT"

# --- Step 0: Prerequisites ---
if ! command -v docker &>/dev/null; then
  echo "Error: Docker is not installed or not in PATH. Install Docker and try again."
  exit 1
fi
if ! docker info &>/dev/null; then
  echo "Error: Docker daemon is not running. Start Docker Desktop (or the daemon) and try again."
  exit 1
fi

# --- Step 1: Check zip exists ---
if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Error: Platform zip not found. Expected at: $ZIP_PATH"
  exit 1
fi

# --- Step 2: Fix Docker credential config (avoid docker-credential-desktop error) ---
DOCKER_CONFIG="${HOME}/.docker/config.json"
if [[ -f "$DOCKER_CONFIG" ]]; then
  if grep -q '"credsStore"' "$DOCKER_CONFIG" && ! grep -q '"credsStore": ""' "$DOCKER_CONFIG"; then
    BACKUP="$DOCKER_CONFIG.bak.$(date +%s)"
    cp "$DOCKER_CONFIG" "$BACKUP"
    echo "Backed up Docker config to $BACKUP"
    # Portable sed: write to temp file then replace (works on macOS and Linux)
    sed 's/"credsStore": *"[^"]*"/"credsStore": ""/' "$DOCKER_CONFIG" > "${DOCKER_CONFIG}.tmp"
    mv "${DOCKER_CONFIG}.tmp" "$DOCKER_CONFIG"
    echo "Set Docker credsStore to empty so compose can pull images."
  fi
else
  mkdir -p "$(dirname "$DOCKER_CONFIG")"
  echo '{"credsStore":""}' > "$DOCKER_CONFIG"
  echo "Created minimal Docker config with empty credsStore."
fi

# --- Step 3: Unzip platform ---
echo "Unzipping platform..."
cd "$REPO_ROOT"
unzip -o "cyera-automation/platform Assignment.zip"

# --- Step 4: Start Compose ---
echo "Starting Docker Compose..."
cd "$PLATFORM_DIR"
if ! docker compose up -d; then
  echo "Error: Docker Compose failed. Ensure Docker is running and ports 3000/8080 are free."
  exit 1
fi

# --- Step 5: Wait for API health (optional; non-fatal on timeout) ---
HEALTH_URL="http://localhost:8080/api/health"
MAX_WAIT=90
INTERVAL=3
elapsed=0
if command -v curl &>/dev/null; then
  echo "Waiting for API to be ready (up to ${MAX_WAIT}s)..."
  while [[ $elapsed -lt $MAX_WAIT ]]; do
    if curl -sf "$HEALTH_URL" &>/dev/null; then
      echo "API is up."
      break
    fi
    sleep $INTERVAL
    elapsed=$((elapsed + INTERVAL))
  done
  if [[ $elapsed -ge $MAX_WAIT ]]; then
    echo "Warning: API health check timed out. Services may still be starting; try opening the app in a few minutes."
  fi
else
  echo "Note: curl not found; skipping health check. Wait a minute then open http://localhost:3000"
fi

# --- Step 6: Print success ---
echo ""
echo "--- Platform is running ---"
echo "  Web app:  http://localhost:3000"
echo "  API:      http://localhost:8080"
echo "  Login:    admin / <password from your local .env (ADMIN_PASSWORD)>"
echo ""
echo "Run tests from cyera-automation with: npm test"
echo ""
