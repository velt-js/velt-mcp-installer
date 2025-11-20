/**
 * Code Analysis and Integration Utilities
 * 
 * Analyzes customer code and integrates Velt components based on patterns
 */

import fs from 'fs';
import path from 'path';

/**
 * Finds a file in common locations
 * 
 * @param {string} projectPath - Project root
 * @param {string[]} possiblePaths - Array of possible file paths
 * @returns {string|null} Found file path or null
 */
function findFile(projectPath, possiblePaths) {
  for (const filePath of possiblePaths) {
    const fullPath = path.join(projectPath, filePath);
    if (fs.existsSync(fullPath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Adds import statement to file content
 * 
 * @param {string} content - File content
 * @param {string} importStatement - Import statement to add
 * @returns {string} Updated content
 */
function addImport(content, importStatement) {
  // Check if import already exists
  if (content.includes(importStatement)) {
    return content;
  }

  // Find the last import statement
  const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
  const imports = content.match(importRegex) || [];
  
  if (imports.length > 0) {
    // Add after last import
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const afterLastImport = lastImportIndex + lastImport.length;
    
    return (
      content.slice(0, afterLastImport) +
      '\n' +
      importStatement +
      content.slice(afterLastImport)
    );
  } else {
    // No imports, add at top
    return importStatement + '\n' + content;
  }
}

/**
 * Wraps children with a component
 * 
 * @param {string} content - File content
 * @param {string} componentName - Component name to wrap with
 * @param {string} importStatement - Import statement for component
 * @returns {string} Updated content
 */
function wrapWithComponent(content, componentName, importStatement) {
  // Add import if not present
  let updated = addImport(content, importStatement);

  // Find the return statement and wrap children
  // Simple pattern: look for return ( ... )
  const returnMatch = updated.match(/return\s*\(([\s\S]*?)\)\s*;?\s*$/m);
  
  if (returnMatch) {
    const returnContent = returnMatch[1];
    const wrapped = `<${componentName}>\n${returnContent}\n</${componentName}>`;
    updated = updated.replace(returnMatch[0], `return (\n${wrapped}\n);`);
  }

  return updated;
}

/**
 * Adds component to JSX content
 * 
 * @param {string} content - File content
 * @param {string} componentJSX - Component JSX to add
 * @param {string} importStatement - Import statement
 * @returns {string} Updated content
 */
function addComponent(content, componentJSX, importStatement) {
  let updated = addImport(content, importStatement);

  // Try to add before closing tag of main container
  // Look for </div> or </main> at end
  const closingTagMatch = updated.match(/(<\/div>|<\/main>)\s*$/m);
  
  if (closingTagMatch) {
    const beforeClosing = updated.slice(0, closingTagMatch.index);
    const closing = updated.slice(closingTagMatch.index);
    updated = beforeClosing + '\n' + componentJSX + '\n' + closing;
  } else {
    // Fallback: add at end before last }
    const lastBrace = updated.lastIndexOf('}');
    if (lastBrace > 0) {
      updated = updated.slice(0, lastBrace) + '\n' + componentJSX + '\n' + updated.slice(lastBrace);
    }
  }

  return updated;
}

/**
 * Analyzes project and integrates Velt components
 * 
 * @param {Object} params
 * @param {string} params.projectPath - Project path
 * @param {Object} params.patterns - Patterns from Velt MCP
 * @returns {Promise<Object>} Integration result
 */
export async function analyzeAndIntegrate({ projectPath, patterns }) {
  const result = {
    success: true,
    data: {
      filesModified: [],
      componentsAdded: [],
      integrationPoints: [],
    },
  };

  try {
    // Step 1: Find layout file
    const layoutPaths = [
      'app/layout.tsx',
      'app/layout.js',
      'src/app/layout.tsx',
      'src/app/layout.js',
    ];

    const layoutFile = findFile(projectPath, layoutPaths);

    if (layoutFile) {
      const layoutPath = path.join(projectPath, layoutFile);
      let layoutContent = fs.readFileSync(layoutPath, 'utf-8');

      // Add VeltProvider if not present
      if (!layoutContent.includes('VeltProvider')) {
        const providerImport = "import { VeltProvider } from '@veltdev/react';";
        layoutContent = wrapWithComponent(
          layoutContent,
          'VeltProvider',
          providerImport
        );

        fs.writeFileSync(layoutPath, layoutContent);
        result.data.filesModified.push(layoutFile);
        result.data.componentsAdded.push('VeltProvider');
        result.data.integrationPoints.push({
          file: layoutFile,
          component: 'VeltProvider',
          type: 'wrapper',
        });
      }

      // Add VeltCommentsSidebar if not present
      if (!layoutContent.includes('VeltCommentsSidebar')) {
        const sidebarImport = "import { VeltCommentsSidebar } from '@veltdev/react';";
        layoutContent = addComponent(
          layoutContent,
          '<VeltCommentsSidebar />',
          sidebarImport
        );

        fs.writeFileSync(layoutPath, layoutContent);
        if (!result.data.filesModified.includes(layoutFile)) {
          result.data.filesModified.push(layoutFile);
        }
        result.data.componentsAdded.push('VeltCommentsSidebar');
        result.data.integrationPoints.push({
          file: layoutFile,
          component: 'VeltCommentsSidebar',
          type: 'component',
        });
      }
    }

    // Step 2: Find main page file
    const pagePaths = [
      'app/page.tsx',
      'app/page.js',
      'src/app/page.tsx',
      'src/app/page.js',
    ];

    const pageFile = findFile(projectPath, pagePaths);

    if (pageFile) {
      const pagePath = path.join(projectPath, pageFile);
      let pageContent = fs.readFileSync(pagePath, 'utf-8');

      // Add VeltComments if not present
      if (!pageContent.includes('VeltComments')) {
        const commentsImport = "import { VeltComments } from '@veltdev/react';";
        pageContent = addComponent(
          pageContent,
          '<VeltComments />',
          commentsImport
        );

        fs.writeFileSync(pagePath, pageContent);
        result.data.filesModified.push(pageFile);
        result.data.componentsAdded.push('VeltComments');
        result.data.integrationPoints.push({
          file: pageFile,
          component: 'VeltComments',
          type: 'component',
        });
      }
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: result.data,
    };
  }
}

