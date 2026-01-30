/**
 * Local Velt CLI Execution Utility
 *
 * Handles running the local add-velt CLI with robust resolution:
 * 1. Prefer npm-linked binary (if available via `which add-velt`)
 * 2. Fall back to direct execution from local repo path
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Local CLI repository configuration
const LOCAL_CLI_REPO_PATH = '/Users/yoenzhang/Downloads/add-velt-next-js';
const LOCAL_CLI_BIN_RELATIVE = 'bin/velt.js';

/**
 * Resolves the local CLI binary path
 *
 * @returns {Object} Resolution result { method: 'linked'|'direct', path: string, error?: string }
 */
export function resolveLocalCliBin() {
  // Method 1: Try npm-linked binary via `which`
  try {
    const linkedPath = execSync('which add-velt', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (linkedPath && fs.existsSync(linkedPath)) {
      console.error(`   ✓ Found linked CLI binary: ${linkedPath}`);
      return {
        method: 'linked',
        path: linkedPath,
        command: 'add-velt',
      };
    }
  } catch (err) {
    // `which` failed - binary not in PATH, continue to fallback
    console.error('   ℹ️  Linked binary not found in PATH, trying direct execution...');
  }

  // Method 2: Fall back to direct execution from local repo
  const directPath = path.join(LOCAL_CLI_REPO_PATH, LOCAL_CLI_BIN_RELATIVE);

  if (!fs.existsSync(directPath)) {
    return {
      method: 'error',
      path: null,
      error: `Local CLI not found at ${directPath}. Ensure the add-velt-next-js repo exists.`,
    };
  }

  // Verify the file is readable
  try {
    fs.accessSync(directPath, fs.constants.R_OK);
  } catch (err) {
    return {
      method: 'error',
      path: null,
      error: `Cannot read local CLI at ${directPath}: ${err.message}`,
    };
  }

  console.error(`   ✓ Using direct CLI path: ${directPath}`);
  return {
    method: 'direct',
    path: directPath,
    command: `node "${directPath}"`,
  };
}

/**
 * Maps MCP feature selections to CLI flags
 *
 * CLI Flags supported by local add-velt:
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
  const recognizedCrdtTypes = ['tiptap', 'codemirror', 'reactflow', 'blocknote'];
  const cliFlagCrdtTypes = ['tiptap', 'codemirror', 'reactflow'];
  const isCrdtRecognized = hasCrdt && recognizedCrdtTypes.includes(crdtType.toLowerCase());
  const isCrdtCliSupported = hasCrdt && cliFlagCrdtTypes.includes(crdtType.toLowerCase());
  if (hasCrdt && !isCrdtRecognized) {
    console.error(`   ⚠️  Unknown CRDT type "${crdtType}", skipping CRDT flag`);
  } else if (hasCrdt && !isCrdtCliSupported) {
    console.error(`   ℹ️  CRDT type "${crdtType}" is handled via docs/plan, no CLI flag generated`);
  }

  // Determine flag strategy
  // --all requires a CLI-supported CRDT flag
  const useAllFlag = hasPresence && hasCursors && hasComments && hasNotifications && isCrdtCliSupported;

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
    if (isCrdtCliSupported) {
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
 * Executes the local Velt CLI
 *
 * @param {Object} params
 * @param {string} params.cwd - Working directory (target project path)
 * @param {string[]} [params.flags=[]] - CLI flags to pass
 * @param {Object} [params.env={}] - Additional environment variables
 * @param {number} [params.timeout=120000] - Timeout in ms (default 2 minutes)
 * @returns {Promise<Object>} Execution result
 */
export async function runLocalCli({
  cwd,
  flags = [],
  env = {},
  timeout = 120000,
}) {
  // Resolve CLI binary
  const resolution = resolveLocalCliBin();

  if (resolution.method === 'error') {
    return {
      success: false,
      error: resolution.error,
      method: 'error',
      exitCode: 1,
    };
  }

  // Build environment
  const execEnv = {
    ...process.env,
    ...env,
  };

  // Build command based on resolution method
  let command;
  let args;

  if (resolution.method === 'linked') {
    command = 'add-velt';
    args = flags;
  } else {
    // Direct execution via node
    command = 'node';
    args = [resolution.path, ...flags];
  }

  const fullCommand = `${command} ${args.join(' ')}`;
  console.error(`   📦 Running: ${fullCommand}`);
  console.error(`   📁 CWD: ${cwd}`);

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(command, args, {
      cwd,
      env: execEnv,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32', // Use shell on Windows for path resolution
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        success: false,
        error: `CLI execution timed out after ${timeout}ms`,
        method: resolution.method,
        command: fullCommand,
        exitCode: -1,
        stdout,
        stderr,
      });
    }, timeout);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
      // Echo to stderr for real-time feedback
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
        method: resolution.method,
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
        method: resolution.method,
        command: fullCommand,
        stdout,
        stderr,
        output: stdout + stderr,
      });
    });
  });
}

/**
 * High-level function to run Velt CLI with feature mapping
 *
 * @param {Object} params
 * @param {string} params.projectPath - Target project directory
 * @param {string} params.apiKey - Velt API key
 * @param {string} [params.authToken] - Velt auth token
 * @param {string[]} [params.features=[]] - Features to install
 * @param {string} [params.crdtType=null] - CRDT editor type
 * @param {boolean} [params.force=false] - Force overwrite
 * @param {boolean} [params.legacyPeerDeps=false] - Use legacy peer deps
 * @returns {Promise<Object>} Execution result
 */
export async function executeVeltCli({
  projectPath,
  apiKey,
  authToken = null,
  features = [],
  crdtType = null,
  force = false,
  legacyPeerDeps = false,
}) {
  console.error('\n🔧 Executing local Velt CLI...');

  // Map features to CLI flags
  const flags = mapFeaturesToCliFlags({
    features,
    crdtType,
    force,
    legacyPeerDeps,
  });

  console.error(`   🏷️  Features: ${features.length > 0 ? features.join(', ') : '(core only)'}`);
  console.error(`   🚩 Flags: ${flags.length > 0 ? flags.join(' ') : '(none)'}`);

  // Preview the exact command that will be run
  const resolution = resolveLocalCliBin();
  let previewCommand;
  if (resolution.method === 'linked') {
    previewCommand = `add-velt ${flags.join(' ')}`.trim();
  } else if (resolution.method === 'direct') {
    previewCommand = `node "${resolution.path}" ${flags.join(' ')}`.trim();
  } else {
    previewCommand = `(error: ${resolution.error})`;
  }

  console.error('\n   ═══════════════════════════════════════════════════════════');
  console.error(`   📋 EXACT CLI COMMAND: ${previewCommand}`);
  console.error('   ═══════════════════════════════════════════════════════════\n');

  // Build environment with API credentials
  const env = {
    VELT_API_KEY: apiKey,
    NEXT_PUBLIC_VELT_API_KEY: apiKey,
  };

  if (authToken) {
    env.VELT_AUTH_TOKEN = authToken;
  }

  // Execute CLI
  const result = await runLocalCli({
    cwd: projectPath,
    flags,
    env,
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

  return result;
}

export default {
  resolveLocalCliBin,
  mapFeaturesToCliFlags,
  runLocalCli,
  executeVeltCli,
};
