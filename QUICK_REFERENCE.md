# Quick Reference Guide

## 🎯 What This Is

An MCP server that installs Velt with freestyle comments in Next.js projects using a single command.

## 📁 Key Files

| File | Purpose |
|------|---------|
| `HANDOFF.md` | **Start here** - Complete handoff documentation |
| `PENDING_ITEMS.md` | Detailed breakdown of pending work |
| `src/tools/orchestrator.js` | Main workflow (5 steps) |
| `src/utils/integration.js` | **⚠️ Needs AST analysis** |
| `src/utils/velt-mcp.js` | Velt Docs query (uses fallback) |

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd /Users/samarthgoel/Documents/velt-mcp-installer
npm install

# 2. Configure in Cursor (.cursor/mcp.json)
{
  "mcpServers": {
    "velt-installer": {
      "command": "node",
      "args": ["/Users/samarthgoel/Documents/velt-mcp-installer/bin/mcp-server.js"]
    }
  }
}

# 3. Restart Cursor

# 4. Use: "install velt" in chat
```

## ⚠️ Critical Pending Item

**AST-Based Code Analysis** (`src/utils/integration.js`)

**Current:** String matching  
**Needed:** AST parsing with Babel/TypeScript  
**Why:** Production-ready code analysis  
**Priority:** 🔴 **CRITICAL**

## ✅ What Works

- MCP server runs correctly
- Orchestrator executes 5 steps sequentially
- Installation succeeds
- Error handling works
- Fallback patterns work

## ⏸️ What's Pending

1. **AST code analysis** (Critical)
2. Velt Docs MCP connection (fallback works)
3. Interactive MCP prompts (env vars work)
4. Advanced integration
5. Comprehensive validation

## 🐛 Known Issues

1. **Velt Docs MCP times out** - Architectural limitation, fallback works
2. **Basic code analysis** - Needs AST parsing
3. **Hardcoded CLI path** - Has fallback, works

## 📚 Documentation

- `HANDOFF.md` - Complete handoff doc
- `PENDING_ITEMS.md` - Detailed pending items
- `README.md` - Main documentation
- `DIAGNOSTICS.md` - Troubleshooting

---

**For complete details, see [HANDOFF.md](./HANDOFF.md)**

