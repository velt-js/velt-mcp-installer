# Velt MCP Installer

**Status:** ✅ Production Ready

> 📖 **New to this project?** See [HANDOFF.md](./HANDOFF.md) for complete handoff documentation.

An MCP (Model Context Protocol) server that provides AI-assisted installation of Velt collaboration features into Next.js projects.

## 🎯 What This Does

Provides a **unified installation tool** (`install_velt_interactive`) with two modes:

1. **Guided Mode** (default): Full installation with plan generation, user approval, and step-by-step implementation
2. **CLI-Only Mode** (SKIP): Quick scaffolding with Velt CLI only - user wires features manually

## 🚀 Installation Modes

### Guided Mode (Default)

Full interactive installation with plan generation and user approval:

1. Confirm project directory (validates Next.js project)
2. Provide API key and auth token
3. Select features (comments, presence, cursors, etc.)
4. **Tool generates implementation PLAN**
5. **User reviews and approves the plan**
6. AI applies the plan step-by-step
7. Full QA validation

### CLI-Only Mode (SKIP)

Fast scaffolding without feature integration:

1. Confirm project directory
2. Provide API key and auth token
3. Type **SKIP** at feature selection
4. Velt CLI runs, creates scaffold files
5. Basic QA validation
6. TODO checklist for manual setup

**When to use SKIP:**
- You're experienced with Velt
- You want to wire features yourself
- You just need the base files
- You'll integrate features manually later

## 📋 How SKIP Works

**IMPORTANT**: SKIP does NOT mean "use defaults". SKIP means CLI-only mode with NO feature integration.

At the feature selection prompt (Step 4), the AI will show:

```
Select features to install OR type SKIP for CLI-only (you set up features yourself later):

📝 Comments (specify type: freestyle/popover/page/text/inline/tiptap/lexical/slate)
👥 Presence
🖱️ Cursors
🔔 Notifications
🎥 Recorder
📄 CRDT (specify editor: tiptap/codemirror/blocknote)
─────────────────────────────────────
⏭️  SKIP = CLI scaffolding only, no feature integration
```

If you type `SKIP` (case-insensitive):
- ✅ Runs Velt CLI scaffolding (creates base files)
- ✅ Runs basic QA validation
- ✅ Returns TODO checklist for manual setup
- ❌ Does NOT use any defaults (no "freestyle comments")
- ❌ Does NOT ask more questions (VeltProvider location, sidebar position)
- ❌ Does NOT generate implementation plan
- ❌ Does NOT modify project files beyond CLI scaffolding

## 📋 Plan/Apply Workflow (Guided Mode)

```
┌─────────────────┐
│  Select Features │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate PLAN  │  ← Tool call #1: mode="guided", stage="plan"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Approval  │  ← AI presents plan, asks: "Would you like me to implement?"
└────────┬────────┘
         │
    (user says yes)
         │
         ▼
┌─────────────────┐
│   Apply PLAN    │  ← Tool call #2: mode="guided", stage="apply", approved=true
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Full QA       │
└─────────────────┘
```

## 🏗️ Architecture

```
velt-mcp-installer/
├── bin/
│   └── mcp-server.js              # Entry point
├── src/
│   ├── index.js                    # MCP server setup + tool definitions
│   ├── tools/
│   │   ├── unified-installer.js   # Main installer (guided + CLI-only modes)
│   │   ├── orchestrator.js        # [deprecated] Legacy orchestrator
│   │   ├── interactive-installer.js # [deprecated] Interactive installer
│   │   └── plan-based-installer.js  # [deprecated] Plan-based installer
│   └── utils/
│       ├── config.js               # Configuration collection
│       ├── cli.js                  # Velt CLI execution
│       ├── velt-mcp.js             # Velt MCP query
│       ├── velt-docs-fetcher.js    # Fetch docs from markdown URLs
│       ├── velt-docs-urls.js       # Documentation URL helpers
│       ├── integration.js          # Code analysis & integration
│       ├── validation.js           # Installation validation (basic + full)
│       ├── plan-formatter.js       # Plan generation + CLI-only report
│       ├── comment-detector.js     # Placement detection
│       └── screenshot.js           # Playwright screenshots
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
      "args": ["/path/to/velt-mcp-installer/bin/mcp-server.js"]
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

The AI will guide you through:
1. Confirming your project directory
2. Providing your Velt API key and auth token
3. Selecting features (or typing SKIP for CLI-only mode)
4. Reviewing the implementation plan (guided mode)
5. Approving and executing the plan

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

### Unified Installer Flow

The unified installer (`installVeltUnified`) handles both modes:

```javascript
// CLI-Only Mode (SKIP)
installVeltUnified({
  projectPath: '/path/to/project',
  apiKey: 'your-api-key',
  authToken: 'your-auth-token',
  mode: 'cli-only',  // <-- SKIP triggers this
});
// Returns: CLI scaffold report + TODO checklist

// Guided Mode - Plan Stage
installVeltUnified({
  projectPath: '/path/to/project',
  apiKey: 'your-api-key',
  authToken: 'your-auth-token',
  mode: 'guided',
  stage: 'plan',
  features: ['comments', 'presence'],
  commentType: 'freestyle',
});
// Returns: Implementation PLAN (no changes applied)

// Guided Mode - Apply Stage (after user approval)
installVeltUnified({
  projectPath: '/path/to/project',
  apiKey: 'your-api-key',
  authToken: 'your-auth-token',
  mode: 'guided',
  stage: 'apply',
  approved: true,  // <-- User approved the plan
  features: ['comments', 'presence'],
  commentType: 'freestyle',
});
// Returns: Full QA validation results
```

**Key Principle:** Plan generation and application are separate stages. The AI must present the plan to the user and wait for approval before making any file changes.

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

## ✅ Features

**Installation Modes:**
- ✅ Guided mode with plan generation and user approval
- ✅ CLI-only mode (SKIP) for quick scaffolding
- ✅ Two-stage workflow: plan → approve → apply

**Feature Support:**
- ✅ Comments (8 types: freestyle, popover, page, text, inline, tiptap, lexical, slate)
- ✅ Presence (live user avatars)
- ✅ Cursors (real-time cursor tracking)
- ✅ Notifications
- ✅ Recorder
- ✅ CRDT (collaborative editing: Tiptap, CodeMirror, BlockNote)

**Validation:**
- ✅ Basic CLI validation (for SKIP mode)
- ✅ Full integration validation (for guided mode)
- ✅ Next.js project validation

**Documentation:**
- ✅ Fetches implementation patterns from Velt docs (.md URLs)
- ✅ Parallel doc fetching for performance
- ✅ Fallback patterns if fetch fails

## 🔮 Future Enhancements

- [ ] Rollback mechanism for failed installations
- [ ] Advanced code analysis (AST parsing)
- [ ] Auto-detection of existing Velt installations
- [ ] Support for non-Next.js frameworks

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the [HANDOFF.md](./HANDOFF.md) for architecture details.

