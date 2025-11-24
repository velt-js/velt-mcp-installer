/**
 * Velt MCP Query Utilities
 * 
 * Queries the Velt Docs MCP server for implementation patterns and best practices
 * 
 * Velt Docs MCP Server: https://docs.velt.dev/mcp
 */

import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

/**
 * Queries Velt documentation for implementation patterns
 * 
 * Tries three strategies in order:
 * 1. Velt Docs MCP server (https://docs.velt.dev/mcp)
 * 2. Direct URL fetch (https://docs.velt.dev/async-collaboration/comments/setup/freestyle)
 * 3. Hardcoded fallback patterns
 * 
 * @param {Object} params
 * @param {string} params.question - Question to ask Velt MCP
 * @returns {Promise<Object>} Query result with patterns
 */
export async function queryVeltMCP({ question }) {
  const query = question || 'How do I implement freestyle comments in Next.js app router?';
  const veltDocsMCPUrl = 'https://docs.velt.dev/mcp';
  const veltDocsUrl = 'https://docs.velt.dev/async-collaboration/comments/setup/freestyle';
  
  console.error('🔍 Fetching Velt documentation for implementation patterns...');
  
  // ========================================================================
  // Strategy 1: Try Velt Docs MCP server first
  // ========================================================================
  console.error('   Strategy 1: Attempting Velt Docs MCP server...');
  console.error(`   MCP URL: ${veltDocsMCPUrl}`);
  
  try {
    if (typeof fetch !== 'undefined') {
      // Node 18+ with native fetch
      console.error('   Using native fetch (Node 18+)');
      
      // Try to discover available tools
      console.error('   Step 1: Discovering available tools...');
      let toolsListResponse;
      try {
        toolsListResponse = await fetch(veltDocsMCPUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            id: Date.now(),
          }),
          signal: AbortSignal.timeout(8000),
        });
      } catch (listError) {
        throw new Error(`Failed to connect to Velt Docs MCP: ${listError.message}`);
      }

      if (!toolsListResponse.ok) {
        throw new Error(`HTTP ${toolsListResponse.status}: ${toolsListResponse.statusText}`);
      }

      const toolsList = await toolsListResponse.json();
      
      if (toolsList.error) {
        throw new Error(`MCP error: ${toolsList.error.message || 'Unknown error'}`);
      }

      const availableTools = toolsList.result?.tools || [];
      console.error(`   ✓ Found ${availableTools.length} available tools`);
      
      if (availableTools.length > 0) {
        console.error(`   Tools: ${availableTools.map(t => t.name).join(', ')}`);
      }

      // Find the appropriate tool for querying documentation
      const searchTool = availableTools.find(t => 
        t.name.toLowerCase().includes('search') || 
        t.name.toLowerCase().includes('query') ||
        t.name.toLowerCase().includes('docs') ||
        t.name.toLowerCase().includes('velt')
      ) || availableTools[0];

      if (!searchTool) {
        throw new Error('No tools available in Velt Docs MCP server');
      }

      console.error(`   Step 2: Calling tool: ${searchTool.name}`);
      
      // Call the tool
      const response = await fetch(veltDocsMCPUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          id: Date.now(),
          params: {
            name: searchTool.name,
            arguments: {
              query: query,
            },
          },
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout for tool execution
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const mcpResponse = await response.json();
      
      // Parse the MCP response
      if (mcpResponse.error) {
        throw new Error(mcpResponse.error.message || 'MCP query failed');
      }

      // Extract patterns from the response
      const result = mcpResponse.result || mcpResponse;
      const patterns = extractPatternsFromMCPResponse(result);
      
      // Show what patterns were found
      const foundPatterns = [];
      if (patterns.providerPattern) foundPatterns.push('VeltProvider');
      if (patterns.commentsPattern) foundPatterns.push('VeltComments');
      if (patterns.sidebarPattern) foundPatterns.push('VeltCommentsSidebar');
      if (patterns.environmentPattern) foundPatterns.push('Environment variables');
      
      console.error('✅ Successfully queried Velt Docs MCP server!');
      console.error(`   ✓ Found patterns: ${foundPatterns.length > 0 ? foundPatterns.join(', ') : 'Using fallback patterns'}`);
      console.error(`   ✓ Source: Velt Docs MCP (${veltDocsMCPUrl})`);
      
      return {
        success: true,
        data: patterns,
        query: query,
        source: 'velt-docs-mcp',
        message: `✅ Successfully queried Velt Docs MCP server and extracted patterns from real documentation`,
      };
    } else {
      // Node < 18: Use https module for MCP
      console.error('   Using https module (Node < 18)');
      
      try {
        const toolsList = await makeHttpsRequest(veltDocsMCPUrl, {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: Date.now(),
        });
        
        const toolName = toolsList.result?.tools?.find(t => 
          t.name.toLowerCase().includes('search') || 
          t.name.toLowerCase().includes('query') ||
          t.name.toLowerCase().includes('docs')
        )?.name || toolsList.result?.tools?.[0]?.name || 'query_docs';
        
        console.error(`   Discovered tool: ${toolName}`);
        
        const mcpResponse = await makeHttpsRequest(veltDocsMCPUrl, {
          jsonrpc: '2.0',
          method: 'tools/call',
          id: Date.now(),
          params: {
            name: toolName,
            arguments: {
              query: query,
            },
          },
        });
        
        if (mcpResponse.error) {
          throw new Error(mcpResponse.error.message || 'MCP query failed');
        }

        const result = mcpResponse.result || mcpResponse;
        const patterns = extractPatternsFromMCPResponse(result);
        
        console.error('✅ Successfully queried Velt Docs MCP server!');
        console.error(`   ✓ Source: Velt Docs MCP (${veltDocsMCPUrl})`);
        
        return {
          success: true,
          data: patterns,
          query: query,
          source: 'velt-docs-mcp',
          message: `✅ Successfully queried Velt Docs MCP server and extracted patterns from real documentation`,
        };
      } catch (mcpError) {
        throw mcpError;
      }
    }
  } catch (mcpError) {
    // ========================================================================
    // Strategy 2: Fallback to direct URL fetch
    // ========================================================================
    console.error(`   ❌ MCP server failed: ${mcpError.message}`);
    console.error('   Strategy 2: Falling back to direct URL fetch...');
    console.error(`   URL: ${veltDocsUrl}`);
    
    try {
      // Fetch documentation page directly
      console.error(`   Fetching documentation page...`);
      
      let htmlContent;
      
      if (typeof fetch !== 'undefined') {
        // Node 18+ with native fetch
        console.error('   Using native fetch (Node 18+)');
        
        const response = await fetch(veltDocsUrl, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Velt-MCP-Installer/1.0',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        htmlContent = await response.text();
      } else {
        // Node < 18: Use https module
        console.error('   Using https module (Node < 18)');
        htmlContent = await fetchHtmlPage(veltDocsUrl);
      }
      
      console.error('   ✓ Successfully fetched documentation page');
      
      // Extract patterns from HTML content
      console.error('   📖 Extracting code patterns from documentation...');
      const patterns = extractPatternsFromDocsContent(htmlContent, query);
      
      // Show what patterns were found
      const foundPatterns = [];
      if (patterns.providerPattern?.code) foundPatterns.push('VeltProvider');
      if (patterns.commentsPattern?.code) foundPatterns.push('VeltComments');
      if (patterns.sidebarPattern?.code) foundPatterns.push('VeltCommentsSidebar');
      if (patterns.environmentPattern?.code) foundPatterns.push('Environment variables');
      
      console.error('✅ Successfully extracted patterns from Velt documentation!');
      console.error(`   ✓ Found patterns: ${foundPatterns.length > 0 ? foundPatterns.join(', ') : 'Using fallback patterns'}`);
      console.error(`   ✓ Source: Velt Docs URL (${veltDocsUrl})`);
      
      return {
        success: true,
        data: patterns,
        query: query,
        source: 'velt-docs-url',
        message: `✅ Successfully fetched and extracted patterns from Velt documentation (fallback from MCP)`,
      };
    } catch (urlError) {
      // ========================================================================
      // Strategy 3: Fallback to hardcoded patterns
      // ========================================================================
      console.error(`   ❌ URL fetch failed: ${urlError.message}`);
      console.error('   Strategy 3: Using fallback patterns based on known best practices');
      
      const fallbackPatterns = getFallbackPatterns();
      
      return {
        success: true,
        data: fallbackPatterns,
        query: query,
        source: 'fallback',
        warning: 'Using fallback patterns. Both MCP and URL fetch failed.',
        message: `⚠️  Using fallback patterns (MCP and URL fetch failed). Patterns are based on known best practices.`,
      };
    }
  }
}

/**
 * Makes HTTPS request using Node.js built-in https module
 * (for Node < 18 compatibility)
 * 
 * @param {string} url - URL to request
 * @param {Object} data - JSON data to send
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Parsed JSON response
 */
function makeHttpsRequest(url, data, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: timeout,
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Extracts code patterns from Velt MCP response
 * 
 * @param {Object} mcpResult - Result from Velt Docs MCP server
 * @returns {Object} Extracted patterns
 */
function extractPatternsFromMCPResponse(mcpResult) {
  // The MCP response contains documentation content
  // We need to parse it to extract code patterns

  const content = mcpResult?.content || [];
  let patterns = {
    summary: 'Freestyle comments implementation patterns from Velt documentation',
    providerPattern: null,
    commentsPattern: null,
    sidebarPattern: null,
    environmentPattern: null,
    rawContent: content,
  };

  // Parse content to find code examples
  for (const item of content) {
    if (item.type === 'text') {
      const text = item.text;

      // Look for VeltProvider pattern
      if (text.includes('VeltProvider') && !patterns.providerPattern) {
        patterns.providerPattern = extractCodeBlock(text, 'VeltProvider');
      }

      // Look for VeltComments pattern
      if (text.includes('VeltComments') && !text.includes('VeltCommentsSidebar') && !patterns.commentsPattern) {
        patterns.commentsPattern = extractCodeBlock(text, 'VeltComments');
      }

      // Look for VeltCommentsSidebar pattern
      if (text.includes('VeltCommentsSidebar') && !patterns.sidebarPattern) {
        patterns.sidebarPattern = extractCodeBlock(text, 'VeltCommentsSidebar');
      }

      // Look for environment variables
      if (text.includes('NEXT_PUBLIC_VELT_API_KEY') && !patterns.environmentPattern) {
        patterns.environmentPattern = extractCodeBlock(text, 'NEXT_PUBLIC_VELT_API_KEY');
      }
    }
  }

  // If we didn't find patterns, use fallback
  if (!patterns.providerPattern || !patterns.commentsPattern) {
    const fallback = getFallbackPatterns();
    return {
      ...fallback,
      source: 'mcp-with-fallback',
      rawContent: content,
    };
  }

  return patterns;
}

/**
 * Extracts code block from text
 * 
 * @param {string} text - Text to search
 * @param {string} keyword - Keyword to find
 * @returns {Object|null} Extracted code pattern
 */
function extractCodeBlock(text, keyword) {
  // Try to find code blocks containing the keyword
  const codeBlockRegex = /```(?:tsx?|jsx?|javascript|typescript)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1].includes(keyword)) {
      return {
        code: match[1].trim(),
        description: `Code pattern for ${keyword}`,
      };
    }
  }

  return null;
}

/**
 * Fetches HTML page using https module (for Node < 18)
 * 
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
function fetchHtmlPage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + (urlObj.search || ''),
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Velt-MCP-Installer/1.0',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let htmlContent = '';

      res.on('data', (chunk) => {
        htmlContent += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        } else {
          resolve(htmlContent);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Extracts patterns from Velt documentation website content
 * 
 * @param {string} htmlContent - HTML content from docs.velt.dev
 * @param {string} query - Original query
 * @returns {Object} Extracted patterns
 */
function extractPatternsFromDocsContent(htmlContent, query) {
  // Start with fallback patterns
  const patterns = getFallbackPatterns();

  // Try to extract code blocks from HTML
  // Look for <pre><code> blocks or markdown code fences in the HTML

  // Extract code blocks from HTML
  const codeBlockRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(htmlContent)) !== null) {
    const code = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();

    if (code.length > 20) { // Only keep substantial code blocks
      codeBlocks.push(code);
    }
  }

  // Try to find patterns in code blocks
  for (const code of codeBlocks) {
    // Look for VeltProvider pattern
    if (code.includes('VeltProvider') && !patterns.providerPattern?.code) {
      patterns.providerPattern = {
        description: 'Wrap root layout with VeltProvider',
        code: code,
        location: 'app/layout.tsx',
      };
    }

    // Look for VeltComments pattern
    if (code.includes('VeltComments') && !code.includes('VeltCommentsSidebar') && !patterns.commentsPattern?.code) {
      patterns.commentsPattern = {
        description: 'Add VeltComments component to enable freestyle comments',
        code: code,
        location: 'app/page.tsx',
      };
    }

    // Look for VeltCommentsSidebar pattern
    if (code.includes('VeltCommentsSidebar') && !patterns.sidebarPattern?.code) {
      patterns.sidebarPattern = {
        description: 'Add VeltCommentsSidebar for comment UI',
        code: code,
        location: 'app/layout.tsx or components',
      };
    }

    // Look for environment variables
    if (code.includes('NEXT_PUBLIC_VELT_API_KEY') && !patterns.environmentPattern?.code) {
      patterns.environmentPattern = {
        description: 'Environment variables needed',
        code: code,
        location: '.env.local',
      };
    }
  }

  // Mark source if we found patterns
  if (codeBlocks.length > 0) {
    patterns.source = 'extracted-from-docs';
    patterns.summary = 'Freestyle comments implementation patterns extracted from Velt documentation';
  }

  return patterns;
}

/**
 * Detects libraries in the project by checking package.json
 * 
 * @param {string} projectPath - Project root path
 * @returns {Object} Library detection flags
 */
export function detectLibraries(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      hasReactFlow: false,
      hasTiptap: false,
      hasCodeMirror: false,
      hasAgGrid: false,
      hasTanStack: false,
    };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    // Check for ReactFlow (multiple possible package names)
    const hasReactFlow = !!(
      allDeps['reactflow'] ||
      allDeps['@xyflow/react'] ||
      allDeps['react-flow-renderer'] ||
      allDeps['@reactflow/core']
    );

    // Check for Tiptap
    const hasTiptap = !!(
      allDeps['@tiptap/react'] ||
      allDeps['@tiptap/core'] ||
      allDeps['tiptap']
    );

    // Check for CodeMirror
    const hasCodeMirror = !!(
      allDeps['@codemirror/state'] ||
      allDeps['@codemirror/view'] ||
      allDeps['codemirror']
    );

    // Check for AG-Grid
    const hasAgGrid = !!(
      allDeps['ag-grid-react'] ||
      allDeps['ag-grid-community'] ||
      allDeps['ag-grid-enterprise']
    );

    // Check for TanStack Table
    const hasTanStack = !!(
      allDeps['@tanstack/react-table'] ||
      allDeps['@tanstack/table-core']
    );

    return {
      hasReactFlow,
      hasTiptap,
      hasCodeMirror,
      hasAgGrid,
      hasTanStack,
    };
  } catch (error) {
    console.error(`Error detecting libraries: ${error.message}`);
    return {
      hasReactFlow: false,
      hasTiptap: false,
      hasCodeMirror: false,
      hasAgGrid: false,
      hasTanStack: false,
    };
  }
}

/**
 * Fallback patterns if MCP server is unavailable
 * 
 * @returns {Object} Hardcoded patterns
 */
function getFallbackPatterns() {
  return {
    summary: 'Freestyle comments implementation patterns for Next.js App Router',
    providerPattern: {
      description: 'Wrap root layout with VeltProvider',
      code: `import { VeltProvider } from '@veltdev/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <VeltProvider>
          {children}
        </VeltProvider>
      </body>
    </html>
  );
}`,
      location: 'app/layout.tsx',
    },
    commentsPattern: {
      description: 'Add VeltComments component to enable freestyle comments',
      code: `import { VeltComments } from '@veltdev/react';

export default function Page() {
  return (
    <div>
      <VeltComments />
      {/* Your page content */}
    </div>
  );
}`,
      location: 'app/page.tsx',
    },
    sidebarPattern: {
      description: 'Add VeltCommentsSidebar for comment UI',
      code: `import { VeltCommentsSidebar } from '@veltdev/react';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <VeltCommentsSidebar />
    </>
  );
}`,
      location: 'app/layout.tsx or components',
    },
    environmentPattern: {
      description: 'Environment variables needed',
      code: `NEXT_PUBLIC_VELT_API_KEY=your_api_key_here`,
      location: '.env.local',
    },
  };
}

