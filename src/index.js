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
import { installVeltInteractive } from './tools/interactive-installer.js';
import { installVeltWithPlan } from './tools/plan-based-installer.js';
import { installVeltUnified } from './tools/unified-installer.js';
import { takeScreenshot, checkDevServerRunning } from './utils/screenshot.js';
import { detectCommentPlacement } from './utils/comment-detector.js';

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
          '\n\n🚨🚨🚨 CRITICAL: ASK QUESTIONS ONE AT A TIME 🚨🚨🚨' +
          '\nDO NOT dump all questions in one message.' +
          '\nWait for user response before asking the next question.' +
          '\nNO DEFAULTS - user must explicitly answer each question.' +
          '\n\n=========================================' +
          '\nWORKFLOW - ASK ONE QUESTION, WAIT, THEN NEXT:' +
          '\n=========================================' +
          '\n\nSTEP 1 - CONFIRM DIRECTORY:' +
          '\n  Ask ONLY: "Is this the correct Next.js project directory: [path]?"' +
          '\n  WAIT for user to confirm (yes/no).' +
          '\n\nSTEP 2 - GET API KEY:' +
          '\n  Ask ONLY: "Please provide your Velt API Key (from https://console.velt.dev)"' +
          '\n  WAIT for user response.' +
          '\n\nSTEP 3 - GET AUTH TOKEN:' +
          '\n  Ask ONLY: "Please provide your Velt Auth Token (from https://console.velt.dev)"' +
          '\n  WAIT for user response.' +
          '\n\nSTEP 4 - FEATURE SELECTION (with SKIP option):' +
          '\n  Ask: "Select features to install OR type SKIP for CLI-only (you set up features yourself later):"' +
          '\n    📝 Comments (specify type: freestyle/popover/page/text/inline/tiptap/lexical/slate)' +
          '\n    👥 Presence' +
          '\n    🖱️ Cursors' +
          '\n    🔔 Notifications' +
          '\n    🎥 Recorder' +
          '\n    📄 CRDT (specify editor: tiptap/codemirror/blocknote)' +
          '\n    ─────────────────────────────────────' +
          '\n    ⏭️  SKIP = CLI scaffolding only, no feature integration' +
          '\n  WAIT for user response.' +
          '\n\n=========================================' +
          '\n🚨🚨🚨 IF USER TYPES "SKIP" (case-insensitive): 🚨🚨🚨' +
          '\n=========================================' +
          '\n  SKIP does NOT mean "use defaults"' +
          '\n  SKIP means: RUN CLI ONLY, NO FEATURES, NO DEFAULTS' +
          '\n  ' +
          '\n  IMMEDIATELY call this tool with ONLY these params:' +
          '\n    projectPath: [confirmed path]' +
          '\n    apiKey: [user provided]' +
          '\n    authToken: [user provided]' +
          '\n    mode: "cli-only"' +
          '\n  ' +
          '\n  DO NOT pass features, commentType, or any other params.' +
          '\n  DO NOT ask VeltProvider location.' +
          '\n  DO NOT ask sidebar position.' +
          '\n  DO NOT generate a plan.' +
          '\n  DO NOT use any defaults like "freestyle comments".' +
          '\n  ' +
          '\n  The tool runs CLI scaffolding + basic QA, returns TODO checklist. DONE.' +
          '\n\n=========================================' +
          '\nIF USER SELECTS SPECIFIC FEATURES:' +
          '\n=========================================' +
          '\n  Continue asking ONE question at a time:' +
          '\n\n  STEP 5 - VELTPROVIDER LOCATION:' +
          '\n    Ask: "Where should VeltProvider be installed? (app/layout.tsx recommended, or specify path)"' +
          '\n    WAIT for response.' +
          '\n\n  STEP 6 - SIDEBAR POSITION (only if comments selected):' +
          '\n    Ask: "Sidebar header position? (top-left/top-right/bottom-left/bottom-right)"' +
          '\n    WAIT for response.' +
          '\n\n  STEP 7 - CALL TOOL (PLAN STAGE):' +
          '\n    Call with mode="guided", stage="plan", and all collected params.' +
          '\n    Tool returns implementation PLAN.' +
          '\n\n  STEP 8 - SHOW PLAN, ASK APPROVAL:' +
          '\n    Show plan, ask: "Would you like me to implement this?"' +
          '\n    WAIT for approval.' +
          '\n\n  STEP 9 - IF APPROVED:' +
          '\n    Call with mode="guided", stage="apply", approved=true' +
          '\n    Execute plan, run full QA.' +
          '\n\n=========================================' +
          '\nCRITICAL RULES:' +
          '\n=========================================' +
          '\n• ASK ONE QUESTION AT A TIME - never batch questions' +
          '\n• NO DEFAULTS - user must answer each question explicitly' +
          '\n• SKIP = CLI-only mode, NOT "use defaults"' +
          '\n• SKIP = no features param, no commentType, no defaults' +
          '\n• Guided mode requires TWO tool calls: plan then apply',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the Next.js project directory - Must be confirmed by user',
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
              description: 'Installation mode. Use "cli-only" if user typed SKIP at feature selection. Default: "guided"',
            },
            stage: {
              type: 'string',
              enum: ['plan', 'apply'],
              description: 'For guided mode: "plan" generates the plan (first call), "apply" executes it (second call after approval). Default: "plan"',
            },
            approved: {
              type: 'boolean',
              description: 'Set to true when user has approved the plan and you are calling with stage="apply". Required for apply stage.',
            },
            features: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['comments', 'presence', 'cursors', 'notifications', 'recorder', 'crdt'],
              },
              description: 'Features to install (guided mode only). Can include any combination.',
            },
            commentType: {
              type: 'string',
              enum: ['freestyle', 'popover', 'page', 'text', 'inline', 'tiptap', 'lexical', 'slate'],
              description: 'Type of comments to install (if comments feature selected)',
            },
            crdtEditorType: {
              type: 'string',
              enum: ['tiptap', 'codemirror', 'blocknote'],
              description: 'CRDT editor type (if crdt feature selected)',
            },
            headerPosition: {
              type: 'string',
              enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              description: 'Position for the comments sidebar header. Default: "top-right"',
            },
            veltProviderLocation: {
              type: 'string',
              description: 'Where to install VeltProvider. Default: "app/layout.tsx"',
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

          // Use the unified installer
          const result = await installVeltUnified({
            projectPath: args.projectPath,
            apiKey: args.apiKey,
            authToken: args.authToken,
            mode,
            stage,
            approved,
            features: args?.features || ['comments'],
            commentType: args?.commentType || 'freestyle',
            crdtEditorType: args?.crdtEditorType || null,
            headerPosition: args?.headerPosition || 'top-right',
            veltProviderLocation: args?.veltProviderLocation || 'app/layout.tsx',
            server,
          });

          // Handle CLI-only mode result
          if (result.mode === 'cli-only') {
            return {
              content: [
                {
                  type: 'text',
                  text: result.report || JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Handle guided mode - plan stage
          if (result.mode === 'guided' && result.stage === 'plan' && result.plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `# Installation Plan Generated\n\n${result.plan}\n\n---\n\n## 🎯 NEXT STEPS\n\n1. **PRESENT THIS PLAN TO THE USER** - Show them the plan above\n2. **ASK FOR APPROVAL** - Ask: "Would you like me to implement this plan?"\n3. **IF APPROVED** - Call this tool again with:\n   - mode: "guided"\n   - stage: "apply"\n   - approved: true\n4. **EXECUTE THE PLAN** - Make the file edits described in the plan\n5. **CHECK DEV CONSOLE** - After implementation, check browser console for Velt errors\n\n---\n\n⚠️ **CRITICAL**: Do NOT make any file changes until the user approves this plan.\n\n---\n\n**IMPLEMENTATION RULES:**\n• ONLY implement features the user requested\n• Use .md documentation URLs for component patterns\n• Use CLI-generated: authentication, user setup, document setup\n• DO NOT use VeltTools or ui-customization folder (unless requested)\n• DO NOT use CLI-generated component files as implementation reference`,
                },
              ],
            };
          }

          // Handle guided mode - apply stage
          if (result.mode === 'guided' && result.stage === 'apply') {
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
            server,
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

