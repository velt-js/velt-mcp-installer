# Setting Up Velt Docs MCP Connection

To enable the Velt MCP Installer to query real Velt documentation, you need to configure the Velt Docs MCP server in your IDE.

## Configure Velt Docs MCP Server

### For Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Velt": {
      "url": "https://docs.velt.dev/mcp"
    },
    "velt-installer": {
      "command": "node",
      "args": ["/Users/samarthgoel/Documents/velt-mcp-installer/bin/mcp-server.js"]
    }
  }
}
```

### For Claude Code

Run:
```bash
claude mcp add --transport http Velt https://docs.velt.dev/mcp
```

### For Claude Desktop

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "Velt": {
      "url": "https://docs.velt.dev/mcp"
    }
  }
}
```

## How It Works

1. **Velt Docs MCP Server** (`https://docs.velt.dev/mcp`) provides documentation search
2. **Velt MCP Installer** queries this server for implementation patterns
3. If the server is unavailable, fallback patterns are used

## Testing the Connection

The installer will automatically:
- Try to query Velt Docs MCP server
- Extract code patterns from documentation
- Fall back to hardcoded patterns if unavailable

Check the installation report to see which source was used:
- `source: 'velt-docs-mcp'` = Real documentation queried ✅
- `source: 'fallback'` = Using hardcoded patterns ⚠️

