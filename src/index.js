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
          '🌟 RECOMMENDED: Interactive Velt installation with AI-guided implementation. ' +
          'This tool orchestrates setup and generates a PLAN for you to execute. ' +
          '\n\nWORKFLOW TO FOLLOW - YOU MUST ASK ALL QUESTIONS BEFORE CALLING THE TOOL: ' +
          '\n\nSTEP 1 - CONFIRM DIRECTORY:' +
          '  Ask user: "Is this the correct directory: [show directory]?" ' +
          '  Wait for confirmation before proceeding ' +
          '\n\nSTEP 2 - SELECT FEATURES:' +
          '  Ask user: "What features do you want to install?" ' +
          '  Show ALL options: ' +
          '    📝 Comments - Choose type:' +
          '      • Freestyle (click anywhere on page)' +
          '      • Popover (attach to specific elements)' +
          '      • Page (page-level comments)' +
          '      • Text (select text to comment)' +
          '      • Inline (inline comments in content)' +
          '      • Tiptap (for Tiptap editor integration)' +
          '      • Lexical (for Lexical editor integration)' +
          '      • Slate (for SlateJS editor integration)' +
          '    👥 Presence - show live users with avatars ' +
          '    🖱️ Cursors - real-time cursor tracking ' +
          '    🔔 Notifications - notification center ' +
          '    🎥 Recorder - screen/audio recording ' +
          '  User can choose ANY combination ' +
          '  NOTE: If user mentions Tiptap, Lexical, or Slate, use the corresponding comment type ' +
          '\n\nSTEP 3 - GET API KEY (REQUIRED):' +
          '  Ask user: "Please provide your Velt API Key (from https://console.velt.dev)" ' +
          '  This is REQUIRED - do not proceed without it ' +
          '\n\nSTEP 4 - GET AUTH TOKEN (REQUIRED):' +
          '  Ask user: "Please provide your Velt Auth Token (from https://console.velt.dev)" ' +
          '  This is REQUIRED - do not proceed without it ' +
          '\n\nSTEP 5 - SIDEBAR POSITION (if comments selected):' +
          '  Ask user: "Where should the comments sidebar header be positioned?" ' +
          '  Options: top-left, top-right, bottom-left, bottom-right ' +
          '\n\nSTEP 6 - CONFIRM DEV SERVER:' +
          '  Ask user: "Make sure your dev server is running (npm/pnpm/yarn run dev). Is it running on localhost?" ' +
          '\n\nSTEP 7 - CALL TOOL:' +
          '  Only after collecting ALL information above, call this tool with complete parameters ' +
          '  IMPORTANT: Set commentType to the specific type user wants (freestyle/popover/page/text/inline) ' +
          '  IMPORTANT: Set features array to ALL features user wants (e.g., ["comments", "presence", "cursors"]) ' +
          '  DO NOT call the tool until you have: projectPath, apiKey, authToken, commentType, features ' +
          '\n\nThe tool will: ' +
          '- Run Velt CLI to install base files (auth, user setup, document setup) ' +
          '- Take a screenshot of their running app ' +
          '- Scan the codebase and detect libraries ' +
          '- Fetch implementation details from Velt Docs markdown URLs (ex: https://docs.velt.dev/[feature]/setup.md) ' +
          '- Generate a detailed IMPLEMENTATION PLAN ' +
          '\n\nCRITICAL - WHAT TO USE FROM VELT CLI vs .MD DOCS: ' +
          '- FROM CLI: ONLY use authentication setup, user setup, and document setup ' +
          '- FROM .MD DOCS: Get ALL component implementations (VeltComments, VeltPresence, VeltCursor, etc.) ' +
          '- NEVER use: VeltTools, ui-customization folder (unless user explicitly asks for customization) ' +
          '- NEVER install: Components the user did not request ' +
          '\n\nAFTER CALLING THIS TOOL: ' +
          '- The tool returns a PLAN in markdown format ' +
          '- FIRST: Present the plan to the user so they can review it ' +
          '- THEN: Ask if they want you to execute the plan ' +
          '- FINALLY: Execute the plan step-by-step if they confirm ' +
          '- ONLY implement features the user requested - DO NOT add extra features ' +
          '- Use .md documentation URLs for component implementation patterns ' +
          '- DO NOT use CLI-generated component files as reference (except auth/user/doc setup) ' +
          '- Replace placeholders with actual API keys provided by user ' +
          '- AT THE END: Check browser DevTools Console for Velt errors/warnings and use Velt Docs MCP to resolve any issues ' +
          '\n\nPOST-INSTALLATION SUPPORT: ' +
          '- For questions, fixes, or issues AFTER installation, use the Velt Docs MCP server to get answers ' +
          '- Query the Velt Docs MCP for feature customization, troubleshooting, and advanced configuration ' +
          '- Example query: "How do I customize presence avatars?" or "How to fix authentication errors in Velt?" ' +
          '\n\nDEV TOOLS & CONSOLE WARNINGS: ' +
          '- After installation, tell the user to check their browser DevTools console (F12) for Velt warnings ' +
          '- The Velt SDK logs helpful diagnostic messages about configuration issues, API key problems, etc. ' +
          '- If users encounter issues, ask them to share console warnings, then query Velt Docs MCP to find solutions ' +
          '\n\nIMPORTANT: ' +
          '- This tool does NOT complete the installation - it prepares and plans it ' +
          '- YOU must PRESENT the plan to the user FIRST before executing ' +
          '- The plan includes code examples and detailed instructions ' +
          '- Follow the plan\'s checklist sequentially after user confirms',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the Next.js project directory - Must be confirmed by user',
            },
            apiKey: {
              type: 'string',
              description: 'Velt API Key from https://console.velt.dev - REQUIRED, ask user for this',
            },
            authToken: {
              type: 'string',
              description: 'Velt Auth Token from https://console.velt.dev - REQUIRED, ask user for this',
            },
            commentType: {
              type: 'string',
              enum: ['freestyle', 'popover', 'page', 'text', 'inline', 'tiptap', 'lexical', 'slate'],
              description: 'Type of comments to install - ASK THE USER. Options: freestyle (click anywhere), popover (attach to elements), page (page-level), text (select text), inline (inline comments), tiptap (Tiptap editor integration), lexical (Lexical editor integration), slate (SlateJS editor integration)',
            },
            headerPosition: {
              type: 'string',
              enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              description: 'Position for the comments sidebar header - ASK THE USER (default: top-right)',
            },
            features: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['comments', 'presence', 'cursors', 'notifications', 'recorder'],
              },
              description: 'Features to install - Can include any combination of: comments, presence, cursors, notifications, recorder',
            },
            targetArea: {
              type: 'string',
              description: 'Optional: User description of where they want comments (e.g., "header", "main content")',
            },
          },
          required: ['projectPath', 'apiKey', 'authToken', 'commentType'],
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
            throw new Error('projectPath is required. Please ask the user: "Is this the correct directory: [show directory]?"');
          }
          if (!args?.apiKey) {
            throw new Error('apiKey is required. Please ask the user: "Please provide your Velt API Key (from https://console.velt.dev)"');
          }
          if (!args?.authToken) {
            throw new Error('authToken is required. Please ask the user: "Please provide your Velt Auth Token (from https://console.velt.dev)"');
          }
          if (!args?.commentType) {
            throw new Error('commentType is required. Please ask the user: "What type of comments would you like? (Freestyle or Popover)"');
          }

          // Use the new plan-based installer
          const planResult = await installVeltWithPlan({
            projectPath: args.projectPath,
            commentType: args.commentType,
            headerPosition: args?.headerPosition || 'top-right',
            targetArea: args?.targetArea || '',
            apiKey: args.apiKey,
            authToken: args.authToken,
            features: args?.features || ['comments'],
            server,
          });

          // Return the plan for the AI to execute
          if (planResult.status === 'plan_generated' && planResult.plan) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Installation preparation complete! Here's your implementation plan:\n\n${planResult.plan}\n\n---\n\n🚨 CRITICAL IMPLEMENTATION RULES - READ BEFORE EXECUTING:\n\n**WHAT TO IMPLEMENT:**\n✅ ONLY implement features the user requested\n✅ Use .md documentation URLs for component patterns\n✅ Use CLI-generated: authentication, user setup, document setup\n\n**WHAT NOT TO IMPLEMENT:**\n❌ DO NOT use VeltTools component\n❌ DO NOT use ui-customization folder (unless user asks for customization)\n❌ DO NOT install components user didn't request (e.g., if user wants Comments, don't add Notifications)\n❌ DO NOT use CLI-generated component files as reference for implementation\n\n**IMPLEMENTATION SOURCE:**\n📄 Get component code from: https://docs.velt.dev/[feature]/setup.md\n📄 NOT from CLI-generated files in components/velt/*\n\n---\n\n🎯 NEXT STEPS:\n\n1. **PRESENT THIS PLAN TO THE USER** - Show them the plan above so they can review it\n2. **ASK FOR CONFIRMATION** - Ask: "Would you like me to execute this installation plan step-by-step?"\n3. **EXECUTE THE PLAN** - Once confirmed, follow each step to complete the installation\n4. **CHECK DEV CONSOLE** - After installation, check browser console for Velt errors/warnings\n5. **RESOLVE ERRORS** - If errors found, query Velt Docs MCP for solutions\n\n---\n\nIMPORTANT REMINDERS:\n• Replace all placeholders (YOUR_VELT_API_KEY, YOUR_VELT_AUTH_TOKEN) with actual values\n• ONLY implement what user requested - nothing more\n• Use .md docs for component implementation, NOT CLI files\n• Follow the plan's checklist sequentially\n• ALWAYS check DevTools Console (F12) for Velt errors at the end\n\n---\n\nCOMMON VELT ERRORS TO CHECK FOR:\n• "Please set document id to continue" → Query Velt Docs MCP: "How do I set document ID in Velt?"\n• "Velt API key not found" → Check that YOUR_VELT_API_KEY was replaced\n• "Failed to authenticate user" → Query Velt Docs MCP: "How to fix Velt authentication errors?"\n\n---\n\nAFTER INSTALLATION:\n1. 🔍 CHECK DEV CONSOLE: Open browser DevTools Console (F12) and look for Velt messages\n2. 📚 USE VELT DOCS MCP: Query Velt Docs MCP to resolve any errors or for customization\n3. 🎯 REFERENCE DOCS: All docs at https://docs.velt.dev with .md URLs at https://docs.velt.dev/[feature]/[page].md`,
                },
              ],
            };
          } else {
            // If plan generation failed, return error details
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(planResult, null, 2),
                },
              ],
              isError: true,
            };
          }
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

