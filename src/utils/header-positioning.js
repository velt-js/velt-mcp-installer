/**
 * Header Positioning Utility
 *
 * Handles VeltCommentsSidebar positioning based on user preference.
 */

import fs from 'fs';

/**
 * Position mapping
 */
const POSITION_STYLES = {
  'top-left': {
    position: 'fixed',
    top: '20px',
    left: '20px',
    right: 'auto',
    bottom: 'auto',
  },
  'top-right': {
    position: 'fixed',
    top: '20px',
    right: '20px',
    left: 'auto',
    bottom: 'auto',
  },
  'bottom-left': {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    right: 'auto',
    top: 'auto',
  },
  'bottom-right': {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    left: 'auto',
    top: 'auto',
  },
};

/**
 * Applies header positioning to VeltCommentsSidebar
 *
 * @param {string} filePath - Path to the file containing VeltCommentsSidebar
 * @param {string} position - Position (top-left, top-right, bottom-left, bottom-right)
 * @param {string[]} filesModified - Array to track modified files
 * @param {Object[]} integrationPoints - Array to track integration points
 * @returns {boolean} Success status
 */
export function applyHeaderPositioning(filePath, position, filesModified, integrationPoints) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if VeltCommentsSidebar exists
    if (!content.includes('VeltCommentsSidebar')) {
      console.error(`   ⚠️  VeltCommentsSidebar not found in ${filePath}`);
      return false;
    }

    const positionStyle = POSITION_STYLES[position] || POSITION_STYLES['top-right'];

    // Build inline style string
    const styleString = `style={{ position: '${positionStyle.position}', top: '${positionStyle.top}', right: '${positionStyle.right}', bottom: '${positionStyle.bottom}', left: '${positionStyle.left}', zIndex: 9999 }}`;

    // Match all VeltCommentsSidebar tags: self-closing (with or without props) and opening tags.
    // Captures existing attributes in group 1 and self-closing slash in group 2.
    const tagPattern = /<VeltCommentsSidebar(\s[^>]*?)?\s*(\/?)>/g;
    content = content.replace(tagPattern, (match, existingAttrs, selfClose) => {
      // Strip any existing style prop from the captured attributes to avoid
      // the duplicate-prop override problem (last prop wins in JSX).
      let attrs = (existingAttrs || '').replace(/\s*style=\{\{[^}]*\}\}/g, '');
      const closing = selfClose ? ' /' : '';
      return `<VeltCommentsSidebar ${styleString}${attrs}${closing}>`;
    });

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');

    const relativePath = filePath.split('/').slice(-3).join('/');
    if (!filesModified.includes(relativePath)) {
      filesModified.push(relativePath);
    }

    integrationPoints.push({
      file: relativePath,
      type: 'header-positioning',
      description: `Applied ${position} positioning to VeltCommentsSidebar`,
      position,
    });

    console.error(`   📍 Applied ${position} positioning to VeltCommentsSidebar`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error applying header positioning: ${error.message}`);
    return false;
  }
}

/**
 * Finds files containing VeltCommentsSidebar
 *
 * @param {string} projectPath - Project root path
 * @returns {string[]} Array of file paths
 */
export function findVeltSidebarFiles(projectPath) {
  const results = [];

  function searchDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${dir}/${entry.name}`;

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        searchDirectory(fullPath);
      } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes('VeltCommentsSidebar')) {
            results.push(fullPath);
          }
        } catch (err) {
          // Skip files we can't read
        }
      }
    }
  }

  searchDirectory(projectPath);
  return results;
}

export default {
  applyHeaderPositioning,
  findVeltSidebarFiles,
  POSITION_STYLES,
};
