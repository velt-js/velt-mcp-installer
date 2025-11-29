/**
 * Plan Formatter
 *
 * Formats installation instructions as a sequential plan (similar to Cursor's plan mode)
 * that the AI can follow to complete the implementation.
 */

import { getDocUrl, getDocMarkdownUrl } from './velt-docs-urls.js';

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
 * @returns {string} Formatted installation plan
 */
export function createVeltCommentsPlan(options) {
  const {
    commentType,
    implementation,
    detectedFiles = [],
    apiKey,
    headerPosition,
    veltProviderLocation = 'app/layout.tsx',
  } = options;

  const commentTypeTitle = commentType.charAt(0).toUpperCase() + commentType.slice(1);

  const steps = [];

  // Add warning about only implementing requested features
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${commentTypeTitle} Comments`,
    details: `You are ONLY installing ${commentTypeTitle} Comments. DO NOT implement: VeltNotificationsTool, VeltPresence, VeltCursor, VeltRecorder, or any other components unless the user specifically requested them. Only use authentication, user setup, and document setup from CLI. Get ${commentTypeTitle} Comments implementation from: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}`,
  });

  // Step 2: Use CLI-generated Velt components
  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate layout file (analyze the project structure to determine the best location)'
    : veltProviderLocation;

  steps.push({
    title: `Import and use CLI-generated Velt components in ${locationText}`,
    details: `The Velt CLI has generated the necessary component files in \`components/velt/\`. DO NOT create new files. Use the existing files:

**CLI-Generated Files (DO NOT MODIFY):**
- \`components/velt/VeltInitializeUser.tsx\` - Handles user authentication with VeltProvider
- \`components/velt/VeltInitializeDocument.tsx\` - Handles document context
- \`components/velt/VeltCollaboration.tsx\` - Main collaboration components wrapper
- \`app/userAuth/useAppUser.tsx\` - User data hook (add TODOs here)
- \`app/api/velt/token/route.ts\` - Token generation API (comment out JWT here)

**What to do:**
1. Import the CLI-generated components into ${locationText}
2. Wrap your app with these components
3. Follow the markdown documentation for ${commentType} comment-specific implementation: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}

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
        description: `Import CLI-generated components in ${locationText}`,
        language: 'tsx',
        code: `// Import CLI-generated Velt components
import { VeltInitializeUser } from '@/components/velt/VeltInitializeUser'
import { VeltInitializeDocument } from '@/components/velt/VeltInitializeDocument'
import { VeltCollaboration } from '@/components/velt/VeltCollaboration'

// Wrap your app:
<VeltInitializeUser>
  <VeltInitializeDocument>
    <VeltCollaboration>
      {children}
    </VeltCollaboration>
  </VeltInitializeDocument>
</VeltInitializeUser>

// For ${commentType} comments: Follow implementation at ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}`,
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

  // Step 4: Comment out JWT token generation (SECURITY)
  steps.push({
    title: `Comment out JWT token generation in auth provider (SECURITY)`,
    details: `Find the auth provider or token generation code (typically in a hook like \`useVeltAuthProvider\` or API route) and comment out the JWT token generation. Leave the structure visible with [Velt] comments for context.

**Why comment it out:**
- JWT token generation requires a secure secret key
- The CLI-generated code uses example/placeholder secrets
- Production apps should implement their own secure token generation
- Prevents accidentally deploying with insecure example secrets

**What to keep:**
- User data retrieval (\`useAppUser\` or similar)
- Auth provider object structure
- Retry configuration

**What to comment out:**
- \`generateToken\` function implementation
- Any JWT signing code
- Example secret keys

**Add clear [Velt] comments to explain:**
- What each part does
- Why token generation is commented out
- What the developer needs to implement`,
    codeExamples: [
      {
        description: 'Example: Comment out generateToken in auth provider hook',
        language: 'typescript',
        code: `export function useVeltAuthProvider() {
  // [Velt] Get your app's current authenticated user to authenticate with Velt.
  const { user } = useAppUser();

  // [Velt] Create auth provider object to pass to VeltProvider
  const authProvider: VeltAuthProvider | undefined = useMemo(() => {
    if (!user) return undefined;
    return {
      user,
      retryConfig: { retryCount: 3, retryDelay: 1000 },

      // [Velt] TODO: Implement secure token generation
      // SECURITY: The example token generation has been commented out because:
      // 1. It uses an example secret key that is NOT secure
      // 2. You should implement your own backend token generation
      // 3. Your backend should use a secure secret stored in environment variables
      //
      // To implement:
      // 1. Create a backend API endpoint that generates JWT tokens
      // 2. Use a secure secret key from environment variables
      // 3. Validate the user's session before generating tokens
      // 4. Set appropriate token expiration (e.g., 24 hours)
      //
      // Example implementation:
      // generateToken: async () => {
      //   return await getVeltJwtFromBackend({
      //     userId: user.userId as string,
      //     organizationId: user.organizationId as string,
      //     email: user.email,
      //   });
      // },
    };
  }, [user]);

  return { authProvider };
}`,
      },
      {
        description: 'Example: Comment out JWT generation in API route',
        language: 'typescript',
        code: `// app/api/velt/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // [Velt] TODO: Implement secure token generation
  // SECURITY: JWT generation has been commented out because:
  // 1. The example uses a hardcoded secret key
  // 2. There's no user session validation
  // 3. Production apps need proper authentication
  //
  // Before uncommenting and using this:
  // 1. Add user session validation
  // 2. Use secure secret from environment variables
  // 3. Implement token expiration
  // 4. Never expose your secret key in client code
  //
  // Example secure implementation:
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  //
  // const secret = process.env.JWT_SECRET;
  // if (!secret) {
  //   throw new Error('JWT_SECRET not configured');
  // }
  //
  // const token = jwt.sign(
  //   {
  //     userId: session.user.id,
  //     organizationId: session.user.orgId,
  //   },
  //   secret,
  //   { expiresIn: '24h' }
  // );
  //
  // return NextResponse.json({ token });

  return NextResponse.json({
    error: 'Token generation not implemented. See TODO comments above.'
  }, { status: 501 });
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

**WHAT TO GET FROM .MD DOCS:**
- ✅ VeltProvider implementation
- ✅ VeltComments component code
- ✅ All component patterns and examples

**WHAT NOT TO IMPLEMENT:**
- ❌ VeltTools component
- ❌ ui-customization folder (unless user asks)
- ❌ Components user didn't request
- ❌ DO NOT copy code from CLI-generated files in components/velt/*

**IMPLEMENTATION SOURCE:**
- Get component code from: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}
- NOT from CLI-generated component files`,
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
      content: `For more details, see: ${implementation.docUrl || getDocUrl('comments', commentType)}

**Markdown Documentation URLs:**
All Velt docs are available as markdown at:
- Pattern: https://docs.velt.dev/[feature]/[page].md
- This feature: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}

**Using Velt Docs MCP:**
After installation, query the Velt Docs MCP server to get answers about:
- Feature customization
- Troubleshooting
- Advanced configuration
- Integration patterns`,
    },
  ];

  return formatInstallationPlan({
    title: `Plan for Velt ${commentTypeTitle} Comments Installation`,
    steps,
    additionalInfo,
  });
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
 * @param {string[]} options.features - Features to install (comments, presence, cursors, notifications, recorder)
 * @param {string} options.commentType - Type of comments (if comments feature is included)
 * @param {Object} options.implementation - Implementation details from Velt Docs
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
    implementation,
    detectedFiles = [],
    apiKey,
    headerPosition,
    veltProviderLocation = 'app/layout.tsx',
  } = options;

  const steps = [];
  const hasComments = features.includes('comments');
  const hasPresence = features.includes('presence');
  const hasCursors = features.includes('cursors');
  const hasNotifications = features.includes('notifications');
  const hasRecorder = features.includes('recorder');

  const featureList = [];
  if (hasComments) featureList.push(`${commentType.charAt(0).toUpperCase() + commentType.slice(1)} Comments`);
  if (hasPresence) featureList.push('Presence');
  if (hasCursors) featureList.push('Cursors');
  if (hasNotifications) featureList.push('Notifications');
  if (hasRecorder) featureList.push('Recorder');

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

**CLI-Generated Files (DO NOT MODIFY):**
- \`components/velt/VeltInitializeUser.tsx\` - Handles user authentication with VeltProvider
- \`components/velt/VeltInitializeDocument.tsx\` - Handles document context
- \`components/velt/VeltCollaboration.tsx\` - Main collaboration components wrapper
- \`app/userAuth/useAppUser.tsx\` - User data hook (add TODOs here)
- \`app/api/velt/token/route.ts\` - Token generation API (comment out JWT here)

**What to do:**
1. Import the CLI-generated components into ${locationText}
2. Wrap your app with these components
3. Follow the markdown documentation for feature-specific implementation

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

**Get implementation details from markdown docs:**
${hasComments ? `- Comments (${commentType}): ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}\n` : ''}${hasPresence ? `- Presence: ${getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `- Cursors: ${getDocMarkdownUrl('cursors')}\n` : ''}${hasNotifications ? `- Notifications: ${getDocMarkdownUrl('notifications')}\n` : ''}${hasRecorder ? `- Recorder: ${getDocMarkdownUrl('recorder')}\n` : ''}`,
    codeExamples: [
      {
        description: `Import CLI-generated components in ${locationText}`,
        language: 'tsx',
        code: `// Import CLI-generated Velt components
import { VeltInitializeUser } from '@/components/velt/VeltInitializeUser'
import { VeltInitializeDocument } from '@/components/velt/VeltInitializeDocument'
import { VeltCollaboration } from '@/components/velt/VeltCollaboration'

// Wrap your app:
<VeltInitializeUser>
  <VeltInitializeDocument>
    <VeltCollaboration>
      {children}
    </VeltCollaboration>
  </VeltInitializeDocument>
</VeltInitializeUser>

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

  // Step 4: Comment out JWT token generation (SECURITY)
  steps.push({
    title: `Comment out JWT token generation in auth provider (SECURITY)`,
    details: `Find the auth provider or token generation code (typically in a hook like \`useVeltAuthProvider\` or API route) and comment out the JWT token generation. Leave the structure visible with [Velt] comments for context.

**Why comment it out:**
- JWT token generation requires a secure secret key
- The CLI-generated code uses example/placeholder secrets
- Production apps should implement their own secure token generation
- Prevents accidentally deploying with insecure example secrets

**What to keep:**
- User data retrieval (\`useAppUser\` or similar)
- Auth provider object structure
- Retry configuration

**What to comment out:**
- \`generateToken\` function implementation
- Any JWT signing code
- Example secret keys

**Add clear [Velt] comments to explain:**
- What each part does
- Why token generation is commented out
- What the developer needs to implement`,
    codeExamples: [
      {
        description: 'Example: Comment out generateToken in auth provider hook',
        language: 'typescript',
        code: `export function useVeltAuthProvider() {
  // [Velt] Get your app's current authenticated user to authenticate with Velt.
  const { user } = useAppUser();

  // [Velt] Create auth provider object to pass to VeltProvider
  const authProvider: VeltAuthProvider | undefined = useMemo(() => {
    if (!user) return undefined;
    return {
      user,
      retryConfig: { retryCount: 3, retryDelay: 1000 },

      // [Velt] TODO: Implement secure token generation
      // SECURITY: The example token generation has been commented out because:
      // 1. It uses an example secret key that is NOT secure
      // 2. You should implement your own backend token generation
      // 3. Your backend should use a secure secret stored in environment variables
      //
      // To implement:
      // 1. Create a backend API endpoint that generates JWT tokens
      // 2. Use a secure secret key from environment variables
      // 3. Validate the user's session before generating tokens
      // 4. Set appropriate token expiration (e.g., 24 hours)
      //
      // Example implementation:
      // generateToken: async () => {
      //   return await getVeltJwtFromBackend({
      //     userId: user.userId as string,
      //     organizationId: user.organizationId as string,
      //     email: user.email,
      //   });
      // },
    };
  }, [user]);

  return { authProvider };
}`,
      },
      {
        description: 'Example: Comment out JWT generation in API route',
        language: 'typescript',
        code: `// app/api/velt/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // [Velt] TODO: Implement secure token generation
  // SECURITY: JWT generation has been commented out because:
  // 1. The example uses a hardcoded secret key
  // 2. There's no user session validation
  // 3. Production apps need proper authentication
  //
  // Before uncommenting and using this:
  // 1. Add user session validation
  // 2. Use secure secret from environment variables
  // 3. Implement token expiration
  // 4. Never expose your secret key in client code
  //
  // Example secure implementation:
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  //
  // const secret = process.env.JWT_SECRET;
  // if (!secret) {
  //   throw new Error('JWT_SECRET not configured');
  // }
  //
  // const token = jwt.sign(
  //   {
  //     userId: session.user.id,
  //     organizationId: session.user.orgId,
  //   },
  //   secret,
  //   { expiresIn: '24h' }
  // );
  //
  // return NextResponse.json({ token });

  return NextResponse.json({
    error: 'Token generation not implemented. See TODO comments above.'
  }, { status: 501 });
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

**WHAT TO GET FROM .MD DOCS:**
- ✅ VeltProvider implementation
- ✅ All component code (${componentsToAdd.join(', ')})
- ✅ All component patterns and examples

**WHAT NOT TO IMPLEMENT:**
- ❌ VeltTools component (unless explicitly requested)
- ❌ ui-customization folder (unless user asks)
- ❌ Components user didn't request
- ❌ DO NOT copy code from CLI-generated files in components/velt/*

**IMPLEMENTATION SOURCES:**
${hasComments ? `- Comments: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}\n` : ''}${hasPresence ? `- Presence: ${getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `- Cursors: ${getDocMarkdownUrl('cursors')}\n` : ''}${hasNotifications ? `- Notifications: ${getDocMarkdownUrl('notifications')}\n` : ''}${hasRecorder ? `- Recorder: ${getDocMarkdownUrl('recorder')}\n` : ''}`,
    },
    {
      title: 'Documentation References',
      content: `**Markdown Documentation URLs:**
All Velt docs are available as markdown at: https://docs.velt.dev/[feature]/[page].md

**Features you're installing:**
${hasComments ? `- Comments (${commentType}): ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}\n` : ''}${hasPresence ? `- Presence: ${getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `- Cursors: ${getDocMarkdownUrl('cursors')}\n` : ''}${hasNotifications ? `- Notifications: ${getDocMarkdownUrl('notifications')}\n` : ''}${hasRecorder ? `- Recorder: ${getDocMarkdownUrl('recorder')}\n` : ''}
**Using Velt Docs MCP:**
After installation, query the Velt Docs MCP server for customization, troubleshooting, and advanced configuration.`,
    },
  ];

  return formatInstallationPlan({
    title: `Plan for Velt Installation: ${featureList.join(', ')}`,
    steps,
    additionalInfo,
  });
}

export default {
  formatInstallationPlan,
  createVeltCommentsPlan,
  createMultiFeaturePlan,
};
