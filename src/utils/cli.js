/**
 * Velt CLI Execution Utilities
 *
 * Handles running the Velt CLI via npx @velt-js/add-velt.
 * This module spawns npx to execute the published npm package.
 */

import { spawn } from 'child_process';

/**
 * Maps MCP feature selections to CLI flags
 *
 * CLI Flags supported by @velt-js/add-velt:
 *   --presence          Add presence (VeltPresence - shows online users)
 *   --cursors           Add cursors (VeltCursor - shows live cursor positions)
 *   --comments          Add comments (VeltComments, VeltCommentsSidebar)
 *   --notifications     Add notifications (VeltNotificationsTool)
 *   --reactflow-crdt    Add ReactFlow CRDT
 *   --tiptap-crdt       Add Tiptap CRDT
 *   --codemirror-crdt   Add CodeMirror CRDT
 *   --all               Enable presence + cursors + comments + notifications + CRDT (REQUIRES a CRDT flag!)
 *   --force, -f         Force overwrite existing files
 *   --legacy-peer-deps  Use legacy peer deps (npm only)
 *
 * @param {Object} params
 * @param {string[]} [params.features=[]] - Features to install: 'presence', 'cursors', 'comments', 'notifications', 'crdt'
 * @param {string} [params.crdtType=null] - CRDT type: 'tiptap', 'codemirror', 'reactflow'
 * @param {boolean} [params.force=false] - Force overwrite files
 * @param {boolean} [params.legacyPeerDeps=false] - Use legacy peer deps
 * @returns {string[]} Array of CLI flags
 */
export function mapFeaturesToCliFlags({
  features = [],
  crdtType = null,
  force = false,
  legacyPeerDeps = false,
}) {
  const flags = [];

  // Normalize features to lowercase
  const normalizedFeatures = features.map(f => f.toLowerCase());

  const hasPresence = normalizedFeatures.includes('presence');
  const hasCursors = normalizedFeatures.includes('cursors');
  const hasComments = normalizedFeatures.includes('comments');
  const hasNotifications = normalizedFeatures.includes('notifications');
  const hasCrdt = normalizedFeatures.includes('crdt') && crdtType;

  // Validate CRDT type if provided
  const validCrdtTypes = ['tiptap', 'codemirror', 'reactflow', 'blocknote'];
  const isCrdtValid = hasCrdt && validCrdtTypes.includes(crdtType.toLowerCase());
  if (hasCrdt && !isCrdtValid) {
    console.error(`   ⚠️  Unknown CRDT type "${crdtType}", skipping CRDT flag`);
  }

  // Determine flag strategy
  // --all requires a valid CRDT flag, so only use it when we have all features with a valid CRDT type
  const useAllFlag = hasPresence && hasCursors && hasComments && hasNotifications && isCrdtValid;

  if (useAllFlag) {
    // Use --all with CRDT type
    flags.push('--all');
    flags.push(`--${crdtType.toLowerCase()}-crdt`);
  } else {
    // Build individual flags
    if (hasPresence) {
      flags.push('--presence');
    }
    if (hasCursors) {
      flags.push('--cursors');
    }
    if (hasComments) {
      flags.push('--comments');
    }
    if (hasNotifications) {
      flags.push('--notifications');
    }
    if (isCrdtValid) {
      flags.push(`--${crdtType.toLowerCase()}-crdt`);
    }
  }

  // Add installation flags
  if (force) {
    flags.push('--force');
  }
  if (legacyPeerDeps) {
    flags.push('--legacy-peer-deps');
  }

  return flags;
}

/**
 * Runs the Velt CLI via npx @velt-js/add-velt
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

    // Map features to CLI flags
    const flags = mapFeaturesToCliFlags({
      features,
      crdtType,
      force,
      legacyPeerDeps,
    });

    console.error(`   🏷️  Features: ${features.length > 0 ? features.join(', ') : '(core only)'}`);
    console.error(`   🚩 Flags: ${flags.length > 0 ? flags.join(' ') : '(none)'}`);

    // Build environment with API credentials
    const env = {
      ...process.env,
      VELT_API_KEY: apiKey,
      NEXT_PUBLIC_VELT_API_KEY: apiKey,
    };

    if (authToken) {
      env.VELT_AUTH_TOKEN = authToken;
    }

    // Build npx command
    const npxArgs = ['@velt-js/add-velt', ...flags];
    const fullCommand = `npx ${npxArgs.join(' ')}`;

    console.error('\n   ═══════════════════════════════════════════════════════════');
    console.error(`   📋 EXACT CLI COMMAND: ${fullCommand}`);
    console.error('   ═══════════════════════════════════════════════════════════\n');

    // Execute via npx
    const result = await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      const timeout = 120000;

      const proc = spawn('npx', npxArgs, {
        cwd: installDir,
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });

      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({
          success: false,
          error: `CLI execution timed out after ${timeout}ms`,
          method: 'npx',
          command: fullCommand,
          exitCode: -1,
          stdout,
          stderr,
        });
      }, timeout);

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        process.stderr.write(data);
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      proc.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: err.message,
          method: 'npx',
          command: fullCommand,
          exitCode: 1,
          stdout,
          stderr,
        });
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          exitCode: code,
          method: 'npx',
          command: fullCommand,
          stdout,
          stderr,
          output: stdout + stderr,
        });
      });
    });

    // Log result summary
    if (result.success) {
      console.error(`\n   ✅ CLI completed successfully (method: ${result.method})`);
    } else {
      console.error(`\n   ⚠️  CLI exited with code ${result.exitCode} (method: ${result.method})`);
      if (result.error) {
        console.error(`   Error: ${result.error}`);
      }
    }

    return {
      success: result.success,
      exitCode: result.exitCode,
      output: result.output,
      command: result.command,
      method: result.method,
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
  // The CLI supports: comments, notifications, presence, cursors, and CRDT types
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
  return {
    method: 'npx',
    command: 'npx @velt-js/add-velt',
    path: null,
  };
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
  mapFeaturesToCliFlags,
};
