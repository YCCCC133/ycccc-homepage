#!/bin/bash
set -e

# Ensure production mode for the entire script
export NODE_ENV=production

# Use relative path to support different deployment environments
cd "$(dirname "$0")/.." && pwd

# Start the server in production mode
NODE_ENV=production node dist/server.js
