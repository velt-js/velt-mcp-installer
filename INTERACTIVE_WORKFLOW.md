# Interactive Screenshot-Based Velt Installation Workflow

**Date:** November 25, 2024
**Version:** 0.2.0
**Status:** ✨ New Feature - Screenshot-Based Installation

---

## 🎯 Overview

We've enhanced the Velt MCP Installer with an **interactive, screenshot-based workflow** that allows AI agents to visually guide users through the installation process.

### What's New

1. **Screenshot Capture**: Take screenshots of the running Next.js app
2. **Visual User Interaction**: Show screenshot to user and ask where they want comments
3. **Smart File Detection**: Automatically detect which files to modify based on user input
4. **Comment Type Selection**: Support for both Freestyle and Popover comments
5. **Integration with Velt Docs MCP**: Query documentation for implementation patterns

---

## 🔄 New Interactive Workflow

### Traditional Workflow (Old)
```
User says: "install velt"
  ↓
AI calls: install_velt_freestyle
  ↓
Done (installs to default locations)
```

### New Interactive Workflow
```
1. User says: "install velt"
   ↓
2. AI calls: take_project_screenshot
   ↓
3. AI shows screenshot to user
   ↓
4. AI asks: "Which part of the page should have comments?"
   ↓
5. User responds: "the header" or "sidebar" or "main content"
   ↓
6. AI asks: "Freestyle or Popover comments?"
   ↓
7. User responds: "Freestyle" or "Popover"
   ↓
8. AI calls: detect_comment_placement
   ↓
9. AI shows detected files to user for confirmation
   ↓
10. AI calls: install_velt_freestyle (or install_velt_popover)
    ↓
11. Done (installs to user-specified locations)
```

---

## 🛠️ New Tools

### 1. `take_project_screenshot`

Captures a screenshot of the user's running Next.js application.

**Parameters:**
- `url` (optional): URL to screenshot (default: http://localhost:3000)
- `width` (optional): Viewport width (default: 1920)
- `height` (optional): Viewport height (default: 1080)
- `fullPage` (optional): Capture full page (default: false)

**Returns:**
- Image content (base64-encoded PNG)
- Screenshot metadata (URL, size)
- Instructions for next steps

**Requirements:**
- User must have dev server running (`npm run dev`)

**Example:**
```javascript
// AI agent calls this tool
{
  "tool": "take_project_screenshot",
  "arguments": {
    "url": "http://localhost:3000"
  }
}

// Returns screenshot + instructions
{
  "content": [
    {
      "type": "image",
      "data": "<base64-encoded-image>",
      "mimeType": "image/png"
    },
    {
      "type": "text",
      "text": "Screenshot captured. Ask user where to add comments."
    }
  ]
}
```

---

### 2. `detect_comment_placement`

Analyzes project structure to find best files for placing comments.

**Parameters:**
- `projectPath` (required): Path to Next.js project
- `commentType` (required): "freestyle" or "popover"
- `targetDescription` (optional): User's description (e.g., "header", "sidebar")
- `targetComponent` (optional): Specific component name

**Returns:**
- Ranked list of candidate files
- Implementation guidance for each file
- Confidence scores

**Example:**
```javascript
// AI agent calls this after getting user input
{
  "tool": "detect_comment_placement",
  "arguments": {
    "projectPath": "/path/to/project",
    "commentType": "freestyle",
    "targetDescription": "header"
  }
}

// Returns detection results
{
  "commentType": "freestyle",
  "targetDescription": "header",
  "placements": [
    {
      "file": "components/Header.tsx",
      "componentName": "Header",
      "reason": "Matches 'header' in filename",
      "confidence": 85,
      "implementationGuide": "To add Freestyle Comments..."
    },
    {
      "file": "components/Navbar.tsx",
      "componentName": "Navbar",
      "reason": "Contains navigation elements",
      "confidence": 70,
      "implementationGuide": "To add Freestyle Comments..."
    }
  ],
  "recommendedPlacement": {
    "file": "components/Header.tsx",
    "confidence": 85
  }
}
```

---

## 📋 How It Works (Technical)

### Screenshot Capture

Uses **Playwright** to capture screenshots:

```javascript
import { chromium } from 'playwright';

async function takeScreenshot(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const screenshot = await page.screenshot({ type: 'png' });
  const base64 = screenshot.toString('base64');
  return base64;
}
```

**MCP Image Content Format:**
```json
{
  "type": "image",
  "data": "<base64-encoded-png>",
  "mimeType": "image/png"
}
```

### File Detection Algorithm

1. **Scan Project Structure**: Search `app/` and `components/` directories
2. **Match Keywords**: Compare user's description to file/directory names
3. **Analyze Content**: Check for React components, exports, patterns
4. **Score Candidates**: Rank by relevance and confidence
5. **Return Top 5**: Provide implementation guidance for each

**Keyword Mapping:**
```javascript
{
  header: ['header', 'navbar', 'nav', 'topbar', 'menu'],
  sidebar: ['sidebar', 'drawer', 'aside', 'panel'],
  main: ['main', 'content', 'body', 'page'],
  card: ['card', 'item', 'post', 'article'],
  // ... more mappings
}
```

---

## 🎨 Usage Examples

### Example 1: Basic Interactive Installation

**User:** "Install Velt on my Next.js app"

**AI Agent:**
1. Calls `take_project_screenshot`
2. Shows screenshot to user
3. Asks: "Which part of this page should have comments?"

**User:** "The header at the top"

**AI Agent:**
4. Asks: "Would you like Freestyle comments (click anywhere) or Popover comments (attached to elements)?"

**User:** "Freestyle"

**AI Agent:**
5. Calls `detect_comment_placement` with:
   - `commentType: "freestyle"`
   - `targetDescription: "header"`
6. Shows results: "I found your Header component at components/Header.tsx"
7. Asks: "Should I install Velt comments here?"

**User:** "Yes"

**AI Agent:**
8. Calls `install_velt_freestyle` with project path
9. Reports success

---

### Example 2: Popover Comments on Specific Component

**User:** "Add popover comments to my product cards"

**AI Agent:**
1. Calls `take_project_screenshot`
2. Shows screenshot
3. Asks: "I see several components. Which one contains the product cards?"

**User:** "The grid of cards in the main area"

**AI Agent:**
4. Calls `detect_comment_placement` with:
   - `commentType: "popover"`
   - `targetDescription: "card grid main"`
5. Shows results: "Found ProductCard.tsx and ProductGrid.tsx"
6. Recommends: "ProductCard.tsx (85% confidence)"

**User:** "That's correct"

**AI Agent:**
7. Calls `install_velt_freestyle` (for now, popover orchestrator pending)
8. Reports success with implementation guidance

---

## 🔮 Future Enhancements

### Phase 1: Current Implementation ✅
- [x] Screenshot capture
- [x] File detection
- [x] Keyword matching
- [x] Basic implementation guidance

### Phase 2: Popover Orchestrator (Next)
- [ ] Create `install_velt_popover` tool
- [ ] Auto-add `data-velt-comment-target` attributes
- [ ] Wire VeltCommentTool components
- [ ] Validate popover integration

### Phase 3: Advanced Detection
- [ ] AST parsing for better file analysis
- [ ] Visual element detection from screenshot
- [ ] Match screenshot regions to code components
- [ ] Confidence scoring improvements

### Phase 4: Multi-Component Support
- [ ] Install comments on multiple components simultaneously
- [ ] Batch operations
- [ ] Rollback support

---

## 🧪 Testing

### Test the Screenshot Tool

```bash
# 1. Start your Next.js dev server
cd /path/to/your/nextjs/project
npm run dev

# 2. In Cursor/Claude Code, test the tool
> Use the take_project_screenshot tool to capture localhost:3000

# 3. Verify you see the screenshot image
```

### Test the Detection Tool

```bash
# In Cursor/Claude Code
> Use detect_comment_placement to find where to add freestyle comments for the header in /path/to/project

# Verify you see:
# - List of candidate files
# - Confidence scores
# - Implementation guides
```

### Test the Full Workflow

```bash
# In Cursor/Claude Code
> Install Velt on my Next.js app with interactive screenshot

# The AI should:
# 1. Take screenshot
# 2. Show it to you
# 3. Ask where to add comments
# 4. Detect files
# 5. Install Velt
```

---

## 📊 Architecture Changes

### New Files Added

```
src/
├── utils/
│   ├── screenshot.js         # NEW: Screenshot capture with Playwright
│   └── comment-detector.js   # NEW: File detection and ranking
└── index.js                   # UPDATED: Added new tool handlers
```

### Dependencies Added

```json
{
  "dependencies": {
    "playwright": "^1.48.0"  // NEW: For screenshot capture
  }
}
```

### Tool Registration

- `take_project_screenshot`: Captures screenshots
- `detect_comment_placement`: Detects file placements
- `install_velt_freestyle`: Existing installation tool (unchanged)

---

## 🔧 Configuration

### No additional configuration required!

The new tools work with the existing configuration:
- Uses existing `VELT_API_KEY` from .env
- Uses existing project path detection
- Compatible with existing Velt Docs MCP integration

---

## 🐛 Troubleshooting

### Screenshot fails with "Connection refused"

**Problem:** Dev server not running

**Solution:**
```bash
cd /path/to/your/project
npm run dev
```

### Screenshot shows blank page

**Problem:** Page hasn't loaded yet

**Solution:** Increase timeout in `screenshot.js`:
```javascript
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

### Detection finds wrong files

**Problem:** User description too generic

**Solution:** Ask user for more specific description:
- ❌ "Add comments to my page"
- ✅ "Add comments to the header navigation"

---

## 🎓 Best Practices

### For AI Agents

1. **Always take screenshot first** before asking user where to add comments
2. **Show screenshot to user** - don't just describe it
3. **Ask specific questions**: "Which part?" then "Freestyle or Popover?"
4. **Confirm detection results** with user before installing
5. **Provide implementation guidance** from detection results

### For Users

1. **Start dev server first** (`npm run dev`)
2. **Be specific** about where you want comments ("header" not "top")
3. **Review detected files** before confirming installation
4. **Test comments** after installation

---

## 📚 Related Documentation

- [MCP Screenshot Handling](https://modelcontextprotocol.io/docs) - How MCP handles images
- [Velt Freestyle Comments](https://docs.velt.dev/async-collaboration/comments/setup/freestyle)
- [Velt Popover Comments](https://docs.velt.dev/async-collaboration/comments/setup/popover)
- [Playwright Documentation](https://playwright.dev/docs/screenshots)

---

## 🤝 Contributing

Want to improve the interactive workflow?

1. **Enhance Detection**: Improve keyword matching, add AST parsing
2. **Visual Matching**: Match screenshot regions to code (computer vision)
3. **Popover Orchestrator**: Complete implementation for popover comments
4. **Multi-Language**: Support TypeScript, JavaScript detection improvements

---

**Built with ❤️ for the Velt community**

