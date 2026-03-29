#!/usr/bin/env node
/**
 * Entry point: stdio MCP only. stdout is reserved for MCP JSON-RPC.
 * @see https://modelcontextprotocol.io
 */

/* eslint-disable no-console */
console.log = (...args) => console.error('[demo-maker-mcp]', ...args);
console.info = (...args) => console.error('[demo-maker-mcp]', ...args);
/* eslint-enable no-console */

const { start } = require('./server.js');

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
