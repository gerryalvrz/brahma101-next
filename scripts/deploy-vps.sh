#!/usr/bin/env bash
# Publish the working tree to brahma101.cyou (vps-brahma). Git push updates Vercel only.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Syncing to vps-brahma…"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  --exclude '.env.*' \
  --exclude .DS_Store \
  --exclude .vercel \
  --exclude agent-transcripts \
  --exclude coverage \
  ./ vps-brahma-agent:/home/agent/brahma101-web/

echo "Building and restarting brahma101.cyou (a few minutes)…"
ssh vps-brahma-agent 'cd /home/agent/brahma101-web && docker compose up -d --build'
echo "Live: https://brahma101.cyou"
