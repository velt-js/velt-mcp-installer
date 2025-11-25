/**
 * Comment Placement Detector
 *
 * Analyzes project structure to determine the best files and locations
 * for placing Velt comments (Freestyle or Popover).
 */

import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} CommentPlacement
 * @property {string} file - File path where comment should be added
 * @property {string} componentName - Name of the component/file
 * @property {string} reason - Why this location was chosen
 * @property {string} implementationGuide - How to implement the comment type
 * @property {number} confidence - Confidence score (0-100)
 */

/**
 * Detects where to place comments based on user's description and comment type
 *
 * @param {Object} options - Detection options
 * @param {string} options.projectPath - Path to the Next.js project
 * @param {string} options.commentType - 'freestyle' or 'popover'
 * @param {string} [options.targetDescription] - User's description of where to place comments (e.g., "header", "sidebar")
 * @param {string} [options.targetComponent] - Specific component name if known
 * @returns {Promise<Object>} Detection results
 */
export async function detectCommentPlacement(options) {
  const {
    projectPath,
    commentType,
    targetDescription = '',
    targetComponent = '',
  } = options;

  try {
    console.error(`🔍 Analyzing project for ${commentType} comment placement...`);
    if (targetDescription) {
      console.error(`   🎯 Target: ${targetDescription}`);
    }

    // Step 1: Detect project structure
    const structure = detectProjectStructure(projectPath);

    // Step 2: Find candidate files
    const candidates = await findCandidateFiles({
      structure,
      targetDescription,
      targetComponent,
      commentType,
    });

    // Step 3: Rank candidates by confidence
    const rankedCandidates = rankCandidates(candidates, {
      commentType,
      targetDescription,
      targetComponent,
    });

    console.error(`   ✅ Found ${rankedCandidates.length} potential placement(s)`);

    return {
      success: true,
      data: {
        commentType,
        targetDescription,
        placements: rankedCandidates,
        recommendedPlacement: rankedCandidates[0] || null,
      },
    };
  } catch (error) {
    console.error(`   ❌ Error detecting comment placement: ${error.message}`);

    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

/**
 * Detects project structure
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
    projectPath,
  };
}

/**
 * Finds candidate files for comment placement
 */
async function findCandidateFiles(options) {
  const { structure, targetDescription, targetComponent, commentType } = options;
  const candidates = [];

  // Helper to search directory recursively
  function searchDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        searchDirectory(fullPath, relPath);
      } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
        // Analyze this file
        const analysis = analyzeFile(fullPath, relPath, targetDescription, targetComponent, commentType);
        if (analysis) {
          candidates.push(analysis);
        }
      }
    }
  }

  // Search app directory
  searchDirectory(structure.appRoot, 'app');

  // Search components directory
  if (fs.existsSync(structure.componentsRoot)) {
    searchDirectory(structure.componentsRoot, 'components');
  }

  return candidates;
}

/**
 * Analyzes a file to determine if it's a good candidate
 */
function analyzeFile(filePath, relativePath, targetDescription, targetComponent, commentType) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const componentName = fileName.replace(/\.(tsx|jsx)$/, '');

    // Calculate match score
    let matchScore = 0;
    let matchReasons = [];

    // Check if filename matches target description
    const normalizedTarget = targetDescription.toLowerCase();
    const normalizedFileName = fileName.toLowerCase();
    const normalizedRelPath = relativePath.toLowerCase();

    // Keyword matching
    const keywords = {
      header: ['header', 'navbar', 'nav', 'topbar', 'menu'],
      sidebar: ['sidebar', 'drawer', 'aside', 'panel'],
      footer: ['footer', 'bottom'],
      main: ['main', 'content', 'body', 'page'],
      card: ['card', 'item', 'post', 'article'],
      list: ['list', 'grid', 'table'],
      form: ['form', 'input', 'field'],
      button: ['button', 'btn', 'action'],
    };

    // Match against keywords
    for (const [category, words] of Object.entries(keywords)) {
      if (normalizedTarget.includes(category)) {
        for (const word of words) {
          if (normalizedFileName.includes(word) || normalizedRelPath.includes(word)) {
            matchScore += 30;
            matchReasons.push(`Matches "${word}" in filename/path`);
            break;
          }
        }
      }
    }

    // Check if specific component name matches
    if (targetComponent && normalizedFileName.includes(targetComponent.toLowerCase())) {
      matchScore += 50;
      matchReasons.push(`Matches specified component name "${targetComponent}"`);
    }

    // Check for React component patterns
    if (content.includes('export default') || content.includes('export function') || content.includes('export const')) {
      matchScore += 10;
      matchReasons.push('Contains React component export');
    }

    // Freestyle comments work best on page-level components
    if (commentType === 'freestyle') {
      if (fileName === 'page.tsx' || fileName === 'page.jsx') {
        matchScore += 20;
        matchReasons.push('Page component is ideal for freestyle comments');
      }
      if (content.includes('VeltComments') || content.includes('VeltProvider')) {
        matchScore += 15;
        matchReasons.push('Already has Velt integration');
      }
    }

    // Popover comments work best on interactive components
    if (commentType === 'popover') {
      if (content.includes('onClick') || content.includes('button') || content.includes('Button')) {
        matchScore += 15;
        matchReasons.push('Has interactive elements (good for popover)');
      }
      if (content.includes('card') || content.includes('Card') || content.includes('item')) {
        matchScore += 15;
        matchReasons.push('Has card/item components (good for popover)');
      }
    }

    // If no matches, skip this file
    if (matchScore === 0) {
      return null;
    }

    // Build implementation guide
    const implementationGuide = buildImplementationGuide(commentType, componentName, content);

    return {
      file: relativePath,
      fullPath: filePath,
      componentName,
      reason: matchReasons.join('; '),
      implementationGuide,
      confidence: Math.min(matchScore, 100),
      commentType,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Builds implementation guide for the comment type
 */
function buildImplementationGuide(commentType, componentName, fileContent) {
  if (commentType === 'freestyle') {
    return `
To add Freestyle Comments to ${componentName}:

1. Import: import { VeltComments } from '@veltdev/react';
2. Add component: <VeltComments />
3. Freestyle comments allow users to click anywhere on the page to add comments
4. No additional props required for basic setup

Example:
  <div>
    <VeltComments />
    {/* Your existing content */}
  </div>

Docs: https://docs.velt.dev/async-collaboration/comments/setup/freestyle
`;
  }

  if (commentType === 'popover') {
    return `
To add Popover Comments to ${componentName}:

1. Import: import { VeltCommentTool } from '@veltdev/react';
2. Add data attribute to target elements: data-velt-comment-target="{uniqueId}"
3. Add the comment tool component: <VeltCommentTool commentTargetId="{uniqueId}" />

Example:
  <div data-velt-comment-target="component-${componentName.toLowerCase()}">
    <VeltCommentTool commentTargetId="component-${componentName.toLowerCase()}" />
    {/* Your existing content */}
  </div>

Docs: https://docs.velt.dev/async-collaboration/comments/setup/popover
`;
  }

  return `See Velt documentation for ${commentType} comments implementation.`;
}

/**
 * Ranks candidates by confidence score
 */
function rankCandidates(candidates, options) {
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Return top 5 candidates
}

export default {
  detectCommentPlacement,
};
