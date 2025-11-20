#!/bin/bash

# Quick test script for MCP server
# Tests that the server can start and respond to tools/list

echo "🧪 Testing Velt MCP Installer Server..."
echo ""

# Test 1: Check if server file exists
if [ ! -f "bin/mcp-server.js" ]; then
  echo "❌ bin/mcp-server.js not found"
  exit 1
fi
echo "✅ Server file exists"

# Test 2: Check if dependencies are installed
if [ ! -d "node_modules/@modelcontextprotocol" ]; then
  echo "❌ MCP SDK not installed. Run: npm install"
  exit 1
fi
echo "✅ Dependencies installed"

# Test 3: Test JSON-RPC tools/list (basic syntax check)
echo ""
echo "📋 Testing tools/list request..."
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | timeout 2 node bin/mcp-server.js 2>&1 | head -5

echo ""
echo "✅ Basic tests complete!"
echo ""
echo "To test in Cursor:"
echo "1. Add to .cursor/mcp.json:"
echo '   {'
echo '     "mcpServers": {'
echo '       "velt-installer": {'
echo '         "command": "node",'
echo '         "args": ["'$(pwd)'/bin/mcp-server.js"]'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "2. Restart Cursor"
echo "3. In chat: 'install velt'"

