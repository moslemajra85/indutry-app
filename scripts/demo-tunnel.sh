#!/usr/bin/env sh

set -eu

APP_URL="${APP_URL:-http://localhost:4000}"
HEALTH_URL="${APP_URL}/health"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-90}"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf '%s\n' "Missing required command: $1"
    printf '%s\n' "$2"
    exit 1
  }
}

request_url() {
  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent "$1" >/dev/null
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget --quiet --spider "$1"
    return
  fi

  printf '%s\n' "Missing required command: curl or wget"
  printf '%s\n' "Install one of them so the script can check ${HEALTH_URL} before opening the tunnel."
  exit 1
}

require_command docker "Install Docker Desktop or Docker Engine, then run this command again."
require_command cloudflared "Install cloudflared, then run this command again: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"

docker compose version >/dev/null 2>&1 || {
  printf '%s\n' "Docker Compose is not available through 'docker compose'."
  printf '%s\n' "Install the Docker Compose plugin, then run this command again."
  exit 1
}

printf '%s\n' "Starting IndustryOps demo stack..."
docker compose up --build -d app

printf '%s' "Waiting for ${HEALTH_URL}"
elapsed=0
until request_url "$HEALTH_URL"; do
  elapsed=$((elapsed + 2))

  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    printf '\n%s\n' "The app did not become healthy within ${MAX_WAIT_SECONDS} seconds."
    printf '%s\n' "Check container logs with: docker compose logs app postgres"
    exit 1
  fi

  printf '.'
  sleep 2
done

printf '\n%s\n' "Demo app is ready at ${APP_URL}"
printf '%s\n' "Opening a Cloudflare Quick Tunnel. Copy the public trycloudflare.com URL printed below."
printf '%s\n' "Press Ctrl+C to stop the tunnel. Containers keep running; stop them with: docker compose down"

cloudflared tunnel --url "$APP_URL"
