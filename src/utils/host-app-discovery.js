/**
 * Host App Wiring Discovery
 *
 * Scans the host application codebase to discover integration points for Velt:
 * - Document ID source (route params, query params, DB records, editor state)
 * - User information source (auth providers, user contexts)
 * - JWT authentication patterns
 * - Recommended wiring locations
 *
 * HARD RULE: If scan is unsure, DO NOT guess. Emit explicit questions
 * and tell the user we need a human answer.
 */

import fs from 'fs';
import path from 'path';

/**
 * Signal confidence levels
 */
export const Confidence = {
  HIGH: 'high',      // Clear pattern found
  MEDIUM: 'medium',  // Likely pattern but needs confirmation
  LOW: 'low',        // Possible pattern, should ask user
  NONE: 'none',      // No signals found, must ask user
};

/**
 * Discovery result structure
 */
function createDiscoveryResult() {
  return {
    documentId: {
      signals: [],
      recommendedSource: null,
      confidence: Confidence.NONE,
      questions: [],
    },
    user: {
      signals: [],
      authProvider: null,
      userContextFile: null,
      confidence: Confidence.NONE,
      questions: [],
    },
    setDocuments: {
      signals: [],
      recommendedLocation: null,
      confidence: Confidence.NONE,
      questions: [],
    },
    jwtAuth: {
      signals: [],
      hasJwtPattern: false,
      tokenEndpoint: null,
      confidence: Confidence.NONE,
      questions: [],
    },
    summary: {
      totalSignals: 0,
      questionsForDeveloper: [],
    },
  };
}

/**
 * Scans project files for patterns
 */
function scanFiles(projectPath, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  const dirsToSkip = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel'];

  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!dirsToSkip.includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  walkDir(projectPath);
  return files;
}

/**
 * Reads file content safely
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Detects document ID sources in the codebase
 */
function detectDocumentIdSource(projectPath, files) {
  const result = {
    signals: [],
    recommendedSource: null,
    confidence: Confidence.NONE,
    questions: [],
  };

  const patterns = {
    // Route params (Next.js App Router)
    routeParams: {
      pattern: /params\s*(?::\s*\{[^}]*\})?\s*=>\s*|useParams\s*\(\s*\)|params\.(\w+)|searchParams\.get\s*\(\s*['"`](\w+)['"`]\s*\)/g,
      type: 'route-param',
      description: 'Dynamic route parameter',
    },
    // Next.js App Router folder pattern [id], [slug], etc.
    dynamicRoute: {
      pattern: /\[(\w+)\]/,
      type: 'dynamic-route',
      description: 'Dynamic route folder',
      checkPath: true,
    },
    // Query params
    queryParams: {
      pattern: /searchParams\.get\s*\(\s*['"`](\w+)['"`]\s*\)|useSearchParams|router\.query\.(\w+)|query\.(\w+)/g,
      type: 'query-param',
      description: 'URL query parameter',
    },
    // Common ID patterns in state/props
    idState: {
      pattern: /(?:document|doc|project|page|editor|item|resource|file)Id\s*[:=]/gi,
      type: 'state-variable',
      description: 'ID in component state or props',
    },
    // Database/API patterns
    dbFetch: {
      pattern: /(?:findOne|findById|getDoc|fetch.*\/(?:document|project|page)s?\/)/gi,
      type: 'db-fetch',
      description: 'Database or API fetch for document',
    },
    // Existing Velt document setup
    veltDocument: {
      pattern: /setDocument\s*\(|useSetDocumentId|VeltInitializeDocument/g,
      type: 'velt-existing',
      description: 'Existing Velt document setup',
    },
  };

  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relativePath = path.relative(projectPath, file);

    // Check for dynamic route folders
    if (patterns.dynamicRoute.checkPath && patterns.dynamicRoute.pattern.test(relativePath)) {
      const match = relativePath.match(patterns.dynamicRoute.pattern);
      if (match) {
        result.signals.push({
          type: 'dynamic-route',
          file: relativePath,
          paramName: match[1],
          confidence: Confidence.HIGH,
          description: `Dynamic route folder [${match[1]}] - likely document ID source`,
        });
      }
    }

    // Check content patterns
    for (const [name, patternDef] of Object.entries(patterns)) {
      if (patternDef.checkPath) continue; // Already handled above

      const matches = content.matchAll(patternDef.pattern);
      for (const match of matches) {
        result.signals.push({
          type: patternDef.type,
          file: relativePath,
          match: match[0].substring(0, 100),
          lineNumber: getLineNumber(content, match.index),
          confidence: patternDef.type === 'velt-existing' ? Confidence.HIGH : Confidence.MEDIUM,
          description: patternDef.description,
        });
      }
    }
  }

  // Determine recommendation and confidence
  if (result.signals.length === 0) {
    result.confidence = Confidence.NONE;
    result.questions.push({
      question: 'Where does the document ID come from in your application?',
      options: [
        'URL route parameter (e.g., /documents/[id])',
        'URL query parameter (e.g., ?docId=123)',
        'Fetched from database/API based on current page',
        'Stored in application state (Redux, Context, etc.)',
        'Not sure / Need help deciding',
      ],
    });
  } else {
    // Prioritize signals
    const highConfidence = result.signals.filter(s => s.confidence === Confidence.HIGH);
    const dynamicRoutes = result.signals.filter(s => s.type === 'dynamic-route');

    if (dynamicRoutes.length > 0) {
      result.recommendedSource = dynamicRoutes[0];
      result.confidence = Confidence.HIGH;
    } else if (highConfidence.length > 0) {
      result.recommendedSource = highConfidence[0];
      result.confidence = Confidence.HIGH;
    } else {
      result.recommendedSource = result.signals[0];
      result.confidence = Confidence.MEDIUM;
      result.questions.push({
        question: `Found ${result.signals.length} potential document ID sources. Please confirm which one to use:`,
        options: result.signals.slice(0, 4).map(s => `${s.file}:${s.lineNumber || '?'} - ${s.description}`),
      });
    }
  }

  return result;
}

/**
 * Detects user authentication patterns
 */
function detectUserSource(projectPath, files) {
  const result = {
    signals: [],
    authProvider: null,
    userContextFile: null,
    confidence: Confidence.NONE,
    questions: [],
  };

  const authPatterns = {
    nextAuth: {
      pattern: /useSession|getServerSession|NextAuth|next-auth|authOptions/g,
      provider: 'next-auth',
      description: 'Next-Auth authentication',
    },
    clerk: {
      pattern: /useUser|useAuth|ClerkProvider|@clerk\/nextjs|SignedIn|SignedOut/g,
      provider: 'clerk',
      description: 'Clerk authentication',
    },
    auth0: {
      pattern: /useAuth0|Auth0Provider|@auth0\/nextjs-auth0|withPageAuthRequired/g,
      provider: 'auth0',
      description: 'Auth0 authentication',
    },
    firebase: {
      pattern: /useAuthState|firebase\/auth|getAuth|onAuthStateChanged/g,
      provider: 'firebase',
      description: 'Firebase authentication',
    },
    supabase: {
      pattern: /useSupabaseClient|createClientComponentClient|supabase\.auth|@supabase\/auth-helpers/g,
      provider: 'supabase',
      description: 'Supabase authentication',
    },
    customAuth: {
      pattern: /AuthContext|UserContext|useCurrentUser|useAuthenticatedUser|AuthProvider|UserProvider/g,
      provider: 'custom',
      description: 'Custom authentication context',
    },
  };

  const userDataPatterns = {
    userObject: /(?:const|let|var)\s+(?:user|currentUser|authUser)\s*[:=]/gi,
    userProps: /user\s*[:=]\s*\{[^}]*(?:id|userId|email|name)[^}]*\}/gi,
    userHook: /use(?:User|CurrentUser|Auth|Session)\s*\(/gi,
  };

  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relativePath = path.relative(projectPath, file);

    // Check for auth providers
    for (const [name, patternDef] of Object.entries(authPatterns)) {
      if (patternDef.pattern.test(content)) {
        result.signals.push({
          type: 'auth-provider',
          provider: patternDef.provider,
          file: relativePath,
          confidence: Confidence.HIGH,
          description: patternDef.description,
        });
        // Reset pattern lastIndex for reuse
        patternDef.pattern.lastIndex = 0;
      }
    }

    // Check for user data patterns
    for (const [name, pattern] of Object.entries(userDataPatterns)) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        result.signals.push({
          type: 'user-data',
          file: relativePath,
          match: match[0].substring(0, 80),
          lineNumber: getLineNumber(content, match.index),
          confidence: Confidence.MEDIUM,
          description: `User data pattern: ${name}`,
        });
      }
    }
  }

  // Determine auth provider
  const authProviderSignals = result.signals.filter(s => s.type === 'auth-provider');
  const uniqueProviders = [...new Set(authProviderSignals.map(s => s.provider))];

  if (uniqueProviders.length === 1) {
    result.authProvider = uniqueProviders[0];
    result.confidence = Confidence.HIGH;
    result.userContextFile = authProviderSignals[0].file;
  } else if (uniqueProviders.length > 1) {
    result.confidence = Confidence.LOW;
    result.questions.push({
      question: `Found multiple authentication patterns. Which one is your primary auth provider?`,
      options: uniqueProviders.map(p => `${p} (${authPatterns[p === 'custom' ? 'customAuth' : p]?.description || p})`),
    });
  } else if (result.signals.length > 0) {
    result.confidence = Confidence.MEDIUM;
    result.questions.push({
      question: 'Found user data patterns but no clear auth provider. How do users authenticate?',
      options: [
        'Next-Auth (NextAuth.js)',
        'Clerk',
        'Auth0',
        'Firebase Auth',
        'Supabase Auth',
        'Custom authentication system',
        'No authentication (using mock/demo users)',
      ],
    });
  } else {
    result.confidence = Confidence.NONE;
    result.questions.push({
      question: 'No authentication patterns detected. How should Velt identify users?',
      options: [
        'I have authentication - I\'ll provide the integration details',
        'Use anonymous/demo users for testing',
        'Help me set up authentication',
      ],
    });
  }

  return result;
}

/**
 * Detects where setDocuments should be called
 */
function detectSetDocumentsLocation(projectPath, files, documentIdResult) {
  const result = {
    signals: [],
    recommendedLocation: null,
    confidence: Confidence.NONE,
    questions: [],
  };

  // Look for layout files, page files, and provider files
  const locationPatterns = {
    layout: /app\/.*layout\.(tsx?|jsx?)/,
    page: /app\/.*page\.(tsx?|jsx?)/,
    provider: /providers?\.(tsx?|jsx?)/i,
    context: /context\.(tsx?|jsx?)/i,
  };

  for (const file of files) {
    const relativePath = path.relative(projectPath, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Check if file matches location patterns
    for (const [type, pattern] of Object.entries(locationPatterns)) {
      if (pattern.test(relativePath)) {
        // Check if file has VeltProvider or could be a good location
        const hasVeltProvider = /VeltProvider/g.test(content);
        const hasUseEffect = /useEffect/g.test(content);

        result.signals.push({
          type: type,
          file: relativePath,
          hasVeltProvider,
          hasUseEffect,
          confidence: hasVeltProvider ? Confidence.HIGH : Confidence.MEDIUM,
          description: `${type} file - ${hasVeltProvider ? 'already has VeltProvider' : 'potential location'}`,
        });
      }
    }
  }

  // If we found dynamic routes for documentId, the page in that route is ideal
  if (documentIdResult.recommendedSource?.type === 'dynamic-route') {
    const routeFolder = documentIdResult.recommendedSource.file;
    const pageInRoute = result.signals.find(s =>
      s.file.includes(path.dirname(routeFolder)) && s.type === 'page'
    );
    if (pageInRoute) {
      result.recommendedLocation = pageInRoute;
      result.confidence = Confidence.HIGH;
    }
  }

  // Check for existing VeltProvider
  const veltProviderLocation = result.signals.find(s => s.hasVeltProvider);
  if (veltProviderLocation && !result.recommendedLocation) {
    result.recommendedLocation = veltProviderLocation;
    result.confidence = Confidence.HIGH;
  }

  // Default to root layout or page
  if (!result.recommendedLocation && result.signals.length > 0) {
    const rootLayout = result.signals.find(s => s.file === 'app/layout.tsx' || s.file === 'src/app/layout.tsx');
    const rootPage = result.signals.find(s => s.file === 'app/page.tsx' || s.file === 'src/app/page.tsx');

    result.recommendedLocation = rootLayout || rootPage || result.signals[0];
    result.confidence = Confidence.MEDIUM;
    result.questions.push({
      question: 'Where should VeltProvider and document initialization be set up?',
      options: [
        `${result.recommendedLocation.file} (Recommended)`,
        ...result.signals.slice(0, 3).filter(s => s !== result.recommendedLocation).map(s => s.file),
        'Other location (I\'ll specify)',
      ],
    });
  }

  if (!result.recommendedLocation) {
    result.confidence = Confidence.NONE;
    result.questions.push({
      question: 'Could not detect where to set up Velt. Which file should contain VeltProvider?',
      options: [
        'app/layout.tsx (root layout)',
        'app/page.tsx (root page)',
        'A specific feature page (I\'ll specify the path)',
        'Help me understand where it should go',
      ],
    });
  }

  return result;
}

/**
 * Detects JWT authentication patterns
 */
function detectJwtAuth(projectPath, files) {
  const result = {
    signals: [],
    hasJwtPattern: false,
    tokenEndpoint: null,
    confidence: Confidence.NONE,
    questions: [],
  };

  const jwtPatterns = {
    jwtSign: /jwt\.sign|jsonwebtoken|jose|sign\s*\(\s*\{/gi,
    jwtVerify: /jwt\.verify|jwtVerify|verifyToken/gi,
    tokenRoute: /api\/.*token|\/auth\/token|generateToken/gi,
    bearerAuth: /Bearer\s+|Authorization.*Bearer/gi,
    veltToken: /velt.*token|VELT_AUTH_TOKEN/gi,
  };

  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relativePath = path.relative(projectPath, file);

    for (const [name, pattern] of Object.entries(jwtPatterns)) {
      if (pattern.test(content)) {
        pattern.lastIndex = 0; // Reset for reuse

        const isTokenRoute = relativePath.includes('api/') && relativePath.includes('token');

        result.signals.push({
          type: name,
          file: relativePath,
          isTokenRoute,
          confidence: isTokenRoute ? Confidence.HIGH : Confidence.MEDIUM,
          description: `JWT pattern: ${name}`,
        });

        if (isTokenRoute && !result.tokenEndpoint) {
          result.tokenEndpoint = relativePath;
        }
      }
    }
  }

  result.hasJwtPattern = result.signals.length > 0;

  if (result.tokenEndpoint) {
    result.confidence = Confidence.HIGH;
  } else if (result.hasJwtPattern) {
    result.confidence = Confidence.MEDIUM;
    result.questions.push({
      question: 'JWT patterns detected but no token endpoint found. Does your app need JWT auth for Velt?',
      options: [
        'Yes, I have a token endpoint (I\'ll provide the path)',
        'Yes, but I need to create one',
        'No, I\'ll use simple authentication',
        'Not sure - explain the options',
      ],
    });
  } else {
    result.confidence = Confidence.LOW;
    // Don't ask about JWT by default - it's optional
  }

  return result;
}

/**
 * Gets line number from content and index
 */
function getLineNumber(content, index) {
  if (index === undefined) return null;
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Main discovery function
 *
 * @param {string} projectPath - Path to the project
 * @returns {Object} Discovery results with signals, recommendations, and questions
 */
export function discoverHostAppWiring(projectPath) {
  const result = createDiscoveryResult();

  console.error('   🔍 Scanning host app for integration signals...');

  // Scan all relevant files
  const files = scanFiles(projectPath);
  console.error(`      Found ${files.length} source files to analyze`);

  // Run all detections
  result.documentId = detectDocumentIdSource(projectPath, files);
  console.error(`      Document ID: ${result.documentId.signals.length} signals (${result.documentId.confidence} confidence)`);

  result.user = detectUserSource(projectPath, files);
  console.error(`      User auth: ${result.user.signals.length} signals (${result.user.confidence} confidence)`);

  result.setDocuments = detectSetDocumentsLocation(projectPath, files, result.documentId);
  console.error(`      Setup location: ${result.setDocuments.signals.length} signals (${result.setDocuments.confidence} confidence)`);

  result.jwtAuth = detectJwtAuth(projectPath, files);
  console.error(`      JWT auth: ${result.jwtAuth.signals.length} signals (${result.jwtAuth.confidence} confidence)`);

  // Build summary
  result.summary.totalSignals =
    result.documentId.signals.length +
    result.user.signals.length +
    result.setDocuments.signals.length +
    result.jwtAuth.signals.length;

  // Collect all questions
  const allQuestions = [
    ...result.documentId.questions,
    ...result.user.questions,
    ...result.setDocuments.questions,
    ...result.jwtAuth.questions,
  ];

  result.summary.questionsForDeveloper = allQuestions;
  result.summary.hasUnansweredQuestions = allQuestions.length > 0;

  console.error(`   ✅ Discovery complete: ${result.summary.totalSignals} signals, ${allQuestions.length} questions for developer`);

  return result;
}

/**
 * Formats discovery results for plan output
 *
 * @param {Object} discovery - Discovery results from discoverHostAppWiring
 * @returns {string} Markdown-formatted findings
 */
export function formatDiscoveryForPlan(discovery) {
  let output = `\n## 🔍 Integration Findings (Host App Wiring Discovery)\n\n`;

  // Document ID section
  output += `### Document ID Source\n`;
  if (discovery.documentId.confidence === Confidence.HIGH && discovery.documentId.recommendedSource) {
    output += `✅ **Recommended**: ${discovery.documentId.recommendedSource.description}\n`;
    output += `   - File: \`${discovery.documentId.recommendedSource.file}\`\n`;
    if (discovery.documentId.recommendedSource.paramName) {
      output += `   - Parameter: \`${discovery.documentId.recommendedSource.paramName}\`\n`;
    }
  } else if (discovery.documentId.signals.length > 0) {
    output += `⚠️ **Found ${discovery.documentId.signals.length} potential sources** (needs confirmation):\n`;
    for (const signal of discovery.documentId.signals.slice(0, 3)) {
      output += `   - ${signal.file}: ${signal.description}\n`;
    }
  } else {
    output += `❓ **No document ID source detected**\n`;
  }
  output += '\n';

  // User Auth section
  output += `### User Authentication\n`;
  if (discovery.user.authProvider) {
    output += `✅ **Detected**: ${discovery.user.authProvider}\n`;
    if (discovery.user.userContextFile) {
      output += `   - Context file: \`${discovery.user.userContextFile}\`\n`;
    }
  } else if (discovery.user.signals.length > 0) {
    output += `⚠️ **Found patterns but unclear provider**:\n`;
    for (const signal of discovery.user.signals.slice(0, 3)) {
      output += `   - ${signal.file}: ${signal.description}\n`;
    }
  } else {
    output += `❓ **No authentication pattern detected**\n`;
  }
  output += '\n';

  // Setup Location section
  output += `### Recommended Setup Location\n`;
  if (discovery.setDocuments.recommendedLocation) {
    output += `✅ **Recommended file**: \`${discovery.setDocuments.recommendedLocation.file}\`\n`;
    output += `   - Type: ${discovery.setDocuments.recommendedLocation.type}\n`;
    if (discovery.setDocuments.recommendedLocation.hasVeltProvider) {
      output += `   - Already has VeltProvider ✓\n`;
    }
  } else {
    output += `❓ **Could not determine optimal setup location**\n`;
  }
  output += '\n';

  // JWT Auth section (only if relevant)
  if (discovery.jwtAuth.hasJwtPattern) {
    output += `### JWT Authentication\n`;
    if (discovery.jwtAuth.tokenEndpoint) {
      output += `✅ **Token endpoint found**: \`${discovery.jwtAuth.tokenEndpoint}\`\n`;
    } else {
      output += `⚠️ **JWT patterns found but no token endpoint**\n`;
    }
    output += '\n';
  }

  // Questions for Developer section
  if (discovery.summary.questionsForDeveloper.length > 0) {
    output += `### ❓ Questions for Developer\n\n`;
    output += `**IMPORTANT**: The following items need your input before proceeding:\n\n`;
    for (let i = 0; i < discovery.summary.questionsForDeveloper.length; i++) {
      const q = discovery.summary.questionsForDeveloper[i];
      output += `**${i + 1}. ${q.question}**\n`;
      for (const option of q.options) {
        output += `   - ${option}\n`;
      }
      output += '\n';
    }
  }

  return output;
}

/**
 * Formats discovery results for user verification (structured format)
 * Used when user says YES to scanning - they need to verify findings
 *
 * @param {Object} discovery - Discovery results from discoverHostAppWiring
 * @returns {string} Markdown-formatted verification UI
 */
export function formatDiscoveryForVerification(discovery) {
  let output = `## 🔍 Discovery Scan Results - Please Verify\n\n`;
  output += `Found **${discovery.summary.totalSignals}** integration signals. Please review and confirm:\n\n`;

  // Document ID section
  output += `### A) Document ID Source\n`;
  if (discovery.documentId.recommendedSource) {
    const src = discovery.documentId.recommendedSource;
    output += `| Field | Detected Value |\n|-------|----------------|\n`;
    output += `| Method | ${src.type || 'unknown'} |\n`;
    output += `| File | \`${src.file || 'not detected'}\` |\n`;
    output += `| Variable | \`${src.paramName || src.variableName || 'not detected'}\` |\n`;
    output += `| Confidence | ${discovery.documentId.confidence} |\n\n`;
  } else {
    output += `⚠️ **Not detected** - You'll need to provide this information.\n\n`;
  }

  // User Auth section
  output += `### B) User Authentication\n`;
  if (discovery.user.authProvider) {
    output += `| Field | Detected Value |\n|-------|----------------|\n`;
    output += `| Provider | ${discovery.user.authProvider} |\n`;
    output += `| Context File | \`${discovery.user.userContextFile || 'not detected'}\` |\n`;
    output += `| Confidence | ${discovery.user.confidence} |\n\n`;
  } else if (discovery.user.signals.length > 0) {
    output += `⚠️ **Possible providers detected** (needs confirmation):\n`;
    const uniqueProviders = [...new Set(discovery.user.signals.filter(s => s.provider).map(s => s.provider))];
    output += uniqueProviders.map(p => `- ${p}`).join('\n') + '\n\n';
  } else {
    output += `⚠️ **Not detected** - You'll need to provide this information.\n\n`;
  }

  // Setup Location section
  output += `### C) Velt Setup Location\n`;
  if (discovery.setDocuments.recommendedLocation) {
    const loc = discovery.setDocuments.recommendedLocation;
    output += `| Field | Detected Value |\n|-------|----------------|\n`;
    output += `| Location Type | ${loc.type || 'unknown'} |\n`;
    output += `| File | \`${loc.file || 'not detected'}\` |\n`;
    output += `| Has VeltProvider | ${loc.hasVeltProvider ? 'Yes' : 'No'} |\n`;
    output += `| Confidence | ${discovery.setDocuments.confidence} |\n\n`;
  } else {
    output += `⚠️ **Not detected** - You'll need to provide this information.\n\n`;
  }

  // JWT Auth section
  output += `### D) JWT/Auth Token\n`;
  if (discovery.jwtAuth.hasJwtPattern) {
    output += `| Field | Detected Value |\n|-------|----------------|\n`;
    output += `| Uses JWT | Yes |\n`;
    output += `| Token Endpoint | \`${discovery.jwtAuth.tokenEndpoint || 'not detected'}\` |\n`;
    output += `| Confidence | ${discovery.jwtAuth.confidence} |\n\n`;
  } else {
    output += `| Field | Detected Value |\n|-------|----------------|\n`;
    output += `| Uses JWT | Not detected |\n\n`;
  }

  output += `---\n\n`;
  output += `**Please verify**: Are these findings correct?\n`;

  return output;
}

/**
 * Returns the questionnaire structure for manual wiring
 * Used when user says NO to scanning
 *
 * @returns {Object} Questionnaire structure with questions and options
 */
export function getManualWiringQuestionnaire() {
  return {
    documentId: {
      question: 'How do you obtain the documentId in this app?',
      options: [
        { value: 'query-param', label: 'From URL query param (e.g., ?documentId=...)' },
        { value: 'route-param', label: 'From route param (e.g., /docs/[id])' },
        { value: 'database', label: 'From database record created on page load' },
        { value: 'storage', label: 'From localStorage/sessionStorage' },
        { value: 'other', label: 'Other (describe)' },
      ],
      followUp: [
        { field: 'filePath', question: 'Which file/component currently reads/creates it? (path)' },
        { field: 'variableName', question: 'What is the variable name?' },
        { field: 'example', question: 'Example value (optional)' },
      ],
    },
    user: {
      question: 'How do you get the current user (userId + name/email/photo)?',
      options: [
        { value: 'next-auth', label: 'next-auth session' },
        { value: 'clerk', label: 'Clerk' },
        { value: 'firebase', label: 'Firebase auth' },
        { value: 'supabase', label: 'Supabase auth' },
        { value: 'custom-api', label: 'Custom /api/me endpoint' },
        { value: 'other', label: 'Other' },
      ],
      followUp: [
        { field: 'filePath', question: 'Which file/hook provides it? (path)' },
        { field: 'fields', question: 'What fields are available? (userId, name, email, photoUrl)' },
      ],
    },
    auth: {
      question: 'Do you use a JWT or auth token for API calls?',
      options: [
        { value: 'cookie', label: 'Yes, stored in cookie' },
        { value: 'localStorage', label: 'Yes, stored in localStorage' },
        { value: 'provider-sdk', label: 'Yes, managed by auth provider SDK (I don\'t directly handle it)' },
        { value: 'none', label: 'No token needed' },
        { value: 'unsure', label: 'Unsure' },
      ],
      followUp: [
        { field: 'source', question: 'Where is it obtained? (login endpoint, session object, middleware, etc.)' },
        { field: 'refresh', question: 'Is there a refresh flow? (yes/no)' },
      ],
    },
    insertion: {
      question: 'Where should we call setDocuments / initialize Velt?',
      options: [
        { value: 'root-layout', label: 'Root layout/provider file (e.g. app/layout.tsx or pages/_app.tsx)' },
        { value: 'specific-page', label: 'Specific page (e.g. app/page.tsx)' },
        { value: 'editor-wrapper', label: 'Editor wrapper component' },
        { value: 'other', label: 'Other (describe)' },
      ],
      followUp: [
        { field: 'filePath', question: 'What file path should we modify?' },
      ],
    },
  };
}

/**
 * Creates normalized wiring object from manual questionnaire answers
 *
 * @param {Object} manualWiring - Manual wiring answers from user
 * @returns {Object} Normalized wiring object for plan generation
 */
export function createWiringFromManualAnswers(manualWiring) {
  const wiring = {
    source: 'manual',
    documentId: null,
    user: null,
    auth: null,
    insertion: null,
    todos: [],
  };

  // Process documentId
  if (manualWiring.documentId) {
    const d = manualWiring.documentId;
    if (d.unsure) {
      wiring.todos.push('TODO: Determine document ID source - user was unsure');
      wiring.documentId = { method: 'unknown', unsure: true };
    } else {
      wiring.documentId = {
        method: d.method,
        filePath: d.filePath || null,
        variableName: d.variableName || null,
        example: d.example || null,
      };
    }
  } else {
    wiring.todos.push('TODO: Document ID source not provided');
  }

  // Process user
  if (manualWiring.user) {
    const u = manualWiring.user;
    if (u.unsure) {
      wiring.todos.push('TODO: Determine user authentication source - user was unsure');
      wiring.user = { providerType: 'unknown', unsure: true };
    } else {
      wiring.user = {
        providerType: u.providerType,
        filePath: u.filePath || null,
        fields: u.fields || ['userId', 'name', 'email'],
      };
    }
  } else {
    wiring.todos.push('TODO: User authentication source not provided');
  }

  // Process auth
  if (manualWiring.auth) {
    const a = manualWiring.auth;
    if (a.unsure || a.storage === 'unsure') {
      wiring.todos.push('TODO: Determine JWT/auth token handling - user was unsure');
      wiring.auth = { usesToken: null, unsure: true };
    } else {
      wiring.auth = {
        usesToken: a.usesToken !== false && a.storage !== 'none',
        storage: a.storage || 'none',
        source: a.source || null,
        refresh: a.refresh || false,
      };
    }
  } else {
    // Auth is optional, don't add TODO
    wiring.auth = { usesToken: false, storage: 'none' };
  }

  // Process insertion
  if (manualWiring.insertion) {
    const i = manualWiring.insertion;
    if (i.unsure) {
      wiring.todos.push('TODO: Determine Velt initialization location - user was unsure');
      wiring.insertion = { locationType: 'unknown', unsure: true };
    } else {
      wiring.insertion = {
        locationType: i.locationType,
        filePath: i.filePath || null,
      };
    }
  } else {
    wiring.todos.push('TODO: Velt initialization location not provided');
  }

  return wiring;
}

/**
 * Resolves final wiring from discovery verification (merges overrides)
 *
 * @param {Object} discovery - Discovery results from scan
 * @param {Object} verification - Verification response from user
 * @returns {Object} Resolved wiring object for plan generation
 */
export function resolveWiringFromVerification(discovery, verification) {
  const wiring = {
    source: verification.status === 'confirmed' ? 'verified-discovery' : 'partial-manual',
    documentId: null,
    user: null,
    auth: null,
    insertion: null,
    todos: [],
  };

  // If user said UNSURE, everything becomes a TODO
  if (verification.status === 'unsure') {
    wiring.source = 'needs-clarification';
    wiring.todos.push('TODO: Document ID source needs human clarification');
    wiring.todos.push('TODO: User authentication needs human clarification');
    wiring.todos.push('TODO: Velt initialization location needs human clarification');
    wiring.documentId = { method: 'unknown', unsure: true };
    wiring.user = { providerType: 'unknown', unsure: true };
    wiring.auth = { usesToken: null, unsure: true };
    wiring.insertion = { locationType: 'unknown', unsure: true };
    return wiring;
  }

  const overrides = verification.overrides || {};

  // Document ID - use override or discovery
  if (overrides.documentId) {
    wiring.documentId = overrides.documentId;
  } else if (discovery.documentId.recommendedSource) {
    const src = discovery.documentId.recommendedSource;
    wiring.documentId = {
      method: src.type || 'route-param',
      filePath: src.file,
      variableName: src.paramName || src.variableName,
    };
  } else {
    wiring.todos.push('TODO: Document ID source not confirmed');
    wiring.documentId = { method: 'unknown', unsure: true };
  }

  // User - use override or discovery
  if (overrides.user) {
    wiring.user = overrides.user;
  } else if (discovery.user.authProvider) {
    wiring.user = {
      providerType: discovery.user.authProvider,
      filePath: discovery.user.userContextFile,
      fields: ['userId', 'name', 'email', 'photoUrl'],
    };
  } else {
    wiring.todos.push('TODO: User authentication source not confirmed');
    wiring.user = { providerType: 'unknown', unsure: true };
  }

  // Auth - use override or discovery
  if (overrides.auth) {
    wiring.auth = overrides.auth;
  } else if (discovery.jwtAuth.hasJwtPattern) {
    wiring.auth = {
      usesToken: true,
      storage: 'unknown',
      source: discovery.jwtAuth.tokenEndpoint,
    };
  } else {
    wiring.auth = { usesToken: false, storage: 'none' };
  }

  // Insertion - use override or discovery
  if (overrides.insertion) {
    wiring.insertion = overrides.insertion;
  } else if (discovery.setDocuments.recommendedLocation) {
    const loc = discovery.setDocuments.recommendedLocation;
    wiring.insertion = {
      locationType: loc.type || 'specific-page',
      filePath: loc.file,
    };
  } else {
    wiring.todos.push('TODO: Velt initialization location not confirmed');
    wiring.insertion = { locationType: 'unknown', unsure: true };
  }

  return wiring;
}

export default {
  discoverHostAppWiring,
  formatDiscoveryForPlan,
  formatDiscoveryForVerification,
  getManualWiringQuestionnaire,
  createWiringFromManualAnswers,
  resolveWiringFromVerification,
  Confidence,
};
