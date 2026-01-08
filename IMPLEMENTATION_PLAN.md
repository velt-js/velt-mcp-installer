# Implementation Plan: Unified Installer with SKIP Option

## Overview

Refactor the Velt MCP installer to have ONE primary installer flow with two paths:
1. **Guided install** (default): Generate plan → Await approval → Apply edits → Full QA
2. **CLI-only SKIP path**: Run Velt CLI scaffolding only → Basic QA

The SKIP option appears at the feature selection step.

---

## Control Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       UNIFIED INSTALLER ENTRY POINT                          │
│                        install_velt_interactive                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: VALIDATE PROJECT                                                    │
│  ─────────────────────────                                                   │
│  • Confirm directory is a Next.js project                                    │
│  • Validate package.json exists + has "next" dependency                      │
│  • Return error if not valid Next.js project                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: COLLECT CREDENTIALS                                                 │
│  ───────────────────────────                                                 │
│  • Ask for API Key (REQUIRED)                                                │
│  • Ask for Auth Token (REQUIRED)                                             │
│  • These are needed for BOTH paths (CLI requires them)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: FEATURE SELECTION WITH SKIP OPTION                                  │
│  ──────────────────────────────────────────                                  │
│                                                                              │
│  "Select features to install OR type SKIP to only run the Velt CLI           │
│   and set up features yourself later."                                        │
│                                                                              │
│  Options:                                                                    │
│    📝 Comments (type: freestyle/popover/page/text/inline/tiptap/etc)         │
│    👥 Presence                                                               │
│    🖱️ Cursors                                                                │
│    🔔 Notifications                                                          │
│    🎥 Recorder                                                               │
│    📄 CRDT (editor type: tiptap/codemirror/blocknote)                        │
│    ─────────────────────────────────────────────                             │
│    ⏭️  SKIP - Only run Velt CLI, no feature integration                      │
│                                                                              │
│  User input: features[] OR "SKIP" (case-insensitive)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
         User typed SKIP              User selected features
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────┐   ┌──────────────────────────────────────────┐
│    PATH A: CLI-ONLY (SKIP)    │   │         PATH B: GUIDED INSTALL           │
│        (Deterministic)        │   │          (Non-Deterministic)             │
└───────────────────────────────┘   └──────────────────────────────────────────┘
           │                                          │
           ▼                                          ▼
┌───────────────────────────────┐   ┌──────────────────────────────────────────┐
│  A1: Run Velt CLI             │   │  B1: Collect additional info             │
│  ─────────────────────────    │   │  ──────────────────────────              │
│  • npx @veltdev/add-velt add  │   │  • VeltProvider location                 │
│  • Creates scaffold files:    │   │  • Header/sidebar position               │
│    - VeltInitializeUser.tsx   │   │  • (Optional) screenshot if dev server   │
│    - VeltInitializeDoc.tsx    │   │  • Comment type (if comments selected)   │
│    - VeltCollaboration.tsx    │   │  • CRDT editor type (if CRDT selected)   │
│    - Token API route          │   │                                          │
│    - User auth hooks          │   └──────────────────────────────────────────┘
└───────────────────────────────┘                     │
           │                                          ▼
           ▼                        ┌──────────────────────────────────────────┐
┌───────────────────────────────┐   │  B2: Run Velt CLI                        │
│  A2: Run Basic CLI QA         │   │  ──────────────────                      │
│  ─────────────────────        │   │  • Same CLI execution as Path A          │
│  • Verify CLI files created   │   │  • Creates scaffold files                │
│  • Check @veltdev/react pkg   │   └──────────────────────────────────────────┘
│  • Verify .env.local exists   │                     │
│  • Project still builds       │                     ▼
│  • NO integration checks      │   ┌──────────────────────────────────────────┐
└───────────────────────────────┘   │  B3: Scan codebase & fetch docs          │
           │                        │  ────────────────────────────            │
           ▼                        │  • Detect libraries (Tiptap, etc.)       │
┌───────────────────────────────┐   │  • Fetch feature docs from .md URLs      │
│  A3: Output CLI-Only Report   │   │  • Parallel fetch for performance        │
│  ─────────────────────────    │   └──────────────────────────────────────────┘
│  • List created files         │                     │
│  • TODO checklist for user    │                     ▼
│  • Doc links                  │   ┌──────────────────────────────────────────┐
│  • "Re-run without SKIP for   │   │  B4: GENERATE PLAN (stage: "plan")       │
│    guided setup" message      │   │  ──────────────────────────────          │
│                               │   │  • Explicit files to modify              │
│  ████████████████████████████ │   │  • Code snippets with // [Velt] markers  │
│  █          STOP           █  │   │  • Doc links for each feature            │
│  ████████████████████████████ │   │  • TODO checklist                        │
└───────────────────────────────┘   │                                          │
                                    │  Return plan to AI, AI presents to user  │
                                    │                                          │
                                    │  ████████████████████████████████████████ │
                                    │  █    STOP - AWAIT USER APPROVAL      █  │
                                    │  █  "Would you like me to implement?" █  │
                                    │  ████████████████████████████████████████ │
                                    └──────────────────────────────────────────┘
                                                      │
                                         User says "implement it"
                                                      │
                                                      ▼
                                    ┌──────────────────────────────────────────┐
                                    │  B5: APPLY EDITS (stage: "apply")        │
                                    │  ─────────────────────────────           │
                                    │  • ONLY files listed in plan             │
                                    │  • ONLY features user requested          │
                                    │  • Add TODOs for uncertain parts         │
                                    │  • Replace API key placeholders          │
                                    └──────────────────────────────────────────┘
                                                      │
                                                      ▼
                                    ┌──────────────────────────────────────────┐
                                    │  B6: Run Full Integration QA             │
                                    │  ────────────────────────────            │
                                    │  • All basic CLI QA checks               │
                                    │  • VeltProvider in layout                │
                                    │  • VeltComments in page (if applicable)  │
                                    │  • VeltCommentsSidebar (if applicable)   │
                                    │  • DevTools console check guidance       │
                                    │                                          │
                                    │  ████████████████████████████████████████ │
                                    │  █               STOP                 █  │
                                    │  ████████████████████████████████████████ │
                                    └──────────────────────────────────────────┘
```

---

## Files to Modify/Create

### 1. `src/tools/unified-installer.js` (NEW - Main Entry Point)

**Purpose:** Single orchestration module that handles both paths

**Exports:**
```javascript
/**
 * Unified Velt Installer
 *
 * @param {Object} params
 * @param {string} params.projectPath - Path to Next.js project
 * @param {string} params.apiKey - Velt API key (REQUIRED)
 * @param {string} params.authToken - Velt Auth Token (REQUIRED)
 * @param {string} params.mode - "guided" | "cli-only" (detected from SKIP)
 * @param {string} params.stage - "plan" | "apply" (for guided mode)
 * @param {boolean} params.approved - Whether user approved the plan (for apply stage)
 * @param {string[]} [params.features] - Features to install (guided mode only)
 * @param {string} [params.commentType] - Comment type (guided mode only)
 * @param {string} [params.crdtEditorType] - CRDT editor type (guided mode only)
 * @param {string} [params.headerPosition] - Sidebar header position
 * @param {string} [params.veltProviderLocation] - Where to install VeltProvider
 * @returns {Promise<Object>} Installation result
 */
export async function installVeltUnified(params) { ... }

/**
 * Validates that the project is a valid Next.js project
 */
export function validateNextJsProject(projectPath) { ... }

/**
 * CLI-only installation (SKIP path)
 */
export async function runCliOnlyInstall(params) { ... }

/**
 * Guided installation - plan stage
 */
export async function runGuidedPlanStage(params) { ... }

/**
 * Guided installation - apply stage
 */
export async function runGuidedApplyStage(params) { ... }
```

### 2. `src/utils/validation.js` (MODIFY)

**Changes:**
- Add `validateBasicCliInstall()` function for CLI-only QA
- Keep existing `validateInstallation()` for full integration QA
- Add `validateProjectStructure()` for Next.js validation

**New exports:**
```javascript
/**
 * Basic CLI installation validation (for SKIP path)
 * Checks: CLI files exist, @veltdev/react in package.json, .env.local
 * Does NOT check: VeltProvider placement, VeltComments integration
 */
export async function validateBasicCliInstall({ projectPath }) { ... }

/**
 * Full integration validation (for guided path after apply)
 * Checks everything in basic + VeltProvider, VeltComments, etc.
 */
export async function validateInstallation({ projectPath }) { ... } // existing

/**
 * Validates project is a valid Next.js project
 */
export function validateNextJsProject(projectPath) { ... }
```

### 3. `src/utils/plan-formatter.js` (MODIFY)

**Changes:**
- Add `createCliOnlyReport()` function for SKIP path output
- Keep existing plan functions

**New export:**
```javascript
/**
 * Creates the CLI-only installation report with TODO checklist
 *
 * @param {Object} options
 * @param {string[]} options.createdFiles - Files created by CLI
 * @param {Object} options.validation - Basic validation results
 * @param {string} options.apiKey - API key (masked)
 * @returns {string} Markdown report
 */
export function createCliOnlyReport(options) { ... }
```

### 4. `src/index.js` (MODIFY)

**Changes:**
- Update `install_velt_interactive` tool schema to include:
  - `mode`: "guided" | "cli-only" (optional, detected from user input)
  - `stage`: "plan" | "apply" (for guided mode)
  - `approved`: boolean (for apply stage)
- Update tool description to explain SKIP option
- Route to unified installer

**Updated schema:**
```javascript
{
  name: 'install_velt_interactive',
  inputSchema: {
    properties: {
      projectPath: { type: 'string', required: true },
      apiKey: { type: 'string', required: true },
      authToken: { type: 'string', required: true },

      // Mode detection (from SKIP or feature selection)
      mode: {
        type: 'string',
        enum: ['guided', 'cli-only'],
        description: 'Installation mode. "cli-only" if user typed SKIP at feature selection.'
      },

      // For guided mode
      stage: {
        type: 'string',
        enum: ['plan', 'apply'],
        description: 'Guided mode stage. First call returns plan, second call (with approved=true) applies.'
      },
      approved: {
        type: 'boolean',
        description: 'Set to true when user approves the plan for apply stage.'
      },

      // Feature configuration (guided mode only)
      features: { type: 'array', items: { type: 'string' } },
      commentType: { type: 'string' },
      crdtEditorType: { type: 'string' },
      headerPosition: { type: 'string' },
      veltProviderLocation: { type: 'string' },
    },
    required: ['projectPath', 'apiKey', 'authToken']
  }
}
```

### 5. `src/tools/orchestrator.js` (KEEP - Backward Compatibility)

**Changes:**
- Add deprecation notice
- Delegate to unified installer internally

### 6. `src/tools/plan-based-installer.js` (KEEP - Backward Compatibility)

**Changes:**
- Add deprecation notice
- Delegate to unified installer internally

---

## Function Signatures

### `src/tools/unified-installer.js`

```javascript
/**
 * Main entry point for unified installation
 */
export async function installVeltUnified({
  projectPath,
  apiKey,
  authToken,
  mode = 'guided',      // 'guided' | 'cli-only'
  stage = 'plan',       // 'plan' | 'apply' (guided mode only)
  approved = false,     // true when user approved plan (apply stage)
  features = [],        // ['comments', 'presence', 'cursors', ...]
  commentType = 'freestyle',
  crdtEditorType = null,
  headerPosition = 'top-right',
  veltProviderLocation = 'app/layout.tsx',
  server = null,
}) {
  // 1. Validate Next.js project
  const projectValidation = validateNextJsProject(projectPath);
  if (!projectValidation.valid) {
    return { status: 'error', error: projectValidation.error };
  }

  // 2. Route based on mode
  if (mode === 'cli-only') {
    return runCliOnlyInstall({ projectPath, apiKey, authToken });
  }

  // 3. Guided mode - route based on stage
  if (stage === 'plan') {
    return runGuidedPlanStage({
      projectPath, apiKey, authToken,
      features, commentType, crdtEditorType,
      headerPosition, veltProviderLocation,
    });
  }

  if (stage === 'apply' && approved) {
    return runGuidedApplyStage({
      projectPath, apiKey, authToken,
      features, commentType, crdtEditorType,
      headerPosition, veltProviderLocation,
    });
  }

  return { status: 'error', error: 'Invalid stage or approval state' };
}

/**
 * CLI-only installation (SKIP path)
 */
async function runCliOnlyInstall({ projectPath, apiKey, authToken }) {
  // 1. Run Velt CLI
  const cliResult = await runVeltCli({ installDir: projectPath, apiKey, authToken });

  // 2. Run basic QA (no integration checks)
  const qaResult = await validateBasicCliInstall({ projectPath });

  // 3. Generate CLI-only report
  const report = createCliOnlyReport({
    cliResult,
    qaResult,
    apiKey: maskApiKey(apiKey),
  });

  return {
    status: 'cli_only_complete',
    mode: 'cli-only',
    report,
    validation: qaResult,
    nextSteps: 'Re-run installer without SKIP to generate a plan + implement features',
  };
}

/**
 * Guided plan stage - generates plan without applying
 */
async function runGuidedPlanStage({
  projectPath, apiKey, authToken,
  features, commentType, crdtEditorType,
  headerPosition, veltProviderLocation,
}) {
  // 1. Run Velt CLI (creates scaffold files)
  const cliResult = await runVeltCli({ installDir: projectPath, apiKey, authToken });

  // 2. Scan codebase (detect libraries)
  const libraryDetection = detectLibraries(projectPath);

  // 3. Fetch implementation docs (parallel)
  const implementations = await fetchAllImplementations({
    features, commentType, crdtEditorType,
  });

  // 4. Generate plan (do NOT apply)
  const plan = createMultiFeaturePlan({
    features, commentType, crdtEditorType,
    implementation: implementations.comments,
    crdtImplementation: implementations.crdt,
    featureImplementations: implementations.others,
    apiKey: maskApiKey(apiKey),
    headerPosition, veltProviderLocation,
  });

  return {
    status: 'plan_generated',
    mode: 'guided',
    stage: 'plan',
    plan,
    cliResult,
    message: 'Plan generated. Present to user and await approval before applying.',
  };
}

/**
 * Guided apply stage - applies the plan (only after approval)
 */
async function runGuidedApplyStage({
  projectPath, apiKey, authToken,
  features, commentType, crdtEditorType,
  headerPosition, veltProviderLocation,
}) {
  // Note: At this point, CLI has already run in plan stage
  // The AI is expected to apply the plan by making file edits

  // Run full integration QA
  const qaResult = await validateInstallation({ projectPath });

  return {
    status: 'apply_complete',
    mode: 'guided',
    stage: 'apply',
    validation: qaResult,
    message: 'Installation complete. Check browser DevTools for Velt errors.',
  };
}
```

### `src/utils/validation.js` - New Functions

```javascript
/**
 * Validates that directory is a valid Next.js project
 */
export function validateNextJsProject(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      error: `No package.json found at ${projectPath}. Is this a Node.js project?`,
    };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasNext = !!(
    packageJson.dependencies?.next ||
    packageJson.devDependencies?.next
  );

  if (!hasNext) {
    return {
      valid: false,
      error: `"next" not found in package.json dependencies. This tool requires a Next.js project.`,
    };
  }

  return { valid: true };
}

/**
 * Basic CLI installation validation (SKIP path)
 * Only checks CLI scaffolding, NOT integration
 */
export async function validateBasicCliInstall({ projectPath }) {
  const checks = [];
  let passed = 0;

  // Check 1: @veltdev/react in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasVeltPkg = !!(
    packageJson.dependencies?.['@veltdev/react'] ||
    packageJson.devDependencies?.['@veltdev/react']
  );
  checks.push({
    name: '@veltdev/react package',
    status: hasVeltPkg ? 'pass' : 'fail',
    message: hasVeltPkg ? 'Package found' : 'Package not found - run npm install',
  });
  if (hasVeltPkg) passed++;

  // Check 2: CLI scaffold files exist
  const scaffoldFiles = [
    'components/velt/VeltInitializeUser.tsx',
    'components/velt/VeltInitializeDocument.tsx',
    'components/velt/VeltCollaboration.tsx',
  ];

  for (const file of scaffoldFiles) {
    const filePath = path.join(projectPath, file);
    const srcPath = path.join(projectPath, 'src', file);
    const exists = fs.existsSync(filePath) || fs.existsSync(srcPath);

    checks.push({
      name: `CLI file: ${file}`,
      status: exists ? 'pass' : 'fail',
      message: exists ? 'File created' : 'File not found',
    });
    if (exists) passed++;
  }

  // Check 3: .env.local exists (may need API key)
  const envPath = path.join(projectPath, '.env.local');
  const envExists = fs.existsSync(envPath);
  checks.push({
    name: '.env.local file',
    status: envExists ? 'pass' : 'warning',
    message: envExists ? 'File exists' : 'File not found - may need to create',
  });
  if (envExists) passed++;

  return {
    checks,
    passed,
    total: checks.length,
    score: `${passed}/${checks.length}`,
    status: passed === checks.length ? 'excellent' : passed >= checks.length * 0.5 ? 'good' : 'needs_attention',
  };
}
```

### `src/utils/plan-formatter.js` - New Function

```javascript
/**
 * Creates CLI-only installation report with TODO checklist
 */
export function createCliOnlyReport({ cliResult, qaResult, apiKey }) {
  return `# ✅ Velt CLI Installation Complete (CLI-Only Mode)

## Files Created

The Velt CLI has created the following scaffold files:

\`\`\`
components/velt/
├── VeltInitializeUser.tsx      # User authentication setup
├── VeltInitializeDocument.tsx  # Document context setup
└── VeltCollaboration.tsx       # Collaboration components wrapper

app/
├── userAuth/
│   ├── AppUserContext.tsx      # User context provider
│   └── useAppUser.tsx          # User data hook (TODO: connect your auth)
└── api/velt/token/
    └── route.ts                # JWT token generation API
\`\`\`

## Validation Results

${qaResult.checks.map(c => `- ${c.status === 'pass' ? '✅' : c.status === 'warning' ? '⚠️' : '❌'} ${c.name}: ${c.message}`).join('\n')}

**Score:** ${qaResult.score}

---

## 📋 TODO Checklist (You Need To Complete)

### 1. Install the Velt package
\`\`\`bash
npm install @veltdev/react
# or: pnpm add @veltdev/react
\`\`\`

### 2. Add VeltProvider to your layout
\`\`\`tsx
// In app/layout.tsx:
import { AppUserProvider } from './userAuth/AppUserContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppUserProvider>
          {children}
        </AppUserProvider>
      </body>
    </html>
  )
}
\`\`\`

### 3. Connect your authentication
Edit \`app/userAuth/useAppUser.tsx\`:
\`\`\`tsx
// TODO: Replace mock user with your actual auth provider
// Example: const { user } = useSession(); // Next-Auth
// Example: const { user } = useUser();    // Clerk
\`\`\`

### 4. Set up document identification
Edit \`components/velt/VeltInitializeDocument.tsx\`:
\`\`\`tsx
// TODO: Replace with your document ID logic
// Example: const documentId = router.query.id;
\`\`\`

### 5. Configure environment variables
Add to \`.env.local\`:
\`\`\`
NEXT_PUBLIC_VELT_API_KEY=${apiKey}
VELT_AUTH_TOKEN=your_auth_token_here
\`\`\`

---

## 🔗 Documentation

- Quick Start: https://docs.velt.dev/get-started/quickstart
- Authentication: https://docs.velt.dev/get-started/quickstart#step-5-authenticate-users
- Document Setup: https://docs.velt.dev/get-started/quickstart#step-6-initialize-document

---

## 🚀 Next Steps

**Re-run the installer without SKIP** to get a guided implementation plan:
- The guided mode will generate a detailed plan for your specific features
- It will detect your project structure and recommend file placements
- You'll get feature-specific code examples from Velt docs

\`\`\`
@velt-installer install
# Then select specific features instead of SKIP
\`\`\`
`;
}
```

---

## Tool Description Update (`src/index.js`)

Updated description for `install_velt_interactive`:

```javascript
{
  name: 'install_velt_interactive',
  description:
    '🌟 Unified Velt installation with guided or CLI-only mode. ' +
    '\n\nWORKFLOW: ' +
    '\n\nSTEP 1 - CONFIRM DIRECTORY:' +
    '  Ask: "Is this the correct Next.js project directory: [path]?" ' +
    '\n\nSTEP 2 - GET CREDENTIALS:' +
    '  Ask: "Please provide your Velt API Key (from https://console.velt.dev)" ' +
    '  Ask: "Please provide your Velt Auth Token" ' +
    '\n\nSTEP 3 - FEATURE SELECTION (with SKIP option):' +
    '  Ask: "Select features to install OR type SKIP to only run the Velt CLI and set up features yourself later." ' +
    '  Show options: ' +
    '    📝 Comments (type: freestyle/popover/page/text/inline/tiptap/lexical/slate) ' +
    '    👥 Presence ' +
    '    🖱️ Cursors ' +
    '    🔔 Notifications ' +
    '    🎥 Recorder ' +
    '    📄 CRDT (editor: tiptap/codemirror/blocknote) ' +
    '    ⏭️  SKIP - CLI scaffolding only ' +
    '\n\nIF USER TYPES SKIP:' +
    '  • Call tool with mode="cli-only" ' +
    '  • Tool runs CLI, validates, returns TODO checklist ' +
    '  • NO plan generation, NO file modifications beyond CLI ' +
    '  • Done. ' +
    '\n\nIF USER SELECTS FEATURES:' +
    '  • Call tool with mode="guided", stage="plan" ' +
    '  • Tool runs CLI + generates implementation PLAN ' +
    '  • PRESENT plan to user, ask: "Would you like me to implement this?" ' +
    '  • IF user approves: Call tool again with stage="apply", approved=true ' +
    '  • Execute plan step-by-step ' +
    '  • Run full QA validation ' +
    '\n\nIMPORTANT:' +
    '  • SKIP is case-insensitive ' +
    '  • Guided mode requires TWO tool calls (plan, then apply) ' +
    '  • NEVER apply without user approval ',
}
```

---

## README Update

Add new section to README.md:

```markdown
## 🚀 Installation Modes

### Guided Mode (Default)
Full interactive installation with plan generation and user approval:

1. Confirm project directory
2. Provide API key and auth token
3. Select features (comments, presence, cursors, etc.)
4. Review generated implementation plan
5. Approve to apply changes
6. Full QA validation

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

### How SKIP Works

At the feature selection prompt:
```
Select features to install OR type SKIP to only run the Velt CLI
and set up features yourself later.

📝 Comments
👥 Presence
🖱️ Cursors
🔔 Notifications
🎥 Recorder
📄 CRDT
─────────────────
⏭️  Type "SKIP" for CLI-only installation
```

If you type `SKIP` (case-insensitive):
- ✅ Runs Velt CLI scaffolding
- ✅ Validates CLI files created
- ✅ Returns TODO checklist
- ❌ Does NOT generate implementation plan
- ❌ Does NOT modify project files (beyond CLI)
- ❌ Does NOT integrate features

### Plan/Apply Workflow (Guided Mode)

```
┌─────────────────┐
│  Select Features │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate PLAN  │  ← Tool returns plan, AI presents to user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Approval  │  ← "Would you like me to implement this?"
└────────┬────────┘
         │
    (user says yes)
         │
         ▼
┌─────────────────┐
│   Apply PLAN    │  ← Tool called again with approved=true
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Full QA       │
└─────────────────┘
```
```

---

## Migration Strategy

1. **Create `unified-installer.js`** with new logic
2. **Update `index.js`** to route to unified installer
3. **Update `validation.js`** with new functions
4. **Update `plan-formatter.js`** with CLI-only report
5. **Keep existing files** (`orchestrator.js`, `plan-based-installer.js`) with deprecation notices and delegation
6. **Update README** with new documentation

---

## Summary

| Aspect | CLI-Only (SKIP) | Guided |
|--------|-----------------|--------|
| Prompts | 3 (dir, API key, auth token) | 5+ (full config) |
| CLI Run | ✅ Yes | ✅ Yes |
| Plan Generation | ❌ No | ✅ Yes |
| User Approval | ❌ N/A | ✅ Required |
| File Modifications | ❌ CLI only | ✅ Plan-specified |
| QA Checks | Basic (4 checks) | Full (5+ checks) |
| Output | TODO checklist | Implementation plan |

---

**Ready for your approval before implementation.**
