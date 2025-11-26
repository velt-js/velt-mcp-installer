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
          '\n\nWORKFLOW TO FOLLOW (Ask these questions in order): ' +
          '1) Ask user: "Is this the correct directory: [show directory]?" - Wait for confirmation ' +
          '2) Ask user: "What features do you want to install?" ' +
          '   Options: ' +
          '   - Comments (Freestyle - click anywhere, or Popover - attach to elements) ' +
          '   - Presence (live cursors and avatars) ' +
          '   - Notifications ' +
          '   - Recorder ' +
          '   Tell them: "For now, we\'ll focus on Comments. Choose Freestyle or Popover." ' +
          '3) Ask user: "Please provide your Velt API Key (from https://console.velt.dev)" ' +
          '4) Ask user: "Please provide your Velt Auth Token (from https://console.velt.dev)" ' +
          '5) Ask user: "Where should the comments sidebar header be positioned? (top-left, top-right, bottom-left, bottom-right)" ' +
          '6) Ask user: "Make sure your dev server is running (pnpm run dev). Is it running?" ' +
          '7) Call this tool with all the collected information ' +
          '\n\nThe tool will: ' +
          '- Run Velt CLI to install base files ' +
          '- Take a screenshot of their app ' +
          '- Scan the codebase and detect libraries ' +
          '- Query Velt Docs (with fallback to docs.velt.dev) for implementation details ' +
          '- Generate a detailed IMPLEMENTATION PLAN ' +
          '\n\nAFTER CALLING THIS TOOL: ' +
          '- The tool returns a PLAN in markdown format (like Cursor\'s plan mode) ' +
          '- YOU (the AI) must read the plan and execute it step-by-step ' +
          '- Follow each step in the plan to complete the installation ' +
          '- Modify the detected files according to the plan\'s instructions ' +
          '- Replace placeholders with actual API keys provided by user ' +
          '\n\nIMPORTANT: ' +
          '- This tool does NOT complete the installation - it prepares and plans it ' +
          '- YOU must execute the returned plan to finish the installation ' +
          '- The plan includes code examples and detailed instructions ' +
          '- Follow the plan\'s checklist sequentially',
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
              enum: ['freestyle', 'popover'],
              description: 'Type of comments to install (freestyle or popover) - ASK THE USER',
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
                enum: ['comments', 'presence', 'notifications', 'recorder'],
              },
              description: 'Features to install - For now, only "comments" is fully supported',
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
                  text: `Installation preparation complete! Here's your implementation plan:\n\n${planResult.plan}\n\n---\n\nIMPORTANT: Please follow this plan step-by-step to complete the Velt installation. Each step includes detailed instructions and code examples. Make sure to replace all placeholders (YOUR_VELT_API_KEY, YOUR_VELT_AUTH_TOKEN) with the actual values provided by the user.`,
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

