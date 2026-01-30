/**
 * Plan Formatter
 *
 * Formats installation instructions as a sequential plan (similar to Cursor's plan mode)
 * that the AI can follow to complete the implementation.
 */

import { getDocUrl, getDocMarkdownUrl } from './velt-docs-urls.js';
import { getSkillReferences } from './velt-docs-fetcher.js';

/**
 * Generates a "Skills & Sources" section for the plan output.
 * Skills-covered features get a skill reference; others get docs URLs.
 *
 * @param {string[]} features - Features being installed
 * @param {Object} [options] - Options (commentType, crdtEditorType)
 * @returns {string} Markdown section
 */
function formatSkillsSourceSection(features, options = {}) {
  const refs = getSkillReferences(features, options);

  let section = `## Implementation Sources (Priority Order)\n\n`;
  section += `> **PREREQUISITE:** Install Velt Agent Skills via \`npx skills add velt-js/agent-skills\`\n>\n`;
  section += `> **Source Priority:** 1) Agent Skills (primary) → 2) Docs URLs (secondary) → 3) Velt Docs MCP (user follow-up only)\n\n`;

  const skillRefs = refs.filter(r => r.skillName);
  const docsRefs = refs.filter(r => r.docsUrl);

  if (skillRefs.length > 0) {
    section += `### Primary: Agent Skills (use these first)\n\n`;
    // Deduplicate skill names
    const seen = new Set();
    for (const ref of skillRefs) {
      if (!seen.has(ref.skillName)) {
        seen.add(ref.skillName);
        const features = skillRefs.filter(r => r.skillName === ref.skillName).map(r => r.feature);
        section += `- **${ref.skillName}** — covers: ${features.join(', ')}${ref.description ? ` (${ref.description})` : ''}\n`;
      }
    }
    section += `\n`;
  }

  if (docsRefs.length > 0) {
    section += `### Secondary: Docs URLs (for features without skills)\n\n`;
    for (const ref of docsRefs) {
      section += `- ${ref.feature}: ${ref.docsUrl}\n`;
    }
    section += `\n`;
  }

  section += `### Tertiary: Velt Docs MCP\n`;
  section += `- Only use for user follow-up questions AFTER implementation\n`;
  section += `- Do NOT query Velt Docs MCP during initial implementation if skills cover the feature\n\n`;

  return section;
}

/**
 * Formats a plan with numbered steps, details, and a to-do checklist
 *
 * @param {Object} options - Plan options
 * @param {string} options.title - Plan title (e.g., "Plan for Velt Freestyle Comments Installation")
 * @param {Array} options.steps - Array of step objects
 * @param {string} options.steps[].title - Step title
 * @param {string} options.steps[].details - Step details/instructions
 * @param {string[]} [options.steps[].codeExamples] - Optional code examples
 * @param {Array} [options.additionalInfo] - Additional information sections
 * @returns {string} Formatted plan as markdown
 */
export function formatInstallationPlan(options) {
  const { title, steps, additionalInfo = [] } = options;

  let plan = `# ${title}\n\n`;

  // Add numbered steps with details
  steps.forEach((step, index) => {
    const stepNumber = index + 1;
    plan += `## ${stepNumber}. ${step.title}\n`;
    plan += `*   **Details:** ${step.details}\n`;

    // Add code examples if provided
    if (step.codeExamples && step.codeExamples.length > 0) {
      step.codeExamples.forEach((example) => {
        plan += `\n${example.description ? `*   ${example.description}:` : ''}
\`\`\`${example.language || 'tsx'}
${example.code}
\`\`\`\n`;
      });
    }

    plan += '\n';
  });

  // Add additional information sections
  if (additionalInfo.length > 0) {
    additionalInfo.forEach((info) => {
      plan += `## ${info.title}\n`;
      plan += `${info.content}\n\n`;
    });
  }

  // Add To-Do checklist
  plan += `## To-Do List\n`;
  steps.forEach((step, index) => {
    const checkbox = index === 0 ? '[✓]' : '[ ]';
    plan += `- ${checkbox} ${step.title}\n`;
  });

  plan += '\n';

  return plan;
}

/**
 * Creates a plan for Velt Comments installation
 *
 * @param {Object} options - Installation options
 * @param {string} options.commentType - Type of comments (freestyle, popover, page, stream, text)
 * @param {Object} options.implementation - Implementation details from Velt Docs
 * @param {Array} options.detectedFiles - Files detected for modification
 * @param {string} options.apiKey - API key preview
 * @param {string} options.headerPosition - Header position
 * @param {string} options.veltProviderLocation - Where to install VeltProvider
 * @param {string} options.crdtEditorType - CRDT editor type (tiptap, codemirror, blocknote)
 * @returns {string} Formatted installation plan
 */
export function createVeltCommentsPlan(options) {
  const {
    commentType,
    implementation,
    detectedFiles = [],
    apiKey,
    headerPosition,
    veltProviderLocation = 'app/page.tsx',
    crdtEditorType,
  } = options;

  const commentTypeTitle = commentType.charAt(0).toUpperCase() + commentType.slice(1);

  const steps = [];

  // Add warning about only implementing requested features
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${commentTypeTitle} Comments`,
    details: `You are ONLY installing ${commentTypeTitle} Comments. DO NOT implement: VeltNotificationsTool, VeltPresence, VeltCursor, VeltRecorder, or any other components unless the user specifically requested them. Only use authentication, user setup, and document setup from CLI. Get ${commentTypeTitle} Comments implementation from: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}`,
  });

  // Step 2: Use CLI-generated Velt components
  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate layout file (analyze the project structure to determine the best location)'
    : veltProviderLocation;

  steps.push({
    title: `Import and use CLI-generated Velt components in ${locationText}`,
    details: `The Velt CLI has generated the necessary component files in \`components/velt/\`. DO NOT create new files. Use the existing files:

**CLI-Generated Files:**
- \`components/velt/VeltInitializeUser.tsx\` - Exports \`useVeltAuthProvider\` hook (NOT a wrapper component)
- \`components/velt/VeltInitializeDocument.tsx\` - Exports \`useCurrentDocument\` hook for document context
- \`components/velt/VeltCollaboration.tsx\` - Velt feature components (comments, presence, etc.)
- \`app/userAuth/AppUserContext.tsx\` - User context provider wrapper
- \`app/userAuth/useAppUser.tsx\` - User data hook (add TODOs here)
- \`app/api/velt/token/route.ts\` - Token generation API

⚠️ **CRITICAL ARCHITECTURE (Sample App Pattern):**

**1. app/layout.tsx - Wrap with AppUserProvider:**
\`\`\`tsx
import { AppUserProvider } from './userAuth/AppUserContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
**Why**: AppUserProvider provides user context to all components including Velt auth.

**2. app/page.tsx (or root page) - VeltProvider with authProvider hook:**
\`\`\`tsx
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

const VELT_API_KEY = process.env.NEXT_PUBLIC_VELT_API_KEY!;

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
\`\`\`
**Why**: VeltProvider must be in page.tsx with authProvider from hook, NOT nested wrapper components.

**What to do:**
1. Add AppUserProvider wrapper to app/layout.tsx
2. Add VeltProvider to ${locationText} using useVeltAuthProvider hook
3. Import VeltCollaboration for feature components
4. Follow the markdown documentation for ${commentType} comment-specific implementation: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}

**CRITICAL - For Tiptap/Lexical/Slate Comments:**
- ✅ **FIND EXISTING EDITOR** - Search the project for existing Tiptap/Lexical/Slate editor components
- ✅ **INTEGRATE INTO EXISTING EDITOR** - Add Velt comments to the existing editor, DO NOT create a new editor
- ✅ **USE BUBBLE MENU PATTERN** - Add comment button to bubble menu (appears on text selection), NOT a fixed toolbar
- ✅ Use ONLY the comment-specific package: @veltdev/tiptap-velt-comments, @veltdev/lexical-velt-comments, or @veltdev/slate-velt-comments
- ❌ DO NOT create a new editor component if one already exists
- ❌ DO NOT create a fixed toolbar with Bold/Italic/Comment buttons
- ❌ DO NOT use CRDT packages (@veltdev/tiptap-velt-collaboration or similar)
- ❌ DO NOT implement real-time collaborative editing - only comments on the editor

**Tiptap Pattern:**
\`\`\`tsx
import { BubbleMenu } from '@tiptap/react'
import { TiptapVeltComments, addComment, renderComments } from '@veltdev/tiptap-velt-comments'
import { useCommentAnnotations } from '@veltdev/react'

// Add to editor extensions: TiptapVeltComments
// Use BubbleMenu component with comment button
<BubbleMenu editor={editor}>
  <button onClick={() => addComment({ editor })}>💬 Comment</button>
</BubbleMenu>
\`\`\`

**Lexical Pattern:**
- Add VeltCommentsPlugin to editor plugins
- Use custom bubble menu that appears on selection
- Trigger addComment() from bubble menu button

**Slate Pattern:**
- Wrap editor with withVeltComments()
- Implement bubble menu with position tracking on selection
- Trigger addComment({ editor }) from bubble menu button

**If NO existing editor found:** Provide minimal integration example with bubble menu, but recommend user add to their existing editor.

**IMPORTANT:** All Velt-related files should remain in \`components/velt/\`. Do not create new Velt files outside this folder.`,
    codeExamples: [
      {
        description: `Correct pattern: VeltProvider in page.tsx with authProvider hook`,
        language: 'tsx',
        code: `// app/page.tsx (or your root page component)
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

const VELT_API_KEY = process.env.NEXT_PUBLIC_VELT_API_KEY!;

export default function Page() {
  const { authProvider } = useVeltAuthProvider();
  const { documentId } = useCurrentDocument();

  return (
    <VeltProvider apiKey={VELT_API_KEY} authProvider={authProvider}>
      <VeltCollaboration documentId={documentId} />
      {/* Your page content here */}
    </VeltProvider>
  );
}

// For ${commentType} comments: Follow implementation at ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}`,
      },
    ],
  });

  // Step 3: Add TODO comments to CLI-generated auth files
  steps.push({
    title: `Add TODO comments to CLI-generated authentication files`,
    details: `The Velt CLI has generated authentication files in specific locations. Add TODO comments to these existing files (DO NOT create new files):

**1. User Hook: \`app/userAuth/useAppUser.tsx\`**
   - This file already exists from CLI
   - Add TODO: Connect to your existing authentication system
   - Add TODO: Replace mock user data with actual user from your auth provider
   - Examples: Next-auth useSession(), Clerk useUser(), Auth0, etc.

**2. Auth Provider: \`components/velt/VeltInitializeUser.tsx\`**
   - This file already exists from CLI (references useAppUser)
   - Contains \`useVeltAuthProvider\` hook
   - File location may vary, look for useVeltAuthProvider hook

**3. Document Hook: Check for \`app/document/useCurrentDocument.tsx\`**
   - May be in CLI-generated files or needs to be created
   - Add TODO: Implement document identification logic
   - Add TODO: Return unique document ID based on current page/route
   - Examples: router.query.id, pathname, page slug

**4. Token API: \`app/api/velt/token/route.ts\`**
   - This file already exists from CLI
   - Add TODO: Connect to your backend authentication
   - Add TODO: Validate user session before generating token

**IMPORTANT:** Only modify CLI-generated files. Do not create new files. Keep all Velt code in \`components/velt/\` and the specified locations.

**FOR TESTING PRESENCE/CURSORS:** Add logic to test with multiple users:
1. Hardcode a fixed document ID (e.g., "demo-document") so all tabs use the same document
2. Provide 2 hardcoded users (user-1 and user-2) with different names/avatars
3. Allow switching users via URL parameter (?user=1 or ?user=2) to test presence/cursors
4. Open multiple browser tabs with different user parameters to see live presence and cursors`,
    codeExamples: [
      {
        description: 'Example: Hardcoded document ID and multiple users for testing',
        language: 'typescript',
        code: `// In useCurrentDocument.tsx - Hardcode document ID for testing:
export function useCurrentDocument() {
  // [Velt] HARDCODED for testing presence/cursors
  // TODO: Replace with dynamic document ID based on your routing
  const documentId = "demo-document"; // Fixed ID so all tabs see same document

  return { documentId, documentName: "Demo Document" };
}

// In useAppUser.tsx - Multiple users for testing:
export function useAppUser() {
  // [Velt] HARDCODED USERS for testing presence/cursors
  // TODO: Replace with actual user from your auth provider

  // Get user from URL parameter (?user=1 or ?user=2)
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const userParam = searchParams?.get('user') || '1';

  const users = {
    '1': {
      userId: "user-1",
      name: "Demo User 1",
      email: "user1@example.com",
      photoUrl: "https://i.pravatar.cc/150?img=1",
      organizationId: "demo-org",
    },
    '2': {
      userId: "user-2",
      name: "Demo User 2",
      email: "user2@example.com",
      photoUrl: "https://i.pravatar.cc/150?img=2",
      organizationId: "demo-org",
    }
  };

  const user = users[userParam] || users['1'];

  return { user, isUserLoggedIn: true };
}

// TESTING INSTRUCTIONS:
// 1. Open http://localhost:3000?user=1 in one tab
// 2. Open http://localhost:3000?user=2 in another tab
// 3. You should see 2 different avatars in presence
// 4. Move mouse in one tab to see cursor in the other tab`,
      },
      {
        description: 'Example TODO comments to add',
        language: 'typescript',
        code: `// In useAppUser.tsx:
// TODO: Connect to your authentication system
// TODO: Replace this mock user data with actual user from your auth provider
// Example: const user = useAuth(); // Your auth hook
// Example: const user = useSession(); // Next-auth
// Example: const user = useUser(); // Clerk, Auth0, etc.

// In useCurrentDocument.tsx:
// TODO: Implement document identification logic
// TODO: Return a unique document ID based on your app's routing
// Example: Use route params, URL, page ID, etc.
// Example: const documentId = router.query.id;
// Example: const documentId = \`page-\${pathname}\`;

// In app/api/velt/auth/route.ts:
// TODO: SECURITY - Validate user session before generating token
// TODO: Connect to your backend authentication
// TODO: Verify user is authenticated and authorized

// If JWT generation is present:
// TODO: SECURITY - Replace 'your-secret-key' with actual secret
// TODO: Store secret in environment variables (process.env.JWT_SECRET)
// TODO: NEVER commit secrets to version control
// TODO: Implement token expiration (expiresIn: '24h')`,
      },
    ],
  });

  // Step 4: Implement JWT token generation (Production Pattern)
  steps.push({
    title: `Implement JWT token generation via Velt API (Production Pattern)`,
    details: `The CLI generates a placeholder JWT route. Replace it with the production pattern that calls Velt's token API.

**Production Pattern (FireHydrant Reference):**
Server-side API calls Velt's token endpoint to generate secure JWT tokens.

**Velt Token API:**
\`\`\`
POST https://api.velt.dev/v2/auth/token/get
Headers:
  x-velt-api-key: YOUR_VELT_PUBLIC_API_KEY
  x-velt-auth-token: YOUR_VELT_AUTH_TOKEN (keep secret!)
Body:
  { "data": { "userId": "...", "userProperties": { "organizationId": "...", "email": "..." } } }
Response:
  { "result": { "data": { "token": "eyJ..." } } }
\`\`\`

**Environment Variables to Set:**
\`\`\`
VELT_PUBLIC_API_KEY=your_api_key_here
VELT_AUTH_TOKEN=your_auth_token_here  # NEVER expose to client!
\`\`\`

**Security Requirements:**
- Keep VELT_AUTH_TOKEN server-side only (never expose to client)
- Validate user session before generating tokens
- The auth token should only be used in API routes, not client components`,
    codeExamples: [
      {
        description: 'Production API Route: app/api/velt/token/route.ts',
        language: 'typescript',
        code: `import { NextRequest, NextResponse } from 'next/server';

// [Velt] JWT Token Generation - Production Pattern
const VELT_API_KEY = process.env.VELT_PUBLIC_API_KEY;
const VELT_AUTH_TOKEN = process.env.VELT_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // [Velt] TODO: Add user session validation here
    // const session = await getServerSession(authOptions);
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
          userProperties: { organizationId: organizationId || 'default-org', email: email || '' },
        },
      }),
    });

    if (!response.ok) {
      console.error('[Velt] Token API error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    const json = await response.json();
    const token = json?.result?.data?.token;
    if (!token) {
      return NextResponse.json({ error: 'Invalid token response' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[Velt] Token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,
      },
      {
        description: 'Client-side auth provider with backend token fetch',
        language: 'typescript',
        code: `// In VeltInitializeUser.tsx - useVeltAuthProvider hook
export function useVeltAuthProvider() {
  const { user } = useAppUser();

  // [Velt] Token generation - calls backend API
  const generateToken = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/velt/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.userId,
        organizationId: user?.organizationId,
        email: user?.email,
      }),
    });
    if (!response.ok) throw new Error('Token fetch failed');
    const data = await response.json();
    return data.token;
  }, [user]);

  const authProvider: VeltAuthProvider | undefined = useMemo(() => {
    if (!user?.userId) return undefined;
    return {
      user: { userId: user.userId, name: user.name, email: user.email, organizationId: user.organizationId },
      generateToken,
      retryConfig: { retryCount: 3, retryDelay: 1000 },
    };
  }, [user, generateToken]);

  return { authProvider };
}`,
      },
    ],
  });

  // Step 5: Replace API key placeholders
  steps.push({
    title: `Replace API key with actual value`,
    details: `Update all instances of "YOUR_VELT_API_KEY" and "YOUR_VELT_AUTH_TOKEN" with your actual values: ${apiKey}. Make sure to replace in VeltProvider configuration.`,
  });

  // Step 6: Test the installation
  steps.push({
    title: `Test the ${commentTypeTitle} comments functionality`,
    details: `Start your development server and test ONLY the ${commentType} comments feature. ${getTestInstructions(commentType)} DO NOT test or implement other features.`,
  });

  // Step 7: Check dev console for errors
  steps.push({
    title: `Check browser console for Velt errors/warnings`,
    details: `Open browser DevTools Console (Press F12 or Cmd+Option+I on Mac) and look for any Velt errors or warnings. Common errors include: "Please set document id to continue", "Velt API key not found", "Failed to authenticate user". If you find any errors, use the Velt Docs MCP to query for solutions. Example query: "How do I fix 'Please set document id to continue' error in Velt?"`,
  });

  // Additional information
  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**WHAT TO USE FROM CLI:**
- ✅ Authentication setup (user identification)
- ✅ Document setup (document context)
- ✅ API key configuration

**PRIMARY SOURCE: Agent Skills (installed via \`npx skills add velt-js/agent-skills\`):**
- ✅ **velt-setup-best-practices** — VeltProvider setup, auth, document identity, project structure
- ✅ **velt-comments-best-practices** — ${commentType} comments implementation patterns and best practices
- Use skills as your FIRST reference for implementation details

**SECONDARY SOURCE: Docs URLs (only if skills don't cover it):**
- ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}

**TERTIARY SOURCE: Velt Docs MCP:**
- Only use for user follow-up questions AFTER implementation

**WHAT NOT TO IMPLEMENT:**
- ❌ VeltTools component
- ❌ ui-customization folder (unless user asks)
- ❌ Components user didn't request
- ❌ DO NOT copy code from CLI-generated files in components/velt/*`,
    },
    {
      title: 'Additional Features Available',
      content: `After completing the comments installation, you can add more Velt features:

**Presence (Live Users):**
- Setup: ${getDocMarkdownUrl('presence', null, 'setup')}
- Add \`<VeltPresence />\` to show online users with avatars
- Customize behavior: ${getDocMarkdownUrl('presence', null, 'customizeBehavior')}

**Cursors (Real-time Tracking):**
- Setup: ${getDocMarkdownUrl('cursors', null, 'setup')}
- Add \`<VeltCursor />\` to show live cursor positions
- Customize behavior: ${getDocMarkdownUrl('cursors', null, 'customizeBehavior')}

**Notifications:**
- Setup: ${getDocMarkdownUrl('notifications', null, 'setup')}
- Add \`<VeltNotificationsTool />\` for notification bell
- Customize behavior: ${getDocMarkdownUrl('notifications', null, 'customizeBehavior')}

**Recorder:**
- Setup: ${getDocMarkdownUrl('recorder', null, 'setup')}
- Add \`<VeltRecorder />\` for screen/audio recording
- Customize behavior: ${getDocMarkdownUrl('recorder', null, 'customizeBehavior')}`,
    },
    {
      title: 'Post-Installation: Dev Tools & Troubleshooting',
      content: `**Check Browser Console:**
After installation, open your browser DevTools Console (Press F12 or Cmd+Option+I on Mac):
1. Look for Velt SDK messages (usually prefixed with "[Velt]")
2. Check for warnings about configuration issues
3. Verify API key is loaded correctly
4. Watch for authentication errors or document ID issues

**Common Console Warnings:**
- "Velt API key not found" - Check that YOUR_VELT_API_KEY was replaced
- "Failed to authenticate user" - Verify auth token and user setup
- "Document ID missing" - Ensure document context is initialized

**Get Help:**
- For questions or issues AFTER installation, use the Velt Docs MCP server
- Query example: "How do I fix authentication errors in Velt?"
- The Velt Docs MCP has up-to-date solutions for common issues`,
    },
    {
      title: 'Documentation Reference',
      content: `**Primary: Agent Skills (installed via \`npx skills add velt-js/agent-skills\`)**
- **velt-setup-best-practices** — VeltProvider, auth, document identity, project structure
- **velt-comments-best-practices** — ${commentType} comments implementation patterns

**Secondary: Docs URLs**
- This feature: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}
- Pattern: https://docs.velt.dev/[feature]/[page].md

**Tertiary: Velt Docs MCP**
After installation, query the Velt Docs MCP server for:
- Feature customization
- Troubleshooting
- Advanced configuration
- Integration patterns
Do NOT query during initial implementation — use Agent Skills first.`,
    },
  ];

  // Generate skills source section
  const skillsSection = formatSkillsSourceSection(['comments'], { commentType });

  const basePlan = formatInstallationPlan({
    title: `Plan for Velt ${commentTypeTitle} Comments Installation`,
    steps,
    additionalInfo,
  });

  // Insert skills section right after the title line
  const titleEnd = basePlan.indexOf('\n\n') + 2;
  return basePlan.slice(0, titleEnd) + skillsSection + basePlan.slice(titleEnd);
}

/**
 * Gets CSS position styles for header positioning
 */
function getPositionStyles(position) {
  const styles = {
    'top-left': 'top: \'20px\',\n    left: \'20px\',',
    'top-right': 'top: \'20px\',\n    right: \'20px\',',
    'bottom-left': 'bottom: \'20px\',\n    left: \'20px\',',
    'bottom-right': 'bottom: \'20px\',\n    right: \'20px\',',
  };
  return styles[position] || styles['top-right'];
}

/**
 * Gets test instructions for a comment type
 */
function getTestInstructions(commentType) {
  const instructions = {
    freestyle: 'Click the Comment Tool button, then click anywhere on the page to add a comment.',
    popover: 'Click the Comment Tool button next to an element to attach a comment to it.',
    page: 'Open the Comments Sidebar and add a page-level comment at the bottom.',
    stream: 'Select text to see comments appear in the stream column on the right.',
    text: 'Highlight any text to see the Comment Tool button appear, then click it to add a comment.',
    inline: 'Navigate to your content area and test adding inline comments.',
    tiptap: 'Open your Tiptap editor, select text, and add comments using the Velt comment integration.',
    lexical: 'Open your Lexical editor, select text, and add comments using the Velt comment integration.',
    slate: 'Open your Slate.js editor, select text, and add comments using the Velt comment integration.',
  };
  return instructions[commentType] || 'Test adding comments in your application.';
}

/**
 * Creates a comprehensive plan for multiple Velt features
 *
 * @param {Object} options - Installation options
 * @param {string[]} options.features - Features to install (comments, presence, cursors, notifications, recorder, crdt)
 * @param {string} options.commentType - Type of comments (if comments feature is included)
 * @param {string} options.crdtEditorType - CRDT editor type (tiptap, codemirror, blocknote)
 * @param {Object} options.implementation - Comment implementation details from Velt Docs
 * @param {Object} options.crdtImplementation - CRDT implementation details from Velt Docs
 * @param {Object} options.featureImplementations - Other feature implementations from Velt Docs
 * @param {Array} options.detectedFiles - Files detected for modification
 * @param {string} options.apiKey - API key preview
 * @param {string} options.headerPosition - Header position
 * @param {string} options.veltProviderLocation - Where to install VeltProvider
 * @returns {string} Formatted installation plan
 */
export function createMultiFeaturePlan(options) {
  const {
    features = [],
    commentType,
    crdtEditorType,
    implementation,
    crdtImplementation,
    featureImplementations = {},
    detectedFiles = [],
    apiKey,
    headerPosition,
    veltProviderLocation = 'app/page.tsx',
  } = options;

  const steps = [];
  const hasComments = features.includes('comments');
  const hasPresence = features.includes('presence');
  const hasCursors = features.includes('cursors');
  const hasNotifications = features.includes('notifications');
  const hasRecorder = features.includes('recorder');
  const hasCRDT = features.includes('crdt');

  const featureList = [];
  if (hasComments) featureList.push(`${commentType.charAt(0).toUpperCase() + commentType.slice(1)} Comments`);
  if (hasPresence) featureList.push('Presence');
  if (hasCursors) featureList.push('Cursors');
  if (hasNotifications) featureList.push('Notifications');
  if (hasRecorder) featureList.push('Recorder');
  if (hasCRDT) featureList.push(`CRDT (${crdtEditorType ? crdtEditorType.charAt(0).toUpperCase() + crdtEditorType.slice(1) : 'Collaborative Editing'})`);

  // Add warning about only implementing requested features
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${featureList.join(', ')}`,
    details: `You are ONLY installing: ${featureList.join(', ')}. DO NOT implement any other components unless the user specifically requested them. Only use authentication, user setup, and document setup from CLI. Get implementation details from markdown URLs at docs.velt.dev.`,
  });

  // Step 2: Add VeltProvider
  const componentsToAdd = [];
  if (hasComments) componentsToAdd.push('VeltComments');
  if (hasPresence) componentsToAdd.push('VeltPresence');
  if (hasCursors) componentsToAdd.push('VeltCursor');
  if (hasNotifications) componentsToAdd.push('VeltNotificationsTool');
  if (hasRecorder) componentsToAdd.push('VeltRecorder');

  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate layout file (analyze the project structure to determine the best location)'
    : veltProviderLocation;

  steps.push({
    title: `Import and use CLI-generated Velt components in ${locationText}`,
    details: `The Velt CLI has generated the necessary component files in \`components/velt/\`. DO NOT create new files. Use the existing files:

**CLI-Generated Files:**
- \`components/velt/VeltInitializeUser.tsx\` - Exports \`useVeltAuthProvider\` hook (NOT a wrapper component)
- \`components/velt/VeltInitializeDocument.tsx\` - Exports \`useCurrentDocument\` hook for document context
- \`components/velt/VeltCollaboration.tsx\` - Velt feature components (comments, presence, etc.)
- \`app/userAuth/AppUserContext.tsx\` - User context provider wrapper
- \`app/userAuth/useAppUser.tsx\` - User data hook (add TODOs here)
- \`app/api/velt/token/route.ts\` - Token generation API

⚠️ **CRITICAL ARCHITECTURE (Sample App Pattern):**

**1. app/layout.tsx - Wrap with AppUserProvider:**
\`\`\`tsx
import { AppUserProvider } from './userAuth/AppUserContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
**Why**: AppUserProvider provides user context to all components including Velt auth.

**2. app/page.tsx (or root page) - VeltProvider with authProvider hook:**
\`\`\`tsx
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

const VELT_API_KEY = process.env.NEXT_PUBLIC_VELT_API_KEY!;

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
\`\`\`
**Why**: VeltProvider must be in page.tsx with authProvider from hook, NOT nested wrapper components.

**What to do:**
1. Add AppUserProvider wrapper to app/layout.tsx
2. Add VeltProvider to ${locationText} using useVeltAuthProvider hook
3. Import VeltCollaboration for feature components
4. Follow the markdown documentation for feature-specific implementation

⚠️ **CRITICAL: Position ALL Velt Components in User's Chosen Corner:**
All Velt feature components (presence, notifications, comments sidebar, etc.) should be placed in the SAME corner that the user specified. This creates a consistent, grouped UI.

**Position based on user's chosen corner:**
- **top-left**: \`fixed top-4 left-4\`
- **top-right**: \`fixed top-4 right-4\`
- **bottom-left**: \`fixed bottom-4 left-4\`
- **bottom-right**: \`fixed bottom-4 right-4\`

\`\`\`tsx
// VeltCollaboration.tsx - Place ALL Velt components in the chosen corner
export function VeltCollaboration({ documentId }: { documentId: string }) {
  return (
    <>
      {/* [Velt] ALL features grouped in user's chosen corner */}
      <div className="fixed [POSITION] z-50 flex flex-col gap-2">
        {/* Presence avatars */}
        <VeltPresence flockMode={false} maxUsers={5} />

        {/* Notifications bell */}
        <VeltNotificationsTool />

        {/* Comments sidebar trigger (if using comments) */}
        <VeltCommentsSidebar />
      </div>

      {/* Cursors render across the whole page */}
      <VeltCursor />

      {/* Comments tool for freestyle comments */}
      <VeltCommentTool />
    </>
  );
}
\`\`\`

**Replace [POSITION] with user's choice:**
- top-left → \`top-4 left-4\`
- top-right → \`top-4 right-4\`
- bottom-left → \`bottom-4 left-4\`
- bottom-right → \`bottom-4 right-4\`

**Why**: Grouping all Velt features in one corner creates a clean, consistent UI. Without positioned containers, Velt components create a white bar at the top of the page.

Also add to globals.css or VeltCustomization.css:
\`\`\`css
/* Remove default white background from Velt components */
velt-presence-container,
velt-presence-container *,
velt-notifications-tool-container,
velt-notifications-tool-container *,
velt-comments-sidebar-container,
velt-comments-sidebar-container * {
  background: transparent !important;
}
\`\`\`

**CRITICAL - For Tiptap/Lexical/Slate Comments:**
- ✅ **FIND EXISTING EDITOR** - Search the project for existing Tiptap/Lexical/Slate editor components
- ✅ **INTEGRATE INTO EXISTING EDITOR** - Add Velt comments to the existing editor, DO NOT create a new editor
- ✅ **USE BUBBLE MENU PATTERN** - Add comment button to bubble menu (appears on text selection), NOT a fixed toolbar
- ✅ Use ONLY the comment-specific package: @veltdev/tiptap-velt-comments, @veltdev/lexical-velt-comments, or @veltdev/slate-velt-comments
- ❌ DO NOT create a new editor component if one already exists
- ❌ DO NOT create a fixed toolbar with Bold/Italic/Comment buttons
- ❌ DO NOT use CRDT packages (@veltdev/tiptap-velt-collaboration or similar)
- ❌ DO NOT implement real-time collaborative editing - only comments on the editor

**Tiptap Pattern:**
\`\`\`tsx
import { BubbleMenu } from '@tiptap/react'
import { TiptapVeltComments, addComment, renderComments } from '@veltdev/tiptap-velt-comments'
import { useCommentAnnotations } from '@veltdev/react'

// Add to editor extensions: TiptapVeltComments
// Use BubbleMenu component with comment button
<BubbleMenu editor={editor}>
  <button onClick={() => addComment({ editor })}>💬 Comment</button>
</BubbleMenu>
\`\`\`

**Lexical Pattern:**
- Add VeltCommentsPlugin to editor plugins
- Use custom bubble menu that appears on selection
- Trigger addComment() from bubble menu button

**Slate Pattern:**
- Wrap editor with withVeltComments()
- Implement bubble menu with position tracking on selection
- Trigger addComment({ editor }) from bubble menu button

**If NO existing editor found:** Provide minimal integration example with bubble menu, but recommend user add to their existing editor.

**IMPORTANT:** All Velt-related files should remain in \`components/velt/\`. Do not create new Velt files outside this folder.

${hasCRDT && crdtEditorType ? `
**CRITICAL - For ${crdtEditorType.charAt(0).toUpperCase() + crdtEditorType.slice(1)} CRDT (Collaborative Real-Time Document Editing):**
${crdtEditorType === 'tiptap' ? `- ✅ **Required Packages:**
  - @veltdev/tiptap-crdt-react (exact version: 4.5.8)
  - @veltdev/tiptap-crdt (exact version: 4.5.8)
  - @tiptap/y-tiptap (for Yjs integration)
  - yjs (CRDT framework)
  - y-prosemirror (ProseMirror bindings for Yjs)

⚠️ **CRITICAL: ID MAPPING PATTERN (FireHydrant Pattern):**
- **documentId**: Set via VeltInitializeDocument - one per page/resource (e.g., \`retrospective-123\`)
- **editorId**: Unique per editor instance - use format \`\${documentId}/\${fieldId}\` (e.g., \`retrospective-123/question-456\`)
- **Why**: This allows multiple editors per document, each with independent CRDT state

⚠️ **CRITICAL STARTERKIT CONFIGURATION:**
- ❌ **WRONG**: \`StarterKit.configure({ history: false })\` - DO NOT USE "history"
- ✅ **CORRECT**: \`StarterKit.configure({ undoRedo: false })\`
- **Why**: StarterKit doesn't have a "history" option. Use "undoRedo" instead. CRDT handles undo/redo.

⚠️ **CRITICAL INITIAL CONTENT:**
- ❌ **WRONG**: \`content: initialContent\` in useEditor
- ✅ **CORRECT**: \`// content: initialContent\` (comment it out)
- **Why**: Let CRDT handle initial content loading. Seed from backend only when CRDT doc is empty.

⚠️ **CRITICAL AUTO-SAVE PATTERN (FireHydrant Pattern):**
- ✅ Use 2-second debounce to avoid excessive backend saves
- ✅ Detect remote syncs: check \`transaction.getMeta('y-sync$')\`, \`transaction.getMeta('remote')\`, \`transaction.getMeta('velt-sync')\`, \`transaction.getMeta('isRemote')\`
- ✅ Skip saving for remote syncs (these are changes from other users)
- ✅ Only save local changes to backend

⚠️ **CRITICAL BACKEND CONTENT SEEDING:**
- ✅ When CRDT doc is empty AND backend has content, seed once
- ✅ Use \`useServerConnectionStateChangeHandler()\` to check connection is 'online' before seeding
- ✅ Track seeding state with ref to avoid double-seeding

⚠️ **CRITICAL COMMENTS EXTENSION (if adding comments to CRDT editor):**
- ❌ **WRONG**: \`TiptapVeltComments.configure({ editorId, HTMLAttributes })\`
- ✅ **CORRECT**: \`TiptapVeltComments\` (no .configure())
- **Why**: The extension works without configuration

**Tiptap CRDT Pattern (PRODUCTION CODE - FireHydrant Pattern):**
\`\`\`tsx
import { useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useVeltTiptapCrdtExtension } from '@veltdev/tiptap-crdt-react';
import { useServerConnectionStateChangeHandler } from '@veltdev/react';

interface TipTapCollabEditorProps {
  documentId: string;  // From VeltInitializeDocument context
  fieldId: string;     // Unique field ID within document
  backendfallbackContent?: any;  // Backend content for seeding
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

  // [Velt] CRITICAL: Combine documentId and fieldId for unique editorId
  const editorId = \`\${documentId}/\${fieldId}\`;

  // [Velt] Format initial content for CRDT
  const veltInitialContent = useMemo(() => {
    if (!backendfallbackContent) return undefined;
    if (Array.isArray(backendfallbackContent)) {
      return { type: 'doc', content: backendfallbackContent };
    }
    return backendfallbackContent;
  }, [backendfallbackContent]);

  // [Velt] Initialize CRDT extension with unique editorId
  const { VeltCrdt, isLoading } = useVeltTiptapCrdtExtension({
    editorId,
    initialContent: veltInitialContent,
  });

  // [Velt] Monitor server connection state
  const serverConnectionState = useServerConnectionStateChangeHandler();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,  // CRITICAL: CRDT handles undo/redo
      }),
      ...(VeltCrdt ? [VeltCrdt] : []),
    ],
    // content: initialContent,  // CRITICAL: comment out - CRDT manages content
    immediatelyRender: false,
    onUpdate: ({ editor, transaction }) => {
      // [Velt] CRITICAL: Detect remote syncs - skip saving these
      const isRemoteSync =
        transaction.getMeta('y-sync$') ||
        transaction.getMeta('remote') ||
        transaction.getMeta('velt-sync') ||
        transaction.getMeta('isRemote');
      if (isRemoteSync) return;

      // [Velt] Debounced auto-save (2 seconds)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (transaction.docChanged && isEditorReadyRef.current) {
        saveTimeoutRef.current = setTimeout(() => {
          const content = editor.getJSON()?.content || [];
          onUpdate?.({ fieldId, value: content });
        }, 2000);
      }
    },
  }, [VeltCrdt]);

  // [Velt] Seed from backend when CRDT doc is empty
  useEffect(() => {
    if (
      editor && !isLoading &&
      serverConnectionState === 'online' &&
      !hasSeededContentRef.current &&
      isEditorEmpty(editor) &&
      hasBackendContent(backendfallbackContent)
    ) {
      hasSeededContentRef.current = true;
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

  if (isLoading) return <div>Loading...</div>;
  return <EditorContent editor={editor} />;
}

// Helper functions
const isEditorEmpty = (editor) => {
  const json = editor?.getJSON();
  if (!json?.content?.length) return true;
  if (json.content.length === 1 && json.content[0].type === 'paragraph' && !json.content[0].content?.length) return true;
  return false;
};
const hasBackendContent = (content) => content && !(Array.isArray(content) && content.length === 0);
\`\`\`
` : ''}${crdtEditorType === 'codemirror' ? `- ✅ Package: @veltdev/codemirror-crdt-react
- ✅ Hook: useVeltCodeMirrorCrdtExtension({ editorId, initialContent })
- ✅ Returns: { store, isLoading }
- ✅ Use store.getYText(), store.getAwareness(), store.getUndoManager()
- ✅ Requires y-codemirror.next package for yCollab

**CodeMirror CRDT Pattern:**
\`\`\`tsx
import { useVeltCodeMirrorCrdtExtension } from '@veltdev/codemirror-crdt-react'
import { yCollab } from 'y-codemirror.next'
import { EditorState } from '@codemirror/state'
import { EditorView } from 'codemirror'

const { store, isLoading } = useVeltCodeMirrorCrdtExtension({
  editorId: 'codemirror-editor-1',
  initialContent: yourInitialContent
})

// In useEffect:
const startState = EditorState.create({
  doc: store.getYText()?.toString() ?? '',
  extensions: [
    // ... other extensions
    yCollab(store.getYText()!, store.getAwareness(), {
      undoManager: store.getUndoManager()
    }),
  ],
})

const view = new EditorView({ state: startState, parent: editorRef.current })
\`\`\`
` : ''}${crdtEditorType === 'blocknote' ? `- ✅ Package: @veltdev/blocknote-crdt-react
- ✅ Hook: useVeltBlockNoteCrdtExtension({ editorId, initialContent })
- ✅ Returns: { collaborationConfig, isLoading }
- ✅ Pass collaborationConfig to useCreateBlockNote
- ✅ BlockNote handles CRDT automatically with the config

**BlockNote CRDT Pattern:**
\`\`\`tsx
import { useVeltBlockNoteCrdtExtension } from '@veltdev/blocknote-crdt-react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'

const { collaborationConfig, isLoading } = useVeltBlockNoteCrdtExtension({
  editorId: 'blocknote-editor-1',
  initialContent: JSON.stringify([{ type: "paragraph", content: "" }])
})

const editor = useCreateBlockNote({
  collaboration: collaborationConfig,
}, [collaborationConfig])

return <BlockNoteView editor={editor} />
\`\`\`
` : ''}
` : ''}
**Get implementation details from markdown docs:**
${hasComments ? `- Comments (${commentType}): ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}${implementation?.source ? ` (fetched from ${implementation.source})` : ''}\n` : ''}${hasPresence ? `- Presence: ${featureImplementations.presence?.mdUrl || getDocMarkdownUrl('presence')}${featureImplementations.presence?.source ? ` (fetched from ${featureImplementations.presence.source})` : ''}\n` : ''}${hasCursors ? `- Cursors: ${featureImplementations.cursors?.mdUrl || getDocMarkdownUrl('cursors')}${featureImplementations.cursors?.source ? ` (fetched from ${featureImplementations.cursors.source})` : ''}\n` : ''}${hasNotifications ? `- Notifications: ${featureImplementations.notifications?.mdUrl || getDocMarkdownUrl('notifications')}${featureImplementations.notifications?.source ? ` (fetched from ${featureImplementations.notifications.source})` : ''}\n` : ''}${hasRecorder ? `- Recorder: ${featureImplementations.recorder?.mdUrl || getDocMarkdownUrl('recorder')}${featureImplementations.recorder?.source ? ` (fetched from ${featureImplementations.recorder.source})` : ''}\n` : ''}${hasCRDT && crdtEditorType ? `- CRDT (${crdtEditorType}): ${crdtImplementation?.mdUrl || getDocMarkdownUrl('crdt', crdtEditorType)}${crdtImplementation?.source ? ` (fetched from ${crdtImplementation.source})` : ''}\n` : ''}`,
    codeExamples: [
      {
        description: `Correct pattern: VeltProvider in page.tsx with authProvider hook`,
        language: 'tsx',
        code: `// app/page.tsx (or your root page component)
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

const VELT_API_KEY = process.env.NEXT_PUBLIC_VELT_API_KEY!;

export default function Page() {
  const { authProvider } = useVeltAuthProvider();
  const { documentId } = useCurrentDocument();

  return (
    <VeltProvider apiKey={VELT_API_KEY} authProvider={authProvider}>
      <VeltCollaboration documentId={documentId} />
      {/* Your page content here */}
    </VeltProvider>
  );
}

// Get component implementations from markdown docs above`,
      },
    ],
  });

  // Step 3: Set up authentication and user identification with TODOs
  steps.push({
    title: `Add TODO comments to CLI-generated authentication files`,
    details: `The Velt CLI has generated authentication files in specific locations. Add TODO comments to these existing files (DO NOT create new files):

**1. User Hook: \`app/userAuth/useAppUser.tsx\`**
   - This file already exists from CLI
   - Add TODO: Connect to your existing authentication system
   - Add TODO: Replace mock user data with actual user from your auth provider
   - Examples: Next-auth useSession(), Clerk useUser(), Auth0, etc.

**2. Auth Provider: \`components/velt/VeltInitializeUser.tsx\`**
   - This file already exists from CLI (references useAppUser)
   - Contains \`useVeltAuthProvider\` hook
   - File location may vary, look for useVeltAuthProvider hook

**3. Document Hook: Check for \`app/document/useCurrentDocument.tsx\`**
   - May be in CLI-generated files or needs to be created
   - Add TODO: Implement document identification logic
   - Add TODO: Return unique document ID based on current page/route
   - Examples: router.query.id, pathname, page slug

**4. Token API: \`app/api/velt/token/route.ts\`**
   - This file already exists from CLI
   - Add TODO: Connect to your backend authentication
   - Add TODO: Validate user session before generating token

**IMPORTANT:** Only modify CLI-generated files. Do not create new files. Keep all Velt code in \`components/velt/\` and the specified locations.

**FOR TESTING PRESENCE/CURSORS:** Add logic to test with multiple users:
1. Hardcode a fixed document ID (e.g., "demo-document") so all tabs use the same document
2. Provide 2 hardcoded users (user-1 and user-2) with different names/avatars
3. Allow switching users via URL parameter (?user=1 or ?user=2) to test presence/cursors
4. Open multiple browser tabs with different user parameters to see live presence and cursors`,
    codeExamples: [
      {
        description: 'Example: Hardcoded document ID and multiple users for testing',
        language: 'typescript',
        code: `// In useCurrentDocument.tsx - Hardcode document ID for testing:
export function useCurrentDocument() {
  // [Velt] HARDCODED for testing presence/cursors
  // TODO: Replace with dynamic document ID based on your routing
  const documentId = "demo-document"; // Fixed ID so all tabs see same document

  return { documentId, documentName: "Demo Document" };
}

// In useAppUser.tsx - Multiple users for testing:
export function useAppUser() {
  // [Velt] HARDCODED USERS for testing presence/cursors
  // TODO: Replace with actual user from your auth provider

  // Get user from URL parameter (?user=1 or ?user=2)
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const userParam = searchParams?.get('user') || '1';

  const users = {
    '1': {
      userId: "user-1",
      name: "Demo User 1",
      email: "user1@example.com",
      photoUrl: "https://i.pravatar.cc/150?img=1",
      organizationId: "demo-org",
    },
    '2': {
      userId: "user-2",
      name: "Demo User 2",
      email: "user2@example.com",
      photoUrl: "https://i.pravatar.cc/150?img=2",
      organizationId: "demo-org",
    }
  };

  const user = users[userParam] || users['1'];

  return { user, isUserLoggedIn: true };
}

// TESTING INSTRUCTIONS:
// 1. Open http://localhost:3000?user=1 in one tab
// 2. Open http://localhost:3000?user=2 in another tab
// 3. You should see 2 different avatars in presence
// 4. Move mouse in one tab to see cursor in the other tab`,
      },
      {
        description: 'Example TODO comments to add',
        language: 'typescript',
        code: `// In useAppUser.tsx:
// TODO: Connect to your authentication system
// TODO: Replace this mock user data with actual user from your auth provider
// Example: const user = useAuth(); // Your auth hook
// Example: const user = useSession(); // Next-auth
// Example: const user = useUser(); // Clerk, Auth0, etc.

// In useCurrentDocument.tsx:
// TODO: Implement document identification logic
// TODO: Return a unique document ID based on your app's routing
// Example: Use route params, URL, page ID, etc.
// Example: const documentId = router.query.id;
// Example: const documentId = \`page-\${pathname}\`;

// In app/api/velt/auth/route.ts:
// TODO: SECURITY - Validate user session before generating token
// TODO: Connect to your backend authentication
// TODO: Verify user is authenticated and authorized

// If JWT generation is present:
// TODO: SECURITY - Replace 'your-secret-key' with actual secret
// TODO: Store secret in environment variables (process.env.JWT_SECRET)
// TODO: NEVER commit secrets to version control
// TODO: Implement token expiration (expiresIn: '24h')`,
      },
    ],
  });

  // Step 4: Implement JWT token generation (Production Pattern)
  steps.push({
    title: `Implement JWT token generation via Velt API (Production Pattern)`,
    details: `The CLI generates a placeholder JWT route. Replace it with the production pattern that calls Velt's token API.

**Production Pattern (FireHydrant Reference):**
Server-side API calls Velt's token endpoint to generate secure JWT tokens.

**Velt Token API:**
\`\`\`
POST https://api.velt.dev/v2/auth/token/get
Headers:
  x-velt-api-key: YOUR_VELT_PUBLIC_API_KEY
  x-velt-auth-token: YOUR_VELT_AUTH_TOKEN (keep secret!)
Body:
  { "data": { "userId": "...", "userProperties": { "organizationId": "...", "email": "..." } } }
Response:
  { "result": { "data": { "token": "eyJ..." } } }
\`\`\`

**Environment Variables to Set:**
\`\`\`
VELT_PUBLIC_API_KEY=your_api_key_here
VELT_AUTH_TOKEN=your_auth_token_here  # NEVER expose to client!
\`\`\`

**Security Requirements:**
- Keep VELT_AUTH_TOKEN server-side only (never expose to client)
- Validate user session before generating tokens
- The auth token should only be used in API routes, not client components`,
    codeExamples: [
      {
        description: 'Production API Route: app/api/velt/token/route.ts',
        language: 'typescript',
        code: `import { NextRequest, NextResponse } from 'next/server';

// [Velt] JWT Token Generation - Production Pattern
const VELT_API_KEY = process.env.VELT_PUBLIC_API_KEY;
const VELT_AUTH_TOKEN = process.env.VELT_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // [Velt] TODO: Add user session validation here
    // const session = await getServerSession(authOptions);
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
          userProperties: { organizationId: organizationId || 'default-org', email: email || '' },
        },
      }),
    });

    if (!response.ok) {
      console.error('[Velt] Token API error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }

    const json = await response.json();
    const token = json?.result?.data?.token;
    if (!token) {
      return NextResponse.json({ error: 'Invalid token response' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[Velt] Token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}`,
      },
      {
        description: 'Client-side auth provider with backend token fetch',
        language: 'typescript',
        code: `// In VeltInitializeUser.tsx - useVeltAuthProvider hook
export function useVeltAuthProvider() {
  const { user } = useAppUser();

  // [Velt] Token generation - calls backend API
  const generateToken = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/velt/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.userId,
        organizationId: user?.organizationId,
        email: user?.email,
      }),
    });
    if (!response.ok) throw new Error('Token fetch failed');
    const data = await response.json();
    return data.token;
  }, [user]);

  const authProvider: VeltAuthProvider | undefined = useMemo(() => {
    if (!user?.userId) return undefined;
    return {
      user: { userId: user.userId, name: user.name, email: user.email, organizationId: user.organizationId },
      generateToken,
      retryConfig: { retryCount: 3, retryDelay: 1000 },
    };
  }, [user, generateToken]);

  return { authProvider };
}`,
      },
    ],
  });

  // Step 5: Replace API key placeholders
  steps.push({
    title: `Replace API keys with actual values`,
    details: `Update all instances of "YOUR_VELT_API_KEY" and "YOUR_VELT_AUTH_TOKEN" with your actual values: ${apiKey}. Make sure to replace in VeltProvider configuration.`,
  });

  // Step 6: Test the installation
  const testInstructions = [];
  if (hasComments) testInstructions.push(`${commentType} comments: ${getTestInstructions(commentType)}`);
  if (hasPresence) testInstructions.push('Presence: Check that user avatars appear in the presence component');
  if (hasCursors) testInstructions.push('Cursors: Open in two browser windows and move your mouse to see cursors');
  if (hasNotifications) testInstructions.push('Notifications: Check the notification bell icon appears');
  if (hasRecorder) testInstructions.push('Recorder: Check the recorder controls appear');

  steps.push({
    title: `Test all requested features`,
    details: `Start your development server and test ONLY the features you requested:\n${testInstructions.map(t => `- ${t}`).join('\n')}\n\nDO NOT test or implement other features.`,
  });

  // Step 7: Check dev console for errors
  steps.push({
    title: `Check browser console for Velt errors/warnings`,
    details: `Open browser DevTools Console (Press F12 or Cmd+Option+I on Mac) and look for any Velt errors or warnings. Common errors include: "Please set document id to continue", "Velt API key not found", "Failed to authenticate user". If you find any errors, use the Velt Docs MCP to query for solutions.`,
  });

  // Additional information
  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**WHAT TO USE FROM CLI:**
- ✅ Authentication setup (user identification)
- ✅ Document setup (document context)
- ✅ API key configuration

**PRIMARY SOURCE: Agent Skills (installed via \`npx skills add velt-js/agent-skills\`):**
- ✅ **velt-setup-best-practices** — VeltProvider setup, auth, document identity, project structure
${hasComments ? `- ✅ **velt-comments-best-practices** — ${commentType} comments implementation patterns\n` : ''}${hasCRDT ? `- ✅ **velt-crdt-best-practices** — ${crdtEditorType || 'collaborative editing'} CRDT patterns\n` : ''}${hasNotifications ? `- ✅ **velt-notifications-best-practices** — notifications setup and customization\n` : ''}- Use skills as your FIRST reference for implementation details

**SECONDARY SOURCE: Docs URLs (for features without skills coverage):**
${hasPresence ? `- Presence: ${featureImplementations.presence?.mdUrl || getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `- Cursors: ${featureImplementations.cursors?.mdUrl || getDocMarkdownUrl('cursors')}\n` : ''}${hasRecorder ? `- Recorder: ${featureImplementations.recorder?.mdUrl || getDocMarkdownUrl('recorder')}\n` : ''}${!hasPresence && !hasCursors && !hasRecorder ? `- All selected features are covered by Agent Skills\n` : ''}
**TERTIARY SOURCE: Velt Docs MCP:**
- Only use for user follow-up questions AFTER implementation

**WHAT NOT TO IMPLEMENT:**
- ❌ VeltTools component (unless explicitly requested)
- ❌ ui-customization folder (unless user asks)
- ❌ Components user didn't request
- ❌ DO NOT copy code from CLI-generated files in components/velt/*`,
    },
    {
      title: 'Documentation References',
      content: `**Primary: Agent Skills (installed via \`npx skills add velt-js/agent-skills\`)**
- velt-setup-best-practices — setup, provider, auth, document
${hasComments ? `- velt-comments-best-practices — ${commentType} comments\n` : ''}${hasCRDT ? `- velt-crdt-best-practices — ${crdtEditorType || 'collaborative editing'}\n` : ''}${hasNotifications ? `- velt-notifications-best-practices — notifications\n` : ''}
**Secondary: Docs URLs (for features without skills)**
${hasPresence ? `- Presence: ${featureImplementations.presence?.mdUrl || getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `- Cursors: ${featureImplementations.cursors?.mdUrl || getDocMarkdownUrl('cursors')}\n` : ''}${hasRecorder ? `- Recorder: ${featureImplementations.recorder?.mdUrl || getDocMarkdownUrl('recorder')}\n` : ''}All Velt docs available as markdown at: https://docs.velt.dev/[feature]/[page].md
${hasCRDT && crdtImplementation?.data?.markdown ? `\n**CRDT Implementation Details (from ${crdtImplementation.source}):**\n${crdtImplementation.data.markdown.substring(0, 2000)}${crdtImplementation.data.markdown.length > 2000 ? '...\n\n[See full documentation at: ' + crdtImplementation.mdUrl + ']' : ''}\n` : ''}
**Tertiary: Velt Docs MCP**
After installation, query the Velt Docs MCP server for customization, troubleshooting, and advanced configuration. Do NOT use during initial implementation if skills cover the feature.`,
    },
  ];

  // Generate skills source section
  const skillsSection = formatSkillsSourceSection(features, { commentType, crdtEditorType });

  const basePlan = formatInstallationPlan({
    title: `Plan for Velt Installation: ${featureList.join(', ')}`,
    steps,
    additionalInfo,
  });

  // Insert skills section right after the title line
  const titleEnd = basePlan.indexOf('\n\n') + 2;
  return basePlan.slice(0, titleEnd) + skillsSection + basePlan.slice(titleEnd);
}

/**
 * Creates CLI-only installation report with TODO checklist
 *
 * Used when user types SKIP at feature selection.
 * Returns a checklist of what was created and what user needs to do.
 *
 * @param {Object} options
 * @param {Object} options.cliResult - Result from Velt CLI execution
 * @param {Object} options.qaResult - Basic QA validation results
 * @param {string} options.apiKey - API key (masked)
 * @param {string} [options.cliMethod] - CLI execution method ('linked' or 'direct')
 * @param {Object} [options.frameworkInfo] - Framework detection info
 * @returns {string} Markdown report
 */
export function createCliOnlyReport({ cliResult, qaResult, apiKey, cliMethod, frameworkInfo }) {
  const validationLines = qaResult.checks.map(c => {
    const icon = c.status === 'pass' ? '✅' : c.status === 'warning' ? '⚠️' : '❌';
    return `- ${icon} **${c.name}**: ${c.message}`;
  }).join('\n');

  // CLI execution method info
  const cliMethodInfo = cliMethod
    ? '**CLI Method:** npx @velt-js/add-velt'
    : '';

  // Framework info
  const frameworkInfoSection = frameworkInfo
    ? `**Framework:** ${frameworkInfo.projectType}${frameworkInfo.needsUseClient ? ' (with "use client" enforcement)' : ''}`
    : '';

  return `# ✅ Velt CLI Installation Complete (CLI-Only Mode)

${cliMethodInfo}
${frameworkInfoSection}

You chose **SKIP** - the Velt CLI scaffolding has been run without feature integration.
You can now wire up the features yourself, or re-run the installer without SKIP for guided setup.

---

## Files Created by Velt CLI

\`\`\`
components/velt/
├── VeltCollaboration.tsx       # Velt feature components (comments, presence, etc.)
├── VeltInitializeDocument.tsx  # Exports useCurrentDocument hook
└── VeltInitializeUser.tsx      # Exports useVeltAuthProvider hook

app/userAuth/
├── AppUserContext.tsx          # User context provider wrapper
└── useAppUser.tsx              # User data hook
\`\`\`

---

## Validation Results

${validationLines}

**Score:** ${qaResult.score} | **Status:** ${qaResult.status}

---

## 📋 TODO Checklist (You Need To Complete)

### 1. Verify @veltdev/react is installed

The CLI should have installed \`@veltdev/react\`. If not, run:
\`\`\`bash
npm install @veltdev/react
\`\`\`

### 2. Configure environment variables

Create or update \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_VELT_API_KEY=${apiKey}
\`\`\`

### 3. Set up app/layout.tsx with AppUserProvider

Wrap your app with AppUserProvider for user context:

\`\`\`tsx
// app/layout.tsx
import { AppUserProvider } from './userAuth/AppUserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppUserProvider>
          {children}
        </AppUserProvider>
      </body>
    </html>
  );
}
\`\`\`

### 4. Set up app/page.tsx with VeltProvider

Add VeltProvider to your root page using the authProvider hook:

\`\`\`tsx
// app/page.tsx
"use client";
import { VeltProvider } from '@veltdev/react';
import { useVeltAuthProvider } from '@/components/velt/VeltInitializeUser';
import { useCurrentDocument } from '@/components/velt/VeltInitializeDocument';
import { VeltCollaboration } from '@/components/velt/VeltCollaboration';

const VELT_API_KEY = process.env.NEXT_PUBLIC_VELT_API_KEY!;

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
\`\`\`

### 5. Configure user authentication

Edit \`app/userAuth/useAppUser.tsx\` to connect your auth:

\`\`\`tsx
// TODO: Replace hardcoded user with your auth provider
// Examples:
// - Next-Auth: const { data: session } = useSession();
// - Clerk: const { user } = useUser();
// - Auth0: const { user } = useAuth0();

const user = {
  userId: "your-user-id",       // Required: unique user ID
  name: "User Name",            // Required: display name
  email: "user@example.com",    // Required: email
  photoUrl: "https://...",      // Optional: avatar URL
  organizationId: "your-org",   // Optional: for multi-tenant apps
};
\`\`\`

### 6. Configure document identification

Edit \`components/velt/VeltInitializeDocument.tsx\` to set document ID in the useCurrentDocument hook:

\`\`\`tsx
// TODO: Replace with your document ID logic
// The document ID determines which users see each other's comments/cursors
// Examples:
// - Page-based: const documentId = pathname;
// - Route param: const documentId = params.id;
// - Custom: const documentId = getCurrentProjectId();

const documentId = "your-document-id";
\`\`\`

### 6. Add Velt feature components

Add specific features where needed in your app:

\`\`\`tsx
import { VeltComments, VeltPresence, VeltCursor } from '@veltdev/react';

// Comments - add where you want commenting
<VeltComments />

// Presence - shows online users
<VeltPresence />

// Cursors - shows live cursor positions
<VeltCursor />
\`\`\`

---

## 🔗 Documentation

- **Quick Start:** https://docs.velt.dev/get-started/quickstart
- **Authentication:** https://docs.velt.dev/get-started/quickstart#step-5-authenticate-users
- **Document Setup:** https://docs.velt.dev/get-started/quickstart#step-6-initialize-document
- **Comments:** https://docs.velt.dev/async-collaboration/comments/setup
- **Presence:** https://docs.velt.dev/realtime-collaboration/presence/setup
- **Cursors:** https://docs.velt.dev/realtime-collaboration/cursors/setup

---

## 🚀 Next Steps

**Option A: Manual Setup**
Follow the TODO checklist above to wire up Velt features yourself.

**Option B: Guided Setup**
Re-run the installer and select specific features (don't type SKIP):
\`\`\`
@velt-installer install
\`\`\`

The guided mode will:
- Generate a detailed implementation plan for your selected features
- Detect your project structure and recommend file placements
- Provide feature-specific code examples from Velt docs
- Apply changes only after your approval

---

## ⚠️ Common Issues

**"Velt API key not found"**
- Make sure \`NEXT_PUBLIC_VELT_API_KEY\` is in your \`.env.local\`
- Restart your dev server after adding environment variables

**"Please set document id to continue"**
- Ensure \`VeltInitializeDocument\` is properly configured with a document ID
- The document ID should be unique per collaborative context

**"Failed to authenticate user"**
- Check that your user data includes required fields: \`userId\`, \`name\`, \`email\`
- Verify the auth token is correct in your environment variables

---

*Generated by Velt MCP Installer (CLI-Only Mode)*
`;
}

export default {
  formatInstallationPlan,
  formatSkillsSourceSection,
  createVeltCommentsPlan,
  createMultiFeaturePlan,
  createCliOnlyReport,
};
