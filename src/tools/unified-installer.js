/**
 * Unified Velt Installer
 *
 * Single orchestration module that handles both installation paths:
 * 1. CLI-only (SKIP path): Run Velt CLI scaffolding only, basic QA
 * 2. Guided path: Generate plan, await approval, apply edits, full QA
 *
 * Uses local Velt CLI from /Users/yoenzhang/Downloads/add-velt-next-js
 * with robust resolution (prefer npm link, fallback to direct execution).
 */

import { runVeltCli, runVeltCliWithFeatures, runVeltCliCoreOnly } from '../utils/cli.js';
import { detectLibraries } from '../utils/velt-mcp.js';
import { getFrameworkInfo, ProjectType } from '../utils/framework-detection.js';
import { scanAndFixUseClient } from '../utils/use-client.js';
import {
  fetchCommentImplementation,
  fetchCrdtImplementation,
  fetchFeatureImplementation,
} from '../utils/velt-docs-fetcher.js';
import {
  createVeltCommentsPlan,
  createMultiFeaturePlan,
  createCliOnlyReport,
} from '../utils/plan-formatter.js';
import {
  validateNextJsProject,
  validateBasicCliInstall,
  validateInstallation,
  applyUseClientFixes as applyFixes,
} from '../utils/validation.js';
import path from 'path';

/**
 * Masks API key for display (shows first 8 chars + ...)
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return '***';
  return `${apiKey.substring(0, 8)}...`;
}

/**
 * Unified Velt Installer - Main Entry Point
 *
 * @param {Object} params - Installation parameters
 * @param {string} params.projectPath - Path to Next.js project (REQUIRED)
 * @param {string} params.apiKey - Velt API key (REQUIRED)
 * @param {string} params.authToken - Velt Auth Token (REQUIRED)
 * @param {string} [params.mode='guided'] - Installation mode: 'guided' | 'cli-only'
 * @param {string} [params.stage='plan'] - Guided mode stage: 'plan' | 'apply'
 * @param {boolean} [params.approved=false] - Whether user approved the plan (for apply stage)
 * @param {string[]} [params.features=['comments']] - Features to install
 * @param {string} [params.commentType='freestyle'] - Comment type
 * @param {string} [params.crdtEditorType=null] - CRDT editor type
 * @param {string} [params.headerPosition='top-right'] - Sidebar header position
 * @param {string} [params.veltProviderLocation='app/layout.tsx'] - VeltProvider location
 * @param {Object} [params.server=null] - MCP server instance
 * @returns {Promise<Object>} Installation result
 */
export async function installVeltUnified(params) {
  const {
    projectPath,
    apiKey,
    authToken,
    mode = 'guided',
    stage = 'plan',
    approved = false,
    features = ['comments'],
    commentType = 'freestyle',
    crdtEditorType = null,
    headerPosition = 'top-right',
    veltProviderLocation = 'app/layout.tsx',
    server = null,
  } = params;

  const resolvedPath = path.resolve(projectPath);

  // Validate required parameters
  if (!apiKey) {
    return {
      status: 'error',
      error: 'API key is required. Please provide your Velt API Key from https://console.velt.dev',
    };
  }
  if (!authToken) {
    return {
      status: 'error',
      error: 'Auth token is required. Please provide your Velt Auth Token from https://console.velt.dev',
    };
  }

  // Step 1: Validate Next.js project
  console.error('\n🔍 Validating project...');
  const projectValidation = validateNextJsProject(resolvedPath);
  if (!projectValidation.valid) {
    return {
      status: 'error',
      error: projectValidation.error,
      hint: 'Make sure you are in a Next.js project directory with a package.json that includes "next" as a dependency.',
    };
  }
  console.error('✅ Valid Next.js project\n');

  // Step 2: Detect framework type
  console.error('🔎 Detecting framework...');
  const frameworkInfo = getFrameworkInfo(resolvedPath);
  console.error(`   Project type: ${frameworkInfo.projectType}`);
  console.error(`   Needs "use client": ${frameworkInfo.needsUseClient}`);
  if (frameworkInfo.routerType) {
    console.error(`   Router type: ${frameworkInfo.routerType}`);
  }
  console.error('');

  // Step 3: Route based on mode
  if (mode === 'cli-only') {
    console.error('📦 CLI-Only Mode (SKIP)\n');
    return runCliOnlyInstall({
      projectPath: resolvedPath,
      apiKey,
      authToken,
      frameworkInfo,
    });
  }

  // Step 4: Guided mode - route based on stage
  if (mode === 'guided') {
    if (stage === 'plan') {
      console.error('📋 Guided Mode - Plan Stage\n');
      return runGuidedPlanStage({
        projectPath: resolvedPath,
        apiKey,
        authToken,
        features,
        commentType,
        crdtEditorType,
        headerPosition,
        veltProviderLocation,
        frameworkInfo,
      });
    }

    if (stage === 'apply') {
      if (!approved) {
        return {
          status: 'error',
          error: 'Cannot apply without user approval. Set approved=true after user confirms the plan.',
        };
      }
      console.error('🚀 Guided Mode - Apply Stage\n');
      return runGuidedApplyStage({
        projectPath: resolvedPath,
        apiKey,
        authToken,
        features,
        commentType,
        crdtEditorType,
        headerPosition,
        veltProviderLocation,
        frameworkInfo,
      });
    }
  }

  return {
    status: 'error',
    error: `Invalid mode "${mode}" or stage "${stage}". Use mode="guided"|"cli-only" and stage="plan"|"apply".`,
  };
}

/**
 * CLI-Only Installation (SKIP path)
 *
 * Runs Velt CLI scaffolding only (NO feature flags = core only),
 * validates basic installation, applies "use client" fixes for Next.js,
 * returns TODO checklist. Does NOT modify project files beyond CLI.
 *
 * @param {Object} params
 * @param {string} params.projectPath - Path to project
 * @param {string} params.apiKey - Velt API key
 * @param {string} params.authToken - Velt Auth Token
 * @param {Object} params.frameworkInfo - Framework detection info
 * @returns {Promise<Object>} CLI-only installation result
 */
export async function runCliOnlyInstall({ projectPath, apiKey, authToken, frameworkInfo }) {
  const report = {
    status: 'cli_only_complete',
    mode: 'cli-only',
    steps: [],
    startTime: new Date().toISOString(),
  };

  try {
    // Step 1: Run Velt CLI (core only, no feature flags)
    console.error('⚙️  Running Velt CLI (core scaffolding only)...');
    const cliResult = await runVeltCliCoreOnly({
      projectPath,
      apiKey,
      authToken,
    });

    report.steps.push({
      step: 1,
      name: 'run_velt_cli',
      status: cliResult.success ? 'complete' : 'complete_with_warnings',
      result: {
        exitCode: cliResult.exitCode,
        method: cliResult.method, // 'linked' or 'direct'
        command: cliResult.command,
        warning: cliResult.success ? null : 'CLI had issues but may have created files',
      },
    });

    if (cliResult.success) {
      console.error(`✅ Velt CLI completed (via ${cliResult.method})\n`);
    } else {
      console.error(`⚠️  Velt CLI completed with warnings (via ${cliResult.method})\n`);
    }

    // Step 2: Apply "use client" fixes for Next.js
    if (frameworkInfo.needsUseClient) {
      console.error('🔧 Applying "use client" directives for Next.js...');
      const useClientResult = applyFixes(projectPath);

      report.steps.push({
        step: 2,
        name: 'apply_use_client',
        status: 'complete',
        result: {
          filesFixed: useClientResult.fixed?.length || 0,
          filesScanned: useClientResult.scanned?.length || 0,
        },
      });

      if (useClientResult.fixed?.length > 0) {
        console.error(`   Fixed ${useClientResult.fixed.length} file(s)`);
        for (const fix of useClientResult.fixed) {
          console.error(`     - ${fix.path}`);
        }
      } else {
        console.error('   No files needed fixing');
      }
      console.error('');
    }

    // Step 3: Run basic QA (no integration checks)
    console.error('🔍 Running basic CLI validation...');
    const qaResult = await validateBasicCliInstall({
      projectPath,
      cliResult, // Pass CLI result for method reporting
    });

    report.steps.push({
      step: frameworkInfo.needsUseClient ? 3 : 2,
      name: 'basic_qa_validation',
      status: 'complete',
      result: qaResult,
    });

    console.error(`✅ Validation complete: ${qaResult.score}\n`);

    // Step 4: Generate CLI-only report
    console.error('📋 Generating installation report...\n');
    const cliReport = createCliOnlyReport({
      cliResult,
      qaResult,
      apiKey: maskApiKey(apiKey),
      cliMethod: cliResult.method, // Add CLI method to report
      frameworkInfo,
    });

    report.report = cliReport;
    report.validation = qaResult;
    report.endTime = new Date().toISOString();
    report.cliMethod = cliResult.method;
    report.frameworkInfo = {
      projectType: frameworkInfo.projectType,
      needsUseClient: frameworkInfo.needsUseClient,
    };
    report.nextSteps = 'Re-run installer without SKIP to generate a plan + implement features';

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
 * Guided Plan Stage
 *
 * Runs Velt CLI with feature flags, scans codebase, fetches docs, generates implementation plan.
 * Does NOT apply any changes - returns plan for user approval.
 *
 * @param {Object} params
 * @param {string} params.projectPath - Path to project
 * @param {string} params.apiKey - Velt API key
 * @param {string} params.authToken - Velt Auth Token
 * @param {string[]} params.features - Features to install
 * @param {string} params.commentType - Comment type
 * @param {string} params.crdtEditorType - CRDT editor type
 * @param {string} params.headerPosition - Header position
 * @param {string} params.veltProviderLocation - VeltProvider location
 * @param {Object} params.frameworkInfo - Framework detection info
 * @returns {Promise<Object>} Plan generation result
 */
export async function runGuidedPlanStage({
  projectPath,
  apiKey,
  authToken,
  features,
  commentType,
  crdtEditorType,
  headerPosition,
  veltProviderLocation,
  frameworkInfo,
}) {
  const report = {
    status: 'plan_generated',
    mode: 'guided',
    stage: 'plan',
    steps: [],
    startTime: new Date().toISOString(),
  };

  try {
    console.error('🚀 Starting Guided Installation - Plan Stage');
    console.error(`📁 Project: ${projectPath}`);
    console.error(`🔑 API Key: ${maskApiKey(apiKey)}`);
    console.error(`✨ Features: ${features.join(', ')}`);
    console.error(`🖥️  Framework: ${frameworkInfo.projectType}`);
    if (features.includes('comments')) {
      console.error(`💬 Comment Type: ${commentType}`);
    }
    if (features.includes('crdt') && crdtEditorType) {
      console.error(`📝 CRDT Editor: ${crdtEditorType}`);
    }
    console.error('');

    // Step 1: Run Velt CLI with feature flags
    console.error('⚙️  Step 1/4: Running Velt CLI with feature flags...');
    const cliResult = await runVeltCliWithFeatures({
      projectPath,
      apiKey,
      authToken,
      features,
      commentType,
      crdtEditorType,
    });

    report.steps.push({
      step: 1,
      name: 'run_velt_cli',
      status: cliResult.success ? 'complete' : 'complete_with_warnings',
      result: {
        exitCode: cliResult.exitCode,
        method: cliResult.method,
        command: cliResult.command,
        warning: cliResult.success ? null : 'CLI had issues but may have created files',
      },
    });

    if (cliResult.success) {
      console.error(`✅ Step 1/4: Velt CLI completed (via ${cliResult.method})\n`);
    } else {
      console.error(`⚠️  Step 1/4: Velt CLI completed with warnings (via ${cliResult.method})\n`);
    }

    // Step 1.5: Apply "use client" fixes for Next.js
    if (frameworkInfo.needsUseClient) {
      console.error('🔧 Applying "use client" directives...');
      const useClientResult = applyFixes(projectPath);
      if (useClientResult.fixed?.length > 0) {
        console.error(`   Fixed ${useClientResult.fixed.length} file(s)\n`);
      } else {
        console.error('   No files needed fixing\n');
      }
    }

    // Step 2: Scan codebase (detect libraries)
    console.error('🔍 Step 2/4: Scanning codebase...');
    const libraryDetection = detectLibraries(projectPath);
    const detectedLibs = Object.entries(libraryDetection)
      .filter(([_, detected]) => detected)
      .map(([key]) => key);

    if (detectedLibs.length > 0) {
      console.error(`   📚 Detected libraries: ${detectedLibs.join(', ')}`);
    }

    report.steps.push({
      step: 2,
      name: 'scan_codebase',
      status: 'complete',
      result: {
        librariesDetected: detectedLibs,
        frameworkInfo: {
          projectType: frameworkInfo.projectType,
          routerType: frameworkInfo.routerType,
        },
      },
    });

    console.error('✅ Step 2/4: Codebase scanned\n');

    // Step 3: Fetch implementation docs (parallel)
    console.error('📚 Step 3/4: Fetching implementation details from Velt Docs...');

    const fetchPromises = [];
    const fetchResults = {};

    // Fetch comments implementation
    if (features.includes('comments')) {
      fetchPromises.push(
        fetchCommentImplementation({ commentType, mcpClient: null })
          .then(result => { fetchResults.comments = result; })
          .catch(err => { fetchResults.comments = { error: err.message }; })
      );
    }

    // Fetch CRDT implementation
    if (features.includes('crdt') && crdtEditorType) {
      fetchPromises.push(
        fetchCrdtImplementation({ editorType: crdtEditorType, mcpClient: null })
          .then(result => { fetchResults.crdt = result; })
          .catch(err => { fetchResults.crdt = { error: err.message }; })
      );
    }

    // Fetch other feature implementations
    for (const feature of features) {
      if (feature !== 'comments' && feature !== 'crdt') {
        fetchPromises.push(
          fetchFeatureImplementation({ feature, mcpClient: null })
            .then(result => { fetchResults[feature] = result; })
            .catch(err => { fetchResults[feature] = { error: err.message }; })
        );
      }
    }

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
      step: 3,
      name: 'fetch_implementation',
      status: 'complete',
      result: {
        comments: implementation ? { source: implementation.source, docUrl: implementation.docUrl } : null,
        crdt: crdtImplementation ? { source: crdtImplementation.source, docUrl: crdtImplementation.docUrl } : null,
        otherFeatures: Object.keys(featureImplementations).length,
      },
    });

    console.error('✅ Step 3/4: Implementation details fetched\n');

    // Step 4: Generate plan (do NOT apply)
    console.error('📋 Step 4/4: Generating implementation plan...');

    const plan = features.length > 1 || (features.length === 1 && features[0] !== 'comments')
      ? createMultiFeaturePlan({
          features,
          commentType,
          implementation,
          crdtImplementation,
          featureImplementations,
          detectedFiles: [],
          apiKey: maskApiKey(apiKey),
          headerPosition,
          veltProviderLocation,
          crdtEditorType,
          frameworkInfo, // Pass framework info to plan
        })
      : createVeltCommentsPlan({
          commentType,
          implementation,
          detectedFiles: [],
          apiKey: maskApiKey(apiKey),
          headerPosition,
          veltProviderLocation,
          crdtEditorType,
          frameworkInfo, // Pass framework info to plan
        });

    report.steps.push({
      step: 4,
      name: 'generate_plan',
      status: 'complete',
    });

    report.plan = plan;
    report.endTime = new Date().toISOString();
    report.cliMethod = cliResult.method;
    report.frameworkInfo = {
      projectType: frameworkInfo.projectType,
      needsUseClient: frameworkInfo.needsUseClient,
    };
    report.message = 'Plan generated. Present to user and await approval before applying.';

    console.error('✅ Step 4/4: Plan generated\n');
    console.error('📝 Present the plan to the user and ask for approval.\n');

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
 * Guided Apply Stage
 *
 * Called after user approves the plan. The AI is expected to apply
 * the plan by making file edits. This function runs full QA validation
 * and ensures "use client" directives are applied for Next.js.
 *
 * Note: The actual file edits are done by the AI based on the plan,
 * not by this function. This function validates the result.
 *
 * @param {Object} params
 * @param {string} params.projectPath - Path to project
 * @param {string} params.apiKey - Velt API key
 * @param {string} params.authToken - Velt Auth Token
 * @param {string[]} params.features - Features installed
 * @param {string} params.commentType - Comment type
 * @param {string} params.crdtEditorType - CRDT editor type
 * @param {string} params.headerPosition - Header position
 * @param {string} params.veltProviderLocation - VeltProvider location
 * @param {Object} params.frameworkInfo - Framework detection info
 * @returns {Promise<Object>} Apply stage result
 */
export async function runGuidedApplyStage({
  projectPath,
  apiKey,
  authToken,
  features,
  commentType,
  crdtEditorType,
  headerPosition,
  veltProviderLocation,
  frameworkInfo,
}) {
  const report = {
    status: 'apply_complete',
    mode: 'guided',
    stage: 'apply',
    steps: [],
    startTime: new Date().toISOString(),
  };

  try {
    console.error('🚀 Guided Installation - Apply Stage');
    console.error('📝 AI should have applied the plan. Running validation...\n');

    // Step 1: Apply "use client" fixes for any files the AI may have created
    if (frameworkInfo.needsUseClient) {
      console.error('🔧 Ensuring "use client" directives are applied...');
      const useClientResult = applyFixes(projectPath);

      report.steps.push({
        step: 1,
        name: 'apply_use_client',
        status: 'complete',
        result: {
          filesFixed: useClientResult.fixed?.length || 0,
          filesScanned: useClientResult.scanned?.length || 0,
        },
      });

      if (useClientResult.fixed?.length > 0) {
        console.error(`   Fixed ${useClientResult.fixed.length} additional file(s)`);
        for (const fix of useClientResult.fixed) {
          console.error(`     - ${fix.path}`);
        }
      } else {
        console.error('   All files have correct directives');
      }
      console.error('');
    }

    // Step 2: Run full integration QA
    console.error('🔍 Running full integration validation...');
    const qaResult = await validateInstallation({ projectPath });

    report.steps.push({
      step: frameworkInfo.needsUseClient ? 2 : 1,
      name: 'full_qa_validation',
      status: 'complete',
      result: qaResult,
    });

    report.validation = qaResult;
    report.endTime = new Date().toISOString();
    report.frameworkInfo = {
      projectType: frameworkInfo.projectType,
      needsUseClient: frameworkInfo.needsUseClient,
    };

    console.error(`✅ Validation complete: ${qaResult.score}\n`);

    // Generate summary message
    const passedAll = qaResult.passed === qaResult.total;
    if (passedAll) {
      report.message = 'Installation complete! All validation checks passed. Check browser DevTools for Velt errors.';
      console.error('🎉 Installation complete! All checks passed.\n');
    } else {
      report.message = `Installation complete with some checks not passing (${qaResult.score}). Review the validation results and check browser DevTools for Velt errors.`;
      console.error(`⚠️  Installation complete. Some checks may need attention: ${qaResult.score}\n`);
    }

    // Add guidance for next steps
    report.nextSteps = [
      'Start your development server (npm run dev)',
      'Open browser DevTools Console (F12) and look for Velt messages',
      'Test the installed features',
      'If errors occur, query Velt Docs MCP for solutions',
    ];

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

export default {
  installVeltUnified,
  runCliOnlyInstall,
  runGuidedPlanStage,
  runGuidedApplyStage,
};
