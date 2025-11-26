# Updated Velt Installation Workflow v3.0

**Date:** November 25, 2024
**Version:** 3.0
**Status:** ✅ Updated - Direct API Key Input

---

## 🎯 What Changed

The Velt Installation MCP now:
1. ✅ **Asks for API keys directly** - No more .env file dependencies
2. ✅ **Prompts for features** - Shows available features (focuses on Comments for now)
3. ✅ **Confirms directory** - Explicit directory confirmation
4. ✅ **Uses hardcoded keys** - Provided keys are used directly, not read from .env

---

## 🔄 New Installation Workflow

### Step-by-Step User Experience

```
1. User: "Install Velt on my project"
   ↓
2. AI: "Is this the correct directory: /Users/yoenzhang/Downloads/blog?"
   User: "Yes"
   ↓
3. AI: "What features do you want to install?

   Available features:
   - Comments (Freestyle - click anywhere, or Popover - attach to elements)
   - Presence (live cursors and avatars)
   - Notifications
   - Recorder

   For now, we'll focus on Comments. Choose Freestyle or Popover."

   User: "Freestyle"
   ↓
4. AI: "Please provide your Velt API Key (from https://console.velt.dev)"
   User: "velt_api_key_abc123..."
   ↓
5. AI: "Please provide your Velt Auth Token (from https://console.velt.dev)"
   User: "velt_auth_token_xyz789..."
   ↓
6. AI: "Where should the comments sidebar header be positioned?
   - top-left
   - top-right (recommended)
   - bottom-left
   - bottom-right"

   User: "top-right"
   ↓
7. AI: "Make sure your dev server is running (pnpm run dev). Is it running?"
   User: "Yes"
   ↓
8. AI: [Calls install_velt_interactive with all parameters]
   ↓
9. Tool executes:
   ✅ Step 1/7: Configuration prepared (using provided keys)
   ✅ Step 2/7: Dev server detected
   ✅ Step 3/7: Screenshot captured
   ✅ Step 4/7: Velt CLI completed
   ✅ Step 5/7: Placement detected
   ✅ Step 6/7: Integration completed
   ✅ Step 7/7: Validation completed
   ↓
10. Success! 🎉
```

---

## 📝 Required User Inputs

### 1. Directory Confirmation
**Prompt:** "Is this the correct directory: [directory path]?"
**Purpose:** Explicit confirmation before installation
**Example:**
```
AI: Is this the correct directory: /Users/yoenzhang/Downloads/blog?
User: Yes
```

### 2. Feature Selection
**Prompt:** "What features do you want to install?"
**Options:** Comments, Presence, Notifications, Recorder
**Note:** Currently only Comments (Freestyle/Popover) is fully supported
**Example:**
```
AI: What features do you want?
Available:
- Comments (Freestyle or Popover)
- Presence (coming soon)
- Notifications (coming soon)
- Recorder (coming soon)

For now, we'll focus on Comments. Choose Freestyle or Popover.
User: Freestyle
```

### 3. API Key
**Prompt:** "Please provide your Velt API Key (from https://console.velt.dev)"
**Format:** String (typically starts with `velt_`)
**Required:** ✅ Yes
**Example:**
```
AI: Please provide your Velt API Key (from https://console.velt.dev)
User: velt_api_key_abc123xyz789...
```

### 4. Auth Token
**Prompt:** "Please provide your Velt Auth Token (from https://console.velt.dev)"
**Format:** String
**Required:** ✅ Yes
**Example:**
```
AI: Please provide your Velt Auth Token (from https://console.velt.dev)
User: auth_token_xyz789abc123...
```

### 5. Header Position
**Prompt:** "Where should the comments sidebar header be positioned?"
**Options:** top-left, top-right, bottom-left, bottom-right
**Default:** top-right
**Example:**
```
AI: Where should the comments sidebar header be positioned?
- top-left
- top-right (recommended)
- bottom-left
- bottom-right

User: top-right
```

### 6. Dev Server Confirmation
**Prompt:** "Make sure your dev server is running (pnpm run dev). Is it running?"
**Purpose:** Ensures screenshot can be captured
**Example:**
```
AI: Make sure your dev server is running (pnpm run dev). Is it running?
User: Yes
```

---

## 🔑 API Keys - Important Changes

### Before (v2.x):
```javascript
// Tool tried to read from .env.local
const apiKey = process.env.VELT_API_KEY;
const authToken = process.env.VELT_AUTH_TOKEN;
```

### After (v3.0):
```javascript
// Tool uses provided keys directly
const apiKey = args.apiKey; // From user input
const authToken = args.authToken; // From user input
```

### Benefits:
- ✅ No need to create .env files first
- ✅ Works on any project immediately
- ✅ More explicit and clear
- ✅ User has full control
- ✅ No confusion about where keys come from

---

## 🛠️ Tool Parameters

### `install_velt_interactive`

**Required Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | string | Path to Next.js project (user confirms) |
| `apiKey` | string | Velt API Key from console.velt.dev |
| `authToken` | string | Velt Auth Token from console.velt.dev |
| `commentType` | enum | `"freestyle"` or `"popover"` |

**Optional Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headerPosition` | enum | `"top-right"` | Sidebar header position |
| `features` | array | `["comments"]` | Features to install |
| `targetArea` | string | `""` | Where to place comments |

---

## 🎨 Example: Complete Installation Session

**User starts conversation:**
```
User: Install Velt on my blog
```

**AI guides through questions:**

```
AI: Great! I'll help you install Velt. Let me ask a few questions:

1. Is this the correct directory: /Users/yoenzhang/Downloads/blog?
```

**User confirms:**
```
User: Yes, that's correct
```

**AI asks about features:**
```
AI: 2. What features do you want to install?

Available Velt features:
- Comments (Freestyle - click anywhere to comment, or Popover - attach comments to elements)
- Presence (live cursors and avatars) - coming soon
- Notifications - coming soon
- Recorder - coming soon

For now, we'll focus on Comments. Would you like Freestyle or Popover comments?
```

**User chooses:**
```
User: Freestyle comments
```

**AI asks for API key:**
```
AI: 3. Please provide your Velt API Key. You can get this from https://console.velt.dev
```

**User provides:**
```
User: velt_api_abc123xyz789def456...
```

**AI asks for auth token:**
```
AI: 4. Please provide your Velt Auth Token. You can also get this from https://console.velt.dev
```

**User provides:**
```
User: auth_xyz789abc123def456...
```

**AI asks about positioning:**
```
AI: 5. Where should the comments sidebar header be positioned?
- top-left
- top-right (recommended)
- bottom-left
- bottom-right
```

**User chooses:**
```
User: top-right
```

**AI checks dev server:**
```
AI: 6. Make sure your dev server is running (pnpm run dev). Is it running?
```

**User confirms:**
```
User: Yes, it's running on localhost:3000
```

**AI installs:**
```
AI: Perfect! Installing Velt now...

🚀 Starting Interactive Velt Installation
📁 Project: /Users/yoenzhang/Downloads/blog
🔑 API Key: velt_api...
🔐 Auth Token: auth_xyz...
💬 Comment Type: freestyle
📍 Header Position: top-right
✨ Features: comments

📋 Step 1/7: Configuration prepared (using provided keys)
✅ Step 1/7: Configuration prepared

🔄 Step 2/7: Ensuring dev server is running...
✅ Step 2/7: Dev server running at http://localhost:3000

📸 Step 3/7: Taking screenshot...
✅ Step 3/7: Screenshot captured

⚙️  Step 4/7: Running Velt CLI...
✅ Step 4/7: Velt CLI completed

🔍 Step 5/7: Detecting where to place comments...
   ✅ Found 3 potential placements
   📄 Recommended: app/page.tsx
✅ Step 5/7: Placement detected

🔧 Step 6/7: Integrating Velt components...
   ✏️  Modified 3 file(s)
   ➕ Added 2 component(s)
   📍 Applied top-right positioning to VeltCommentsSidebar
✅ Step 6/7: Integration completed

✔️  Step 7/7: Validating installation...
   5/5 validation checks passed
✅ Step 7/7: Validation completed

🎉 Installation completed successfully!

Summary:
- Comment Type: Freestyle
- Header Position: Top-right
- Features: comments
- Keys: User-provided
- Files Modified: app/page.tsx, app/layout.tsx, app/api/velt/token/route.ts
- Components Added: VeltComments, VeltCommentsSidebar
- Validation: 5/5 checks passed

Your Velt installation is complete! The comments sidebar is positioned in the top-right corner.
```

---

## 🔒 Security Notes

### API Key Handling

The tool:
- ✅ Accepts API keys as parameters
- ✅ Shows only first 8 characters in logs (e.g., `velt_api...`)
- ✅ Uses keys directly to replace placeholders in code
- ✅ Does NOT store keys anywhere permanently
- ✅ Does NOT write keys to .env files

### User Responsibility

Users should:
- 🔑 Get keys from https://console.velt.dev
- 🔒 Keep keys secure
- ⚠️ Be aware keys will be in the code after installation
- 📝 Optionally move keys to .env files after installation for better security

### Post-Installation

After installation, the keys will be:
- In `app/page.tsx` (API key)
- In `app/api/velt/token/route.ts` (API key + Auth token)

**Recommended:** After installation, move keys to `.env.local`:
```bash
# Create .env.local
echo "VELT_API_KEY=your_key" >> .env.local
echo "VELT_AUTH_TOKEN=your_token" >> .env.local

# Then update the code to use process.env.VELT_API_KEY
# and process.env.VELT_AUTH_TOKEN
```

---

## 📊 Comparison: v2 vs v3

| Aspect | v2.x (Old) | v3.0 (New) |
|--------|-----------|-----------|
| **API Key Source** | .env files | User input |
| **Auth Token Source** | .env files | User input |
| **Directory Confirmation** | Implicit | Explicit prompt |
| **Features Selection** | None | Explicit prompt |
| **Setup Required** | Create .env first | None |
| **User Control** | Indirect | Direct |
| **Clarity** | Less clear | Very clear |

---

## ✅ Testing the New Workflow

### 1. Start Fresh

No need to create .env files! Just have your project ready:

```bash
cd /Users/yoenzhang/Downloads/blog
pnpm run dev
```

### 2. In Cursor AI Chat

```
Install Velt on my project
```

### 3. Answer Questions

Follow the prompts:
1. ✅ Confirm directory
2. ✅ Choose Freestyle
3. ✅ Provide API key
4. ✅ Provide Auth token
5. ✅ Choose top-right
6. ✅ Confirm dev server running

### 4. Verify Success

Check the installation report shows:
- ✅ 7/7 steps completed
- ✅ API key: `your_key...` (truncated)
- ✅ Auth token: `your_token...` (truncated)
- ✅ Keys used: user-provided
- ✅ Files modified
- ✅ Validation passed

---

## 🐛 Troubleshooting

### "API key is required"

**Error:** Tool throws error about missing API key

**Solution:** Make sure you provided the API key when prompted. Get it from https://console.velt.dev

### "Auth token is required"

**Error:** Tool throws error about missing auth token

**Solution:** Provide your auth token from https://console.velt.dev

### Keys Not Working

**Issue:** Installation completes but comments don't work

**Cause:** Invalid or expired keys

**Solution:**
1. Log into https://console.velt.dev
2. Generate new API key and auth token
3. Run installation again with new keys

---

## 📚 Related Documentation

- **ENHANCED_INTERACTIVE_GUIDE.md** - Previous version (v2.x)
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **INTERACTIVE_WORKFLOW.md** - Original workflow documentation
- **Velt Console** - https://console.velt.dev (get your keys here)

---

## 🎉 Summary

### What You Need to Do

1. **Get your keys** from https://console.velt.dev
2. **Start dev server** (`pnpm run dev`)
3. **Run installation** in Cursor/Claude Code
4. **Answer 6 questions** (directory, features, API key, auth token, position, dev server)
5. **Done!** Installation runs automatically

### What You DON'T Need to Do

- ❌ Create .env files beforehand
- ❌ Set up environment variables
- ❌ Manually edit configuration files
- ❌ Look for keys in .env files

### What the Tool Does

- ✅ Uses your provided keys directly
- ✅ Installs Velt with proper configuration
- ✅ Positions sidebar exactly where you want
- ✅ Validates everything works
- ✅ Shows clear success report

---

**Updated workflow is ready! 🚀**

