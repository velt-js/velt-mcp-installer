/**
 * Velt Docs Fetcher
 *
 * Fetches Velt documentation from markdown (.md) URLs with fallback to Velt Docs MCP.
 * For post-installation questions/troubleshooting, AI should query Velt Docs MCP directly.
 */

import { getDocUrl, getDocMarkdownUrl } from './velt-docs-urls.js';
import { queryVeltDocsMCP } from './velt-mcp-client.js';

/**
 * Fetches implementation details for a comment type
 *
 * Strategy:
 * 1. Fetch from docs.velt.dev markdown URLs directly (primary)
 * 2. If that fails, use Velt Docs MCP (fallback)
 * 3. If both fail, return basic structure with doc URL reference
 *
 * @param {Object} options - Fetch options
 * @param {string} options.commentType - Comment type (freestyle, popover, etc.)
 * @param {Object} [options.mcpClient] - Optional MCP client for fallback
 * @returns {Promise<Object>} Implementation details
 */
export async function fetchCommentImplementation(options) {
  const { commentType, mcpClient } = options;

  console.error(`🔍 Fetching ${commentType} implementation from .md URL...`);

  // Step 1: Fetch from markdown URL (primary)
  console.error('   📄 Fetching from docs.velt.dev markdown...');
  try {
    const urlResult = await fetchFromMarkdownUrl('comments', commentType);
    console.error('   ✅ Got documentation from markdown URL');
    return urlResult;
  } catch (error) {
    console.error(`   ⚠️  Markdown fetch failed: ${error.message}`);
  }

  // Step 2: Fallback to Velt Docs MCP if .md URL failed
  console.error('   📚 Falling back to Velt Docs MCP...');
  try {
    const query = `How do I implement ${commentType} comments in Next.js?`;
    const mcpResult = await queryVeltDocsMCP(query);

    if (mcpResult.success) {
      console.error('   ✅ Got implementation from Velt Docs MCP');
      return {
        success: true,
        source: 'velt-docs-mcp',
        docUrl: getDocUrl('comments', commentType),
        mdUrl: getDocMarkdownUrl('comments', commentType),
        data: mcpResult.data,
      };
    }
  } catch (error) {
    console.error(`   ⚠️  Velt Docs MCP failed: ${error.message}`);
  }

  // Step 3: Return basic structure with doc URL
  console.error('   📖 Returning basic structure with doc URL reference');
  return getBasicStructure('comments', commentType);
}

/**
 * Fetches documentation from markdown URL
 */
async function fetchFromMarkdownUrl(feature, subtype = null) {
  const docUrl = getDocUrl(feature, subtype);
  const mdUrl = getDocMarkdownUrl(feature, subtype);

  try {
    console.error(`   Fetching from: ${mdUrl}`);
    const response = await fetch(mdUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const markdown = await response.text();

    return {
      success: true,
      source: 'docs-md-url',
      docUrl,
      mdUrl,
      data: {
        markdown,
        docUrl,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch from ${mdUrl}: ${error.message}`);
  }
}

/**
 * Returns a basic structure with doc URL reference
 */
function getBasicStructure(feature, subtype = null) {
  const docUrl = getDocUrl(feature, subtype);
  const mdUrl = getDocMarkdownUrl(feature, subtype);

  return {
    success: true,
    source: 'basic-structure',
    docUrl,
    mdUrl,
    data: {
      docUrl,
      mdUrl,
      note: 'Please refer to the documentation URL for implementation details',
    },
    warning: 'Could not fetch documentation - providing URL references only',
  };
}

export default {
  fetchCommentImplementation,
};
