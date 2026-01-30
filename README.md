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

The guided mode uses a multi-step workflow with **discovery consent** and **verification**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUIDED MODE WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: COLLECT INFO (AI asks questions one at a time)
═══════════════════════════════════════════════════════════════════
  Step 1: Confirm project directory
  Step 2: Get API key
  Step 3: Get auth token
  Step 4: Select features (or type SKIP)
  Step 5: Choose VeltProvider location
  Step 6: Choose corner position

PHASE 2: CLI + DISCOVERY CONSENT
═══════════════════════════════════════════════════════════════════
  Tool Call #1: mode="guided", stage="plan"
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Run CLI + Scan Codebase            │
  │  status="awaiting_discovery_consent"│
  └─────────────────────────────────────┘
       │
       ▼
  AI asks: "Scan codebase for wiring info? [YES/NO]"

PHASE 3A: SCAN PATH (if user says YES)
═══════════════════════════════════════════════════════════════════
  Tool Call #2: discoveryConsent="yes"
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Run Discovery Scan                 │
  │  status="awaiting_discovery_        │
  │         verification"               │
  └─────────────────────────────────────┘
       │
       ▼
  AI shows findings, asks: "Verify? [CONFIRM ALL/EDIT/UNSURE]"
       │
       ▼
  Tool Call #3: discoveryVerification={status:"confirmed"}
       │
       └──────────────► PHASE 4

PHASE 3B: MANUAL PATH (if user says NO)
═══════════════════════════════════════════════════════════════════
  Tool Call #2: discoveryConsent="no"
       │
       ▼
  ┌─────────────────────────────────────┐
  │  status="awaiting_manual_wiring_    │
  │         answers"                    │
  └─────────────────────────────────────┘
       │
       ▼
  AI asks questionnaire (A-D) one section at a time:
    A) Document ID source
    B) User authentication
    C) Auth/JWT token
    D) Velt initialization location
       │
       ▼
  Tool Call #3: manualWiring={documentId:{...}, user:{...}, ...}
       │
       └──────────────► PHASE 4

PHASE 4: PLAN GENERATION
═══════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────┐
  │  Generate Plan with Wiring          │
  │  status="plan_generated"            │
  └─────────────────────────────────────┘
       │
       ▼
  AI presents plan, asks: "Would you like me to implement?"

PHASE 5: APPLY
═══════════════════════════════════════════════════════════════════
  Tool Call #4: mode="guided", stage="apply", approved=true
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Full QA Validation                 │
  │  status="apply_complete"            │
  └─────────────────────────────────────┘
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

### Manual Wiring Questionnaire (if user says NO to scanning)

When the user declines codebase scanning, they must answer these questions:

**A) Document ID**
- How do you obtain the documentId? (query param, route param, database, storage, other)
- Which file reads/creates it?
- What is the variable name?

**B) User Identity**
- How do you get the current user? (next-auth, clerk, firebase, supabase, custom, other)
- Which file/hook provides it?
- What fields are available? (userId, name, email, photoUrl)

**C) Auth/JWT Token**
- Do you use a JWT or auth token? (cookie, localStorage, provider-sdk, none, unsure)
- Where is it obtained?
- Is there a refresh flow?

**D) Velt Initialization Location**
- Where should Velt be initialized? (root-layout, specific-page, editor-wrapper, other)
- What file path?

**IMPORTANT**: If the user answers "unsure" to any question, the plan will include explicit TODOs and will NOT guess.

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

## 📚 Source Priority: Agent Skills First

The MCP uses a three-tier source priority system for implementation guidance:

### Prerequisite

Install Velt Agent Skills into your AI editor:

```bash
npx skills add velt-js/agent-skills
```

This installs four skills into the AI editor's context:
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

### Feature → Skill Mapping

| Feature | Agent Skill | Coverage |
|---------|------------|----------|
| Setup / Provider / Auth / Document | `velt-setup-best-practices` | Full |
| Comments (all types) | `velt-comments-best-practices` | Full |
| CRDT (tiptap/blocknote/codemirror) | `velt-crdt-best-practices` | Full |
| Notifications | `velt-notifications-best-practices` | Full |
| Presence | No skill — use docs URLs | Fallback |
| Cursors | No skill — use docs URLs | Fallback |
| Recorder | No skill — use docs URLs | Fallback |

### How It Works

The MCP does NOT read skills files from disk. Instead:
1. Skills are installed into the AI editor's context via `npx skills add`
2. The MCP's generated plan **references skills by name** (e.g., "Use velt-comments-best-practices for freestyle comments")
3. The AI editor already has the skills loaded and can consult them directly
4. Docs URLs are only emitted for features without skills coverage

## 🔍 Host App Wiring Discovery (NEW)

The guided mode now includes automatic discovery of integration points in your codebase:

### What It Scans For

1. **Document ID Source**: Where does your app get unique document identifiers?
   - Dynamic route parameters (`[id]`, `[slug]`)
   - Query parameters (`?docId=123`)
   - Database/API fetches
   - State variables

2. **User Authentication**: How do users authenticate?
   - Next-Auth
   - Clerk
   - Auth0
   - Firebase Auth
   - Supabase Auth
   - Custom auth contexts

3. **Setup Location**: Where should VeltProvider be placed?
   - Root layout (`app/layout.tsx`)
   - Specific pages
   - Custom providers

4. **JWT Authentication**: Does your app use JWT tokens?
   - Token generation endpoints
   - Bearer auth patterns

### Discovery Output

The plan includes an **Integration Findings** section:

```
## 🔍 Integration Findings (Host App Wiring Discovery)

### Document ID Source
✅ **Recommended**: Dynamic route folder [id]
   - File: `app/documents/[id]/page.tsx`
   - Parameter: `id`

### User Authentication
✅ **Detected**: next-auth
   - Context file: `app/api/auth/[...nextauth]/route.ts`

### Recommended Setup Location
✅ **Recommended file**: `app/documents/[id]/page.tsx`
   - Type: page
   - Already has VeltProvider ✓

### ❓ Questions for Developer
**IMPORTANT**: The following items need your input before proceeding:

**1. Which authentication method should be used for Velt users?**
   - Use existing Next-Auth session
   - Create separate Velt users
   - Help me understand the options
```

### HARD RULE: If Unsure, Ask

The discovery system follows a strict rule: **if it can't determine something with confidence, it emits explicit questions** rather than guessing. This ensures you don't end up with incorrect wiring.

## 🖥️ Framework Support

### Supported Frameworks

| Framework | Support Level | "use client" Directives |
|-----------|--------------|------------------------|
| **Next.js (App Router)** | Full | ✅ Auto-applied |
| **Next.js (Pages Router)** | Full | N/A |
| **Vite + React** | Full | ❌ Not needed |
| **Create React App** | Full | ❌ Not needed |
| **Plain React** | Full | ❌ Not needed |

### Framework Detection

The installer automatically detects your framework by scanning:
- `package.json` dependencies (`next`, `vite`, `react-scripts`)
- File structure (`app/`, `pages/`, `src/main.tsx`, etc.)

For **Next.js projects**, `"use client"` directives are automatically added to client components.

For **plain React projects**, the installer skips `"use client"` handling.

## 🔧 Local CLI Resolution

The installer uses the local `add-velt` CLI for scaffolding. It resolves the CLI binary using a two-step process:

### Resolution Priority

1. **npm-linked binary** (preferred): Checks if `add-velt` is available via `which add-velt`
2. **Direct execution** (fallback): Falls back to direct `node /path/to/bin/velt.js` execution

### Setup (Already Done)

If you've run `npm i && npm link` in the CLI repo, the linked binary should be available:

```bash
# In /Users/yoenzhang/Downloads/add-velt-next-js
npm install
npm link

# Verify it's linked
which add-velt
# Should output: /usr/local/bin/add-velt (or similar)
```

### CLI Method in Reports

All installation reports include the CLI method used:

```
**CLI Method:** npm-linked binary (`add-velt`)
```

or

```
**CLI Method:** Direct execution (`node bin/velt.js`)
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

## 📝 Example Tool Calls

### SKIP Mode (CLI-Only)

**User types `SKIP` at feature selection**

```json
{
  "name": "install_velt_interactive",
  "arguments": {
    "projectPath": "/path/to/my-nextjs-app",
    "apiKey": "vk_abc123...",
    "authToken": "at_xyz789...",
    "mode": "cli-only"
  }
}
```

**Output (truncated):**

```markdown
# ✅ Velt CLI Installation Complete (CLI-Only Mode)

**CLI Method:** npm-linked binary (`add-velt`)
**Framework:** nextjs (with "use client" enforcement)

You chose **SKIP** - the Velt CLI scaffolding has been run without feature integration.

## Files Created by Velt CLI

```
components/velt/
├── VeltCollaboration.tsx
├── VeltInitializeDocument.tsx
└── VeltInitializeUser.tsx

app/userAuth/
├── AppUserContext.tsx
└── useAppUser.tsx
```

## Validation Results

- ✅ **CLI Execution Method**: Used npm-linked binary (add-velt)
- ✅ **@veltdev/react package**: Package found in package.json
- ✅ **CLI file: VeltInitializeUser.tsx**: Found at components/velt/VeltInitializeUser.tsx
...

**Score:** 7/7 | **Status:** excellent

## 📋 TODO Checklist (You Need To Complete)
...
```

### Guided Mode - Plan Stage

**User selects features (e.g., "comments, presence, cursors")**

```json
{
  "name": "install_velt_interactive",
  "arguments": {
    "projectPath": "/path/to/my-nextjs-app",
    "apiKey": "vk_abc123...",
    "authToken": "at_xyz789...",
    "mode": "guided",
    "stage": "plan",
    "features": ["comments", "presence", "cursors"],
    "commentType": "freestyle",
    "headerPosition": "top-right",
    "veltProviderLocation": "app/layout.tsx"
  }
}
```

**Output (truncated):**

```markdown
# Plan for Velt Installation: Freestyle Comments, Presence, Cursors

## 1. ⚠️ CRITICAL: Only implement Freestyle Comments, Presence, Cursors
*   **Details:** You are ONLY installing: Freestyle Comments, Presence, Cursors...

## 2. Import and use CLI-generated Velt components in app/layout.tsx
*   **Details:** The Velt CLI has generated the necessary component files...

...

## 🔍 Integration Findings (Host App Wiring Discovery)

### Document ID Source
✅ **Recommended**: Dynamic route folder [id]
   - File: `app/projects/[id]/page.tsx`
   - Parameter: `id`

### User Authentication
✅ **Detected**: next-auth
   - Context file: `app/api/auth/[...nextauth]/route.ts`

### ❓ Questions for Developer
**1. Where does the document ID come from in your application?**
   - URL route parameter (e.g., /documents/[id])
   - URL query parameter (e.g., ?docId=123)
   - Fetched from database/API based on current page
   - Not sure / Need help deciding
```

### Guided Mode - Apply Stage

**After user approves the plan**

```json
{
  "name": "install_velt_interactive",
  "arguments": {
    "projectPath": "/path/to/my-nextjs-app",
    "apiKey": "vk_abc123...",
    "authToken": "at_xyz789...",
    "mode": "guided",
    "stage": "apply",
    "approved": true,
    "features": ["comments", "presence", "cursors"],
    "commentType": "freestyle",
    "headerPosition": "top-right",
    "veltProviderLocation": "app/layout.tsx"
  }
}
```

**Output:**

```markdown
# Installation Apply Stage Complete

Installation complete! All validation checks passed. Check browser DevTools for Velt errors.

## Validation Results
- ✅ CLI Resolution: Using npm-linked binary
- ✅ Velt package installed: @veltdev/react found in package.json
- ✅ Environment configured: NEXT_PUBLIC_VELT_API_KEY found in .env.local
- ✅ VeltProvider configured: VeltProvider found in layout
- ✅ VeltComments added: VeltComments found in page
...

**Score:** 8/8

## 🔍 Final Steps

1. Start your development server: `npm run dev`
2. Open browser DevTools Console (F12)
3. Look for Velt messages and errors
4. Test the installed features
5. If errors occur, query Velt Docs MCP for solutions
```

## 📄 License

MIT
