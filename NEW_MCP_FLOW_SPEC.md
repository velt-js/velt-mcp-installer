# New MCP Flow Specification v2.0

**Purpose:** Reliable, minimal Velt installation with two distinct paths integrated into existing MCP
**Version:** 2.0
**Created:** December 2024

---

## Flowchart: Two-Path Installation

```
                                    ┌─────────────────────────────┐
                                    │     USER TRIGGERS MCP       │
                                    │   "@velt-installer install" │
                                    └─────────────┬───────────────┘
                                                  │
                                                  ▼
                              ┌───────────────────────────────────────┐
                              │     STEP 1: CONFIRM DIRECTORY         │
                              │                                       │
                              │  "Is this your Next.js project?"      │
                              │  [Show: /path/to/project]             │
                              │                                       │
                              │  Validate: package.json + next dep    │
                              └───────────────────┬───────────────────┘
                                                  │
                                                  ▼
                     ┌────────────────────────────────────────────────────┐
                     │              STEP 2: DECISION GATE                 │
                     │                                                    │
                     │  "How would you like to install Velt?"             │
                     │                                                    │
                     │  ┌──────────────────┐    ┌──────────────────────┐  │
                     │  │ A) QUICK SETUP   │    │ B) GUIDED SETUP      │  │
                     │  │    (Fast Path)   │    │    (Full Path)       │  │
                     │  │                  │    │                      │  │
                     │  │ "Just add the    │    │ "Help me wire it     │  │
                     │  │  component files │    │  into my existing    │  │
                     │  │  - I'll wire it  │    │  codebase"           │  │
                     │  │  myself"         │    │                      │  │
                     │  └────────┬─────────┘    └──────────┬───────────┘  │
                     │           │                         │              │
                     └───────────┼─────────────────────────┼──────────────┘
                                 │                         │
           ┌─────────────────────┘                         └─────────────────────┐
           │                                                                     │
           ▼                                                                     ▼
┌──────────────────────────────┐                          ┌──────────────────────────────────────┐
│    PATH A: QUICK SETUP       │                          │      PATH B: GUIDED SETUP            │
│      (Deterministic)         │                          │       (Non-Deterministic)            │
├──────────────────────────────┤                          ├──────────────────────────────────────┤
│                              │                          │                                      │
│  A1. Run Velt CLI            │                          │  B1. Ask: API Key                    │
│      └─ Creates 3 files:     │                          │      "Provide your Velt API Key"     │
│         • VeltInitializeUser │                          │                                      │
│         • VeltInitializeDoc  │                          │  B2. Ask: Auth Token                 │
│         • VeltCollaboration  │                          │      "Provide your Auth Token"       │
│                              │                          │                                      │
│  A2. Verify files exist      │                          │  B3. Ask: Features                   │
│                              │                          │      □ Comments (type?)              │
│  A3. Output TODO checklist   │                          │      □ Presence                      │
│      with explicit TODOs:    │                          │      □ Cursors                       │
│      • Connect user auth     │                          │      □ Notifications                 │
│      • Connect document ID   │                          │      □ CRDT (editor?)                │
│      • Add VeltProvider      │                          │                                      │
│                              │                          │  B4. Ask: VeltProvider Location      │
│  ████████████████████████    │                          │      "Where to install?"             │
│  █        STOP          █    │                          │      • app/layout.tsx (recommended)  │
│  █   No further edits   █    │                          │      • Custom path                   │
│  ████████████████████████    │                          │      • Auto-detect                   │
│                              │                          │                                      │
└──────────────────────────────┘                          │  B5. Run Velt CLI                    │
                                                          │      └─ Creates 3 files              │
                                                          │                                      │
                                                          │  B6. Generate Implementation PLAN    │
                                                          │      • Files to modify (explicit)    │
                                                          │      • Code snippets with TODOs      │
                                                          │      • Doc links                     │
                                                          │                                      │
                                                          │  B7. Present Plan to User            │
                                                          │      "Here's the plan. Execute?"     │
                                                          │                                      │
                                                          │  ████████████████████████████████    │
                                                          │  █    STOP - AWAIT APPROVAL     █    │
                                                          │  █  No edits without explicit   █    │
                                                          │  █  "yes, implement this"       █    │
                                                          │  ████████████████████████████████    │
                                                          │                                      │
                                                          │           │                          │
                                                          │           ▼                          │
                                                          │  ┌────────────────────────────┐      │
                                                          │  │  User says "implement it"  │      │
                                                          │  └────────────┬───────────────┘      │
                                                          │               │                      │
                                                          │               ▼                      │
                                                          │  B8. Execute Plan Step-by-Step       │
                                                          │      • ONLY files listed in plan     │
                                                          │      • ONLY features requested       │
                                                          │      • Add explicit TODOs            │
                                                          │                                      │
                                                          │  B9. Verify & Output Checklist       │
                                                          │                                      │
                                                          │  ████████████████████████████████    │
                                                          │  █           STOP              █     │
                                                          │  ████████████████████████████████    │
                                                          │                                      │
                                                          └──────────────────────────────────────┘
```

---

## Integration with Existing MCP Tools

### Current MCP Tools (from `src/index.js`)

| Tool | Current Behavior | New Behavior |
|------|------------------|--------------|
| `install_velt_interactive` | Single path with many prompts | **Entry point for BOTH paths** |
| `install_velt_freestyle` | Legacy, basic install | Deprecated, redirect to interactive |
| `take_project_screenshot` | Screenshots for placement | Unchanged (optional in guided path) |
| `detect_comment_placement` | Scans codebase | **Only used if user requests in guided path** |

### New Tool Signature

```javascript
// install_velt_interactive - Updated schema
{
  name: 'install_velt_interactive',
  inputSchema: {
    properties: {
      projectPath: { type: 'string', description: 'Path to Next.js project' },

      // NEW: Installation mode selector
      installMode: {
        type: 'string',
        enum: ['quick', 'guided'],
        description: 'Quick = just files + TODO. Guided = full prompts + plan.'
      },

      // Only required for GUIDED mode:
      apiKey: { type: 'string' },
      authToken: { type: 'string' },
      commentType: { type: 'string' },
      features: { type: 'array' },
      veltProviderLocation: { type: 'string' },
      headerPosition: { type: 'string' },
      crdtEditorType: { type: 'string' },
    },
    required: ['projectPath', 'installMode']
  }
}
```

---

## Path A: Quick Setup (Deterministic)

### When to Use
- User says "just add the files"
- User says "I'll wire it myself"
- User wants minimal intervention
- User is experienced with Velt

### Workflow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PATH A: QUICK SETUP                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP A1: Confirm Directory                                                  │
│  ─────────────────────────                                                   │
│  Prompt: "I'll install Velt components in: [path]. Is this correct?"         │
│  Validate: package.json exists with "next" dependency                        │
│                                                                              │
│  STEP A2: Run Velt CLI                                                       │
│  ────────────────────                                                        │
│  Command: node /path/to/add-velt-next-js/bin/velt.js add                     │
│  Creates:                                                                    │
│    ✓ components/velt/VeltInitializeUser.tsx                                  │
│    ✓ components/velt/VeltInitializeDocument.tsx                              │
│    ✓ components/velt/VeltCollaboration.tsx                                   │
│                                                                              │
│  STEP A3: Verify & Output                                                    │
│  ───────────────────────                                                     │
│  Check all 3 files exist, then output TODO checklist                         │
│                                                                              │
│  ███████████████████████████████████████████████████████████████████████████ │
│  █                              STOP                                       █ │
│  █  - DO NOT scan codebase                                                 █ │
│  █  - DO NOT modify any existing files                                     █ │
│  █  - DO NOT ask about features, auth, etc.                                █ │
│  ███████████████████████████████████████████████████████████████████████████ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Output: Quick Setup TODO Checklist

```markdown
## ✅ Velt Components Installed (Quick Setup)

Created in `components/velt/`:
```
components/velt/
├── VeltInitializeUser.tsx      # TODO: Connect your auth
├── VeltInitializeDocument.tsx  # TODO: Connect your document ID
└── VeltCollaboration.tsx       # Wrapper with init timeout guard
```

---

## 📋 You Need To Do

### 1. Install the Velt package
```bash
npm install @veltdev/react
# or: pnpm add @veltdev/react
```

### 2. Add VeltProvider to your app
```tsx
// In your layout.tsx or root component:
import { VeltProvider } from '@veltdev/react';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltCollaboration />
  {children}
</VeltProvider>
```

### 3. Connect your user authentication
Edit `components/velt/VeltInitializeUser.tsx`:
```tsx
// TODO: Replace with your own user context
// Example: const { user } = useSession(); // Next-Auth
// Example: const { user } = useUser();    // Clerk
const currentUser = { id: 'user-id', name: 'Name', email: 'email@example.com' };
```

### 4. Connect your document ID
Edit `components/velt/VeltInitializeDocument.tsx`:
```tsx
// TODO: Replace with your own document ID source
// Example: const documentId = useParams().id;
// Example: const documentId = router.query.docId;
const documentId = 'your-document-id';
```

### 5. (Optional) Create JWT token route
```
app/api/velt/token/route.ts
```
See: https://docs.velt.dev/security/jwt-tokens

---

## 🔗 Documentation
- Quick Start: https://docs.velt.dev/get-started/quickstart
- Authentication: https://docs.velt.dev/get-started/quickstart#step-5-authenticate-users
- Document Setup: https://docs.velt.dev/get-started/quickstart#step-6-initialize-document

---

**Need more help?** Run `@velt-installer install` again and choose "Guided Setup".
```

---

## Path B: Guided Setup (Non-Deterministic)

### When to Use
- User says "install Velt" (default)
- User says "help me integrate"
- User needs guidance on auth/routing
- User is new to Velt

### Workflow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PATH B: GUIDED SETUP                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP B1: Confirm Directory                                                  │
│  ─────────────────────────                                                   │
│  Prompt: "I'll install Velt in: [path]. Is this correct?"                    │
│  Validate: package.json exists with "next" dependency                        │
│                                                                              │
│  STEP B2: Get API Key (REQUIRED)                                             │
│  ───────────────────────────────                                             │
│  Prompt: "Please provide your Velt API Key"                                  │
│  Link: https://console.velt.dev                                              │
│  Validation: Must not be empty                                               │
│                                                                              │
│  STEP B3: Get Auth Token (REQUIRED)                                          │
│  ─────────────────────────────────                                           │
│  Prompt: "Please provide your Velt Auth Token"                               │
│  Link: https://console.velt.dev                                              │
│  Validation: Must not be empty                                               │
│                                                                              │
│  STEP B4: Select Features                                                    │
│  ───────────────────────                                                     │
│  Prompt: "What features do you want?"                                        │
│  Options (multi-select):                                                     │
│    □ Comments (→ ask type: freestyle/popover/page/text/inline/tiptap/etc)    │
│    □ Presence (live user avatars)                                            │
│    □ Cursors (real-time cursor tracking)                                     │
│    □ Notifications                                                           │
│    □ Recorder                                                                │
│    □ CRDT (→ ask editor: tiptap/codemirror/blocknote)                        │
│                                                                              │
│  STEP B5: VeltProvider Location                                              │
│  ─────────────────────────────                                               │
│  Prompt: "Where should VeltProvider be installed?"                           │
│  Options:                                                                    │
│    ○ app/layout.tsx (Recommended)                                            │
│    ○ Custom path: ___                                                        │
│    ○ Auto-detect                                                             │
│                                                                              │
│  STEP B6: Run Velt CLI                                                       │
│  ────────────────────                                                        │
│  Command: node /path/to/add-velt-next-js/bin/velt.js add                     │
│  Creates 3 component files (same as Path A)                                  │
│                                                                              │
│  STEP B7: Generate Implementation Plan                                       │
│  ─────────────────────────────────────                                       │
│  Plan includes:                                                              │
│    • Exact files to modify (with paths)                                      │
│    • Code snippets with TODO placeholders                                    │
│    • Feature-specific implementation from docs.velt.dev/*.md                 │
│    • Environment variables to set                                            │
│                                                                              │
│  STEP B8: Present Plan & Await Approval                                      │
│  ──────────────────────────────────────                                      │
│  Output: Full plan in markdown                                               │
│  Prompt: "Here's the implementation plan. Would you like me to execute it?"  │
│                                                                              │
│  ███████████████████████████████████████████████████████████████████████████ │
│  █                         STOP & WAIT                                     █ │
│  █  - DO NOT auto-execute                                                  █ │
│  █  - WAIT for explicit "yes" / "implement" / "proceed"                    █ │
│  ███████████████████████████████████████████████████████████████████████████ │
│                                                                              │
│  IF user approves:                                                           │
│  ─────────────────                                                           │
│                                                                              │
│  STEP B9: Execute Plan                                                       │
│  ────────────────────                                                        │
│  • ONLY modify files listed in plan                                          │
│  • ONLY implement features user selected                                     │
│  • Add explicit TODO comments for user customization                         │
│  • Replace API key placeholders                                              │
│                                                                              │
│  STEP B10: Verification                                                      │
│  ─────────────────────                                                       │
│  • Check Velt init timeout (<10s)                                            │
│  • Verify imports resolve                                                    │
│  • Output final checklist                                                    │
│                                                                              │
│  ███████████████████████████████████████████████████████████████████████████ │
│  █                              STOP                                       █ │
│  ███████████████████████████████████████████████████████████████████████████ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Prompt Scripts (Guided Path)

**Prompt B1: Directory Confirmation**
```
I'll install Velt in this directory:
📁 /Users/you/project

Is this correct? (yes/no)
```

**Prompt B2: API Key**
```
Please provide your Velt API Key.

Get it from: https://console.velt.dev → Your Project → API Keys

Your API Key: ___
```

**Prompt B3: Auth Token**
```
Please provide your Velt Auth Token.

Get it from: https://console.velt.dev → Your Project → Auth Token

Your Auth Token: ___
```

**Prompt B4: Features**
```
What Velt features do you want to install?

📝 Comments
   └─ Type: ○ Freestyle  ○ Popover  ○ Page  ○ Text  ○ Inline
           ○ Tiptap     ○ Lexical  ○ Slate

👥 Presence (live user avatars)
🖱️ Cursors (real-time cursor tracking)
🔔 Notifications
🎥 Recorder
📄 CRDT (collaborative editing)
   └─ Editor: ○ Tiptap  ○ CodeMirror  ○ BlockNote

Select all that apply: ___
```

**Prompt B5: VeltProvider Location**
```
Where should VeltProvider be installed?

○ app/layout.tsx (Recommended - wraps entire app)
○ Custom path: ___
○ Auto-detect (I'll analyze your project structure)

Your choice: ___
```

**Prompt B8: Plan Approval**
```
Here's the implementation plan:

[PLAN DISPLAYED]

Would you like me to execute this plan? (yes/no)
```

---

## Side-by-Side Comparison

| Aspect | Path A: Quick | Path B: Guided |
|--------|---------------|----------------|
| **Prompts** | 1 (directory) | 5-7 (full config) |
| **CLI Run** | ✅ Yes | ✅ Yes |
| **Files Created** | 3 components | 3 components |
| **User Auth Wiring** | ❌ TODO for user | ✅ In plan (with TODO) |
| **Document ID Wiring** | ❌ TODO for user | ✅ In plan (with TODO) |
| **VeltProvider Setup** | ❌ TODO for user | ✅ In plan |
| **Feature Selection** | ❌ None | ✅ User chooses |
| **Codebase Scanning** | ❌ Never | ⚠️ Only if auto-detect |
| **File Modifications** | ❌ None | ✅ Only plan-listed files |
| **Stop Condition** | After CLI + checklist | After plan (await approval) |
| **Total Time** | ~5 seconds | ~2-3 minutes |

---

## Implementation Notes

### Changes to Existing Files

| File | Change |
|------|--------|
| `src/index.js` | Add `installMode` parameter to `install_velt_interactive` |
| `src/tools/plan-based-installer.js` | Add quick path that skips prompts |
| `src/utils/cli.js` | No changes (CLI already works) |
| `src/utils/plan-formatter.js` | Add `createQuickSetupChecklist()` function |

### Decision Gate Detection

The MCP should detect the path based on user language:

```javascript
// Heuristics for path selection
const QUICK_TRIGGERS = [
  'just add files',
  'just the components',
  'I\'ll wire it',
  'quick setup',
  'minimal',
  'basic install'
];

const GUIDED_TRIGGERS = [
  'install velt',        // Default
  'help me',
  'set it up',
  'configure',
  'full setup',
  'guided'
];
```

### Hard Constraints (Both Paths)

**MUST:**
- ✅ CLI creates exactly 3 files
- ✅ Quick path stops after CLI + checklist
- ✅ Guided path stops after plan (await approval)
- ✅ All user-editable code has `// TODO:` comments

**MUST NOT:**
- ❌ Quick path: No codebase scanning, no file modifications
- ❌ Guided path: No auto-execution without approval
- ❌ Either path: No features user didn't request
- ❌ Either path: No "cleanup" or "improvements" beyond scope

---

## Verification Checklist (Both Paths)

| Check | Quick | Guided | How |
|-------|-------|--------|-----|
| CLI files exist | ✅ | ✅ | `fs.existsSync()` on 3 files |
| package.json has next | ✅ | ✅ | Parse dependencies |
| CLI exit code 0 | ✅ | ✅ | Check process result |
| TODO comments present | ✅ | ✅ | Grep for `// TODO:` |
| Velt init <10s | N/A | ✅ | Runtime check (existing guard) |
| Plan file list matches edits | N/A | ✅ | Compare plan vs actual |

---

## Error Handling

**Invalid Directory:**
```
❌ This doesn't appear to be a Next.js project.

Checked: /path/to/dir
Issue: No "next" in package.json dependencies

Please provide a path to a valid Next.js App Router project.
```

**CLI Failure:**
```
❌ Velt CLI failed (exit code: 1)

This might happen if:
- Directory permissions issue
- npm/pnpm not available
- Network error during package install

Try running manually:
  cd /your/project
  npx @veltdev/cli add
```

**Missing API Key (Guided Only):**
```
❌ API Key is required for guided setup.

Get your API key from: https://console.velt.dev

Or use Quick Setup if you want to add the key later.
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP INSTALLATION FLOW                        │
│                                                                 │
│   User: "@velt-installer install"                               │
│                     │                                           │
│                     ▼                                           │
│   ┌─────────────────────────────────────┐                       │
│   │    "How would you like to install?" │                       │
│   │                                     │                       │
│   │    A) Quick Setup (just files)     │                       │
│   │    B) Guided Setup (full config)   │                       │
│   └─────────────────┬───────────────────┘                       │
│                     │                                           │
│         ┌───────────┴───────────┐                               │
│         │                       │                               │
│         ▼                       ▼                               │
│   ┌───────────┐          ┌─────────────┐                        │
│   │  PATH A   │          │   PATH B    │                        │
│   │  3 files  │          │  Prompts    │                        │
│   │  + TODO   │          │  + Plan     │                        │
│   │  = STOP   │          │  + Approve  │                        │
│   └───────────┘          │  + Execute  │                        │
│                          │  = STOP     │                        │
│                          └─────────────┘                        │
│                                                                 │
│   Key Principle: PLAN ONLY by default, EXECUTE on request       │
└─────────────────────────────────────────────────────────────────┘
```

---

**End of Specification**
