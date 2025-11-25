# Enhanced Interactive Velt Installation Guide

**Date:** November 25, 2024
**Version:** 0.2.1
**Status:** ✨ New - Enhanced Interactive Workflow

---

## 🎯 Overview

The Velt MCP Installer now features a **fully interactive, guided installation workflow** that:
- Prompts users for their preferences step-by-step
- Takes screenshots automatically
- Positions the comments sidebar header exactly where users want
- Detects the best files for comment placement
- Supports both Freestyle and Popover comment types

---

## 🌟 New Interactive Installation Tool

### Tool: `install_velt_interactive`

This is now the **RECOMMENDED** way to install Velt. It provides the best user experience.

---

## 🔄 Complete Workflow

### Step-by-Step Process

```
1. User: "Install Velt on my project"
   ↓
2. AI: "Which directory is your project in?"
   User: "/Users/yoenzhang/Downloads/blog"
   ↓
3. AI: "What type of comments would you like?"
   Options: Freestyle (click anywhere) or Popover (attached to elements)
   User: "Freestyle"
   ↓
4. AI: "Where should the comments sidebar header be positioned?"
   Options: top-left, top-right, bottom-left, bottom-right
   User: "top-right"
   ↓
5. AI: "Make sure your dev server is running (pnpm run dev). Is it running?"
   User: "Yes"
   ↓
6. AI calls: install_velt_interactive
   ↓
7. Tool automatically:
   - ✅ Collects configuration (API key from .env)
   - ✅ Checks/detects dev server
   - ✅ Takes screenshot
   - ✅ Runs Velt CLI
   - ✅ Detects best files for comments
   - ✅ Integrates components
   - ✅ Applies header positioning
   - ✅ Validates installation
   ↓
8. Done! 🎉
```

---

## 📝 Tool Parameters

### Required Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | string | Path to Next.js project |
| `commentType` | enum | `"freestyle"` or `"popover"` |

### Optional Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headerPosition` | enum | `"top-right"` | Position of comments sidebar |
| `targetArea` | string | `""` | Where to place comments (e.g., "header") |
| `apiKey` | string | (from .env) | Velt API key |
| `authToken` | string | (from .env) | Velt auth token |

### Header Position Options:

- `"top-left"` - Comments sidebar in top-left corner
- `"top-right"` - Comments sidebar in top-right corner (default)
- `"bottom-left"` - Comments sidebar in bottom-left corner
- `"bottom-right"` - Comments sidebar in bottom-right corner

---

## 🎨 Usage Examples

### Example 1: Basic Interactive Installation

**In Cursor/Claude Code:**

```
User: Install Velt on my blog project
```

**AI Agent Response:**

```
I'll help you install Velt! Let me ask a few questions first:

1. What's the path to your blog project?
```

**User:**
```
/Users/yoenzhang/Downloads/blog
```

**AI:**
```
2. What type of comments would you like?
   - Freestyle: Users can click anywhere on the page to add comments
   - Popover: Comments are attached to specific elements
```

**User:**
```
Freestyle
```

**AI:**
```
3. Where should the comments sidebar header be positioned?
   - top-left
   - top-right (recommended)
   - bottom-left
   - bottom-right
```

**User:**
```
top-right
```

**AI:**
```
4. Is your dev server running? (pnpm run dev or npm run dev)
```

**User:**
```
Yes, running on localhost:3000
```

**AI:**
```
Perfect! Installing Velt now...

[Calls install_velt_interactive tool]

✅ Installation completed successfully!

Summary:
- Comment Type: Freestyle
- Header Position: Top-right
- Files Modified: 3
- Components Added: 2
- Validation: 5/5 checks passed

Your Velt installation is complete! The comments sidebar is positioned in the top-right corner.
```

---

### Example 2: Popover Comments with Custom Position

**User:**
```
Add popover comments to my dashboard, and put the sidebar in the bottom-right
```

**AI:**
```
[Asks for project path confirmation]

Installing Velt with popover comments...

Comment Type: Popover
Header Position: Bottom-right
Target Area: dashboard

[Calls install_velt_interactive]

✅ Done! Popover comments installed on dashboard components.
Comments sidebar is in the bottom-right corner.
```

---

## 🏗️ What the Tool Does Automatically

### 1. Configuration Collection (Step 1/7)
- Reads `VELT_API_KEY` from `.env.local` or `.env`
- Validates project directory
- Prepares installation config

### 2. Dev Server Check (Step 2/7)
- Checks ports 3000, 3001, 3002, 4000, 5000
- Detects if server is running
- Provides instructions if not running

### 3. Screenshot Capture (Step 3/7)
- Takes screenshot of running app (if server detected)
- Captures at 1920x1080 resolution
- Stores for future reference
- *Note: Installation continues even if screenshot fails*

### 4. Velt CLI Execution (Step 4/7)
- Runs `add-velt` CLI to install base components
- Creates:
  - `app/userAuth/` - Authentication components
  - `app/document/` - Document context
  - `components/velt/` - Velt components
  - `app/api/velt/token/` - JWT token route
- Continues even if npm install has conflicts

### 5. Placement Detection (Step 5/7)
- Queries Velt Docs MCP for implementation patterns
- Detects libraries (ReactFlow, Tiptap, etc.)
- Finds best files based on comment type and target area
- Ranks candidates by confidence score

### 6. Component Integration (Step 6/7)
- Replaces API key placeholders
- Replaces auth token placeholders (if provided)
- Wires library-specific integrations
- **Applies header positioning to VeltCommentsSidebar**
- **Adds comment-type specific integration points**

### 7. Validation (Step 7/7)
- Checks for required files
- Validates component structure
- Verifies placeholders replaced
- Reports success/warnings

---

## 📍 Header Positioning Details

### How It Works

The tool automatically finds all files containing `VeltCommentsSidebar` and applies inline styles:

**Top-Right (default):**
```jsx
<VeltCommentsSidebar
  style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999
  }}
/>
```

**Top-Left:**
```jsx
<VeltCommentsSidebar
  style={{
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 9999
  }}
/>
```

**Bottom-Right:**
```jsx
<VeltCommentsSidebar
  style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999
  }}
/>
```

**Bottom-Left:**
```jsx
<VeltCommentsSidebar
  style={{
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    zIndex: 9999
  }}
/>
```

---

## 💬 Comment Type Integration

### Freestyle Comments

**Best For:**
- General page commenting
- Document reviews
- Content feedback

**What Gets Added:**
- `<VeltComments />` component
- Allows clicking anywhere to add comments
- No additional configuration needed

**Recommended Files:**
- `app/page.tsx` - Main page
- `app/document/page.tsx` - Document pages
- Layout components

### Popover Comments

**Best For:**
- Specific element feedback
- Card/item comments
- Interactive components

**What Gets Added:**
- `data-velt-comment-target` attributes
- `<VeltCommentTool />` components
- Element-specific comment triggers

**Recommended Files:**
- Component files (Card.tsx, Item.tsx)
- Interactive elements
- List/grid items

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
npm install
npx playwright install chromium
```

### 2. Configure MCP in Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "velt-installer": {
      "command": "node",
      "args": ["/Users/yoenzhang/Downloads/velt-mcp-installer/bin/mcp-server.js"]
    }
  }
}
```

### 3. Restart Cursor

```bash
# Completely quit and restart Cursor
Cmd+Q
# Then reopen
```

### 4. Test the Interactive Tool

In Cursor AI chat:

```
Install Velt on my project with interactive prompts
```

---

## 🐛 Troubleshooting

### Integration Step Failed

**Problem:** Integration fails even though CLI succeeded

**Common Causes:**
1. API key not in .env file
2. Files not generated by CLI
3. Wrong project structure

**Solution:**
```bash
# Check API key
cat .env.local
# Should contain: VELT_API_KEY=your_key

# Check files exist
ls app/page.tsx
ls app/layout.tsx
ls components/velt/VeltCollaboration.tsx

# If missing, run CLI manually:
npx add-velt
```

### Header Position Not Applied

**Problem:** Comments sidebar not in specified position

**Cause:** VeltCommentsSidebar not found in files

**Solution:**
Check the CLI output - it should create VeltCommentsSidebar. If missing, the CLI may have failed.

```bash
# Search for VeltCommentsSidebar
grep -r "VeltCommentsSidebar" app/ components/
```

### Screenshot Fails

**Problem:** Screenshot capture fails

**Cause:** Dev server not running

**Solution:**
```bash
cd /path/to/your/project
pnpm run dev  # or npm run dev
```

Then try installation again.

---

## 📊 Installation Report

After successful installation, you'll receive a detailed report:

```json
{
  "status": "success",
  "interactiveMode": true,
  "steps": [
    { "step": 1, "name": "collect_configuration", "status": "complete" },
    { "step": 2, "name": "start_dev_server", "status": "complete" },
    { "step": 3, "name": "take_screenshot", "status": "complete" },
    { "step": 4, "name": "run_velt_cli", "status": "complete" },
    { "step": 5, "name": "detect_placement", "status": "complete" },
    { "step": 6, "name": "integrate_components", "status": "complete" },
    { "step": 7, "name": "validate_installation", "status": "complete" }
  ],
  "summary": "Velt freestyle comments successfully installed",
  "details": {
    "commentType": "freestyle",
    "headerPosition": "top-right",
    "filesModified": ["app/page.tsx", "app/layout.tsx", "app/api/velt/token/route.ts"],
    "recommendedFile": "app/page.tsx"
  }
}
```

---

## 🎓 Best Practices

### For AI Agents

1. **Always ask all questions BEFORE calling the tool**
   - Project path
   - Comment type
   - Header position
   - Dev server status

2. **Use clear options** when asking:
   ```
   ✅ "Freestyle or Popover?"
   ❌ "What kind of comments?"
   ```

3. **Confirm with user** before proceeding:
   ```
   ✅ "I'll install Freestyle comments with header in top-right. Proceed?"
   ❌ [Calls tool immediately]
   ```

4. **Trust the tool** - don't try to do manual steps after calling it

### For Users

1. **Start dev server first**: `pnpm run dev`

2. **Have API key ready**: In `.env.local` or `.env`:
   ```
   VELT_API_KEY=your_key_here
   ```

3. **Choose comment type based on use case**:
   - General feedback → Freestyle
   - Specific element feedback → Popover

4. **Pick header position** based on your layout:
   - Most apps: top-right (default)
   - Left sidebar: top-left or bottom-left
   - Bottom nav: top-right or top-left

---

## 🚀 Next Steps After Installation

1. **Test Comments**:
   ```bash
   pnpm run dev
   # Open localhost:3000
   # Try clicking to add comments (Freestyle)
   # Or click comment buttons (Popover)
   ```

2. **Customize Styling**:
   - Edit `components/velt/ui-customization/styles.css`
   - Adjust sidebar position if needed
   - Customize comment bubble appearance

3. **Configure Features**:
   - See Velt Docs for advanced configuration
   - Enable/disable features
   - Customize user authentication

4. **Deploy**:
   ```bash
   pnpm run build
   vercel deploy
   ```

---

## 📚 Related Documentation

- [INTERACTIVE_WORKFLOW.md](./INTERACTIVE_WORKFLOW.md) - Technical details
- [HANDOFF.md](./HANDOFF.md) - Project handoff docs
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [Velt Freestyle Comments Docs](https://docs.velt.dev/async-collaboration/comments/setup/freestyle)
- [Velt Popover Comments Docs](https://docs.velt.dev/async-collaboration/comments/setup/popover)

---

## ✅ Success Checklist

After running `install_velt_interactive`, verify:

- [ ] 7/7 steps completed successfully
- [ ] VeltCommentsSidebar positioned correctly
- [ ] API key placeholders replaced
- [ ] Comments work when you click (Freestyle) or use comment tool (Popover)
- [ ] Sidebar header in correct position (top-right, etc.)
- [ ] No validation issues reported

---

**Built with ❤️ for seamless Velt installations**

