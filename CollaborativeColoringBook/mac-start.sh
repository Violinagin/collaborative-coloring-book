#!/bin/bash
# mac-start.sh - Run on old MacBook
echo "🍎 Starting on Old MacBook..."
echo "============================="

# Load Mac settings
if [ -f .env.mac ]; then
  export $(grep -v '^#' .env.mac | xargs)
fi

# Start with LAN mode
npx expo start --lan --clear