/**
 * Validation Utilities
 * 
 * Validates Velt installation with basic checks
 */

import fs from 'fs';
import path from 'path';

/**
 * Validates Velt installation
 * 
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @returns {Promise<Object>} Validation result
 */
export async function validateInstallation({ projectPath }) {
  const checks = [];
  let passed = 0;
  let total = 0;

  try {
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

