#!/usr/bin/env bash
set -euo pipefail

NODE_ENV=production deno run -A --no-check server/app/entry.ts \
  > /tmp/syncparty-prod.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

sleep 6
curl -fsS http://localhost:5173/healthz > /dev/null
curl -fsS http://localhost:5173/ | grep -q "The Sync Party"
echo "SMOKE OK"
