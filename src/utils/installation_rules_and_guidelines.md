# Velt Installation Rules & Guidelines

**Purpose:** Deterministic rules for automated Velt integration in Next.js App Router projects
**Last Updated:** November 2024

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Integration Script API](#integration-script-api-integrationjs)
3. [Global Setup Rules](#global-setup-rules)
4. [File Structure](#file-structure)
5. [CLI-Generated Components Reference](#cli-generated-components-reference)
6. [Environment Variables](#environment-variables)
7. [Feature Components](#feature-components)
8. [Library-Specific Patterns](#library-specific-patterns)
9. [Validation Checklist](#validation-checklist)
10. [Implementation Notes](#implementation-notes)
11. [Summary](#summary)

---

## Prerequisites

### Velt CLI Installation

**Current:** Velt CLI installed locally
**Future:** Will be available as npm package

**What CLI Does (Step 2):**
- Installs @veltdev/react and dependencies
- Creates complete file structure including:
  - `app/layout.tsx` with AppProviders
  - `app/page.tsx` with VeltProvider (API key placeholder: "YOUR_VELT_API_KEY")
  - All authentication files (`app/userAuth/*`)
  - All Velt components (`components/velt/*`)
  - Document management (`app/document/*`)
  - UI customization files

**What Integration Script Must Do (Step 4 - After CLI):**
- Replace API key placeholder with actual key from Step 1 configuration
- Verify all files exist and are properly structured
- Adjust paths if project uses custom structure
- Add any missing integrations (if CLI didn't create them)

---

## Integration Script API (integration.js)

### Purpose and Scope

The integration script (`integration.js`) is a **post-CLI** integration and validation tool. It assumes the `add-velt-next-js` CLI has already been run in the target project.

### Responsibilities

The integration script:

1. **Detects** whether the project uses `src/` (i.e., `src/app`) or root-level `app/`
2. **Locates** CLI-generated files (e.g., `app/page.tsx`, `app/layout.tsx`, `app/userAuth/*`, `components/velt/*`, etc.)
3. **Replaces** placeholder values like `"YOUR_VELT_API_KEY"` and `"YOUR_VELT_AUTH_TOKEN"` with real values from config
4. **Validates** that the installation matches the rules in this document
5. **Optionally wires** library-specific integrations:
   - ReactFlow: Automatically adds `VeltCursor` component
   - Other libraries (Tiptap, CodeMirror, AG-Grid, TanStack): Inserts `// [Velt] TODO` comments pointing to docs

The integration script **does not**:
- Run the CLI itself
- Attempt to generically insert `VeltProvider` or comments components into arbitrary layouts/pages
- Modify files beyond placeholder replacement and optional library wiring

That is the CLI's job. This script is strictly a **post-CLI, rule-based integrator and validator**.

### API Contract

#### Main Function

```typescript
async function analyzeAndIntegrate(options: {
  projectPath: string;
  config: IntegrationConfig;
  patterns?: IntegrationPatterns;
}): Promise<IntegrationResult>
```

#### IntegrationConfig

```typescript
interface IntegrationConfig {
  apiKey: string;           // Required: Velt API key
  authToken?: string;       // Optional: Velt auth token for JWT
  enableReactFlowCursor?: boolean; // Optional: Enable ReactFlow cursor integration
}
```

#### IntegrationPatterns

Library detection hints used to wire in extra features or add TODO comments:

```typescript
interface IntegrationPatterns {
  hasReactFlow?: boolean;   // Automatically wire VeltCursor
  hasTiptap?: boolean;      // Add TODO comment for Tiptap integration
  hasCodeMirror?: boolean;  // Add TODO comment for CodeMirror integration
  hasAgGrid?: boolean;      // Add TODO comment for AG-Grid integration
  hasTanStack?: boolean;    // Add TODO comment for TanStack table integration
}
```

#### IntegrationResult

```typescript
interface IntegrationResult {
  success: boolean;         // True if no validation issues
  data: {
    filesModified: string[]; // Paths of files that were modified
    componentsAdded: {
      file: string;
      name: string;
      description?: string;
    }[];
    integrationPoints: {
      file: string;
      type: string;         // e.g., 'apiKeyReplacement', 'reactflowCursor', 'todoComment'
      description: string;
      placeholder?: string; // The placeholder that was replaced
    }[];
    validationIssues: {
      file?: string;
      type: string;         // e.g., 'missing-file', 'validation-failed'
      message: string;
    }[];
  };
}
```

### Behavior Specification

#### 1. Project Structure Detection

- Check if `<projectPath>/src/app` exists → use `src/app` and `src/components`
- Otherwise → use `app/` and `components/`
- Verify `package.json` has a `next` dependency to confirm this is a Next.js project

#### 2. CLI Output Validation

Check for CLI-generated files. If core files are missing, return early with validation issues:

- `app/page.tsx`
- `app/layout.tsx`
- `app/userAuth/AppProviders.tsx`
- `app/userAuth/SignIn.tsx`
- `app/document/page.tsx` or equivalent
- `app/api/velt/token/route.ts`
- `components/velt/VeltCollaboration.tsx`
- `components/velt/ui-customization/styles.css`

#### 3. Placeholder Replacement

**API Key in page.tsx:**
- Find: `"YOUR_VELT_API_KEY"`
- Replace with: `config.apiKey`
- Record as `apiKeyReplacement` integration point

**Auth Token in JWT route (if provided):**
- Find: `"YOUR_VELT_AUTH_TOKEN"` in `app/api/velt/token/route.ts`
- Replace with: `config.authToken`
- Record as `authTokenReplacement` integration point

#### 4. Optional Library Integration

**ReactFlow (patterns.hasReactFlow = true):**
- Insert `<VeltCursor />` into `components/velt/VeltCollaboration.tsx`
- Record as `reactflowCursor` integration point

**Other Libraries (Tiptap, CodeMirror, AG-Grid, TanStack):**
- Insert `// [Velt] TODO: Wire [Library] integration. See docs at [link]` comments
- Record as `todoComment` integration points
- Do **not** attempt full wiring for these libraries

#### 5. Validation Checklist

Run checks mirroring the rules in this document:

- File existence checks
- Basic code structure validation (e.g., `"use client"` directive, `VeltProvider` usage)
- Placeholder removal verification
- Record any issues in `validationIssues`

#### 6. Result

- `success = true` if `validationIssues.length === 0`
- Return comprehensive result with all modifications and validation status

---

## Global Setup Rules

### Rule 1: Detect Project Structure

**Check for src/ directory:**
- If `src/app/` exists → use `src/app/*` and `src/components/*`
- Otherwise → use `app/*` and `components/*`

**All subsequent paths adjust based on this detection.**

---

### Rule 2: Replace API Key in page.tsx

**Location:** `[src/]app/page.tsx`

**What CLI Creates:**
- File with VeltProvider already set up
- API key hardcoded as: `const NEXT_PUBLIC_VELT_API_KEY = "YOUR_VELT_API_KEY";`
- All imports and structure already in place

**What Integration Script Must Do:**

1. **Replace API key placeholder:**
   - Find: `"YOUR_VELT_API_KEY"`
   - Replace with: actual API key from Step 1 configuration

2. **Verification checks:**
   - Verify file has "use client" directive
   - Verify VeltProvider exists and wraps content
   - Verify all required imports are present

**Detection Logic:**
- Read file content
- Search for `"YOUR_VELT_API_KEY"` string
- Replace with actual API key
- Write file back

---

### Rule 3: Verify layout.tsx

**Location:** `[src/]app/layout.tsx`

**What CLI Creates:**
- File with AppProviders already wrapping children
- Required imports already in place
- Styles already imported

**What Integration Script Must Do:**

1. **Verification only:**
   - Verify AppProviders wraps `{children}`
   - Verify required imports exist
   - Verify styles.css import is present

**Detection Logic:**
- Read file to confirm structure
- Report if anything is missing (unlikely with CLI-generated files)

---

## File Structure

### CLI-Generated Directory Structure

**All these files are created by Velt CLI in Step 2:**

```
[src/]
├── app/
│   ├── layout.tsx                    # CLI creates with AppProviders
│   ├── page.tsx                      # CLI creates with VeltProvider (needs API key replacement)
│   ├── userAuth/
│   │   ├── AppProviders.tsx          # CLI creates
│   │   ├── AppUserContext.tsx        # CLI creates (with demo user generation)
│   │   └── useAppUser.tsx            # CLI creates
│   ├── document/
│   │   ├── DocumentContext.tsx       # CLI creates
│   │   └── useCurrentDocument.ts     # CLI creates
│   └── api/velt/token/
│       └── route.ts                  # CLI creates (JWT token endpoint)
└── components/
    ├── header/
    │   └── header.tsx                # CLI creates
    ├── sidebar/
    │   └── sidebar.tsx               # CLI creates
    └── velt/
        ├── VeltCollaboration.tsx     # CLI creates
        ├── VeltInitializeUser.tsx    # CLI creates
        ├── VeltInitializeDocument.tsx # CLI creates
        ├── VeltTools.tsx             # CLI creates
        └── ui-customization/
            ├── VeltCustomization.tsx          # CLI creates
            ├── VeltCommentBubbleWf.tsx        # CLI creates
            ├── VeltCommentToolWf.tsx          # CLI creates
            ├── VeltNotificationsToolWf.tsx    # CLI creates
            ├── VeltSidebarButtonWf.tsx        # CLI creates
            └── styles.css                     # CLI creates (with full theme)
```

**Integration Script Role:**
- Verify all files exist
- Replace API key placeholders
- Report any missing files (though CLI should create them all)

---

## CLI-Generated Components Reference

**Note:** All these components are created by the Velt CLI. This section is for reference only.

### Key Components to Understand:

**1. VeltProvider Setup** (`app/page.tsx`)
- CLI creates with hardcoded API key: `"YOUR_VELT_API_KEY"`
- Integration script replaces with actual key from Step 1

**2. Authentication** (`app/userAuth/*`)
- CLI creates full demo user system with:
  - Random user generation
  - Local storage persistence
  - Context provider pattern
- Includes disclaimers that this is demo-only

**3. Document Management** (`app/document/*`)
- CLI creates with URL-based document IDs
- Includes disclaimers about demo usage

**4. JWT Token API** (`app/api/velt/token/route.ts`)
- CLI creates backend endpoint
- Has placeholder: `"YOUR_VELT_API_KEY"` and `"YOUR_VELT_AUTH_TOKEN"`
- Needs replacement if using JWT auth

**5. Velt Components** (`components/velt/*`)
- VeltCollaboration: Main container
- VeltInitializeUser: Auth provider with JWT token fetching
- VeltInitializeDocument: Document context setup
- VeltTools: Presence, notifications, sidebar button
- UI Customization: Full wireframe components with dark mode

---

## Environment Variables

### API Key Configuration

**Velt CLI Approach:**
- CLI hardcodes API keys directly in source files (not .env)
- `app/page.tsx`: `const NEXT_PUBLIC_VELT_API_KEY = "YOUR_VELT_API_KEY";`
- `app/api/velt/token/route.ts`: Contains both `YOUR_VELT_API_KEY` and `YOUR_VELT_AUTH_TOKEN`

**Integration Script Must:**
1. **Replace placeholders in code** (not .env):
   - In `app/page.tsx`: Replace `"YOUR_VELT_API_KEY"` with actual API key from Step 1 config
   - In `app/api/velt/token/route.ts`: Replace both placeholders if needed

2. **Optional .env.local** (for user's reference):
   - CLI can optionally create `.env.local` with `--env` flag
   - But keys are primarily hardcoded in source files
   - Integration script can skip .env.local unless specifically requested

---

## Feature Components

### Optional: Add More Features

After basic installation, users can add:

**1. Comments Sidebar**
```tsx
import { VeltCommentsSidebar } from "@veltdev/react";

<VeltCommentsSidebar />
```

**2. Presence (Online Users)**
```tsx
import { VeltPresence } from "@veltdev/react";

<VeltPresence />
```

**3. Notifications**
```tsx
import { VeltNotificationsTool } from "@veltdev/react";

<VeltNotificationsTool />
```

**4. Live Cursors (for CRDT/Canvas)**
```tsx
import { VeltCursor } from "@veltdev/react";

<VeltCursor />
```

**These are NOT included in basic installation** - users add manually based on needs.

---

## Library-Specific Patterns

### Pattern 1: Tables (AG-Grid / TanStack)

**When Detected:** Project has `ag-grid-react` or `@tanstack/react-table` in dependencies

**What to Document (not install):**

For tables, users need to add `data-velt-target-comment-element-id` to cells:

```tsx
// Example for AG-Grid
useEffect(() => {
  const cell = cellRef.current?.closest('.ag-cell');
  if (cell) {
    const cellId = `cell-${rowId}-${columnId}`;
    cell.id = cellId;
    cell.setAttribute('data-velt-target-comment-element-id', cellId);
  }
}, []);
```

```tsx
// Example for TanStack
useEffect(() => {
  const cell = cellRef.current?.closest('td');
  if (cell) {
    const cellId = `cell-${rowId}-${columnId}`;
    cell.id = cellId;
    cell.setAttribute('data-velt-target-comment-element-id', cellId);
  }
}, []);
```

**Action:** Add comment/TODO in VeltCollaboration.tsx about table integration.

---

### Pattern 2: Text Editors (Tiptap)

**When Detected:** Project has `@tiptap/react` in dependencies

**What to Document (not install):**

For Tiptap, users need to:

1. Install extension: `npm install @veltdev/tiptap-velt-comments`
2. Add to editor:

```tsx
import { TiptapVeltComments, addComment, renderComments } from '@veltdev/tiptap-velt-comments';
import { useCommentAnnotations } from '@veltdev/react';

const editor = useEditor({
  extensions: [
    // ... other extensions
    TiptapVeltComments,
  ],
});

const commentAnnotations = useCommentAnnotations();

useEffect(() => {
  if (editor && commentAnnotations?.length) {
    renderComments({ editor, commentAnnotations });
  }
}, [editor, commentAnnotations]);
```

**Action:** Add comment/TODO in VeltCollaboration.tsx about Tiptap integration.

---

### Pattern 3: CodeMirror (CRDT)

**When Detected:** Project has `@codemirror/state` in dependencies

**What to Document (not install):**

For CodeMirror CRDT:

```tsx
import { useVeltCodeMirrorCrdtExtension, useVeltInitState } from '@veltdev/react';

const veltInitialized = useVeltInitState();
const { store, isLoading } = useVeltCodeMirrorCrdtExtension({ editorId });

// Wait for Velt init before rendering editor
if (!veltInitialized) return <div>Loading...</div>;
```

**Action:** Add comment/TODO in VeltCollaboration.tsx about CodeMirror integration.

---

### Pattern 4: Canvas (ReactFlow)

**When Detected:** Project has `@xyflow/react` or `reactflow` in dependencies

**What to Document (not install):**

For ReactFlow, add VeltCursor:

```tsx
import { VeltCursor } from "@veltdev/react";

// In VeltCollaboration.tsx
<VeltCursor />
```

**Action:** Add VeltCursor component to VeltCollaboration.tsx automatically.

---

## Validation Checklist

### After CLI + Integration Script, Verify:

**Files Exist (CLI-generated):**
- [ ] `[src/]app/page.tsx` - Exists with VeltProvider
- [ ] `[src/]app/layout.tsx` - Exists with AppProviders
- [ ] `[src/]app/userAuth/AppProviders.tsx` - Exists
- [ ] `[src/]app/userAuth/AppUserContext.tsx` - Exists
- [ ] `[src/]app/userAuth/useAppUser.tsx` - Exists
- [ ] `[src/]app/document/DocumentContext.tsx` - Exists
- [ ] `[src/]app/document/useCurrentDocument.ts` - Exists
- [ ] `[src/]app/api/velt/token/route.ts` - Exists
- [ ] `[src/]components/velt/VeltCollaboration.tsx` - Exists
- [ ] `[src/]components/velt/VeltInitializeUser.tsx` - Exists
- [ ] `[src/]components/velt/VeltInitializeDocument.tsx` - Exists
- [ ] `[src/]components/velt/VeltTools.tsx` - Exists
- [ ] `[src/]components/velt/ui-customization/` - All files exist

**Code Checks:**
- [ ] `app/page.tsx` has "use client" directive
- [ ] VeltProvider wraps content in page.tsx
- [ ] VeltProvider has apiKey prop with actual key (not "YOUR_VELT_API_KEY")
- [ ] VeltProvider has authProvider prop
- [ ] AppProviders wraps {children} in layout.tsx
- [ ] All imports use @/ path alias

**API Key Replacement:**
- [ ] `app/page.tsx` API key replaced with actual key from Step 1
- [ ] No "YOUR_VELT_API_KEY" placeholder remains (unless intentional)
- [ ] API key is valid format (not empty, not placeholder)

---

## Implementation Notes

### Simple String Replacement Approach

**Primary Task: Replace API Key Placeholders**

Since CLI creates all files with proper structure, integration script only needs simple string replacement:

**1. Read file:**
```javascript
const content = fs.readFileSync('app/page.tsx', 'utf-8');
```

**2. Replace placeholder:**
```javascript
const updated = content.replace(
  '"YOUR_VELT_API_KEY"',
  `"${actualApiKeyFromStep1}"`
);
```

**3. Write back:**
```javascript
fs.writeFileSync('app/page.tsx', updated, 'utf-8');
```

**Optional: Verify Structure (No AST needed)**

Simple checks using string includes:
- `content.includes('"use client"')` - Verify client directive
- `content.includes('VeltProvider')` - Verify provider exists
- `content.includes('authProvider={authProvider}')` - Verify prop exists

**No Complex AST Operations Required:**
- CLI already created proper structure
- No need to add imports (already there)
- No need to wrap JSX (already wrapped)
- No need to parse AST for simple replacement

### Path Resolution

**Always use @/ alias for imports:**
- `@/app/*` → resolves to `[src/]app/*`
- `@/components/*` → resolves to `[src/]components/*`

**tsconfig.json or jsconfig.json should have:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"] // or "./*" if no src/ dir
    }
  }
}
```

---

## Summary

### What Integration Script Must Do (Step 4 - After CLI):

1. **Detect** project structure (src/ or no src/)
2. **Replace API key** in CLI-generated files:
   - `app/page.tsx` → Replace `"YOUR_VELT_API_KEY"` with actual key from Step 1
   - `app/api/velt/token/route.ts` → Optionally replace both key placeholders
3. **Verify** CLI-generated files exist:
   - All authentication components
   - All Velt components
   - Document management files
   - UI customization files
4. **Validate** installation:
   - Check VeltProvider is properly set up
   - Check AppProviders wraps children
   - Check all imports are correct
5. **Report** what was done and what user needs to know

### What User Must Do After Installation:

1. **Run the app:** `npm run dev` (or yarn/pnpm equivalent)
2. **Test collaboration:** Open app in multiple browsers to see real-time features
3. **Customize authentication** (optional): Replace demo user system in `AppUserContext.tsx`
4. **Customize document IDs** (optional): Replace URL-based IDs in `DocumentContext.tsx`
5. **Add library-specific integrations** (if needed): Follow patterns for tables/editors

---

**End of Document**
