# User Messages & Logging

This document describes the messages users will see when using the Velt MCP Installer.

## 🔍 Velt Docs MCP Query Messages

### When Querying Real Velt Documentation

When the installer successfully queries the Velt Docs MCP server, you'll see:

```
🔍 Querying Velt Docs MCP server for implementation patterns...
   Query: "How do I implement freestyle comments in Next.js app router? Show me the best practices and code patterns."
   Endpoint: https://docs.velt.dev/mcp
   Using native fetch (Node 18+)
✅ Successfully queried Velt Docs MCP server!
   ✓ Patterns extracted from real Velt documentation
   ✓ Source: Velt Docs MCP (https://docs.velt.dev/mcp)
```

**In the installation report:**
```json
{
  "step": 3,
  "name": "query_velt_mcp",
  "status": "complete",
  "result": {
    "source": "velt-docs-mcp",
    "message": "✅ Successfully queried Velt Docs MCP server - using real documentation patterns"
  }
}
```

### When Using Fallback Patterns

When the Velt Docs MCP server is unavailable, you'll see:

```
🔍 Querying Velt Docs MCP server for implementation patterns...
   Query: "How do I implement freestyle comments in Next.js app router?"
   Endpoint: https://docs.velt.dev/mcp
   Using native fetch (Node 18+)

⚠️  Failed to query Velt Docs MCP server
   Error: HTTP 406: Not Acceptable
   → Falling back to hardcoded patterns
   → Patterns are based on known best practices
```

**In the installation report:**
```json
{
  "step": 3,
  "name": "query_velt_mcp",
  "status": "complete",
  "result": {
    "source": "fallback",
    "message": "⚠️  Using fallback patterns (Velt Docs MCP unavailable) - using known best practices"
  }
}
```

## 📊 Final Report Summary

The final installation report includes a `details` section showing which source was used:

### Success with Real MCP:
```json
{
  "status": "success",
  "summary": "Velt freestyle comments successfully installed in /path/to/project",
  "details": {
    "installationPath": "/path/to/project",
    "veltDocsMCP": "✅ Used real documentation",
    "mcpMessage": "✅ Successfully queried Velt Docs MCP server - using real documentation patterns"
  }
}
```

### Success with Fallback:
```json
{
  "status": "success",
  "summary": "Velt freestyle comments successfully installed in /path/to/project",
  "details": {
    "installationPath": "/path/to/project",
    "veltDocsMCP": "⚠️  Used fallback patterns",
    "mcpMessage": "⚠️  Using fallback patterns (Velt Docs MCP unavailable) - using known best practices"
  }
}
```

## 🎯 Visual Indicators

- ✅ **Green checkmark** = Real Velt Docs MCP query succeeded
- ⚠️ **Yellow warning** = Using fallback patterns
- 🔍 **Magnifying glass** = Query attempt in progress

## 📝 Console Output

All messages are sent to `stderr` (using `console.error`) so they appear in:
- IDE terminal/debug console
- MCP server logs
- Installation report

## 🔧 Troubleshooting

If you see fallback patterns being used:

1. **Check Velt Docs MCP configuration** in `.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "Velt": {
         "url": "https://docs.velt.dev/mcp"
       }
     }
   }
   ```

2. **Check network connectivity** - The installer needs internet access

3. **Check error message** - The specific error will be shown in the console

4. **Fallback is safe** - Hardcoded patterns are based on known best practices and will work correctly

