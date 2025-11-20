# Changelog

## [0.2.0] - 2024-11-20

### Added
- ✅ **MCP Prompts Protocol**: Server now declares prompts for configuration collection
- ✅ **Velt Docs MCP Connection**: Queries https://docs.velt.dev/mcp for real documentation patterns
- ✅ **Fallback Patterns**: Uses hardcoded patterns if Velt Docs MCP is unavailable
- ✅ **Node.js Compatibility**: Works with Node 16+ using https module fallback

### Changed
- Configuration collection now supports MCP prompts (with env var fallback)
- Velt MCP query attempts real HTTP connection before falling back

### Technical Details

**MCP Prompts:**
- Server declares `velt_configuration` prompt
- IDE handles prompt display
- Falls back to environment variables if prompt not available

**Velt Docs MCP:**
- Attempts HTTP POST to `https://docs.velt.dev/mcp`
- Uses proper MCP protocol headers (`Accept: application/json, text/event-stream`)
- Extracts code patterns from documentation response
- Falls back to hardcoded patterns if connection fails

## [0.1.0] - 2024-11-20

### Added
- Initial POC release
- Single orchestrator tool (`install_velt_freestyle`)
- 5-step sequential workflow
- Basic validation (5 checks)
- Environment variable configuration

