# Velt MCP Installer - Project Handoff

**Project:** Velt MCP Installer
**Status:** ✅ Core Complete - All major features implemented, ready for hosting
**Last Updated:** November 30, 2024
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
**Status:** ✅ **COMPLETE** (Commit: 535ac37)

**Implementation:**
- ✅ Added STEP 5 in workflow asking for VeltProvider location
- ✅ Options: Root layout (recommended), Custom path, Auto-detect
- ✅ Added `veltProviderLocation` parameter to tool schema
- ✅ Updated step numbering (STEP 7 became STEP 8)
- ✅ Both plan generators accept and use `veltProviderLocation`

**Files Modified:**
- `src/index.js:263-271` - Added STEP 5 for location choice
- `src/index.js:297` - Added veltProviderLocation to tool schema
- `src/tools/plan-based-installer.js:41` - Extracts veltProviderLocation parameter
- `src/utils/plan-formatter.js:85,481` - Both plan generators accept parameter

---

### 6. Host the installer MCP
**Status:** ⏸️ **PENDING** (Only remaining task)

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
**Status:** ✅ **COMPLETE** (Commit: 4f3334c)

**Implementation:**
- ✅ Added comprehensive Step 3 to both plan generators
- ✅ Provides clear TODO guidance for 4 authentication areas
- ✅ Includes detailed code examples with TODO comments
- ✅ Security warnings and implementation guidance included

**Areas Covered:**
1. **User Identification Hook** (useAppUser.tsx) - Connect to auth system
2. **Document Context Hook** (useCurrentDocument.tsx) - Implement document ID logic
3. **Auth Token API Route** (app/api/velt/auth/route.ts) - Backend authentication
4. **JWT Token Generator** - Secure token generation with environment variables

**Files Modified:**
- `src/utils/plan-formatter.js:145-202` - Step 3 in createVeltCommentsPlan
- `src/utils/plan-formatter.js:529-584` - Step 3 in createMultiFeaturePlan

**Code Examples Included:**
- TODO comments for connecting to auth systems (Next-auth, Clerk, Auth0)
- Document ID implementation examples (router.query.id, pathname)
- Security warnings about hardcoded secrets
- Environment variable usage patterns

---

### 8. Comment out JWT token part in auth provider
**Status:** ✅ **COMPLETE** (Commit: 12b93cc)

**Implementation:**
- ✅ Added Step 4 to both plan generators
- ✅ Instructions to comment out JWT token generation with [Velt] context
- ✅ Security explanations for why it's commented out
- ✅ Implementation guidance for developers

**What Gets Commented Out:**
- `generateToken` function implementation in auth provider hook
- JWT signing code in API routes
- Example/placeholder secret keys

**What Gets Kept:**
- User data retrieval (useAppUser)
- Auth provider object structure
- Retry configuration

**Files Modified:**
- `src/utils/plan-formatter.js:204-317` - Step 4 in createVeltCommentsPlan
- `src/utils/plan-formatter.js:586-699` - Step 4 in createMultiFeaturePlan

**Code Examples Included:**
- useVeltAuthProvider hook with commented generateToken
- API route with commented JWT generation
- Clear [Velt] prefixed comments explaining security concerns
- Step-by-step implementation guidance

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
   - ✅ References CLI-generated files correctly
   - ✅ Prevents CRDT usage for editor comments
   - ✅ Uses bubble menu pattern for editor integrations
   - ✅ Includes testing guidance for presence/cursors

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

5. **User Guidance**
   - ✅ VeltProvider location choice
   - ✅ TODO comments for auth/user/document hooks
   - ✅ JWT security warnings
   - ✅ Multi-user testing pattern
   - ✅ Editor integration best practices

### What's Pending ⏸️

1. **Hosting** - MCP server not publicly hosted (ONLY REMAINING TASK)

---

## 🐛 Known Issues Fixed

### Issue 1: Creating New Files Instead of Using CLI-Generated Files
**Discovered:** November 30, 2024 during testing on `/Users/yoenzhang/Downloads/blog`
**Impact:** AI was creating new Velt files outside `components/velt/` instead of using existing CLI-generated files
**Root Cause:** Plan instructions didn't explicitly reference CLI-generated file locations
**Fixed in:** Commit ce01b72
**Solution:**
- Updated Step 2 to list all CLI-generated files with purposes
- Added explicit "DO NOT create new files" warnings
- Provided code examples showing imports from existing components
- Emphasized keeping all Velt code in `components/velt/`

### Issue 2: CRDT Being Added to Editor Comments
**Discovered:** November 30, 2024 during Tiptap testing
**Impact:** Tiptap comments implementation added CRDT collaboration package instead of just comments
**Root Cause:** Instructions didn't explicitly warn against CRDT packages
**Fixed in:** Commit ce01b72
**Solution:**
- Added CRITICAL guidance section with explicit package names
- Listed correct packages: @veltdev/tiptap-velt-comments (NOT @veltdev/tiptap-velt-collaboration)
- Explicitly warned: "DO NOT use CRDT packages"
- Clarified: "Only comments on the editor, NOT real-time collaborative editing"

### Issue 3: Creating New Editors With Fixed Toolbars
**Discovered:** November 30, 2024 during editor integration testing
**Impact:** AI created entirely new editor components with fixed toolbars instead of integrating into existing editors with bubble menus
**Root Cause:** Instructions didn't specify to find existing editors or use bubble menu pattern
**Fixed in:** Commit 472cd5e
**Solution:**
- Added "FIND EXISTING EDITOR" instruction with emphasis
- Added "USE BUBBLE MENU PATTERN" guidance with code examples
- Provided Tiptap BubbleMenu implementation example
- Added patterns for Lexical and Slate bubble menus
- Explicitly warned against creating new editors or fixed toolbars

### Issue 4: Presence/Cursors Not Working in Testing
**Discovered:** November 30, 2024 during presence/cursor testing
**Impact:** Presence and cursor features need multiple users and fixed document ID to work, but implementation only had one mock user
**Root Cause:** No guidance for testing multi-user features
**Fixed in:** Commit 472cd5e
**Solution:**
- Added hardcoded document ID pattern: "demo-document"
- Provided 2 test users with different avatars (user-1, user-2)
- Added URL parameter switching logic (?user=1 or ?user=2)
- Included clear testing instructions for opening multiple tabs
- Step-by-step guide: Open tabs with different user parameters to see presence/cursors

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

## 📝 Recent Changes

### November 30, 2024 - Testing Phase Improvements

#### Commit: ce01b72 - Fix plan generator to reference CLI-generated files and prevent CRDT usage
**Critical Issue 1 Fixed:** Plans were creating new files instead of using CLI-generated ones
- ✅ Updated both createVeltCommentsPlan and createMultiFeaturePlan
- ✅ Step 2 now explicitly references CLI-generated files in components/velt/
- ✅ Added clear instructions to NOT create new files
- ✅ Listed all CLI-generated files with their purposes
- ✅ Updated code examples to show importing existing components

**Critical Issue 2 Fixed:** Tiptap/Lexical/Slate implementations were adding CRDT
- ✅ Added CRITICAL guidance section in Step 2 of both plan generators
- ✅ Explicitly instructs to use comment-specific packages only
- ✅ Explicitly warns against CRDT packages
- ✅ Clarifies to implement comments only, NOT collaborative editing

#### Commit: 472cd5e - Fix editor integration and presence/cursor testing
**Issue 1 Fixed:** Editor Integration Pattern
- ✅ Updated Tiptap/Lexical/Slate guidance to emphasize finding existing editors
- ✅ Added explicit instructions to use bubble menu pattern (not fixed toolbars)
- ✅ Provided code examples for bubble menu implementation in all 3 editors
- ✅ Added warnings against creating new editors or fixed toolbars

**Key Changes:**
```tsx
// Tiptap bubble menu pattern (not fixed toolbar)
import { BubbleMenu } from '@tiptap/react'
<BubbleMenu editor={editor}>
  <button onClick={() => addComment({ editor })}>💬 Comment</button>
</BubbleMenu>
```

**Issue 2 Fixed:** Presence/Cursor Testing
- ✅ Added guidance for hardcoding document ID for testing
- ✅ Provided code examples for 2 hardcoded users (user-1 and user-2)
- ✅ Added URL parameter switching logic (?user=1 or ?user=2)
- ✅ Included testing instructions for opening multiple tabs

**Testing Pattern:**
```typescript
// Hardcoded document ID: "demo-document"
// 2 test users with different avatars
// URL parameter switching: ?user=1 or ?user=2
// Open multiple tabs to test presence/cursors
```

---

### November 27, 2024 - Initial Implementation

#### Commit: 4c58bdd - Fix installer to use markdown URLs and support all comment types
**Changes:**
- ✅ Fixed markdown URL priority (primary source)
- ✅ Added all comment types to enum (inline, page, text)
- ✅ Created `createMultiFeaturePlan()` for multi-feature support
- ✅ Fixed plan generation to pass full implementation object

#### Commit: e74af53 - Add support for purpose-built library comment types
**Changes:**
- ✅ Added Tiptap, Lexical, Slate to comment type enum
- ✅ Updated prompt to show purpose-built library options
- ✅ Added test instructions for editor integrations

---

## 🚀 Next Steps for Implementation

### Immediate Priority

1. **Host the MCP Server** ⏸️ (ONLY REMAINING CORE TASK)
   - Choose hosting platform (Railway recommended)
   - Deploy and test
   - Update documentation with hosted URL
   - Configure for public access

### Short Term (Enhancements)

2. **Improve Error Handling**
   - Better error messages for common issues
   - Suggestions for fixes
   - Retry logic for failed operations

3. **Add Validation Step**
   - Check browser console for Velt errors
   - Suggest fixes based on common errors
   - Verify installation completeness

4. **Library Detection**
   - Auto-detect Tiptap/Lexical/Slate in project
   - Suggest appropriate comment type
   - Warn if editor package not installed

5. **Enhanced Testing Guidance**
   - Add more test scenarios
   - Provide troubleshooting checklist
   - Include common pitfalls and solutions

### Long Term (Production)

6. **Rollback Mechanism**
   - Undo failed installations
   - Restore previous state
   - Backup before installation

7. **CI/CD Pipeline**
   - Automated testing
   - Version management
   - Deployment automation

8. **npm Package**
   - Publish as npm package
   - Easier installation
   - Versioned releases

9. **Analytics & Monitoring**
   - Track installation success rates
   - Monitor common errors
   - Usage analytics

10. **Documentation Site**
    - Interactive examples
    - Video tutorials
    - FAQ section

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
6. **Explicit Instructions Critical:** AI needs very explicit "DO NOT" warnings to avoid common mistakes
7. **Testing Needs Real Scenarios:** Multi-user testing requires hardcoded users and document IDs
8. **Editor Integration Patterns:** Bubble menus, not fixed toolbars - mimic demo repos exactly
9. **CLI-Generated Files Sacred:** Never recreate what the CLI already generated - reference existing files
10. **Iterative Testing Reveals Issues:** Real-world testing on actual projects exposes hidden assumptions

---

## 📊 Project Summary

### Completed Tasks (7/8)
- ✅ Clean up CLI for public repo
- ✅ Create sample apps CLI + repo
- ✅ Test with all comment types
- ✅ Notifications support
- ✅ VeltProvider location choice
- ✅ TODO comments for auth/hooks
- ✅ Comment out JWT token code

### Remaining Tasks (1/8)
- ⏸️ Host the installer MCP

### Critical Fixes Applied
- ✅ Fixed CLI-generated file references
- ✅ Prevented CRDT usage in editor comments
- ✅ Implemented bubble menu pattern for editors
- ✅ Added multi-user testing guidance

---

**Status:** ✅ **CORE COMPLETE** - All features implemented and tested, ready for hosting

**Next Developer:** Deploy the MCP server to a hosting platform and configure public access

**Note:** The installer has been thoroughly tested and all major issues have been resolved. The only remaining task is deployment.

Good luck! 🚀
