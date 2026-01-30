/**
 * Validation Utilities
 *
 * Validates Velt installation with basic and full integration checks.
 * Includes CLI method verification and "use client" directive checks.
 */

import fs from 'fs';
import path from 'path';
import { getCliResolutionInfo } from './cli.js';
import { isNextJsProject, detectProjectType, ProjectType } from './framework-detection.js';
import { validateUseClientDirectives, scanAndFixUseClient } from './use-client.js';

/**
 * Validates that directory is a valid React project (Next.js or plain React)
 *
 * @param {string} projectPath - Path to project directory
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.requireNextJs=false] - If true, only accepts Next.js projects
 * @returns {Object} Validation result { valid: boolean, error?: string, projectType?: string }
 */
export function validateProject(projectPath, options = {}) {
  const { requireNextJs = false } = options;
  const packageJsonPath = path.join(projectPath, 'package.json');

  // Check package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      error: `No package.json found at ${projectPath}. Is this a Node.js project?`,
    };
  }

  // Parse package.json
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  } catch (err) {
    return {
      valid: false,
      error: `Failed to parse package.json: ${err.message}`,
    };
  }

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for React (required for all)
  const hasReact = !!allDeps.react;
  if (!hasReact) {
    return {
      valid: false,
      error: '"react" not found in package.json dependencies. Velt requires a React project.',
    };
  }

  // Detect project type
  const hasNext = !!allDeps.next;
  const hasVite = !!allDeps.vite;
  const hasReactScripts = !!allDeps['react-scripts'];

  let projectType;
  if (hasNext) {
    projectType = 'nextjs';
  } else if (hasVite) {
    projectType = 'vite-react';
  } else if (hasReactScripts) {
    projectType = 'create-react-app';
  } else {
    projectType = 'react-unknown';
  }

  // If Next.js is required but not found
  if (requireNextJs && !hasNext) {
    return {
      valid: false,
      error: `"next" not found in package.json dependencies. This feature requires a Next.js project. Detected project type: ${projectType}`,
      projectType,
    };
  }

  return {
    valid: true,
    projectType,
    isNextJs: hasNext,
    framework: projectType,
  };
}

/**
 * Validates that directory is a valid Next.js project
 * @deprecated Use validateProject() instead for broader framework support
 *
 * @param {string} projectPath - Path to project directory
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateNextJsProject(projectPath) {
  // For backward compatibility, delegate to validateProject with requireNextJs=false
  // This allows React projects to pass, but validates that it's at least a React project
  const result = validateProject(projectPath, { requireNextJs: false });

  // Add warning for non-Next.js projects
  if (result.valid && !result.isNextJs) {
    console.error(`   ⚠️  Non-Next.js project detected: ${result.projectType}`);
    console.error(`   ℹ️  Some features (like "use client" directives) are Next.js-specific`);
  }

  return result;
}

/**
 * Validates CLI resolution and execution method
 *
 * @returns {Object} CLI validation result
 */
export function validateCliResolution() {
  const resolution = getCliResolutionInfo();

  return {
    name: 'CLI Resolution',
    status: resolution.method === 'error' ? 'fail' : 'pass',
    method: resolution.method,
    message: resolution.method === 'error'
      ? `CLI not found: ${resolution.error}`
      : `Using npx @velt-js/add-velt`,
    path: resolution.path,
  };
}

/**
 * Basic CLI installation validation (for SKIP/CLI-only path)
 *
 * Only checks CLI scaffolding was successful, NOT integration.
 * Checks: CLI files exist, @veltdev/react in package.json, .env.local
 * Does NOT check: VeltProvider placement, VeltComments integration
 *
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @param {Object} [params.cliResult] - CLI execution result (optional, for method reporting)
 * @returns {Promise<Object>} Validation result
 */
export async function validateBasicCliInstall({ projectPath, cliResult = null }) {
  const checks = [];
  let passed = 0;

  try {
    // Check 0: CLI Resolution/Execution Method (new)
    if (cliResult && cliResult.method) {
      checks.push({
        name: 'CLI Execution Method',
        status: cliResult.method === 'error' ? 'fail' : 'pass',
        message: cliResult.method === 'npx'
          ? 'Used npx @velt-js/add-velt'
          : `CLI method: ${cliResult.method}`,
      });

      if (cliResult.method !== 'error') passed++;
    } else {
      // Validate CLI resolution if no result provided
      const cliCheck = validateCliResolution();
      checks.push({
        name: cliCheck.name,
        status: cliCheck.status,
        message: cliCheck.message,
      });

      if (cliCheck.status === 'pass') passed++;
    }

    // Check 1: @veltdev/react in package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const hasVeltPkg = !!(
        packageJson.dependencies?.['@veltdev/react'] ||
        packageJson.devDependencies?.['@veltdev/react']
      );

      checks.push({
        name: '@veltdev/react package',
        status: hasVeltPkg ? 'pass' : 'fail',
        message: hasVeltPkg
          ? 'Package found in package.json'
          : 'Package not found - run: npm install @veltdev/react',
      });

      if (hasVeltPkg) passed++;
    } else {
      checks.push({
        name: '@veltdev/react package',
        status: 'fail',
        message: 'package.json not found',
      });
    }

    // Check 2-4: CLI scaffold files exist
    // Check both standard and src/ paths
    const scaffoldFiles = [
      {
        name: 'VeltInitializeUser.tsx',
        paths: [
          'components/velt/VeltInitializeUser.tsx',
          'src/components/velt/VeltInitializeUser.tsx',
        ],
      },
      {
        name: 'VeltInitializeDocument.tsx',
        paths: [
          'components/velt/VeltInitializeDocument.tsx',
          'src/components/velt/VeltInitializeDocument.tsx',
        ],
      },
      {
        name: 'VeltCollaboration.tsx',
        paths: [
          'components/velt/VeltCollaboration.tsx',
          'src/components/velt/VeltCollaboration.tsx',
        ],
      },
    ];

    for (const file of scaffoldFiles) {
      let exists = false;
      let foundPath = '';

      for (const filePath of file.paths) {
        const fullPath = path.join(projectPath, filePath);
        if (fs.existsSync(fullPath)) {
          exists = true;
          foundPath = filePath;
          break;
        }
      }

      checks.push({
        name: `CLI file: ${file.name}`,
        status: exists ? 'pass' : 'fail',
        message: exists ? `Found at ${foundPath}` : 'File not created by CLI',
      });

      if (exists) passed++;
    }

    // Check 5: .env.local exists (or .env)
    const envLocalPath = path.join(projectPath, '.env.local');
    const envPath = path.join(projectPath, '.env');
    const envExists = fs.existsSync(envLocalPath) || fs.existsSync(envPath);

    checks.push({
      name: 'Environment file',
      status: envExists ? 'pass' : 'warning',
      message: envExists
        ? 'Environment file exists'
        : 'No .env.local or .env found - you may need to create one with NEXT_PUBLIC_VELT_API_KEY',
    });

    if (envExists) passed++;

    // Check 6: If .env.local exists, check for API key
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf-8');
      const hasApiKey = envContent.includes('NEXT_PUBLIC_VELT_API_KEY') ||
                        envContent.includes('VELT_API_KEY');

      checks.push({
        name: 'API key in environment',
        status: hasApiKey ? 'pass' : 'warning',
        message: hasApiKey
          ? 'Velt API key found in environment file'
          : 'No Velt API key found in .env.local - add NEXT_PUBLIC_VELT_API_KEY',
      });

      if (hasApiKey) passed++;
    }

    // Check 7: "use client" directives (Next.js only)
    const projectType = detectProjectType(projectPath);
    if (projectType.projectType === ProjectType.NEXTJS) {
      const useClientValidation = validateUseClientDirectives(projectPath);

      for (const check of useClientValidation.checks) {
        checks.push(check);
        if (check.status === 'pass') passed++;
      }
    }

    return {
      checks,
      passed,
      total: checks.length,
      score: `${passed}/${checks.length}`,
      status: passed === checks.length
        ? 'excellent'
        : passed >= checks.length * 0.6
          ? 'good'
          : 'needs_attention',
    };
  } catch (error) {
    return {
      checks,
      passed,
      total: checks.length,
      score: `${passed}/${checks.length}`,
      error: error.message,
    };
  }
}

/**
 * Full integration validation (for guided path after apply)
 *
 * Checks everything in basic validation PLUS integration:
 * VeltProvider in layout, VeltComments in page, etc.
 *
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @param {Object} [params.cliResult] - CLI execution result (optional)
 * @returns {Promise<Object>} Validation result
 */
export async function validateInstallation({ projectPath, cliResult = null }) {
  const checks = [];
  let passed = 0;
  let total = 0;

  try {
    // Check 0: CLI Execution Method (new)
    total++;
    if (cliResult && cliResult.method) {
      checks.push({
        name: 'CLI Execution',
        status: cliResult.success ? 'pass' : 'warning',
        message: cliResult.success
          ? `CLI succeeded via ${cliResult.method === 'npx' ? 'npx @velt-js/add-velt' : cliResult.method}`
          : `CLI had issues (${cliResult.method}) but may have created files`,
      });

      if (cliResult.success || cliResult.method !== 'error') passed++;
    } else {
      const cliCheck = validateCliResolution();
      checks.push({
        name: 'CLI Resolution',
        status: cliCheck.status,
        message: cliCheck.message,
      });

      if (cliCheck.status === 'pass') passed++;
    }

    // Check 1: package.json has @veltdev/react
    total++;
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const hasVelt = !!(
        packageJson.dependencies?.['@veltdev/react'] ||
        packageJson.devDependencies?.['@veltdev/react']
      );

      checks.push({
        name: 'Velt package installed',
        status: hasVelt ? 'pass' : 'fail',
        message: hasVelt
          ? '@veltdev/react found in package.json'
          : '@veltdev/react not found in package.json',
      });

      if (hasVelt) passed++;
    } else {
      checks.push({
        name: 'Velt package installed',
        status: 'fail',
        message: 'package.json not found',
      });
    }

    // Check 2: .env.local has API key
    total++;
    const envPath = path.join(projectPath, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const hasApiKey = envContent.includes('NEXT_PUBLIC_VELT_API_KEY');

      checks.push({
        name: 'Environment configured',
        status: hasApiKey ? 'pass' : 'fail',
        message: hasApiKey
          ? 'NEXT_PUBLIC_VELT_API_KEY found in .env.local'
          : 'NEXT_PUBLIC_VELT_API_KEY not found in .env.local',
      });

      if (hasApiKey) passed++;
    } else {
      checks.push({
        name: 'Environment configured',
        status: 'fail',
        message: '.env.local not found',
      });
    }

    // Check 3: VeltProvider in layout
    total++;
    const layoutPaths = [
      'app/layout.tsx',
      'app/layout.js',
      'src/app/layout.tsx',
      'src/app/layout.js',
    ];

    let layoutFound = false;
    let hasVeltProvider = false;

    for (const layoutPath of layoutPaths) {
      const fullPath = path.join(projectPath, layoutPath);
      if (fs.existsSync(fullPath)) {
        layoutFound = true;
        const layoutContent = fs.readFileSync(fullPath, 'utf-8');
        hasVeltProvider = layoutContent.includes('VeltProvider');
        break;
      }
    }

    checks.push({
      name: 'VeltProvider configured',
      status: hasVeltProvider ? 'pass' : 'fail',
      message: layoutFound
        ? hasVeltProvider
          ? 'VeltProvider found in layout'
          : 'VeltProvider not found in layout'
        : 'Layout file not found',
    });

    if (hasVeltProvider) passed++;

    // Check 4: VeltComments in page
    total++;
    const pagePaths = [
      'app/page.tsx',
      'app/page.js',
      'src/app/page.tsx',
      'src/app/page.js',
    ];

    let pageFound = false;
    let hasVeltComments = false;

    for (const pagePath of pagePaths) {
      const fullPath = path.join(projectPath, pagePath);
      if (fs.existsSync(fullPath)) {
        pageFound = true;
        const pageContent = fs.readFileSync(fullPath, 'utf-8');
        hasVeltComments = pageContent.includes('VeltComments');
        break;
      }
    }

    checks.push({
      name: 'VeltComments added',
      status: hasVeltComments ? 'pass' : 'fail',
      message: pageFound
        ? hasVeltComments
          ? 'VeltComments found in page'
          : 'VeltComments not found in page'
        : 'Page file not found',
    });

    if (hasVeltComments) passed++;

    // Check 5: VeltCommentsSidebar in layout
    total++;
    let hasVeltSidebar = false;

    if (layoutFound) {
      for (const layoutPath of layoutPaths) {
        const fullPath = path.join(projectPath, layoutPath);
        if (fs.existsSync(fullPath)) {
          const layoutContent = fs.readFileSync(fullPath, 'utf-8');
          hasVeltSidebar = layoutContent.includes('VeltCommentsSidebar');
          break;
        }
      }
    }

    checks.push({
      name: 'VeltCommentsSidebar added',
      status: hasVeltSidebar ? 'pass' : 'fail',
      message: layoutFound
        ? hasVeltSidebar
          ? 'VeltCommentsSidebar found in layout'
          : 'VeltCommentsSidebar not found in layout'
        : 'Layout file not found',
    });

    if (hasVeltSidebar) passed++;

    // Check 6: "use client" directives (Next.js only)
    const projectType = detectProjectType(projectPath);
    if (projectType.projectType === ProjectType.NEXTJS) {
      const useClientValidation = validateUseClientDirectives(projectPath);

      for (const check of useClientValidation.checks) {
        total++;
        checks.push(check);
        if (check.status === 'pass') passed++;
      }
    }

    return {
      checks,
      passed,
      total,
      score: `${passed}/${total}`,
      status: passed === total ? 'excellent' : passed >= total * 0.8 ? 'good' : 'needs_improvement',
    };
  } catch (error) {
    return {
      checks,
      passed,
      total,
      score: `${passed}/${total}`,
      error: error.message,
    };
  }
}

/**
 * Applies "use client" fixes to files that need them (Next.js only)
 *
 * @param {string} projectPath - Project path
 * @returns {Object} Fix results
 */
export function applyUseClientFixes(projectPath) {
  const projectType = detectProjectType(projectPath);

  if (projectType.projectType !== ProjectType.NEXTJS) {
    return {
      skipped: true,
      reason: `Project type is ${projectType.projectType}, not Next.js`,
    };
  }

  return scanAndFixUseClient({
    projectPath,
    fix: true,
  });
}

export default {
  validateProject,
  validateNextJsProject,
  validateCliResolution,
  validateBasicCliInstall,
  validateInstallation,
  applyUseClientFixes,
};
