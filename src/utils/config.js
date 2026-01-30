/**
 * Configuration Collection Utilities
 * 
 * Handles collecting user configuration from .env file
 */

import fs from 'fs';
import path from 'path';

/**
 * Reads environment variables from .env.local or .env file
 * 
 * @param {string} projectPath - Project root path
 * @returns {Object} Environment variables object
 */
function readEnvFile(projectPath) {
  // Ensure we're using absolute path - never search outside the specified directory
  const absolutePath = path.resolve(projectPath);
  
  // Process .env first, then .env.local so local overrides take precedence
  // (later values overwrite earlier ones in the envVars object)
  const envFiles = [
    path.join(absolutePath, '.env'),
    path.join(absolutePath, '.env.local'),
  ];

  const envVars = {};
  
  console.error(`   📂 Reading .env files from: ${absolutePath}`);

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      try {
        console.error(`   ✓ Found: ${path.basename(envFile)}`);
        const content = fs.readFileSync(envFile, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          // Skip comments and empty lines
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) {
            continue;
          }

          // Parse KEY=VALUE format
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }

            envVars[key] = value;
            // Log found keys (but not values for security)
            if (key.includes('VELT') || key.includes('API')) {
              console.error(`      ✓ Found ${key}`);
            }
          }
        }
      } catch (error) {
        // Continue to next file if one fails
        console.error(`   ⚠️  Could not read ${path.basename(envFile)}: ${error.message}`);
      }
    } else {
      console.error(`   ⚠️  Not found: ${path.basename(envFile)}`);
    }
  }

  return envVars;
}

/**
 * Collects installation configuration from .env file or provided parameters
 * 
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @param {string} [params.apiKey] - API key provided directly (optional, will read from .env if not provided)
 * @param {string} [params.authToken] - Auth token provided directly (optional, will read from .env if not provided)
 * @returns {Promise<Object>} Configuration result
 */
export async function collectConfiguration({ projectPath, apiKey: providedApiKey, authToken: providedAuthToken }) {
  try {
    // Resolve absolute path to ensure we're reading from the correct directory
    const absoluteProjectPath = path.resolve(projectPath);
    
    // If API key provided directly, use it; otherwise read from .env file
    let apiKey = providedApiKey;
    let authToken = providedAuthToken;
    
    if (!apiKey) {
      // Read from .env file ONLY in the specified project directory
      console.error(`   📖 API key not provided, reading from .env files...`);
      const envVars = readEnvFile(absoluteProjectPath);
      apiKey = envVars.VELT_API_KEY || envVars.NEXT_PUBLIC_VELT_API_KEY;
      if (!authToken) {
        authToken = envVars.VELT_AUTH_TOKEN;
      }
    } else {
      console.error(`   ✓ Using API key provided as parameter`);
      if (!authToken) {
        // Still try to read auth token from .env if not provided
        const envVars = readEnvFile(absoluteProjectPath);
        authToken = envVars.VELT_AUTH_TOKEN;
      }
    }

    // API key is required - must be in .env file
    if (!apiKey) {
      const envLocalPath = path.join(absoluteProjectPath, '.env.local');
      const envPath = path.join(absoluteProjectPath, '.env');
      const envLocalExists = fs.existsSync(envLocalPath);
      const envExists = fs.existsSync(envPath);
      
      let errorMessage = `API key not found in ${absoluteProjectPath}\n\n`;
      errorMessage += `Checked files:\n`;
      errorMessage += `  - ${envLocalPath} ${envLocalExists ? '(exists but no VELT_API_KEY found)' : '(not found)'}\n`;
      errorMessage += `  - ${envPath} ${envExists ? '(exists but no VELT_API_KEY found)' : '(not found)'}\n\n`;
      errorMessage += `Please add VELT_API_KEY or NEXT_PUBLIC_VELT_API_KEY to ${envLocalExists ? '.env.local' : '.env'} file in ${absoluteProjectPath}\n\n`;
      errorMessage += `Example:\nVELT_API_KEY=your_api_key_here\n\n`;
      errorMessage += `Get your API key from: https://console.velt.dev`;
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: {
        installDir: absoluteProjectPath,
        apiKey: apiKey,
        authToken: authToken || null,
        source: 'env-file',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}


