/**
 * Plan Formatter
 *
 * Formats installation instructions as a sequential plan that the AI follows.
 *
 * ARCHITECTURE: This formatter generates ORCHESTRATION steps only.
 * Implementation details (code patterns, CSS, configuration) live in agent-skills.
 * The plan tells the AI WHAT to do and WHICH skill rule to follow for HOW.
 */

import { getDocUrl, getDocMarkdownUrl } from './velt-docs-urls.js';
import { getSkillReferences } from './velt-docs-fetcher.js';

/**
 * Generates a "Skills & Sources" section for the plan output.
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
    const seen = new Set();
    for (const ref of skillRefs) {
      if (!seen.has(ref.skillName)) {
        seen.add(ref.skillName);
        const feats = skillRefs.filter(r => r.skillName === ref.skillName).map(r => r.feature);
        section += `- **${ref.skillName}** — covers: ${feats.join(', ')}${ref.description ? ` (${ref.description})` : ''}\n`;
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
 * Formats a plan with numbered steps, details, and a to-do checklist.
 */
export function formatInstallationPlan(options) {
  const { title, steps, additionalInfo = [] } = options;

  let plan = `# ${title}\n\n`;

  steps.forEach((step, index) => {
    const stepNumber = index + 1;
    plan += `## ${stepNumber}. ${step.title}\n`;
    plan += `*   **Details:** ${step.details}\n`;

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

  if (additionalInfo.length > 0) {
    additionalInfo.forEach((info) => {
      plan += `## ${info.title}\n`;
      plan += `${info.content}\n\n`;
    });
  }

  plan += `## To-Do List\n`;
  steps.forEach((step, index) => {
    const checkbox = index === 0 ? '[✓]' : '[ ]';
    plan += `- ${checkbox} ${step.title}\n`;
  });

  plan += '\n';
  return plan;
}

/**
 * Gets test instructions for a comment type.
 */
function getTestInstructions(commentType) {
  const instructions = {
    freestyle: 'Click the Comment Tool button, then click anywhere on the page to add a comment.',
    popover: 'Click the Comment Tool button next to an element to attach a comment to it.',
    page: 'Open the Comments Sidebar and add a page-level comment at the bottom.',
    stream: 'Select text to see comments appear in the stream column on the right.',
    text: 'Highlight any text to see the Comment Tool button appear, then click it to add a comment.',
    inline: 'Navigate to your content area and test adding inline comments.',
    tiptap: 'Open your Tiptap editor, select text, and use the comment button in the bubble menu.',
    lexical: 'Open your Lexical editor, select text, and add comments using the Velt comment integration.',
    slate: 'Open your Slate.js editor, select text, and add comments using the Velt comment integration.',
  };
  return instructions[commentType] || 'Test adding comments in your application.';
}

/**
 * Creates a plan for Velt Comments installation (single-feature).
 *
 * @param {Object} options - Installation options
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
    frameworkInfo,
    wiring,
  } = options;

  const commentTypeTitle = commentType.charAt(0).toUpperCase() + commentType.slice(1);
  const steps = [];

  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate layout file'
    : veltProviderLocation;

  // Step 1: Scope warning
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${commentTypeTitle} Comments`,
    details: `You are ONLY installing ${commentTypeTitle} Comments. DO NOT implement other components unless requested.`,
  });

  // Step 2: Wire VeltProvider + CLI components
  steps.push({
    title: `Wire VeltProvider and CLI-generated components in ${locationText}`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → provider-wiring rules

Use the CLI-generated files in \`components/velt/\`. Wire them following the skill patterns:
- Import \`useVeltAuthProvider\` from \`components/velt/VeltInitializeUser.tsx\`
- Import \`VeltCollaboration\` from \`components/velt/VeltCollaboration.tsx\`
- Wrap your page content with \`<VeltProvider apiKey={...} authProvider={authProvider}>\`
- Place \`<VeltCollaboration />\` inside the VeltProvider
- The page file MUST have \`"use client"\` directive (Next.js)
- VeltProvider goes in \`${locationText}\`, NOT in layout.tsx (layout.tsx exports metadata, which is server-only)

**IMPORTANT:** Do NOT create new Velt files. Use the CLI-generated files in \`components/velt/\`.`,
  });

  // Step 3: Configure authentication
  steps.push({
    title: `Set up authentication and JWT token generation`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → identity-jwt-generation, identity-user-object-shape rules

Follow the skill patterns to:
- Configure \`app/api/velt/token/route.ts\` for server-side JWT generation
- Set up user identification with required fields (userId, name, email, organizationId)
- Ensure auth token is server-only (VELT_AUTH_TOKEN in .env.local, NOT in client bundle)`,
  });

  // Step 4: Configure .env.local
  steps.push({
    title: `Set up environment variables`,
    details: `Create or update \`.env.local\` with your Velt credentials (API key: ${apiKey}).
Required variables: NEXT_PUBLIC_VELT_API_KEY, VELT_API_KEY, VELT_AUTH_TOKEN.`,
  });

  // Step 5: Set up two-user testing
  steps.push({
    title: `Set up two-user testing`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → debug-multi-user-testing rule

The app MUST support testing with two different users. Follow the skill pattern:
- Provide sign-in buttons for both Alice and Bob
- Do NOT auto-login with a default user — let the sign-in page render
- Support \`?user=user-1\` and \`?user=user-2\` URL params for quick switching`,
  });

  // Step 6: Clear .next cache
  steps.push({
    title: `Clear .next build cache before first run`,
    details: `Run \`rm -rf .next\` before starting the dev server. This prevents stale cache issues after changing imports.`,
  });

  // Step 7: Test
  steps.push({
    title: `Test the ${commentTypeTitle} comments functionality`,
    details: `Start your development server and test. ${getTestInstructions(commentType)} DO NOT test or implement other features.`,
  });

  // Step 8: Check console
  steps.push({
    title: `Check browser console for Velt errors/warnings`,
    details: `Open browser DevTools Console and look for Velt errors. Common: "Please set document id", "Velt API key not found", "Failed to authenticate user". If errors occur, consult \`velt-setup-best-practices\` → debug-common-issues rule.`,
  });

  // Additional info
  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**Source priority:** Agent Skills > Embedded Rules > Docs URLs
- ✅ **velt-setup-best-practices** — VeltProvider, auth, document identity, project structure
- ✅ **velt-comments-best-practices** — ${commentType} comments implementation patterns
- Do NOT reimplement patterns from scratch — follow the skill rules exactly`,
    },
  ];

  // Format and add skills section
  const plan = formatInstallationPlan({
    title: `Plan for Velt ${commentTypeTitle} Comments Installation`,
    steps,
    additionalInfo,
  });

  const skillsSection = formatSkillsSourceSection(['comments'], { commentType });
  return plan + '\n' + skillsSection;
}


/**
 * Creates a comprehensive plan for multiple Velt features.
 *
 * @param {Object} options - Installation options
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
    frameworkInfo,
    wiring,
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

  const locationText = veltProviderLocation === 'auto-detect'
    ? 'the appropriate page file'
    : veltProviderLocation;

  // Step 1: Scope warning
  steps.push({
    title: `⚠️ CRITICAL: Only implement ${featureList.join(', ')}`,
    details: `You are ONLY installing: ${featureList.join(', ')}. DO NOT implement any other components unless the user specifically requested them.`,
  });

  // Step 2: Wire VeltProvider + CLI components
  steps.push({
    title: `Wire VeltProvider and CLI-generated components in ${locationText}`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → provider-wiring, identity rules

Use the CLI-generated files in \`components/velt/\`. Wire them following the skill patterns:
- Import \`useVeltAuthProvider\` from \`components/velt/VeltInitializeUser.tsx\`
- Import \`VeltCollaboration\` from \`components/velt/VeltCollaboration.tsx\`
- Wrap your page content with \`<VeltProvider apiKey={...} authProvider={authProvider}>\`
- Place \`<VeltCollaboration />\` inside the VeltProvider
- The page file MUST have \`"use client"\` directive (Next.js)
- VeltProvider goes in \`${locationText}\`, NOT in layout.tsx (layout.tsx exports metadata)
- Position Velt UI components (presence, notifications, sidebar) in the ${headerPosition} corner

**IMPORTANT:** Do NOT create new Velt files. Use the CLI-generated files in \`components/velt/\`.`,
  });

  // Step 3: CRDT editor setup (conditional)
  if (hasCRDT && crdtEditorType) {
    const editorName = crdtEditorType.charAt(0).toUpperCase() + crdtEditorType.slice(1);

    let skillRules = '';
    let requirements = '';

    if (crdtEditorType === 'tiptap') {
      skillRules = 'tiptap-setup-react, tiptap-editor-id, tiptap-disable-history, tiptap-initial-content';
      requirements = `- Use \`useVeltTiptapCrdtExtension\` hook with editorId = \`\${documentId}/\${fieldId}\`
- Disable \`undoRedo\` in StarterKit (NOT \`history\` — StarterKit has no "history" option)
- Use HTML strings for initialContent, NOT JSON objects (see tiptap-initial-content rule)
- Set \`immediatelyRender: false\` in useEditor options
- CRDT extension should be LAST in the extensions array`;
    } else if (crdtEditorType === 'codemirror') {
      skillRules = 'codemirror-setup-react, codemirror-ycollab, codemirror-editor-id';
      requirements = `- Use \`useVeltCodeMirrorCrdtExtension\` hook
- Wire yCollab extension with store.getYText() and store.getAwareness()
- Use store.getUndoManager() for undo/redo`;
    } else if (crdtEditorType === 'blocknote') {
      skillRules = 'blocknote-setup-react, blocknote-editor-id';
      requirements = `- Use \`useVeltBlockNoteCrdtExtension\` hook
- Pass collaborationConfig to useCreateBlockNote
- BlockNote handles CRDT automatically with the config`;
    }

    steps.push({
      title: `Create ${editorName} CRDT editor component`,
      details: `**Skill reference:** \`velt-crdt-best-practices\` → ${skillRules}

Create \`components/velt/${editorName}CollabEditor.tsx\` following the skill patterns.

Requirements:
${requirements}`,
    });
  }

  // Step 4: Comments integration with editor (conditional)
  if (hasComments && hasCRDT && crdtEditorType) {
    steps.push({
      title: `MANDATORY: Integrate TiptapVeltComments extension in editor`,
      details: `**Skill reference:** \`velt-crdt-best-practices\` → tiptap-comments-integration rule

⚠️ WITHOUT THIS, THE APP WILL FREEZE WHEN COMMENTS ARE TRIGGERED.

The global \`<VeltComments>\` component is necessary but NOT sufficient for editor comments.
You MUST also:
- Add \`TiptapVeltComments\` to the editor's extensions array (BEFORE the CRDT extension)
- Import and call \`highlightComments(editor, commentAnnotations)\` in a useEffect (v4 API)
- Import and use \`triggerAddComment(editor)\` for the comment button (v4 API)
- Import \`useCommentAnnotations\` from \`@veltdev/react\` to subscribe to comment data

Check your installed package version — v4 uses \`triggerAddComment\`/\`highlightComments\`, v5 uses \`addComment\`/\`renderComments\`.`,
    });
  }

  // Step 5: SSR safety (conditional, Next.js + Tiptap)
  if (hasCRDT && crdtEditorType === 'tiptap') {
    steps.push({
      title: `MANDATORY: Load editor with next/dynamic (SSR safety)`,
      details: `**Skill reference:** \`velt-crdt-best-practices\` → tiptap-nextjs-ssr rule

Tiptap and @veltdev/tiptap-velt-comments use browser-only APIs. In Next.js, the editor component MUST be loaded with \`next/dynamic\` and \`ssr: false\` in the page that renders it. Without this, the app will crash with a \`g.catch is not a function\` error.

In your page file, use \`dynamic(() => import(...), { ssr: false })\` — do NOT import the editor component directly.`,
    });
  }

  // Step 6: Cursor CSS (conditional)
  if (hasCRDT && crdtEditorType === 'tiptap') {
    steps.push({
      title: `MANDATORY: Add collaboration cursor CSS to globals.css`,
      details: `**Skill reference:** \`velt-crdt-best-practices\` → tiptap-cursor-css rule

Without this CSS, remote user cursors appear as thick full-width blocks instead of thin carets.

Follow the skill rule exactly — it targets BOTH:
- \`.ProseMirror-yjs-cursor\` classes (from y-prosemirror, used by Velt CRDT)
- \`.collaboration-cursor__caret\` classes (from @tiptap/extension-collaboration-cursor)

Critical: the \`> span { display: inline !important }\` rule is required to prevent block-level rendering.`,
    });
  }

  // Step 7: Authentication setup
  steps.push({
    title: `Set up authentication and JWT token generation`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → identity-jwt-generation, identity-user-object-shape rules

Follow the skill patterns to:
- Configure \`app/api/velt/token/route.ts\` for server-side JWT generation
- Set up user identification with required fields (userId, name, email, organizationId)
- Ensure auth token is server-only (VELT_AUTH_TOKEN in .env.local, NOT in client bundle)`,
  });

  // Step 8: Environment variables
  steps.push({
    title: `Set up environment variables`,
    details: `Create or update \`.env.local\` with your Velt credentials (API key: ${apiKey}).
Required variables: NEXT_PUBLIC_VELT_API_KEY, VELT_API_KEY, VELT_AUTH_TOKEN.`,
  });

  // Step 9: Two-user testing
  steps.push({
    title: `Set up two-user testing`,
    details: `**Skill reference:** \`velt-setup-best-practices\` → debug-multi-user-testing rule

The app MUST support testing with two different users. Follow the skill pattern:
- Provide sign-in buttons for both Alice and Bob
- Do NOT auto-login with a default user — if the scaffolding has \`params.get("user") || "user-1"\`, remove the \`|| "user-1"\` default
- Support \`?user=user-1\` and \`?user=user-2\` URL params for quick switching`,
  });

  // Step 10: Clear .next cache
  steps.push({
    title: `Clear .next build cache before first run`,
    details: `Run \`rm -rf .next\` before starting the dev server. This prevents stale cache issues, especially after changing SSR patterns (adding \`next/dynamic\`).`,
  });

  // Step 11: Test
  const testInstructions = [];
  if (hasComments) testInstructions.push(`${commentType} comments: ${getTestInstructions(commentType)}`);
  if (hasPresence) testInstructions.push('Presence: Check that user avatars appear in the presence component');
  if (hasCursors) testInstructions.push('Cursors: Open in two browser windows and verify thin caret cursors with name labels');
  if (hasNotifications) testInstructions.push('Notifications: Check the notification bell icon appears');
  if (hasRecorder) testInstructions.push('Recorder: Check the recorder controls appear');

  steps.push({
    title: `Test all requested features`,
    details: `Start your development server and test:\n${testInstructions.map(t => `- ${t}`).join('\n')}\n\nDO NOT test or implement other features.`,
  });

  // Step 12: Check console
  steps.push({
    title: `Check browser console for Velt errors/warnings`,
    details: `Open browser DevTools Console and look for Velt errors. Common: "Please set document id", "Velt API key not found", "Failed to authenticate user". If errors occur, consult \`velt-setup-best-practices\` → debug-common-issues rule.`,
  });

  // Additional info
  const skillsList = [];
  skillsList.push('- ✅ **velt-setup-best-practices** — VeltProvider, auth, document identity, project structure');
  if (hasComments) skillsList.push(`- ✅ **velt-comments-best-practices** — ${commentType} comments implementation patterns`);
  if (hasCRDT) skillsList.push(`- ✅ **velt-crdt-best-practices** — ${crdtEditorType || 'collaborative editing'} CRDT patterns`);
  if (hasNotifications) skillsList.push('- ✅ **velt-notifications-best-practices** — notifications setup and customization');

  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**Source priority:** Agent Skills > Embedded Rules > Docs URLs

${skillsList.join('\n')}

- Do NOT reimplement patterns from scratch — follow the skill rules exactly
- If a skill rule and this plan conflict, the skill rule is correct
- Do NOT create files outside \`components/velt/\` unless necessary for app-specific wiring`,
    },
  ];

  // Format and add skills section
  const plan = formatInstallationPlan({
    title: `Plan for Velt ${featureList.join(' + ')} Installation`,
    steps,
    additionalInfo,
  });

  const skillsSection = formatSkillsSourceSection(features, { commentType, crdtEditorType });
  return plan + '\n' + skillsSection;
}


/**
 * Creates a CLI-only installation report (SKIP mode).
 */
export function createCliOnlyReport({ cliResult, qaResult, apiKey, cliMethod, frameworkInfo }) {
  const validationLines = qaResult.checks.map(c => {
    const icon = c.status === 'pass' ? '✅' : c.status === 'warning' ? '⚠️' : '❌';
    return `- ${icon} **${c.name}**: ${c.message}`;
  }).join('\n');

  const cliMethodInfo = cliMethod ? '**CLI Method:** npx @velt-js/add-velt' : '';

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

## 📋 Next Steps

**Skill reference:** Install agent-skills via \`npx skills add velt-js/agent-skills\`, then follow:
- \`velt-setup-best-practices\` — for VeltProvider wiring, auth, document setup
- \`velt-comments-best-practices\` — for comments integration
- \`velt-crdt-best-practices\` — for CRDT/collaborative editing
- \`velt-notifications-best-practices\` — for notifications

Or re-run the installer with specific features (don't type SKIP) for guided setup.

---

## ⚠️ Common Issues

Consult \`velt-setup-best-practices\` → debug-common-issues rule for:
- "Velt API key not found" — check .env.local
- "Please set document id" — check VeltInitializeDocument
- "Failed to authenticate user" — check user object fields

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
