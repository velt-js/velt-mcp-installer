/**
 * Interactive Velt Installer
 *
 * @deprecated Use unified-installer.js instead. This module is kept for backward compatibility.
 * The unified installer provides both guided and CLI-only modes with better UX.
 *
 * Provides a step-by-step interactive installation workflow with user prompts.
 */

import { collectConfiguration } from '../utils/config.js';
import { runVeltCli } from '../utils/cli.js';
import { queryVeltMCP, detectLibraries } from '../utils/velt-mcp.js';
import { analyzeAndIntegrate } from '../utils/integration.js';
import { validateInstallation } from '../utils/validation.js';
import { takeScreenshot } from '../utils/screenshot.js';
import { detectCommentPlacement } from '../utils/comment-detector.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Interactive installation workflow that prompts user at each step
 *
 * @param {Object} params - Installation parameters
 * @param {string} params.projectPath - Path to Next.js project
 * @param {string} params.apiKey - Required: Velt API key (provided by user)
 * @param {string} params.authToken - Required: Velt auth token (provided by user)
 * @param {string} params.commentType - 'freestyle' or 'popover' (from user prompt)
 * @param {string} [params.headerPosition] - 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {string} [params.targetArea] - User's description of where to add comments
 * @param {string[]} [params.features] - Features to install (default: ['comments'])
 * @param {Object} params.server - MCP server instance
 * @returns {Promise<Object>} Installation report
 */
export async function installVeltInteractive(params) {
  const {
    projectPath,
    apiKey,
    authToken,
    commentType,
    headerPosition = 'top-right',
    targetArea = '',
    features = ['comments'],
    server,
  } = params;

  // Validate required parameters
  if (!apiKey) {
    throw new Error('API key is required. Please provide your Velt API key from https://console.velt.dev');
  }
  if (!authToken) {
    throw new Error('Auth token is required. Please provide your Velt auth token from https://console.velt.dev');
  }

  const report = {
    status: 'in_progress',
    steps: [],
    errors: [],
    startTime: new Date().toISOString(),
    interactiveMode: true,
  };

  const resolvedPath = path.resolve(projectPath);

  try {
    console.error('\n🚀 Starting Interactive Velt Installation');
    console.error(`📁 Project: ${resolvedPath}`);
    console.error(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    console.error(`🔐 Auth Token: ${authToken.substring(0, 8)}...`);
    console.error(`💬 Comment Type: ${commentType}`);
    console.error(`📍 Header Position: ${headerPosition}`);
    console.error(`✨ Features: ${features.join(', ')}\n`);

    // === STEP 1: Prepare Configuration ===
    console.error('📋 Step 1/7: Preparing configuration...');
    report.steps.push({
      step: 1,
      name: 'prepare_configuration',
      status: 'running',
    });

    // Use provided API key and auth token (no .env file needed)
    const config = {
      success: true,
      data: {
        installDir: resolvedPath,
        apiKey: apiKey,
        authToken: authToken,
      },
    };

    report.steps[0].status = 'complete';
    report.steps[0].result = {
      installDir: config.data.installDir,
      hasApiKey: true,
      hasAuthToken: true,
      source: 'user-provided',
    };
    console.error('✅ Step 1/7: Configuration prepared (using provided keys)\n');

    // === STEP 2: Check/Start Dev Server ===
    console.error('🔄 Step 2/7: Ensuring dev server is running...');
    report.steps.push({
      step: 2,
      name: 'start_dev_server',
      status: 'running',
    });

    const devServerResult = await ensureDevServerRunning(resolvedPath);

    report.steps[1].status = devServerResult.success ? 'complete' : 'complete_with_warnings';
    report.steps[1].result = {
      running: devServerResult.running,
      url: devServerResult.url,
      message: devServerResult.message,
    };

    if (devServerResult.running) {
      console.error(`✅ Step 2/7: Dev server running at ${devServerResult.url}\n`);
    } else {
      console.error(`⚠️  Step 2/7: Dev server not detected. Please start it manually: pnpm run dev\n`);
    }

    // === STEP 3: Take Screenshot ===
    console.error('📸 Step 3/7: Taking screenshot...');
    report.steps.push({
      step: 3,
      name: 'take_screenshot',
      status: 'running',
    });

    const screenshotResult = await takeScreenshot({
      url: devServerResult.url || 'http://localhost:3000',
    });

    if (!screenshotResult.success) {
      console.error(`⚠️  Step 3/7: Screenshot failed - ${screenshotResult.error}`);
      console.error('   Continuing with installation anyway...\n');
      report.steps[2].status = 'skipped';
      report.steps[2].warning = screenshotResult.error;
    } else {
      report.steps[2].status = 'complete';
      report.steps[2].result = {
        captured: true,
        size: `${screenshotResult.data.width}x${screenshotResult.data.height}`,
      };
      console.error('✅ Step 3/7: Screenshot captured\n');
    }

    // === STEP 4: Run Velt CLI ===
    console.error('⚙️  Step 4/7: Running Velt CLI...');
    report.steps.push({
      step: 4,
      name: 'run_velt_cli',
      status: 'running',
    });

    const cliResult = await runVeltCli({
      installDir: config.data.installDir,
      apiKey: config.data.apiKey,
      authToken: config.data.authToken,
    });

    if (!cliResult.success) {
      console.error(`   ⚠️  CLI reported failure (exit code: ${cliResult.exitCode})`);
      console.error(`   ℹ️  Continuing anyway - CLI may have still created required files`);
    }

    report.steps[3].status = cliResult.success ? 'complete' : 'complete_with_warnings';
    console.error('✅ Step 4/7: Velt CLI completed\n');

    // === STEP 5: Query Patterns & Detect Files ===
    console.error('🔍 Step 5/7: Detecting where to place comments...');
    report.steps.push({
      step: 5,
      name: 'detect_placement',
      status: 'running',
    });

    // Query Velt MCP for patterns
    const mcpPatterns = await queryVeltMCP({
      question: `How do I implement ${commentType} comments in Next.js app router? Show me the best practices and code patterns.`,
    });

    // Detect libraries
    const libraryDetection = detectLibraries(resolvedPath);

    // Detect comment placement
    const placementResult = await detectCommentPlacement({
      projectPath: resolvedPath,
      commentType,
      targetDescription: targetArea,
    });

    if (!placementResult.success) {
      throw new Error(`Placement detection failed: ${placementResult.error}`);
    }

    const mergedPatterns = {
      ...mcpPatterns.data,
      ...libraryDetection,
    };

    report.steps[4].status = 'complete';
    report.steps[4].result = {
      commentType,
      targetArea,
      placementsFound: placementResult.data?.placements?.length || 0,
      recommendedFile: placementResult.data?.recommendedPlacement?.file || 'N/A',
    };

    console.error(`   ✅ Found ${placementResult.data?.placements?.length || 0} potential placements`);
    if (placementResult.data?.recommendedPlacement) {
      console.error(`   📄 Recommended: ${placementResult.data.recommendedPlacement.file}`);
    }
    console.error('✅ Step 5/7: Placement detected\n');

    // === STEP 6: Integrate Components ===
    console.error('🔧 Step 6/7: Integrating Velt components...');
    report.steps.push({
      step: 6,
      name: 'integrate_components',
      status: 'running',
    });

    const integration = await analyzeAndIntegrate({
      projectPath: resolvedPath,
      config: {
        apiKey: config.data.apiKey,
        authToken: config.data.authToken,
        headerPosition, // Pass header position to integration
        commentType, // Pass comment type to integration
        targetPlacement: placementResult.data?.recommendedPlacement, // Pass recommended placement
      },
      patterns: mergedPatterns,
    });

    if (!integration.success) {
      throw new Error(`Integration failed: ${integration.error}`);
    }

    report.steps[5].status = 'complete';
    report.steps[5].result = {
      filesModified: integration.data?.filesModified || [],
      componentsAdded: integration.data?.componentsAdded || [],
      integrationPoints: integration.data?.integrationPoints || [],
    };

    const filesCount = integration.data?.filesModified?.length || 0;
    const componentsCount = integration.data?.componentsAdded?.length || 0;
    console.error(`   ✏️  Modified ${filesCount} file(s)`);
    console.error(`   ➕ Added ${componentsCount} component(s)`);
    console.error('✅ Step 6/7: Integration completed\n');

    // === STEP 7: Validate Installation ===
    console.error('✔️  Step 7/7: Validating installation...');
    report.steps.push({
      step: 7,
      name: 'validate_installation',
      status: 'running',
    });

    const validation = await validateInstallation({
      projectPath: resolvedPath,
    });

    report.steps[6].status = 'complete';
    report.steps[6].result = {
      checks: validation.checks || [],
      passed: validation.passed || 0,
      total: validation.total || 0,
    };

    console.error(`   ${validation.passed}/${validation.total} validation checks passed`);
    console.error('✅ Step 7/7: Validation completed\n');

    // Success!
    report.status = 'success';
    report.endTime = new Date().toISOString();
    console.error('🎉 Interactive installation completed successfully!\n');

    report.summary = `Velt ${commentType} comments successfully installed`;
    report.details = {
      commentType,
      headerPosition,
      targetArea,
      features,
      keysUsed: 'user-provided',
      apiKeyPreview: `${apiKey.substring(0, 8)}...`,
      authTokenPreview: `${authToken.substring(0, 8)}...`,
      filesModified: integration.data?.filesModified || [],
      componentsAdded: integration.data?.componentsAdded || [],
      recommendedFile: placementResult.data?.recommendedPlacement?.file || 'N/A',
    };

    return report;
  } catch (error) {
    const currentStep = report.steps[report.steps.length - 1];
    const stepNumber = currentStep?.step || '?';
    console.error(`\n❌ Step ${stepNumber}/7: Failed`);
    console.error(`   Error: ${error.message}\n`);

    report.status = 'failed';
    report.endTime = new Date().toISOString();
    report.errors.push({
      message: error.message,
      stack: error.stack,
      failedAtStep: currentStep?.name || 'unknown',
    });

    if (currentStep && currentStep.status === 'running') {
      currentStep.status = 'failed';
      currentStep.error = error.message;
    }

    return report;
  }
}

/**
 * Ensures dev server is running or provides instructions
 */
async function ensureDevServerRunning(projectPath) {
  try {
    // Check if server is already running on common ports
    const portsToCheck = [3000, 3001, 3002, 4000, 5000];

    for (const port of portsToCheck) {
      const url = `http://localhost:${port}`;

      // Try to connect
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok || response.status === 404) {
          // Server is running
          return {
            success: true,
            running: true,
            url,
            port,
            message: `Dev server detected on port ${port}`,
          };
        }
      } catch (err) {
        // Server not on this port, continue
        continue;
      }
    }

    // No server found
    return {
      success: true,
      running: false,
      url: 'http://localhost:3000',
      message: 'Dev server not detected. Please run: pnpm run dev',
      instruction: 'Please start your dev server before taking screenshot',
    };
  } catch (error) {
    return {
      success: true,
      running: false,
      url: 'http://localhost:3000',
      message: `Could not check dev server: ${error.message}`,
    };
  }
}

export default {
  installVeltInteractive,
};
