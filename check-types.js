#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  console.log('Running TypeScript compilation check...');
  const result = execSync('npx tsc --noEmit --project tsconfig.app.json', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('TypeScript compilation successful!');
  console.log(result);
} catch (error) {
  console.log('TypeScript compilation errors:');
  console.log(error.stdout);
  console.log(error.stderr);
}