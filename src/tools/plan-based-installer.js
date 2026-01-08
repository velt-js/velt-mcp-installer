/**
 * Plan-Based Velt Installer
 *
 * @deprecated Use unified-installer.js instead. This module is kept for backward compatibility.
 * The unified installer provides both guided and CLI-only modes with better UX.
 *
 * Orchestrates installation up to CLI completion, then returns a PLAN
 * for the AI to complete the implementation.
 */

import { runVeltCli } from '../utils/cli.js';
import { detectLibraries } from '../utils/velt-mcp.js';
import { takeScreenshot } from '../utils/screenshot.js';
import { detectCommentPlacement } from '../utils/comment-detector.js';
import { fetchCommentImplementation, fetchCrdtImplementation, fetchFeatureImplementation } from '../utils/velt-docs-fetcher.js';
import { createVeltCommentsPlan, createMultiFeaturePlan } from '../utils/plan-formatter.js';
import path from 'path';
import fs from 'fs';

/**
 * Plan-based installation workflow
 *
 * Executes steps 1-6, then returns a PLAN for AI to complete
 *
 * @param {Object} params - Installation parameters
 * @param {string} params.projectPath - Path to Next.js project
 * @param {string} params.apiKey - Velt API key (provided by user)
 * @param {string} params.authToken - Velt auth token (provided by user)
 * @param {string} params.commentType - Comment type (freestyle, popover, page, stream, text)
 * @param {string} [params.headerPosition] - Header position
 * @param {string} [params.veltProviderLocation] - Where to install VeltProvider (defaults to app/page.tsx)
 * @param {string} [params.targetArea] - Where to add comments
 * @param {string[]} [params.features] - Features to install
 * @param {string} [params.crdtEditorType] - CRDT editor type (tiptap, codemirror, blocknote)
 * @param {Object} params.server - MCP server instance
 * @returns {Promise<Object>} Installation plan for AI to execute
 */
export async function installVeltWithPlan(params) {
  const {
    projectPath,
    apiKey,
    authToken,
    commentType,
    headerPosition = 'top-right',
    veltProviderLocation = 'app/page.tsx',
    targetArea = '',
    features = ['comments'],
    crdtEditorType = null,
    server,
  } = params;

  // Validate required parameters
  if (!apiKey) {
    throw new Error('API key is required');
  }
  if (!authToken) {
    throw new Error('Auth token is required');
  }

  const resolvedPath = path.resolve(projectPath);

  const report = {
    status: 'plan_generated',
    steps: [],
    plan: null,
    startTime: new Date().toISOString(),
  };

  try {
    console.error('\n🚀 Starting Plan-Based Velt Installation');
    console.error(`📁 Project: ${resolvedPath}`);
    console.error(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    console.error(`💬 Comment Type: ${commentType}`);
    console.error(`📍 Header Position: ${headerPosition}\n`);

    // === STEP 1: Prepare Configuration ===
    console.error('📋 Step 1/6: Preparing configuration...');
    report.steps.push({ step: 1, name: 'prepare_configuration', status: 'complete' });
    console.error('✅ Step 1/6: Configuration prepared\n');

    // === STEP 2: Check Dev Server (FAST) ===
    console.error('🔄 Step 2/6: Checking dev server...');
    const devServerResult = await checkDevServer();
    report.steps.push({
      step: 2,
      name: 'check_dev_server',
      status: 'complete',
      result: devServerResult,
    });
    console.error(`✅ Step 2/6: Dev server ${devServerResult.running ? 'detected' : 'not detected'}\n`);

    // === STEP 3: Skip Screenshot (too slow) ===
    console.error('⚠️  Step 3/6: Screenshot skipped (optimization)\n');
    const screenshotResult = { success: false, skipped: true };

    report.steps.push({
      step: 3,
      name: 'take_screenshot',
      status: 'skipped',
      result: screenshotResult,
    });

    // === STEP 4: Run Velt CLI ===
    console.error('⚙️  Step 4/6: Running Velt CLI...');
    const cliResult = await runVeltCli({
      installDir: resolvedPath,
      apiKey,
      authToken,
    });

    report.steps.push({
      step: 4,
      name: 'run_velt_cli',
      status: cliResult.success ? 'complete' : 'complete_with_warnings',
      result: {
        exitCode: cliResult.exitCode,
        warning: cliResult.success ? null : 'CLI had issues but may have created files',
      },
    });

    if (cliResult.success) {
      console.error('✅ Step 4/6: Velt CLI completed\n');
    } else {
      console.error('⚠️  Step 4/6: Velt CLI completed with warnings\n');
    }

    // === STEP 5: Scan Codebase (FAST - skip slow operations) ===
    console.error('🔍 Step 5/6: Scanning codebase...');

    // Detect libraries only
    const libraryDetection = detectLibraries(resolvedPath);
    const detectedLibs = Object.entries(libraryDetection)
      .filter(([_, detected]) => detected)
      .map(([key]) => key);

    console.error(`   📚 Detected libraries: ${detectedLibs.length > 0 ? detectedLibs.join(', ') : 'none'}`);

    // Skip slow comment placement detection
    const detectedFiles = [];

    report.steps.push({
      step: 5,
      name: 'scan_codebase',
      status: 'complete',
      result: {
        librariesDetected: detectedLibs,
        filesDetected: 0,
      },
    });

    console.error('✅ Step 5/6: Codebase scanned\n');

    // === STEP 6: Fetch Implementation from Velt Docs (PARALLEL) ===
    console.error('📚 Step 6/6: Fetching implementation details from Velt Docs...');

    // Build array of fetch promises to run in parallel
    const fetchPromises = [];
    const fetchResults = {};

    // Add comment fetch if needed
    if (features.includes('comments')) {
      fetchPromises.push(
        fetchCommentImplementation({ commentType, mcpClient: null })
          .then(result => { fetchResults.comments = result; })
          .catch(err => { fetchResults.comments = { error: err.message }; })
      );
    }

    // Add CRDT fetch if needed
    if (features.includes('crdt') && crdtEditorType) {
      fetchPromises.push(
        fetchCrdtImplementation({ editorType: crdtEditorType, mcpClient: null })
          .then(result => { fetchResults.crdt = result; })
          .catch(err => { fetchResults.crdt = { error: err.message }; })
      );
    }

    // Add other feature fetches
    for (const feature of features) {
      if (feature !== 'comments' && feature !== 'crdt') {
        fetchPromises.push(
          fetchFeatureImplementation({ feature, mcpClient: null })
            .then(result => { fetchResults[feature] = result; })
            .catch(err => { fetchResults[feature] = { error: err.message }; })
        );
      }
    }

    // Wait for all fetches to complete in parallel
    await Promise.all(fetchPromises);

    // Extract results
    const implementation = fetchResults.comments || null;
    const crdtImplementation = fetchResults.crdt || null;
    const featureImplementations = {};

    for (const [key, value] of Object.entries(fetchResults)) {
      if (key !== 'comments' && key !== 'crdt') {
        featureImplementations[key] = value;
      }
    }

    // Log results
    if (implementation) {
      console.error(`   ✅ Got ${commentType} comments from: ${implementation.source || 'docs'}`);
    }
    if (crdtImplementation) {
      console.error(`   ✅ Got ${crdtEditorType} CRDT from: ${crdtImplementation.source || 'docs'}`);
    }
    for (const [feature, impl] of Object.entries(featureImplementations)) {
      console.error(`   ✅ Got ${feature} from: ${impl.source || 'docs'}`);
    }

    report.steps.push({
      step: 6,
      name: 'fetch_implementation',
      status: 'complete',
      result: {
        comments: implementation ? { source: implementation.source, docUrl: implementation.docUrl } : null,
        crdt: crdtImplementation ? { source: crdtImplementation.source, docUrl: crdtImplementation.docUrl } : null,
        otherFeatures: Object.keys(featureImplementations).length,
      },
    });

    console.error('✅ Step 6/6: Implementation details fetched\n');

    // === GENERATE PLAN ===
    console.error('📋 Generating implementation plan...\n');

    // Use multi-feature plan if user requested multiple features
    const plan = features.length > 1 || (features.length === 1 && features[0] !== 'comments')
      ? createMultiFeaturePlan({
          features,
          commentType,
          implementation: implementation, // Comment implementation with mdUrl and docUrl
          crdtImplementation: crdtImplementation, // CRDT implementation with mdUrl and docUrl
          featureImplementations: featureImplementations, // Other feature implementations
          detectedFiles: detectedFiles.slice(0, 3), // Top 3 files
          apiKey: `${apiKey.substring(0, 8)}...`,
          headerPosition,
          veltProviderLocation,
          crdtEditorType,
        })
      : createVeltCommentsPlan({
          commentType,
          implementation: implementation, // Comment implementation with mdUrl and docUrl
          detectedFiles: detectedFiles.slice(0, 3), // Top 3 files
          apiKey: `${apiKey.substring(0, 8)}...`,
          headerPosition,
          veltProviderLocation,
          crdtEditorType,
        });

    report.plan = plan;
    report.status = 'plan_generated';
    report.endTime = new Date().toISOString();

    console.error('✅ Plan generated successfully!\n');
    console.error('📝 The AI will now complete the implementation using this plan.\n');

    return report;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);

    report.status = 'failed';
    report.endTime = new Date().toISOString();
    report.error = {
      message: error.message,
      stack: error.stack,
    };

    return report;
  }
}

/**
 * Checks if dev server is running (FAST - only check port 3000 with 500ms timeout)
 */
async function checkDevServer() {
  const url = 'http://localhost:3000';

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(500), // 500ms timeout
    });

    if (response.ok || response.status === 404) {
      return {
        running: true,
        url,
        port: 3000,
      };
    }
  } catch (err) {
    // Dev server not running
  }

  return {
    running: false,
    url: 'http://localhost:3000',
    message: 'Dev server not detected',
  };
}

export default {
  installVeltWithPlan,
};
