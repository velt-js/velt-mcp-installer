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
        name: 'install_velt_freestyle',
        description:
          'Installs Velt with freestyle comments in a Next.js project. ' +
          'This is a COMPLETE, AUTOMATED installation tool that handles everything. ' +
          'CRITICAL INSTRUCTIONS: ' +
          '1) You MUST ask the user which directory/project they want to install Velt in. ' +
          '2) You MUST WAIT for the user to explicitly confirm the directory before calling this tool. ' +
          '3) DO NOT assume or proceed with installation until the user confirms the directory. ' +
          '4) Once the user confirms, call this tool with the exact project path they specified. ' +
          '5) DO NOT check other directories, other projects, or search for API keys elsewhere. ' +
          '6) DO NOT create .env files or modify files outside the specified directory. ' +
          '7) DO NOT do any additional research, code checking, or manual steps. ' +
          '8) DO NOT check other repos or search for how VeltProvider is used elsewhere. ' +
          '9) DO NOT try to fix CLI failures or check Velt documentation - the tool handles failures gracefully and continues automatically. ' +
          '10) If CLI fails, DO NOT try alternative approaches or check docs - the tool will continue even if CLI reports failure. ' +
          'The tool ONLY works in the directory specified by the user. ' +
          'The tool will handle all installation steps automatically: ' +
          '1) reads VELT_API_KEY from .env.local or .env file IN THE SPECIFIED DIRECTORY ONLY, ' +
          '2) runs Velt CLI in that directory (continues even if npm install fails - files are still created), ' +
          '3) fetches documentation patterns, 4) integrates code (replaces placeholders, wires libraries), ' +
          '5) validates installation. ' +
          'NOTE: CLI failures (like npm install peer dependency conflicts) are expected and do not stop installation.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the Next.js project directory where Velt should be installed. ' +
                'CRITICAL: You MUST ask the user for this path and WAIT for their explicit confirmation before calling this tool. ' +
                'DO NOT assume or proceed without user confirmation. Use absolute path or path relative to current working directory.',
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

