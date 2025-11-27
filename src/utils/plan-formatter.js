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
 * @returns {string} Formatted installation plan
 */
export function createVeltCommentsPlan(options) {
  const {
    commentType,
    implementation,
    detectedFiles = [],
    apiKey,
    headerPosition,
  } = options;

  const commentTypeTitle = commentType.charAt(0).toUpperCase() + commentType.slice(1);

  const steps = [];

  // Add warning about only implementing requested features
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${commentTypeTitle} Comments`,
    details: `You are ONLY installing ${commentTypeTitle} Comments. DO NOT implement: VeltNotificationsTool, VeltPresence, VeltCursor, VeltRecorder, or any other components unless the user specifically requested them. Only use authentication, user setup, and document setup from CLI. Get ${commentTypeTitle} Comments implementation from: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}`,
  });

  // Step 2: Add VeltProvider and VeltComments
  steps.push({
    title: `Add VeltProvider and VeltComments component`,
    details: `Fetch the implementation from ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}. Use the .md documentation as the source of truth for component implementation. DO NOT use CLI-generated component files. Import VeltProvider and VeltComments from @veltdev/react and add them to your root layout.`,
    codeExamples: [
      {
        description: 'Refer to documentation for exact implementation',
        language: 'tsx',
        code: `// Get implementation from: ${implementation.mdUrl || getDocMarkdownUrl('comments', commentType)}\n// Example structure:\nimport { VeltProvider, VeltComments } from '@veltdev/react'\n\n// Wrap your app with VeltProvider and add VeltComments`,
      },
    ],
  });

  // Step 3: Set up authentication and user identification
  steps.push({
    title: `Set up user authentication and identification`,
    details: `Use the CLI-generated authentication files for user setup. Reference the user authentication setup from the CLI output. You ONLY need to set up user identification - do not add any Velt components here.`,
  });

  // Step 4: Set up document context
  steps.push({
    title: `Set up document context`,
    details: `Use the CLI-generated document setup files to configure document identification. This is required for Velt to track comments per document/page.`,
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

  // Step 8: Check dev console for errors
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

  steps.push({
    title: `Add VeltProvider and Velt components`,
    details: `Import VeltProvider and ${componentsToAdd.join(', ')} from @veltdev/react and add them to your root layout. Use the .md documentation as the source of truth for component implementation. DO NOT use CLI-generated component files.`,
    codeExamples: [
      {
        description: 'Refer to documentation for exact implementation',
        language: 'tsx',
        code: `// Get implementations from:\n${hasComments ? `// Comments: ${implementation?.mdUrl || getDocMarkdownUrl('comments', commentType)}\n` : ''}${hasPresence ? `// Presence: ${getDocMarkdownUrl('presence')}\n` : ''}${hasCursors ? `// Cursors: ${getDocMarkdownUrl('cursors')}\n` : ''}${hasNotifications ? `// Notifications: ${getDocMarkdownUrl('notifications')}\n` : ''}${hasRecorder ? `// Recorder: ${getDocMarkdownUrl('recorder')}\n` : ''}\nimport { VeltProvider, ${componentsToAdd.join(', ')} } from '@veltdev/react'\n\n// Wrap your app with VeltProvider and add components`,
      },
    ],
  });

  // Step 3: Set up authentication and user identification
  steps.push({
    title: `Set up user authentication and identification`,
    details: `Use the CLI-generated authentication files for user setup. Reference the user authentication setup from the CLI output. You ONLY need to set up user identification - do not add any Velt components here.`,
  });

  // Step 4: Set up document context
  steps.push({
    title: `Set up document context`,
    details: `Use the CLI-generated document setup files to configure document identification. This is required for Velt to track ${hasComments ? 'comments' : 'data'} per document/page.`,
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
