/**
 * Velt Docs MCP Client
 * 
 * Attempts to query Velt Docs MCP server through proper MCP protocol
 * Falls back to direct documentation queries if MCP is unavailable
 */

import https from 'https';
import { URL } from 'url';

/**
 * Queries Velt Docs MCP server properly
 *
 * Since HTTP-based MCP servers require IDE client access,
 * we try multiple strategies to get documentation patterns.
 *
 * @param {string} query - Query string
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise<Object>} Patterns result
 */
export async function queryVeltDocsMCP(query, maxRetries = 2) {
  const veltDocsMCPUrl = 'https://docs.velt.dev/mcp';

  // Strategy 1: Try MCP server with proper protocol and retry logic
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        console.error(`   Retry attempt ${attempt}/${maxRetries} after ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      console.error('   Attempting MCP protocol query...');

      // First, get available tools with timeout
      const toolsResponse = await makeMCPRequestWithTimeout(veltDocsMCPUrl, {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }, 5000);

      if (toolsResponse.error) {
        throw new Error(toolsResponse.error.message);
      }

      const tools = toolsResponse.result?.tools || [];
      console.error(`   ✓ Found ${tools.length} tools`);

      // Find search/query tool
      const searchTool = tools.find(t =>
        t.name.toLowerCase().includes('search') ||
        t.name.toLowerCase().includes('query') ||
        t.name.toLowerCase().includes('docs')
      ) || tools[0];

      if (!searchTool) {
        throw new Error('No search tool available');
      }

      console.error(`   Calling tool: ${searchTool.name}`);

      // Call the tool with timeout
      const toolResponse = await makeMCPRequestWithTimeout(veltDocsMCPUrl, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 2,
        params: {
          name: searchTool.name,
          arguments: {
            query: query,
          },
        },
      }, 5000);

      if (toolResponse.error) {
        throw new Error(toolResponse.error.message);
      }

      return {
        success: true,
        data: toolResponse.result,
        source: 'velt-docs-mcp',
      };

    } catch (error) {
      lastError = error;
      console.error(`   MCP query failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);

      // Don't retry on certain errors
      if (error.message.includes('No search tool available') ||
          error.message.includes('Failed to parse response')) {
        break;
      }
    }
  }

  // All retries failed
  throw lastError || new Error('MCP query failed after all retries');
}

/**
 * Makes MCP protocol request with guaranteed timeout using Promise.race()
 *
 * This ensures the request will ALWAYS timeout, even if the server
 * is sending data slowly or the connection hangs.
 *
 * @param {string} url - MCP server URL
 * @param {Object} data - JSON-RPC request data
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} MCP response
 */
function makeMCPRequestWithTimeout(url, data, timeoutMs = 5000) {
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // Create the actual request promise
  const requestPromise = makeMCPRequest(url, data, timeoutMs);

  // Race between request and timeout
  return Promise.race([requestPromise, timeoutPromise]);
}

/**
 * Makes MCP protocol request (internal)
 *
 * @param {string} url - MCP server URL
 * @param {Object} data - JSON-RPC request data
 * @param {number} socketTimeout - Socket-level timeout (default: 5000)
 * @returns {Promise<Object>} MCP response
 */
function makeMCPRequest(url, data, socketTimeout = 5000) {
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
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: socketTimeout,
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      let responseSize = 0;
      const maxResponseSize = 10 * 1024 * 1024; // 10MB max response size

      res.on('data', (chunk) => {
        responseSize += chunk.length;

        // Prevent memory exhaustion from huge responses
        if (responseSize > maxResponseSize) {
          req.destroy();
          reject(new Error(`Response too large (exceeded ${maxResponseSize} bytes)`));
          return;
        }

        responseData += chunk;
      });

      res.on('end', () => {
        // Check for HTTP errors
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Socket timeout'));
    });

    req.write(postData);
    req.end();
  });
}

