# Velt MCP Installer

An MCP (Model Context Protocol) server that provides AI-assisted installation of Velt collaboration features into React and Next.js projects.

## Part of the Velt Plugin Pipeline

```
Velt Plugin (Cursor/Claude) → registers this MCP server
  ↓
This MCP Installer           → orchestrates guided setup
  ↓ runs
Velt CLI (@velt-js/add-velt) → scaffolds files + installs deps
  ↓ references
Agent Skills                 → implementation patterns (118 rules)
```

If you're using the [Velt Cursor plugin](https://github.com/velt-js/velt-plugin), this MCP server is **auto-registered** — you don't need to configure it manually.

## Manual Setup (without plugin)

If you're not using the Velt plugin, add the MCP server to your IDE:

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "velt-installer": {
      "command": "npx",
      "args": ["-y", "@velt-js/mcp-installer"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add velt-installer -- npx -y @velt-js/mcp-installer
```

### Any MCP-compatible IDE

The server runs over stdio:
```
npx -y @velt-js/mcp-installer
```

After adding the config, **restart your IDE** to load the MCP server.

## Usage

In your AI chat, say:

```
install velt
```

The AI will walk you through:
1. Confirming your project directory
2. Providing your Velt API key and auth token (from https://console.velt.dev)
3. Selecting features (or typing SKIP for CLI-only mode)
4. Choosing VeltProvider location
5. Choosing corner position for Velt UI components
6. Reviewing the implementation plan
7. Approving and applying the plan

## Prerequisite: Agent Skills

For best results, install the Velt agent-skills library:

```bash
npx skills add velt-js/agent-skills
```

The installer generates plans that reference these skills by name. Without them, the AI falls back to embedded rules (concise summaries).

## Installation Modes

### Guided Mode (Default)

Full interactive installation with plan generation, codebase scanning, and user approval. The plan references specific agent-skills rules for each implementation step.

### CLI-Only Mode (SKIP)

Type **SKIP** at feature selection for quick scaffolding without guided setup.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `install_velt_interactive` | Guided or CLI-only installation |
| `take_project_screenshot` | Capture screenshot of running app |
| `detect_comment_placement` | Analyze project for comment placement |

## Features Supported

Comments (8 types), Presence, Cursors, Notifications, Recorder, CRDT (Tiptap, CodeMirror, BlockNote, ReactFlow)

## Related Repositories

| Repository | Role |
|-----------|------|
| [velt-js/velt-plugin](https://github.com/velt-js/velt-plugin) | Cursor and Claude plugins (registers this MCP server) |
| [velt-js/agent-skills](https://github.com/velt-js/agent-skills) | Implementation rules referenced by the installer plans |
| [velt-js/add-velt-next-js](https://github.com/velt-js/add-velt-next-js) | CLI scaffolder invoked by this installer |

## License

MIT
