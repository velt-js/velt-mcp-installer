/**
 * Velt Installation Orchestrator
 *
 * @deprecated Use unified-installer.js instead. This module is kept for backward compatibility.
 * The unified installer provides both guided and CLI-only modes with better UX.
 *
 * Single orchestrator tool that handles the complete Velt installation workflow
 * with guaranteed sequential execution.
 */

import { collectConfiguration } from '../utils/config.js';
import { runVeltCli } from '../utils/cli.js';
import { queryVeltMCP, detectLibraries } from '../utils/velt-mcp.js';
import { analyzeAndIntegrate } from '../utils/integration.js';
import { validateInstallation } from '../utils/validation.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main orchestrator function that executes all installation steps sequentially
 * 
 * @param {Object} params - Tool parameters
 * @param {string} params.projectPath - Path to Next.js project
 * @param {string} [params.apiKey] - Velt API key (optional, will read from .env if not provided)
 * @param {string} [params.authToken] - Velt auth token (optional)
 * @param {Server} params.server - MCP server instance
 * @returns {Promise<Object>} Installation report
 */
export async function installVeltFreestyle({ projectPath, apiKey, authToken, server }) {
  const report = {
    status: 'in_progress',
    steps: [],
    errors: [],
    startTime: new Date().toISOString(),
  };

  const resolvedPath = path.resolve(projectPath);

  try {
    console.error('\n🚀 Starting Velt Installation');
    console.error(`📁 Project: ${resolvedPath}\n`);

    // === STEP 1: Collect Configuration ===
    console.error('📋 Step 1/5: Collecting configuration...');
    report.steps.push({
      step: 1,
      name: 'collect_configuration',
      status: 'running',
      description: 'Collecting installation configuration (directory, API key, auth token)',
    });

    const config = await collectConfiguration({
      projectPath: resolvedPath,
      apiKey, // Pass provided API key (or null to read from .env)
      authToken, // Pass provided auth token (or null to read from .env)
    });

    if (!config.success) {
      // Stop installation if API key is missing
      console.error('❌ Step 1/5: Failed - API key not found\n');
      report.status = 'failed';
      report.endTime = new Date().toISOString();
      report.steps[0].status = 'failed';
      report.steps[0].error = config.error;
      report.errors.push({
        message: config.error,
        failedAtStep: 'collect_configuration',
      });
      return report;
    }

    report.steps[0].status = 'complete';
    report.steps[0].result = {
      installDir: config.data.installDir,
      hasApiKey: !!config.data.apiKey,
      hasAuthToken: !!config.data.authToken,
    };
    console.error('✅ Step 1/5: Configuration collected\n');

    // === STEP 2: Run Velt CLI ===
    console.error('⚙️  Step 2/5: Running Velt CLI...');
    report.steps.push({
      step: 2,
      name: 'run_velt_cli',
      status: 'running',
      description: 'Running add-velt-cli to install base Velt components',
    });

    const cliResult = await runVeltCli({
      installDir: config.data.installDir,
      apiKey: config.data.apiKey,
      authToken: config.data.authToken,
    });

    // CLI may fail on npm install (peer dependency conflicts), but files are still created
    // Continue with installation even if CLI reports failure
    if (!cliResult.success) {
      console.error(`   ⚠️  CLI reported failure (exit code: ${cliResult.exitCode})`);
      console.error(`   ℹ️  Continuing anyway - CLI may have still created required files`);
      console.error(`   ℹ️  Common cause: npm install peer dependency conflicts (doesn't affect file generation)`);
    }

    report.steps[1].status = cliResult.success ? 'complete' : 'complete_with_warnings';
    report.steps[1].result = {
      exitCode: cliResult.exitCode,
      output: cliResult.output?.slice(0, 200), // Truncate for readability
      warning: cliResult.success ? null : 'CLI reported failure but continuing - files may still have been created',
    };
    
    if (cliResult.success) {
      console.error('✅ Step 2/5: Velt CLI completed\n');
    } else {
      console.error('⚠️  Step 2/5: Velt CLI completed with warnings (continuing...)\n');
    }

    // === STEP 3: Query Velt MCP for Patterns and Detect Libraries ===
    console.error('🔍 Step 3/5: Fetching documentation patterns and detecting libraries...');
    report.steps.push({
      step: 3,
      name: 'query_velt_mcp',
      status: 'running',
      description: 'Querying Velt MCP server for freestyle comments implementation patterns and detecting libraries',
    });

    // Query Velt Docs MCP for implementation patterns
    const mcpPatterns = await queryVeltMCP({
      question: 'How do I implement freestyle comments in Next.js app router? Show me the best practices and code patterns.',
    });

    if (!mcpPatterns.success) {
      throw new Error(`Velt MCP query failed: ${mcpPatterns.error}`);
    }

    // Detect libraries in the project
    const libraryDetection = detectLibraries(resolvedPath);

    // Merge MCP patterns with library detection
    // This combines documentation patterns (code examples) with library flags (booleans)
    const mergedPatterns = {
      // MCP documentation patterns (code examples)
      ...mcpPatterns.data,
      // Library detection flags (for integration.js)
      ...libraryDetection,
    };

    report.steps[2].status = 'complete';
    report.steps[2].result = {
      patternsFound: !!mcpPatterns.data,
      patternSummary: mcpPatterns.data?.summary || 'Patterns retrieved',
      source: mcpPatterns.source || 'unknown',
      message: mcpPatterns.message || mcpPatterns.warning || 'Patterns retrieved',
      queryUsed: mcpPatterns.query,
      librariesDetected: {
        reactflow: libraryDetection.hasReactFlow,
        tiptap: libraryDetection.hasTiptap,
        codemirror: libraryDetection.hasCodeMirror,
        agGrid: libraryDetection.hasAgGrid,
        tanStack: libraryDetection.hasTanStack,
      },
    };

    // Add clear message to report
    if (mcpPatterns.source === 'velt-docs-url') {
      report.steps[2].message = '✅ Successfully fetched Velt documentation - using real documentation patterns';
    } else if (mcpPatterns.source === 'fallback') {
      report.steps[2].message = '⚠️  Using fallback patterns (could not fetch documentation) - using known best practices';
    }

    // Add library detection summary
    const libraryNames = {
      hasReactFlow: 'ReactFlow',
      hasTiptap: 'Tiptap',
      hasCodeMirror: 'CodeMirror',
      hasAgGrid: 'AG-Grid',
      hasTanStack: 'TanStack Table',
    };

    const detectedLibraries = Object.entries(libraryDetection)
      .filter(([_, detected]) => detected)
      .map(([key]) => libraryNames[key] || key);

    if (detectedLibraries.length > 0) {
      report.steps[2].message += ` | Detected libraries: ${detectedLibraries.join(', ')}`;
      console.error(`   📚 Detected libraries: ${detectedLibraries.join(', ')}`);
    }
    console.error('✅ Step 3/5: Patterns fetched and libraries detected\n');

    // === STEP 4: Analyze and Integrate ===
    console.error('🔧 Step 4/5: Integrating Velt components...');
    
    // Show what patterns will be used
    const patternSource = mcpPatterns.source === 'velt-docs-url' ? 'Velt documentation' : 'fallback patterns';
    console.error(`   📋 Using patterns from: ${patternSource}`);
    if (mcpPatterns.data?.providerPattern?.code) {
      console.error('   ✓ Using VeltProvider pattern from docs');
    }
    if (mcpPatterns.data?.commentsPattern?.code) {
      console.error('   ✓ Using VeltComments pattern from docs');
    }
    
    report.steps.push({
      step: 4,
      name: 'analyze_and_integrate',
      status: 'running',
      description: 'Analyzing customer code and integrating Velt components based on patterns',
    });

    const integration = await analyzeAndIntegrate({
      projectPath: resolvedPath,
      config: {
        apiKey: config.data.apiKey,
        authToken: config.data.authToken,
      },
      patterns: mergedPatterns, // Now includes both MCP patterns AND library detection flags
    });

    if (!integration.success) {
      throw new Error(`Integration failed: ${integration.error}`);
    }

    report.steps[3].status = 'complete';
    report.steps[3].result = {
      filesModified: integration.data?.filesModified || [],
      componentsAdded: integration.data?.componentsAdded || [],
      integrationPoints: integration.data?.integrationPoints || [],
    };
    const filesCount = integration.data?.filesModified?.length || 0;
    const componentsCount = integration.data?.componentsAdded?.length || 0;
    console.error(`   ✏️  Modified ${filesCount} file(s)`);
    console.error(`   ➕ Added ${componentsCount} component(s)`);
    console.error('✅ Step 4/5: Integration completed\n');

    // === STEP 5: Validate Installation ===
    console.error('✔️  Step 5/5: Validating installation...');
    report.steps.push({
      step: 5,
      name: 'validate_installation',
      status: 'running',
      description: 'Validating installation with basic checks',
    });

    const validation = await validateInstallation({
      projectPath: resolvedPath,
    });

    report.steps[4].status = 'complete';
    report.steps[4].result = {
      checks: validation.checks || [],
      passed: validation.passed || 0,
      total: validation.total || 0,
      score: validation.score || '0/0',
    };
    console.error(`   ${validation.passed}/${validation.total} validation checks passed`);
    console.error('✅ Step 5/5: Validation completed\n');

    // All steps completed successfully
    report.status = 'success';
    report.endTime = new Date().toISOString();
    console.error('🎉 Installation completed successfully!\n');

    // Build summary with source information
    const mcpStep = report.steps.find(s => s.name === 'query_velt_mcp');
    const mcpSource = mcpStep?.result?.source || 'unknown';
    const mcpMessage = mcpStep?.message || '';

    report.summary = `Velt freestyle comments successfully installed in ${resolvedPath}`;
    report.details = {
      installationPath: resolvedPath,
      veltDocsSource: mcpSource === 'velt-docs-url' ? '✅ Used real documentation' : '⚠️  Used fallback patterns',
      mcpMessage: mcpMessage,
    };

    return report;
  } catch (error) {
    const currentStep = report.steps[report.steps.length - 1];
    const stepNumber = currentStep?.step || '?';
    console.error(`\n❌ Step ${stepNumber}/5: Failed`);
    console.error(`   Error: ${error.message}\n`);
    
    report.status = 'failed';
    report.endTime = new Date().toISOString();
    report.errors.push({
      message: error.message,
      stack: error.stack,
      failedAtStep: currentStep?.name || 'unknown',
    });

    // Mark current step as failed
    if (currentStep && currentStep.status === 'running') {
      currentStep.status = 'failed';
      currentStep.error = error.message;
    }

    return report;
  }
}

