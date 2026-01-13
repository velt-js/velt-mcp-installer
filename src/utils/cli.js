/**
 * Velt CLI Execution Utilities
 *
 * Handles running the local add-velt CLI tool.
 * This module wraps local-cli.js to provide backward compatibility
 * with existing code while using the new local CLI execution.
 */

import {
  executeVeltCli,
  mapFeaturesToCliFlags,
  resolveLocalCliBin,
} from './local-cli.js';

/**
 * Runs the local Velt CLI with specified options
 *
 * @param {Object} params
 * @param {string} params.installDir - Directory to install Velt in
 * @param {string} params.apiKey - Velt API key
 * @param {string} [params.authToken] - Optional auth token
 * @param {string[]} [params.features=[]] - Features to install (for guided mode)
 * @param {string} [params.crdtType=null] - CRDT editor type if 'crdt' feature selected
 * @param {boolean} [params.force=false] - Force overwrite existing files
 * @param {boolean} [params.legacyPeerDeps=false] - Use legacy peer deps (npm only)
 * @returns {Promise<Object>} CLI execution result
 */
export async function runVeltCli({
  installDir,
  apiKey,
  authToken = null,
  features = [],
  crdtType = null,
  force = false,
  legacyPeerDeps = false,
}) {
  try {
    // Log what we're about to do
    console.error('\n📦 Velt CLI Execution');
    console.error(`   Directory: ${installDir}`);
    console.error(`   API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : '(not provided)'}`);

    // Execute via local CLI
    const result = await executeVeltCli({
      projectPath: installDir,
      apiKey,
      authToken,
      features,
      crdtType,
      force,
      legacyPeerDeps,
    });

    // Add backward-compatible fields
    return {
      success: result.success,
      exitCode: result.exitCode,
      output: result.output,
      command: result.command,
      method: result.method, // 'linked' or 'direct' - new field
      error: result.error,
    };
  } catch (error) {
    console.error(`   ❌ CLI execution error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      exitCode: 1,
      method: 'error',
    };
  }
}

/**
 * Runs CLI with feature-specific flags (for guided mode)
 *
 * This is the recommended function for the guided installation path
 * where users have selected specific features.
 *
 * @param {Object} params
 * @param {string} params.projectPath - Target project directory
 * @param {string} params.apiKey - Velt API key
 * @param {string} [params.authToken] - Auth token
 * @param {string[]} params.features - Features: 'comments', 'notifications', 'crdt', 'presence', 'cursors', 'recorder'
 * @param {string} [params.commentType] - Comment type (not used by CLI, for plan only)
 * @param {string} [params.crdtEditorType] - CRDT editor: 'tiptap', 'codemirror', 'reactflow'
 * @param {boolean} [params.force=false] - Force overwrite
 * @returns {Promise<Object>} CLI execution result
 */
export async function runVeltCliWithFeatures({
  projectPath,
  apiKey,
  authToken = null,
  features = [],
  commentType = null,
  crdtEditorType = null,
  force = false,
}) {
  console.error('\n🎯 Running Velt CLI with feature flags');

  // Map MCP features to CLI-compatible features
  // The local CLI supports: comments, notifications, presence, cursors, and CRDT types
  // Only 'recorder' is handled by the MCP guided plan (not supported by CLI)
  const cliFeatures = [];

  if (features.includes('comments')) {
    cliFeatures.push('comments');
  }
  if (features.includes('notifications')) {
    cliFeatures.push('notifications');
  }
  if (features.includes('presence')) {
    cliFeatures.push('presence');
  }
  if (features.includes('cursors')) {
    cliFeatures.push('cursors');
  }
  if (features.includes('crdt') && crdtEditorType) {
    cliFeatures.push('crdt');
  }

  console.error(`   Requested features: ${features.join(', ')}`);
  console.error(`   CLI features to forward: ${cliFeatures.length > 0 ? cliFeatures.join(', ') : '(core only)'}`);

  if (crdtEditorType) {
    console.error(`   CRDT Editor: ${crdtEditorType}`);
  }

  return runVeltCli({
    installDir: projectPath,
    apiKey,
    authToken,
    features: cliFeatures,
    crdtType: crdtEditorType,
    force,
  });
}

/**
 * Runs CLI in core-only mode (for SKIP/CLI-only path)
 *
 * This runs the CLI without any feature flags, generating only
 * the core scaffold files (VeltInitializeDocument, VeltInitializeUser, VeltCollaboration).
 *
 * @param {Object} params
 * @param {string} params.projectPath - Target project directory
 * @param {string} params.apiKey - Velt API key
 * @param {string} [params.authToken] - Auth token
 * @param {boolean} [params.force=false] - Force overwrite
 * @returns {Promise<Object>} CLI execution result
 */
export async function runVeltCliCoreOnly({
  projectPath,
  apiKey,
  authToken = null,
  force = false,
}) {
  console.error('\n📦 Running Velt CLI (core only, no feature flags)');

  return runVeltCli({
    installDir: projectPath,
    apiKey,
    authToken,
    features: [], // No features = core scaffold only
    crdtType: null,
    force,
  });
}

/**
 * Gets CLI resolution info (for diagnostics/validation)
 *
 * @returns {Object} CLI resolution result
 */
export function getCliResolutionInfo() {
  return resolveLocalCliBin();
}

/**
 * Gets the CLI flags that would be used for given features
 *
 * @param {Object} params - Same as mapFeaturesToCliFlags
 * @returns {string[]} Array of CLI flags
 */
export function previewCliFlags(params) {
  return mapFeaturesToCliFlags(params);
}

export default {
  runVeltCli,
  runVeltCliWithFeatures,
  runVeltCliCoreOnly,
  getCliResolutionInfo,
  previewCliFlags,
};
