# 🚀 Quick Start Guide

## What Was Built

A complete MCP server with a single orchestrator tool that installs Velt with freestyle comments in Next.js projects.

## Project Structure

```
velt-mcp-installer/
├── bin/
│   └── mcp-server.js          # Entry point (executable)
├── src/
│   ├── index.js               # MCP server setup
│   ├── tools/
│   │   └── orchestrator.js    # Main orchestrator (5 steps)
│   └── utils/
│       ├── config.js           # Config collection
│       ├── cli.js              # Velt CLI execution
│       ├── velt-mcp.js         # Velt MCP queries
│       ├── integration.js      # Code integration
│       └── validation.js       # Validation checks
├── package.json
├── README.md
└── test-mcp.sh                # Test script
```

## Setup (3 Steps)

### 1. Install Dependencies

```bash
cd ~/Documents/velt-mcp-installer
npm install
```

### 2. Configure MCP in Cursor

Edit `.cursor/mcp.json` in your project (or create it):

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

### 3. Set Environment Variables

In your Next.js project:

```bash
export VELT_API_KEY="your_api_key_here"
```

Or create `.velt-agent-config.json`:

```json
{
  "apiKey": "your_api_key_here"
}
```

## Usage

1. **Restart Cursor** (important!)

2. **In AI chat, type:**
   ```
   install velt
   ```

3. **Watch the magic happen!** 🎉

The orchestrator will:
- ✅ Collect configuration
- ✅ Run Velt CLI
- ✅ Query Velt MCP for patterns
- ✅ Integrate components into your code
- ✅ Validate installation

## Testing

### Test Server Directly

```bash
cd ~/Documents/velt-mcp-installer
./test-mcp.sh
```

### Test in Real Project

1. Create test project:
   ```bash
   npx create-next-app@latest test-velt
   cd test-velt
   ```

2. Configure MCP (see step 2 above)

3. Set API key:
   ```bash
   export VELT_API_KEY="your_key"
   ```

4. Restart Cursor

5. In chat: `install velt`

## How It Works

### Sequential Execution (No Hallucination)

```javascript
// Step 1: Collect config
const config = await collectConfiguration();

// Step 2: Run CLI (waits for step 1)
const cli = await runVeltCli(config);

// Step 3: Query MCP (waits for step 2)
const patterns = await queryVeltMCP();

// Step 4: Integrate (waits for step 3)
const integration = await analyzeAndIntegrate(patterns);

// Step 5: Validate (waits for step 4)
const validation = await validateInstallation();
```

**All steps execute sequentially - guaranteed by JavaScript async/await!**

## Troubleshooting

### Server Not Starting

```bash
# Check Node version (need 18+)
node --version

# Check if file is executable
chmod +x bin/mcp-server.js

# Test imports
node -e "import('./src/index.js')"
```

### MCP Not Detected in Cursor

1. Check `.cursor/mcp.json` syntax (use JSON validator)
2. Restart Cursor completely (Cmd+Q, not just reload)
3. Check Cursor logs: `~/.cursor/logs/`

### CLI Not Found

Set `VELT_CLI_PATH` environment variable:

```bash
export VELT_CLI_PATH="/path/to/add-velt-next-js/bin/velt.js"
```

Or update `.velt-agent-config.json`:

```json
{
  "cliPath": "/path/to/velt.js"
}
```

## Next Steps

- [ ] Add real MCP prompts for user input
- [ ] Connect to actual Velt MCP server
- [ ] Add advanced code analysis (AST)
- [ ] Support multiple comment types
- [ ] Add rollback mechanism

## Success Criteria

✅ MCP server starts without errors
✅ Tool appears in Cursor/Claude Code
✅ `install velt` command works
✅ All 5 steps execute sequentially
✅ Validation passes (5/5 checks)

---

**Built with ❤️ for the Velt community**

