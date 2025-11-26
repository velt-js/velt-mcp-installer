/**
 * Velt Documentation URLs
 *
 * Comprehensive mapping of Velt feature documentation URLs for fallback when
 * Velt Docs MCP is unavailable.
 */

/**
 * Comment feature documentation URLs
 */
export const COMMENT_FEATURE_URLS = {
  freestyle: 'https://docs.velt.dev/async-collaboration/comments/setup/freestyle',
  popover: 'https://docs.velt.dev/async-collaboration/comments/setup/popover',
  page: 'https://docs.velt.dev/async-collaboration/comments/setup/page',
  stream: 'https://docs.velt.dev/async-collaboration/comments/setup/stream',
  text: 'https://docs.velt.dev/async-collaboration/comments/setup/text',
  // Note: inline returns 404, might be combined with text mode
};

/**
 * All Velt feature documentation URLs
 */
export const VELT_DOCS_URLS = {
  // Getting Started
  overview: 'https://docs.velt.dev/get-started/overview',
  quickstart: 'https://docs.velt.dev/get-started/quickstart',
  advanced: 'https://docs.velt.dev/get-started/advanced',

  // Comments
  comments: {
    overview: 'https://docs.velt.dev/async-collaboration/comments/overview',
    setup: {
      freestyle: 'https://docs.velt.dev/async-collaboration/comments/setup/freestyle',
      popover: 'https://docs.velt.dev/async-collaboration/comments/setup/popover',
      page: 'https://docs.velt.dev/async-collaboration/comments/setup/page',
      stream: 'https://docs.velt.dev/async-collaboration/comments/setup/stream',
      text: 'https://docs.velt.dev/async-collaboration/comments/setup/text',
    },
    customization: 'https://docs.velt.dev/ui-customization/features/async/comments',
  },

  // Presence
  presence: {
    overview: 'https://docs.velt.dev/realtime-collaboration/presence/overview',
    setup: 'https://docs.velt.dev/realtime-collaboration/presence/setup',
  },

  // Notifications
  notifications: {
    overview: 'https://docs.velt.dev/async-collaboration/notifications/overview',
    setup: 'https://docs.velt.dev/async-collaboration/notifications/setup',
  },

  // Recorder
  recorder: {
    overview: 'https://docs.velt.dev/async-collaboration/recorder/overview',
    setup: 'https://docs.velt.dev/async-collaboration/recorder/setup',
  },

  // Authentication
  auth: {
    overview: 'https://docs.velt.dev/security/authentication/overview',
    setup: 'https://docs.velt.dev/security/authentication/setup',
  },
};

/**
 * Gets the documentation URL for a specific comment type
 *
 * @param {string} commentType - Comment type (freestyle, popover, page, stream, text)
 * @returns {string} Documentation URL
 */
export function getCommentDocUrl(commentType) {
  return COMMENT_FEATURE_URLS[commentType] || COMMENT_FEATURE_URLS.freestyle;
}

/**
 * Gets the markdown URL for a specific comment type
 *
 * @param {string} commentType - Comment type
 * @returns {string} Markdown documentation URL
 */
export function getCommentDocMarkdownUrl(commentType) {
  const baseUrl = getCommentDocUrl(commentType);
  return `${baseUrl}.md`;
}

/**
 * Gets all available comment types
 *
 * @returns {string[]} Array of comment type names
 */
export function getAvailableCommentTypes() {
  return Object.keys(COMMENT_FEATURE_URLS);
}

export default {
  COMMENT_FEATURE_URLS,
  VELT_DOCS_URLS,
  getCommentDocUrl,
  getCommentDocMarkdownUrl,
  getAvailableCommentTypes,
};
