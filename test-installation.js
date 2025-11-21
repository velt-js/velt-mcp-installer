#!/usr/bin/env node

/**
 * Test script to simulate MCP client calling the installation orchestrator
 * This bypasses the MCP protocol and calls the orchestrator directly
 */

import { installVeltFreestyle } from './src/tools/orchestrator.js';
import path from 'path';

const testProjectPath = '/Users/yoenzhang/Downloads/sample-apps/apps/react/velt-automation/test/test/test';

console.log('==========================================');
console.log('Velt Installation Test');
console.log('==========================================');
console.log(`Target project: ${testProjectPath}`);
console.log('');

async function runTest() {
  try {
    console.log('Starting installation...\n');

    // Call orchestrator directly (simulating MCP tool call)
    const result = await installVeltFreestyle({
      projectPath: testProjectPath,
      server: null, // No server needed for testing with config file
    });

    console.log('\n==========================================');
    console.log('Installation Report');
    console.log('==========================================\n');

    console.log('Status:', result.status);
    console.log('Start Time:', result.startTime);
    console.log('End Time:', result.endTime);
    console.log('');

    console.log('Steps:');
    console.log('------');
    for (const step of result.steps) {
      const statusIcon = step.status === 'complete' ? '✅' :
                        step.status === 'failed' ? '❌' :
                        '⏳';
      console.log(`${statusIcon} Step ${step.step}: ${step.name}`);
      console.log(`   Status: ${step.status}`);
      console.log(`   Description: ${step.description}`);

      if (step.result) {
        console.log(`   Result:`, JSON.stringify(step.result, null, 2).split('\n').map((line, i) => i === 0 ? line : '          ' + line).join('\n'));
      }

      if (step.error) {
        console.log(`   ❌ Error: ${step.error}`);
      }

      if (step.message) {
        console.log(`   ${step.message}`);
      }

      console.log('');
    }

    if (result.errors && result.errors.length > 0) {
      console.log('Errors:');
      console.log('-------');
      for (const error of result.errors) {
        console.log('❌', error.message);
        console.log('   Failed at step:', error.failedAtStep);
        if (error.stack) {
          console.log('   Stack trace:', error.stack.split('\n').slice(0, 3).join('\n   '));
        }
        console.log('');
      }
    }

    if (result.summary) {
      console.log('Summary:');
      console.log('--------');
      console.log(result.summary);
      console.log('');
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
    }

    console.log('\n==========================================');
    console.log(result.status === 'success' ? '✅ Installation Complete!' : '❌ Installation Failed');
    console.log('==========================================\n');

    process.exit(result.status === 'success' ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test script error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runTest();
