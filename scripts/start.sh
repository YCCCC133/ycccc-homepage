#!/bin/bash
set -e

# Ensure production mode for the entire script
export NODE_ENV=production
export DEPLOY_RUN_PORT=5000

# Use COZE_WORKSPACE_PATH if set, otherwise use script location
if [[ -n "${COZE_WORKSPACE_PATH:-}" ]]; then
    cd "${COZE_WORKSPACE_PATH}"
else
    cd "$(dirname "$0")/.."
fi

echo "=== Production Start Script ==="
echo "Working directory: $(pwd)"
echo "NODE_ENV: ${NODE_ENV}"
echo "COZE_SUPABASE_URL: ${COZE_SUPABASE_URL:-NOT_SET}"
echo "COZE_SUPABASE_ANON_KEY: ${COZE_SUPABASE_ANON_KEY:+SET}"
echo "COZE_SUPABASE_SERVICE_ROLE_KEY: ${COZE_SUPABASE_SERVICE_ROLE_KEY:+SET}"
echo "COZE_WORKSPACE_PATH: ${COZE_WORKSPACE_PATH:-NOT_SET}"
echo "==============================="

# Start the server in production mode
node dist/server.js
