/**
 * Velt Installation Orchestrator
 * 
 * Single orchestrator tool that handles the complete Velt installation workflow
 * with guaranteed sequential execution.
 */

import { collectConfiguration } from '../utils/config.js';
import { runVeltCli } from '../utils/cli.js';
import { queryVeltMCP } from '../utils/velt-mcp.js';
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
 * @param {Server} params.server - MCP server instance (for prompts)
 * @returns {Promise<Object>} Installation report
 */
export async function installVeltFreestyle({ projectPath, server }) {
  const report = {
    status: 'in_progress',
    steps: [],
    errors: [],
    startTime: new Date().toISOString(),
  };

  const resolvedPath = path.resolve(projectPath);

  try {
    // === STEP 1: Collect Configuration ===
    report.steps.push({
      step: 1,
      name: 'collect_configuration',
      status: 'running',
      description: 'Collecting installation configuration (directory, API key, auth token)',
    });

    const config = await collectConfiguration({
      projectPath: resolvedPath,
      server,
    });

    if (!config.success) {
      throw new Error(`Configuration collection failed: ${config.error}`);
    }

    report.steps[0].status = 'complete';
    report.steps[0].result = {
      installDir: config.data.installDir,
      hasApiKey: !!config.data.apiKey,
      hasAuthToken: !!config.data.authToken,
    };

    // === STEP 2: Run Velt CLI ===
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

    if (!cliResult.success) {
      throw new Error(`Velt CLI execution failed: ${cliResult.error}`);
    }

    report.steps[1].status = 'complete';
    report.steps[1].result = {
      exitCode: cliResult.exitCode,
      output: cliResult.output?.slice(0, 200), // Truncate for readability
    };

    // === STEP 3: Query Velt MCP for Patterns ===
    report.steps.push({
      step: 3,
      name: 'query_velt_mcp',
      status: 'running',
      description: 'Querying Velt MCP server for freestyle comments implementation patterns',
    });

    const patterns = await queryVeltMCP({
      question: 'How do I implement freestyle comments in Next.js app router? Show me the best practices and code patterns.',
    });

    if (!patterns.success) {
      throw new Error(`Velt MCP query failed: ${patterns.error}`);
    }

    report.steps[2].status = 'complete';
    report.steps[2].result = {
      patternsFound: !!patterns.data,
      patternSummary: patterns.data?.summary || 'Patterns retrieved',
      source: patterns.source || 'unknown',
      message: patterns.message || patterns.warning || 'Patterns retrieved',
      queryUsed: patterns.query,
    };
    
    // Add clear message to report
    if (patterns.source === 'velt-docs-mcp') {
      report.steps[2].message = '✅ Successfully queried Velt Docs MCP server - using real documentation patterns';
    } else if (patterns.source === 'fallback') {
      report.steps[2].message = '⚠️  Using fallback patterns (Velt Docs MCP unavailable) - using known best practices';
    }

    // === STEP 4: Analyze and Integrate ===
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
      patterns: patterns.data,
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

    // === STEP 5: Validate Installation ===
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

    // All steps completed successfully
    report.status = 'success';
    report.endTime = new Date().toISOString();
    
    // Build summary with source information
    const mcpStep = report.steps.find(s => s.name === 'query_velt_mcp');
    const mcpSource = mcpStep?.result?.source || 'unknown';
    const mcpMessage = mcpStep?.message || '';
    
    report.summary = `Velt freestyle comments successfully installed in ${resolvedPath}`;
    report.details = {
      installationPath: resolvedPath,
      veltDocsMCP: mcpSource === 'velt-docs-mcp' ? '✅ Used real documentation' : '⚠️  Used fallback patterns',
      mcpMessage: mcpMessage,
    };

    return report;
  } catch (error) {
    report.status = 'failed';
    report.endTime = new Date().toISOString();
    report.errors.push({
      message: error.message,
      stack: error.stack,
      failedAtStep: report.steps[report.steps.length - 1]?.name || 'unknown',
    });

    // Mark current step as failed
    const currentStep = report.steps[report.steps.length - 1];
    if (currentStep && currentStep.status === 'running') {
      currentStep.status = 'failed';
      currentStep.error = error.message;
    }

    return report;
  }
}

