#!/bin/bash
set -e

# Ensure production mode for the entire script
export NODE_ENV=production

cd /workspace/projects

# Start the server in production mode
NODE_ENV=production node dist/server.js
