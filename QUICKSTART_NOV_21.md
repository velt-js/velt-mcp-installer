# Velt MCP Installer - Quick Start Guide
**Date:** November 21, 2025
**Purpose:** Step-by-step guide to run Velt installation with latest improvements

---

## Table of Contents

1. [What's New](#whats-new)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Configuration Options](#configuration-options)
5. [Understanding the Output](#understanding-the-output)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Usage](#advanced-usage)

---

## What's New

### November 21, 2025 Updates

✅ **Three-Tier Documentation Fallback**
- Tries MCP server first, then URL, then hardcoded patterns
- Always gets working patterns even if services are down

✅ **API Key from .env Files**
- Automatically reads from `.env.local` or `.env` in your project
- No more prompts or environment variable setup needed
- Can also provide API key directly in chat

✅ **Graceful CLI Failure Handling**
- Installation continues even if npm install fails
- Files are still created and integrated correctly

✅ **Comprehensive Logging**
- See exactly what's happening at each step
- Know which documentation source was used
- Track which libraries were detected

✅ **Library Auto-Detection**
- Automatically detects ReactFlow, Tiptap, CodeMirror, AG-Grid, TanStack
- Wires components automatically based on what you have installed

---

## Prerequisites

### Required Software

- **Node.js:** v18.0.0 or higher
- **npm:** Latest version
- **Cursor IDE:** With MCP support (or another MCP client)

### Get Your Velt Credentials

You'll need:

- **Velt API Key** from https://console.velt.dev
- **Velt Auth Token** (optional, for JWT authentication)

---

## Quick Start

### Option 1: Using .env File (Recommended)

#### 1. Create `.env.local` in your project

```bash
cd /path/to/your/nextjs/project
echo "VELT_API_KEY=your_actual_api_key_here" > .env.local
```

**Optional:** Add auth token:
```bash
echo "VELT_AUTH_TOKEN=your_auth_token_here" >> .env.local
```

#### 2. Restart Cursor

Restart Cursor to reload the MCP server with latest changes.

#### 3. Ask AI to install Velt

In Cursor chat, simply say:
```
install velt in this project
```

The AI will:
- Ask which directory (if not clear)
- Read API key from `.env.local` automatically
- Run the installation
- Show progress for each step

#### 4. Watch the Installation

You'll see output like:
```
🚀 Starting Velt Installation
📁 Project: /path/to/your/project

📋 Step 1/5: Collecting configuration...
   📂 Reading .env files from: /path/to/your/project
   ✓ Found: .env.local
      ✓ Found VELT_API_KEY
✅ Step 1/5: Configuration collected

⚙️  Step 2/5: Running Velt CLI...
   Running: npx @veltdev/add-velt add --all
✅ Step 2/5: Velt CLI completed

🔍 Step 3/5: Fetching documentation patterns...
   Strategy 1: Attempting Velt Docs MCP server...
   [or falls back to URL if MCP is down]
✅ Step 3/5: Documentation patterns fetched

🔧 Step 4/5: Integrating code...
   🔑 Replacing API key placeholders...
   📚 Detected libraries: ReactFlow
   🔌 Wiring ReactFlow cursor...
✅ Step 4/5: Integration complete

✅ Step 5/5: Validating installation...
✅ Installation complete!
```

---

### Option 2: Provide API Key Directly

If you don't want to use `.env` files, you can provide the API key directly:

#### 1. Ask AI to install Velt

```
install velt in this project
```

#### 2. When AI asks for API key, provide it

```
My API key is: your_api_key_here
```

The AI will pass it directly to the tool, and installation will proceed.

---

## Configuration Options

### Where API Key is Read From

The tool checks in this order:

1. **Parameter** (if provided by AI)
2. **`.env.local`** in project directory
3. **`.env`** in project directory
4. **Error** (if none found)

### Environment Variable Names

The tool looks for:
- `VELT_API_KEY` or `NEXT_PUBLIC_VELT_API_KEY`
- `VELT_AUTH_TOKEN` (optional)

### Example .env.local

```bash
# Required
VELT_API_KEY=your_api_key_here

# Optional (for JWT authentication)
VELT_AUTH_TOKEN=your_auth_token_here
```

---

## Understanding the Output

### Success Indicators

#### ✅ All Steps Successful

```
✅ Step 1/5: Configuration collected
✅ Step 2/5: Velt CLI completed
✅ Step 3/5: Documentation patterns fetched
   ✓ Source: Velt Docs MCP (https://docs.velt.dev/mcp)
✅ Step 4/5: Integration complete
   Files Modified: 2
   Components Added: 1
✅ Step 5/5: Validating installation...
✅ Installation complete!
```

**What This Means:**
- API key found and used ✅
- CLI created all files ✅
- Documentation fetched from MCP ✅
- Placeholders replaced ✅
- ReactFlow cursor added ✅
- Ready to use! 🎉

---

#### ⚠️ CLI Failed but Installation Continued

```
✅ Step 1/5: Configuration collected
⚠️  Step 2/5: Velt CLI completed with warnings
   ⚠️  CLI reported failure (exit code: 1)
   ℹ️  Continuing anyway - CLI may have still created required files
✅ Step 3/5: Documentation patterns fetched
✅ Step 4/5: Integration complete
✅ Installation complete!
```

**What This Means:**
- CLI failed on npm install (peer dependency conflicts) ⚠️
- But files were still created ✅
- Integration completed successfully ✅
- You may need to manually install packages later

**Next Step:**
```bash
cd /path/to/your/project
npm install @veltdev/react@latest --legacy-peer-deps
```

---

#### 🔄 Documentation Fallback

```
🔍 Step 3/5: Fetching documentation patterns...
   Strategy 1: Attempting Velt Docs MCP server...
   ❌ MCP server failed: Failed to connect
   Strategy 2: Falling back to direct URL fetch...
   URL: https://docs.velt.dev/async-collaboration/comments/setup/freestyle
   ✓ Successfully fetched documentation page
   ✅ Successfully extracted patterns from Velt documentation!
   ✓ Source: Velt Docs URL
```

**What This Means:**
- MCP server was down (or unreachable) ⚠️
- Automatically fell back to URL fetch ✅
- Got patterns successfully ✅
- No impact on functionality ✅

---

#### ❌ API Key Missing

```
📋 Step 1/5: Collecting configuration...
   📂 Reading .env files from: /path/to/project
   ⚠️  Not found: .env.local
   ⚠️  Not found: .env
❌ Step 1/5: Failed - API key not found

API key not found in /path/to/project

Checked files:
  - /path/to/project/.env.local (not found)
  - /path/to/project/.env (not found)

Please add VELT_API_KEY or NEXT_PUBLIC_VELT_API_KEY to .env.local file
```

**What This Means:**
- No API key found in project directory ❌
- Need to create `.env.local` file

**Solution:**
```bash
cd /path/to/your/project
echo "VELT_API_KEY=your_key_here" > .env.local
```

Then retry installation.

---

## Troubleshooting

### Issue 1: "API key not found"

**Symptoms:**
```
❌ API key not found in /path/to/project
```

**Solutions:**

**Option A:** Create `.env.local` file
```bash
cd /path/to/your/project
echo "VELT_API_KEY=your_key_here" > .env.local
```

**Option B:** Provide API key directly when AI asks

**Option C:** Make sure you're in the correct project directory

---

### Issue 2: "CLI failed" but installation continued

**Symptoms:**
```
⚠️  CLI reported failure (exit code: 1)
```

**Why:** npm install failed due to peer dependency conflicts (common with Next.js 15/React 19).

**Impact:** Files are still created, integration still works.

**Solution:** Install packages manually:
```bash
cd /path/to/your/project
npm install @veltdev/react@latest --legacy-peer-deps
```

---

### Issue 3: AI checking wrong directory

**Symptoms:**
- AI says "Checking other projects..." or "Looking in monorepo..."
- AI tries to create files outside your project

**Why:** AI behavior, not tool behavior.

**Solution:**
- Be explicit: "install velt in `/path/to/my/project`"
- Wait for AI to confirm directory before proceeding
- Tool itself only works in specified directory

---

### Issue 4: MCP server down

**Symptoms:**
```
❌ MCP server failed: Failed to connect
Strategy 2: Falling back to direct URL fetch...
```

**Why:** Velt Docs MCP server may be temporarily unavailable.

**Impact:** None - automatically falls back to URL fetch.

**Solution:** None needed - tool handles it automatically.

---

### Issue 5: Documentation fetch failed

**Symptoms:**
```
❌ URL fetch failed: timeout
Strategy 3: Using fallback patterns
```

**Why:** Both MCP and URL unavailable (network issues).

**Impact:** Uses hardcoded patterns - still works but may not have latest patterns.

**Solution:** Check internet connection, retry later.

---

## Advanced Usage

### Providing API Key as Parameter

If you want to provide API key directly (e.g., Cursor can't see `.env` files):

1. Tell AI your API key when asked
2. AI will pass it to the tool
3. Tool uses it directly

**Example:**
```
User: install velt in this project
AI: What's your Velt API key?
User: my_api_key_12345
AI: [calls tool with apiKey parameter]
```

---

### Checking Which Libraries Were Detected

Look for this in the output:
```
📚 Detected libraries: ReactFlow
```

Or check the integration result:
```javascript
{
  "detectedLibraries": {
    "hasReactFlow": true,
    "hasTiptap": false,
    // ...
  }
}
```

---

### Understanding Documentation Source

The output shows which source was used:

- **"Velt Docs MCP"** - Fetched from MCP server (best, most up-to-date)
- **"Velt Docs URL"** - Fetched from documentation URL (good, current)
- **"fallback"** - Using hardcoded patterns (works but may be outdated)

---

### Manual Library Detection

If library detection doesn't work, you can check manually:

```bash
cd /path/to/your/project
grep -E "reactflow|@xyflow/react" package.json  # ReactFlow
grep "@tiptap/react" package.json                # Tiptap
grep "@codemirror/state" package.json            # CodeMirror
grep "ag-grid-react" package.json                # AG-Grid
grep "@tanstack/react-table" package.json       # TanStack
```

---

## Common Commands

### Quick Reference

```bash
# Create .env.local with API key
cd /path/to/your/project
echo "VELT_API_KEY=your_key" > .env.local

# Check if API key is set
cat .env.local | grep VELT_API_KEY

# Verify installation files exist
ls app/api/velt/token/route.ts
ls components/velt/

# Check if placeholders were replaced
grep -v "YOUR_VELT" app/api/velt/token/route.ts

# Install packages manually if CLI failed
npm install @veltdev/react@latest --legacy-peer-deps
```

---

## File Locations

### Where Files Are Created

After installation, you'll find:

```
your-project/
├── .env.local                    # Your API key (if you created it)
├── app/
│   ├── api/
│   │   └── velt/
│   │       └── token/
│   │           └── route.ts      # API route (placeholders replaced)
│   ├── userAuth/
│   │   └── AppUserContext.tsx    # User auth context
│   └── document/
│       └── DocumentContext.tsx   # Document context
└── components/
    └── velt/
        ├── VeltCollaboration.tsx # Collaboration component (ReactFlow wired)
        └── ...                   # Other Velt components
```

---

## Next Steps After Installation

### 1. Verify Installation

```bash
# Check API key was replaced
grep "VELT_API_KEY" app/api/velt/token/route.ts
# Should show your actual key, not "YOUR_VELT_API_KEY"

# Check ReactFlow integration (if you have ReactFlow)
grep "VeltCursor" components/velt/VeltCollaboration.tsx
# Should show import and usage
```

### 2. Install Packages (if CLI failed)

```bash
npm install @veltdev/react@latest --legacy-peer-deps
```

### 3. Run Your App

```bash
npm run dev
```

### 4. Test Velt Features

- Open `http://localhost:3000`
- Check browser console for Velt initialization
- Try collaboration features

---

## Success Checklist

After installation, verify:

- [ ] `.env.local` exists with `VELT_API_KEY` (or provided directly)
- [ ] `app/api/velt/token/route.ts` has your actual API key (not "YOUR_VELT_API_KEY")
- [ ] `components/velt/VeltCollaboration.tsx` exists
- [ ] If you have ReactFlow, `VeltCursor` is imported and used
- [ ] Installation output shows "✅ Installation complete!"
- [ ] No critical errors (CLI warnings are OK)

**If all checked:** You're ready to use Velt! 🎉

---

## Getting Help

### Check Logs

All steps now have comprehensive logging. Look for:
- Step numbers (1/5, 2/5, etc.)
- Strategy indicators (MCP, URL, fallback)
- Library detection results
- File modification reports

### Common Issues Summary

| Issue | Quick Fix |
|-------|-----------|
| API key not found | Create `.env.local` with `VELT_API_KEY=...` |
| CLI failed | Expected with Next.js 15, install packages manually |
| MCP server down | Automatic fallback to URL - no action needed |
| Wrong directory | Be explicit: "install velt in `/path/to/project`" |

### Reference Documents

- **Handoff Doc:** `HANDOFF_NOV_21.md` - Technical details
- **Previous Handoff:** `HANDOFF_NOV_20.md` - Original implementation
- **Velt Docs:** https://docs.velt.dev

---

## Conclusion

You now know how to:

- ✅ Install Velt using `.env` files or direct API key
- ✅ Understand the installation output and logging
- ✅ Troubleshoot common issues
- ✅ Verify installation succeeded
- ✅ Handle CLI failures gracefully

**The installer now has robust fallback mechanisms and comprehensive logging, making it more reliable and easier to debug.**

For technical details, see `HANDOFF_NOV_21.md`.

**Happy Velt integrating!** 🚀

