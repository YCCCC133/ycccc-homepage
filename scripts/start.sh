#!/bin/bash
set -e

# Ensure production mode for the entire script
export NODE_ENV=production

# Use COZE_WORKSPACE_PATH if set, otherwise use script location
if [[ -n "${COZE_WORKSPACE_PATH:-}" ]]; then
    cd "${COZE_WORKSPACE_PATH}"
else
    cd "$(dirname "$0")/.."
fi

echo "Working directory: $(pwd)"
echo "Supabase URL: ${COZE_SUPABASE_URL:-NOT_SET}"
echo "Supabase Anon Key: ${COZE_SUPABASE_ANON_KEY:+SET}"
echo "Supabase Service Key: ${COZE_SUPABASE_SERVICE_ROLE_KEY:+SET}"

# Start the server in production mode
NODE_ENV=production node dist/server.js
