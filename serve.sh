#!/usr/bin/env sh
# Local preview. Usage: ./serve.sh [port]
set -eu

PORT="${1:-8085}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Slickworks -> http://localhost:${PORT}"
exec python3 -m http.server "${PORT}" --directory "${DIR}"
