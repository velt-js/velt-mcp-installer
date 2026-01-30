/**
 * Velt Integration Script
 *
 * Post-CLI integration and validation tool for Velt Next.js projects.
 * Assumes @velt-js/add-velt CLI has already been run.
 *
 * @module integration
 */

import fs from 'fs';
import path from 'path';
import { applyHeaderPositioning, findVeltSidebarFiles } from './header-positioning.js';

/**
 * @typedef {Object} IntegrationConfig
 * @property {string} apiKey - Required: Velt API key
 * @property {string} [authToken] - Optional: Velt auth token for JWT
 * @property {boolean} [enableReactFlowCursor] - Optional: Enable ReactFlow cursor integration
 */

/**
 * @typedef {Object} IntegrationPatterns
 * @property {boolean} [hasReactFlow] - Automatically wire VeltCursor
 * @property {boolean} [hasTiptap] - Add TODO comment for Tiptap integration
 * @property {boolean} [hasCodeMirror] - Add TODO comment for CodeMirror integration
 * @property {boolean} [hasAgGrid] - Add TODO comment for AG-Grid integration
 * @property {boolean} [hasTanStack] - Add TODO comment for TanStack table integration
 */

/**
 * @typedef {Object} ComponentAdded
 * @property {string} file - File path
 * @property {string} name - Component name
 * @property {string} [description] - Description of component
 */

/**
 * @typedef {Object} IntegrationPoint
 * @property {string} file - File path
 * @property {string} type - Type of integration point
 * @property {string} description - Description of what was done
 * @property {string} [placeholder] - The placeholder that was replaced
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} [file] - File path where issue occurred
 * @property {string} type - Type of validation issue
 * @property {string} message - Description of the issue
 */

/**
 * @typedef {Object} IntegrationResult
 * @property {boolean} success - True if no validation issues
 * @property {Object} data - Integration data
 * @property {string[]} data.filesModified - Paths of files that were modified
 * @property {ComponentAdded[]} data.componentsAdded - Components that were added
 * @property {IntegrationPoint[]} data.integrationPoints - Integration points
 * @property {ValidationIssue[]} data.validationIssues - Validation issues found
 */

/**
 * @typedef {Object} AnalyzeOptions
 * @property {string} projectPath - Project root path
 * @property {IntegrationConfig} config - Integration configuration
 * @property {IntegrationPatterns} [patterns] - Library detection patterns
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detects project structure and returns path helper functions
 *
 * @param {string} projectPath - Project root path
 * @returns {Object} Project structure information
 */
function detectProjectStructure(projectPath) {
  const srcAppPath = path.join(projectPath, 'src', 'app');
  const hasSrcApp = fs.existsSync(srcAppPath);

  const appRoot = hasSrcApp
    ? path.join(projectPath, 'src', 'app')
    : path.join(projectPath, 'app');

  const componentsRoot = hasSrcApp
    ? path.join(projectPath, 'src', 'components')
    : path.join(projectPath, 'components');

  return {
    hasSrcApp,
    appRoot,
    componentsRoot,
    appPath: (...segments) => path.join(appRoot, ...segments),
    componentsPath: (...segments) => path.join(componentsRoot, ...segments),
  };
}

/**
 * Safely reads a file
 *
 * @param {string} filePath - File path
 * @returns {string} File content
 * @throws {Error} If file cannot be read
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Writes file only if content has changed
 *
 * @param {string} filePath - File path
 * @param {string} newContent - New content
 * @param {string[]} filesModified - Array to track modified files
 */
function writeFileIfChanged(filePath, newContent, filesModified) {
  try {
    const currentContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

    if (currentContent !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');

      // Track as relative path
      const relativePath = filePath.split('/src/').pop() || filePath.split('/app/').pop() || filePath;
      if (!filesModified.includes(relativePath)) {
        filesModified.push(relativePath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Checks if CLI output exists
 *
 * @param {Object} structure - Project structure from detectProjectStructure
 * @param {ValidationIssue[]} validationIssues - Array to collect validation issues
 * @returns {boolean} True if core CLI files exist
 */
function ensureCliOutputExists(structure, validationIssues) {
  const { appPath, componentsPath } = structure;

  const requiredFiles = [
    { path: appPath('page.tsx'), name: 'app/page.tsx' },
    { path: appPath('layout.tsx'), name: 'app/layout.tsx' },
    { path: appPath('userAuth', 'AppProviders.tsx'), name: 'app/userAuth/AppProviders.tsx' },
    { path: appPath('userAuth', 'SignIn.tsx'), name: 'app/userAuth/SignIn.tsx' },
    { path: appPath('document', 'page.tsx'), name: 'app/document/page.tsx' },
    { path: appPath('api', 'velt', 'token', 'route.ts'), name: 'app/api/velt/token/route.ts' },
    { path: componentsPath('velt', 'VeltCollaboration.tsx'), name: 'components/velt/VeltCollaboration.tsx' },
    { path: componentsPath('velt', 'ui-customization', 'styles.css'), name: 'components/velt/ui-customization/styles.css' },
  ];

  let missingCount = 0;

  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      validationIssues.push({
        file: file.name,
        type: 'missing-file',
        message: `Expected file generated by @velt-js/add-velt CLI is missing: ${file.name}`,
      });
      missingCount++;
    }
  }

  // If most files are missing, CLI likely wasn't run
  if (missingCount >= requiredFiles.length / 2) {
    validationIssues.push({
      type: 'cli-not-run',
      message: 'CLI output not found. Please run `npx @velt-js/add-velt` first before running integration.',
    });
    return false;
  }

  return true;
}

/**
 * Replaces API key placeholder in page.tsx
 *
 * @param {Object} structure - Project structure
 * @param {string} apiKey - API key to insert
 * @param {string[]} filesModified - Array to track modified files
 * @param {IntegrationPoint[]} integrationPoints - Array to track integration points
 * @param {ValidationIssue[]} validationIssues - Array to track validation issues
 */
function replaceApiKeyInPage(structure, apiKey, filesModified, integrationPoints, validationIssues) {
  const { appPath } = structure;
  const pagePath = appPath('page.tsx');

  if (!fs.existsSync(pagePath)) {
    validationIssues.push({
      file: 'app/page.tsx',
      type: 'missing-file',
      message: 'Cannot replace API key: app/page.tsx does not exist',
    });
    return;
  }

  try {
    let content = readFile(pagePath);
    const originalContent = content;

    // Replace API key placeholder
    const placeholder = '"YOUR_VELT_API_KEY"';
    if (content.includes(placeholder)) {
      content = content.replace(new RegExp(placeholder, 'g'), `"${apiKey}"`);

      writeFileIfChanged(pagePath, content, filesModified);

      integrationPoints.push({
        file: 'app/page.tsx',
        type: 'apiKeyReplacement',
        description: 'Replaced YOUR_VELT_API_KEY placeholder with provided Velt API key.',
        placeholder: 'YOUR_VELT_API_KEY',
      });
    }

    // Validate that placeholder is gone
    if (content.includes(placeholder)) {
      validationIssues.push({
        file: 'app/page.tsx',
        type: 'placeholder-remaining',
        message: 'YOUR_VELT_API_KEY placeholder still exists after replacement attempt',
      });
    }
  } catch (error) {
    validationIssues.push({
      file: 'app/page.tsx',
      type: 'error',
      message: `Error replacing API key: ${error.message}`,
    });
  }
}

/**
 * Replaces auth token placeholder in JWT route
 *
 * @param {Object} structure - Project structure
 * @param {string} apiKey - API key to insert
 * @param {string} authToken - Auth token to insert
 * @param {string[]} filesModified - Array to track modified files
 * @param {IntegrationPoint[]} integrationPoints - Array to track integration points
 * @param {ValidationIssue[]} validationIssues - Array to track validation issues
 */
function replaceAuthTokenInRoute(structure, apiKey, authToken, filesModified, integrationPoints, validationIssues) {
  const { appPath } = structure;
  const routePath = appPath('api', 'velt', 'token', 'route.ts');

  if (!fs.existsSync(routePath)) {
    validationIssues.push({
      file: 'app/api/velt/token/route.ts',
      type: 'missing-file',
      message: 'Cannot replace auth token: app/api/velt/token/route.ts does not exist',
    });
    return;
  }

  try {
    let content = readFile(routePath);
    let modified = false;

    // Replace API key if present
    const apiKeyPlaceholder = '"YOUR_VELT_API_KEY"';
    if (content.includes(apiKeyPlaceholder)) {
      content = content.replace(new RegExp(apiKeyPlaceholder, 'g'), `"${apiKey}"`);
      modified = true;
    }

    // Replace auth token if provided
    const authTokenPlaceholder = '"YOUR_VELT_AUTH_TOKEN"';
    if (authToken && content.includes(authTokenPlaceholder)) {
      content = content.replace(new RegExp(authTokenPlaceholder, 'g'), `"${authToken}"`);
      modified = true;
    }

    if (modified) {
      writeFileIfChanged(routePath, content, filesModified);

      integrationPoints.push({
        file: 'app/api/velt/token/route.ts',
        type: 'authTokenReplacement',
        description: 'Replaced YOUR_VELT_API_KEY and YOUR_VELT_AUTH_TOKEN placeholders in Velt token route.',
      });
    }

    // Validate that placeholders are gone if they should be
    if (content.includes(apiKeyPlaceholder)) {
      validationIssues.push({
        file: 'app/api/velt/token/route.ts',
        type: 'placeholder-remaining',
        message: 'YOUR_VELT_API_KEY placeholder still exists in token route',
      });
    }

    if (authToken && content.includes(authTokenPlaceholder)) {
      validationIssues.push({
        file: 'app/api/velt/token/route.ts',
        type: 'placeholder-remaining',
        message: 'YOUR_VELT_AUTH_TOKEN placeholder still exists in token route',
      });
    }
  } catch (error) {
    validationIssues.push({
      file: 'app/api/velt/token/route.ts',
      type: 'error',
      message: `Error replacing auth token: ${error.message}`,
    });
  }
}

/**
 * Wires ReactFlow cursor integration
 *
 * @param {Object} structure - Project structure
 * @param {string[]} filesModified - Array to track modified files
 * @param {ComponentAdded[]} componentsAdded - Array to track components added
 * @param {IntegrationPoint[]} integrationPoints - Array to track integration points
 * @param {ValidationIssue[]} validationIssues - Array to track validation issues
 */
function wireReactFlowCursor(structure, filesModified, componentsAdded, integrationPoints, validationIssues) {
  const { componentsPath } = structure;
  const collaborationPath = componentsPath('velt', 'VeltCollaboration.tsx');

  if (!fs.existsSync(collaborationPath)) {
    validationIssues.push({
      file: 'components/velt/VeltCollaboration.tsx',
      type: 'missing-file',
      message: 'Cannot wire ReactFlow cursor: VeltCollaboration.tsx does not exist',
    });
    return;
  }

  try {
    let content = readFile(collaborationPath);

    // Check if VeltCursor already exists
    if (content.includes('VeltCursor')) {
      console.error('      ✓ VeltCursor already present');
      return; // Already wired
    }
    
    console.error('      ✓ Adding VeltCursor component (ReactFlow integration)');

    // Add import if not present
    if (!content.includes("import { VeltCursor }")) {
      const importStatement = 'import { VeltCursor } from "@veltdev/react";';

      // Find last import and add after it
      const importRegex = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
      const imports = content.match(importRegex) || [];

      if (imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const afterLastImport = lastImportIndex + lastImport.length;
        content = content.slice(0, afterLastImport) + '\n' + importStatement + content.slice(afterLastImport);
      } else {
        // Add at top of file
        content = importStatement + '\n' + content;
      }
    }

    // Find a good place to add VeltCursor - look for a return statement with a div/main
    // Simple approach: add before the last closing tag in the return statement
    const returnMatch = content.match(/return\s*\(([\s\S]*?)\);?\s*}[\s]*$/m);

    if (returnMatch) {
      const returnContent = returnMatch[1];
      const lastClosingTag = returnContent.lastIndexOf('</');

      if (lastClosingTag > 0) {
        const beforeClosing = returnContent.slice(0, lastClosingTag);
        const afterClosing = returnContent.slice(lastClosingTag);
        const cursorComponent = '      <VeltCursor />\n';
        const newReturnContent = beforeClosing + cursorComponent + afterClosing;
        content = content.replace(returnMatch[0], `return (\n${newReturnContent}\n  );\n}`);
      }
    }

    writeFileIfChanged(collaborationPath, content, filesModified);

    componentsAdded.push({
      file: 'components/velt/VeltCollaboration.tsx',
      name: 'VeltCursor',
      description: 'Automatically wired ReactFlow cursor into VeltCollaboration.',
    });

    integrationPoints.push({
      file: 'components/velt/VeltCollaboration.tsx',
      type: 'reactflowCursor',
      description: 'Injected Velt cursor component into ReactFlow collaboration canvas because patterns.hasReactFlow is true.',
    });
  } catch (error) {
    validationIssues.push({
      file: 'components/velt/VeltCollaboration.tsx',
      type: 'error',
      message: `Error wiring ReactFlow cursor: ${error.message}`,
    });
  }
}

/**
 * Adds TODO comments for library integrations
 *
 * @param {Object} structure - Project structure
 * @param {IntegrationPatterns} patterns - Library patterns
 * @param {string[]} filesModified - Array to track modified files
 * @param {IntegrationPoint[]} integrationPoints - Array to track integration points
 * @param {ValidationIssue[]} validationIssues - Array to track validation issues
 */
function addLibraryTodoComments(structure, patterns, filesModified, integrationPoints, validationIssues) {
  const { componentsPath } = structure;
  const collaborationPath = componentsPath('velt', 'VeltCollaboration.tsx');

  if (!fs.existsSync(collaborationPath)) {
    return; // Already reported in ensureCliOutputExists
  }

  try {
    let content = readFile(collaborationPath);
    let modified = false;

    const todos = [];

    if (patterns.hasTiptap && !content.includes('[Velt] TODO: Tiptap')) {
      todos.push({
        library: 'Tiptap',
        comment: '// [Velt] TODO: Wire Tiptap comments/collaboration here. See docs at https://docs.velt.dev/text-editor/tiptap/setup',
        pattern: 'hasTiptap',
      });
    }

    if (patterns.hasCodeMirror && !content.includes('[Velt] TODO: CodeMirror')) {
      todos.push({
        library: 'CodeMirror',
        comment: '// [Velt] TODO: Wire CodeMirror CRDT integration here. See docs at https://docs.velt.dev/async-collaboration/setup/codemirror',
        pattern: 'hasCodeMirror',
      });
    }

    if (patterns.hasAgGrid && !content.includes('[Velt] TODO: AG-Grid')) {
      todos.push({
        library: 'AG-Grid',
        comment: '// [Velt] TODO: Wire AG-Grid table comments here. Add data-velt-target-comment-element-id to cells. See docs at https://docs.velt.dev/async-collaboration/comments/customize-behavior/target-element',
        pattern: 'hasAgGrid',
      });
    }

    if (patterns.hasTanStack && !content.includes('[Velt] TODO: TanStack')) {
      todos.push({
        library: 'TanStack',
        comment: '// [Velt] TODO: Wire TanStack table comments here. Add data-velt-target-comment-element-id to cells. See docs at https://docs.velt.dev/async-collaboration/comments/customize-behavior/target-element',
        pattern: 'hasTanStack',
      });
    }

    if (todos.length > 0) {
      // Find a good place to add TODOs - after imports, before the component export
      const exportMatch = content.match(/export\s+(default\s+)?function/);

      if (exportMatch) {
        const exportIndex = exportMatch.index;
        const todosText = '\n' + todos.map(t => t.comment).join('\n') + '\n';
        content = content.slice(0, exportIndex) + todosText + content.slice(exportIndex);
        modified = true;

        // Track each TODO
        for (const todo of todos) {
          integrationPoints.push({
            file: 'components/velt/VeltCollaboration.tsx',
            type: 'todoComment',
            description: `Added TODO comment for ${todo.library} integration (patterns.${todo.pattern} detected).`,
          });
        }
      }
    }

    if (modified) {
      writeFileIfChanged(collaborationPath, content, filesModified);
    }
  } catch (error) {
    validationIssues.push({
      file: 'components/velt/VeltCollaboration.tsx',
      type: 'error',
      message: `Error adding library TODO comments: ${error.message}`,
    });
  }
}

/**
 * Runs validation checks
 *
 * @param {Object} structure - Project structure
 * @param {IntegrationConfig} config - Integration config
 * @param {ValidationIssue[]} validationIssues - Array to collect validation issues
 */
function runValidationChecks(structure, config, validationIssues) {
  const { appPath, componentsPath } = structure;

  // Validate app/page.tsx
  const pagePath = appPath('page.tsx');
  if (fs.existsSync(pagePath)) {
    try {
      const pageContent = readFile(pagePath);

      // Check for "use client" directive
      if (!pageContent.includes('"use client"') && !pageContent.includes("'use client'")) {
        validationIssues.push({
          file: 'app/page.tsx',
          type: 'validation-failed',
          message: 'Missing "use client" directive at top of file',
        });
      }

      // Check for VeltProvider
      if (!pageContent.includes('VeltProvider')) {
        validationIssues.push({
          file: 'app/page.tsx',
          type: 'validation-failed',
          message: 'VeltProvider not found in page.tsx. Expected CLI to generate this.',
        });
      }

      // Check that API key placeholder is gone
      if (pageContent.includes('"YOUR_VELT_API_KEY"')) {
        validationIssues.push({
          file: 'app/page.tsx',
          type: 'validation-failed',
          message: 'YOUR_VELT_API_KEY placeholder still exists. API key replacement may have failed.',
        });
      }
    } catch (error) {
      validationIssues.push({
        file: 'app/page.tsx',
        type: 'error',
        message: `Error validating page.tsx: ${error.message}`,
      });
    }
  }

  // Validate app/layout.tsx
  const layoutPath = appPath('layout.tsx');
  if (fs.existsSync(layoutPath)) {
    try {
      const layoutContent = readFile(layoutPath);

      // Check for AppProviders
      if (!layoutContent.includes('AppProviders')) {
        validationIssues.push({
          file: 'app/layout.tsx',
          type: 'validation-failed',
          message: 'AppProviders not found in layout.tsx. Expected CLI to generate this.',
        });
      }

      // Check that AppProviders wraps {children}
      if (layoutContent.includes('AppProviders') && !layoutContent.includes('{children}')) {
        validationIssues.push({
          file: 'app/layout.tsx',
          type: 'validation-failed',
          message: 'AppProviders exists but {children} not found. Layout structure may be incorrect.',
        });
      }
    } catch (error) {
      validationIssues.push({
        file: 'app/layout.tsx',
        type: 'error',
        message: `Error validating layout.tsx: ${error.message}`,
      });
    }
  }

  // Validate JWT route if auth token was provided
  const tokenRoutePath = appPath('api', 'velt', 'token', 'route.ts');
  if (config.authToken && fs.existsSync(tokenRoutePath)) {
    try {
      const routeContent = readFile(tokenRoutePath);

      // Check that auth token placeholder is gone
      if (routeContent.includes('"YOUR_VELT_AUTH_TOKEN"')) {
        validationIssues.push({
          file: 'app/api/velt/token/route.ts',
          type: 'validation-failed',
          message: 'YOUR_VELT_AUTH_TOKEN placeholder still exists. Auth token replacement may have failed.',
        });
      }
    } catch (error) {
      validationIssues.push({
        file: 'app/api/velt/token/route.ts',
        type: 'error',
        message: `Error validating token route: ${error.message}`,
      });
    }
  }

  // Validate core CLI-generated files exist (already done in ensureCliOutputExists, but double-check critical ones)
  const criticalFiles = [
    { path: appPath('userAuth', 'AppProviders.tsx'), name: 'app/userAuth/AppProviders.tsx' },
    { path: appPath('document', 'page.tsx'), name: 'app/document/page.tsx' },
    { path: componentsPath('velt', 'VeltCollaboration.tsx'), name: 'components/velt/VeltCollaboration.tsx' },
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file.path)) {
      // Only add if not already added
      const alreadyReported = validationIssues.some(
        issue => issue.file === file.name && issue.type === 'missing-file'
      );

      if (!alreadyReported) {
        validationIssues.push({
          file: file.name,
          type: 'validation-failed',
          message: `Critical CLI-generated file is missing: ${file.name}`,
        });
      }
    }
  }
}

// ============================================================================
// Main Integration Function
// ============================================================================

/**
 * Analyzes project and integrates Velt components
 *
 * @param {AnalyzeOptions} options - Integration options
 * @returns {Promise<IntegrationResult>} Integration result
 */
export async function analyzeAndIntegrate(options) {
  const { projectPath, config, patterns = {} } = options;

  // Initialize result
  const filesModified = [];
  const componentsAdded = [];
  const integrationPoints = [];
  const validationIssues = [];

  try {
    // Step 1: Verify this is a Next.js project
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      validationIssues.push({
        type: 'not-nextjs',
        message: 'package.json not found. This does not appear to be a valid Next.js project.',
      });

      return {
        success: false,
        data: { filesModified, componentsAdded, integrationPoints, validationIssues },
      };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const hasNext = packageJson.dependencies?.next || packageJson.devDependencies?.next;

      if (!hasNext) {
        validationIssues.push({
          type: 'not-nextjs',
          message: 'Next.js dependency not found in package.json. This does not appear to be a Next.js project.',
        });

        return {
          success: false,
          data: { filesModified, componentsAdded, integrationPoints, validationIssues },
        };
      }
    } catch (error) {
      validationIssues.push({
        type: 'error',
        message: `Error reading package.json: ${error.message}`,
      });

      return {
        success: false,
        data: { filesModified, componentsAdded, integrationPoints, validationIssues },
      };
    }

    // Step 2: Detect project structure
    const structure = detectProjectStructure(projectPath);

    // Step 3: Ensure CLI output exists
    const cliOutputExists = ensureCliOutputExists(structure, validationIssues);

    if (!cliOutputExists) {
      // CLI likely not run - return early
      return {
        success: false,
        data: { filesModified, componentsAdded, integrationPoints, validationIssues },
      };
    }

    // Step 4: Replace API key in page.tsx
    console.error('   🔑 Replacing API key placeholders...');
    replaceApiKeyInPage(structure, config.apiKey, filesModified, integrationPoints, validationIssues);

    // Step 5: Replace auth token in JWT route if provided
    if (config.authToken) {
      console.error('   🔐 Replacing auth token placeholders...');
      replaceAuthTokenInRoute(structure, config.apiKey, config.authToken, filesModified, integrationPoints, validationIssues);
    }

    // Step 6: Wire library-specific integrations

    // ReactFlow cursor (automatic wiring)
    if (patterns.hasReactFlow) {
      console.error('   🔌 Wiring ReactFlow cursor integration (from detected library)...');
      wireReactFlowCursor(structure, filesModified, componentsAdded, integrationPoints, validationIssues);
    }

    // Other libraries (TODO comments)
    const librariesToWire = [];
    if (patterns.hasTiptap) librariesToWire.push('Tiptap');
    if (patterns.hasCodeMirror) librariesToWire.push('CodeMirror');
    if (patterns.hasAgGrid) librariesToWire.push('AG-Grid');
    if (patterns.hasTanStack) librariesToWire.push('TanStack');
    
    if (librariesToWire.length > 0) {
      console.error(`   📝 Adding TODO comments for: ${librariesToWire.join(', ')}`);
    }
    addLibraryTodoComments(structure, patterns, filesModified, integrationPoints, validationIssues);

    // Step 7: Apply header positioning if specified
    if (config.headerPosition) {
      console.error(`   📍 Applying header positioning: ${config.headerPosition}...`);
      const sidebarFiles = findVeltSidebarFiles(projectPath);

      for (const filePath of sidebarFiles) {
        applyHeaderPositioning(filePath, config.headerPosition, filesModified, integrationPoints);
      }
    }

    // Step 8: Handle comment-type specific integration
    if (config.commentType && config.targetPlacement) {
      console.error(`   💬 Applying ${config.commentType} comment integration...`);

      if (config.commentType === 'popover' && config.targetPlacement.file) {
        // Add popover-specific integration
        integrationPoints.push({
          file: config.targetPlacement.file,
          type: 'popover-target',
          description: `Recommended file for popover comments: ${config.targetPlacement.file}`,
          implementationGuide: config.targetPlacement.implementationGuide,
        });
      } else if (config.commentType === 'freestyle' && config.targetPlacement.file) {
        // Add freestyle-specific integration
        integrationPoints.push({
          file: config.targetPlacement.file,
          type: 'freestyle-target',
          description: `Recommended file for freestyle comments: ${config.targetPlacement.file}`,
          implementationGuide: config.targetPlacement.implementationGuide,
        });
      }
    }

    // Step 9: Run validation checks
    runValidationChecks(structure, config, validationIssues);

    // Step 10: Return result
    const success = validationIssues.length === 0;

    return {
      success,
      data: {
        filesModified,
        componentsAdded,
        integrationPoints,
        validationIssues,
      },
    };
  } catch (error) {
    // Unexpected error
    validationIssues.push({
      type: 'error',
      message: `Unexpected error during integration: ${error.message}`,
    });

    return {
      success: false,
      data: {
        filesModified,
        componentsAdded,
        integrationPoints,
        validationIssues,
      },
    };
  }
}

// Export as both named and default for compatibility
export default { analyzeAndIntegrate };
