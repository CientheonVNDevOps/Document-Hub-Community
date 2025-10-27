#!/bin/bash
# Test script to diagnose frontend server issues
# Usage: ./test-server.sh

echo "🔍 Frontend Server Diagnostic Script"
echo "====================================="
echo

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found"
    echo "Please run this script from apps/frontend directory"
    exit 1
fi

echo "✅ Found server.js"
echo

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "⚠️  Warning: dist directory not found"
    echo "Building the frontend..."
    bun run build
    echo
fi

if [ -d "dist" ]; then
    echo "✅ Dist directory exists"
    echo "📁 Contents of dist:"
    ls -la dist/
    echo
    
    # Check for index.html
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html exists"
        echo "📄 Size of index.html: $(du -h dist/index.html | cut -f1)"
        echo "📄 First lines of index.html:"
        head -5 dist/index.html
    else
        echo "❌ index.html NOT found in dist/"
    fi
else
    echo "❌ Dist directory does not exist after build!"
fi

echo
echo "🧪 Testing server.js locally..."
echo "Starting server on port 3001 (to avoid conflicts)..."
echo
PORT=3001 bun run server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Test health endpoint
echo "Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
echo "Response: $HEALTH_RESPONSE"

if [ "$HEALTH_RESPONSE" = "healthy" ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Test root endpoint
echo
echo "Testing / endpoint..."
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/)
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$ROOT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Root endpoint responded with 200"
    echo "📄 Response size: $(echo "$RESPONSE_BODY" | wc -c) bytes"
    if [ $(echo "$RESPONSE_BODY" | wc -c) -gt 1000 ]; then
        echo "✅ Response size looks good (> 1KB)"
    else
        echo "⚠️  Warning: Response size is very small ($(echo "$RESPONSE_BODY" | wc -c) bytes)"
        echo "Response preview:"
        echo "$RESPONSE_BODY" | head -10
    fi
else
    echo "❌ Root endpoint failed with HTTP $HTTP_CODE"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null

echo
echo "🎯 Diagnostic complete!"

