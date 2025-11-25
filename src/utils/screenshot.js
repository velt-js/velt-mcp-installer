/**
 * Screenshot Utility
 *
 * Captures screenshots of running web applications using Playwright.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * Takes a screenshot of a running Next.js application
 *
 * @param {Object} options - Screenshot options
 * @param {string} options.url - URL to screenshot (default: http://localhost:3000)
 * @param {number} [options.width=1920] - Viewport width
 * @param {number} [options.height=1080] - Viewport height
 * @param {boolean} [options.fullPage=false] - Capture full page or just viewport
 * @returns {Promise<Object>} Screenshot result with base64 data
 */
export async function takeScreenshot(options = {}) {
  const {
    url = 'http://localhost:3000',
    width = 1920,
    height = 1080,
    fullPage = false,
  } = options;

  let browser = null;

  try {
    console.error(`📸 Taking screenshot of ${url}...`);

    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width, height },
    });

    const page = await context.newPage();

    // Navigate to the URL
    console.error(`   ⏳ Loading page...`);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for any animations/hydration
    await page.waitForTimeout(2000);

    console.error(`   📷 Capturing screenshot...`);

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: fullPage,
    });

    await browser.close();
    browser = null;

    // Convert to base64
    const base64Data = screenshotBuffer.toString('base64');

    console.error(`   ✅ Screenshot captured successfully (${Math.round(base64Data.length / 1024)}KB)`);

    return {
      success: true,
      data: {
        base64: base64Data,
        mimeType: 'image/png',
        width,
        height,
        url,
      },
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error(`   ❌ Failed to capture screenshot: ${error.message}`);

    // Check if it's a connection error
    if (error.message.includes('net::ERR_CONNECTION_REFUSED') ||
        error.message.includes('Navigation timeout')) {
      return {
        success: false,
        error: `Could not connect to ${url}. Please make sure your Next.js dev server is running (npm run dev).`,
        hint: 'Run "npm run dev" in your project directory first, then try again.',
      };
    }

    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

/**
 * Detects if a Next.js dev server is running
 *
 * @param {string} url - URL to check (default: http://localhost:3000)
 * @returns {Promise<Object>} Result indicating if server is running
 */
export async function checkDevServerRunning(url = 'http://localhost:3000') {
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, {
      timeout: 5000,
    });

    await browser.close();

    return {
      success: true,
      running: true,
      url,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    return {
      success: true,
      running: false,
      url,
      message: `Dev server not detected at ${url}`,
    };
  }
}

export default {
  takeScreenshot,
  checkDevServerRunning,
};
