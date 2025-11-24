/**
 * Velt CLI Execution Utilities
 * 
 * Handles running the add-velt-cli tool via npx
 */

import { execSync } from 'child_process';

/**
 * Runs the Velt CLI with specified options using npx
 * 
 * @param {Object} params
 * @param {string} params.installDir - Directory to install Velt in
 * @param {string} params.apiKey - Velt API key
 * @param {string} params.authToken - Optional auth token
 * @returns {Promise<Object>} CLI execution result
 */
export async function runVeltCli({ installDir, apiKey, authToken }) {
  try {
    // Set environment variables for CLI
    const env = {
      ...process.env,
      VELT_API_KEY: apiKey,
      VELT_AUTH_TOKEN: authToken,
      NEXT_PUBLIC_VELT_API_KEY: apiKey,
    };

    // Run CLI command using npx
    // npx will download and execute @veltdev/add-velt if not already installed
    const command = `npx @veltdev/add-velt add --all`;

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
      command: 'npx @veltdev/add-velt add --all',
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

