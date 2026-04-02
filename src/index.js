/**
 * Velt MCP Installer Server
 * 
 * Main MCP server implementation that exposes tools for Velt installation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { installVeltFreestyle } from './tools/orchestrator.js';
import { installVeltUnified } from './tools/unified-installer.js';
import { takeScreenshot } from './utils/screenshot.js';
import { detectCommentPlacement } from './utils/comment-detector.js';

/**
 * Formats questionnaire for display in tool response
 * @param {Object} questionnaire - Questionnaire object from installer
 * @returns {string} Formatted markdown string
 */
function formatQuestionnaire(questionnaire) {
  const sections = [];

  if (questionnaire.documentId) {
    const q = questionnaire.documentId;
    sections.push(`### A) Document ID\n**${q.question}**\n${q.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\n*Follow-up questions:*\n${q.followUp.map(f => `- ${f.question}`).join('\n')}`);
  }

  if (questionnaire.user) {
    const q = questionnaire.user;
    sections.push(`### B) User Identity\n**${q.question}**\n${q.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\n*Follow-up questions:*\n${q.followUp.map(f => `- ${f.question}`).join('\n')}`);
  }

  if (questionnaire.auth) {
    const q = questionnaire.auth;
    sections.push(`### C) Auth/JWT Token\n**${q.question}**\n${q.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\n*Follow-up questions (if token exists):*\n${q.followUp.map(f => `- ${f.question}`).join('\n')}`);
  }

  if (questionnaire.insertion) {
    const q = questionnaire.insertion;
    sections.push(`### D) Velt Initialization Location\n**${q.question}**\n${q.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}\n\n*Follow-up questions:*\n${q.followUp.map(f => `- ${f.question}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Creates and starts the MCP server
 */
export async function createServer() {
  const server = new Server(
    {
      name: 'velt-installer',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {}, // Enable prompts for user input
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'take_project_screenshot',
        description:
          'Takes a screenshot of the user\'s running Next.js application. ' +
          'WORKFLOW: This tool should be called FIRST in the Velt installation workflow to help identify where to add comments. ' +
          'REQUIREMENTS: ' +
          '1) The user must have their Next.js dev server running (npm run dev) on localhost:3000 or another port. ' +
          '2) After taking the screenshot, you should show it to the user and ask them to describe which part of their webpage they want to add comments to (e.g., "header", "sidebar", "main content area"). ' +
          '3) Then ask them which type of comments they want: Freestyle (click anywhere) or Popover (attached to specific elements). ' +
          '4) Use the detect_comment_placement tool with their responses to find the best files to modify. ' +
          '5) Finally, use install_velt_freestyle or another installation tool to implement the selected comment type.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to screenshot (default: http://localhost:3000)',
            },
            width: {
              type: 'number',
              description: 'Viewport width in pixels (default: 1920)',
            },
            height: {
              type: 'number',
              description: 'Viewport height in pixels (default: 1080)',
            },
            fullPage: {
              type: 'boolean',
              description: 'Capture full page or just viewport (default: false)',
            },
          },
          required: [],
        },
      },
      {
        name: 'detect_comment_placement',
        description:
          'Analyzes the Next.js project structure to determine the best files and locations for placing Velt comments. ' +
          'WORKFLOW: This tool should be called AFTER taking a screenshot and getting user input about where they want comments. ' +
          'INPUT: Use the user\'s description of the target area (e.g., "header", "sidebar", "main content") and comment type (freestyle or popover). ' +
          'OUTPUT: Returns ranked list of candidate files with implementation guidance. ' +
          'USAGE: ' +
          '1) Pass the targetDescription from what the user said about the screenshot ' +
          '2) Pass the commentType based on user\'s choice (freestyle or popover) ' +
          '3) Review the results with the user before proceeding to installation ' +
          '4) Use the recommended placement information when calling installation tools',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the Next.js project directory',
            },
            commentType: {
              type: 'string',
              enum: ['freestyle', 'popover'],
              description: 'Type of comments to implement (freestyle or popover)',
            },
            targetDescription: {
              type: 'string',
              description: 'User\'s description of where to add comments (e.g., "header", "sidebar", "main content area"). This comes from the user\'s response when you showed them the screenshot.',
            },
            targetComponent: {
              type: 'string',
              description: 'Optional: specific component name if the user mentioned it',
            },
          },
          required: ['projectPath', 'commentType'],
        },
      },
      {
        name: 'install_velt_interactive',
        description:
          '🌟 RECOMMENDED: Unified Velt installation with guided or CLI-only mode. ' +
          '\n\n📚 REQUIRED: Velt Agent Skills must be installed.' +
          '\nSkills provide ALL implementation patterns. Without them, this tool cannot generate a working plan.' +
          '\nDo NOT use Velt Docs MCP as a substitute for skills.' +
          '\nSkills: velt-setup-best-practices, velt-comments-best-practices, velt-crdt-best-practices, velt-notifications-best-practices, velt-recorder-best-practices' +
          '\nThe generated plan tells the AI which skill files to READ before each implementation step.' +
          '\n\n🚨🚨🚨 CRITICAL: ASK QUESTIONS ONE AT A TIME 🚨🚨🚨' +
          '\nDO NOT dump all questions in one message.' +
          '\nWait for user response before asking the next question.' +
          '\nIf the user skips a question, INFORM them of the default value being used (e.g., "Using default: freestyle comments") before proceeding.' +
          '\n\n=========================================' +
          '\nWORKFLOW - ASK ONE QUESTION, WAIT, THEN NEXT:' +
          '\n=========================================' +
          '\n\nSTEP 1 - CONFIRM DIRECTORY:' +
          '\n  Ask ONLY: "Is this the correct project directory: [path]?"' +
          '\n  WAIT for user to confirm (yes/no).' +
          '\n\nSTEP 2 - GET API KEY:' +
          '\n  Ask ONLY: "Please provide your Velt API Key (from https://console.velt.dev)"' +
          '\n  WAIT for user response.' +
          '\n\nSTEP 3 - GET AUTH TOKEN:' +
          '\n  Ask ONLY: "Please provide your Velt Auth Token (from https://console.velt.dev)"' +
          '\n  WAIT for user response.' +
          '\n\nSTEP 4 - FEATURE SELECTION (with SKIP option):' +
          '\n  Read the install-velt skill for the full feature list. Present ALL features from the skill to the user.' +
          '\n  Include SKIP as an option for CLI-only scaffolding.' +
          '\n  For Comments: ask which type (freestyle/popover/page/text/inline/tiptap/lexical/slate).' +
          '\n  For CRDT: ask which editor (tiptap/codemirror/blocknote).' +
          '\n  WAIT for user response.' +
          '\n\n=========================================' +
          '\n🚨 IF USER TYPES "SKIP": CLI-ONLY MODE 🚨' +
          '\n=========================================' +
          '\n  Call tool with ONLY: projectPath, apiKey, authToken, mode="cli-only"' +
          '\n  DO NOT pass features or other params. Tool returns TODO checklist. DONE.' +
          '\n\n=========================================' +
          '\n🔷 IF USER SELECTS FEATURES: GUIDED MODE 🔷' +
          '\n=========================================' +
          '\n\n  STEP 5 - VELTPROVIDER LOCATION:' +
          '\n    Ask: "Where should VeltProvider be installed? (app/page.tsx recommended). NOTE: ONLY recommend app/page.tsx. Do NOT suggest app/layout.tsx."' +
          '\n    WAIT for response.' +
          '\n\n  STEP 6 - CORNER POSITION:' +
          '\n    Ask: "Which corner for Velt features? (top-left/top-right/bottom-left/bottom-right)"' +
          '\n    WAIT for response.' +
          '\n\n  STEP 7 - FIRST TOOL CALL (runs CLI, returns status):' +
          '\n    Call with mode="guided", stage="plan", features, etc.' +
          '\n    Tool returns status="awaiting_discovery_consent"' +
          '\n\n  STEP 8 - DISCOVERY CONSENT:' +
          '\n    Tool response includes question about scanning codebase.' +
          '\n    Ask user: "Scan codebase for wiring info? [YES/NO]"' +
          '\n    WAIT for response.' +
          '\n\n  STEP 9A - IF USER SAYS YES (scan path):' +
          '\n    Call tool with discoveryConsent="yes"' +
          '\n    Tool returns status="awaiting_discovery_verification" with findings' +
          '\n    Show findings to user, ask: "Verify? [CONFIRM ALL / EDIT / UNSURE]"' +
          '\n    Call tool with discoveryVerification={status:"confirmed"|"edited", overrides?:{...}}' +
          '\n\n  STEP 9B - IF USER SAYS NO (manual path):' +
          '\n    Call tool with discoveryConsent="no"' +
          '\n    Tool returns status="awaiting_manual_wiring_answers" with questionnaire' +
          '\n    Ask questionnaire (DocumentId, User, Auth, Insertion) ONE SECTION AT A TIME' +
          '\n    Call tool with manualWiring={documentId:{...}, user:{...}, auth:{...}, insertion:{...}}' +
          '\n\n  STEP 10 - PLAN GENERATED:' +
          '\n    Tool returns status="plan_generated" with full plan' +
          '\n    Show plan, ask: "Would you like me to implement this?"' +
          '\n    WAIT for approval.' +
          '\n\n  STEP 11 - APPLY:' +
          '\n    Call with mode="guided", stage="apply", approved=true' +
          '\n    Execute plan, run full QA.' +
          '\n\n=========================================' +
          '\nTOOL RESPONSE STATUSES:' +
          '\n=========================================' +
          '\n• awaiting_discovery_consent - Need YES/NO for codebase scanning' +
          '\n• awaiting_discovery_verification - Scan done, need CONFIRM/EDIT/UNSURE' +
          '\n• awaiting_manual_wiring_answers - User said NO, need questionnaire answers' +
          '\n• plan_generated - Plan ready with verified/manual wiring' +
          '\n• cli_only_complete - SKIP path done' +
          '\n• apply_complete - Apply stage done' +
          '\n\n=========================================' +
          '\nCRITICAL RULES:' +
          '\n=========================================' +
          '\n• ASK ONE QUESTION AT A TIME - never batch questions' +
          '\n• Check tool response "status" field to know next action' +
          '\n• NO plan without verified scan OR completed manual answers' +
          '\n• If user says UNSURE, ask who can confirm - do NOT guess',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory - Must be confirmed by user',
            },
            apiKey: {
              type: 'string',
              description: 'Velt API Key from https://console.velt.dev - REQUIRED',
            },
            authToken: {
              type: 'string',
              description: 'Velt Auth Token from https://console.velt.dev - REQUIRED',
            },
            mode: {
              type: 'string',
              enum: ['guided', 'cli-only'],
              description: 'Installation mode. Use "cli-only" if user typed SKIP. Default: "guided"',
            },
            stage: {
              type: 'string',
              enum: ['plan', 'apply'],
              description: 'For guided mode: "plan" generates the plan, "apply" executes it. Default: "plan"',
            },
            approved: {
              type: 'boolean',
              description: 'Set to true when user approved the plan (for stage="apply").',
            },
            features: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['comments', 'presence', 'cursors', 'notifications', 'recorder', 'crdt', 'single-editor-mode', 'self-hosting-data'],
              },
              description: 'Features to install (guided mode only).',
            },
            commentType: {
              type: 'string',
              enum: ['freestyle', 'popover', 'page', 'text', 'inline', 'tiptap', 'lexical', 'slate'],
              description: 'Type of comments (if comments feature selected)',
            },
            crdtEditorType: {
              type: 'string',
              enum: ['tiptap', 'codemirror', 'blocknote', 'reactflow'],
              description: 'CRDT editor type (if crdt feature selected)',
            },
            headerPosition: {
              type: 'string',
              enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              description: 'Corner position for Velt features. Default: "top-right"',
            },
            veltProviderLocation: {
              type: 'string',
              description: 'Where to install VeltProvider. Default and recommended: "app/page.tsx". Do NOT use app/layout.tsx.',
            },
            discoveryConsent: {
              type: 'string',
              enum: ['yes', 'no'],
              description: 'User consent for automated codebase scanning. "yes"=run scan, "no"=use manual questionnaire.',
            },
            discoveryVerification: {
              type: 'object',
              description: 'Verification of scan results (after discoveryConsent="yes")',
              properties: {
                status: {
                  type: 'string',
                  enum: ['confirmed', 'edited', 'unsure'],
                  description: 'User verification status',
                },
                overrides: {
                  type: 'object',
                  description: 'Per-section overrides if status="edited"',
                  properties: {
                    documentId: { type: 'object' },
                    user: { type: 'object' },
                    auth: { type: 'object' },
                    insertion: { type: 'object' },
                  },
                },
              },
            },
            manualWiring: {
              type: 'object',
              description: 'Manual wiring answers (after discoveryConsent="no")',
              properties: {
                documentId: {
                  type: 'object',
                  properties: {
                    method: { type: 'string', enum: ['query-param', 'route-param', 'database', 'storage', 'other'] },
                    filePath: { type: 'string' },
                    variableName: { type: 'string' },
                    example: { type: 'string' },
                    unsure: { type: 'boolean' },
                  },
                },
                user: {
                  type: 'object',
                  properties: {
                    providerType: { type: 'string', enum: ['next-auth', 'clerk', 'firebase', 'supabase', 'custom-api', 'other'] },
                    filePath: { type: 'string' },
                    fields: { type: 'array', items: { type: 'string' } },
                    unsure: { type: 'boolean' },
                  },
                },
                auth: {
                  type: 'object',
                  properties: {
                    usesToken: { type: 'boolean' },
                    storage: { type: 'string', enum: ['cookie', 'localStorage', 'provider-sdk', 'none', 'unsure'] },
                    source: { type: 'string' },
                    refresh: { type: 'boolean' },
                    unsure: { type: 'boolean' },
                  },
                },
                insertion: {
                  type: 'object',
                  properties: {
                    locationType: { type: 'string', enum: ['root-layout', 'specific-page', 'editor-wrapper', 'other'] },
                    filePath: { type: 'string' },
                    unsure: { type: 'boolean' },
                  },
                },
              },
            },
            targetArea: {
              type: 'string',
              description: 'Optional: User description of where they want comments',
            },
          },
          required: ['projectPath', 'apiKey', 'authToken'],
        },
      },
      {
        name: 'install_velt_freestyle',
        description:
          '⚠️  LEGACY: Basic Velt freestyle installation (no interactivity). ' +
          'USE install_velt_interactive instead for better user experience. ' +
          'This tool is kept for backward compatibility only.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the Next.js project directory',
            },
          },
          required: ['projectPath'],
        },
      },
    ],
  }));

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'velt_configuration',
        description: 'Collect Velt installation configuration (API key, auth token, directory)',
        arguments: [
          {
            name: 'installDir',
            description: 'Directory where Velt should be installed',
            required: false,
          },
          {
            name: 'apiKey',
            description: 'Your Velt API Key (get from https://console.velt.dev)',
            required: true,
          },
          {
            name: 'authToken',
            description: 'Velt Auth Token (optional, for advanced auth)',
            required: false,
          },
        ],
      },
    ],
  }));

  // Handle prompt requests
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'velt_configuration') {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Velt Installation Configuration

Please provide the following information:

1. Installation Directory: ${args?.installDir || '.'}
2. Velt API Key: ${args?.apiKey ? '***' + args.apiKey.slice(-4) : '(required)'}
3. Auth Token: ${args?.authToken ? '***' + args.authToken.slice(-4) : '(optional)'}

Configuration will be used to install Velt with freestyle comments.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'take_project_screenshot': {
          const screenshotResult = await takeScreenshot({
            url: args?.url || 'http://localhost:3000',
            width: args?.width || 1920,
            height: args?.height || 1080,
            fullPage: args?.fullPage || false,
          });

          if (!screenshotResult.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: screenshotResult.error,
                      hint: screenshotResult.hint,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }

          // Return screenshot as image content
          return {
            content: [
              {
                type: 'image',
                data: screenshotResult.data.base64,
                mimeType: screenshotResult.data.mimeType,
              },
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Screenshot captured from ${screenshotResult.data.url}`,
                    size: `${screenshotResult.data.width}x${screenshotResult.data.height}`,
                    instructions: 'Please show this screenshot to the user and ask them:\n1. Which part of the page they want to add comments to (e.g., header, sidebar, main content)\n2. What type of comments they want (Freestyle or Popover)\n\nThen use the detect_comment_placement tool with their answers.',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'detect_comment_placement': {
          if (!args?.projectPath) {
            throw new Error('projectPath is required');
          }
          if (!args?.commentType) {
            throw new Error('commentType is required (freestyle or popover)');
          }

          const detectionResult = await detectCommentPlacement({
            projectPath: args.projectPath,
            commentType: args.commentType,
            targetDescription: args?.targetDescription || '',
            targetComponent: args?.targetComponent || '',
          });

          if (!detectionResult.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: detectionResult.error,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(detectionResult.data, null, 2),
              },
            ],
          };
        }

        case 'install_velt_interactive': {
          // Validate required parameters
          if (!args?.projectPath) {
            throw new Error('projectPath is required. Please ask the user: "Is this the correct Next.js project directory: [path]?"');
          }
          if (!args?.apiKey) {
            throw new Error('apiKey is required. Please ask the user: "Please provide your Velt API Key (from https://console.velt.dev)"');
          }
          if (!args?.authToken) {
            throw new Error('authToken is required. Please ask the user: "Please provide your Velt Auth Token (from https://console.velt.dev)"');
          }

          // Determine mode from args
          const mode = args?.mode || 'guided';
          const stage = args?.stage || 'plan';
          const approved = args?.approved || false;

          // Build params based on mode
          // CRITICAL: CLI-only (SKIP) mode should NOT pass features or commentType
          const installerParams = {
            projectPath: args.projectPath,
            apiKey: args.apiKey,
            authToken: args.authToken,
            mode,
            stage,
            approved,
            server,
          };

          // Only add feature-related params for guided mode
          if (mode === 'guided') {
            installerParams.features = (args?.features?.length > 0) ? args.features : ['comments'];
            installerParams.commentType = args?.commentType || 'freestyle';
            installerParams.crdtEditorType = args?.crdtEditorType || null;
            installerParams.headerPosition = args?.headerPosition || 'top-right';
            installerParams.veltProviderLocation = args?.veltProviderLocation || 'app/page.tsx';

            // NEW: Discovery consent and verification params
            if (args?.discoveryConsent) {
              installerParams.discoveryConsent = args.discoveryConsent;
            }
            if (args?.discoveryVerification) {
              installerParams.discoveryVerification = args.discoveryVerification;
            }
            if (args?.manualWiring) {
              installerParams.manualWiring = args.manualWiring;
            }
          }
          // CLI-only mode: NO features, NO commentType, NO defaults
          // Just run core CLI scaffold + basic QA

          // Use the unified installer
          const result = await installVeltUnified(installerParams);

          // Handle CLI-only mode result
          if (result.status === 'cli_only_complete' || result.mode === 'cli-only') {
            return {
              content: [
                {
                  type: 'text',
                  text: result.report || JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Handle NEW intermediate statuses for discovery flow
          if (result.status === 'awaiting_discovery_consent') {
            const nextActionText = result.nextAction
              ? `\n\n## 🔍 Next Action Required\n\n**${result.nextAction.question}**\n\n${result.nextAction.options.map(o => `- **${o.value.toUpperCase()}**: ${o.label}`).join('\n')}\n\n⚠️ Ask the user this question, then call the tool again with \`discoveryConsent\` set to their answer ("yes" or "no").`
              : '';

            return {
              content: [
                {
                  type: 'text',
                  text: `# CLI Complete - Discovery Consent Needed\n\n${result.message || 'CLI scaffolding complete. Ready to discover integration points.'}${nextActionText}\n\n---\n\n**Status:** ${result.status}\n**CLI Method:** ${result.cliMethod || 'unknown'}`,
                },
              ],
            };
          }

          if (result.status === 'awaiting_discovery_verification') {
            const findingsText = result.formattedFindings || JSON.stringify(result.discovery, null, 2);
            const nextActionText = result.nextAction
              ? `\n\n## ✅ Verification Required\n\n**${result.nextAction.question}**\n\n${result.nextAction.options.map(o => `- **${o.value.toUpperCase()}**: ${o.label}`).join('\n')}\n\n⚠️ Show the findings above to the user and ask them to verify. Then call the tool with \`discoveryVerification\` set to their response.`
              : '';

            return {
              content: [
                {
                  type: 'text',
                  text: `# Discovery Scan Complete - Verification Needed\n\n${findingsText}${nextActionText}\n\n---\n\n**Status:** ${result.status}`,
                },
              ],
            };
          }

          if (result.status === 'awaiting_manual_wiring_answers') {
            const questionnaireText = result.questionnaire
              ? `\n\n## 📝 Manual Wiring Questionnaire\n\nAsk the user these questions ONE SECTION AT A TIME:\n\n${formatQuestionnaire(result.questionnaire)}\n\n⚠️ After collecting all answers, call the tool with \`manualWiring\` containing the user's responses.`
              : '';

            return {
              content: [
                {
                  type: 'text',
                  text: `# Manual Wiring Required\n\n${result.message || 'User declined codebase scanning. Please collect wiring information manually.'}${questionnaireText}\n\n---\n\n**Status:** ${result.status}`,
                },
              ],
            };
          }

          // Handle guided mode - plan generated (after discovery complete)
          if (result.status === 'plan_generated' || (result.mode === 'guided' && result.stage === 'plan' && result.plan)) {
            const wiringSource = result.wiring?.source || 'unknown';
            const todosText = result.wiring?.todos?.length > 0
              ? `\n\n## ⚠️ TODOs (Need Developer Input)\n\n${result.wiring.todos.map(t => `- ${t}`).join('\n')}`
              : '';

            return {
              content: [
                {
                  type: 'text',
                  text: `# Installation Plan Generated\n\n**Wiring Source:** ${wiringSource}${todosText}\n\n${result.plan}\n\n---\n\n## 🎯 NEXT STEPS\n\n1. **PRESENT THIS PLAN TO THE USER** - Show them the plan above\n2. **ASK FOR APPROVAL** - Ask: "Would you like me to implement this plan?"\n3. **IF APPROVED** - Call this tool again with:\n   - mode: "guided"\n   - stage: "apply"\n   - approved: true\n4. **EXECUTE THE PLAN** - Make the file edits described in the plan\n5. **CHECK DEV CONSOLE** - After implementation, check browser console for Velt errors\n\n---\n\n⚠️ **CRITICAL**: Do NOT make any file changes until the user approves this plan.\n\n---\n\n**IMPLEMENTATION RULES:**\n• Use installed **Agent Skills** as PRIMARY reference (velt-setup-best-practices, velt-comments-best-practices, velt-crdt-best-practices, velt-notifications-best-practices)\n• Use Docs URLs ONLY for features without skills (presence, cursors)\n• Use Velt Docs MCP ONLY for user follow-up questions after implementation\n• ONLY implement features the user requested\n• Use CLI-generated: authentication, user setup, document setup\n• DO NOT use VeltTools or ui-customization folder (unless requested)\n• DO NOT use CLI-generated component files as implementation reference`,
                },
              ],
            };
          }

          // Handle guided mode - apply stage
          if (result.status === 'apply_complete' || (result.mode === 'guided' && result.stage === 'apply')) {
            const validationSummary = result.validation
              ? `\n\n## Validation Results\n${result.validation.checks.map(c => `- ${c.status === 'pass' ? '✅' : '❌'} ${c.name}: ${c.message}`).join('\n')}\n\n**Score:** ${result.validation.score}`
              : '';

            return {
              content: [
                {
                  type: 'text',
                  text: `# Installation Apply Stage Complete\n\n${result.message}${validationSummary}\n\n## 🔍 Final Steps\n\n1. Start your development server: \`npm run dev\`\n2. Open browser DevTools Console (F12)\n3. Look for Velt messages and errors\n4. Test the installed features\n5. If errors occur, query Velt Docs MCP for solutions`,
                },
              ],
            };
          }

          // Handle errors or unexpected states
          if (result.status === 'error' || result.status === 'failed') {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
              isError: true,
            };
          }

          // Default: return full result
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'install_velt_freestyle':
          // Validate projectPath is provided
          if (!args?.projectPath) {
            throw new Error('projectPath is required. Please ask the user which directory they want to install Velt in.');
          }

          const result = await installVeltFreestyle({
            projectPath: args.projectPath,
            apiKey: args?.apiKey || null, // Optional - will read from .env if not provided
            authToken: args?.authToken || null, // Optional
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                stack: error.stack,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Velt MCP Installer server running on stdio');
}

