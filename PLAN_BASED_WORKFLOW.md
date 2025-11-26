**# Plan-Based Velt Installation Workflow v4.0

**Date:** November 25, 2024
**Version:** 4.0
**Status:** ✅ Complete - Hybrid AI Implementation

---

## 🎯 Overview

The Velt MCP Installer now follows a **hybrid approach**:
1. **MCP orchestrates** setup (CLI, scanning, docs fetching)
2. **MCP generates** a detailed implementation plan
3. **AI executes** the plan to complete the installation

This matches the flowchart provided by the user!

---

## 🔄 Complete Workflow (Matches Flowchart)

```
1. Client adds Velt Docs MCP + Velt Installation MCP to IDE
   ↓
2. Client restarts IDE
   ↓
3. Client goes to project root directory
   ↓
4. Client tells AI "Install Velt"
   ↓
5. AI prompts user for:
   - Directory confirmation
   - Features wanted (Freestyle/Popover)
   - API Key + Auth Token
   - Header position
   - Dev server status
   ↓
6. AI calls install_velt_interactive tool
   ↓
7. Tool runs Velt CLI to install base files
   ↓
8. Tool scans codebase + detects libraries
   ↓
9. Tool queries Velt Docs MCP for implementation
   (Falls back to docs.velt.dev URLs if MCP fails)
   ↓
10. Tool generates IMPLEMENTATION PLAN
   ↓
11. Tool returns plan to AI
   ↓
12. AI reads plan and executes it step-by-step
   ↓
13. Installation complete!
```

---

## 📋 What the MCP Does (Steps 1-6)

### Step 1: Prepare Configuration
- Validates API key and auth token
- Prepares installation config

### Step 2: Check Dev Server
- Scans common ports (3000, 3001, 3002, 4000, 5000)
- Detects if dev server is running

### Step 3: Take Screenshot (Optional)
- Captures screenshot if dev server is running
- Continues even if screenshot fails

### Step 4: Run Velt CLI
- Executes `add-velt` CLI package
- Creates base files:
  - `app/page.tsx`
  - `app/layout.tsx`
  - `app/userAuth/`
  - `components/velt/`
  - `app/api/velt/token/`

### Step 5: Scan Codebase
- Detects installed libraries (ReactFlow, Tiptap, etc.)
- Analyzes project structure
- Finds best files for comment placement
- Ranks candidates by confidence score

### Step 6: Fetch Implementation Details
- **First:** Tries to query Velt Docs MCP
- **Fallback:** Fetches from docs.velt.dev directly
- **Last Resort:** Uses hardcoded templates
- Gathers code examples and setup instructions

---

## 📝 What the Plan Includes

The generated plan follows this format (like Cursor's plan mode):

```markdown
# Plan for Velt Freestyle Comments Installation

## 1. Add VeltComments component to your app root
*   **Details:** Import and add the Freestyle VeltComments component...

```tsx
<VeltProvider apiKey="YOUR_VELT_API_KEY">
  <VeltComments />
</VeltProvider>
```

## 2. Add Comment Tool to enable commenting
*   **Details:** Add VeltCommentTool where you want...

```tsx
<div className="toolbar">
  <VeltCommentTool />
</div>
```

## 3. Integrate comments into detected components
*   **Details:** Based on codebase scan, update: `app/page.tsx`, `components/Header.tsx`...

## 4. Position the comments sidebar header
*   **Details:** Apply top-right positioning...

```tsx
<VeltCommentsSidebar
  style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}
/>
```

## 5. Replace API key placeholders
*   **Details:** Update all "YOUR_VELT_API_KEY" with: velt_api...

## 6. Test the comment functionality
*   **Details:** Start dev server and test...

## To-Do List
- [✓] Add VeltComments component
- [ ] Add Comment Tool
- [ ] Integrate into detected components
- [ ] Position sidebar header
- [ ] Replace API key placeholders
- [ ] Test functionality
```

---

## 🤖 What the AI Does (Steps 7-13)

After receiving the plan, the AI:

1. **Reads the plan** - Understands all steps and requirements
2. **Follows the checklist** - Executes steps sequentially
3. **Modifies files** - Updates detected files with Velt components
4. **Replaces placeholders** - Uses actual API keys provided by user
5. **Applies positioning** - Configures sidebar position
6. **Tests (optional)** - Can verify the installation

---

## 🔑 Velt Docs Integration

### Primary: Velt Docs MCP
- Queries the Velt Docs MCP server (if available)
- Gets real-time documentation
- Most accurate and up-to-date

### Fallback: Direct URL Fetch
- Fetches from `https://docs.velt.dev/async-collaboration/comments/setup/[TYPE]`
- Parses HTML documentation
- Extracts code examples and instructions

### URLs Available:
- **Freestyle:** https://docs.velt.dev/async-collaboration/comments/setup/freestyle
- **Popover:** https://docs.velt.dev/async-collaboration/comments/setup/popover
- **Page:** https://docs.velt.dev/async-collaboration/comments/setup/page
- **Stream:** https://docs.velt.dev/async-collaboration/comments/setup/stream
- **Text:** https://docs.velt.dev/async-collaboration/comments/setup/text

### Last Resort: Hardcoded Templates
- Uses built-in templates if all else fails
- Based on known best practices
- Still functional but may be outdated

---

## 📁 Files Created

### New Utilities:
1. **src/utils/velt-docs-urls.js**
   - Mapping of all Velt Docs URLs
   - Functions to get URLs by feature type

2. **src/utils/plan-formatter.js**
   - Formats plans in Cursor-style markdown
   - Creates step-by-step checklists
   - Includes code examples

3. **src/utils/velt-docs-fetcher.js**
   - Queries Velt Docs MCP
   - Falls back to URL fetching
   - Returns structured implementation details

4. **src/tools/plan-based-installer.js**
   - New installation orchestrator
   - Runs steps 1-6
   - Generates and returns plan

### Modified Files:
- **src/index.js**
  - Updated to use plan-based installer
  - Returns plan as text for AI to execute
  - Updated tool description

---

## 🎨 Example Session

**User:** "Install Velt on my project"

**AI:** "I'll help! Let me ask some questions:

1. Is this the correct directory: /Users/yoenzhang/Downloads/blog?"

**User:** "Yes"

**AI:** "2. What features? Freestyle or Popover comments?"

**User:** "Freestyle"

**AI:** "3. Your Velt API Key from https://console.velt.dev?"

**User:** "[provides key]"

**AI:** "4. Your Velt Auth Token?"

**User:** "[provides token]"

**AI:** "5. Where should the sidebar header be?"

**User:** "top-right"

**AI:** "6. Is your dev server running?"

**User:** "Yes"

**AI calls tool:**
```
install_velt_interactive({
  projectPath: "/Users/yoenzhang/Downloads/blog",
  apiKey: "velt_api...",
  authToken: "auth...",
  commentType: "freestyle",
  headerPosition: "top-right"
})
```

**Tool executes steps 1-6:**
```
📋 Step 1/6: Preparing configuration...
✅ Step 1/6: Configuration prepared

🔄 Step 2/6: Checking dev server...
✅ Step 2/6: Dev server detected at http://localhost:3000

📸 Step 3/6: Taking screenshot...
✅ Step 3/6: Screenshot captured

⚙️  Step 4/6: Running Velt CLI...
✅ Step 4/6: Velt CLI completed

🔍 Step 5/6: Scanning codebase...
   📚 Detected libraries: ReactFlow
   📄 Found 3 potential files
✅ Step 5/6: Codebase scanned

📚 Step 6/6: Fetching implementation from Velt Docs...
   ✅ Got implementation from: docs-url
✅ Step 6/6: Implementation details fetched

📋 Generating implementation plan...
✅ Plan generated!
```

**Tool returns plan:**
```
# Plan for Velt Freestyle Comments Installation

## 1. Add VeltComments component to your app root
*   **Details:** Import and add the Freestyle VeltComments...

[Full plan with 6 steps and code examples]

## To-Do List
- [✓] Add VeltComments component
- [ ] Add Comment Tool
- [ ] Integrate into detected components
...
```

**AI reads plan and executes:**
```
AI: "Great! I'll now implement the plan step-by-step.

Step 1: Adding VeltComments to app/page.tsx..."

[AI modifies files according to plan]

"Step 2: Adding VeltCommentTool to toolbar..."

[AI continues through all steps]

"✅ All steps complete! Velt Freestyle comments are now installed."
```

---

## ✅ Benefits of This Approach

### For Users:
- ✅ **Transparent** - See exactly what will be done
- ✅ **Flexible** - AI can adapt to unique codebases
- ✅ **Educational** - Understand what's being installed
- ✅ **Safe** - Review plan before execution

### For AI:
- ✅ **Clear instructions** - Detailed step-by-step guide
- ✅ **Code examples** - Exact code to use
- ✅ **Context** - Knows which files to modify
- ✅ **Checkpoints** - Can track progress

### For Developers:
- ✅ **Maintainable** - Easy to update plan templates
- ✅ **Extensible** - Add new features easily
- ✅ **Debuggable** - See where things fail
- ✅ **Testable** - Verify plan generation separately

---

## 🚀 Testing

### 1. Install Dependencies
```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
npm install
npx playwright install chromium
```

### 2. Restart Cursor/Claude Code

### 3. Test Installation
```
User: "Install Velt on my project"
```

### 4. Verify Plan Generation
The tool should:
- ✅ Ask 6 questions
- ✅ Run CLI
- ✅ Scan codebase
- ✅ Fetch from docs (or fallback)
- ✅ Generate formatted plan
- ✅ Return plan to AI

### 5. Verify AI Execution
The AI should:
- ✅ Read the plan
- ✅ Follow steps sequentially
- ✅ Modify files with code from plan
- ✅ Replace placeholders with actual keys
- ✅ Complete all checklist items

---

## 📊 Comparison to Previous Versions

| Aspect | v2.x | v3.0 | v4.0 (Current) |
|--------|------|------|----------------|
| **Prompts** | No | 6 prompts | 6 prompts |
| **API Keys** | .env | User input | User input |
| **CLI** | Runs | Runs | Runs |
| **Scanning** | Basic | Basic | Thorough |
| **Docs Query** | Fallback | Fallback | MCP + Fallback |
| **Implementation** | Automatic | Automatic | AI-guided |
| **Output** | JSON report | JSON report | Markdown plan |
| **AI Role** | Trigger only | Trigger only | Executor |
| **Flexibility** | Low | Low | High |
| **Transparency** | Low | Medium | High |

---

## 📚 Documentation Files

- **PLAN_BASED_WORKFLOW.md** - This file
- **UPDATED_WORKFLOW_v3.md** - Previous version (v3.0)
- **ENHANCED_INTERACTIVE_GUIDE.md** - Original interactive guide
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

---

## 🎉 Summary

The Velt MCP Installer now implements a **hybrid workflow** that:

1. ✅ **Orchestrates** setup and preparation (MCP)
2. ✅ **Queries** Velt Docs with fallback (MCP)
3. ✅ **Generates** detailed implementation plan (MCP)
4. ✅ **Executes** plan to complete installation (AI)

This matches the flowchart exactly and provides the best of both worlds:
- **MCP handles** deterministic tasks (CLI, scanning, docs)
- **AI handles** adaptive tasks (code integration, file modification)

**Ready to test!** 🚀

---

**Sources:**
- [Velt Freestyle Comments](https://docs.velt.dev/async-collaboration/comments/setup/freestyle)
- [Velt Popover Comments](https://docs.velt.dev/async-collaboration/comments/setup/popover)
- [Velt Page Mode](https://docs.velt.dev/async-collaboration/comments/setup/page)
- [Velt Stream Mode](https://docs.velt.dev/async-collaboration/comments/setup/stream)
- [Velt Text Comments](https://docs.velt.dev/async-collaboration/comments/setup/text)
- [Velt Comments Overview](https://docs.velt.dev/async-collaboration/comments/overview)

