#!/usr/bin/env sh
# Local preview. Usage: ./serve.sh [port]
set -eu

PORT="${1:-8085}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Clockwork vs Chaos -> http://localhost:${PORT}"
exec python3 -m http.server "${PORT}" --directory "${DIR}"
