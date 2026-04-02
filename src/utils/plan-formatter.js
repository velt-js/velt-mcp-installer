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
import { getSkillReferences, getSkillRulePaths, SKILL_RULE_PATHS } from './velt-docs-fetcher.js';

/**
 * Generates a prerequisite check section that tells the AI to verify skills exist.
 */
function formatPrerequisiteCheck(features) {
  const requiredSkills = new Set(['velt-setup-best-practices']);
  for (const feature of features) {
    const paths = SKILL_RULE_PATHS[feature];
    if (paths) requiredSkills.add(paths.skill);
  }

  let section = `## PREREQUISITE: Verify Skills Are Available\n\n`;
  section += `Before implementing ANY step below, verify these agent-skills are installed:\n\n`;

  for (const skill of requiredSkills) {
    section += `- \`${skill}\`\n`;
  }

  section += `\nTo check: try reading \`skills/velt-setup-best-practices/AGENTS.md\`\n\n`;
  section += `**IF skills are NOT found:**\n`;
  section += `- STOP. Tell the user: "Velt Agent Skills are required. Install the Velt plugin or run: \`npx skills add velt-js/agent-skills\`"\n`;
  section += `- Do NOT fall back to Velt Docs MCP. Do NOT improvise patterns.\n\n`;

  return section;
}

/**
 * Generates an "Implementation Sources" section for the plan output.
 * Skills are the ONLY source. Velt Docs MCP is NOT listed as a source.
 */
function formatSkillsSourceSection(features, options = {}) {
  const refs = getSkillReferences(features, options);

  let section = `## Implementation Sources\n\n`;
  section += `> **Agent Skills are the ONLY source for implementation patterns.**\n>\n`;
  section += `> Do NOT query Velt Docs MCP during implementation.\n>\n`;
  section += `> Velt Docs MCP may only be used for user follow-up questions AFTER implementation is complete.\n\n`;

  const skillRefs = refs.filter(r => r.skillName);
  const docsRefs = refs.filter(r => r.docsUrl);

  if (skillRefs.length > 0) {
    section += `### Agent Skills (READ these before implementing)\n\n`;
    const seen = new Set();
    for (const ref of skillRefs) {
      if (!seen.has(ref.skillName)) {
        seen.add(ref.skillName);
        const feats = skillRefs.filter(r => r.skillName === ref.skillName).map(r => r.feature);
        const paths = Object.values(SKILL_RULE_PATHS).find(p => p.skill === ref.skillName);
        const agentsPath = paths ? paths.agentsIndex : `skills/${ref.skillName}/AGENTS.md`;
        section += `- **${ref.skillName}** — covers: ${feats.join(', ')}\n`;
        section += `  - **READ:** \`${agentsPath}\`\n`;
      }
    }
    section += `\n`;
  }

  if (docsRefs.length > 0) {
    section += `### Docs URLs (for features without skills coverage)\n\n`;
    for (const ref of docsRefs) {
      section += `- ${ref.feature}: ${ref.docsUrl}\n`;
    }
    section += `\n`;
  }

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
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`provider-velt-provider-setup\` rule. Follow its patterns exactly.

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
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`identity-jwt-generation\` and \`identity-user-object-shape\` rules. Follow their patterns exactly.

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
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`debug-multi-user-testing\` rule. Follow its patterns exactly.

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
    details: `Open browser DevTools Console and look for Velt errors. Common: "Please set document id", "Velt API key not found", "Failed to authenticate user". If errors occur, read \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`debug-common-issues\` rule.`,
  });

  // Additional info
  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**Agent Skills are the ONLY source for implementation patterns.**

- ✅ **READ:** \`skills/velt-setup-best-practices/AGENTS.md\` — VeltProvider, auth, document identity
- ✅ **READ:** \`skills/velt-comments-best-practices/AGENTS.md\` — ${commentType} comments patterns
- Do NOT reimplement patterns from scratch — follow the skill rules exactly
- Do NOT query Velt Docs MCP during implementation — skills have everything needed
- If a skill rule and this plan conflict, the skill rule is correct`,
    },
  ];

  // Format with prerequisite check and skills section
  const prereq = formatPrerequisiteCheck(['comments']);
  const plan = formatInstallationPlan({
    title: `Plan for Velt ${commentTypeTitle} Comments Installation`,
    steps,
    additionalInfo,
  });

  const skillsSection = formatSkillsSourceSection(['comments'], { commentType });
  return prereq + '\n' + plan + '\n' + skillsSection;
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
  const hasSingleEditor = features.includes('single-editor-mode');
  const hasSelfHostingData = features.includes('self-hosting-data');
  const hasActivityLogs = features.includes('activity-logs');

  const featureList = [];
  if (hasComments) featureList.push(`${commentType.charAt(0).toUpperCase() + commentType.slice(1)} Comments`);
  if (hasPresence) featureList.push('Presence');
  if (hasCursors) featureList.push('Cursors');
  if (hasNotifications) featureList.push('Notifications');
  if (hasRecorder) featureList.push('Recorder');
  if (hasCRDT) featureList.push(`CRDT (${crdtEditorType ? crdtEditorType.charAt(0).toUpperCase() + crdtEditorType.slice(1) : 'Collaborative Editing'})`);
  if (hasSingleEditor) featureList.push('Single Editor Mode');
  if (hasSelfHostingData) featureList.push('Self-Hosting Data');
  if (hasActivityLogs) featureList.push('Activity Logs');

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
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`provider-velt-provider-setup\` and \`identity-auth-provider\` rules. Follow their patterns exactly.

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
- CRDT extension should be LAST in the extensions array
- Install \`@floating-ui/dom\` (required peer dependency for BubbleMenu)
- BubbleMenu import: \`import { BubbleMenu } from "@tiptap/react/menus"\` (SUBPATH EXPORT — not from @tiptap/react)`;
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

    const tiptapCodeExamples = crdtEditorType === 'tiptap' ? [
      {
        description: '⚠️ CRITICAL: Use this EXACT code. BubbleMenu is a SUBPATH EXPORT at "@tiptap/react/menus" — it CANNOT be verified using Node.js require() or import() in the terminal (it only resolves through webpack/Next.js bundler). Do NOT try to verify it in shell. Do NOT use @tiptap/extension-bubble-menu (that exports the headless extension class, not the React component). Do NOT create a custom selection toolbar. Requires: npm install @floating-ui/dom',
        language: 'tsx',
        code: `"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
// ⚠️⚠️⚠️ BubbleMenu is a SUBPATH EXPORT in Tiptap v3
// Import from "@tiptap/react/menus" — NOT from "@tiptap/react"
// It will NOT show up if you inspect @tiptap/react exports
// Requires: npm install @floating-ui/dom
// Do NOT build a custom selection toolbar — use BubbleMenu
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useVeltTiptapCrdtExtension } from "@veltdev/tiptap-crdt-react";
import { TiptapVeltComments, addComment, renderComments } from "@veltdev/tiptap-velt-comments";
import { useCommentAnnotations } from "@veltdev/react";

export function TiptapCollabEditor({ documentId, initialContent }: { documentId: string; initialContent?: string }) {
  const editorId = \`\${documentId}/main\`;

  const { VeltCrdt, isLoading } = useVeltTiptapCrdtExtension({
    editorId,
    initialContent: initialContent || undefined,
  });

  // ⚠️ MANDATORY: useCommentAnnotations + renderComments — without this, comments FREEZE the app
  const commentAnnotations = useCommentAnnotations();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }), // ⚠️ MUST be undoRedo, NOT history
      TiptapVeltComments,                         // ⚠️ MUST be BEFORE VeltCrdt or app FREEZES
      ...(VeltCrdt ? [VeltCrdt] : []),            // CRDT extension LAST
    ],
    immediatelyRender: false,
  }, [VeltCrdt]);

  // ⚠️ MANDATORY: Render comment highlights — without this the app FREEZES
  useEffect(() => {
    if (editor && commentAnnotations) {
      renderComments({ editor, editorId, commentAnnotations }); // editorId is REQUIRED
    }
  }, [editor, editorId, commentAnnotations]);

  if (isLoading) return <div>Loading editor...</div>;

  return (
    <div>
      <EditorContent editor={editor} />
      {editor && (
        <BubbleMenu editor={editor}>
          <button onClick={(e) => {
            e.preventDefault();
            addComment({ editor, editorId }); // editorId is REQUIRED
          }}>
            Add Comment
          </button>
        </BubbleMenu>
      )}
    </div>
  );
}`,
      },
    ] : [];

    steps.push({
      title: `Create ${editorName} CRDT editor component`,
      details: `**READ FIRST:** \`skills/velt-crdt-best-practices/AGENTS.md\` → look up these rules: ${skillRules}. Read each rule file and follow their patterns exactly.

Create \`components/velt/${editorName}CollabEditor.tsx\` following the skill patterns.

Requirements:
${requirements}`,
      codeExamples: tiptapCodeExamples,
    });
  }

  // Step 4: Comments integration with editor (conditional, tiptap only — other editors handle comments differently)
  if (hasComments && hasCRDT && crdtEditorType === 'tiptap') {
    steps.push({
      title: `MANDATORY: Integrate TiptapVeltComments extension in editor`,
      details: `**READ FIRST:** \`skills/velt-crdt-best-practices/AGENTS.md\` → look up \`tiptap-comments-integration\` rule. Follow its patterns exactly.

⚠️ WITHOUT THESE, THE APP WILL FREEZE WHEN COMMENTS ARE TRIGGERED.

ALL of the following are REQUIRED (missing ANY ONE causes freeze):

1. \`TiptapVeltComments\` in extensions array — BEFORE VeltCrdt
2. \`useCommentAnnotations()\` hook — import from \`@veltdev/react\`
3. \`renderComments({ editor, editorId, commentAnnotations })\` in a useEffect — ALL THREE params required
4. \`addComment({ editor, editorId })\` for comment trigger — BOTH params required
5. \`BubbleMenu\` from \`@tiptap/react/menus\` (SUBPATH EXPORT — will NOT appear in @tiptap/react main exports)

⚠️ DO NOT create a custom selection toolbar. BubbleMenu EXISTS at \`@tiptap/react/menus\` — it is a subpath export that won't show up when inspecting \`@tiptap/react\`. Requires \`@floating-ui/dom\` peer dependency.

⚠️ If the BubbleMenu import fails, run: \`npm install @floating-ui/dom\` and ensure the import path is \`@tiptap/react/menus\`.`,
      codeExamples: [
        {
          description: 'Extension order (CRITICAL — wrong order causes FREEZE)',
          language: 'tsx',
          code: `// ✅ CORRECT — TiptapVeltComments BEFORE VeltCrdt
extensions: [
  StarterKit.configure({ undoRedo: false }),
  TiptapVeltComments,              // MUST be BEFORE VeltCrdt
  ...(VeltCrdt ? [VeltCrdt] : []), // CRDT extension LAST
]

// ❌ WRONG — causes app FREEZE when adding comments
extensions: [
  StarterKit.configure({ undoRedo: false }),
  ...(VeltCrdt ? [VeltCrdt] : []), // VeltCrdt before TiptapVeltComments = FREEZE
  TiptapVeltComments,
]`,
        },
        {
          description: 'Comment rendering and triggering (editorId REQUIRED)',
          language: 'tsx',
          code: `import { BubbleMenu } from "@tiptap/react/menus"; // ⚠️ NOT from @tiptap/react
import { TiptapVeltComments, addComment, renderComments } from "@veltdev/tiptap-velt-comments";
import { useCommentAnnotations } from "@veltdev/react";

// Render highlights — editorId is REQUIRED
const commentAnnotations = useCommentAnnotations();
useEffect(() => {
  if (editor && commentAnnotations) {
    renderComments({ editor, editorId, commentAnnotations });
  }
}, [editor, editorId, commentAnnotations]);

// BubbleMenu with comment button — editorId is REQUIRED
<BubbleMenu editor={editor}>
  <button onClick={(e) => {
    e.preventDefault();
    addComment({ editor, editorId });
  }}>Add Comment</button>
</BubbleMenu>`,
        },
      ],
    });
  }

  // Step 5: SSR safety (conditional, Next.js + Tiptap)
  if (hasCRDT && crdtEditorType === 'tiptap') {
    steps.push({
      title: `MANDATORY: Load editor with next/dynamic (SSR safety)`,
      details: `**READ FIRST:** \`skills/velt-crdt-best-practices/AGENTS.md\` → look up \`tiptap-nextjs-ssr\` rule. Follow its patterns exactly.

Tiptap and @veltdev/tiptap-velt-comments use browser-only APIs. In Next.js, the editor component MUST be loaded with \`next/dynamic\` and \`ssr: false\` in the page that renders it. Without this, the app will crash with a \`g.catch is not a function\` error.

Do NOT import the editor component directly — use the dynamic import pattern below.`,
      codeExamples: [
        {
          description: 'Dynamic import pattern for named export (REQUIRED for Next.js)',
          language: 'tsx',
          code: `// In app/dashboard/[docId]/page.tsx (or wherever the editor is rendered)
import dynamic from "next/dynamic";

// ✅ CORRECT — .then() handles named export
const TiptapCollabEditor = dynamic(
  () => import("@/components/velt/TiptapCollabEditor").then(m => ({ default: m.TiptapCollabEditor })),
  { ssr: false, loading: () => <div>Loading editor...</div> }
);

// ❌ WRONG — named export won't resolve without .then()
const TiptapCollabEditor = dynamic(
  () => import("@/components/velt/TiptapCollabEditor"),
  { ssr: false }
);`,
        },
      ],
    });
  }

  // Step 6: Cursor CSS (conditional)
  if (hasCRDT && crdtEditorType === 'tiptap') {
    steps.push({
      title: `MANDATORY: Add collaboration cursor CSS to globals.css`,
      details: `**READ FIRST:** \`skills/velt-crdt-best-practices/AGENTS.md\` → look up \`tiptap-cursor-css\` rule. Follow its patterns exactly.

Without this CSS, remote user cursors appear as thick full-width blocks instead of thin carets. Add the CSS below to your globals.css file.`,
      codeExamples: [
        {
          description: 'Collaboration cursor CSS (add to globals.css)',
          language: 'css',
          code: `/* ===== y-prosemirror cursors (used by Velt CRDT) ===== */
.ProseMirror .ProseMirror-yjs-cursor {
  position: relative;
  border-left: 2px solid #0d0d0d;
  border-right: none;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  word-break: normal;
}

/* CRITICAL: Force inline to prevent full-width cursor block */
.ProseMirror .ProseMirror-yjs-cursor > span {
  display: inline !important;
}

/* Username label above caret */
.ProseMirror .ProseMirror-yjs-cursor > div {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-weight: 600;
  font-style: normal;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  border-radius: 3px 3px 3px 0;
  color: white;
  white-space: nowrap;
  user-select: none;
}

/* Selection highlight for remote users */
.ProseMirror .ProseMirror-yjs-selection {
  opacity: 0.3;
}

/* ===== Tiptap collaboration-cursor extension ===== */
.ProseMirror .collaboration-cursor__caret,
.ProseMirror .collaboration-carets__caret {
  border-left: 1px solid #0d0d0d !important;
  border-right: 1px solid #0d0d0d !important;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}

.ProseMirror .collaboration-cursor__label,
.ProseMirror .collaboration-carets__label {
  border-radius: 3px 3px 3px 0;
  color: #0d0d0d;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  left: -1px;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  position: absolute;
  top: -1.4em;
  user-select: none;
  white-space: nowrap;
}

/* Comment text highlights */
velt-comment-text[comment-available="true"] {
  background-color: rgba(255, 212, 0, 0.3);
}`,
        },
      ],
    });
  }

  // Step: Recorder setup (conditional)
  if (hasRecorder) {
    steps.push({
      title: `Add Velt Recorder with playback and pinned notes`,
      details: `**READ FIRST:** \`skills/velt-recorder-best-practices/rules/shared/core/core-setup.md\` — this file contains the COMPLETE implementation code for all 4 recorder components. Do NOT implement from this summary — read the rule file and copy its code examples exactly.

The recorder requires 4 components. The rule file has complete copy-ready code for all of them:
1. \`VeltRecorderTool type="all"\` — enables audio, video, AND screen recording (not just video)
2. \`VeltRecorderControlPanel mode="floating"\` — floating panel during recording
3. \`VeltRecorderNotes\` — pins recordings to page locations
4. \`RecordingPlayback\` — floating player using \`useRecorderAddHandler\` + \`VeltRecorderPlayer\` that appears after recording completes

⚠️ The RecordingPlayback component is REQUIRED for recordings to be viewable after saving. Without it, recordings are saved but invisible. Copy the complete component from the rule file.`,
    });
  }

  // Step: Single Editor Mode setup (conditional)
  if (hasSingleEditor) {
    steps.push({
      title: `Add Single Editor Mode with live sync and editor status UI`,
      details: `**READ FIRST:** \`skills/velt-single-editor-mode-best-practices/rules/shared/core/core-setup.md\` — this file contains the COMPLETE implementation code for both files below. Do NOT implement from this summary — read the rule file and copy its code examples exactly.

Single Editor Mode requires changes in TWO files. The rule file has complete, copy-ready code for both:

1. **VeltCollaboration component** — SEM config, auto-sync, container scoping, and auto-claim editor role
2. **Document page** — \`DocumentContent\` inner component with editor status banner and synced content area

⚠️ Do NOT skip reading the rule file. Do NOT implement from method names alone. The rule has exact code that MUST be copied — partial implementation breaks SEM.

**Testing:**
- \`?user=user-1\` (Alice) → claims editor, green banner, can edit
- \`?user=user-2\` (Bob) → viewer, yellow banner, sees live changes, cannot edit

**If SEM doesn't work on first try:** Re-read \`core-setup.md\` and diff your code against its examples. Do NOT add timeouts, do NOT make \`contentEditable\` conditional, do NOT use \`useCurrentUser()\` to gate \`setUserAsEditor()\`.`,
    });
  }

  // Step: Self-Hosting Data setup (conditional)
  if (hasSelfHostingData) {
    steps.push({
      title: `Configure self-hosting data providers and backend API routes`,
      details: `**READ FIRST:** \`skills/velt-self-hosting-data-best-practices/rules/shared/core/core-provider-setup.md\` — this file has the complete VeltProvider dataProviders configuration. Then read \`rules/shared/core/core-response-format.md\` for the required response contract. Do NOT implement from this summary — read the rule files and copy their code examples exactly.

Self-hosting stores user-generated content (comments, attachments, reactions, user PII) on YOUR infrastructure instead of Velt's cloud. Implementation requires THREE things:

1. **VeltDataProviders.ts** — function-based data providers with get/save/delete for each data type
2. **API routes** — \`app/api/velt/{comments,users,attachments,reactions}/{get,save,delete}/route.ts\`
3. **Database store** — \`app/api/velt/store.ts\` with connection pool, table init, and UPSERT operations

The \`dataProviders\` prop MUST be set on VeltProvider BEFORE identify() is called.

**After core setup, read these rules in order:**
- \`rules/shared/comment/comment-function-provider.md\` — comment get/save/delete pattern
- \`rules/shared/attachment/attachment-multipart-provider.md\` — attachment handling (base64 for Next.js)
- \`rules/shared/provider/provider-user-resolver.md\` — user PII provider (read-only)
- \`rules/shared/provider/provider-reaction-recording.md\` — reaction provider pattern
- \`rules/shared/backend/backend-api-routes.md\` — API route structure
- \`rules/shared/backend/backend-database-patterns.md\` — PostgreSQL UPSERT patterns

**Environment variables needed:**
- \`DATABASE_URL\` — PostgreSQL connection string

**Testing:** After implementation, open browser DevTools console. The Velt SDK logs data provider events showing each get/save/delete call and whether it succeeded.`,
    });
  }

  // Step: Activity Logs setup (conditional)
  if (hasActivityLogs) {
    steps.push({
      title: `Add Activity Log panel with real-time event feed`,
      details: `**READ FIRST:** \`skills/velt-activity-best-practices/rules/shared/core/core-setup.md\` — Activity Logs MUST be enabled in Velt Console (console.velt.dev > Configuration > Activity Logs > ON). Then read \`rules/react/data/data-subscribe-hook.md\` for the useAllActivities hook. Do NOT implement from this summary — read the rule files and copy their code examples exactly.

⚠️ **SDK Version:** Activity Logs hooks (\`useAllActivities\`, \`useActivityUtils\`) require \`@veltdev/react@5.0.2-beta.13\` or later. Verify with \`npm list @veltdev/react\`. If older, run \`npm install @veltdev/react@5.0.2-beta.13\`.

Activity Logs is a frontend-only feature — no backend routes needed. Implementation requires:

1. **ActivityLog component** — right-side panel showing timeline of events grouped by date
2. **useAllActivities()** hook — subscribes to real-time activity feed, returns null while loading
3. **Toggle button** — "View Activity Log" pill button on the document page header
4. **Activity types** — comment created, comment edited, reaction added, priority changed, video recording added

The panel should be: white background, rounded corners, "Activity Log" header with "All Activity" dropdown and close button. Each event shows an icon, description, and relative timestamp. Events grouped under date headers (TODAY, date).

**After reading the core rules, also read:**
- \`rules/shared/config/config-action-type-filters.md\` — type-safe filtering constants
- \`rules/shared/debug/debug-common-issues.md\` — troubleshooting (console enablement is #1 issue)`,
    });
  }

  // Step 7: Authentication setup
  steps.push({
    title: `Set up authentication and JWT token generation`,
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`identity-jwt-generation\` and \`identity-user-object-shape\` rules. Follow their patterns exactly.

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
    details: `**READ FIRST:** \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`debug-multi-user-testing\` rule. Follow its patterns exactly.

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
  if (hasSingleEditor) testInstructions.push('Single Editor Mode: Open ?user=user-1 (editor) and ?user=user-2 (viewer) — user-2 should see read-only mode with access request panel');

  steps.push({
    title: `Test all requested features`,
    details: `Start your development server and test:\n${testInstructions.map(t => `- ${t}`).join('\n')}\n\nDO NOT test or implement other features.`,
  });

  // Step 12: Check console
  steps.push({
    title: `Check browser console for Velt errors/warnings`,
    details: `Open browser DevTools Console and look for Velt errors. Common: "Please set document id", "Velt API key not found", "Failed to authenticate user". If errors occur, read \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`debug-common-issues\` rule.`,
  });

  // Additional info
  const skillsList = [];
  skillsList.push('- ✅ **READ:** `skills/velt-setup-best-practices/AGENTS.md` — VeltProvider, auth, document identity');
  if (hasComments) skillsList.push(`- ✅ **READ:** \`skills/velt-comments-best-practices/AGENTS.md\` — ${commentType} comments patterns`);
  if (hasCRDT) skillsList.push(`- ✅ **READ:** \`skills/velt-crdt-best-practices/AGENTS.md\` — ${crdtEditorType || 'collaborative editing'} CRDT patterns`);
  if (hasNotifications) skillsList.push('- ✅ **READ:** `skills/velt-notifications-best-practices/AGENTS.md` — notifications setup');
  if (hasRecorder) skillsList.push('- ✅ **READ:** `skills/velt-recorder-best-practices/rules/shared/core/core-setup.md` — recorder setup (read this file directly, NOT AGENTS.md)');
  if (hasSingleEditor) skillsList.push('- ✅ **READ:** `skills/velt-single-editor-mode-best-practices/rules/shared/core/core-setup.md` — single editor mode setup (read this file directly, NOT AGENTS.md)');
  if (hasSelfHostingData) skillsList.push('- ✅ **READ:** `skills/velt-self-hosting-data-best-practices/rules/shared/core/core-provider-setup.md` — self-hosting data providers (read this file directly, NOT AGENTS.md)');
  if (hasActivityLogs) skillsList.push('- ✅ **READ:** `skills/velt-activity-best-practices/rules/shared/core/core-setup.md` — activity logs setup (read this file directly, NOT AGENTS.md)');

  const additionalInfo = [
    {
      title: '🚨 CRITICAL IMPLEMENTATION RULES',
      content: `**Agent Skills are the ONLY source for implementation patterns.**

${skillsList.join('\n')}

- Do NOT reimplement patterns from scratch — follow the skill rules exactly
- If a skill rule and this plan conflict, the skill rule is correct
- Do NOT query Velt Docs MCP during implementation — skills have everything needed
- Do NOT create files outside \`components/velt/\` unless necessary for app-specific wiring`,
    },
  ];

  // Format with prerequisite check and skills section
  const prereq = formatPrerequisiteCheck(features);
  const plan = formatInstallationPlan({
    title: `Plan for Velt ${featureList.join(' + ')} Installation`,
    steps,
    additionalInfo,
  });

  const skillsSection = formatSkillsSourceSection(features, { commentType, crdtEditorType });
  return prereq + '\n' + plan + '\n' + skillsSection;
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

**Next:** Install agent-skills via \`npx skills add velt-js/agent-skills\`, then READ these skill files:
- \`skills/velt-setup-best-practices/AGENTS.md\` — VeltProvider wiring, auth, document setup
- \`skills/velt-comments-best-practices/AGENTS.md\` — comments integration
- \`skills/velt-crdt-best-practices/AGENTS.md\` — CRDT/collaborative editing
- \`skills/velt-notifications-best-practices/AGENTS.md\` — notifications

Or re-run the installer with specific features (don't type SKIP) for guided setup.

---

## ⚠️ Common Issues

Read \`skills/velt-setup-best-practices/AGENTS.md\` → look up \`debug-common-issues\` rule for:
- "Velt API key not found" — check .env.local
- "Please set document id" — check VeltInitializeDocument
- "Failed to authenticate user" — check user object fields

---

*Generated by Velt MCP Installer (CLI-Only Mode)*
`;
}

export default {
  formatInstallationPlan,
  formatPrerequisiteCheck,
  formatSkillsSourceSection,
  createVeltCommentsPlan,
  createMultiFeaturePlan,
  createCliOnlyReport,
};
