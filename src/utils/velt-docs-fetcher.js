/**
 * Velt Docs Fetcher
 *
 * Fetches Velt documentation from markdown (.md) URLs.
 *
 * Source Architecture:
 * - Agent Skills are the ONLY source for implementation patterns.
 *   The MCP plan tells the AI which skill files to READ before implementing.
 * - Docs URLs provide supplementary context for features without skill coverage.
 * - Velt Docs MCP should NEVER be used during implementation if skills are available.
 *   It may only be used for user follow-up questions AFTER implementation is complete.
 */

import { getDocUrl, getDocMarkdownUrl } from './velt-docs-urls.js';
import { queryVeltDocsMCP } from './velt-mcp-client.js';

/**
 * Maps Velt features to their Agent Skill names and key rule file paths.
 * Skills are the ONLY source for implementation patterns.
 * The MCP plan tells the AI to READ specific skill rule files before implementing each step.
 */
export const FEATURE_SKILL_MAP = {
  // Setup / Provider / Auth / Document
  setup: 'velt-setup-best-practices',
  provider: 'velt-setup-best-practices',
  auth: 'velt-setup-best-practices',
  document: 'velt-setup-best-practices',

  // Comments (all types)
  comments: 'velt-comments-best-practices',

  // CRDT (all editor types)
  crdt: 'velt-crdt-best-practices',

  // Notifications
  notifications: 'velt-notifications-best-practices',

  // Recorder
  recorder: 'velt-recorder-best-practices',

  // Features WITHOUT skills coverage — use docs URLs
  // presence: null,
  // cursors: null,
};

/**
 * Maps features to specific skill rule file paths and the AGENTS.md index.
 * The MCP plan uses these to generate "READ FIRST:" directives with exact file paths.
 */
export const SKILL_RULE_PATHS = {
  setup: {
    skill: 'velt-setup-best-practices',
    agentsIndex: 'skills/velt-setup-best-practices/AGENTS.md',
    keyRules: [
      'provider-velt-provider-setup',
      'identity-jwt-generation',
      'identity-user-object-shape',
      'identity-auth-provider',
      'document-set-document',
      'debug-multi-user-testing',
      'debug-common-issues',
    ],
  },
  comments: {
    skill: 'velt-comments-best-practices',
    agentsIndex: 'skills/velt-comments-best-practices/AGENTS.md',
    keyRules: [
      'core-provider-setup',
      'core-authentication',
      'mode-freestyle',
      'mode-popover',
      'mode-stream',
      'mode-text',
      'mode-page',
      'mode-tiptap',
      'mode-lexical',
      'mode-slatejs',
      'mode-quill',
      'mode-plate',
      'mode-codemirror-comments',
      'mode-ace',
    ],
  },
  crdt: {
    skill: 'velt-crdt-best-practices',
    agentsIndex: 'skills/velt-crdt-best-practices/AGENTS.md',
    keyRules: [
      'tiptap-setup-react',
      'tiptap-cursor-css',
      'tiptap-comments-integration',
      'tiptap-disable-history',
      'tiptap-nextjs-ssr',
      'tiptap-initial-content',
      'tiptap-editor-id',
      'blocknote-setup-react',
      'blocknote-editor-id',
      'codemirror-setup-react',
      'codemirror-ycollab',
      'codemirror-editor-id',
      'reactflow-setup-react',
      'reactflow-handlers',
      'reactflow-editor-id',
    ],
  },
  notifications: {
    skill: 'velt-notifications-best-practices',
    agentsIndex: 'skills/velt-notifications-best-practices/AGENTS.md',
    keyRules: [
      'core-setup',
      'panel-tabs',
      'panel-display',
    ],
  },
  recorder: {
    skill: 'velt-recorder-best-practices',
    agentsIndex: 'skills/velt-recorder-best-practices/AGENTS.md',
    keyRules: [
      'core-setup',
      'core-permissions',
      'config-type-and-mode',
      'config-quality-encoding',
      'data-hooks',
      'events-lifecycle',
      'editor-standalone',
    ],
  },
};

/**
 * Returns the AGENTS.md index path and relevant rule names for a feature.
 *
 * @param {string} feature - Feature name
 * @param {string[]} [specificRules] - Optional list of specific rule names to include
 * @returns {{ agentsIndex: string, rules: string[] } | null}
 */
export function getSkillRulePaths(feature, specificRules = null) {
  const paths = SKILL_RULE_PATHS[feature];
  if (!paths) return null;

  return {
    agentsIndex: paths.agentsIndex,
    rules: specificRules || paths.keyRules,
  };
}

/**
 * Returns the Agent Skill name for a given feature, or null if no skill covers it.
 *
 * @param {string} feature - Feature name (comments, crdt, notifications, presence, etc.)
 * @param {string} [subtype] - Optional subtype (freestyle, tiptap, etc.) — unused for mapping but kept for API consistency
 * @returns {string|null} Skill name or null
 */
export function getSkillForFeature(feature, subtype = null) {
  return FEATURE_SKILL_MAP[feature] || null;
}

/**
 * Returns an array of { feature, skillName } objects for all features that have skills,
 * plus { feature, docsUrl } for features that fall back to docs.
 *
 * @param {string[]} features - Array of feature names
 * @param {Object} [options] - Options
 * @param {string} [options.commentType] - Comment subtype
 * @param {string} [options.crdtEditorType] - CRDT editor subtype
 * @returns {Array<{feature: string, skillName?: string, docsUrl?: string}>}
 */
export function getSkillReferences(features, options = {}) {
  const { commentType, crdtEditorType } = options;
  const refs = [];

  // Always include setup skill
  refs.push({
    feature: 'setup',
    skillName: FEATURE_SKILL_MAP.setup,
    description: 'VeltProvider setup, authentication, document identity, project structure',
  });

  for (const feature of features) {
    const skill = getSkillForFeature(feature);
    if (skill) {
      const subtype = feature === 'comments' ? commentType : feature === 'crdt' ? crdtEditorType : null;
      refs.push({
        feature: subtype ? `${feature} (${subtype})` : feature,
        skillName: skill,
      });
    } else {
      const subtype = feature === 'comments' ? commentType : feature === 'crdt' ? crdtEditorType : null;
      refs.push({
        feature: subtype ? `${feature} (${subtype})` : feature,
        docsUrl: getDocMarkdownUrl(feature, subtype),
      });
    }
  }

  return refs;
}

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

/**
 * Fetches implementation details for any Velt feature
 *
 * Strategy:
 * 1. Fetch from docs.velt.dev markdown URLs directly (primary)
 * 2. If that fails, use Velt Docs MCP (fallback)
 * 3. If both fail, return basic structure with doc URL reference
 *
 * @param {Object} options - Fetch options
 * @param {string} options.feature - Feature name (comments, presence, cursors, notifications, recorder, crdt)
 * @param {string} [options.subtype] - Optional subtype (e.g., 'freestyle' for comments, 'tiptap' for crdt)
 * @param {Object} [options.mcpClient] - Optional MCP client for fallback
 * @returns {Promise<Object>} Implementation details
 */
export async function fetchFeatureImplementation(options) {
  const { feature, subtype = null, mcpClient } = options;

  const featureDisplay = subtype ? `${feature}/${subtype}` : feature;
  console.error(`🔍 Fetching ${featureDisplay} implementation from .md URL...`);

  // Step 1: Fetch from markdown URL (primary)
  console.error('   📄 Fetching from docs.velt.dev markdown...');
  try {
    const urlResult = await fetchFromMarkdownUrl(feature, subtype);
    console.error('   ✅ Got documentation from markdown URL');
    return urlResult;
  } catch (error) {
    console.error(`   ⚠️  Markdown fetch failed: ${error.message}`);
  }

  // Step 2: Fallback to Velt Docs MCP if .md URL failed
  console.error('   📚 Falling back to Velt Docs MCP...');
  try {
    const query = subtype
      ? `How do I implement ${subtype} ${feature} in Next.js?`
      : `How do I implement ${feature} in Next.js?`;
    const mcpResult = await queryVeltDocsMCP(query);

    if (mcpResult.success) {
      console.error('   ✅ Got implementation from Velt Docs MCP');
      return {
        success: true,
        source: 'velt-docs-mcp',
        docUrl: getDocUrl(feature, subtype),
        mdUrl: getDocMarkdownUrl(feature, subtype),
        data: mcpResult.data,
      };
    }
  } catch (error) {
    console.error(`   ⚠️  Velt Docs MCP failed: ${error.message}`);
  }

  // Step 3: Return basic structure with doc URL
  console.error('   📖 Returning basic structure with doc URL reference');
  return getBasicStructure(feature, subtype);
}

/**
 * Fetches implementation details for CRDT feature
 *
 * @param {Object} options - Fetch options
 * @param {string} options.editorType - Editor type (tiptap, codemirror, blocknote)
 * @param {Object} [options.mcpClient] - Optional MCP client for fallback
 * @returns {Promise<Object>} Implementation details
 */
export async function fetchCrdtImplementation(options) {
  const { editorType, mcpClient } = options;

  console.error(`🔍 Fetching CRDT ${editorType} implementation from .md URL...`);

  return fetchFeatureImplementation({
    feature: 'crdt',
    subtype: editorType,
    mcpClient,
  });
}

export default {
  fetchCommentImplementation,
  fetchFeatureImplementation,
  fetchCrdtImplementation,
  FEATURE_SKILL_MAP,
  SKILL_RULE_PATHS,
  getSkillForFeature,
  getSkillReferences,
  getSkillRulePaths,
};
