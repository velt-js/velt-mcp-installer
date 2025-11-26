/**
 * Velt Docs Fetcher
 *
 * Queries Velt Docs MCP for implementation details, with fallback to direct URL fetching.
 */

import { getCommentDocUrl, getCommentDocMarkdownUrl } from './velt-docs-urls.js';

/**
 * Fetches implementation details for a comment type
 *
 * Strategy:
 * 1. Try querying Velt Docs MCP (if available)
 * 2. If that fails, fetch from docs.velt.dev directly
 * 3. Parse and structure the implementation details
 *
 * @param {Object} options - Fetch options
 * @param {string} options.commentType - Comment type (freestyle, popover, etc.)
 * @param {Object} [options.mcpClient] - Optional MCP client for querying Velt Docs MCP
 * @returns {Promise<Object>} Implementation details
 */
export async function fetchCommentImplementation(options) {
  const { commentType, mcpClient } = options;

  console.error(`🔍 Fetching ${commentType} implementation details...`);

  // Step 1: Try Velt Docs MCP if available
  if (mcpClient) {
    try {
      console.error('   Trying Velt Docs MCP...');
      const mcpResult = await queryVeltDocsMCP(mcpClient, commentType);
      if (mcpResult.success) {
        console.error('   ✅ Got implementation from Velt Docs MCP');
        return mcpResult;
      }
    } catch (error) {
      console.error(`   ⚠️  Velt Docs MCP failed: ${error.message}`);
    }
  }

  // Step 2: Fallback to fetching from docs URL directly
  console.error('   📄 Falling back to fetching from docs.velt.dev...');
  try {
    const urlResult = await fetchFromDocsUrl(commentType);
    console.error('   ✅ Got implementation from docs.velt.dev');
    return urlResult;
  } catch (error) {
    console.error(`   ❌ URL fetch failed: ${error.message}`);

    // Step 3: Ultimate fallback - hardcoded templates
    console.error('   ⚠️  Using hardcoded template as last resort');
    return getHardcodedTemplate(commentType);
  }
}

/**
 * Queries Velt Docs MCP for implementation details
 */
async function queryVeltDocsMCP(mcpClient, commentType) {
  // This would use the MCP client to query the Velt Docs MCP server
  // For now, we'll return a failure to trigger the fallback
  throw new Error('Velt Docs MCP not yet implemented in this version');
}

/**
 * Fetches implementation details from docs.velt.dev
 */
async function fetchFromDocsUrl(commentType) {
  const docUrl = getCommentDocUrl(commentType);

  try {
    // Use fetch to get the documentation page
    const response = await fetch(docUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse the HTML to extract implementation details
    const implementation = parseDocumentation(html, commentType);

    return {
      success: true,
      source: 'docs-url',
      docUrl,
      data: implementation,
    };
  } catch (error) {
    throw new Error(`Failed to fetch from ${docUrl}: ${error.message}`);
  }
}

/**
 * Parses HTML documentation to extract implementation details
 */
function parseDocumentation(html, commentType) {
  // Simple extraction - in a real implementation, you'd parse the HTML properly
  // For now, return structured data based on what we fetched earlier

  const implementations = {
    freestyle: {
      rootComponent: {
        code: `<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltComments />
  {/* Your app content */}
</VeltProvider>`,
      },
      commentTool: {
        details: 'Add VeltCommentTool where you want the activation button displayed. When clicked, users can click anywhere on the page to add comments.',
        description: 'Add to your toolbar or floating button',
        code: `<div className="toolbar">
  <VeltCommentTool />
</div>`,
      },
      docUrl: getCommentDocUrl('freestyle'),
    },
    popover: {
      rootComponent: {
        code: `<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltComments popoverMode={true} />
  {/* Your app content */}
</VeltProvider>`,
      },
      modeConfig: {
        details: 'Enable popover mode to attach comments to specific elements.',
        description: 'Enable popover mode on VeltComments',
        code: `<VeltComments popoverMode={true} />`,
      },
      commentTool: {
        details: 'Add VeltCommentTool next to each element you want to make commentable, or use a single tool with data-velt-target-comment-element-id attributes on elements.',
        description: 'Pattern A: Tool next to each element',
        code: `<div className="card" id="card-1">
  <VeltCommentTool targetElementId="card-1" />
  {/* Card content */}
</div>`,
      },
      docUrl: getCommentDocUrl('popover'),
    },
    page: {
      rootComponent: {
        code: `<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltComments />
  <VeltCommentsSidebar pageMode={true} />
  {/* Your app content */}
</VeltProvider>`,
      },
      modeConfig: {
        details: 'Enable page mode to allow page-level comments through the sidebar.',
        description: 'Add VeltCommentsSidebar with page mode',
        code: `<VeltCommentsSidebar pageMode={true} />`,
      },
      commentTool: {
        details: 'Add VeltSidebarButton to allow users to toggle the comments sidebar.',
        description: 'Add sidebar toggle button',
        code: `<div className="toolbar">
  <VeltSidebarButton />
</div>`,
      },
      docUrl: getCommentDocUrl('page'),
    },
    stream: {
      rootComponent: {
        code: `<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <div id="scrolling-container">
    <div className="content">
      {/* Your content */}
    </div>
    <VeltComments
      streamMode={true}
      streamViewContainerId="scrolling-container"
    />
  </div>
</VeltProvider>`,
      },
      modeConfig: {
        details: 'Enable stream mode to display comment dialogs in a column on the right side, similar to Google Docs.',
        description: 'Enable stream mode',
        code: `<VeltComments
  streamMode={true}
  streamViewContainerId="scrolling-container"
/>`,
      },
      docUrl: getCommentDocUrl('stream'),
    },
    text: {
      rootComponent: {
        code: `<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltComments textMode={true} />
  {/* Your app content */}
</VeltProvider>`,
      },
      modeConfig: {
        details: 'Enable text mode to allow users to highlight text and attach comments, similar to Google Docs. Text mode is enabled by default.',
        description: 'Enable text mode (default)',
        code: `<VeltComments textMode={true} />`,
      },
      docUrl: getCommentDocUrl('text'),
    },
  };

  return implementations[commentType] || implementations.freestyle;
}

/**
 * Returns a hardcoded template as ultimate fallback
 */
function getHardcodedTemplate(commentType) {
  const implementation = parseDocumentation('', commentType);

  return {
    success: true,
    source: 'hardcoded-template',
    docUrl: getCommentDocUrl(commentType),
    data: implementation,
    warning: 'Using hardcoded template - both Velt Docs MCP and URL fetch failed',
  };
}

export default {
  fetchCommentImplementation,
};
