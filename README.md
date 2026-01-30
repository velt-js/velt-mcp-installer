# Velt MCP Installer

An MCP (Model Context Protocol) server that provides AI-assisted installation of Velt collaboration features into React and Next.js projects.

## Setup

Add the Velt MCP server to your coding IDE. Pick the section that matches your editor.

### Claude Code

Run this command in your terminal:

```bash
claude mcp add velt-installer -- npx -y @velt-js/mcp-installer
```

### Cursor

Add to `.cursor/mcp.json` in your project (or global config):

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

### Windsurf

Add to your Windsurf MCP config:

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

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Any other MCP-compatible IDE

The server runs over stdio. Use this command:

```
npx -y @velt-js/mcp-installer
```

Add it to your IDE's MCP server configuration with `command: "npx"` and `args: ["-y", "@velt-js/mcp-installer"]`.

---

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

## Installation Modes

### Guided Mode (Default)

Full interactive installation with plan generation and user approval:

1. Confirm project directory (validates React/Next.js project)
2. Provide API key and auth token
3. Select features (comments, presence, cursors, notifications, recorder, CRDT)
4. Choose VeltProvider location (app/page.tsx recommended)
5. Choose corner position for Velt features (top-left/top-right/bottom-left/bottom-right)
6. Tool generates implementation plan
7. User reviews and approves the plan
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

## How SKIP Works

At the feature selection prompt (Step 4), the AI will show:

```
Select features to install OR type SKIP for CLI-only:

Comments (specify type: freestyle/popover/page/text/inline/tiptap/lexical/slate)
Presence
Cursors
Notifications
Recorder
CRDT (specify editor: tiptap/codemirror/blocknote)

SKIP = CLI scaffolding only, no feature integration
```

If you type `SKIP` (case-insensitive):
- Runs Velt CLI scaffolding (creates base files)
- Runs basic QA validation
- Returns TODO checklist for manual setup
- Does NOT generate an implementation plan
- Does NOT modify project files beyond CLI scaffolding

## Plan/Apply Workflow (Guided Mode)

The guided mode uses a multi-step workflow with **discovery consent** and **verification**:

```
PHASE 1: COLLECT INFO (AI asks questions one at a time)
  Step 1: Confirm project directory
  Step 2: Get API key
  Step 3: Get auth token
  Step 4: Select features (or type SKIP)
  Step 5: Choose VeltProvider location
  Step 6: Choose corner position

PHASE 2: CLI + DISCOVERY CONSENT
  Tool Call #1: mode="guided", stage="plan"
    -> Run CLI + Scan Codebase
    -> status="awaiting_discovery_consent"
  AI asks: "Scan codebase for wiring info? [YES/NO]"

PHASE 3A: SCAN PATH (if YES)
  Tool Call #2: discoveryConsent="yes"
    -> Run Discovery Scan
    -> status="awaiting_discovery_verification"
  AI shows findings, asks: "Verify? [CONFIRM ALL/EDIT/UNSURE]"
  Tool Call #3: discoveryVerification={status:"confirmed"}
    -> Proceeds to PHASE 4

PHASE 3B: MANUAL PATH (if NO)
  Tool Call #2: discoveryConsent="no"
    -> status="awaiting_manual_wiring_answers"
  AI asks questionnaire (document ID, user auth, JWT, init location)
  Tool Call #3: manualWiring={...}
    -> Proceeds to PHASE 4

PHASE 4: PLAN GENERATION
  -> Generate Plan with Wiring
  -> status="plan_generated"
  AI presents plan, asks: "Would you like me to implement?"

PHASE 5: APPLY
  Tool Call #4: mode="guided", stage="apply", approved=true
    -> Full QA Validation
    -> status="apply_complete"
```

### Tool Response Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `awaiting_discovery_consent` | CLI done, need YES/NO for scanning | Ask user, call with `discoveryConsent` |
| `awaiting_discovery_verification` | Scan done, need verification | Show findings, call with `discoveryVerification` |
| `awaiting_manual_wiring_answers` | User said NO, need questionnaire | Ask questionnaire, call with `manualWiring` |
| `plan_generated` | Plan ready with verified/manual wiring | Present plan, ask approval |
| `apply_complete` | Installation complete | Show results |
| `cli_only_complete` | SKIP mode complete | Show TODO checklist |

## Generated Code Pattern

The installer follows this architecture pattern (based on Velt sample apps):

### File Structure

```
app/
├── layout.tsx              # Wraps with AppUserProvider
├── page.tsx                # Contains VeltProvider with authProvider hook
└── userAuth/
    ├── AppUserContext.tsx   # User context provider
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

## Source Priority: Agent Skills First

The MCP uses a three-tier source priority system for implementation guidance:

### Prerequisite

Install Velt Agent Skills into your AI editor:

```bash
npx skills add velt-js/agent-skills
```

This installs four skills:
- `velt-setup-best-practices` — VeltProvider setup, authentication, document identity, project structure
- `velt-comments-best-practices` — All comment types (freestyle, popover, page, text, tiptap, lexical, slate)
- `velt-crdt-best-practices` — Tiptap, BlockNote, CodeMirror, ReactFlow CRDT patterns
- `velt-notifications-best-practices` — Notification setup, customization, delivery

### Source Priority Order

| Priority | Source | When to Use |
|----------|--------|-------------|
| 1 (Primary) | **Agent Skills** | Always use first for features with skills coverage |
| 2 (Secondary) | **Docs URLs** (docs.velt.dev) | Only for features WITHOUT skills: presence, cursors, recorder |
| 3 (Tertiary) | **Velt Docs MCP** | Only for user follow-up questions AFTER implementation |

## Host App Wiring Discovery

The guided mode includes automatic discovery of integration points in your codebase:

### What It Scans For

1. **Document ID Source**: Dynamic route params, query params, database fetches, state variables
2. **User Authentication**: Next-Auth, Clerk, Auth0, Firebase Auth, Supabase Auth, custom auth
3. **Setup Location**: Root layout, specific pages, custom providers
4. **JWT Authentication**: Token generation endpoints, bearer auth patterns

If it can't determine something with confidence, it emits explicit questions rather than guessing.

## Framework Support

| Framework | Support Level | "use client" Directives |
|-----------|--------------|------------------------|
| **Next.js (App Router)** | Full | Auto-applied |
| **Next.js (Pages Router)** | Full | N/A |
| **Vite + React** | Full | Not needed |
| **Create React App** | Full | Not needed |
| **Plain React** | Full | Not needed |

## Available Tools

| Tool | Description |
|------|-------------|
| `install_velt_interactive` | Unified installer with guided or CLI-only mode |
| `install_velt_freestyle` | Legacy installer for basic freestyle comments |
| `take_project_screenshot` | Capture screenshot of running app |
| `detect_comment_placement` | Analyze project structure for comment placement |

## Features

- Guided mode with plan generation and user approval
- CLI-only mode (SKIP) for quick scaffolding
- Comments (8 types: freestyle, popover, page, text, inline, tiptap, lexical, slate)
- Presence (live user avatars)
- Cursors (real-time cursor tracking)
- Notifications
- Recorder
- CRDT (collaborative editing: Tiptap, CodeMirror, BlockNote)
- Basic and full integration validation
- Automatic framework detection
- "use client" directive handling for Next.js

## Development

```bash
# Clone the repo
git clone https://github.com/velt-js/mcp-installer.git
cd mcp-installer

# Install dependencies
npm install

# Start the server (stdio)
npm start

# Watch mode
npm run dev

# Test JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node bin/mcp-server.js
```

## License

MIT
