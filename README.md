# Velt MCP Installer

**Status:** ✅ Production Ready

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
4. Choose VeltProvider location (app/page.tsx recommended)
5. Choose corner position for Velt features (top-left/top-right/bottom-left/bottom-right)
6. **Tool generates implementation PLAN**
7. **User reviews and approves the plan**
8. AI applies the plan step-by-step
9. Full QA validation

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
- ❌ Does NOT ask more questions (VeltProvider location, corner position)
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

## 🎨 Generated Code Pattern

The MCP installer instructs the AI to follow this architecture pattern (based on Velt sample apps):

### File Structure Created

```
app/
├── layout.tsx              # Wraps with AppUserProvider
├── page.tsx                # Contains VeltProvider with authProvider hook
└── userAuth/
    ├── AppUserContext.tsx  # User context provider
    └── useAppUser.tsx      # User data hook

components/velt/
├── VeltInitializeUser.tsx      # Exports useVeltAuthProvider hook
├── VeltInitializeDocument.tsx  # Exports useCurrentDocument hook
└── VeltCollaboration.tsx       # All Velt feature components

app/api/velt/token/
└── route.ts                # JWT token generation API
```

### layout.tsx Pattern

```tsx
import { AppUserProvider } from './userAuth/AppUserContext'

export default function RootLayout({ children }) {
  return (
    <html><body>
      <AppUserProvider>{children}</AppUserProvider>
    </body></html>
  )
}
```

### page.tsx Pattern

```tsx
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

export default function Page() {
  const { authProvider } = useVeltAuthProvider();
  const { documentId } = useCurrentDocument();

  return (
    <VeltProvider apiKey={VELT_API_KEY} authProvider={authProvider}>
      <VeltCollaboration documentId={documentId} />
      {/* Your page content */}
    </VeltProvider>
  );
}
```

### Corner Positioning

All Velt feature components (presence, notifications, comments sidebar) are grouped in the user's chosen corner:

```tsx
// VeltCollaboration.tsx
<div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
  <VeltPresence />
  <VeltNotificationsTool />
  <VeltCommentsSidebar />
</div>
<VeltCursor />
```

## 🏗️ MCP Architecture

```
velt-mcp-installer/
├── bin/
│   └── mcp-server.js              # Entry point
├── src/
│   ├── index.js                   # MCP server setup + tool definitions
│   ├── tools/
│   │   ├── unified-installer.js   # Main installer (guided + CLI-only modes)
│   │   └── orchestrator.js        # Legacy installer (install_velt_freestyle)
│   └── utils/
│       ├── cli.js                 # Velt CLI execution wrapper
│       ├── local-cli.js           # Local CLI binary resolution + execution
│       ├── config.js              # Configuration collection
│       ├── framework-detection.js # Next.js project detection
│       ├── validation.js          # Installation validation (basic + full)
│       ├── plan-formatter.js      # Plan generation + CLI-only report
│       ├── velt-docs-fetcher.js   # Fetch docs from markdown URLs
│       ├── velt-docs-urls.js      # Documentation URL helpers
│       ├── velt-mcp.js            # Velt MCP query + library detection
│       ├── velt-mcp-client.js     # Velt Docs MCP client
│       ├── integration.js         # Code analysis & integration
│       ├── header-positioning.js  # Sidebar header positioning
│       ├── use-client.js          # "use client" directive handling
│       ├── comment-detector.js    # Placement detection
│       └── screenshot.js          # Playwright screenshots
├── package.json
└── README.md
```

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `install_velt_interactive` | **Recommended** - Unified installer with guided or CLI-only mode |
| `install_velt_freestyle` | Legacy installer for basic freestyle comments |
| `take_project_screenshot` | Capture screenshot of running Next.js app |
| `detect_comment_placement` | Analyze project structure for comment placement |

## 🚀 Quick Start

### Installation

```bash
cd ~/Documents/velt-mcp-installer
npm install
```

### Configure in Claude Desktop / Cursor

Add to your MCP configuration file:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

**Cursor** (`.cursor/mcp.json`):

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

### Restart IDE

Restart your IDE to load the MCP server.

### Usage

In AI chat, simply say:

```
install velt
```

The AI will guide you through:
1. Confirming your project directory
2. Providing your Velt API key and auth token
3. Selecting features (or typing SKIP for CLI-only mode)
4. Choosing VeltProvider location
5. Choosing corner position for all Velt features
6. Reviewing the implementation plan (guided mode)
7. Approving and executing the plan

## 🔧 Configuration

### Environment Variables

```bash
export VELT_API_KEY="your_api_key_here"
export VELT_AUTH_TOKEN="your_auth_token_here"  # Optional
```

### Config File

Alternatively, create `.velt-agent-config.json` in your project:

```json
{
  "apiKey": "your_api_key_here",
  "authToken": "your_auth_token_here"
}
```

## 🧪 Testing

### Test MCP Server

```bash
# Start server (runs on stdio)
npm start

# Or with watch mode for development
npm run dev
```

### Test JSON-RPC

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node bin/mcp-server.js
```

### Test in Real Project

1. Create a test Next.js project:
```bash
npx create-next-app@latest test-velt-install
cd test-velt-install
```

2. Configure MCP server in your IDE

3. Restart IDE

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

## 📄 License

MIT
