const { spawn } = require('child_process');
const path = require('path');

// Change to the project directory
process.chdir('/home/b920405/Documents/CA/git/cst');

console.log('Current directory:', process.cwd());

// Run npm run build
const build = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

build.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);
  process.exit(code);
});

build.on('error', (err) => {
  console.error('Failed to start build process:', err);
  process.exit(1);
});