#!/bin/bash

# Navigate to project directory
cd "/home/b920405/Documents/CA/git/cst"

echo "=== Build Verification Script ==="
echo "Project Directory: $(pwd)"
echo

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
else
    echo "✅ package.json found"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found, running npm install..."
    npm install
else
    echo "✅ node_modules directory exists"
fi

# Check TypeScript files
echo
echo "TypeScript files in src/:"
find src -name "*.ts" -o -name "*.tsx" | sort

# Check for TypeScript compilation errors
echo
echo "Checking TypeScript compilation..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Try building the project
echo
echo "Running build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "Build output:"
    ls -la dist/ 2>/dev/null || echo "No dist/ directory found"
else
    echo "❌ Build failed"
    exit 1
fi

echo
echo "=== Build verification complete ==="