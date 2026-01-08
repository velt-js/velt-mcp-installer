#!/usr/bin/env node
/**
 * Test script for the unified installer
 *
 * Usage:
 *   node test-installer.js cli-only    # Test CLI-only (SKIP) mode
 *   node test-installer.js guided      # Test guided mode (plan stage)
 */

import { installVeltUnified } from './src/tools/unified-installer.js';

const TEST_PROJECT = '/Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/new-test';

// Test credentials (use your real ones for actual testing)
const TEST_API_KEY = 'test-api-key-12345678';
const TEST_AUTH_TOKEN = 'test-auth-token-12345678';

async function testCliOnlyMode() {
  console.log('\n========================================');
  console.log('  Testing CLI-Only Mode (SKIP)');
  console.log('========================================\n');

  const result = await installVeltUnified({
    projectPath: TEST_PROJECT,
    apiKey: TEST_API_KEY,
    authToken: TEST_AUTH_TOKEN,
    mode: 'cli-only',
  });

  console.log('\n--- Result ---');
  console.log('Status:', result.status);
  console.log('Mode:', result.mode);

  if (result.validation) {
    console.log('Validation:', result.validation.score);
  }

  if (result.report) {
    console.log('\n--- Report Preview (first 500 chars) ---');
    console.log(result.report.substring(0, 500) + '...');
  }

  return result;
}

async function testGuidedPlanMode() {
  console.log('\n========================================');
  console.log('  Testing Guided Mode (Plan Stage)');
  console.log('========================================\n');

  const result = await installVeltUnified({
    projectPath: TEST_PROJECT,
    apiKey: TEST_API_KEY,
    authToken: TEST_AUTH_TOKEN,
    mode: 'guided',
    stage: 'plan',
    features: ['comments', 'presence'],
    commentType: 'freestyle',
    headerPosition: 'top-right',
    veltProviderLocation: 'app/layout.tsx',
  });

  console.log('\n--- Result ---');
  console.log('Status:', result.status);
  console.log('Mode:', result.mode);
  console.log('Stage:', result.stage);

  if (result.plan) {
    console.log('\n--- Plan Preview (first 1000 chars) ---');
    console.log(result.plan.substring(0, 1000) + '...');
  }

  return result;
}

async function testGuidedApplyMode() {
  console.log('\n========================================');
  console.log('  Testing Guided Mode (Apply Stage)');
  console.log('========================================\n');

  const result = await installVeltUnified({
    projectPath: TEST_PROJECT,
    apiKey: TEST_API_KEY,
    authToken: TEST_AUTH_TOKEN,
    mode: 'guided',
    stage: 'apply',
    approved: true,
    features: ['comments', 'presence'],
    commentType: 'freestyle',
  });

  console.log('\n--- Result ---');
  console.log('Status:', result.status);
  console.log('Mode:', result.mode);
  console.log('Stage:', result.stage);
  console.log('Message:', result.message);

  if (result.validation) {
    console.log('Validation:', result.validation.score);
    result.validation.checks.forEach(c => {
      console.log(`  ${c.status === 'pass' ? '✅' : '❌'} ${c.name}`);
    });
  }

  return result;
}

// Main
const mode = process.argv[2] || 'cli-only';

console.log(`\n🧪 Velt Unified Installer Test`);
console.log(`📁 Project: ${TEST_PROJECT}`);
console.log(`🎯 Mode: ${mode}\n`);

try {
  if (mode === 'cli-only') {
    await testCliOnlyMode();
  } else if (mode === 'guided' || mode === 'plan') {
    await testGuidedPlanMode();
  } else if (mode === 'apply') {
    await testGuidedApplyMode();
  } else {
    console.log('Usage: node test-installer.js [cli-only|guided|apply]');
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
}
