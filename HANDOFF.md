# Velt MCP Installer - Project Handoff

**Project:** Velt MCP Installer
**Status:** 🚧 In Progress - Core features complete, refinements pending
**Last Updated:** November 27, 2024
**Repository:** velt-mcp-installer

---

## 📋 Executive Summary

The Velt MCP Installer is an **MCP (Model Context Protocol) server** that provides an AI-powered installation tool for Velt collaboration features in Next.js applications. The installer generates detailed implementation plans that AI assistants (like Claude, Cursor) can execute autonomously.

**Key Achievement:** Built a plan-based installer that:
- Fetches implementation details from Velt's markdown documentation URLs
- Supports all comment types (freestyle, popover, page, text, inline, tiptap, lexical, slate)
- Supports multiple features (comments, presence, cursors, notifications, recorder)
- Generates executable plans for AI to implement
- Uses markdown URLs as primary source, Velt Docs MCP as fallback

---

## ✅ Completed Tasks

### 1. Clean up CLI for public repo - only install velt folder
**Status:** ✅ **COMPLETE**

The installer now properly uses the Velt CLI to install only the necessary base files (authentication, user setup, document setup) without installing unnecessary component files.

**Files:**
- `src/utils/cli.js` - Velt CLI wrapper
- `src/tools/plan-based-installer.js` - Uses CLI correctly

---

### 2. Create a sample apps CLI + repo
**Status:** ✅ **COMPLETE**

Sample applications repository created for testing the installer with various Next.js configurations.

---

### 3. Test with all prioritized comment types
**Status:** ✅ **COMPLETE**

All comment types have been added to the installer:

#### ✅ Standard Comment Types:
- **Freestyle** - Click anywhere to add comments
- **Popover** - Attach comments to specific elements
- **Page** - Page-level comments in sidebar
- **Text** - Select text to comment
- **Inline** - Inline comments within content

#### ✅ Purpose-Built Library Integrations:
- **Tiptap** - Tiptap editor integration
- **Lexical** - Lexical editor integration
- **Slate** - Slate.js editor integration

**Files:**
- `src/index.js:202` - Comment type enum
- `src/utils/velt-docs-urls.js` - Markdown URLs for all types
- `src/utils/plan-formatter.js:247-260` - Test instructions for all types

**Documentation URLs:**
- Tiptap: `https://docs.velt.dev/async-collaboration/comments/setup/tiptap.md`
- Lexical: `https://docs.velt.dev/async-collaboration/comments/setup/lexical.md`
- Slate: `https://docs.velt.dev/async-collaboration/comments/setup/slatejs.md`

---

### 4. Notifications Support
**Status:** ✅ **COMPLETE**

Notifications feature is now fully supported in the multi-feature plan generator.

**Features:**
- Notification URLs configured in `velt-docs-urls.js`
- Multi-feature plan includes notifications when requested
- Test instructions added

**Files:**
- `src/utils/velt-docs-urls.js:39-42` - Notifications URLs
- `src/utils/plan-formatter.js:284-285, 305, 343` - Notifications in plan generator

---

## 🚧 Pending Tasks

### 5. Add a step to ask user where to install VeltProvider
**Status:** ⏸️ **PENDING**

**What's Needed:**
- Add a question during the interactive workflow: "Where would you like to install VeltProvider?"
- Options should include:
  - Root layout (`app/layout.tsx`)
  - Custom layout file
  - Let AI decide based on project structure
- Update plan generator to use the user's choice

**Files to Modify:**
- `src/index.js` - Add new step in workflow (between STEP 2 and STEP 3)
- `src/tools/plan-based-installer.js` - Pass user's choice to plan generator
- `src/utils/plan-formatter.js` - Use specified location in plan

**Example Implementation:**
```javascript
// In src/index.js, add after STEP 2:
'\n\nSTEP 2.5 - VELTPROVIDER LOCATION:' +
'  Ask user: "Where should VeltProvider be installed?" ' +
'  Options: ' +
'    - Root layout (app/layout.tsx) - RECOMMENDED ' +
'    - Custom location (user specifies path) ' +
'    - Auto-detect (let AI analyze and decide) '
```

---

### 6. Host the installer MCP
**Status:** ⏸️ **PENDING**

**What's Needed:**
- Deploy MCP server to a hosting service
- Configure for public access
- Update documentation with hosted server URL
- Test with Claude Desktop and Cursor

**Hosting Options:**
- **Railway** - Simple deployment for Node.js apps
- **Render** - Free tier available
- **Vercel** - Could work with custom setup
- **Glitch** - Quick prototyping
- **AWS Lambda** - More complex but scalable

**Configuration Example:**
```json
// In Claude Desktop or Cursor MCP settings:
{
  "mcpServers": {
    "velt-installer": {
      "url": "https://your-hosted-mcp-server.com/mcp"
    }
  }
}
```

---

### 7. Add TODOs for authprovider, get document hook, get user hook, jwt token generator
**Status:** ⏸️ **PENDING**

**What's Needed:**
Add TODO comments in the generated plan to guide users on implementing custom authentication logic:

1. **Auth Provider** - Where to add custom authentication
2. **Get Document Hook** - How to implement document context
3. **Get User Hook** - How to implement user identification
4. **JWT Token Generator** - How to generate tokens securely

**Files to Modify:**
- `src/utils/plan-formatter.js` - Add TODO items in plan steps

**Example:**
```javascript
// Add to plan generation:
steps.push({
  title: `⚠️ TODO: Implement Custom Authentication`,
  details: `The CLI has generated template files for authentication. You need to:

  1. **Auth Provider TODO** - Update the auth provider with your authentication logic
     - File: app/api/velt/token/route.ts
     - Replace placeholder logic with your auth system

  2. **Get User Hook TODO** - Implement user identification
     - File: app/userAuth/useAppUser.tsx
     - Connect to your user management system

  3. **Get Document Hook TODO** - Implement document context
     - File: app/document/useCurrentDocument.tsx
     - Define how documents are identified in your app

  4. **JWT Token Generator TODO** - Secure token generation
     - File: app/api/velt/token/route.ts
     - Use your secret key, NOT the example one`,
});
```

---

### 8. Comment out JWT token part in auth provider
**Status:** ⏸️ **PENDING**

**What's Needed:**
The generated plan should instruct the AI to comment out the JWT token generation code in the auth provider, with a TODO explaining why and what to do.

**Reasoning:**
- JWT token generation requires secure secret keys
- Should not use example/placeholder secrets
- Users should implement their own token generation

**Files to Modify:**
- `src/utils/plan-formatter.js` - Add instruction to comment out JWT code

**Example:**
```javascript
steps.push({
  title: `Comment out JWT token generation (SECURITY)`,
  details: `In the file app/api/velt/token/route.ts, comment out the JWT token generation code:

  \`\`\`typescript
  // TODO: Implement your own JWT token generation
  // DO NOT use the example secret key in production
  // const token = jwt.sign({ userId, organizationId }, 'YOUR_SECRET_KEY');

  // For now, we'll use Velt's token generation endpoint
  const response = await fetch('https://api.velt.dev/v2/auth/token/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-velt-api-key': VELT_API_KEY,
      'x-velt-auth-token': VELT_AUTH_TOKEN,
    },
    body: JSON.stringify({ data: { userId, userProperties: { organizationId } } }),
  });
  \`\`\`

  This is commented out for security. Implement your own secure token generation before going to production.`,
});
```

---

## 🏗️ Architecture Overview

### Current Architecture

```
velt-mcp-installer/
├── bin/
│   └── mcp-server.js                  # MCP server entry point
├── src/
│   ├── index.js                       # MCP server setup & tool definitions
│   ├── tools/
│   │   ├── interactive-installer.js   # Interactive workflow (legacy)
│   │   ├── orchestrator.js            # Simple orchestrator (legacy)
│   │   └── plan-based-installer.js    # ✅ Main installer (plan-based)
│   └── utils/
│       ├── cli.js                     # Velt CLI wrapper
│       ├── comment-detector.js         # File detection for comments
│       ├── plan-formatter.js          # ✅ Plan generation (single/multi-feature)
│       ├── screenshot.js               # Screenshot utility
│       ├── velt-docs-fetcher.js       # ✅ Fetches from markdown URLs
│       ├── velt-docs-urls.js          # ✅ All Velt documentation URLs
│       ├── velt-mcp-client.js         # Velt Docs MCP fallback
│       └── velt-mcp.js                # Library detection
└── package.json
```

### Key Components

#### 1. MCP Server (`src/index.js`)
- Exposes `install_velt_interactive` tool
- Handles MCP protocol
- Defines workflow and instructions for AI

#### 2. Plan-Based Installer (`src/tools/plan-based-installer.js`)
- Orchestrates installation workflow
- Runs Velt CLI
- Fetches implementation details
- Generates executable plan

#### 3. Plan Formatter (`src/utils/plan-formatter.js`)
- `createVeltCommentsPlan()` - Single feature (comments only)
- `createMultiFeaturePlan()` - Multiple features (comments + presence + cursors + etc.)
- Generates markdown plans with step-by-step instructions

#### 4. Velt Docs Fetcher (`src/utils/velt-docs-fetcher.js`)
- **Primary:** Fetches from markdown URLs in `velt-docs-urls.js`
- **Fallback:** Uses Velt Docs MCP if markdown fetch fails
- Returns implementation details with URLs

#### 5. Velt Docs URLs (`src/utils/velt-docs-urls.js`)
- Central repository of all Velt documentation URLs
- Supports all comment types and features
- Helper functions: `getDocUrl()`, `getDocMarkdownUrl()`

---

## 🔑 Key Technical Decisions

### 1. Markdown URLs as Primary Source ✅

**Decision:** Fetch implementation details from markdown URLs first, use Velt Docs MCP as fallback only.

**Reasoning:**
- Direct markdown URLs are fast and reliable
- No dependency on MCP server availability
- Explicit URLs in generated plans
- MCP available for troubleshooting/customization

**Implementation:**
- `src/utils/velt-docs-fetcher.js:32` - Fetches markdown first
- `src/utils/velt-docs-fetcher.js:40` - Falls back to MCP only if markdown fails

---

### 2. Plan-Based Approach ✅

**Decision:** Generate a detailed plan for AI to execute, rather than executing directly.

**Reasoning:**
- AI can review plan with user before execution
- User has visibility into what will be implemented
- Easier to debug and customize
- Follows Cursor/Claude workflow patterns

**Implementation:**
- `src/tools/plan-based-installer.js` - Generates plan, doesn't execute
- `src/utils/plan-formatter.js` - Creates structured markdown plans
- Plan includes: steps, code examples, URLs, warnings

---

### 3. Multi-Feature Support ✅

**Decision:** Support installing multiple features (comments + presence + cursors + etc.) in one installation.

**Reasoning:**
- Users often want multiple features
- Single installation flow is more efficient
- Plan explicitly states which features to implement

**Implementation:**
- `src/utils/plan-formatter.js:270` - `createMultiFeaturePlan()`
- Checks `features` array to determine what to install
- Generates plan with only requested features

---

### 4. All Comment Types Supported ✅

**Decision:** Support all 8 comment types including purpose-built library integrations.

**Reasoning:**
- Users have different needs (rich text editors, specific UI patterns)
- Purpose-built integrations (Tiptap, Lexical, Slate) are common use cases
- Complete feature coverage

**Implementation:**
- `src/index.js:202` - Enum includes all types
- `src/utils/velt-docs-urls.js:19-27` - URLs for all types
- `src/utils/plan-formatter.js:247-260` - Test instructions for all types

---

## 📊 Current State

### What's Working ✅

1. **MCP Server**
   - ✅ Starts correctly
   - ✅ Responds to tool calls
   - ✅ Handles all comment types
   - ✅ Supports multi-feature installation

2. **Plan Generation**
   - ✅ Generates detailed implementation plans
   - ✅ Includes markdown URLs
   - ✅ Shows explicit steps
   - ✅ Warns about what NOT to implement

3. **Documentation URLs**
   - ✅ All comment types have URLs
   - ✅ All features have URLs
   - ✅ Markdown URLs work reliably
   - ✅ MCP fallback available

4. **Feature Support**
   - ✅ Comments (all 8 types)
   - ✅ Presence
   - ✅ Cursors
   - ✅ Notifications
   - ✅ Recorder

### What's Pending ⏸️

1. **VeltProvider Location Choice** - User can't choose where to install
2. **Hosting** - MCP server not publicly hosted
3. **TODO Comments** - Missing guidance for auth/user/document hooks
4. **JWT Security** - Token generation not commented out with explanation

---

## 🧪 Testing

### How to Test

1. **Setup:**
   ```bash
   cd velt-mcp-installer
   npm install
   ```

2. **Configure in Cursor/Claude Desktop:**
   Add to MCP settings:
   ```json
   {
     "mcpServers": {
       "velt-installer": {
         "command": "node",
         "args": ["/path/to/velt-mcp-installer/bin/mcp-server.js"]
       }
     }
   }
   ```

3. **Test in AI Assistant:**
   - Say: "Install Velt"
   - Answer questions about features, API keys, etc.
   - Review generated plan
   - Confirm to execute

### Test Scenarios

#### Test 1: Inline Comments + Presence + Cursors
**Input:** User requests "inline comments, presence, and cursors"
**Expected:** Plan generates with:
- Inline comments URL: `https://docs.velt.dev/async-collaboration/comments/setup/inline-comments.md`
- Presence URL: `https://docs.velt.dev/realtime-collaboration/presence/setup.md`
- Cursors URL: `https://docs.velt.dev/realtime-collaboration/cursors/setup.md`
- Warning: "Only implement Inline Comments, Presence, Cursors"

#### Test 2: Tiptap Integration
**Input:** User requests "tiptap comments"
**Expected:** Plan generates with:
- Tiptap URL: `https://docs.velt.dev/async-collaboration/comments/setup/tiptap.md`
- Test instructions: "Open your Tiptap editor, select text, and add comments"

#### Test 3: All Features
**Input:** User requests "all features"
**Expected:** Plan generates with:
- Comments, Presence, Cursors, Notifications, Recorder
- All corresponding URLs
- Test instructions for each

---

## 📝 Recent Changes (November 27, 2024)

### Commit: 4c58bdd - Fix installer to use markdown URLs and support all comment types
**Changes:**
- ✅ Fixed markdown URL priority (primary source)
- ✅ Added all comment types to enum (inline, page, text)
- ✅ Created `createMultiFeaturePlan()` for multi-feature support
- ✅ Fixed plan generation to pass full implementation object

### Commit: e74af53 - Add support for purpose-built library comment types
**Changes:**
- ✅ Added Tiptap, Lexical, Slate to comment type enum
- ✅ Updated prompt to show purpose-built library options
- ✅ Added test instructions for editor integrations

---

## 🚀 Next Steps for Implementation

### Immediate Priority (Complete Pending Tasks)

1. **Add VeltProvider Location Choice**
   - Modify `src/index.js` workflow
   - Add STEP 2.5 for location selection
   - Update plan generator to use specified location

2. **Add TODO Comments for Auth/Hooks**
   - Modify `src/utils/plan-formatter.js`
   - Add step explaining TODOs for auth provider, user hook, document hook
   - Include JWT token generation warning

3. **Comment Out JWT Token Code**
   - Add instruction in plan to comment out JWT generation
   - Explain security reasoning
   - Point to Velt's token generation endpoint as alternative

4. **Host the MCP Server**
   - Choose hosting platform (Railway recommended)
   - Deploy and test
   - Update documentation with hosted URL

### Short Term (Enhancements)

5. **Improve Error Handling**
   - Better error messages for common issues
   - Suggestions for fixes

6. **Add Validation Step**
   - Check browser console for Velt errors
   - Suggest fixes based on common errors

7. **Library Detection**
   - Auto-detect Tiptap/Lexical/Slate in project
   - Suggest appropriate comment type

### Long Term (Production)

8. **Rollback Mechanism**
   - Undo failed installations
   - Restore previous state

9. **CI/CD Pipeline**
   - Automated testing
   - Version management

10. **npm Package**
    - Publish as npm package
    - Easier installation

---

## 📚 Documentation Reference

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/index.js` | MCP server & tool definitions | ✅ Complete |
| `src/tools/plan-based-installer.js` | Main installer | ✅ Complete |
| `src/utils/plan-formatter.js` | Plan generation | ✅ Complete |
| `src/utils/velt-docs-fetcher.js` | Fetch from markdown URLs | ✅ Complete |
| `src/utils/velt-docs-urls.js` | All documentation URLs | ✅ Complete |
| `src/utils/cli.js` | Velt CLI wrapper | ✅ Complete |

### External Documentation

- **Velt Documentation:** https://docs.velt.dev
- **MCP Protocol:** https://modelcontextprotocol.io
- **Claude Code:** https://claude.com/claude-code

---

## 🔍 Troubleshooting

### Issue: Plan generates wrong comment type
**Solution:** Check that user's request matches enum values in `src/index.js:202`

### Issue: Markdown URL fetch fails
**Solution:** Check `src/utils/velt-docs-urls.js` for correct URLs. MCP fallback will activate automatically.

### Issue: AI installs extra components
**Solution:** Check plan has warning: "Only implement [requested features]"

### Issue: VeltProvider installed in wrong file
**Solution:** Implement STEP 2.5 (VeltProvider location choice) - currently pending

---

## 🤝 Handoff Checklist

- [x] Code is documented
- [x] Architecture explained
- [x] Completed tasks listed
- [x] Pending tasks detailed
- [x] Testing instructions provided
- [x] Recent changes documented
- [x] Next steps outlined
- [x] Troubleshooting guide included

---

## 💡 Key Insights

1. **Markdown URLs Work Best:** Direct fetching is faster and more reliable than MCP queries
2. **Plan-Based Approach is Effective:** Giving AI a detailed plan works better than autonomous execution
3. **Multi-Feature Support is Essential:** Users commonly want multiple features at once
4. **Purpose-Built Libraries Matter:** Tiptap, Lexical, Slate integrations are important use cases
5. **Security Matters:** JWT tokens and auth require explicit TODO guidance

---

**Status:** 🚧 Core features complete, 4 refinement tasks pending

**Next Developer:** Focus on pending tasks 5-8 to complete the installer

Good luck! 🚀
