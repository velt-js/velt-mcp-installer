/**
 * Velt Documentation URLs
 *
 * Comprehensive mapping of Velt feature documentation URLs for fallback when
 * Velt Docs MCP is unavailable.
 */

/**
 * All Velt feature documentation URLs
 */
export const VELT_DOCS_URLS = {
  // Getting Started
  quickstart: 'https://docs.velt.dev/get-started/quickstart',
  keyConcepts: 'https://docs.velt.dev/key-concepts/overview',

  // Comments
  comments: {
    setup: {
      freestyle: 'https://docs.velt.dev/async-collaboration/comments/setup/freestyle',
      popover: 'https://docs.velt.dev/async-collaboration/comments/setup/popover',
      page: 'https://docs.velt.dev/async-collaboration/comments/setup/page',
      text: 'https://docs.velt.dev/async-collaboration/comments/setup/text',
      inline: 'https://docs.velt.dev/async-collaboration/comments/setup/inline-comments',
      // Purpose-built library integrations
      tiptap: 'https://docs.velt.dev/async-collaboration/comments/setup/tiptap',
      lexical: 'https://docs.velt.dev/async-collaboration/comments/setup/lexical',
      slate: 'https://docs.velt.dev/async-collaboration/comments/setup/slatejs',
    },
    customizeBehavior: 'https://docs.velt.dev/async-collaboration/comments/customize-behavior',
  },

  // Presence
  presence: {
    setup: 'https://docs.velt.dev/realtime-collaboration/presence/setup',
    customizeBehavior: 'https://docs.velt.dev/realtime-collaboration/presence/customize-behavior',
  },

  // Notifications
  notifications: {
    setup: 'https://docs.velt.dev/async-collaboration/notifications/setup',
    customizeBehavior: 'https://docs.velt.dev/async-collaboration/notifications/customize-behavior',
  },

  // Recorder
  recorder: {
    setup: 'https://docs.velt.dev/async-collaboration/recorder/setup',
    customizeBehavior: 'https://docs.velt.dev/async-collaboration/recorder/customize-behavior',
  },

  // Cursors
  cursors: {
    setup: 'https://docs.velt.dev/realtime-collaboration/cursors/setup',
    customizeBehavior: 'https://docs.velt.dev/realtime-collaboration/cursors/customize-behavior',
  },

  // Single Editor Mode
  'single-editor-mode': {
    setup: 'https://docs.velt.dev/realtime-collaboration/single-editor-mode/setup',
    customizeBehavior: 'https://docs.velt.dev/realtime-collaboration/single-editor-mode/customize-behavior',
  },

  // CRDT (Collaborative Real-Time Document editing)
  crdt: {
    setup: {
      tiptap: 'https://docs.velt.dev/realtime-collaboration/crdt/setup/tiptap',
      codemirror: 'https://docs.velt.dev/realtime-collaboration/crdt/setup/codemirror',
      blocknote: 'https://docs.velt.dev/realtime-collaboration/crdt/setup/blocknote',
      reactflow: 'https://docs.velt.dev/realtime-collaboration/crdt/setup/reactflow',
    },
    overview: 'https://docs.velt.dev/multiplayer-editing/overview',
  },

  // Self-Hosting Data
  'self-hosting-data': {
    overview: 'https://docs.velt.dev/self-host-data/overview',
    comments: 'https://docs.velt.dev/self-host-data/comments',
    attachments: 'https://docs.velt.dev/self-host-data/attachments',
    users: 'https://docs.velt.dev/self-host-data/users',
    reactions: 'https://docs.velt.dev/self-host-data/reactions',
  },

  // Activity Logs
  'activity-logs': {
    overview: 'https://docs.velt.dev/activity-logs/overview',
    setup: 'https://docs.velt.dev/activity-logs/setup',
  },

};

/**
 * Gets the documentation URL for a specific feature or comment type
 *
 * @param {string} feature - Feature name (comments, presence, cursors, notifications, recorder)
 * @param {string} [subtype] - Optional subtype (for comments: freestyle, popover, page, text, inline, tiptap, lexical, slate)
 * @param {string} [page='setup'] - Page type (setup, customizeBehavior)
 * @returns {string} Documentation URL
 */
export function getDocUrl(feature, subtype = null, page = 'setup') {
  const featureConfig = VELT_DOCS_URLS[feature];

  if (!featureConfig) {
    console.warn(`Unknown feature: ${feature}, using quickstart`);
    return VELT_DOCS_URLS.quickstart;
  }

  // If it's a simple string URL, return it
  if (typeof featureConfig === 'string') {
    return featureConfig;
  }

  // Handle comments with subtypes (freestyle, popover, etc.)
  if (feature === 'comments' && subtype) {
    if (featureConfig.setup && featureConfig.setup[subtype]) {
      return featureConfig.setup[subtype];
    }
  }

  // Handle CRDT with subtypes (tiptap, codemirror, blocknote)
  if (feature === 'crdt' && subtype) {
    if (featureConfig.setup && featureConfig.setup[subtype]) {
      return featureConfig.setup[subtype];
    }
  }

  // Handle page navigation (setup, customizeBehavior)
  if (featureConfig[page]) {
    return featureConfig[page];
  }

  // Fallback to setup
  return featureConfig.setup || VELT_DOCS_URLS.quickstart;
}

/**
 * Gets the markdown URL for a specific feature or comment type
 *
 * @param {string} feature - Feature name
 * @param {string} [subtype] - Optional subtype (for comments)
 * @param {string} [page='setup'] - Page type
 * @returns {string} Markdown documentation URL
 */
export function getDocMarkdownUrl(feature, subtype = null, page = 'setup') {
  const baseUrl = getDocUrl(feature, subtype, page);
  return `${baseUrl}.md`;
}

/**
 * Gets all available comment types
 *
 * @returns {string[]} Array of comment type names
 */
export function getAvailableCommentTypes() {
  return Object.keys(VELT_DOCS_URLS.comments.setup);
}

export default {
  VELT_DOCS_URLS,
  getDocUrl,
  getDocMarkdownUrl,
  getAvailableCommentTypes,
};
