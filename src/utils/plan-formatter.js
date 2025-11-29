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

  // Step 2: Add VeltProvider and VeltComments
  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate layout file (analyze the project structure to determine the best location)'
    : veltProviderLocation;

  steps.push({
    title: `Add VeltProvider and VeltComments component to ${locationText}`,
    details: `Fetch the implementation from ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}. Use the .md documentation as the source of truth for component implementation. DO NOT use CLI-generated component files. Import VeltProvider and VeltComments from @veltdev/react and add them to ${locationText}.`,
    codeExamples: [
      {
        description: `Install in ${locationText}`,
        language: 'tsx',
        code: `// Get implementation from: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}\n// Install VeltProvider in: ${locationText}\n// Example structure:\nimport { VeltProvider, VeltComments } from '@veltdev/react'\n\n// Wrap your app with VeltProvider and add VeltComments`,
      },
    ],
  });

  // Step 3: Set up authentication and user identification with TODOs
  steps.push({
    title: `Set up user authentication and identification (with TODO comments)`,
    details: `The Velt CLI has generated template files for authentication. You need to add TODO comments to guide the client on implementing their own logic:

**1. User Identification Hook (useAppUser.tsx):**
   - File: Look for the user authentication hook (e.g., \`app/userAuth/useAppUser.tsx\` or similar)
   - Add TODO: Connect to your existing authentication system
   - Add TODO: Return actual user data from your auth provider

**2. Document Context Hook (useCurrentDocument.tsx):**
   - File: Look for the document hook (e.g., \`app/document/useCurrentDocument.tsx\` or similar)
   - Add TODO: Implement document identification logic
   - Add TODO: Return unique document ID based on current page/route

**3. Auth Token API Route (app/api/velt/auth/route.ts):**
   - File: Look for the Velt auth API route
   - Add TODO: Connect to your backend authentication
   - Add TODO: Validate user session/token before generating Velt token

**4. JWT Token Generator (if present):**
   - Add TODO: SECURITY - Replace example secret with your actual secret key
   - Add TODO: Use environment variables for secrets (never hardcode)
   - Add TODO: Implement proper token expiration and refresh logic

Add these TODO comments with clear explanations so the client knows exactly what to implement.`,
    codeExamples: [
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

  // Step 4: Replace API key placeholders
  steps.push({
    title: `Replace API key with actual value`,
    details: `Update all instances of "YOUR_VELT_API_KEY" and "YOUR_VELT_AUTH_TOKEN" with your actual values: ${apiKey}. Make sure to replace in VeltProvider configuration.`,
  });

  // Step 5: Test the installation
  steps.push({
    title: `Test the ${commentTypeTitle} comments functionality`,
    details: `Start your development server and test ONLY the ${commentType} comments feature. ${getTestInstructions(commentType)} DO NOT test or implement other features.`,
  });

  // Step 6: Check dev console for errors
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
    title: `Add VeltProvider and Velt components to ${locationText}`,
    details: `Import VeltProvider and ${componentsToAdd.join(', ')} from @veltdev/react and add them to ${locationText}. Use the .md documentation as the source of truth for component implementation. DO NOT use CLI-generated component files.`,
    codeExamples: [
      {
        description: `Install in ${locationText}`,
        language: 'tsx',
        code: `// Get implementations from:\n${hasComments ? `// Comments: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}\n` : ''}${hasPresence ? `// Presence: ${getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `// Cursors: ${getDocMarkdownUrl('cursors')}\n` : ''}${hasNotifications ? `// Notifications: ${getDocMarkdownUrl('notifications')}\n` : ''}${hasRecorder ? `// Recorder: ${getDocMarkdownUrl('recorder')}\n` : ''}\n// Install VeltProvider in: ${locationText}\nimport { VeltProvider, ${componentsToAdd.join(', ')} } from '@veltdev/react'\n\n// Wrap your app with VeltProvider and add components`,
      },
    ],
  });

  // Step 3: Set up authentication and user identification with TODOs
  steps.push({
    title: `Set up user authentication and identification (with TODO comments)`,
    details: `The Velt CLI has generated template files for authentication. You need to add TODO comments to guide the client on implementing their own logic:

**1. User Identification Hook (useAppUser.tsx):**
   - File: Look for the user authentication hook (e.g., \`app/userAuth/useAppUser.tsx\` or similar)
   - Add TODO: Connect to your existing authentication system
   - Add TODO: Return actual user data from your auth provider

**2. Document Context Hook (useCurrentDocument.tsx):**
   - File: Look for the document hook (e.g., \`app/document/useCurrentDocument.tsx\` or similar)
   - Add TODO: Implement document identification logic
   - Add TODO: Return unique document ID based on current page/route

**3. Auth Token API Route (app/api/velt/auth/route.ts):**
   - File: Look for the Velt auth API route
   - Add TODO: Connect to your backend authentication
   - Add TODO: Validate user session/token before generating Velt token

**4. JWT Token Generator (if present):**
   - Add TODO: SECURITY - Replace example secret with your actual secret key
   - Add TODO: Use environment variables for secrets (never hardcode)
   - Add TODO: Implement proper token expiration and refresh logic

Add these TODO comments with clear explanations so the client knows exactly what to implement.`,
    codeExamples: [
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

  // Step 4: Replace API key placeholders
  steps.push({
    title: `Replace API keys with actual values`,
    details: `Update all instances of "YOUR_VELT_API_KEY" and "YOUR_VELT_AUTH_TOKEN" with your actual values: ${apiKey}. Make sure to replace in VeltProvider configuration.`,
  });

  // Step 5: Test the installation
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

  // Step 6: Check dev console for errors
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
