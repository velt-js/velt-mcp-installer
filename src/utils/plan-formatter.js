/**
 * Plan Formatter
 *
 * Formats installation instructions as a sequential plan (similar to Cursor's plan mode)
 * that the AI can follow to complete the implementation.
 */

/**
 * Formats a plan with numbered steps, details, and a to-do checklist
 *
 * @param {Object} options - Plan options
 * @param {string} options.title - Plan title (e.g., "Plan for Velt Freestyle Comments Installation")
 * @param {Array} options.steps - Array of step objects
 * @param {string} options.steps[].title - Step title
 * @param {string} options.steps[].details - Step details/instructions
 * @param {string[]} [options.steps[].codeExamples] - Optional code examples
 * @param {Array} [options.additionalInfo] - Additional information sections
 * @returns {string} Formatted plan as markdown
 */
export function formatInstallationPlan(options) {
  const { title, steps, additionalInfo = [] } = options;

  let plan = `# ${title}\n\n`;

  // Add numbered steps with details
  steps.forEach((step, index) => {
    const stepNumber = index + 1;
    plan += `## ${stepNumber}. ${step.title}\n`;
    plan += `*   **Details:** ${step.details}\n`;

    // Add code examples if provided
    if (step.codeExamples && step.codeExamples.length > 0) {
      step.codeExamples.forEach((example) => {
        plan += `\n${example.description ? `*   ${example.description}:` : ''}
\`\`\`${example.language || 'tsx'}
${example.code}
\`\`\`\n`;
      });
    }

    plan += '\n';
  });

  // Add additional information sections
  if (additionalInfo.length > 0) {
    additionalInfo.forEach((info) => {
      plan += `## ${info.title}\n`;
      plan += `${info.content}\n\n`;
    });
  }

  // Add To-Do checklist
  plan += `## To-Do List\n`;
  steps.forEach((step, index) => {
    const checkbox = index === 0 ? '[✓]' : '[ ]';
    plan += `- ${checkbox} ${step.title}\n`;
  });

  plan += '\n';

  return plan;
}

/**
 * Creates a plan for Velt Comments installation
 *
 * @param {Object} options - Installation options
 * @param {string} options.commentType - Type of comments (freestyle, popover, page, stream, text)
 * @param {Object} options.implementation - Implementation details from Velt Docs
 * @param {Array} options.detectedFiles - Files detected for modification
 * @param {string} options.apiKey - API key preview
 * @param {string} options.headerPosition - Header position
 * @returns {string} Formatted installation plan
 */
export function createVeltCommentsPlan(options) {
  const {
    commentType,
    implementation,
    detectedFiles = [],
    apiKey,
    headerPosition,
  } = options;

  const commentTypeTitle = commentType.charAt(0).toUpperCase() + commentType.slice(1);

  const steps = [];

  // Step 1: Add VeltComments component
  steps.push({
    title: `Add VeltComments component to your app root`,
    details: `Import and add the ${commentTypeTitle} VeltComments component at the root level of your application. This is required to render comments in your app.`,
    codeExamples: implementation.rootComponent ? [
      {
        description: 'Add to your root layout or app component',
        language: 'tsx',
        code: implementation.rootComponent.code,
      },
    ] : [],
  });

  // Step 2: Configure comment mode
  if (implementation.modeConfig) {
    steps.push({
      title: `Configure ${commentTypeTitle} mode`,
      details: implementation.modeConfig.details,
      codeExamples: [
        {
          description: implementation.modeConfig.description,
          language: 'tsx',
          code: implementation.modeConfig.code,
        },
      ],
    });
  }

  // Step 3: Add Comment Tool
  if (implementation.commentTool) {
    steps.push({
      title: `Add Comment Tool to enable commenting`,
      details: implementation.commentTool.details,
      codeExamples: [
        {
          description: implementation.commentTool.description,
          language: 'tsx',
          code: implementation.commentTool.code,
        },
      ],
    });
  }

  // Step 4: Configure detected files
  if (detectedFiles.length > 0) {
    const filesList = detectedFiles.map(f => `\`${f.file}\``).join(', ');
    steps.push({
      title: `Integrate comments into detected components`,
      details: `Based on the codebase scan, the following files were identified as good candidates for comment integration: ${filesList}. Update these files to include the Velt components according to your use case.`,
    });
  }

  // Step 5: Position the sidebar header
  if (headerPosition) {
    steps.push({
      title: `Position the comments sidebar header`,
      details: `Apply the ${headerPosition} positioning to the VeltCommentsSidebar component. This will display the sidebar in the specified corner of the screen.`,
      codeExamples: [
        {
          description: 'Style the sidebar position',
          language: 'tsx',
          code: `<VeltCommentsSidebar
  style={{
    position: 'fixed',
    ${getPositionStyles(headerPosition)}
    zIndex: 9999
  }}
/>`,
        },
      ],
    });
  }

  // Step 6: Replace API key placeholders
  steps.push({
    title: `Replace API key placeholders`,
    details: `Update all instances of "YOUR_VELT_API_KEY" in the generated files with your actual API key: ${apiKey}`,
  });

  // Step 7: Test the installation
  steps.push({
    title: `Test the comment functionality`,
    details: `Start your development server and test the ${commentType} comments feature. ${getTestInstructions(commentType)}`,
  });

  // Additional information
  const additionalInfo = [
    {
      title: 'Important Notes',
      content: `- The Velt CLI has already created the base files in your project
- All placeholders (API keys, auth tokens) need to be replaced with your actual values
- The detected files are suggestions - you can modify any file that makes sense for your use case
- Refer to the Velt documentation for advanced configuration options`,
    },
    {
      title: 'Documentation Reference',
      content: `For more details, see: ${implementation.docUrl || 'https://docs.velt.dev'}`,
    },
  ];

  return formatInstallationPlan({
    title: `Plan for Velt ${commentTypeTitle} Comments Installation`,
    steps,
    additionalInfo,
  });
}

/**
 * Gets CSS position styles for header positioning
 */
function getPositionStyles(position) {
  const styles = {
    'top-left': 'top: \'20px\',\n    left: \'20px\',',
    'top-right': 'top: \'20px\',\n    right: \'20px\',',
    'bottom-left': 'bottom: \'20px\',\n    left: \'20px\',',
    'bottom-right': 'bottom: \'20px\',\n    right: \'20px\',',
  };
  return styles[position] || styles['top-right'];
}

/**
 * Gets test instructions for a comment type
 */
function getTestInstructions(commentType) {
  const instructions = {
    freestyle: 'Click the Comment Tool button, then click anywhere on the page to add a comment.',
    popover: 'Click the Comment Tool button next to an element to attach a comment to it.',
    page: 'Open the Comments Sidebar and add a page-level comment at the bottom.',
    stream: 'Select text to see comments appear in the stream column on the right.',
    text: 'Highlight any text to see the Comment Tool button appear, then click it to add a comment.',
  };
  return instructions[commentType] || 'Test adding comments in your application.';
}

export default {
  formatInstallationPlan,
  createVeltCommentsPlan,
};
