/**
 * DairySphere Enterprise Test Execution Runner
 * Automatically loads all test modules, runs them in sequence, and generates professional console reports.
 */

import { runAllSuites, SuiteResult } from './framework';

// Import all registered test suites to load them into the registry
import './integration/auth.test';
import './integration/api.test';
import './e2e/workflows.test';
import './e2e/performance.test';

async function main() {
  console.log('\n======================================================');
  console.log('   DAIRYSPHERE SAAS ENTERPRISE QUALITY ASSURANCE ENGINE');
  console.log('======================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('Target Scale: initial deployment - 500 businesses\n');

  const start = Date.now();
  const results: SuiteResult[] = await runAllSuites();
  const duration = Date.now() - start;

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('------------------------------------------------------');
  console.log('                  EXECUTION REPORTS                  ');
  console.log('------------------------------------------------------\n');

  for (const suite of results) {
    console.log(`● ${suite.name}`);
    for (const test of suite.tests) {
      totalTests++;
      if (test.passed) {
        totalPassed++;
        console.log(`  ✓ ${test.name} (${test.duration}ms)`);
      } else {
        totalFailed++;
        console.log(`  ✗ ${test.name} (${test.duration}ms)`);
        console.log(`    Error: ${test.error?.message}\n`);
        if (test.error?.stack) {
          // Highlight first 3 lines of stack trace
          const stackLines = test.error.stack.split('\n').slice(1, 4).join('\n');
          console.log(`    Stack:\n${stackLines}\n`);
        }
      }
    }
    console.log('');
  }

  console.log('======================================================');
  console.log('                  METRIC SUMMARIES                   ');
  console.log('======================================================');
  console.log(`Total Suites Run: ${results.length}`);
  console.log(`Total Tests Run:  ${totalTests}`);
  console.log(`Passed Assertions: \x1b[32m${totalPassed}\x1b[0m`);
  if (totalFailed > 0) {
    console.log(`Failed Assertions: \x1b[31m${totalFailed}\x1b[0m`);
  } else {
    console.log('Failed Assertions: \x1b[32m0\x1b[0m');
  }
  console.log(`Total Time Taken:  ${(duration / 1000).toFixed(2)}s\n`);

  if (totalFailed > 0) {
    console.log('\x1b[41m\x1b[37m FAILURE \x1b[0m Audit failed. Some end-to-end or integration tests did not pass verification.\n');
    process.exit(1);
  } else {
    console.log('\x1b[42m\x1b[30m SUCCESS \x1b[0m Platform certified! Clean sweep. Ready for production release.\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\x1b[31mUnhandled exception during test execution:\x1b[0m', err);
  process.exit(1);
});
