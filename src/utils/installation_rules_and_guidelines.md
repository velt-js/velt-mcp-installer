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

**Recommended Env Var Names (FireHydrant Pattern):**
```
VELT_PUBLIC_API_KEY=your_api_key_here
VELT_AUTH_TOKEN=your_auth_token_here
```

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

## JWT Token Generation (Production Pattern)

### Server-Side Token Generation (Recommended)

**Why Server-Side:** JWT tokens should be generated server-side to keep the auth token secure. The auth token (`VELT_AUTH_TOKEN`) should NEVER be exposed to the client.

**Velt Token API Endpoint:**
```
POST https://api.velt.dev/v2/auth/token/get
```

**Required Headers:**
```
x-velt-api-key: YOUR_VELT_PUBLIC_API_KEY
x-velt-auth-token: YOUR_VELT_AUTH_TOKEN
```

**Request Body:**
```json
{
  "data": {
    "userId": "user-123",
    "userProperties": {
      "organizationId": "org-456",
      "email": "user@example.com"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Next.js API Route Implementation

**Location:** `app/api/velt/token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// [Velt] JWT Token Generation API Route
// This endpoint generates Velt authentication tokens for users.
// SECURITY: Keep VELT_AUTH_TOKEN server-side only - never expose to client.

const VELT_API_KEY = process.env.VELT_PUBLIC_API_KEY;
const VELT_AUTH_TOKEN = process.env.VELT_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // [Velt] TODO: Validate user session before generating token
    // Example: const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, organizationId, email } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!VELT_API_KEY || !VELT_AUTH_TOKEN) {
      console.error('[Velt] Missing VELT_PUBLIC_API_KEY or VELT_AUTH_TOKEN');
      return NextResponse.json({ error: 'Velt credentials not configured' }, { status: 500 });
    }

    // [Velt] Call Velt Token API
    const response = await fetch('https://api.velt.dev/v2/auth/token/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-velt-api-key': VELT_API_KEY,
        'x-velt-auth-token': VELT_AUTH_TOKEN,
      },
      body: JSON.stringify({
        data: {
          userId,
          userProperties: {
            organizationId: organizationId || 'default-org',
            email: email || '',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Velt] Token API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    const json = await response.json();
    const token = json?.result?.data?.token;

    if (!token) {
      console.error('[Velt] No token in response:', json);
      return NextResponse.json({ error: 'Invalid token response' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[Velt] Token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Client-Side Token Fetching (VeltInitializeUser Pattern)

**Location:** `components/velt/VeltInitializeUser.tsx`

```typescript
'use client';

import { useCallback, useMemo } from 'react';
import { VeltAuthProvider, VeltUser } from '@veltdev/react';
import { useAppUser } from '@/app/userAuth/useAppUser';

// [Velt] Hook to create auth provider with backend token generation
export function useVeltAuthProvider() {
  const { user } = useAppUser();

  // [Velt] Token generation callback - calls backend API
  const generateToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/velt/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.userId,
          organizationId: user?.organizationId,
          email: user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('[Velt] Token generation failed:', error);
      throw error;
    }
  }, [user]);

  // [Velt] Create auth provider object
  const authProvider: VeltAuthProvider | undefined = useMemo(() => {
    if (!user?.userId) {
      return undefined;
    }

    const veltUser: VeltUser = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
    };

    return {
      user: veltUser,
      generateToken,
      retryConfig: { retryCount: 3, retryDelay: 1000 },
    };
  }, [user, generateToken]);

  return { authProvider };
}
```

---

## VeltInitializeDocument Pattern

### Context-Based Document ID (Recommended)

**Why Context-Based:** The document ID should come from your app's context/state (e.g., page ID, project ID, retrospective ID). This ensures users collaborating on the same resource share the same Velt document.

**Location:** `components/velt/VeltInitializeDocument.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useSetDocuments } from '@veltdev/react';

// [Velt] Import your app's context that provides the document/resource ID
// This could be from URL params, React context, or any state management
import { useYourAppContext } from '@/contexts/YourAppContext';

export default function VeltInitializeDocument() {
  // [Velt] Get document ID from your app's context
  // Example contexts: project, page, retrospective, document, etc.
  const appContext = useYourAppContext();
  const documentId = appContext?.resourceId; // e.g., retrospective.id, project.id

  const { setDocuments } = useSetDocuments();

  useEffect(() => {
    if (!documentId) return;

    // [Velt] Set the document for collaboration
    // All users with the same documentId will collaborate together
    setDocuments([
      {
        id: documentId,
        // Optional: Add metadata for document
        // metadata: { name: 'My Document', type: 'retrospective' }
      },
    ]);
  }, [setDocuments, documentId]);

  return null;
}
```

### Document ID Best Practices

1. **Use stable IDs**: Document IDs should be stable across sessions (e.g., database IDs, UUIDs)
2. **Unique per collaboration scope**: Different pages/resources should have different document IDs
3. **Include organization**: For multi-tenant apps, include org ID in document context (via user's organizationId)

---

## Velt Tiptap CRDT Editor Setup (Production Pattern)

### Overview

Velt Tiptap CRDT enables real-time collaborative editing in Tiptap editors. This pattern is based on the FireHydrant production implementation.

### Key Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **documentId** | Top-level scope for all collaboration | `retrospective-123` |
| **editorId** | Unique ID per editor instance within a document | `retrospective-123/question-456` |
| **initialContent** | Fallback content when CRDT document is empty | Backend-stored content |

### ID Mapping Pattern

```typescript
// [Velt] ID Mapping for Tiptap CRDT
// - documentId: Set via VeltInitializeDocument (one per page/resource)
// - editorId: Unique per editor instance (allows multiple editors per document)

// Example: Multiple editors in a retrospective
const retrospectiveId = 'retro-123';      // From context
const fieldId = 'question-456';            // Field being edited

// Combined editorId format
const editorId = `${retrospectiveId}/${fieldId}`;
// Result: "retro-123/question-456"
```

### Complete TipTapCollabEditor Implementation

```typescript
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useVeltTiptapCrdtExtension } from '@veltdev/tiptap-crdt-react';
import { useServerConnectionStateChangeHandler } from '@veltdev/react';

interface TipTapCollabEditorProps {
  // [Velt] CRDT requires both document-level and editor-level IDs
  documentId: string;  // Top-level scope (from VeltInitializeDocument)
  fieldId: string;     // Unique field/question ID within the document

  // [Velt] Backend content for initial seeding
  backendfallbackContent?: any;

  // [Velt] Callback when content changes (for saving to backend)
  onUpdate?: (params: { fieldId: string; value: any }) => void;
}

export function TipTapCollabEditor({
  documentId,
  fieldId,
  backendfallbackContent,
  onUpdate,
}: TipTapCollabEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSeededContentRef = useRef(false);
  const isEditorReadyRef = useRef(false);

  // [Velt] Combine documentId and fieldId for unique editorId
  const editorId = `${documentId}/${fieldId}`;

  // [Velt] Format initial content for CRDT
  const veltInitialContent = useMemo(() => {
    if (!backendfallbackContent) return undefined;
    if (Array.isArray(backendfallbackContent)) {
      return { type: 'doc', content: backendfallbackContent };
    }
    return backendfallbackContent;
  }, [backendfallbackContent]);

  // [Velt] Initialize CRDT extension
  const { VeltCrdt, isLoading } = useVeltTiptapCrdtExtension({
    editorId,
    initialContent: veltInitialContent,
  });

  // [Velt] Monitor server connection state
  const serverConnectionState = useServerConnectionStateChangeHandler();

  // [Velt] Helper to check if editor is empty
  const isEditorEmpty = (editor: any) => {
    if (!editor) return true;
    const json = editor.getJSON();
    if (!json.content || json.content.length === 0) return true;
    if (json.content.length === 1) {
      const firstNode = json.content[0];
      if (firstNode.type === 'paragraph' && (!firstNode.content || firstNode.content.length === 0)) {
        return true;
      }
    }
    return false;
  };

  // [Velt] Helper to check if backend has content
  const hasBackendContent = (content: any) => {
    if (!content) return false;
    if (Array.isArray(content) && content.length === 0) return false;
    return true;
  };

  // [Velt] Configure Tiptap editor with CRDT
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // [Velt] CRITICAL: Disable undo/redo - CRDT handles this
        undoRedo: false,
      }),
      // [Velt] Add CRDT extension when available
      ...(VeltCrdt ? [VeltCrdt] : []),
    ],
    // [Velt] Don't set initial content - let CRDT handle it
    // content: initialContent, // COMMENTED OUT - CRDT manages content
    immediatelyRender: false,
    onUpdate: ({ editor, transaction }) => {
      // [Velt] Detect remote syncs - don't save these to backend
      const isRemoteSync =
        transaction.getMeta('y-sync$') ||
        transaction.getMeta('remote') ||
        transaction.getMeta('velt-sync') ||
        transaction.getMeta('isRemote');

      if (isRemoteSync) return;

      // [Velt] Debounced auto-save (2 seconds)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (transaction.docChanged && isEditorReadyRef.current) {
        saveTimeoutRef.current = setTimeout(() => {
          const content = editor.getJSON()?.content || [];
          onUpdate?.({ fieldId, value: content });
        }, 2000); // 2-second debounce
      }
    },
  }, [VeltCrdt]);

  // [Velt] Seed content from backend when CRDT doc is empty
  useEffect(() => {
    if (
      editor &&
      !isLoading &&
      serverConnectionState === 'online' &&
      !hasSeededContentRef.current &&
      isEditorEmpty(editor) &&
      hasBackendContent(backendfallbackContent)
    ) {
      hasSeededContentRef.current = true;
      // Small delay to ensure CRDT is ready
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(backendfallbackContent);
          isEditorReadyRef.current = true;
        }
      }, 100);
    } else if (editor && !isLoading && serverConnectionState === 'online') {
      isEditorReadyRef.current = true;
    }
  }, [editor, isLoading, serverConnectionState, backendfallbackContent]);

  // [Velt] Monitor connection state with timeout
  useEffect(() => {
    if (serverConnectionState === 'online') return;

    const timeout = setTimeout(() => {
      if (serverConnectionState !== 'online') {
        console.warn('[Velt] CRDT connection timeout - check network');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [serverConnectionState]);

  // [Velt] Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // [Velt] Show loading state while CRDT initializes
  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded" />;
  }

  return (
    <div className="tiptap-collab-editor">
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Key Implementation Notes

1. **Disable Undo/Redo**: Use `StarterKit.configure({ undoRedo: false })` - CRDT handles history
2. **Don't Set Initial Content**: Comment out `content` in useEditor - CRDT manages it
3. **Detect Remote Syncs**: Check transaction meta for `y-sync$`, `remote`, `velt-sync`, `isRemote`
4. **Debounce Auto-Save**: Use 2-second debounce to avoid excessive backend saves
5. **Seed from Backend**: When CRDT doc is empty, seed from backend content once
6. **Monitor Connection**: Use `useServerConnectionStateChangeHandler()` for connection state

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
