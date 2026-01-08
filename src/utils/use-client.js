/**
 * "use client" Directive Utility
 *
 * Ensures Next.js App Router files that need client-side behavior
 * have the "use client" directive at the top of the file.
 *
 * This is required for files that use:
 * - React hooks (useState, useEffect, useContext, etc.)
 * - Browser APIs (window, document, localStorage, etc.)
 * - Event handlers (onClick, onChange, onSubmit, etc.)
 * - Velt UI components (VeltComments, VeltProvider, etc.)
 */

import fs from 'fs';
import path from 'path';

/**
 * Patterns that indicate a file needs "use client"
 */
const CLIENT_INDICATORS = {
  // React hooks
  hooks: [
    /\buse[A-Z]\w*\s*\(/,          // useXxx() pattern
    /\buseState\b/,
    /\buseEffect\b/,
    /\buseContext\b/,
    /\buseRef\b/,
    /\buseCallback\b/,
    /\buseMemo\b/,
    /\buseReducer\b/,
    /\buseLayoutEffect\b/,
  ],

  // Browser APIs
  browserApis: [
    /\bwindow\b/,
    /\bdocument\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bnavigator\b/,
    /\blocation\b/,
  ],

  // Event handlers in JSX
  eventHandlers: [
    /\bonClick\s*=/,
    /\bonChange\s*=/,
    /\bonSubmit\s*=/,
    /\bonKeyDown\s*=/,
    /\bonKeyUp\s*=/,
    /\bonKeyPress\s*=/,
    /\bonFocus\s*=/,
    /\bonBlur\s*=/,
    /\bonInput\s*=/,
    /\bonMouseEnter\s*=/,
    /\bonMouseLeave\s*=/,
    /\bonScroll\s*=/,
    /\bonLoad\s*=/,
    /\bonError\s*=/,
  ],

  // Velt client components (these require client-side rendering)
  veltComponents: [
    /\bVeltComments\b/,
    /\bVeltCommentsSidebar\b/,
    /\bVeltProvider\b/,
    /\bVeltPresence\b/,
    /\bVeltCursor\b/,
    /\bVeltCursors\b/,
    /\bVeltNotificationsTool\b/,
    /\bVeltSidebarButton\b/,
    /\bVeltRecorder\b/,
    /\bVeltHuddleTool\b/,
    /\bVeltCommentTool\b/,
    /\bVeltCommentBubble\b/,
    /\bVeltWireframe\b/,
    /\buseVeltClient\b/,
    /\buseSetDocuments\b/,
  ],
};

/**
 * Checks if file content already has "use client" directive
 *
 * @param {string} content - File content
 * @returns {boolean} True if has "use client"
 */
export function hasUseClientDirective(content) {
  // "use client" must be at the very start (possibly after whitespace/comments)
  const trimmed = content.trimStart();
  return (
    trimmed.startsWith('"use client"') ||
    trimmed.startsWith("'use client'") ||
    trimmed.startsWith('`use client`')
  );
}

/**
 * Checks if file content needs "use client" directive
 *
 * @param {string} content - File content
 * @returns {Object} { needsDirective: boolean, reasons: string[] }
 */
export function needsUseClientDirective(content) {
  const reasons = [];

  // Check hooks
  for (const pattern of CLIENT_INDICATORS.hooks) {
    if (pattern.test(content)) {
      reasons.push(`React hook detected: ${pattern.source}`);
      break; // One hook is enough
    }
  }

  // Check browser APIs
  for (const pattern of CLIENT_INDICATORS.browserApis) {
    if (pattern.test(content)) {
      reasons.push(`Browser API detected: ${pattern.source}`);
      break;
    }
  }

  // Check event handlers
  for (const pattern of CLIENT_INDICATORS.eventHandlers) {
    if (pattern.test(content)) {
      reasons.push(`Event handler detected: ${pattern.source}`);
      break;
    }
  }

  // Check Velt components
  for (const pattern of CLIENT_INDICATORS.veltComponents) {
    if (pattern.test(content)) {
      reasons.push(`Velt client component detected: ${pattern.source}`);
      break;
    }
  }

  return {
    needsDirective: reasons.length > 0,
    reasons,
  };
}

/**
 * Ensures file has "use client" directive if needed
 *
 * @param {string} filePath - Path to file (for logging)
 * @param {string} content - File content
 * @returns {Object} { modified: boolean, content: string, reason?: string }
 */
export function ensureUseClient(filePath, content) {
  // Already has directive
  if (hasUseClientDirective(content)) {
    return {
      modified: false,
      content,
      reason: 'Already has "use client" directive',
    };
  }

  // Check if needs directive
  const check = needsUseClientDirective(content);

  if (!check.needsDirective) {
    return {
      modified: false,
      content,
      reason: 'Does not need "use client" (no client-only code detected)',
    };
  }

  // Add directive at the very top
  const newContent = `"use client";\n\n${content}`;

  return {
    modified: true,
    content: newContent,
    reason: `Added "use client" - ${check.reasons[0]}`,
  };
}

/**
 * Scans a directory for files that need "use client" and optionally fixes them
 *
 * @param {Object} params
 * @param {string} params.projectPath - Project root path
 * @param {string[]} [params.scanPaths] - Relative paths to scan (default: Velt component directories)
 * @param {boolean} [params.fix=false] - Whether to actually fix files
 * @returns {Object} Scan results
 */
export function scanAndFixUseClient({
  projectPath,
  scanPaths = null,
  fix = false,
}) {
  const results = {
    scanned: [],
    needsFix: [],
    fixed: [],
    alreadyCorrect: [],
    errors: [],
  };

  // Default scan paths for Velt components
  const defaultPaths = [
    'components/velt',
    'src/components/velt',
    'app',
    'src/app',
  ];

  const pathsToScan = scanPaths || defaultPaths;

  // Recursively find all .tsx and .jsx files
  function findFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          files.push(...findFiles(fullPath));
        }
      } else if (entry.isFile()) {
        // Only process .tsx, .jsx, .ts, .js files
        if (/\.(tsx|jsx|ts|js)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  // Scan each path
  for (const scanPath of pathsToScan) {
    const fullScanPath = path.join(projectPath, scanPath);
    const files = findFiles(fullScanPath);

    for (const filePath of files) {
      const relativePath = path.relative(projectPath, filePath);
      results.scanned.push(relativePath);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = ensureUseClient(filePath, content);

        if (result.modified) {
          results.needsFix.push({
            path: relativePath,
            reason: result.reason,
          });

          if (fix) {
            fs.writeFileSync(filePath, result.content, 'utf-8');
            results.fixed.push({
              path: relativePath,
              reason: result.reason,
            });
          }
        } else if (hasUseClientDirective(content)) {
          results.alreadyCorrect.push(relativePath);
        }
      } catch (err) {
        results.errors.push({
          path: relativePath,
          error: err.message,
        });
      }
    }
  }

  return results;
}

/**
 * Validates "use client" directives in a Next.js project
 *
 * @param {string} projectPath - Project root path
 * @returns {Object} Validation result with checks array
 */
export function validateUseClientDirectives(projectPath) {
  const checks = [];
  let passed = 0;

  // Scan Velt component directories
  const scanResult = scanAndFixUseClient({
    projectPath,
    fix: false,
  });

  // Check: All Velt component files have proper directives
  const veltFiles = scanResult.scanned.filter(f =>
    f.includes('velt') || f.includes('Velt')
  );

  const veltNeedsFix = scanResult.needsFix.filter(f =>
    f.path.includes('velt') || f.path.includes('Velt')
  );

  if (veltFiles.length > 0) {
    const allCorrect = veltNeedsFix.length === 0;

    checks.push({
      name: 'Velt components "use client"',
      status: allCorrect ? 'pass' : 'warning',
      message: allCorrect
        ? `All ${veltFiles.length} Velt component files have correct directives`
        : `${veltNeedsFix.length} Velt component file(s) missing "use client": ${veltNeedsFix.map(f => f.path).join(', ')}`,
    });

    if (allCorrect) passed++;
  }

  // Check: App Router files with client code have directives
  const appFiles = scanResult.scanned.filter(f =>
    f.startsWith('app/') || f.startsWith('src/app/')
  );

  const appNeedsFix = scanResult.needsFix.filter(f =>
    f.path.startsWith('app/') || f.path.startsWith('src/app/')
  );

  if (appFiles.length > 0) {
    const allCorrect = appNeedsFix.length === 0;

    checks.push({
      name: 'App Router "use client"',
      status: allCorrect ? 'pass' : 'warning',
      message: allCorrect
        ? `All App Router files have correct directives`
        : `${appNeedsFix.length} App Router file(s) may need "use client": ${appNeedsFix.map(f => f.path).join(', ')}`,
    });

    if (allCorrect) passed++;
  }

  return {
    checks,
    passed,
    total: checks.length,
    score: `${passed}/${checks.length}`,
    details: {
      scannedFiles: scanResult.scanned.length,
      needsFix: scanResult.needsFix,
      alreadyCorrect: scanResult.alreadyCorrect.length,
    },
  };
}

export default {
  hasUseClientDirective,
  needsUseClientDirective,
  ensureUseClient,
  scanAndFixUseClient,
  validateUseClientDirectives,
};
