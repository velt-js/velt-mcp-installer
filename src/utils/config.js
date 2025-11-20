/**
 * Configuration Collection Utilities
 * 
 * Handles collecting user configuration via MCP prompts
 */

import path from 'path';
import fs from 'fs';
import { GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Collects installation configuration from user using MCP prompts
 * 
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @param {Server} params.server - MCP server instance
 * @returns {Promise<Object>} Configuration result
 */
export async function collectConfiguration({ projectPath, server }) {
  try {
    // First, try to read from existing config or environment
    const configPath = path.join(projectPath, '.velt-agent-config.json');
    let existingConfig = {};
    
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check if we have API key from env/config
    const apiKeyFromEnv = process.env.VELT_API_KEY || existingConfig.apiKey;
    const authTokenFromEnv = process.env.VELT_AUTH_TOKEN || existingConfig.authToken;

    // If we have API key, use it (no prompt needed)
    if (apiKeyFromEnv) {
      return {
        success: true,
        data: {
          installDir: projectPath,
          apiKey: apiKeyFromEnv,
          authToken: authTokenFromEnv || null,
          source: 'environment',
        },
      };
    }

    // Otherwise, use MCP prompts to collect configuration
    // Note: In practice, the IDE will call the prompt handler
    // For now, we'll return a prompt request that the IDE can handle
    
    // The actual prompt handling happens in the server's GetPromptRequestSchema handler
    // This function returns instructions for the IDE to show the prompt
    
    return {
      success: false,
      error: 'API key required. Please provide VELT_API_KEY environment variable or use the MCP prompt.',
      promptRequired: true,
      promptName: 'velt_configuration',
      data: {
        installDir: projectPath,
        apiKey: null,
        authToken: null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Processes prompt response from user
 * 
 * @param {Object} promptResponse - Response from MCP prompt
 * @returns {Object} Configuration data
 */
export function processPromptResponse(promptResponse) {
  // Extract values from prompt response
  // The format depends on how the IDE sends the response
  const args = promptResponse.arguments || promptResponse;
  
  return {
    installDir: args.installDir || '.',
    apiKey: args.apiKey,
    authToken: args.authToken || null,
    source: 'prompt',
  };
}

