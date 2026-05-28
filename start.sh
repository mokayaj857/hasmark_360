#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Starting Anvil (chain 1337)…"
nohup /home/junia/.foundry/bin/anvil --chain-id 1337 --allow-origin '*' --host 0.0.0.0 \
  >> /tmp/anvil.log 2>&1 &
disown $!
sleep 2

# Verify Anvil
curl -sf -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null \
  && echo "  ✓ Anvil running on :8545" || echo "  ✗ Anvil failed to start"

echo "▶ Deploying contract…"
cd "$ROOT/back" && node scripts/deploy.js local

echo "▶ Starting backend (port 4000)…"
node server.js >> /tmp/backend.log 2>&1 &
disown $!
sleep 2
curl -sf http://localhost:4000/api/health > /dev/null \
  && echo "  ✓ Backend running on :4000" || echo "  ✗ Backend failed to start"

echo ""
echo "✅  All services running. Now start the frontend:"
echo "   cd $ROOT && npm run dev"
