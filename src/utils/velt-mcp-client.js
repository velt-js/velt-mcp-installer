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
 * @returns {Promise<Object>} Patterns result
 */
export async function queryVeltDocsMCP(query) {
  const veltDocsMCPUrl = 'https://docs.velt.dev/mcp';
  
  // Strategy 1: Try MCP server with proper protocol
  try {
    console.error('   Attempting MCP protocol query...');
    
    // First, get available tools
    const toolsResponse = await makeMCPRequest(veltDocsMCPUrl, {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    });
    
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
    
    // Call the tool
    const toolResponse = await makeMCPRequest(veltDocsMCPUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      id: 2,
      params: {
        name: searchTool.name,
        arguments: {
          query: query,
        },
      },
    });
    
    if (toolResponse.error) {
      throw new Error(toolResponse.error.message);
    }
    
    return {
      success: true,
      data: toolResponse.result,
      source: 'velt-docs-mcp',
    };
    
  } catch (error) {
    console.error(`   MCP query failed: ${error.message}`);
    throw error;
  }
}

/**
 * Makes MCP protocol request
 */
function makeMCPRequest(url, data) {
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
      timeout: 8000,
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

