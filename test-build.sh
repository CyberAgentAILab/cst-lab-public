#!/bin/bash
cd /home/b920405/Documents/CA/git/cst

echo "Current directory:"
pwd

echo -e "\nChecking node version:"
node --version

echo -e "\nChecking npm version:"
npm --version

echo -e "\nChecking TypeScript files:"
find src -name "*.ts" -o -name "*.tsx" | sort

echo -e "\nChecking if node_modules exists:"
if [ -d "node_modules" ]; then
    echo "node_modules directory exists"
else
    echo "node_modules directory not found"
fi

echo -e "\nTrying to compile TypeScript:"
npx tsc --version

echo -e "\nAttempting build:"
npm run build 2>&1