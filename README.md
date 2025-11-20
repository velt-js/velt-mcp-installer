# Velt MCP Installer

**Status:** ✅ Functional POC - Ready for handoff

> 📖 **New to this project?** See [HANDOFF.md](./HANDOFF.md) for complete handoff documentation.

An MCP (Model Context Protocol) server that provides an orchestrator tool for installing Velt with freestyle comments in Next.js projects.

## 🎯 What This Does

Provides a **single MCP tool** (`install_velt_freestyle`) that orchestrates the complete Velt installation workflow:

1. **Collects Configuration** - Directory, API key, auth token
2. **Runs Velt CLI** - Executes `add-velt-cli` to install base components
3. **Queries Velt MCP** - Gets implementation patterns from Velt documentation
4. **Analyzes & Integrates** - Intelligently adds Velt components to customer code
5. **Validates** - Runs basic checks to ensure installation succeeded

## 🏗️ Architecture

```
velt-mcp-installer/
├── bin/
│   └── mcp-server.js          # Entry point
├── src/
│   ├── index.js                # MCP server setup
│   ├── tools/
│   │   └── orchestrator.js    # Main orchestrator (5 sequential steps)
│   └── utils/
│       ├── config.js           # Configuration collection
│       ├── cli.js              # Velt CLI execution
│       ├── velt-mcp.js         # Velt MCP query
│       ├── integration.js      # Code analysis & integration
│       └── validation.js      # Installation validation
└── package.json
```

## 🚀 Quick Start

### Installation

```bash
cd ~/Documents/velt-mcp-installer
npm install
```

### Configure in Cursor/Claude Code

Add to `.cursor/mcp.json` (or `.claude/mcp.json`):

```json
{
  "mcpServers": {
    "velt-installer": {
      "command": "node",
      "args": ["/Users/samarthgoel/Documents/velt-mcp-installer/bin/mcp-server.js"]
    }
  }
}
```

Or use npx (zero-install):

```json
{
  "mcpServers": {
    "velt-installer": {
      "command": "npx",
      "args": ["-y", "@veltdev/velt-mcp-installer"]
    }
  }
}
```

### Restart IDE

Restart Cursor or Claude Code to load the MCP server.

### Usage

In AI chat, simply say:

```
install velt
```

The orchestrator tool will:
- Collect configuration (API key from env or prompt)
- Run Velt CLI
- Query Velt MCP for patterns
- Integrate components into your code
- Validate installation

## 🔧 Configuration

### Environment Variables

```bash
export VELT_API_KEY="your_api_key_here"
export VELT_AUTH_TOKEN="your_auth_token_here"  # Optional
export VELT_CLI_PATH="/path/to/add-velt-next-js/bin/velt.js"  # Optional
```

### Config File

Alternatively, create `.velt-agent-config.json` in your project:

```json
{
  "apiKey": "your_api_key_here",
  "authToken": "your_auth_token_here",
  "cliPath": "/path/to/velt.js"
}
```

## 📊 How It Works

### Sequential Execution (No Hallucination Risk)

The orchestrator uses **JavaScript async/await** to guarantee sequential execution:

```javascript
async function installVeltFreestyle() {
  // Step 1: ALWAYS runs first
  const config = await collectConfiguration();
  
  // Step 2: ALWAYS runs second (after step 1)
  const cli = await runVeltCli(config);
  
  // Step 3: ALWAYS runs third (after step 2)
  const patterns = await queryVeltMCP();
  
  // Step 4: ALWAYS runs fourth (after step 3)
  const integration = await analyzeAndIntegrate(patterns);
  
  // Step 5: ALWAYS runs fifth (after step 4)
  const validation = await validate();
  
  return report;
}
```

**No AI decision-making inside the tool** - just deterministic JavaScript execution.

## 🧪 Testing

### Test MCP Server Directly

```bash
# Start server
node bin/mcp-server.js

# In another terminal, test with JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node bin/mcp-server.js
```

### Check Velt Docs MCP Connection

When you run the installer, you'll see clear messages indicating:

**✅ Real Velt Docs Query:**
```
🔍 Querying Velt Docs MCP server for implementation patterns...
✅ Successfully queried Velt Docs MCP server!
   ✓ Patterns extracted from real Velt documentation
```

**⚠️ Fallback Patterns:**
```
⚠️  Failed to query Velt Docs MCP server
   → Falling back to hardcoded patterns
   → Patterns are based on known best practices
```

See [MESSAGES.md](./MESSAGES.md) for complete message documentation.

### Test in Real Project

1. Create a test Next.js project:
```bash
npx create-next-app@latest test-velt-install
cd test-velt-install
```

2. Configure MCP server in `.cursor/mcp.json`

3. Restart Cursor

4. In chat: `install velt`

## 📝 POC Scope

**Included:**
- ✅ Single orchestrator tool
- ✅ Sequential execution (5 steps)
- ✅ Basic discovery (Next.js detection)
- ✅ Velt CLI integration
- ✅ Code integration (layout + page)
- ✅ Basic validation (5 checks)
- ✅ **MCP prompts protocol** (declared, IDE handles prompts)
- ✅ **Velt Docs MCP connection** (queries https://docs.velt.dev/mcp with fallback)

**Deferred:**
- ⚠️ Interactive prompt responses (currently uses env vars as fallback)
- ❌ Advanced code analysis (AST parsing)
- ❌ Multiple comment types
- ❌ Feature selection

## 🔮 Future Enhancements

- [x] MCP prompts protocol (declared, IDE integration needed)
- [x] Velt Docs MCP connection (with fallback)
- [ ] Interactive prompt response handling
- [ ] Advanced code analysis (AST parsing)
- [ ] Support for multiple comment types
- [ ] Feature selection (Comments, Presence, etc.)
- [ ] Rollback mechanism
- [ ] Comprehensive validation (30-point checklist)

## 📄 License

MIT

## 🤝 Contributing

This is a POC. Feedback welcome!

