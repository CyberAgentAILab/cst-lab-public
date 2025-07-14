const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = '/home/b920405/Documents/CA/git/cst';

// Change to project directory
process.chdir(projectDir);

console.log('=== Manual Build and Deploy Script ===');
console.log('Project Directory:', process.cwd());

// Function to run a command and return a promise
function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`\nRunning: ${command} ${args.join(' ')}`);
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            cwd: projectDir
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${command} completed successfully`);
                resolve();
            } else {
                console.log(`❌ ${command} failed with code ${code}`);
                reject(new Error(`Command failed with code ${code}`));
            }
        });
        
        child.on('error', (err) => {
            console.error(`❌ Error starting ${command}:`, err);
            reject(err);
        });
    });
}

// Main deployment process
async function deploy() {
    try {
        console.log('\n1. Checking project structure...');
        
        // Check if key files exist
        const requiredFiles = ['package.json', 'src/App.tsx', 'vite.config.ts'];
        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(projectDir, file))) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
        console.log('✅ Project structure verified');
        
        console.log('\n2. Running build...');
        await runCommand('npm', ['run', 'build']);
        
        console.log('\n3. Verifying build output...');
        const distDir = path.join(projectDir, 'dist');
        if (!fs.existsSync(distDir)) {
            throw new Error('Build failed - dist directory not found');
        }
        
        const indexFile = path.join(distDir, 'index.html');
        if (!fs.existsSync(indexFile)) {
            throw new Error('Build failed - index.html not found in dist');
        }
        console.log('✅ Build output verified');
        
        console.log('\n4. Running deployment...');
        await runCommand('npx', ['gh-pages', '-d', 'dist']);
        
        console.log('\n✅ Deployment completed successfully!');
        console.log('Your site should be available at: https://your-username.github.io/cst/');
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run the deployment
deploy();