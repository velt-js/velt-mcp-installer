#!/usr/bin/env node

/**
 * Test script to test ONLY the integration step
 * Skips CLI execution and goes directly to testing integration.js logic
 */

import { analyzeAndIntegrate } from './src/utils/integration.js';
import path from 'path';

const testProjectPath = '/Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/test';

console.log('==========================================');
console.log('Velt Integration Test (integration.js only)');
console.log('==========================================');
console.log(`Target project: ${testProjectPath}`);
console.log('');

async function runTest() {
  try {
    console.log('Testing integration.js directly...\n');

    // Call integration script directly with config
    const result = await analyzeAndIntegrate({
      projectPath: testProjectPath,
      config: {
        apiKey: 'TEST_API_KEY_12345',
        authToken: 'TEST_AUTH_TOKEN_67890',
      },
      patterns: {
        hasReactFlow: true,
        hasTiptap: false,
        hasCodeMirror: false,
        hasAgGrid: false,
        hasTanStack: false,
      },
    });

    console.log('\n==========================================');
    console.log('Integration Result');
    console.log('==========================================\n');

    console.log('Success:', result.success);
    console.log('');

    if (result.data.filesModified && result.data.filesModified.length > 0) {
      console.log('Files Modified:');
      console.log('---------------');
      for (const file of result.data.filesModified) {
        console.log(`  ✏️  ${file}`);
      }
      console.log('');
    } else {
      console.log('⚠️  No files were modified\n');
    }

    if (result.data.componentsAdded && result.data.componentsAdded.length > 0) {
      console.log('Components Added:');
      console.log('-----------------');
      for (const comp of result.data.componentsAdded) {
        console.log(`  ➕ ${comp.name} in ${comp.file}`);
        if (comp.description) {
          console.log(`     ${comp.description}`);
        }
      }
      console.log('');
    }

    if (result.data.integrationPoints && result.data.integrationPoints.length > 0) {
      console.log('Integration Points:');
      console.log('-------------------');
      for (const point of result.data.integrationPoints) {
        console.log(`  📍 ${point.type} in ${point.file}`);
        console.log(`     ${point.description}`);
        if (point.placeholder) {
          console.log(`     Replaced: "${point.placeholder}"`);
        }
      }
      console.log('');
    }

    if (result.data.validationIssues && result.data.validationIssues.length > 0) {
      console.log('Validation Issues:');
      console.log('------------------');
      for (const issue of result.data.validationIssues) {
        const fileInfo = issue.file ? ` in ${issue.file}` : '';
        console.log(`  ❌ [${issue.type}]${fileInfo}`);
        console.log(`     ${issue.message}`);
      }
      console.log('');
    } else {
      console.log('✅ No validation issues\n');
    }

    console.log('\n==========================================');
    if (result.success) {
      console.log('✅ Integration Successful!');
      console.log('==========================================\n');

      // Show summary of what was done
      console.log('Summary:');
      console.log('--------');
      console.log(`  Files Modified: ${result.data.filesModified?.length || 0}`);
      console.log(`  Components Added: ${result.data.componentsAdded?.length || 0}`);
      console.log(`  Integration Points: ${result.data.integrationPoints?.length || 0}`);
      console.log(`  Validation Issues: ${result.data.validationIssues?.length || 0}`);
      console.log('');

      process.exit(0);
    } else {
      console.log('❌ Integration Failed');
      console.log('==========================================\n');
      console.log(`Found ${result.data.validationIssues?.length || 0} validation issue(s)\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test script error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runTest();
