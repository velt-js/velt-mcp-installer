#!/usr/bin/env node

/**
 * Velt MCP Installer Server Entry Point
 * 
 * This MCP server provides tools for installing Velt with freestyle comments
 * in Next.js projects using an orchestrator pattern.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
createServer().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

