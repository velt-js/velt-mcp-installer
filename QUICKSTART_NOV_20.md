# Velt MCP Installer - Quick Start Guide
**Date:** November 20, 2025
**Purpose:** Step-by-step guide to run Velt installation locally

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option A: Quick Test (Recommended)](#option-a-quick-test-recommended)
3. [Option B: Full Installation Flow](#option-b-full-installation-flow)
4. [Option C: Integration Only (Post-CLI)](#option-c-integration-only-post-cli)
5. [Understanding the Output](#understanding-the-output)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js:** v18.0.0 or higher
- **npm:** Latest version
- **Git:** For cloning repositories

### Required Files & Paths
- **Velt MCP Installer:** `/Users/yoenzhang/Downloads/velt-mcp-installer`
- **Velt CLI:** `/Users/yoenzhang/Downloads/add-velt-next-js`
- **Test Demo Repo:** Any Next.js App Router project

### Get Your Velt Credentials
You'll need:
- **Velt API Key** from https://console.velt.dev
- **Velt Auth Token** (optional, for JWT authentication)

---

## Option A: Quick Test (Recommended)

### Use Case
You want to quickly test the integration script without running the full CLI.

### Steps

#### 1. Navigate to the installer directory
```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
```

#### 2. Run the integration-only test
```bash
node test-integration-only.js
```

#### 3. Review the output
You should see:
```
==========================================
Velt Integration Test (integration.js only)
==========================================

Success: true/false

Files Modified:
---------------
  ✏️  app/api/velt/token/route.ts
  ✏️  components/velt/VeltCollaboration.tsx

Components Added:
-----------------
  ➕ VeltCursor in components/velt/VeltCollaboration.tsx

Integration Points:
-------------------
  📍 authTokenReplacement in app/api/velt/token/route.ts
  📍 reactflowCursor in components/velt/VeltCollaboration.tsx
```

**What This Tests:**
- ✅ Placeholder replacement logic
- ✅ ReactFlow cursor integration
- ✅ File modification tracking
- ✅ Validation checks

**Note:** This assumes the demo repo already has CLI-generated files with placeholders.

---

## Option B: Full Installation Flow

### Use Case
You want to test the complete end-to-end installation process (all 5 steps).

### Steps

#### 1. Prepare a fresh Next.js project
```bash
# Create a new Next.js project or use an existing one
cd /Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/test

# Make sure it's a clean Next.js App Router project
ls app/  # Should see layout.tsx and page.tsx
```

#### 2. Set environment variables
```bash
export VELT_API_KEY="your_actual_velt_api_key_here"
export VELT_AUTH_TOKEN="your_actual_velt_auth_token_here"  # Optional
```

**Alternative:** Create a `.velt-agent-config.json` file:
```bash
cat > /path/to/your/project/.velt-agent-config.json << 'EOF'
{
  "apiKey": "your_actual_velt_api_key_here",
  "authToken": "your_actual_velt_auth_token_here"
}
EOF
```

#### 3. Navigate to installer directory
```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
```

#### 4. Run the full installation test
```bash
node test-installation.js
```

**Or with inline environment variables:**
```bash
VELT_API_KEY="your_key" VELT_AUTH_TOKEN="your_token" node test-installation.js
```

#### 5. Review the output
You should see output for all 5 steps:

```
==========================================
Velt Installation Test
==========================================

Steps:
------
✅ Step 1: collect_configuration
   Status: complete

✅/❌ Step 2: run_velt_cli
   Status: complete/failed
   (May fail on npm install due to peer dependencies)

✅ Step 3: query_velt_mcp
   Status: complete

✅ Step 4: analyze_and_integrate
   Status: complete
   Files Modified: 2
   Components Added: 1

✅ Step 5: validate_installation
   Status: complete
```

**Expected Issues:**
- Step 2 may fail with npm install (peer dependency conflicts with Next.js 15/React 19)
- This is expected and doesn't affect Step 4 integration

---

## Option C: Integration Only (Post-CLI)

### Use Case
The CLI has already run and created files. You just want to test the integration script.

### Steps

#### 1. Ensure CLI files exist
Verify these files exist in your project:
```bash
cd /path/to/your/nextjs/project

# Check for CLI-generated files
ls app/userAuth/
ls app/document/
ls app/api/velt/token/
ls components/velt/
```

#### 2. Verify placeholders exist
```bash
# Should show "YOUR_VELT_API_KEY" and "YOUR_VELT_AUTH_TOKEN"
grep "YOUR_VELT" app/api/velt/token/route.ts
```

#### 3. Update the test script with your project path
Edit `test-integration-only.js`:
```javascript
const testProjectPath = '/path/to/your/nextjs/project';  // Update this line
```

#### 4. Run integration test
```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
node test-integration-only.js
```

#### 5. Verify replacements worked
```bash
cd /path/to/your/nextjs/project

# Should show your actual API key (not "YOUR_VELT_API_KEY")
grep -A 1 "NEXT_PUBLIC_VELT_API_KEY" app/api/velt/token/route.ts

# Should show VeltCursor import and usage
grep "VeltCursor" components/velt/VeltCollaboration.tsx
```

---

## Understanding the Output

### Success Indicators

#### ✅ Integration Successful
```
Success: true

Files Modified: 2
  ✏️  app/api/velt/token/route.ts
  ✏️  components/velt/VeltCollaboration.tsx

Components Added: 1
  ➕ VeltCursor

Integration Points: 2
  📍 authTokenReplacement
  📍 reactflowCursor

Validation Issues: 0
```

**What This Means:**
- Placeholders were successfully replaced
- ReactFlow cursor was added
- No validation errors
- Your project is ready to use Velt!

#### ⚠️ Integration Succeeded with Warnings
```
Success: false

Files Modified: 2
Components Added: 1
Integration Points: 2

Validation Issues: 5
  ❌ [missing-file] app/userAuth/SignIn.tsx
  ❌ [validation-failed] VeltProvider not found in page.tsx
```

**What This Means:**
- Core integration (placeholder replacement) worked ✅
- But validation found issues that may need attention
- These are often false positives (see Troubleshooting)

#### ❌ Integration Failed
```
Success: false

Files Modified: 0
Validation Issues: 8
  ❌ [cli-not-run] CLI output not found
```

**What This Means:**
- CLI files don't exist
- Need to run the CLI first (Step 2)

---

## Troubleshooting

### Issue 1: "CLI output not found"

**Symptoms:**
```
❌ [cli-not-run] CLI output not found. Please run `add-velt-next-js` first
```

**Solution:**
Run the Velt CLI first:
```bash
cd /path/to/your/nextjs/project
node /Users/yoenzhang/Downloads/add-velt-next-js/bin/velt.js add --all
```

---

### Issue 2: "npm install failed" (During CLI Step)

**Symptoms:**
```
Step 2: run_velt_cli - Failed
Attempting standard install...
Attempting with --force flag...
Attempting with --legacy-peer-deps...
```

**Why:** Peer dependency conflicts between Velt packages and Next.js 15/React 19.

**Solution:**
This is expected and **does not prevent integration from working**. The CLI still creates all the files with placeholders.

**Alternative Solutions:**
1. **Use Next.js 14 + React 18:**
   ```bash
   npm install next@14 react@18 react-dom@18
   ```

2. **Manually add packages with legacy peer deps:**
   ```bash
   npm install @veltdev/react@^4.5.2-beta.2 --legacy-peer-deps
   ```

3. **Just continue** - integration.js doesn't need packages installed to replace placeholders

---

### Issue 3: Validation Warnings About Missing Files

**Symptoms:**
```
❌ [missing-file] app/userAuth/SignIn.tsx
❌ [missing-file] app/document/page.tsx
❌ [validation-failed] VeltProvider not found in page.tsx
```

**Why:** These are false positives. The validation logic expects files that the CLI doesn't actually create (or creates with different names).

**Solution:**
Ignore these warnings for now. They don't affect functionality. The validation logic will be updated in a future release.

**What Actually Matters:**
- ✅ `app/api/velt/token/route.ts` exists with replaced values
- ✅ `components/velt/*` files exist
- ✅ `app/userAuth/AppUserContext.tsx` exists (not SignIn.tsx)

---

### Issue 4: Environment Variables Not Being Read

**Symptoms:**
```
Step 1: collect_configuration - Failed
API key required. Please provide VELT_API_KEY environment variable
```

**Solution:**
Set environment variables before running:
```bash
export VELT_API_KEY="your_key_here"
export VELT_AUTH_TOKEN="your_token_here"
node test-installation.js
```

**Alternative:** Create `.velt-agent-config.json` in the project:
```json
{
  "apiKey": "your_key_here",
  "authToken": "your_token_here"
}
```

---

### Issue 5: Test Script Can't Find Project

**Symptoms:**
```
Error: package.json not found
```

**Solution:**
Update the project path in the test script:

**For `test-installation.js`:**
```javascript
// Line ~13
const testProjectPath = '/Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/test';
```

**For `test-integration-only.js`:**
```javascript
// Line ~11
const testProjectPath = '/Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/test';
```

Change to your actual project path.

---

## Testing Different Scenarios

### Test with ReactFlow
```javascript
// In test-integration-only.js
patterns: {
  hasReactFlow: true,  // Will auto-add VeltCursor
  hasTiptap: false,
  // ... rest
}
```

**Expected:** VeltCursor import and component added to VeltCollaboration.tsx

---

### Test with Tiptap
```javascript
patterns: {
  hasReactFlow: false,
  hasTiptap: true,  // Will add TODO comment
  // ... rest
}
```

**Expected:** TODO comment added to VeltCollaboration.tsx pointing to Tiptap docs

---

### Test Without Auth Token
```javascript
config: {
  apiKey: 'test_api_key_abc123',
  authToken: undefined,  // No auth token
}
```

**Expected:** Only API key replaced, auth token placeholder remains

---

## Verifying Success

### 1. Check Placeholder Replacement
```bash
# Before integration
grep "YOUR_VELT" app/api/velt/token/route.ts
# Output: YOUR_VELT_API_KEY, YOUR_VELT_AUTH_TOKEN

# After integration
grep "VELT" app/api/velt/token/route.ts | grep -v "YOUR"
# Output: Your actual API key and auth token
```

### 2. Check ReactFlow Integration
```bash
grep -n "VeltCursor" components/velt/VeltCollaboration.tsx
# Expected output:
# 8:import { VeltCursor } from "@veltdev/react";
# 41:      <VeltCursor />
```

### 3. Check Integration Report
Look for this in the output:
```
Integration Points:
-------------------
  📍 authTokenReplacement in app/api/velt/token/route.ts
     Replaced YOUR_VELT_API_KEY and YOUR_VELT_AUTH_TOKEN placeholders
  📍 reactflowCursor in components/velt/VeltCollaboration.tsx
     Injected Velt cursor component
```

---

## Next Steps After Successful Integration

### 1. Install Velt Packages (if npm install failed)
```bash
cd /path/to/your/project
npm install @veltdev/react@latest --legacy-peer-deps
```

### 2. Run Your Next.js App
```bash
npm run dev
```

### 3. Verify Velt is Working
- Open `http://localhost:3000`
- Look for Velt collaboration features
- Check browser console for Velt initialization logs

### 4. Customize Integration
Edit the following files to integrate Velt into your actual pages:
- `app/page.tsx` - Add VeltProvider wrapper
- `app/layout.tsx` - Add AppProviders wrapper
- Your components - Use Velt components where needed

**Refer to:** `src/utils/installation_rules_and_guidelines.md` for integration patterns

---

## Running as MCP Server

### Start the MCP Server
```bash
cd /Users/yoenzhang/Downloads/velt-mcp-installer
npm start
```

**Output:**
```
Velt MCP Installer server running on stdio
```

### Connect from MCP Client
The server uses stdio transport, so you'll need an MCP client like:
- Claude Desktop
- VS Code with MCP extension
- Custom MCP client

**Configure in Claude Desktop:** Add to `claude_desktop_config.json`:
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

---

## Common Command Reference

### Quick Commands
```bash
# Test integration only (fast)
cd /Users/yoenzhang/Downloads/velt-mcp-installer && node test-integration-only.js

# Test full flow
cd /Users/yoenzhang/Downloads/velt-mcp-installer && VELT_API_KEY="key" node test-installation.js

# Start MCP server
cd /Users/yoenzhang/Downloads/velt-mcp-installer && npm start

# Check CLI is available
ls -la /Users/yoenzhang/Downloads/add-velt-next-js/bin/velt.js

# View integration spec
cat /Users/yoenzhang/Downloads/velt-mcp-installer/src/utils/installation_rules_and_guidelines.md
```

### File Locations
```bash
# Installer repo
/Users/yoenzhang/Downloads/velt-mcp-installer/

# Main files
src/utils/integration.js              # Integration logic
src/tools/orchestrator.js             # 5-step orchestrator
src/utils/installation_rules_and_guidelines.md  # Spec

# Test files
test-installation.js                  # Full flow test
test-integration-only.js              # Integration test

# Documentation
HANDOFF_NOV_20.md                     # Handoff doc
QUICKSTART_NOV_20.md                  # This file
```

---

## Getting Help

### Check Logs
The test scripts output detailed logs showing:
- What step is running
- What files were modified
- What validation issues occurred
- Full CLI output

### Common Issues Summary

| Issue | Quick Fix |
|-------|-----------|
| "CLI output not found" | Run CLI first: `node velt.js add --all` |
| npm install fails | Expected with Next 15, doesn't affect integration |
| Validation warnings | Usually false positives, check actual file changes |
| Env vars not working | Export before running or use `.velt-agent-config.json` |

### Reference Documents
- **Integration Spec:** `src/utils/installation_rules_and_guidelines.md`
- **Handoff Doc:** `HANDOFF_NOV_20.md`
- **Velt Docs:** https://docs.velt.dev

---

## Success Checklist

After running the installation, verify:

- [ ] `app/api/velt/token/route.ts` has your actual API key (not "YOUR_VELT_API_KEY")
- [ ] `app/api/velt/token/route.ts` has your auth token if provided
- [ ] `components/velt/VeltCollaboration.tsx` has `VeltCursor` import and usage (if ReactFlow)
- [ ] Test output shows "Files Modified: 2" (or more)
- [ ] Test output shows "Integration Points: 2" (or more)
- [ ] No critical validation errors (some warnings are OK)

**If all checked:** You're ready to integrate Velt into your app! 🎉

---

## Conclusion

You now know how to:
- ✅ Run the integration script standalone
- ✅ Run the full installation flow
- ✅ Verify the integration succeeded
- ✅ Troubleshoot common issues
- ✅ Test different scenarios

For questions or issues, refer to `HANDOFF_NOV_20.md` or check the code directly.

**Happy Velt integrating!** 🚀
