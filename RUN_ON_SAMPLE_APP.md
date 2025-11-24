# Running Velt MCP Installer on a Sample App

## Quick Setup Guide

### Step 1: Configure MCP Server ✅
Already done! The MCP server is configured in `.cursor/mcp.json`.

### Step 2: Create or Prepare a Sample Next.js App

**Option A: Create a new Next.js app**
```bash
# Create a new Next.js app
npx create-next-app@latest my-velt-test
cd my-velt-test

# Make sure it's using App Router (default in Next.js 13+)
```

**Option B: Use an existing Next.js app**
```bash
cd /path/to/your/nextjs/app
```

### Step 3: Set Up Your Velt API Key in .env File

**Get your API key from:** https://console.velt.dev

Create a `.env.local` file in your Next.js project root (or add to existing `.env` file):

```bash
# In your Next.js project directory
echo "VELT_API_KEY=your_api_key_here" >> .env.local
```

Or manually create/edit `.env.local`:
```
VELT_API_KEY=your_api_key_here
VELT_AUTH_TOKEN=your_auth_token_here  # Optional
```

**Important:** The installation will stop if `VELT_API_KEY` is not found in `.env.local` or `.env` file.

### Step 4: Restart Cursor
**Important:** You must restart Cursor for MCP server changes to take effect.

1. Quit Cursor completely
2. Reopen Cursor
3. Open your sample Next.js project

### Step 5: Run the Installation

**In Cursor's AI chat, type:**
```
Install Velt in this project
```

**What happens:**
1. Tool reads `VELT_API_KEY` from `.env.local` or `.env` file
2. If API key is missing, installation stops with a clear error message
3. If API key is found, tool runs all 5 steps automatically:
   - Collects configuration (from .env file)
   - Runs Velt CLI
   - Fetches Velt documentation + detects libraries
   - Integrates code (replaces placeholders, wires libraries)
   - Validates installation
4. Shows you a detailed report

**Note:** The tool reads from `.env` file only - no prompts or parameters needed!

### Step 6: Verify Installation

After installation completes, check:

1. **Files created:**
   ```bash
   ls app/userAuth/
   ls app/api/velt/
   ls components/velt/
   ```

2. **Placeholders replaced:**
   ```bash
   grep -r "YOUR_VELT_API_KEY" app/  # Should return nothing
   grep "NEXT_PUBLIC_VELT_API_KEY" app/api/velt/token/route.ts  # Should show your actual key
   ```

3. **Library integrations:**
   ```bash
   # If you have ReactFlow
   grep "VeltCursor" components/velt/VeltCollaboration.tsx
   ```

## What Happens During Installation

The orchestrator runs 5 steps:

1. **Collect Configuration** - Gets API key from env/config
2. **Run Velt CLI** - Executes `npx @veltdev/add-velt add --all`
3. **Query Velt MCP** - Gets patterns + detects libraries (ReactFlow, Tiptap, etc.)
4. **Analyze & Integrate** - Replaces placeholders + wires library integrations
5. **Validate** - Checks installation quality

## Troubleshooting

### "MCP server not found"
- Make sure Cursor was restarted after updating `mcp.json`
- Check that the path in `mcp.json` is correct: `/Users/samarthgoel/Documents/velt-mcp-installer/bin/mcp-server.js`

### "API key required"
- Make sure `.env.local` or `.env` file exists in your project root
- Add `VELT_API_KEY=your_key_here` to the file
- Get your API key from: https://console.velt.dev
- Restart Cursor after creating/updating .env file

### "CLI output not found"
- Step 2 (CLI) may have failed
- Check if `npx @veltdev/add-velt` works manually
- Files may still be created even if npm install fails

### "npm install failed"
- This is expected with Next.js 15/React 19 (peer dependency conflicts)
- Doesn't prevent integration from working
- You can manually install: `npm install @veltdev/react --legacy-peer-deps`

## Testing Without MCP Client

If you want to test without Cursor, use the test scripts:

```bash
cd /Users/samarthgoel/Documents/velt-mcp-installer

# Test full flow
VELT_API_KEY="your_key" node test-installation.js

# Test integration only (after CLI has run)
node test-integration-only.js
```

## Next Steps After Installation

1. **Install Velt packages** (if npm install failed):
   ```bash
   npm install @veltdev/react --legacy-peer-deps
   ```

2. **Run your app:**
   ```bash
   npm run dev
   ```

3. **Verify Velt is working:**
   - Open `http://localhost:3000`
   - Check browser console for Velt initialization
   - Look for collaboration features

4. **Customize integration:**
   - Edit `app/page.tsx` to add VeltProvider wrapper
   - Edit `app/layout.tsx` to add AppProviders wrapper
   - Use Velt components in your pages

## Example Installation Command

In Cursor chat:
```
@install_velt_freestyle Install Velt with freestyle comments in the current directory
```

Or simply:
```
Install Velt
```

The AI will automatically use the correct tool!

