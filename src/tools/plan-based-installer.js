/**
 * Plan-Based Velt Installer
 *
 * Orchestrates installation up to CLI completion, then returns a PLAN
 * for the AI to complete the implementation.
 */

import { runVeltCli } from '../utils/cli.js';
import { detectLibraries } from '../utils/velt-mcp.js';
import { takeScreenshot } from '../utils/screenshot.js';
import { detectCommentPlacement } from '../utils/comment-detector.js';
import { fetchCommentImplementation } from '../utils/velt-docs-fetcher.js';
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
 * @param {string} [params.veltProviderLocation] - Where to install VeltProvider
 * @param {string} [params.targetArea] - Where to add comments
 * @param {string[]} [params.features] - Features to install
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
    veltProviderLocation = 'app/layout.tsx',
    targetArea = '',
    features = ['comments'],
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

    // === STEP 2: Check Dev Server ===
    console.error('🔄 Step 2/6: Checking dev server...');
    const devServerResult = await checkDevServer();
    report.steps.push({
      step: 2,
      name: 'check_dev_server',
      status: 'complete',
      result: devServerResult,
    });
    console.error(`✅ Step 2/6: Dev server ${devServerResult.running ? 'detected' : 'not detected'}\n`);

    // === STEP 3: Take Screenshot (optional) ===
    console.error('📸 Step 3/6: Taking screenshot...');
    let screenshotResult = { success: false, skipped: true };

    if (devServerResult.running) {
      try {
        screenshotResult = await takeScreenshot({
          url: devServerResult.url || 'http://localhost:3000',
        });
        console.error('✅ Step 3/6: Screenshot captured\n');
      } catch (error) {
        console.error(`⚠️  Step 3/6: Screenshot failed (continuing anyway)\n`);
        screenshotResult = { success: false, error: error.message };
      }
    } else {
      console.error('⚠️  Step 3/6: Screenshot skipped (dev server not running)\n');
    }

    report.steps.push({
      step: 3,
      name: 'take_screenshot',
      status: screenshotResult.success ? 'complete' : 'skipped',
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

    // === STEP 5: Scan Codebase + Detect Libraries ===
    console.error('🔍 Step 5/6: Scanning codebase and detecting libraries...');

    // Detect libraries
    const libraryDetection = detectLibraries(resolvedPath);
    const detectedLibs = Object.entries(libraryDetection)
      .filter(([_, detected]) => detected)
      .map(([key]) => key);

    console.error(`   📚 Detected libraries: ${detectedLibs.length > 0 ? detectedLibs.join(', ') : 'none'}`);

    // Detect where to place comments
    const placementResult = await detectCommentPlacement({
      projectPath: resolvedPath,
      commentType,
      targetDescription: targetArea,
    });

    const detectedFiles = placementResult.success ? placementResult.data.placements : [];
    console.error(`   📄 Found ${detectedFiles.length} potential files for comments`);

    report.steps.push({
      step: 5,
      name: 'scan_codebase',
      status: 'complete',
      result: {
        librariesDetected: detectedLibs,
        filesDetected: detectedFiles.length,
        recommendedFile: placementResult.data?.recommendedPlacement?.file,
      },
    });

    console.error('✅ Step 5/6: Codebase scanned\n');

    // === STEP 6: Fetch Implementation from Velt Docs ===
    console.error('📚 Step 6/6: Fetching implementation details from Velt Docs...');

    const implementation = await fetchCommentImplementation({
      commentType,
      mcpClient: null, // Will be added later when Velt Docs MCP integration is ready
    });

    console.error(`   ✅ Got implementation from: ${implementation.source}`);
    if (implementation.warning) {
      console.error(`   ⚠️  ${implementation.warning}`);
    }

    report.steps.push({
      step: 6,
      name: 'fetch_implementation',
      status: 'complete',
      result: {
        source: implementation.source,
        docUrl: implementation.docUrl,
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
          implementation: implementation, // Pass full object with mdUrl and docUrl
          detectedFiles: detectedFiles.slice(0, 3), // Top 3 files
          apiKey: `${apiKey.substring(0, 8)}...`,
          headerPosition,
          veltProviderLocation,
        })
      : createVeltCommentsPlan({
          commentType,
          implementation: implementation, // Pass full object with mdUrl and docUrl
          detectedFiles: detectedFiles.slice(0, 3), // Top 3 files
          apiKey: `${apiKey.substring(0, 8)}...`,
          headerPosition,
          veltProviderLocation,
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
 * Checks if dev server is running
 */
async function checkDevServer() {
  const ports = [3000, 3001, 3002, 4000, 5000];

  for (const port of ports) {
    const url = `http://localhost:${port}`;
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok || response.status === 404) {
        return {
          running: true,
          url,
          port,
        };
      }
    } catch (err) {
      continue;
    }
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
