/**
 * Framework Detection Utility
 *
 * Detects whether the target project is Next.js, React (CRA/Vite), or unknown.
 * This information is used for:
 * - Determining if "use client" directives are needed (Next.js only)
 * - Adjusting installation patterns based on framework
 */

import fs from 'fs';
import path from 'path';

/**
 * Project type enum
 */
export const ProjectType = {
  NEXTJS: 'nextjs',
  REACT: 'react',
  UNKNOWN: 'unknown',
};

/**
 * Detects the project type by analyzing package.json and file structure
 *
 * @param {string} projectPath - Path to the project directory
 * @returns {Object} Detection result { projectType, signals, confidence }
 */
export function detectProjectType(projectPath) {
  const signals = [];
  let nextjsScore = 0;
  let reactScore = 0;

  // === Check package.json dependencies ===
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Next.js indicators
      if (allDeps.next) {
        signals.push({ type: 'dependency', name: 'next', framework: 'nextjs' });
        nextjsScore += 3; // Strong signal
      }

      // React (non-Next) indicators
      if (allDeps['react-scripts']) {
        signals.push({ type: 'dependency', name: 'react-scripts', framework: 'react' });
        reactScore += 3; // CRA
      }

      if (allDeps.vite && allDeps.react) {
        signals.push({ type: 'dependency', name: 'vite+react', framework: 'react' });
        reactScore += 3; // Vite React
      }

      // Generic React (both Next.js and React have this)
      if (allDeps.react) {
        signals.push({ type: 'dependency', name: 'react', framework: 'both' });
      }

    } catch (err) {
      signals.push({ type: 'error', message: `Failed to parse package.json: ${err.message}` });
    }
  }

  // === Check file structure ===

  // Next.js specific files/folders
  const nextjsIndicators = [
    { path: 'next.config.js', weight: 3 },
    { path: 'next.config.ts', weight: 3 },
    { path: 'next.config.mjs', weight: 3 },
    { path: 'app', weight: 2, isDir: true }, // App Router
    { path: 'pages', weight: 2, isDir: true }, // Pages Router
    { path: 'app/layout.tsx', weight: 2 },
    { path: 'app/layout.js', weight: 2 },
    { path: 'app/page.tsx', weight: 1 },
    { path: 'app/page.js', weight: 1 },
    { path: 'pages/_app.tsx', weight: 2 },
    { path: 'pages/_app.js', weight: 2 },
    { path: 'src/app/layout.tsx', weight: 2 },
    { path: 'src/app/layout.js', weight: 2 },
  ];

  for (const indicator of nextjsIndicators) {
    const fullPath = path.join(projectPath, indicator.path);
    const exists = indicator.isDir
      ? fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()
      : fs.existsSync(fullPath);

    if (exists) {
      signals.push({ type: 'file', path: indicator.path, framework: 'nextjs' });
      nextjsScore += indicator.weight;
    }
  }

  // React (non-Next) specific files
  const reactIndicators = [
    { path: 'src/main.tsx', weight: 2 }, // Vite React
    { path: 'src/main.jsx', weight: 2 },
    { path: 'src/index.tsx', weight: 2 }, // CRA
    { path: 'src/index.jsx', weight: 2 },
    { path: 'vite.config.ts', weight: 2 },
    { path: 'vite.config.js', weight: 2 },
    { path: 'public/index.html', weight: 1 }, // CRA/Vite
    { path: 'index.html', weight: 1 }, // Vite root
  ];

  for (const indicator of reactIndicators) {
    const fullPath = path.join(projectPath, indicator.path);
    if (fs.existsSync(fullPath)) {
      signals.push({ type: 'file', path: indicator.path, framework: 'react' });
      reactScore += indicator.weight;
    }
  }

  // === Determine project type ===
  let projectType;
  let confidence;

  if (nextjsScore > reactScore && nextjsScore >= 3) {
    projectType = ProjectType.NEXTJS;
    confidence = nextjsScore >= 6 ? 'high' : 'medium';
  } else if (reactScore > nextjsScore && reactScore >= 3) {
    projectType = ProjectType.REACT;
    confidence = reactScore >= 6 ? 'high' : 'medium';
  } else if (nextjsScore > 0 || reactScore > 0) {
    // Some signals but not conclusive
    projectType = nextjsScore >= reactScore ? ProjectType.NEXTJS : ProjectType.REACT;
    confidence = 'low';
  } else {
    projectType = ProjectType.UNKNOWN;
    confidence = 'none';
  }

  return {
    projectType,
    signals,
    confidence,
    scores: {
      nextjs: nextjsScore,
      react: reactScore,
    },
  };
}

/**
 * Checks if project is Next.js
 *
 * @param {string} projectPath - Path to project
 * @returns {boolean} True if Next.js project
 */
export function isNextJsProject(projectPath) {
  const detection = detectProjectType(projectPath);
  return detection.projectType === ProjectType.NEXTJS;
}

/**
 * Detects which router type Next.js project uses
 *
 * @param {string} projectPath - Path to project
 * @returns {Object} Router detection { routerType: 'app'|'pages'|'both'|'unknown', paths: {} }
 */
export function detectNextJsRouter(projectPath) {
  const result = {
    routerType: 'unknown',
    paths: {
      appDir: null,
      pagesDir: null,
      layoutFile: null,
      pageFile: null,
    },
  };

  // Check for app directory (App Router)
  const appDirPaths = ['app', 'src/app'];
  for (const dir of appDirPaths) {
    const fullPath = path.join(projectPath, dir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      result.paths.appDir = dir;

      // Find layout file
      for (const ext of ['tsx', 'jsx', 'ts', 'js']) {
        const layoutPath = path.join(fullPath, `layout.${ext}`);
        if (fs.existsSync(layoutPath)) {
          result.paths.layoutFile = path.join(dir, `layout.${ext}`);
          break;
        }
      }

      // Find page file
      for (const ext of ['tsx', 'jsx', 'ts', 'js']) {
        const pagePath = path.join(fullPath, `page.${ext}`);
        if (fs.existsSync(pagePath)) {
          result.paths.pageFile = path.join(dir, `page.${ext}`);
          break;
        }
      }
      break;
    }
  }

  // Check for pages directory (Pages Router)
  const pagesDirPaths = ['pages', 'src/pages'];
  for (const dir of pagesDirPaths) {
    const fullPath = path.join(projectPath, dir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      result.paths.pagesDir = dir;
      break;
    }
  }

  // Determine router type
  if (result.paths.appDir && result.paths.pagesDir) {
    result.routerType = 'both';
  } else if (result.paths.appDir) {
    result.routerType = 'app';
  } else if (result.paths.pagesDir) {
    result.routerType = 'pages';
  }

  return result;
}

/**
 * Gets framework-specific information for installation
 *
 * @param {string} projectPath - Path to project
 * @returns {Object} Framework info for installation
 */
export function getFrameworkInfo(projectPath) {
  const detection = detectProjectType(projectPath);
  const info = {
    projectType: detection.projectType,
    confidence: detection.confidence,
    needsUseClient: false,
    routerType: null,
    paths: {},
  };

  if (detection.projectType === ProjectType.NEXTJS) {
    info.needsUseClient = true;
    const routerInfo = detectNextJsRouter(projectPath);
    info.routerType = routerInfo.routerType;
    info.paths = routerInfo.paths;
  }

  return info;
}

export default {
  ProjectType,
  detectProjectType,
  isNextJsProject,
  detectNextJsRouter,
  getFrameworkInfo,
};
