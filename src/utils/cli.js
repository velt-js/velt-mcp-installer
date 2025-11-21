/**
 * Velt CLI Execution Utilities
 * 
 * Handles running the add-velt-cli tool
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gets the path to the Velt CLI
 * 
 * @returns {string|null} Path to velt.js CLI or null if not found
 */
function getVeltCliPath() {
  // Check multiple possible locations
  const possiblePaths = [
    // From .velt-agent-config.json
    process.env.VELT_CLI_PATH,
    // Common locations
    path.join(process.cwd(), 'node_modules', '@veltdev', 'add-velt-next-js', 'bin', 'velt.js'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.velt-cli', 'bin', 'velt.js'),
    // Hardcoded fallback (for POC)
    '/Users/yoenzhang/Downloads/add-velt-next-js/bin/velt.js',
    '/Users/samarthgoel/Documents/add-velt-next-js/bin/velt.js',
  ];

  for (const cliPath of possiblePaths) {
    if (cliPath && fs.existsSync(cliPath)) {
      return cliPath;
    }
  }

  return null;
}

/**
 * Runs the Velt CLI with specified options
 * 
 * @param {Object} params
 * @param {string} params.installDir - Directory to install Velt in
 * @param {string} params.apiKey - Velt API key
 * @param {string} params.authToken - Optional auth token
 * @returns {Promise<Object>} CLI execution result
 */
export async function runVeltCli({ installDir, apiKey, authToken }) {
  try {
    const cliPath = getVeltCliPath();

    if (!cliPath) {
      return {
        success: false,
        error: 'Velt CLI not found. Please ensure add-velt-next-js is installed or set VELT_CLI_PATH environment variable.',
      };
    }

    // Set environment variables for CLI
    const env = {
      ...process.env,
      VELT_API_KEY: apiKey,
      VELT_AUTH_TOKEN: authToken,
      NEXT_PUBLIC_VELT_API_KEY: apiKey,
    };

    // Run CLI command
    // Note: For POC, we'll use --all flag to install everything
    // In production, you'd want more granular control
    const command = `node "${cliPath}" add --all --directory "${installDir}"`;

    let output;
    let exitCode = 0;

    try {
      output = execSync(command, {
        cwd: installDir,
        env,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    } catch (error) {
      exitCode = error.status || 1;
      output = error.stdout?.toString() || error.message;
    }

    const result = {
      success: exitCode === 0,
      exitCode,
      output,
      cliPath,
    };

    // Debug logging
    console.error(`CLI execution result:`, result);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      exitCode: 1,
    };
  }
}

